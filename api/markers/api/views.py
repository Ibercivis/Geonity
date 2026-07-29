import json, csv, io
import django_rq
from django.utils.translation import gettext as _
from django.conf import settings
from django.urls import reverse
from django.http import HttpResponse
from django.contrib.gis.geos import Point
from django.shortcuts import get_object_or_404
from rest_framework.views import View
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotAuthenticated
from django.core.exceptions import ValidationError
from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Prefetch
from markers.models import Observation, ObservationImage, ObservationAudio, ProjectObservationField, ObservationFieldValue, ObservationEmailLog
from markers.api.permissions import HasClientApiKey
from markers.api.serializers import (
    ObservationSerializer,
    ObservationGeoSerializer,
    MyObservationSerializer,
    ObservationWithPublicAdminSerializer,
    ProjectObservationFieldSerializer,
    ObservationAdminFieldsUpdateSerializer,
    SendObservationEmailSerializer,
    ObservationEmailLogSerializer,
)
from field_forms.models import FieldForm, Question
from field_forms.translation import get_language_from_request, resolve_translation
from project.models import Project, ProjectMembership

import h3
import logging
logger = logging.getLogger('geonity')


def _is_project_admin(user, project):
    if not user or not user.is_authenticated:
        return False
    if getattr(project, 'creator_id', None) == user.id:
        return True
    return project.administrators.filter(id=user.id).exists()


def _is_project_member(user, project):
    """Creator, admin, o usuario que ha validado la contraseña del proyecto privado."""
    if not user or not user.is_authenticated:
        return False
    if _is_project_admin(user, project):
        return True
    return ProjectMembership.objects.filter(project=project, user=user).exists()


def _require_project_admin(request, project):
    if not _is_project_admin(request.user, project):
        raise PermissionDenied(_('No tienes permisos de administración en este proyecto.'))


def _require_project_creator(request, project):
    if not request.user or not request.user.is_authenticated or project.creator_id != request.user.id:
        raise PermissionDenied(_('Solo el creador del proyecto puede gestionar estos campos.'))

