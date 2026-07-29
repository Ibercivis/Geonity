from django.contrib import admin
from .models import Organization, Type, Invitation

# Register your models here.

@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ['email', 'organization', 'role', 'status', 'invited_by', 'created_at', 'expires_at', 'is_expired']
    list_filter = ['status', 'role', 'created_at']
    search_fields = ['email', 'organization__principalName', 'invited_by__username']
    readonly_fields = ['created_at', 'is_expired']
    
    def is_expired(self, obj):
        return obj.is_expired()
    is_expired.boolean = True
    is_expired.short_description = 'Expired'

admin.site.register(Organization)
admin.site.register(Type)