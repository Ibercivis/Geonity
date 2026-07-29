from django.db import models
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from project.models import Project, Topic, HasTag, ProjectCover, ProjectInvitation, ProjectMembership
from organizations.models import Organization
from organizations.api.serializers import OrganizationSerializer
from field_forms.models import FieldForm, Question
from field_forms.api.serializers import FieldFormSerializer, QuestionSerializer

import json
from field_forms.translation import get_language_from_request, resolve_translation, ISO_3166_1_ALPHA2


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['id', 'username']
        extra_kwargs = {'password': {'write_only': True, 'required': True}}

class UserWithEmailSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class OrganizationSummarySerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(use_url=True, read_only=True)

    class Meta:
        model = Organization
        fields = ['id', 'principalName', 'logo']

class TopicsSerializer(serializers.ModelSerializer):
    project_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Topic
        fields = ['id', 'topic', 'project_count']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        lang = get_language_from_request(request)
        data['topic'] = resolve_translation(data.get('topic'), lang)
        return data

class HasTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = HasTag
        fields = '__all__'

class ProjectCoverSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = ProjectCover
        fields = ['image']

class ProjectSerializerCreateUpdate(serializers.ModelSerializer):
    hasTag = serializers.PrimaryKeyRelatedField(
        queryset=HasTag.objects.all(),
        many=True,
        required=False)
    topic = serializers.PrimaryKeyRelatedField(
        queryset=Topic.objects.all(),
        many=True,
        required=False)
    cover = serializers.ImageField(required=False, write_only=True)
    organizations = OrganizationSummarySerializer(many=True, read_only=True)
    organizations_write = serializers.PrimaryKeyRelatedField(
        source='organizations',
        queryset=Organization.objects.all(),
        many=True,
        required=False,
        write_only=True
    )
    creator = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False)
    administrators = serializers.PrimaryKeyRelatedField(
        many=True,
        read_only=True)
    contributions = serializers.IntegerField(read_only=True)
    total_likes = serializers.IntegerField(read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()
    is_creator = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    has_observations = serializers.SerializerMethodField()
    last_observation = serializers.SerializerMethodField()
    is_private = serializers.BooleanField(required=False, default=False)
    raw_password = serializers.CharField(write_only=True, required=False, allow_blank=True, source="password")  # Usamos un campo virtual para la contraseña en texto plano.

    #NUEVALINEA (Si funciona la creación simultánea de Field_forms y Questions, borramos el comentario)
    field_form = serializers.JSONField(required=False, write_only=True)


    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'post_observation_message', 'email_intro', 'email_subject', 'created_at', 'updated_at', 'topic', 'hasTag', 'cover', 'contributions', 'total_likes', 'is_liked_by_user', 'is_creator', 'is_admin', 'is_member', 'has_observations', 'last_observation', 'organizations', 'organizations_write', 'creator', 'administrators', 'is_private', 'raw_password', 'field_form', 'fuzzy', 'private_data', 'countries', 'is_global', 'ended', 'allowed_platforms', 'email_on_observation', 'draft', 'public_map', 'show_post_message']

    def validate(self, data):
        # En creación (no hay instancia), name, description, cover y field_form son obligatorios
        if not self.instance:
            if not data.get('name', '').strip():
                raise serializers.ValidationError({'name': _('El nombre del proyecto es obligatorio.')})

            description = data.get('description')
            if not description or (isinstance(description, dict) and not any(v for v in description.values())):
                raise serializers.ValidationError({'description': _('La descripción del proyecto es obligatoria.')})

            if not data.get('cover'):
                raise serializers.ValidationError({'cover': _('La imagen de portada es obligatoria.')})

            field_form = data.get('field_form')
            if not field_form:
                raise serializers.ValidationError({'field_form': _('El formulario de campo es obligatorio.')})
            if isinstance(field_form, dict) and not field_form.get('questions'):
                raise serializers.ValidationError({'field_form': _('El formulario debe tener al menos una pregunta.')})

        if self.instance and data.get('field_form'):
            field_form_data = data['field_form']
            if isinstance(field_form_data, dict):
                try:
                    field_form = self.instance.fieldform
                    has_observations = field_form.observations.exists()
                except Exception:
                    has_observations = False

                if has_observations:
                    existing_ids = set(field_form.questions.values_list('id', flat=True))
                    incoming_ids = {q.get('id') for q in field_form_data.get('questions', []) if q.get('id')}
                    deleted_ids = existing_ids - incoming_ids
                    if deleted_ids:
                        raise serializers.ValidationError({
                            'field_form': [_('No se pueden eliminar preguntas porque el formulario ya tiene observaciones.')]
                        })

                    IMMUTABLE_FIELDS = {'answer_type', 'choices', 'allow_other'}
                    errors = []
                    for question_data in field_form_data.get('questions', []):
                        question_id = question_data.get('id')
                        if not question_id:
                            continue
                        try:
                            question = Question.objects.get(id=question_id, field_form=field_form)
                        except Question.DoesNotExist:
                            continue
                        changed = [
                            f for f in IMMUTABLE_FIELDS
                            if f in question_data and question_data[f] != getattr(question, f)
                        ]
                        if changed:
                            errors.append(
                                _('La pregunta %(id)s ya tiene respuestas: no se puede cambiar %(fields)s.')
                                % {'id': question_id, 'fields': ', '.join(changed)}
                            )
                    if errors:
                        raise serializers.ValidationError({'field_form': errors})

        if data.get('draft') is False and self.instance:
            try:
                obs_count = self.instance.fieldform.observations.count()
            except Exception:
                obs_count = 0
            if obs_count <= 10:
                raise serializers.ValidationError({
                    'draft': _('El proyecto necesita más de 10 observaciones para ser publicado. Actualmente tiene %(count)s.') % {'count': obs_count}
                })

        if data.get("is_private") and not data.get("password"):
            raise serializers.ValidationError({'non_field_errors': _('Debe proporcionar una contraseña si el proyecto es privado.')})

        countries = data.get('countries', [])
        if countries:
            invalid = [c for c in countries if not isinstance(c, str) or c.upper() not in ISO_3166_1_ALPHA2]
            if invalid:
                raise serializers.ValidationError({'countries': _('Códigos de país no válidos: %(codes)s. Se esperan códigos ISO 3166-1 alpha-2.') % {'codes': invalid}})

        return data

    def get_is_liked_by_user(self, obj):
        user = self.context.get('user')
        if user and user.is_authenticated:
            return obj.likes.filter(id=user.id).exists()
        return False

    def get_is_creator(self, obj):
        user = self.context.get('user')
        if user and user.is_authenticated:
            return obj.creator_id == user.id
        return False

    def get_is_admin(self, obj):
        user = self.context.get('user')
        if user and user.is_authenticated:
            return obj.administrators.filter(id=user.id).exists()
        return False

    def get_is_member(self, obj):
        user = self.context.get('user')
        if user and user.is_authenticated:
            return ProjectMembership.objects.filter(project=obj, user=user).exists()
        return False

    def get_has_observations(self, obj):
        try:
            return obj.fieldform.observations.exists()
        except Exception:
            return False

    def get_last_observation(self, obj):
        return obj.last_observation

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Handle language translation
        request = self.context.get('request')
        lang = get_language_from_request(request)
        representation['name'] = resolve_translation(representation.get('name'), lang)
        representation['description'] = resolve_translation(representation.get('description'), lang)
        if representation.get('post_observation_message'):
            representation['post_observation_message'] = resolve_translation(representation.get('post_observation_message'), lang)

        # Replace write-only cover field with actual cover data
        representation['cover'] = ProjectCoverSerializer(instance.covers.all(), many=True, context=self.context).data

        # Verificar si el usuario es creador o administrador
        # Usa el caché de prefetch si administrators fue prefetcheado
        user = self.context.get('user')
        is_creator_or_admin = False
        if user and user.is_authenticated:
            admins = list(instance.administrators.all())
            is_creator_or_admin = (instance.creator_id == user.id or
                                   any(a.id == user.id for a in admins))

        # Solo devolver username si es creador o admin
        if is_creator_or_admin:
            representation['creator'] = UserSerializer(instance.creator).data
            representation['administrators'] = UserSerializer(instance.administrators.all(), many=True).data
        else:
            # Devolver solo IDs
            representation['creator'] = instance.creator_id
            representation['administrators'] = [admin.id for admin in instance.administrators.all()]

        # Incluir solo el ID del field_form en lectura
        try:
            representation['field_form'] = instance.fieldform.id
        except Exception:
            representation['field_form'] = None

        return representation

    def _create_question(self, field_form, question_data):
        question_data = dict(question_data)
        Question.objects.create(field_form=field_form, **question_data)

    def create(self, validated_data, *args, **kwargs):
        hasTag = validated_data.pop('hasTag', [])
        topic = validated_data.pop('topic', [])
        organizations_write = validated_data.pop('organizations', [])
        cover_file = validated_data.pop('cover', None)
        field_form_data = validated_data.pop('field_form', None)
        is_private = validated_data.pop('is_private', False)
        password = validated_data.pop('password', None)

        if 'creator' not in validated_data:
            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                validated_data['creator'] = request.user

        project = Project.objects.create(**validated_data)
        project.hasTag.set(hasTag)
        project.topic.set(topic)
        project.organizations.set(organizations_write)

        if cover_file:
            ProjectCover.objects.create(project=project, image=cover_file)

        if password:
            project.is_private = is_private
            project.password = password
            project.save()

        if field_form_data:
            if isinstance(field_form_data, str):
                try:
                    field_form_data = json.loads(field_form_data)
                except json.JSONDecodeError:
                    raise serializers.ValidationError({'field_form': [_('Datos JSON inválidos.')]})
            field_form = FieldForm.objects.create(project=project)
            for question_data in field_form_data.get('questions', []):
                self._create_question(field_form, question_data)

        return project


    def update(self, instance, validated_data):
        user = self.context['request'].user
        has_tag_sent = 'hasTag' in validated_data
        topic_sent = 'topic' in validated_data
        new_hasTag = validated_data.pop('hasTag', [])
        new_topic = validated_data.pop('topic', [])
        creator = validated_data.pop('creator', None)
        organizations_write = validated_data.pop('organizations', [])
        cover_file = self.context['request'].FILES.get('cover')
        field_form_data = validated_data.pop('field_form', None)
        password = validated_data.pop('password', None)
        is_private = validated_data.pop('is_private', instance.is_private)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if has_tag_sent:
            instance.hasTag.set(new_hasTag)
        if topic_sent:
            instance.topic.set(new_topic)
        if creator:
            if user == instance.creator:
                instance.creator = creator
            else:
                raise serializers.ValidationError(_("Solo el creador puede cambiar el campo 'creator'."))
        if organizations_write:
            instance.organizations.set(organizations_write)
        if cover_file:
            instance.covers.all().delete()
            ProjectCover.objects.create(project=instance, image=cover_file)
        instance.is_private = is_private
        if password:
            instance.password = password

        if field_form_data is not None:
            if isinstance(field_form_data, str):
                try:
                    field_form_data = json.loads(field_form_data)
                except json.JSONDecodeError:
                    raise serializers.ValidationError({'field_form': [_('Datos JSON inválidos.')]})

            try:
                field_form = instance.fieldform
            except FieldForm.DoesNotExist:
                field_form = FieldForm.objects.create(project=instance)

            has_observations = field_form.observations.exists()
            incoming_questions = field_form_data.get('questions', [])
            kept_ids = set()

            for question_data in incoming_questions:
                question_data = dict(question_data)
                question_id = question_data.pop('id', None)

                if question_id:
                    try:
                        question = Question.objects.get(id=question_id, field_form=field_form)
                        if has_observations:
                            # Con respuestas: solo se puede cambiar el texto y la ayuda
                            if 'question_text' in question_data:
                                question.question_text = question_data['question_text']
                            if 'question_help' in question_data:
                                question.question_help = question_data['question_help']
                        else:
                            for attr, value in question_data.items():
                                setattr(question, attr, value)
                        question.save()
                        kept_ids.add(question.id)
                    except Question.DoesNotExist:
                        pass
                else:
                    # Nueva pregunta
                    new_question = Question.objects.create(field_form=field_form, **question_data)
                    kept_ids.add(new_question.id)

            # Sin observaciones: eliminar preguntas que no vienen en la lista
            import logging; logging.getLogger('geonity').warning(
                f'[field_form update] field_form={field_form.id} | '
                f'incoming_ids={[q.get("id") for q in field_form_data.get("questions", [])]} | '
                f'kept_ids={kept_ids} | has_observations={has_observations}'
            )
            if not has_observations:
                field_form.questions.exclude(id__in=kept_ids).delete()

        instance.save()
        return instance


