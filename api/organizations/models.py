from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone
from datetime import timedelta


# Create your models here.
class Type(models.Model):
    type = models.TextField()

    def __str__(self):
        return f'{self.type}'

class Organization(models.Model):
    principalName = models.CharField(max_length=50, blank=False)
    url = models.CharField(max_length=50, blank=True)
    description = models.JSONField(blank=True, default=dict)
    type = models.ManyToManyField(Type, blank=True)
    contactName = models.CharField(max_length=50, blank=True)
    contactMail = models.CharField(max_length=50, blank=True)
    logo = models.ImageField(upload_to='organizations/logos/', null=True, blank=True)
    cover = models.ImageField(upload_to='organizations/covers/', null=True, blank=True)
    countries = models.JSONField(blank=True, default=list)
    is_global = models.BooleanField(default=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_organizations", null=True, blank=True) # REVISAR EL NULL Y BLANK
    administrators = models.ManyToManyField(User, related_name="admin_organizations", blank=True)
    members = models.ManyToManyField(User, related_name="member_organizations", blank=True)

    def __str__(self):
        return self.principalName

class Invitation(models.Model):
    ROLE_CHOICES = [
        ('administrator', 'Administrator'),
        ('member', 'Member'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def __str__(self):
        return f"{self.email} invited to {self.organization.principalName} as {self.role}"
    
    class Meta:
        pass