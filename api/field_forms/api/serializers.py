from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from field_forms.models import FieldForm, Question
from field_forms.translation import get_language_from_request, resolve_translation
from project.models import Project

class QuestionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_help', 'answer_type', 'mandatory', 'order', 'choices', 'allow_other']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        lang = get_language_from_request(request)

        data['question_text'] = resolve_translation(data.get('question_text'), lang)
        data['question_help'] = resolve_translation(data.get('question_help'), lang) or None

        # Resolve choice labels
        choices = data.get('choices')
        request = self.context.get('request')
        raw = request and request.query_params.get('raw') == 'true'
        if isinstance(choices, list):
            resolved = []
            for choice in choices:
                if isinstance(choice, dict) and isinstance(choice.get('label'), dict):
                    label = choice['label'] if raw else resolve_translation(choice['label'], lang)
                    resolved.append({**choice, 'label': label})
                else:
                    resolved.append(choice)
            data['choices'] = resolved

        return data

    def validate(self, data):
        # Si el tipo es CHOICE, el campo choices debe estar presente y no vacío
        if data.get('answer_type') in ('CHOICE', 'MCHOICE'):
            choices = data.get('choices')
            if not choices:
                raise serializers.ValidationError({
                    'choices': 'El campo choices es obligatorio cuando answer_type es CHOICE'
                })
            if not isinstance(choices, list) or len(choices) == 0:
                raise serializers.ValidationError({
                    'choices': 'El campo choices debe ser un array con al menos una opción'
                })
            
            # Si choices es un array de strings, convertirlo a objetos con value y label
            normalized_choices = []
            for choice in choices:
                if isinstance(choice, str):
                    # Generar value automáticamente: lowercase, sin espacios ni caracteres especiales
                    value = choice.lower().replace(' ', '_')
                    # Remover caracteres especiales excepto _ y -
                    value = ''.join(c for c in value if c.isalnum() or c in ['_', '-'])
                    normalized_choices.append({
                        'value': value,
                        'label': {'default': choice}
                    })
                elif isinstance(choice, dict):
                    # Ya tiene value y label, mantenerlo
                    if 'value' not in choice or 'label' not in choice:
                        raise serializers.ValidationError({
                            'choices': 'Cada opción debe tener "value" y "label", o ser un string simple'
                        })
                    normalized_choices.append(choice)
                else:
                    raise serializers.ValidationError({
                        'choices': 'Cada opción debe ser un string o un objeto con "value" y "label"'
                    })
            
            # Validar que no haya values duplicados
            values = [c['value'] for c in normalized_choices]
            if len(values) != len(set(values)):
                duplicates = [v for v in set(values) if values.count(v) > 1]
                raise serializers.ValidationError({
                    'choices': f'Los siguientes values están duplicados: {duplicates}'
                })

            # Actualizar choices con la versión normalizada
            data['choices'] = normalized_choices
            
        allow_other = data.get('allow_other', False)
        if allow_other and data.get('answer_type') not in ('CHOICE', 'MCHOICE'):
            raise serializers.ValidationError({
                'allow_other': 'allow_other solo aplica a preguntas de tipo CHOICE o MCHOICE.'
            })

        return data


class FieldFormSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all(), required=False)

    class Meta:
        model = FieldForm
        fields = ['id', 'project', 'questions']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        field_form = FieldForm.objects.create(**validated_data)
        for question_data in questions_data:
            Question.objects.create(field_form=field_form, **question_data)
        return field_form

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions')
        instance.project = validated_data.get('project', instance.project)
        instance.save()

        current_question_ids = [q.id for q in instance.questions.all()]
        incoming_question_ids = [q.get('id') for q in questions_data if 'id' in q]

        # Delete questions that are not in the incoming data
        for question_id in current_question_ids:
            if question_id not in incoming_question_ids:
                Question.objects.get(id=question_id).delete()

        has_observations = instance.observations.exists()

        # Create or update questions
        for question_data in questions_data:
            question_id = question_data.get('id', None)
            if question_id in current_question_ids:
                # The question already exists, update it
                question = Question.objects.get(id=question_id)
                if has_observations and 'answer_type' in question_data and question_data['answer_type'] != question.answer_type:
                    raise serializers.ValidationError({
                        'answer_type': f'No se puede cambiar el tipo de la pregunta "{question.question_text}" porque el formulario ya tiene observaciones.'
                    })
                question.question_text = question_data.get('question_text', question.question_text)
                question.question_help = question_data.get('question_help', question.question_help)
                question.answer_type = question_data.get('answer_type', question.answer_type)
                question.mandatory = question_data.get('mandatory', question.mandatory)
                question.order = question_data.get('order', question.order)
                question.choices = question_data.get('choices', question.choices)
                question.allow_other = question_data.get('allow_other', question.allow_other)
                question.save()
            else:
                # The question does not exist, create it
                Question.objects.create(field_form=instance, **question_data)

        return instance