class ProjectListSerializer(serializers.ModelSerializer):
    hasTag = HasTagSerializer(many=True, read_only=True)
    topic = TopicsSerializer(many=True, read_only=True)
    organizations = OrganizationSummarySerializer(many=True, read_only=True)
    contributions = serializers.IntegerField(read_only=True)
    total_likes = serializers.IntegerField(read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()
    is_creator = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    has_observations = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_at', 'updated_at', 'topic', 'hasTag', 'contributions', 'total_likes', 'is_liked_by_user', 'is_creator', 'is_admin', 'is_member', 'has_observations', 'organizations', 'creator', 'administrators', 'is_private', 'fuzzy', 'private_data', 'countries', 'is_global', 'ended', 'allowed_platforms', 'draft', 'public_map', 'show_post_message', 'last_observation']

    def get_is_liked_by_user(self, obj):
        user = self.context.get('user')
        if user and user.is_authenticated:
            return obj.likes.filter(id=user.id).exists()
        return False

    def get_is_creator(self, obj):
        user = self.context.get('user')
        if user and user.is_authenticated:
            return obj.creator_id == user.id
        return False

    def get_is_admin(self, obj):
        user = self.context.get('user')
        if user and user.is_authenticated:
            return obj.administrators.filter(id=user.id).exists()
        return False

    def get_is_member(self, obj):
        user = self.context.get('user')
        if user and user.is_authenticated:
            return ProjectMembership.objects.filter(project=obj, user=user).exists()
        return False

    def get_has_observations(self, obj):
        try:
            return obj.fieldform.observations.exists()
        except Exception:
            return False

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        lang = get_language_from_request(request)
        data['name'] = resolve_translation(data.get('name'), lang)
        data['description'] = resolve_translation(data.get('description'), lang)

        data['cover'] = ProjectCoverSerializer(instance.covers.all(), many=True, context=self.context).data

        # TODO: N+1 — una query por proyecto. Ver TODO equivalente en ProjectSerializerCreateUpdate.
        user = self.context.get('user')
        is_creator_or_admin = False
        if user and user.is_authenticated:
            admins = list(instance.administrators.all())
            is_creator_or_admin = (instance.creator_id == user.id or
                                   any(a.id == user.id for a in admins))

        # TODO: N+1 — una query por proyecto. Ver TODO equivalente en ProjectSerializerCreateUpdate.
        if is_creator_or_admin:
            data['creator'] = UserSerializer(instance.creator).data
            data['administrators'] = UserSerializer(instance.administrators.all(), many=True).data
        else:
            data['creator'] = instance.creator_id
            data['administrators'] = [admin.id for admin in instance.administrators.all()]

        return data


class ProjectSerializer(serializers.ModelSerializer):
    hasTag = HasTagSerializer(many=True)
    topic = TopicsSerializer(many=True)
    organizations = OrganizationSerializer(many=True)
    contributions = serializers.IntegerField(source='contributions', read_only=True)
    total_likes = serializers.IntegerField(source='total_likes', read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_at', 'updated_at', 'topic', 'hasTag', 'contributions', 'total_likes', 'organizations', 'creator', 'administrators']


class ProjectAdminSerializer(ProjectSerializerCreateUpdate):
    """
    Igual que ProjectSerializerCreateUpdate pero devuelve el email
    de creator y administradores. Solo usar en endpoints restringidos
    a creadores/admins (RGPD).
    """
    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Sobreescribir creator y administrators con email incluido
        representation['creator'] = UserWithEmailSerializer(instance.creator).data
        representation['administrators'] = UserWithEmailSerializer(instance.administrators.all(), many=True).data

        return representation


class ProjectInvitationSerializer(serializers.ModelSerializer):
    project_name = serializers.SerializerMethodField()
    project_id = serializers.SerializerMethodField()
    invited_by_name = serializers.SerializerMethodField()

    def get_project_name(self, obj):
        return obj.project.name

    def get_project_id(self, obj):
        return obj.project.id

    def get_invited_by_name(self, obj):
        return obj.invited_by.get_full_name() or obj.invited_by.username

    class Meta:
        model = ProjectInvitation
        fields = ['id', 'project', 'project_name', 'project_id', 'email', 'status', 'invited_by', 'invited_by_name', 'created_at', 'expires_at']
        read_only_fields = ['status', 'invited_by', 'created_at', 'expires_at']


class ProjectInvitationCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
