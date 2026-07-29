from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from markers.models import (
    Observation,
    ObservationImage,
    ObservationAudio,
    ProjectObservationField,
    ObservationFieldValue,
    ObservationEmailLog,
)
from field_forms.models import FieldForm

import logging
logger = logging.getLogger('geonity')

class DataFieldSerializer(serializers.JSONField):
    def to_internal_value(self, data):
        data = super().to_internal_value(data)

        # Asegurar que los datos tienen la estructura correcta
        if not isinstance(data, list):
            raise serializers.ValidationError("La estructura de datos no es una lista.")
        elif not all(['key' in item and 'value' in item for item in data]):
            raise serializers.ValidationError("La estructura de datos no tiene las claves 'key' y 'value'.")
        
        field_form = self.context.get("field_form", None)
        if not field_form:
            raise serializers.ValidationError("No se pudo encontrar la FieldForm relacionada.")
        
        # Convertir data a un diccionario para facilitar la validación de las preguntas que no son imágenes
        data_dict = {item["key"]: item["value"] for item in data}

        # Acceder al contexto para obtener los IDs de las preguntas que son imágenes o audio
        image_question_ids = self.context.get('image_question_ids', [])
        audio_question_ids = self.context.get('audio_question_ids', [])

        # Acceder al contexto para verificar si es una creación o actualización
        observation_instance = self.context.get('instance', None)

        # Si es una creación, se realiza la validación completa
        if observation_instance is None:
            # Validar que se hayan respondido todas las preguntas obligatorias
            mandatory_questions = field_form.questions.filter(mandatory=True)
            for question in mandatory_questions:
                if question.answer_type in ["IMAGE", "IMG"]:
                    if str(question.id) not in image_question_ids:
                        raise serializers.ValidationError(f"La pregunta {question} es obligatoria y no ha sido respondida.")
                elif question.answer_type == "AUDIO":
                    if str(question.id) not in audio_question_ids:
                        raise serializers.ValidationError(f"La pregunta {question} es obligatoria y no ha sido respondida.")
                else:
                    if str(question.id) not in data_dict:
                        raise serializers.ValidationError(f"La pregunta {question} es obligatoria y no ha sido respondida.")
        
        # Precargar todas las preguntas del field_form de una sola vez para evitar N+1
        questions_cache = {str(q.pk): q for q in field_form.questions.all()}

        # Validar los datos en función del tipo de respuesta
        for key, value in data_dict.items():
            if str(key).endswith('_is_other') or str(key).endswith('_other_text'):
                continue
            question_obj = questions_cache.get(str(key))
            if question_obj is None:
                raise serializers.ValidationError(f"No existe una pregunta con id {key} en este formulario de campo.")
            if question_obj.answer_type == "DATE":
                try:
                    serializers.DateField().to_internal_value(value)
                except serializers.ValidationError:
                    raise serializers.ValidationError(f"La respuesta para la pregunta {question_obj} debe ser una fecha válida.")
            elif question_obj.answer_type == "NUMBER" or question_obj.answer_type == "NUM":
                try:
                    serializers.DecimalField(max_digits=20, decimal_places=5).to_internal_value(value)
                except serializers.ValidationError:
                    raise serializers.ValidationError(f"La respuesta para la pregunta {question_obj} debe ser un número válido.")
            elif question_obj.answer_type == "STRING" or question_obj.answer_type == "STR" or question_obj.answer_type == "QR":
                try:
                    serializers.CharField().to_internal_value(value)
                except serializers.ValidationError:
                    raise serializers.ValidationError(f"La respuesta para la pregunta {question_obj} debe ser un string válida.")
            elif question_obj.answer_type == "CHOICE":
                if not question_obj.choices:
                    raise serializers.ValidationError(f"La pregunta {question_obj} no tiene opciones definidas.")
                valid_values = [
                    c['value'] if isinstance(c, dict) and 'value' in c else c
                    for c in question_obj.choices
                ]
                if not question_obj.allow_other and value not in valid_values:
                    raise serializers.ValidationError(f"La respuesta '{value}' para la pregunta {question_obj} no es una opción válida. Opciones: {valid_values}")
            elif question_obj.answer_type == "MCHOICE":
                if not question_obj.choices:
                    raise serializers.ValidationError(f"La pregunta {question_obj} no tiene opciones definidas.")
                valid_values = [
                    c['value'] if isinstance(c, dict) and 'value' in c else c
                    for c in question_obj.choices
                ]
                if not isinstance(value, list) or len(value) == 0:
                    raise serializers.ValidationError(
                        f"La respuesta para la pregunta {question_obj} debe ser una lista con al menos una opción."
                    )
                if not question_obj.allow_other:
                    for v in value:
                        if v not in valid_values:
                            raise serializers.ValidationError(
                                f"La respuesta '{v}' para la pregunta {question_obj} no es una opción válida. Opciones: {valid_values}"
                            )
                else:
                    # Con allow_other: máximo un valor fuera de choices (el "other")
                    other_values = [v for v in value if v not in valid_values]
                    if len(other_values) > 1:
                        raise serializers.ValidationError(
                            f"Solo se permite un valor personalizado ('other') en la pregunta {question_obj}."
                        )
            elif question_obj.answer_type in ("IMAGE", "IMG", "AUDIO"):
                # La validación se realizará en la vista
                pass
            else:
                raise serializers.ValidationError(f"Tipo de respuesta no válido: {question_obj.answer_type}")
        return data
    
class ObservationImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(max_length=None, use_url=True)

    class Meta:
        model = ObservationImage
        fields = ['id', 'image', 'question']


class ObservationAudioSerializer(serializers.ModelSerializer):
    audio = serializers.FileField(max_length=None, use_url=True)

    class Meta:
        model = ObservationAudio
        fields = ['id', 'audio', 'question']

class ObservationGeoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    lat = serializers.SerializerMethodField()
    lon = serializers.SerializerMethodField()

    def get_lat(self, obj):
        return obj['geoposition'].y  # estándar: .y = lat

    def get_lon(self, obj):
        return obj['geoposition'].x  # estándar: .x = lon


class ObservationSerializer(serializers.ModelSerializer):
    data = DataFieldSerializer()
    images = ObservationImageSerializer(many=True, read_only=True)
    audios = ObservationAudioSerializer(many=True, read_only=True)
    email_count = serializers.SerializerMethodField()
    has_observation_email = serializers.SerializerMethodField()
    has_plain_email = serializers.SerializerMethodField()

    class Meta:
        model = Observation
        fields = ['id', 'creator', 'field_form', 'timestamp', 'geoposition', 'data', 'platform', 'created_at', 'updated_at', 'images', 'audios', 'email_count', 'has_observation_email', 'has_plain_email']

    def get_email_count(self, obj):
        # Una sola pasada sobre el caché de prefetch (email_logs se prefetchea en ObservationByFieldFormList)
        count = 0
        has_obs = False
        has_plain = False
        for log in obj.email_logs.all():
            if log.status == 'sent':
                count += 1
                if log.include_observation_data:
                    has_obs = True
                else:
                    has_plain = True
        # Guardar en caché para los otros métodos
        obj._email_stats = (count, has_obs, has_plain)
        return count

    def get_has_observation_email(self, obj):
        if not hasattr(obj, '_email_stats'):
            self.get_email_count(obj)
        return obj._email_stats[1]

    def get_has_plain_email(self, obj):
        if not hasattr(obj, '_email_stats'):
            self.get_email_count(obj)
        return obj._email_stats[2]


class ProjectObservationFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectObservationField
        fields = ['id', 'project', 'key', 'label', 'field_type', 'required', 'choices', 'order', 'help_text', 'public', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'project']

    def validate(self, attrs):
        field_type = attrs.get('field_type', getattr(self.instance, 'field_type', None))
        choices = attrs.get('choices', getattr(self.instance, 'choices', None))

        if field_type in (ProjectObservationField.TYPE_CHOICE, ProjectObservationField.TYPE_MULTICHOICE):
            if not choices or not isinstance(choices, list) or not all(isinstance(c, str) for c in choices):
                raise serializers.ValidationError({'choices': f'choices debe ser una lista de strings cuando field_type={field_type}.'})
        else:
            # Para tipos no-choice, choices debe ser null/omitido
            if choices not in (None, [], '') and 'choices' in attrs:
                raise serializers.ValidationError({'choices': _('choices solo aplica cuando field_type=choice o field_type=mchoice.')})

        return attrs


class ObservationFieldValueSerializer(serializers.ModelSerializer):
    field = serializers.PrimaryKeyRelatedField(queryset=ProjectObservationField.objects.all())

    class Meta:
        model = ObservationFieldValue
        fields = ['id', 'observation', 'field', 'value', 'updated_by', 'updated_at']
        read_only_fields = ['id', 'updated_by', 'updated_at', 'observation']


class ObservationAdminFieldsUpdateSerializer(serializers.Serializer):
    values = serializers.DictField(child=serializers.JSONField(allow_null=True), required=True)


class SendObservationEmailSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    body = serializers.CharField(required=False, allow_blank=True, default='')
    include_observation_data = serializers.BooleanField(default=False)
    allow_reply = serializers.BooleanField(default=False)
    intro_text = serializers.CharField(required=False, allow_blank=True, default='')


class MyObservationSerializer(ObservationSerializer):
    project_id = serializers.IntegerField(source='field_form.project.id', read_only=True)
    project_name = serializers.JSONField(source='field_form.project.name', read_only=True)

    class Meta(ObservationSerializer.Meta):
        fields = ObservationSerializer.Meta.fields + ['project_id', 'project_name']


class ObservationWithPublicAdminSerializer(ObservationSerializer):
    admin_values = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta(ObservationSerializer.Meta):
        fields = ObservationSerializer.Meta.fields + ['admin_values', 'is_mine']

    def get_admin_values(self, obj):
        values = getattr(obj, 'public_admin_values', [])
        return [{'key': v.field.key, 'label': v.field.label, 'value': v.value} for v in values]

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.creator_id == request.user.id


class ObservationEmailLogSerializer(serializers.ModelSerializer):
    sent_by_username = serializers.CharField(source='sent_by.username', read_only=True)

    class Meta:
        model = ObservationEmailLog
        fields = ['id', 'observation', 'sent_by', 'sent_by_username', 'subject', 'body',
                  'include_observation_data', 'allow_reply', 'status', 'error', 'created_at', 'sent_at']
        read_only_fields = fields