class ObservationListCreate(generics.ListCreateAPIView):
    queryset = Observation.objects.all()
    serializer_class = ObservationSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), HasClientApiKey()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):

        field_form_id = request.data.get("field_form", None)
        if not field_form_id:
            return Response({"error": "No se proporcionó el formulario de campo."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            field_form = FieldForm.objects.get(pk=field_form_id)
        except FieldForm.DoesNotExist:
            return Response({"error": f"No existe un formulario de campo con id {field_form_id}."}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar membresía si el proyecto es privado
        project = field_form.project
        if project.ended:
            return Response({"error": _("Este proyecto ha finalizado y ya no acepta observaciones.")}, status=status.HTTP_403_FORBIDDEN)

        client_platform = getattr(request, 'client_platform', None)
        allowed = project.allowed_platforms
        if allowed != 'all' and client_platform != allowed:
            return Response(
                {"error": f"This project only accepts observations from {allowed}."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if project.is_private and not _is_project_member(request.user, project):
            raise PermissionDenied(_('Debes ser miembro del proyecto para enviar observaciones.'))

        data = request.data.get("data", [])

        # Intentar parsear data a una lista si es una cadena de texto
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                return Response({"error": "La propiedad 'data' debería ser una lista JSON válida."}, status=status.HTTP_400_BAD_REQUEST)

        for item in data:
            if "key" not in item or "value" not in item:
                return Response({"error": "Cada ítem en 'data' debe contener un 'key' y un 'value'."}, status=status.HTTP_400_BAD_REQUEST)

        # Convertir data a un diccionario para facilitar la validación
        data_dict = {item["key"]: item["value"] for item in data}

        # Asegurar que todas las claves en data_dict se corresponden con ids de Pregunta en el FieldForm
        for question_id in data_dict.keys():
            if str(question_id).endswith('_is_other') or str(question_id).endswith('_other_text'):
                continue
            if not field_form.questions.filter(pk=question_id).exists():
                return Response({"error": f"No existe una pregunta con id {question_id} en este formulario de campo."}, status=status.HTTP_400_BAD_REQUEST)

        timestamp = request.data.get("timestamp", None)
        geoposition = request.data.get("geoposition", None)

        # Almacena la pregunta y la imagen/audio sin crear instancias aún
        image_files = []
        image_question_ids = []
        audio_files = []
        audio_question_ids = []
        for field_name, file in request.FILES.items():
            if field_name.startswith('audio_'):
                raw_id = field_name[len('audio_'):]
                try:
                    question = field_form.questions.get(pk=int(raw_id))
                    if question.answer_type != Question.AUDIO:
                        return Response({"error": f"La pregunta {raw_id} no es del tipo 'Audio'."}, status=status.HTTP_400_BAD_REQUEST)
                    audio_files.append((question, file))
                    audio_question_ids.append(str(question.id))
                except (Question.DoesNotExist, ValueError):
                    return Response({"error": f"No existe una pregunta con id {raw_id} en este formulario de campo."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Acepta tanto "401" como "image_401"
                raw_id = field_name[len('image_'):] if field_name.startswith('image_') else field_name
                try:
                    question = field_form.questions.get(pk=int(raw_id))
                    if question.answer_type != Question.IMAGE:
                        return Response({"error": f"La pregunta {raw_id} no es del tipo 'Imagen'."}, status=status.HTTP_400_BAD_REQUEST)
                    image_files.append((question, file))
                    image_question_ids.append(str(question.id))
                except (Question.DoesNotExist, ValueError):
                    return Response({"error": f"No existe una pregunta con id {raw_id} en este formulario de campo."}, status=status.HTTP_400_BAD_REQUEST)

        # Crear un diccionario de datos con los campos necesarios
        observation_data = {
            'creator': request.user.id,
            'field_form': field_form.id,
            'timestamp': timestamp,
            'geoposition': geoposition,
            'data': data,
            'platform': getattr(request, 'client_platform', None),
        }

        # Crear el serializador con los datos y el contexto
        serializer = ObservationSerializer(data=observation_data, context={"field_form": field_form, "image_question_ids": image_question_ids, "audio_question_ids": audio_question_ids})
        if serializer.is_valid(raise_exception=True):
            # Guardar la observación si es válida
            observation = serializer.save()

            try:
                if field_form.project.email_on_observation:
                    queue = django_rq.get_queue('citisciapi')
                    queue.enqueue('markers.tasks.notify_admins_new_observation', observation.id, get_language_from_request(request))
            except Exception as e:
                logger.warning(f'Could not enqueue observation notification for observation {observation.id}: {e}')

            # Ahora que la observación ha sido creada, creamos, validamos y guardamos imágenes y audios
            for question, image in image_files:
                img = ObservationImage(observation=observation, image=image, question=question)
                try:
                    img.full_clean()
                    img.save()
                except ValidationError as e:
                    return Response({"error": f"Error al guardar la imagen para la pregunta {question.id}: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            for question, audio in audio_files:
                aud = ObservationAudio(observation=observation, audio=audio, question=question)
                try:
                    aud.full_clean()
                    aud.save()
                except ValidationError as e:
                    return Response({"error": f"Error al guardar el audio para la pregunta {question.id}: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            # Devolver 201 con la observación creada
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ObservationRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ObservationWithPublicAdminSerializer

    def get_queryset(self):
        return Observation.objects.prefetch_related(
            'images',
            'audios',
            Prefetch(
                'admin_field_values',
                queryset=ObservationFieldValue.objects.filter(field__public=True).select_related('field'),
                to_attr='public_admin_values',
            ),
        )
    parser_classes = (MultiPartParser, FormParser)

    def delete(self, request, *args, **kwargs):
        observation = self.get_object()
        if observation.creator != request.user:
            return Response({"error": "No tienes permiso para eliminar esta observación."}, status=status.HTTP_403_FORBIDDEN)

        observation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def update(self, request, *args, **kwargs):

        observation = self.get_object()
        if observation.creator != request.user:
            return Response({"error": "No tienes permiso para actualizar esta observación."}, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener el field_form_id y el objeto FieldForm
        field_form_id = request.data.get("field_form", None)
        if not field_form_id:
            return Response({"error": "No se proporcionó el formulario de campo."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            field_form = FieldForm.objects.get(pk=field_form_id)
        except FieldForm.DoesNotExist:
            return Response({"error": f"No existe un formulario de campo con id {field_form_id}."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener data y validarla
        data = request.data.get("data", [])

        # Intentar parsear data a una lista si es una cadena de texto
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                return Response({"error": "La propiedad 'data' debería ser una lista JSON válida."}, status=status.HTTP_400_BAD_REQUEST)

        for item in data:
            if "key" not in item or "value" not in item:
                return Response({"error": "Cada ítem en 'data' debe contener un 'key' y un 'value'."}, status=status.HTTP_400_BAD_REQUEST)

        # Convertir data a un diccionario para facilitar la validación
        data_dict = {item["key"]: item["value"] for item in data}

        # Asegurar que todas las claves en data_dict se corresponden con ids de Pregunta en el FieldForm
        for question_id in data_dict.keys():
            if str(question_id).endswith('_is_other') or str(question_id).endswith('_other_text'):
                continue
            if not field_form.questions.filter(pk=question_id).exists():
                return Response({"error": f"No existe una pregunta con id {question_id} en este formulario de campo."}, status=status.HTTP_400_BAD_REQUEST)

        # Manejar imágenes y audios:
        # 1. Si ya existe un fichero para la pregunta y se envía uno nuevo, reemplazarlo.
        # 2. Si no se envía fichero para una pregunta que ya tenía uno, conservarlo.
        image_files = []
        image_question_ids = []
        audio_files = []
        audio_question_ids = []
        for field_name, file in request.FILES.items():
            if field_name.startswith('audio_'):
                raw_id = field_name[len('audio_'):]
                try:
                    question = field_form.questions.get(pk=int(raw_id))
                    if question.answer_type != Question.AUDIO:
                        return Response({"error": f"La pregunta {raw_id} no es del tipo 'Audio'."}, status=status.HTTP_400_BAD_REQUEST)
                    existing = ObservationAudio.objects.filter(observation=observation, question=question).first()
                    if existing:
                        existing.audio.delete()
                        existing.delete()
                    audio_files.append((question, file))
                    audio_question_ids.append(str(question.id))
                except (Question.DoesNotExist, ValueError):
                    return Response({"error": f"No existe una pregunta con id {raw_id} en este formulario de campo."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                raw_id = field_name[len('image_'):] if field_name.startswith('image_') else field_name
                try:
                    question = field_form.questions.get(pk=int(raw_id))
                    if question.answer_type != Question.IMAGE:
                        return Response({"error": f"La pregunta {raw_id} no es del tipo 'Imagen'."}, status=status.HTTP_400_BAD_REQUEST)
                    existing_image = ObservationImage.objects.filter(observation=observation, question=question).first()
                    if existing_image:
                        existing_image.image.delete()
                        existing_image.delete()
                    image_files.append((question, file))
                    image_question_ids.append(str(question.id))
                except (Question.DoesNotExist, ValueError):
                    return Response({"error": f"No existe una pregunta con id {raw_id} en este formulario de campo."}, status=status.HTTP_400_BAD_REQUEST)

        # Actualizar la observación
        serializer = self.get_serializer(observation, data=request.data, context={"field_form": field_form, "image_question_ids": image_question_ids, "audio_question_ids": audio_question_ids, "instance": observation})
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Guardar los nuevos ficheros
        for question, image in image_files:
            img = ObservationImage(observation=observation, image=image, question=question)
            try:
                img.full_clean()
                img.save()
            except ValidationError as e:
                return Response({"error": f"Error al guardar la imagen para la pregunta {question.id}: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        for question, audio in audio_files:
            aud = ObservationAudio(observation=observation, audio=audio, question=question)
            try:
                aud.full_clean()
                aud.save()
            except ValidationError as e:
                return Response({"error": f"Error al guardar el audio para la pregunta {question.id}: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        if getattr(observation, '_prefetched_objects_cache', None):
            # Si se realiza 'prefetch_related()', debemos borrar el caché prefetch
            # para que las instancias cargadas previamente sean revalorizadas.
            observation._prefetched_objects_cache = {}

        return Response(serializer.data)

class MyObservationsView(generics.ListAPIView):
    serializer_class = MyObservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Observation.objects.filter(
            creator=self.request.user
        ).select_related('field_form__project').prefetch_related('images', 'audios').order_by('-created_at')


class MyObservationsByFieldFormView(generics.ListAPIView):
    serializer_class = MyObservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        field_form_id = self.kwargs['field_form_id']
        return Observation.objects.filter(
            field_form__id=field_form_id,
            creator=self.request.user
        ).select_related('field_form__project').prefetch_related('images', 'audios').order_by('-created_at')


class ObservationByFieldFormList(generics.ListAPIView):
    serializer_class = ObservationWithPublicAdminSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        field_form_id = self.kwargs['field_form_id']
        return Observation.objects.filter(field_form__id=field_form_id).prefetch_related(
            'email_logs',
            'images',
            'audios',
            Prefetch(
                'admin_field_values',
                queryset=ObservationFieldValue.objects.filter(field__public=True).select_related('field'),
                to_attr='public_admin_values',
            ),
        )

    def list(self, request, *args, **kwargs):
        field_form = get_object_or_404(FieldForm, pk=self.kwargs['field_form_id'])
        project = field_form.project

        if project.is_private:
            if not request.user.is_authenticated:
                raise NotAuthenticated()
            if not _is_project_member(request.user, project):
                raise PermissionDenied(_('Debes ser miembro del proyecto para acceder a los datos.'))

        if project.fuzzy and not _is_project_admin(request.user, project):
            raise PermissionDenied(_('Este proyecto usa localización aproximada. Las coordenadas exactas no están disponibles.'))

        response = super().list(request, *args, **kwargs)
        return response


class ObservationMapView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, field_form_id):
        from django.core.cache import cache

        field_form = get_object_or_404(FieldForm, pk=field_form_id)
        project = field_form.project

        if project.is_private:
            if not request.user.is_authenticated:
                raise NotAuthenticated()
            if not _is_project_member(request.user, project):
                raise PermissionDenied(_('Debes ser miembro del proyecto para acceder a los datos.'))

        if project.fuzzy and not _is_project_admin(request.user, project):
            raise PermissionDenied(_('Este proyecto usa localización aproximada. Las coordenadas exactas no están disponibles.'))

        cache_key = f'observations_map_{field_form_id}'
        cached = cache.get(cache_key)
        if cached is not None:
            return HttpResponse(cached, content_type='application/json')

        points = Observation.objects.filter(field_form=field_form).values('id', 'geoposition')
        data = ObservationGeoSerializer(points, many=True).data
        json_data = json.dumps(list(data))
        cache.set(cache_key, json_data)
        return HttpResponse(json_data, content_type='application/json')


class ProjectObservationFieldListCreate(generics.ListCreateAPIView):
    serializer_class = ProjectObservationFieldSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        get_object_or_404(Project, pk=project_id)
        return ProjectObservationField.objects.filter(project_id=project_id)

    def perform_create(self, serializer):
        project = get_object_or_404(Project, pk=self.kwargs['project_id'])
        _require_project_creator(self.request, project)
        serializer.save(project=project)


class ProjectObservationFieldRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectObservationFieldSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        project_id = self.kwargs['project_id']
        get_object_or_404(Project, pk=project_id)
        return ProjectObservationField.objects.filter(project_id=project_id)

    def perform_update(self, serializer):
        project = serializer.instance.project
        _require_project_creator(self.request, project)
        serializer.save()

    def perform_destroy(self, instance):
        _require_project_creator(self.request, instance.project)
        instance.delete()


class ObservationAdminFieldsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ObservationAdminFieldsUpdateSerializer

    def _get_observation(self):
        return get_object_or_404(
            Observation.objects.select_related('field_form', 'field_form__project'),
            pk=self.kwargs['observation_id'],
        )

    def get(self, request, *args, **kwargs):
        observation = self._get_observation()
        project = observation.field_form.project
        _require_project_admin(request, project)

        fields = ProjectObservationField.objects.filter(project=project).order_by('order', 'id')
        values = ObservationFieldValue.objects.filter(observation=observation, field__in=fields).select_related('field')
        values_by_field_id = {v.field_id: v for v in values}

        payload_fields = []
        for field in fields:
            value_obj = values_by_field_id.get(field.id)
            payload_fields.append({
                'id': field.id,
                'key': field.key,
                'label': field.label,
                'field_type': field.field_type,
                'required': field.required,
                'choices': field.choices,
                'order': field.order,
                'help_text': field.help_text,
                'value': value_obj.value if value_obj else None,
            })

        return Response({
            'observation_id': observation.id,
            'project_id': project.id,
            'fields': payload_fields,
        })

    def patch(self, request, *args, **kwargs):
        observation = self._get_observation()
        project = observation.field_form.project
        _require_project_admin(request, project)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        incoming = serializer.validated_data['values']

        fields = ProjectObservationField.objects.filter(project=project)
        fields_by_key = {f.key: f for f in fields}

        def validate_value(field, value):
            if value is None:
                return
            if field.field_type == ProjectObservationField.TYPE_BOOL:
                if not isinstance(value, bool):
                    raise ValidationError(f"{field.key} debe ser boolean.")
            elif field.field_type == ProjectObservationField.TYPE_TEXT:
                if not isinstance(value, str):
                    raise ValidationError(f"{field.key} debe ser string.")
            elif field.field_type == ProjectObservationField.TYPE_NUMBER:
                if not isinstance(value, (int, float)):
                    raise ValidationError(f"{field.key} debe ser número.")
            elif field.field_type == ProjectObservationField.TYPE_DATE:
                # Validación simple ISO (YYYY-MM-DD)
                serializers.DateField().to_internal_value(value)
            elif field.field_type == ProjectObservationField.TYPE_CHOICE:
                if not isinstance(value, str):
                    raise ValidationError(f"{field.key} debe ser string (choice).")
                if not field.choices or value not in field.choices:
                    raise ValidationError(f"{field.key} debe ser una de: {field.choices}")
            elif field.field_type == ProjectObservationField.TYPE_MULTICHOICE:
                if not isinstance(value, list) or len(value) == 0:
                    raise ValidationError(f"{field.key} debe ser una lista con al menos una opción.")
                if not field.choices:
                    raise ValidationError(f"{field.key} no tiene opciones definidas.")
                for v in value:
                    if v not in field.choices:
                        raise ValidationError(f"{field.key}: '{v}' no es una opción válida. Opciones: {field.choices}")
            else:
                raise ValidationError(f"Tipo no soportado para {field.key}.")

        updated_keys = []
        last_updated_at = None
        for key, value in incoming.items():
            field = fields_by_key.get(key)
            if field is None:
                return Response({'error': f"Campo desconocido: {key}"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                validate_value(field, value)
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            value_obj, _created = ObservationFieldValue.objects.get_or_create(
                observation=observation,
                field=field,
                defaults={'updated_by': request.user},
            )
            value_obj.value = value
            value_obj.updated_by = request.user
            value_obj.save()
            updated_keys.append(key)
            last_updated_at = value_obj.updated_at

        return Response({'updated': updated_keys, 'updated_at': last_updated_at, 'updated_by': request.user.email})


class ProjectObservationAdminValuesView(generics.GenericAPIView):
    """
    Devuelve en una sola llamada:
    - Definiciones de campos administrativos del proyecto.
    - Lista de observaciones del proyecto con valores (por key).

    Nota: requiere ser creator/administrador del proyecto, ya que expone valores administrativos.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        project_id = self.kwargs['project_id']
        project = get_object_or_404(Project, pk=project_id)
        _require_project_admin(request, project)

        fields = list(ProjectObservationField.objects.filter(project=project).order_by('order', 'id'))

        observations = list(
            Observation.objects.filter(field_form__project_id=project_id)
            .select_related('field_form', 'creator')
            .order_by('id')
        )

        obs_ids = [o.id for o in observations]
        values_qs = (
            ObservationFieldValue.objects.filter(observation_id__in=obs_ids, field__in=fields)
            .select_related('field', 'updated_by')
        )

        # observation_id -> { field_key: {value, updated_at, updated_by} }
        values_by_observation_id = {}
        for v in values_qs:
            values_by_observation_id.setdefault(v.observation_id, {})[v.field.key] = {
                'value': v.value,
                'updated_at': v.updated_at,
                'updated_by': v.updated_by.email if v.updated_by else None,
            }

        payload_fields = [
            {
                'id': f.id,
                'key': f.key,
                'label': f.label,
                'field_type': f.field_type,
                'required': f.required,
                'choices': f.choices,
                'order': f.order,
                'help_text': f.help_text,
            }
            for f in fields
        ]

        field_keys = [f.key for f in fields]
        payload_observations = []
        for o in observations:
            existing = values_by_observation_id.get(o.id, {})
            payload_observations.append(
                {
                    'observation_id': o.id,
                    'field_form_id': getattr(o.field_form, 'id', None),
                    'creator_id': getattr(o.creator, 'id', None),
                    'timestamp': o.timestamp,
                    'values': {k: existing.get(k) for k in field_keys},
                }
            )

        return Response(
            {
                'project_id': project.id,
                'fields': payload_fields,
                'observations': payload_observations,
            }
        )

class ObservationHexView(generics.GenericAPIView):
    """
    GET /field_form/{field_form_id}/observations/hex/

    Devuelve un GeoJSON FeatureCollection agrupando las observaciones del
    field_form en celdas H3. Requiere que el proyecto tenga fuzzy=True.
    Cada Feature incluye:
      - geometry.type: "Point" (centroide de la celda)
      - properties.hex_polygon: lista de 6 vértices [lon, lat]
      - properties.count: número de observaciones en la celda
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, field_form_id, *args, **kwargs):
        from django.core.cache import cache

        field_form = get_object_or_404(FieldForm, pk=field_form_id)
        project = field_form.project

        if project.is_private:
            if not request.user.is_authenticated:
                raise NotAuthenticated()
            if not _is_project_member(request.user, project):
                raise PermissionDenied(_('Debes ser miembro del proyecto para acceder a los datos.'))

        if not project.fuzzy:
            return Response(
                {"error": "Este proyecto no tiene activado el modo fuzzy."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ZOOM_TO_RESOLUTION = {
            range(0, 3): 1,
            range(3, 5): 2,
            range(5, 7): 3,
            range(7, 9): 4,
            range(9, 11): 5,
            range(11, 100): 6,
        }
        try:
            zoom = int(request.query_params.get('zoom', 11))
        except (ValueError, TypeError):
            zoom = 11
        resolution = next((res for r, res in ZOOM_TO_RESOLUTION.items() if zoom in r), 6)

        cache_key = f'observations_hex_{field_form_id}_{resolution}'
        cached = cache.get(cache_key)
        if cached is not None:
            return HttpResponse(cached, content_type='application/json')

        # TODO: migrar a la extensión h3 de PostgreSQL (https://github.com/zachasme/h3-pg)
        # En lugar de traer todas las geometrías a Python y agrupar en memoria, hacer:
        #   SELECT h3_lat_lng_to_cell(geoposition, <resolution>) AS cell, COUNT(*) AS count
        #   FROM markers_observation WHERE field_form_id = <id>
        #   GROUP BY cell
        # Esto evita transferir N filas a Python y reduce la respuesta a solo las celdas ocupadas.
        # Requiere instalar la extensión en Postgres: CREATE EXTENSION h3;
        cells = {}
        for geopos in Observation.objects.filter(field_form=field_form).values_list('geoposition', flat=True).iterator():
            cell = h3.geo_to_h3(geopos.y, geopos.x, resolution)
            cells[cell] = cells.get(cell, 0) + 1

        features = []
        for cell, count in cells.items():
            centroid = h3.h3_to_geo(cell)          # (lat, lon)
            boundary = h3.h3_to_geo_boundary(cell) # lista de (lat, lon)
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [centroid[1], centroid[0]],
                },
                "properties": {
                    "count": count,
                    "hex_polygon": [[v[1], v[0]] for v in boundary],
                },
            })

        json_data = json.dumps({"type": "FeatureCollection", "features": features})
        cache.set(cache_key, json_data)
        return HttpResponse(json_data, content_type='application/json')


class DownloadObservationsCSV(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        project_id = self.kwargs.get("project_id")
        project = get_object_or_404(Project, pk=project_id)

        if project.is_private and not _is_project_admin(request.user, project):
            raise PermissionDenied(_('Solo el creador y los administradores pueden descargar datos de un proyecto privado.'))

        if project.private_data and not _is_project_admin(request.user, project):
            raise PermissionDenied(_('Solo el creador y los administradores pueden descargar datos privados.'))

        if project.fuzzy and not _is_project_admin(request.user, project):
            raise PermissionDenied(_('Solo el creador y los administradores pueden descargar datos de un proyecto con posición difusa.'))

        fmt = request.GET.get('file_format', 'csv').lower()
        if fmt not in ('csv', 'xlsx', 'ods'):
            fmt = 'csv'

        observations = Observation.objects.filter(field_form__project__id=project_id).select_related('field_form').prefetch_related('field_form__questions', 'images__question', 'audios__question')

        question_ids = observations.values_list('field_form__questions', flat=True).distinct()
        questions = Question.objects.filter(id__in=question_ids)

        lang = get_language_from_request(request)
        header = ['ID', 'Timestamp', 'Latitude', 'Longitude'] + [
            resolve_translation(question.question_text, lang) for question in questions
        ]

        rows = []
        for observation in observations:
            formatted_timestamp = observation.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            row = [observation.id, formatted_timestamp]

            geoposition = observation.geoposition
            if isinstance(geoposition, Point):
                row.extend([geoposition.y, geoposition.x])
            else:
                row.extend(['', ''])

            data_dict = {}
            for item in observation.data:
                key_str = str(item['key'])
                if key_str.endswith('_is_other') or key_str.endswith('_other_text'):
                    continue
                try:
                    data_dict[int(item['key'])] = item['value']
                except (ValueError, TypeError):
                    data_dict[key_str] = item['value']

            for image in observation.images.all():
                image_url = request.build_absolute_uri(image.image.url) if image.image else ''
                data_dict[image.question.id] = image_url

            for audio in observation.audios.all():
                audio_url = request.build_absolute_uri(audio.audio.url) if audio.audio else ''
                data_dict[audio.question.id] = audio_url

            for question in questions:
                row.append(data_dict.get(question.id, ''))

            rows.append(row)

        if fmt == 'xlsx':
            return self._xlsx_response(project_id, header, rows)
        elif fmt == 'ods':
            return self._ods_response(project_id, header, rows)
        else:
            return self._csv_response(project_id, header, rows)

    def _csv_response(self, project_id, header, rows):
        response = HttpResponse(content_type='text/tab-separated-values')
        response['Content-Disposition'] = f'attachment; filename="project_{project_id}_observations.tsv"'
        writer = csv.writer(response, delimiter='\t')
        writer.writerow(header)
        for row in rows:
            writer.writerow(row)
        return response

    def _xlsx_response(self, project_id, header, rows):
        from openpyxl import Workbook
        _safe = lambda v: v if isinstance(v, (int, float, bool, type(None))) else str(v)
        wb = Workbook()
        ws = wb.active
        ws.append([str(h) for h in header])
        for row in rows:
            ws.append([_safe(v) for v in row])
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        response = HttpResponse(
            buf.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename="project_{project_id}_observations.xlsx"'
        return response

    def _ods_response(self, project_id, header, rows):
        from odf.opendocument import OpenDocumentSpreadsheet
        from odf.table import Table, TableRow, TableCell
        from odf.text import P
        doc = OpenDocumentSpreadsheet()
        sheet = Table(name="Observations")
        doc.spreadsheet.addElement(sheet)
        for data_row in [header] + rows:
            tr = TableRow()
            sheet.addElement(tr)
            for value in data_row:
                text = str(value) if value is not None else ''
                tc = TableCell(valuetype="string", stringvalue=text)
                tc.addElement(P(text=text))
                tr.addElement(tc)
        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        response = HttpResponse(
            buf.read(),
            content_type='application/vnd.oasis.opendocument.spreadsheet',
        )
        response['Content-Disposition'] = f'attachment; filename="project_{project_id}_observations.ods"'
        return response


class SendObservationEmailView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SendObservationEmailSerializer

    def post(self, request, observation_id, *args, **kwargs):
        observation = get_object_or_404(
            Observation.objects.select_related('field_form__project', 'creator'),
            pk=observation_id,
        )
        project = observation.field_form.project
        _require_project_admin(request, project)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        body = self._build_body(request, observation, project, data)

        lang = get_language_from_request(request)
        project_name = resolve_translation(project.name, lang)
        base_subject = data.get('subject') or project.email_subject
        subject = f'[{project_name}] - Muestra #{observation.id} - {base_subject}' if base_subject else f'[{project_name}] - Muestra #{observation.id}'
        log = ObservationEmailLog.objects.create(
            observation=observation,
            sent_by=request.user,
            subject=subject,
            body=body,
            include_observation_data=data['include_observation_data'],
            allow_reply=data['allow_reply'],
            status=ObservationEmailLog.STATUS_PENDING,
        )

        try:
            queue = django_rq.get_queue('citisciapi')
            queue.enqueue('markers.tasks.send_observation_email', log.id, lang)
        except Exception as e:
            logger.warning(f'Could not enqueue send_observation_email for log {log.id}: {e}')

        return Response(ObservationEmailLogSerializer(log).data, status=status.HTTP_201_CREATED)

    def _build_body(self, request, observation, project, data):
        parts = []

        if data['include_observation_data']:
            intro = data.get('intro_text') or project.email_intro
            if intro:
                parts.append(intro)

            # Core observation fields
            user_lines = []
            user_lines.append(f'  Date: {observation.timestamp.strftime("%Y-%m-%d %H:%M")}')
            user_lines.append(f'  Latitude: {observation.geoposition.y}')   # estándar: .y = lat
            user_lines.append(f'  Longitude: {observation.geoposition.x}')  # estándar: .x = lon

            # User observation answers
            from field_forms.models import Question
            questions = {str(q.id): q for q in observation.field_form.questions.all()}
            obs_data = {item['key']: item['value'] for item in observation.data}

            for key, value in obs_data.items():
                question = questions.get(str(key))
                label = question.question_text if question else key
                if isinstance(label, dict):
                    label = next(iter(label.values()), key)
                user_lines.append(f'  {label}: {value}')

            # Image URLs
            for img in observation.images.select_related('question').all():
                label = img.question.question_text if img.question else 'Image'
                if isinstance(label, dict):
                    label = next(iter(label.values()), 'Image')
                url = request.build_absolute_uri(img.image.url) if img.image else ''
                user_lines.append(f'  {label}: {url}')

            if user_lines:
                parts.append('--- Observation data ---')
                parts.extend(user_lines)

            # Admin field values marked public=True
            admin_fields = ProjectObservationField.objects.filter(
                project=project, public=True
            ).order_by('order', 'id')
            values = {
                v.field_id: v.value
                for v in ObservationFieldValue.objects.filter(
                    observation=observation, field__in=admin_fields
                )
            }
            admin_lines = []
            for field in admin_fields:
                value = values.get(field.id)
                if value is not None:
                    admin_lines.append(f'  {field.label}: {value}')

            if admin_lines:
                parts.append('--- Analysis data ---')
                parts.extend(admin_lines)

        elif data.get('body'):
            parts.append(data['body'])

        return '\n'.join(parts)


class PublicMapView(generics.GenericAPIView):
    """
    GET /api/project/{project_id}/public-map/
    GET /api/project/{project_id}/public-map/?zoom=11  (para proyectos fuzzy)

    Endpoint público para construir un mapa. Solo accesible si el proyecto
    tiene public_map=True, no es privado y no tiene private_data.

    - fuzzy=False → devuelve puntos exactos con datos de observaciones
    - fuzzy=True  → devuelve hexágonos H3 agrupados (sin coordenadas exactas)
    """
    permission_classes = [AllowAny]

    def get(self, request, project_id, *args, **kwargs):
        from field_forms.translation import get_language_from_request, resolve_translation

        project = get_object_or_404(
            Project.objects.prefetch_related('covers', 'organizations'),
            pk=project_id,
        )

        if not project.public_map:
            return Response(
                {"error": "El mapa público no está habilitado para este proyecto."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if project.is_private:
            return Response(
                {"error": "El proyecto es privado."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if project.private_data:
            return Response(
                {"error": "Los datos del proyecto son privados."},
                status=status.HTTP_403_FORBIDDEN,
            )

        lang = get_language_from_request(request)

        # Info del proyecto
        cover = project.covers.first()
        cover_url = request.build_absolute_uri(cover.image.url) if cover and cover.image else None
        organizations = [
            {
                'id': org.id,
                'name': org.principalName,
                'logo': request.build_absolute_uri(org.logo.url) if org.logo else None,
            }
            for org in project.organizations.all()
        ]
        project_data = {
            'id': project.id,
            'name': resolve_translation(project.name, lang) if isinstance(project.name, dict) else project.name,
            'description': resolve_translation(project.description, lang),
            'cover': cover_url,
            'organizations': organizations,
        }

        # Campo del formulario
        try:
            field_form = project.fieldform
        except Exception:
            logger.warning(f'Project {project_id} has no fieldform associated')
            field_form = None

        if project.fuzzy:
            # Devolver hexágonos H3
            ZOOM_TO_RESOLUTION = {
                range(0, 3): 1,
                range(3, 5): 2,
                range(5, 7): 3,
                range(7, 9): 4,
                range(9, 11): 5,
                range(11, 100): 6,
            }
            try:
                zoom = int(request.query_params.get('zoom', 11))
            except (ValueError, TypeError):
                zoom = 11
            resolution = next((res for r, res in ZOOM_TO_RESOLUTION.items() if zoom in r), 6)

            from django.core.cache import cache

            hex_cache_key = f'public_map_hex_{field_form.id}_{resolution}' if field_form else None
            cached_features = cache.get(hex_cache_key) if hex_cache_key else None

            if cached_features is None:
                cells = {}
                qs = Observation.objects.all() if field_form is None else Observation.objects.filter(field_form=field_form)
                for geopos in qs.values_list('geoposition', flat=True).iterator():
                    cell = h3.geo_to_h3(geopos.y, geopos.x, resolution)  # h3 espera (lat, lon): .y=lat, .x=lon
                    cells[cell] = cells.get(cell, 0) + 1

                features = []
                for cell, count in cells.items():
                    centroid = h3.h3_to_geo(cell)
                    boundary = h3.h3_to_geo_boundary(cell)
                    features.append({
                        'centroid': [centroid[1], centroid[0]],
                        'hex_polygon': [[v[1], v[0]] for v in boundary],
                        'count': count,
                    })

                if hex_cache_key:
                    cache.set(hex_cache_key, features)
            else:
                features = cached_features

            return Response({
                'map_type': 'hex',
                'project': project_data,
                'features': features,
            })

        else:
            # Devolver puntos exactos
            from django.core.cache import cache

            # Proyecto + preguntas: se invalida cuando cambia updated_at del proyecto
            meta_key = f'public_map_meta_{project_id}_{project.updated_at.timestamp()}'
            meta = cache.get(meta_key)
            if meta is None:
                questions = list(field_form.questions.all().order_by('order', 'id')) if field_form else []
                questions_data = [
                    {
                        'id': q.id,
                        'question_text': resolve_translation(q.question_text, lang) if isinstance(q.question_text, dict) else q.question_text,
                        'answer_type': q.answer_type,
                    }
                    for q in questions
                ]
                meta = {'project': project_data, 'questions': questions_data}
                cache.set(meta_key, meta)

            # Observaciones: misma caché que el mapa interno, se invalida por signal
            obs_key = f'observations_map_{field_form.id}'
            obs_json = cache.get(obs_key)
            if obs_json is None:
                observations_data = []
                if field_form:
                    for obs in Observation.objects.filter(field_form=field_form).values('id', 'geoposition'):
                        geopos = obs['geoposition']
                        lat, lon = (geopos.y, geopos.x) if isinstance(geopos, Point) else (None, None)
                        observations_data.append({'id': obs['id'], 'lat': lat, 'lon': lon})
                obs_json = json.dumps(observations_data)
                cache.set(obs_key, obs_json)

            meta_json = json.dumps({'map_type': 'points', 'project': meta['project'], 'questions': meta['questions']})
            # Concatenar sin deserializar obs_json — evita parsear 17MB para volver a serializarlos
            response_json = meta_json[:-1] + ', "observations": ' + obs_json + '}'
            return HttpResponse(response_json, content_type='application/json')


class PublicObservationDetailView(generics.GenericAPIView):
    """
    GET /api/project/<project_id>/observations/<observation_id>/public/

    Detalle público de una observación. Solo accesible si el proyecto tiene
    public_map=True, no es privado y no tiene private_data.
    No expone datos del creador.
    """
    permission_classes = [AllowAny]

    def get(self, request, project_id, observation_id, *args, **kwargs):
        from field_forms.translation import get_language_from_request, resolve_translation

        project = get_object_or_404(Project, pk=project_id)

        if not project.public_map:
            return Response(
                {"error": "El mapa público no está habilitado para este proyecto."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if project.is_private:
            return Response({"error": "El proyecto es privado."}, status=status.HTTP_403_FORBIDDEN)
        if project.private_data:
            return Response({"error": "Los datos del proyecto son privados."}, status=status.HTTP_403_FORBIDDEN)

        observation = get_object_or_404(
            Observation.objects.prefetch_related(
                'images__question',
                Prefetch(
                    'admin_field_values',
                    queryset=ObservationFieldValue.objects.filter(field__public=True).select_related('field'),
                    to_attr='public_admin_values',
                ),
            ),
            pk=observation_id,
            field_form__project=project,
        )

        lang = get_language_from_request(request)
        geopos = observation.geoposition
        lat, lon = (geopos.y, geopos.x) if isinstance(geopos, Point) else (None, None)

        questions = {
            str(q.id): resolve_translation(q.question_text, lang) if isinstance(q.question_text, dict) else q.question_text
            for q in observation.field_form.questions.all()
        }

        raw = observation.data
        if isinstance(raw, list):
            data_items = raw
        elif isinstance(raw, dict):
            data_items = [{'key': k, 'value': v} for k, v in raw.items()]
        else:
            data_items = []
        clean_data = [
            item for item in data_items
            if not str(item.get('key', '')).endswith('_is_other')
            and not str(item.get('key', '')).endswith('_other_text')
        ]

        images = [
            {
                'question_id': img.question_id,
                'url': request.build_absolute_uri(img.image.url),
            }
            for img in observation.images.all() if img.image
        ]

        admin_values = [
            {'key': v.field.key, 'label': v.field.label, 'value': v.value}
            for v in observation.public_admin_values
        ]

        return Response({
            'id': observation.id,
            'timestamp': observation.timestamp,
            'latitude': lat,
            'longitude': lon,
            'data': clean_data,
            'questions': questions,
            'images': images,
            'admin_values': admin_values,
        })


class ObservationEmailLogListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ObservationEmailLogSerializer

    def get_queryset(self):
        observation = get_object_or_404(
            Observation.objects.select_related('field_form__project'),
            pk=self.kwargs['observation_id'],
        )
        _require_project_admin(self.request, observation.field_form.project)
        return ObservationEmailLog.objects.filter(observation=observation).order_by('-created_at')