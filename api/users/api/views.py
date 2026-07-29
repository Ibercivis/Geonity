from rest_framework import viewsets
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics, permissions
from django.contrib.auth.models import User
from users.api.serializers import UserSerializer, ProfileSerializer, ConsentSerializer, UserDetailsSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
import requests
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from organizations.models import Invitation
from project.models import ProjectInvitation
from django.views import View
from django.http import HttpResponse
from rest_framework.permissions import AllowAny
from dj_rest_auth.registration.views import ConfirmEmailView, SocialLoginView
from dj_rest_auth.views import LoginView as DjLoginView
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from users.adapters import CustomGoogleOAuth2Adapter
from django.conf import settings
import re

import logging
logger = logging.getLogger('geonity')


class GoogleLoginView(SocialLoginView):
    adapter_class = CustomGoogleOAuth2Adapter
    client_class = OAuth2Client

    @property
    def callback_url(self):
        return settings.GOOGLE_CALLBACK_URL


class DebugLoginView(DjLoginView):
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)



class UserViewSet(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class UserViewSetDetail(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

#Vista para obtener los usuarios visibles
class VisibleUsersListView(generics.ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(profile__visibility=True).select_related('profile')

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]  # asegura que el usuario esté autenticado
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        # Obtiene el perfil del usuario actual
        return self.request.user.profile

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(self.object, data=request.data, partial=True)  # `partial=True` permite actualizaciones parciales (PATCH)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=200)
        return Response(serializer.errors, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class CustomConfirmEmailView(ConfirmEmailView):
    authentication_classes = []  # Deshabilita todas las clases de autenticación
    permission_classes = [AllowAny]  # Permite el acceso a cualquier usuario, autenticado o no

    @method_decorator(csrf_exempt)
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        # Verifica si la confirmación fue exitosa
        if response.status_code == 302:  # 302 es un código de redirección
            return HttpResponse("Confirmación de correo electrónico exitosa.", status=200)
        else:
            return response

@method_decorator(csrf_exempt, name='dispatch')
class ActivateAccountView(View):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, key):
        from allauth.account.models import EmailAddress
        from allauth.account import app_settings as allauth_settings
        from django.core import signing

        # Si la cuenta ya está verificada, mostrar éxito directamente
        try:
            max_age = 60 * 60 * 24 * allauth_settings.EMAIL_CONFIRMATION_EXPIRE_DAYS
            pk = signing.loads(key, max_age=max_age, salt=allauth_settings.SALT)
            if EmailAddress.objects.filter(pk=pk, verified=True).exists():
                return render(request, 'activation_success.html')
        except (signing.SignatureExpired, signing.BadSignature):
            pass

        # Muestra página de confirmación para que el usuario confirme manualmente.
        # Esto evita que bots de previsualización de enlaces activen la cuenta.
        return render(request, 'activation_confirm.html', {'key': key})

    def post(self, request, key):
        from allauth.account.models import EmailAddress
        from allauth.account import app_settings as allauth_settings
        from django.core import signing

        api_url = f'{settings.BASE_URL}/api/users/registration/account-confirm-email/{key}/'
        response = requests.post(api_url, data={'key': key})

        if response.status_code == 200:
            return render(request, 'activation_success.html')

        if response.status_code == 404:
            # Distinguir entre cuenta ya verificada, enlace caducado o enlace inválido
            try:
                max_age = 60 * 60 * 24 * allauth_settings.EMAIL_CONFIRMATION_EXPIRE_DAYS
                pk = signing.loads(key, max_age=max_age, salt=allauth_settings.SALT)
                if EmailAddress.objects.filter(pk=pk, verified=True).exists():
                    # La cuenta ya estaba activa (p.ej. activada por un bot de previsualización)
                    return render(request, 'activation_success.html')
                return render(request, 'activation_fail.html', {'error': 'No se encontró la cuenta asociada a este enlace.'})
            except signing.SignatureExpired:
                return render(request, 'activation_fail.html', {'error': 'El enlace de activación ha caducado. Por favor, solicita uno nuevo.'})
            except signing.BadSignature:
                return render(request, 'activation_fail.html', {'error': 'El enlace de activación no es válido.'})

        return render(request, 'activation_fail.html', {'error': response.text})

class EmailRecoveryView(View):
    def get(self, request, *args, **kwargs):
        reset_url = request.GET.get('resetUrl', '')
        
        # Extraer uid y token usando una expresión regular
        match = re.search(r'reset/confirm/([^/]+)/([^/]+)$', reset_url)
        if match:
            uid = match.group(1)
            token = match.group(2)
        else:
            uid = ''
            token = ''
        
        context = {
            'uid': uid,
            'token': token,
        }
        return render(request, 'email_recovery.html', context)
    
class RecoverySuccess(View):
    def get(self, request, *args, **kwargs):
        return render(request, 'recovery_success.html')

class ConsentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ConsentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.update_consent(request.user)
        return Response(UserDetailsSerializer(user).data, status=status.HTTP_200_OK)


class UserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user
        keep_observations = request.data.get('keep_observations', True)
        if not keep_observations:
            user.observations.all().delete()
        user.delete()
        return Response({"message": "User deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class AllInvitationsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get organization invitations
        org_invitations = Invitation.objects.filter(
            email=user.email,
            status='pending'
        ).select_related('organization', 'invited_by')
        
        # Get project invitations
        project_invitations = ProjectInvitation.objects.filter(
            email=user.email,
            status='pending'
        ).select_related('project', 'invited_by')
        
        # Format organization invitations
        org_data = [{
            'id': inv.id,
            'type': 'organization',
            'name': inv.organization.principalName,
            'organization_id': inv.organization.id,
            'role': inv.role,
            'invited_by': inv.invited_by.username,
            'created_at': inv.created_at,
            'expires_at': inv.expires_at
        } for inv in org_invitations]
        
        # Format project invitations
        project_data = [{
            'id': inv.id,
            'type': 'project',
            'name': inv.project.name,
            'project_id': inv.project.id,
            'invited_by': inv.invited_by.username,
            'created_at': inv.created_at,
            'expires_at': inv.expires_at
        } for inv in project_invitations]
        
        # Combine and sort by created_at (most recent first)
        all_invitations = org_data + project_data
        all_invitations.sort(key=lambda x: x['created_at'], reverse=True)
        
        return Response({
            'count': len(all_invitations),
            'invitations': all_invitations
        }, status=status.HTTP_200_OK)


class AcceptInvitationUnifiedView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, invitation_type, invitation_id):
        user = request.user
        
        if invitation_type == 'organization':
            try:
                invitation = Invitation.objects.get(id=invitation_id)
                
                # Check if invitation is for this user
                if invitation.email.lower() != user.email.lower():
                    return Response({'error': 'This invitation is not for you'}, status=status.HTTP_403_FORBIDDEN)
                
                # Check if invitation is still pending
                if invitation.status != 'pending':
                    return Response({'error': f'Invitation already {invitation.status}'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if expired
                if invitation.is_expired():
                    invitation.status = 'expired'
                    invitation.save()
                    return Response({'error': 'Invitation has expired'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Add user to organization
                organization = invitation.organization
                if invitation.role == 'administrator':
                    organization.administrators.add(user)
                elif invitation.role == 'member':
                    organization.members.add(user)
                
                invitation.status = 'accepted'
                invitation.save()
                
                return Response({
                    'message': 'Invitation accepted successfully',
                    'type': 'organization',
                    'organization_id': organization.id,
                    'organization_name': organization.principalName
                }, status=status.HTTP_200_OK)
                
            except Invitation.DoesNotExist:
                return Response({'error': 'Organization invitation not found'}, status=status.HTTP_404_NOT_FOUND)
        
        elif invitation_type == 'project':
            try:
                invitation = ProjectInvitation.objects.get(id=invitation_id)
                
                # Check if invitation is for this user
                if invitation.email.lower() != user.email.lower():
                    return Response({'error': 'This invitation is not for you'}, status=status.HTTP_403_FORBIDDEN)
                
                # Check if invitation is still pending
                if invitation.status != 'pending':
                    return Response({'error': f'Invitation already {invitation.status}'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if expired
                if invitation.is_expired():
                    invitation.status = 'expired'
                    invitation.save()
                    return Response({'error': 'Invitation has expired'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Add user as administrator
                invitation.project.administrators.add(user)
                invitation.status = 'accepted'
                invitation.save()
                
                return Response({
                    'message': 'Invitation accepted successfully',
                    'type': 'project',
                    'project_id': invitation.project.id,
                    'project_name': invitation.project.name
                }, status=status.HTTP_200_OK)
                
            except ProjectInvitation.DoesNotExist:
                return Response({'error': 'Project invitation not found'}, status=status.HTTP_404_NOT_FOUND)
        
        else:
            return Response({'error': 'Invalid invitation type. Must be "organization" or "project"'}, status=status.HTTP_400_BAD_REQUEST)


class RejectInvitationUnifiedView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, invitation_type, invitation_id):
        user = request.user
        
        if invitation_type == 'organization':
            try:
                invitation = Invitation.objects.get(id=invitation_id)
                
                # Check if invitation is for this user
                if invitation.email.lower() != user.email.lower():
                    return Response({'error': 'This invitation is not for you'}, status=status.HTTP_403_FORBIDDEN)
                
                # Check if invitation is still pending
                if invitation.status != 'pending':
                    return Response({'error': f'Invitation already {invitation.status}'}, status=status.HTTP_400_BAD_REQUEST)
                
                invitation.status = 'rejected'
                invitation.save()
                
                return Response({
                    'message': 'Invitation rejected',
                    'type': 'organization'
                }, status=status.HTTP_200_OK)
                
            except Invitation.DoesNotExist:
                return Response({'error': 'Organization invitation not found'}, status=status.HTTP_404_NOT_FOUND)
        
        elif invitation_type == 'project':
            try:
                invitation = ProjectInvitation.objects.get(id=invitation_id)
                
                # Check if invitation is for this user
                if invitation.email.lower() != user.email.lower():
                    return Response({'error': 'This invitation is not for you'}, status=status.HTTP_403_FORBIDDEN)
                
                # Check if invitation is still pending
                if invitation.status != 'pending':
                    return Response({'error': f'Invitation already {invitation.status}'}, status=status.HTTP_400_BAD_REQUEST)
                
                invitation.status = 'rejected'
                invitation.save()
                
                return Response({
                    'message': 'Invitation rejected',
                    'type': 'project'
                }, status=status.HTTP_200_OK)
                
            except ProjectInvitation.DoesNotExist:
                return Response({'error': 'Project invitation not found'}, status=status.HTTP_404_NOT_FOUND)
        
        else:
            return Response({'error': 'Invalid invitation type. Must be "organization" or "project"'}, status=status.HTTP_400_BAD_REQUEST)