import logging
logger = logging.getLogger('geonity')
from django.utils.translation import gettext as _
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import PermissionDenied
from django.core.mail import send_mail
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import translation
from django.conf import settings
import json
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q, Case, When, F, Count
from project.models import ProjectCover, ProjectInvitation
from markers.models import Observation
from field_forms.translation import get_language_from_request, resolve_translation

from project.models import Project, Topic, HasTag, ProjectMembership
from project.api.serializers import (
    ProjectSerializerCreateUpdate, ProjectListSerializer,
    TopicsSerializer, HasTagSerializer, ProjectSerializer, UserSerializer,
    ProjectInvitationSerializer, ProjectInvitationCreateSerializer,
    ProjectAdminSerializer
)

class TopicsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TopicsSerializer

    def get_queryset(self):
        return Topic.objects.annotate(project_count=Count('project', distinct=True))

class HasTagViewSet(viewsets.ModelViewSet):
    queryset = HasTag.objects.all()
    serializer_class = HasTagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class IsCreatorOrAdminOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == 'DELETE':
            return obj.creator == request.user
        return obj.creator == request.user or obj.administrators.filter(id=request.user.id).exists()

def _parse_request_data(request_data):
    """Normaliza los datos del request convirtiendo arrays de IDs a listas de enteros."""
    ARRAY_FIELDS = {'countries', 'topic', 'hasTag', 'organizations_write'}
    data = {}
    for key in request_data:
        value = request_data.get(key)
        if key in ARRAY_FIELDS:
            if isinstance(value, str):
                if not value.strip():
                    data[key] = []
                else:
                    try:
                        parsed = json.loads(value)
                        data[key] = parsed if isinstance(parsed, list) else [parsed]
                    except json.JSONDecodeError:
                        data[key] = [value]
            else:
                data[key] = value if isinstance(value, list) else request_data.getlist(key)
            # Convertir strings vacíos o None dentro de la lista
            data[key] = [v for v in data[key] if v != '' and v is not None]
        elif isinstance(value, list) and len(value) == 1:
            data[key] = value[0]
        else:
            data[key] = value
    return data


