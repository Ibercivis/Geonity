from django.urls import path
from django.conf.urls import include
from dj_rest_auth.views import PasswordResetConfirmView, PasswordResetView
from dj_rest_auth.registration.views import VerifyEmailView, ConfirmEmailView
from django.conf import settings
from django.conf.urls.static import static
from users.api.views import (
    EmailRecoveryView, UserDeleteView, UserViewSet, UserViewSetDetail,
    UserProfileView, VisibleUsersListView, ActivateAccountView,
    CustomConfirmEmailView, RecoverySuccess, AllInvitationsView,
    AcceptInvitationUnifiedView, RejectInvitationUnifiedView, DebugLoginView,
    GoogleLoginView, ConsentView
)

urlpatterns = [
    path('users/activate-account/<str:key>/', ActivateAccountView.as_view(), name='activate-account'),
    path('users/registration/account-confirm-email/<str:key>/', CustomConfirmEmailView.as_view(), name='account_confirm_email'),
    path('users/registration/', include('dj_rest_auth.registration.urls')),
    path('users/account-confirm-email/', ConfirmEmailView.as_view(), name='account_email_verification_sent'),
    path('users/authentication/login/', DebugLoginView.as_view(), name='rest_login'),
    path('users/auth/google/', GoogleLoginView.as_view(), name='google_login'),
    path('users/authentication/', include('dj_rest_auth.urls')),
    path('users/authentication/password/reset/', include('django.contrib.auth.urls')),
    path('users/authentication/password/reset/confirm/<str:uidb64>/<str:token>', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('users/profile/', UserProfileView.as_view(), name='user-profile'),
    path('users/invitations/', AllInvitationsView.as_view(), name='all-invitations'),
    path('users/invitations/<str:invitation_type>/<int:invitation_id>/accept/', AcceptInvitationUnifiedView.as_view(), name='accept-invitation-unified'),
    path('users/invitations/<str:invitation_type>/<int:invitation_id>/reject/', RejectInvitationUnifiedView.as_view(), name='reject-invitation-unified'),
    path('users/list/', VisibleUsersListView.as_view(), name='user-list-visible'),
    path('users/email_recovery/', EmailRecoveryView.as_view(), name='email_recovery'),
    path('users/recovery_success/', RecoverySuccess.as_view(), name='recovery_success'),
    path('users/consent/', ConsentView.as_view(), name='user-consent'),
    path('users/delete/', UserDeleteView.as_view(), name='user-delete'),
    path('users/', UserViewSet.as_view(), name='users'),
    path('users/<int:pk>/', UserViewSetDetail.as_view(), name='users-detail'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)