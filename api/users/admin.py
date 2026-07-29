from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from allauth.account.admin import EmailAddressAdmin
from allauth.account.models import EmailAddress
from .models import Profile


# --- User admin ---

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'fecha_registro')
    list_filter = UserAdmin.list_filter + ('date_joined',)
    ordering = ('-date_joined',)

    def fecha_registro(self, obj):
        return obj.date_joined
    fecha_registro.short_description = 'Fecha de registro'
    fecha_registro.admin_order_field = 'date_joined'


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


# --- EmailAddress admin ---

class CustomEmailAddressAdmin(EmailAddressAdmin):
    list_display = ('email', 'user', 'primary', 'verified', 'date_joined')
    ordering = ('-user__date_joined',)

    def date_joined(self, obj):
        return obj.user.date_joined
    date_joined.short_description = 'Fecha de registro'
    date_joined.admin_order_field = 'user__date_joined'


admin.site.unregister(EmailAddress)
admin.site.register(EmailAddress, CustomEmailAddressAdmin)


# --- Profile admin ---

admin.site.register(Profile)
