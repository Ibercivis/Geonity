import logging
logger = logging.getLogger('geonity')
from django.utils.translation import gettext as _
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.permissions import SAFE_METHODS
from rest_framework.exceptions import PermissionDenied
from rest_framework import permissions
from django.db.models import Q, Max

from django.contrib.auth.models import User

from organizations.models import Organization, Type, Invitation
from project.models import Project
from .serializers import OrganizationSerializer, OrganizationSerializerCreateUpdate, TypeSerializer, InvitationSerializer, InvitationCreateSerializer
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import translation
from django.conf import settings
from field_forms.translation import get_language_from_request, resolve_translation

class IsOrganizationCreatorOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        if request.method == "DELETE":
            return request.user == obj.creator

        return request.user == obj.creator or request.user in obj.administrators.all()

class OrganizationViewSet(generics.ListAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializerCreateUpdate
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class MyOrganizationsView(generics.ListAPIView):
    serializer_class = OrganizationSerializerCreateUpdate
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Organization.objects.filter(
            Q(creator=user) | Q(administrators=user) | Q(members=user)
        ).distinct()


class TypeViewSet(generics.ListAPIView):
    queryset = Type.objects.all()
    serializer_class = TypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class OrganizationCreateViewSet(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request, format=None):
        serializer = OrganizationSerializerCreateUpdate(
            data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(creator=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class OrganizationDetailUpdateDelete(generics.RetrieveUpdateDestroyAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializerCreateUpdate
    permission_classes = [IsOrganizationCreatorOrAdmin]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

class OrganizationProjectsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        from project.api.serializers import ProjectSerializerCreateUpdate
        return ProjectSerializerCreateUpdate

    def get_serializer_context(self):
        return {'user': self.request.user}

    def get_queryset(self):
        organization_id = self.kwargs['organization_id']
        return Project.objects.filter(
            organizations__id=organization_id
        ).select_related('creator').prefetch_related(
            'topic', 'hasTag', 'organizations', 'covers', 'administrators'
        )

class OrganizationInviteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, organization_id):
        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist:
            return Response({'error': _('Organization not found')}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is creator or admin
        if request.user != organization.creator and not organization.administrators.filter(id=request.user.id).exists():
            raise PermissionDenied(_('Only organization creator or administrators can send invitations'))
        
        serializer = InvitationCreateSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email'].lower()
            role = serializer.validated_data['role']
            
            # Check if user is already a member
            try:
                user = User.objects.get(email=email)
                if user == organization.creator:
                    return Response({'error': _('User is already the creator')}, status=status.HTTP_400_BAD_REQUEST)
                if role == 'administrator' and organization.administrators.filter(id=user.id).exists():
                    return Response({'error': _('User is already an administrator')}, status=status.HTTP_400_BAD_REQUEST)
                if role == 'member' and organization.members.filter(id=user.id).exists():
                    return Response({'error': _('User is already a member')}, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                pass
            
            # Check if there's already a pending invitation
            existing = Invitation.objects.filter(
                organization=organization,
                email=email,
                status='pending'
            ).first()
            
            if existing and not existing.is_expired():
                return Response({'error': _('A pending invitation already exists for this email')}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create invitation
            invitation = Invitation.objects.create(
                organization=organization,
                email=email,
                role=role,
                invited_by=request.user
            )
            
            # Send email
            lang = get_language_from_request(request)
            try:
                with translation.override(lang):
                    context = {
                        'organization_name': organization.principalName,
                        'invited_by': request.user.get_full_name() or request.user.username,
                        'role': role,
                    }
                    subject = _('Invitation to %(name)s') % {'name': organization.principalName}
                    html_body = render_to_string('email/organization_invitation.html', context)
                    text_body = _('You have been invited to join %(org)s as %(role)s. Download the app to accept the invitation.') % {'org': organization.principalName, 'role': role}
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
            
            return Response(InvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PendingInvitationsView(generics.ListAPIView):
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Invitation.objects.filter(
            email=user.email,
            status='pending'
        ).select_related('organization', 'invited_by')

class AcceptInvitationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, invitation_id):
        try:
            invitation = Invitation.objects.get(id=invitation_id)
        except Invitation.DoesNotExist:
            return Response({'error': _('Invitation not found')}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if invitation is for this user
        if invitation.email.lower() != request.user.email.lower():
            raise PermissionDenied(_('This invitation is not for you'))

        # Check if already accepted or rejected
        if invitation.status != 'pending':
            return Response({'error': f'Invitation already {invitation.status}'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if expired
        if invitation.is_expired():
            invitation.status = 'expired'
            invitation.save()
            return Response({'error': _('Invitation has expired')}, status=status.HTTP_400_BAD_REQUEST)

        # Add user to organization
        organization = invitation.organization
        if invitation.role == 'administrator':
            organization.administrators.add(request.user)
        else:
            organization.members.add(request.user)

        # Mark invitation as accepted
        invitation.status = 'accepted'
        invitation.save()

        return Response({
            'message': f'Successfully joined {organization.principalName} as {invitation.role}',
            'organization_id': organization.id
        }, status=status.HTTP_200_OK)

class RejectInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, invitation_id):
        try:
            invitation = Invitation.objects.get(id=invitation_id)
        except Invitation.DoesNotExist:
            return Response({'error': _('Invitation not found')}, status=status.HTTP_404_NOT_FOUND)

        # Check if invitation is for this user
        if invitation.email.lower() != request.user.email.lower():
            raise PermissionDenied(_('This invitation is not for you'))
        
        # Check if already accepted or rejected
        if invitation.status != 'pending':
            return Response({'error': f'Invitation already {invitation.status}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark invitation as rejected
        invitation.status = 'rejected'
        invitation.save()
        
        return Response({'message': _('Invitation rejected')}, status=status.HTTP_200_OK)

class OrganizationInvitationsListView(generics.ListAPIView):
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        organization_id = self.kwargs['organization_id']
        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist:
            return Invitation.objects.none()
        
        # Check if user is creator or admin
        if self.request.user != organization.creator and not organization.administrators.filter(id=self.request.user.id).exists():
            raise PermissionDenied(_('Only organization creator or administrators can view invitations'))
        
        return Invitation.objects.filter(
            organization=organization
        ).select_related('organization', 'invited_by').order_by('-created_at')

class CancelInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, invitation_id):
        try:
            invitation = Invitation.objects.get(id=invitation_id)
        except Invitation.DoesNotExist:
            return Response({'error': _('Invitation not found')}, status=status.HTTP_404_NOT_FOUND)

        organization = invitation.organization
        if request.user != organization.creator and not organization.administrators.filter(id=request.user.id).exists():
            raise PermissionDenied(_('Only organization creator or administrators can cancel invitations'))

        invitation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LeaveOrganizationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, organization_id):
        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist:
            return Response({'error': _('Organization not found')}, status=status.HTTP_404_NOT_FOUND)
        
        user = request.user
        
        # Cannot leave if you're the creator
        if organization.creator == user:
            return Response(
                {'error': 'Organization creator cannot leave. Transfer ownership or delete the organization instead.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is a member or administrator
        is_admin = organization.administrators.filter(id=user.id).exists()
        is_member = organization.members.filter(id=user.id).exists()
        
        if not is_admin and not is_member:
            return Response(
                {'error': 'You are not a member of this organization'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove user from organization
        if is_admin:
            organization.administrators.remove(user)
        if is_member:
            organization.members.remove(user)
        
        return Response(
            {'message': f'Successfully left {organization.principalName}'},
            status=status.HTTP_200_OK
        )
    