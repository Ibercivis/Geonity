"""citsci-api URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf.urls import include
from django.conf import settings # JORGE: Para poder servir los archivos multimedia
from django.conf.urls.static import static # JORGE: Para poder servir los archivos multimedia
from dj_rest_auth.views import PasswordResetConfirmView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # JORGE: Comento las urls de registro y autenticación de usuarios y me las llevo a la aplicación de usuarios
    # path('api/registration/', include('dj_rest_auth.registration.urls')),
    # path('api/authentication/', include('dj_rest_auth.urls')),
    # path('api/authentication/password/reset/confirm/<str:uidb64>/<str:token>', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('api/', include('project.api.urls')),
    path('api/', include('field_forms.api.urls')),
    path('api/', include('users.api.urls')),
    path('accounts/', include('allauth.urls')),
    path('api/', include('organizations.api.urls')),
    path('api/', include('markers.api.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
