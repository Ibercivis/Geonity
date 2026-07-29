from django.urls import path
from markers.api import views

urlpatterns = [
    path('observations/', views.ObservationListCreate.as_view(), name='observation_list_create'),
    path('observations/my/', views.MyObservationsView.as_view(), name='my_observations'),
    path('observations/<int:pk>/', views.ObservationRetrieveUpdateDestroy.as_view(), name='observation_retrieve'),
    path('field_form/<int:field_form_id>/observations/', views.ObservationByFieldFormList.as_view(), name='observation_by_field_form_list'),
    path('field_form/<int:field_form_id>/observations/mine/', views.MyObservationsByFieldFormView.as_view(), name='my_observations_by_field_form'),
    path('field_form/<int:field_form_id>/observations/map/', views.ObservationMapView.as_view(), name='observation_map_by_field_form'),
    path('field_form/<int:field_form_id>/observations/hex/', views.ObservationHexView.as_view(), name='observation_hex_by_field_form'),
    path('project/<int:project_id>/download_observations/', views.DownloadObservationsCSV.as_view(), name='download_observations_csv'),
    path('project/<int:project_id>/public-map/', views.PublicMapView.as_view(), name='project_public_map'),
    path('project/<int:project_id>/observations/<int:observation_id>/public/', views.PublicObservationDetailView.as_view(), name='public_observation_detail'),

    # Campos administrativos (dinámicos) para observaciones
    path('projects/<int:project_id>/observation-fields/', views.ProjectObservationFieldListCreate.as_view(), name='project_observation_field_list_create'),
    path('projects/<int:project_id>/observation-fields/<int:pk>/', views.ProjectObservationFieldRetrieveUpdateDestroy.as_view(), name='project_observation_field_detail'),
    path('observations/<int:observation_id>/admin-fields/', views.ObservationAdminFieldsView.as_view(), name='observation_admin_fields'),

    # Valores administrativos en bloque (por proyecto)
    path('projects/<int:project_id>/observation-admin-values/', views.ProjectObservationAdminValuesView.as_view(), name='project_observation_admin_values'),

    # Emails a creadores de observaciones
    path('observations/<int:observation_id>/send-email/', views.SendObservationEmailView.as_view(), name='observation_send_email'),
    path('observations/<int:observation_id>/email-logs/', views.ObservationEmailLogListView.as_view(), name='observation_email_logs'),
]