class ProjectCreateViewSet(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request, format=None):
        data = _parse_request_data(request.data)

        # Procesar field_form si es un string
        field_form_data = data.get('field_form')
        if field_form_data and isinstance(field_form_data, str):
            try:
                data['field_form'] = json.loads(field_form_data)
            except json.JSONDecodeError:
                return Response({'field_form': ['Datos JSON inválidos.']}, status=status.HTTP_400_BAD_REQUEST)

        # Agregar cover si viene como archivo
        if 'cover' in request.FILES:
            data['cover'] = request.FILES['cover']

        serializer = ProjectSerializerCreateUpdate(data=data, context={'request': request, 'user': request.user})
        if serializer.is_valid():
            project = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectListCreate(generics.ListCreateAPIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Project.objects.filter(draft=False).select_related('creator').prefetch_related(
            'administrators', 'covers', 'topic', 'hasTag', 'organizations'
        )

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProjectListSerializer
        return ProjectSerializerCreateUpdate

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context

    def create(self, request, *args, **kwargs):
        data = _parse_request_data(request.data)

        # Procesar field_form si es un string
        field_form_data = data.get('field_form')

        if field_form_data and isinstance(field_form_data, str):
            try:
                data['field_form'] = json.loads(field_form_data)
            except json.JSONDecodeError:
                return Response({'field_form': ['Datos JSON inválidos.']}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializerCreateUpdate
    permission_classes = [IsCreatorOrAdminOrReadOnly]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_serializer_context(self):
        """
        Sobrescribe el método para asegurarse de que el contexto incluya el usuario.
        """
        context = super().get_serializer_context()
        context.update({"user": self.request.user})
        return context
        

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = _parse_request_data(request.data)
        serializer = self.get_serializer(instance, data=data, partial=True, context=self.get_serializer_context())
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class ValidateProjectPasswordView(APIView):
    
    def post(self, request, project_id):
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({'detail': _('Proyecto no encontrado.')}, status=status.HTTP_404_NOT_FOUND)

        password = request.data.get('password')
        if not password:
            return Response({'detail': _('Contraseña no proporcionada.')}, status=status.HTTP_400_BAD_REQUEST)

        if project.check_password(password):
            if request.user.is_authenticated:
                ProjectMembership.objects.get_or_create(project=project, user=request.user)
            return Response({'valid': True}, status=status.HTTP_200_OK)
        else:
            return Response({'valid': False, 'detail': _('Contraseña incorrecta.')}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_project_like(request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": _("Proyecto no encontrado.")}, status=status.HTTP_404_NOT_FOUND)

        was_liked = project.toggle_like(request.user)
        action = "added" if was_liked else "removed"
        return Response({"message": f"Like {action} successfully", "total_likes": project.total_likes})

class MyProjectsView(generics.ListAPIView):
    serializer_class = ProjectSerializerCreateUpdate
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context

    def get_queryset(self):
        user = self.request.user

        # Get projects where user has contributed
        contributed_observations = Observation.objects.filter(creator=user)
        contributed_project_ids = contributed_observations.values_list('field_form__project', flat=True).distinct()
        
        # Combine projects with likes, contributions, created by user, or where user is admin
        my_projects = Project.objects.filter(
            Q(id__in=contributed_project_ids) | 
            Q(likes=user) | 
            Q(creator=user) | 
            Q(administrators=user)
        ).distinct().select_related('creator').prefetch_related(
            'topic', 'hasTag', 'organizations', 'covers', 'administrators'
        ).order_by('-last_observation', '-updated_at')
        
        return my_projects


class MyDraftProjectsView(generics.ListAPIView):
    serializer_class = ProjectSerializerCreateUpdate
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context

    def get_queryset(self):
        return Project.objects.filter(draft=True).select_related('creator').prefetch_related(
            'topic', 'hasTag', 'organizations', 'covers', 'administrators'
        ).order_by('-updated_at')


class MyAdminProjectsView(generics.ListAPIView):
    serializer_class = ProjectAdminSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context

    def get_queryset(self):
        user = self.request.user
        return Project.objects.filter(
            Q(creator=user) | Q(administrators=user)
        ).distinct().select_related('creator').prefetch_related(
            'topic', 'hasTag', 'organizations', 'covers', 'administrators'
        ).order_by('-updated_at')


class MyLikedProjectsView(generics.ListAPIView):
    serializer_class = ProjectListSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context

    def get_queryset(self):
        user = self.request.user
        return Project.objects.filter(likes=user).distinct().select_related('creator').prefetch_related(
            'topic', 'hasTag', 'organizations', 'covers', 'administrators'
        ).order_by('-updated_at')


class MyParticipatingProjectsView(generics.ListAPIView):
    serializer_class = ProjectListSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context

    def get_queryset(self):
        user = self.request.user
        contributed_project_ids = Observation.objects.filter(
            creator=user
        ).values_list('field_form__project', flat=True).distinct()
        membership_project_ids = ProjectMembership.objects.filter(
            user=user
        ).values_list('project', flat=True).distinct()
        return Project.objects.filter(
            Q(id__in=contributed_project_ids) | Q(id__in=membership_project_ids)
        ).exclude(
            Q(creator=user) | Q(administrators=user)
        ).distinct().select_related('creator').prefetch_related(
            'topic', 'hasTag', 'organizations', 'covers', 'administrators'
        ).order_by('-updated_at')


class ProjectCountriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from collections import Counter
        projects = Project.objects.all()

        counter = Counter()
        for project in projects:
            if project.is_global:
                counter['global'] += 1
            for code in project.countries:
                counter[code] += 1

        result = [{'country': country, 'project_count': count}
                  for country, count in counter.most_common()]
        return Response(result)


class ProjectEmailIntroView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'error': _('Proyecto no encontrado')}, status=status.HTTP_404_NOT_FOUND)

        if project.creator != request.user:
            raise PermissionDenied(_('Solo el creador del proyecto puede modificar este mensaje.'))

        update_fields = []
        if 'email_intro' in request.data:
            project.email_intro = request.data['email_intro']
            update_fields.append('email_intro')
        if 'email_subject' in request.data:
            project.email_subject = request.data['email_subject']
            update_fields.append('email_subject')

        if not update_fields:
            return Response({'error': _('Se requiere email_intro o email_subject.')}, status=status.HTTP_400_BAD_REQUEST)

        project.save(update_fields=update_fields)
        return Response({'email_intro': project.email_intro, 'email_subject': project.email_subject}, status=status.HTTP_200_OK)


class ProjectRemoveAdministratorView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, user_id):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'error': _('Proyecto no encontrado')}, status=status.HTTP_404_NOT_FOUND)

        if request.user != project.creator:
            raise PermissionDenied(_('Only the project creator can remove administrators.'))

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': _('User not found')}, status=status.HTTP_404_NOT_FOUND)

        if not project.administrators.filter(id=user.id).exists():
            return Response({'error': _('User is not an administrator of this project.')}, status=status.HTTP_400_BAD_REQUEST)

        project.administrators.remove(user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectInviteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({'error': _('Proyecto no encontrado')}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is creator or admin
        if request.user != project.creator and not project.administrators.filter(id=request.user.id).exists():
            raise PermissionDenied(_('Only project creator or administrators can send invitations'))
        
        serializer = ProjectInvitationCreateSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email'].lower()
            
            # Check if user is already a member
            try:
                user = User.objects.get(email=email)
                if user == project.creator:
                    return Response({'error': _('User is already the creator')}, status=status.HTTP_400_BAD_REQUEST)
                if project.administrators.filter(id=user.id).exists():
                    return Response({'error': _('User is already an administrator')}, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                pass
            
            # Check if there's already a pending invitation
            existing = ProjectInvitation.objects.filter(
                project=project,
                email=email,
                status='pending'
            ).first()
            
            if existing and not existing.is_expired():
                return Response({'error': _('A pending invitation already exists for this email')}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create invitation
            invitation = ProjectInvitation.objects.create(
                project=project,
                email=email,
                invited_by=request.user
            )
            
            # Send email
            lang = get_language_from_request(request)
            project_name = resolve_translation(project.name, lang)
            try:
                with translation.override(lang):
                    context = {
                        'project_name': project_name,
                        'invited_by': request.user.get_full_name() or request.user.username,
                    }
                    subject = _('Invitation to %(name)s') % {'name': project_name}
                    html_body = render_to_string('email/project_invitation.html', context)
                    text_body = _('You have been invited to join %(project)s as an administrator. Download the app to accept the invitation.') % {'project': project_name}
                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=text_body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[email],
                )
                msg.attach_alternative(html_body, 'text/html')
                msg.send(fail_silently=False)
            except Exception as e:
                logger.error(f'Failed to send email: {e}')
            
            # TODO: Send push notification here
            
            return Response(ProjectInvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectPendingInvitationsView(generics.ListAPIView):
    serializer_class = ProjectInvitationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ProjectInvitation.objects.filter(
            email=user.email.lower(),
            status='pending'
        ).select_related('project', 'invited_by')


class ProjectAcceptInvitationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, invitation_id):
        with transaction.atomic():
            try:
                invitation = ProjectInvitation.objects.select_for_update().get(id=invitation_id)
            except ProjectInvitation.DoesNotExist:
                return Response({'error': _('Invitation not found')}, status=status.HTTP_404_NOT_FOUND)

            # Check if invitation is for this user
            if invitation.email.lower() != request.user.email.lower():
                raise PermissionDenied(_('This invitation is not for you'))

            # Check if invitation is still pending
            if invitation.status != 'pending':
                return Response({'error': _('La invitación ya fue %(status)s') % {'status': invitation.status}}, status=status.HTTP_400_BAD_REQUEST)

            # Check if expired
            if invitation.is_expired():
                invitation.status = 'expired'
                invitation.save()
                return Response({'error': _('Invitation has expired')}, status=status.HTTP_400_BAD_REQUEST)

            invitation.project.administrators.add(request.user)
            invitation.status = 'accepted'
            invitation.save()

        return Response({
            'message': _('Invitación aceptada correctamente'),
            'project': ProjectSerializer(invitation.project).data
        }, status=status.HTTP_200_OK)


class ProjectRejectInvitationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, invitation_id):
        try:
            invitation = ProjectInvitation.objects.get(id=invitation_id)
        except ProjectInvitation.DoesNotExist:
            return Response({'error': _('Invitation not found')}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if invitation is for this user
        if invitation.email.lower() != request.user.email.lower():
            raise PermissionDenied(_('This invitation is not for you'))
        
        # Check if invitation is still pending
        if invitation.status != 'pending':
            return Response({'error': _('La invitación ya fue %(status)s') % {'status': invitation.status}}, status=status.HTTP_400_BAD_REQUEST)
        
        invitation.status = 'rejected'
        invitation.save()
        
        return Response({'message': _('Invitation rejected')}, status=status.HTTP_200_OK)


class ProjectInvitationsListView(generics.ListAPIView):
    serializer_class = ProjectInvitationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return ProjectInvitation.objects.none()

        # Check if user is creator or admin
        if self.request.user != project.creator and not project.administrators.filter(id=self.request.user.id).exists():
            raise PermissionDenied(_('Only project creator or administrators can view invitations'))

        return ProjectInvitation.objects.filter(project=project).select_related('invited_by')


class ProjectCancelInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, invitation_id):
        try:
            invitation = ProjectInvitation.objects.get(id=invitation_id)
        except ProjectInvitation.DoesNotExist:
            return Response({'error': _('Invitation not found')}, status=status.HTTP_404_NOT_FOUND)

        project = invitation.project
        if request.user != project.creator and not project.administrators.filter(id=request.user.id).exists():
            raise PermissionDenied(_('Only project creator or administrators can cancel invitations'))

        invitation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'error': _('Proyecto no encontrado')}, status=status.HTTP_404_NOT_FOUND)

        if request.user != project.creator and not project.administrators.filter(id=request.user.id).exists():
            raise PermissionDenied(_('Only project creator or administrators can export this project'))

        try:
            questions = [
                {
                    'question_text': q.question_text,
                    'question_help': q.question_help,
                    'answer_type': q.answer_type,
                    'mandatory': q.mandatory,
                    'order': q.order,
                    'choices': q.choices,
                    'allow_other': q.allow_other,
                }
                for q in project.fieldform.questions.order_by('order')
            ]
        except Exception:
            questions = []

        data = {
            'name': project.name,
            'description': project.description,
            'post_observation_message': project.post_observation_message,
            'email_intro': project.email_intro,
            'email_subject': project.email_subject,
            'is_private': project.is_private,
            'fuzzy': project.fuzzy,
            'private_data': project.private_data,
            'countries': project.countries,
            'is_global': project.is_global,
            'topic': list(project.topic.values_list('id', flat=True)),
            'hasTag': list(project.hasTag.values_list('id', flat=True)),
            'field_form': {'questions': questions},
        }

        return Response(data, status=status.HTTP_200_OK)


