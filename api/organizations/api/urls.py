from rest_framework import routers
from django.urls import path
from .views import (
    OrganizationViewSet, OrganizationDetailUpdateDelete, OrganizationCreateViewSet,
    TypeViewSet, OrganizationProjectsView,
    OrganizationInviteView, OrganizationInvitationsListView, LeaveOrganizationView,
    MyOrganizationsView, PendingInvitationsView, AcceptInvitationView, RejectInvitationView,
    CancelInvitationView,
)
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('organization/create/', OrganizationCreateViewSet.as_view(), name='organization-create'),
    path('organization/<int:organization_id>/projects/', OrganizationProjectsView.as_view(), name='organization-projects'),
    path('organization/<int:organization_id>/invite/', OrganizationInviteView.as_view(), name='organization-invite'),
    path('organization/<int:organization_id>/invitations/', OrganizationInvitationsListView.as_view(), name='organization-invitations-list'),
    path('organization/<int:organization_id>/leave/', LeaveOrganizationView.as_view(), name='organization-leave'),
    path('organization/invitations/pending/', PendingInvitationsView.as_view(), name='organization-invitations-pending'),
    path('organization/invitations/<int:invitation_id>/accept/', AcceptInvitationView.as_view(), name='organization-invitation-accept'),
    path('organization/invitations/<int:invitation_id>/reject/', RejectInvitationView.as_view(), name='organization-invitation-reject'),
    path('organization/invitations/<int:invitation_id>/cancel/', CancelInvitationView.as_view(), name='organization-invitation-cancel'),
    path('organization/<int:pk>/', OrganizationDetailUpdateDelete.as_view(), name='organization-detail-update-delete'),
    path('organization/mine/', MyOrganizationsView.as_view(), name='organization-mine'),
    path('organization/', OrganizationViewSet.as_view(), name='organization-list'),
    path('organization/type/', TypeViewSet.as_view(), name='organization-type-list'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)