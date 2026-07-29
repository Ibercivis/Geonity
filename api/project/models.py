from django.db import models
from django.db.models import ImageField
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.models import User
from organizations.models import Organization
from datetime import timedelta


# Create your models here.

class Topic(models.Model):
    topic = models.JSONField()

    def __str__(self):
        if isinstance(self.topic, dict):
            return next(iter(self.topic.values()), f"Topic {self.pk}")
        return str(self.topic) if self.topic else f"Topic {self.pk}"

class HasTag(models.Model):
    hasTag = models.TextField()

    def __str__(self):
        return f'{self.hasTag}'

# Define el modelo Project que tiene un propietario, un nombre, una descripción y un topic (el hasTag creo que no tiene sentido)
class Project(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    administrators = models.ManyToManyField(User, related_name='admin_projects')
    name = models.CharField(max_length=200, blank=False)
    description = models.JSONField()
    topic = models.ManyToManyField(Topic, blank=True)
    hasTag = models.ManyToManyField(HasTag, blank=True)
    is_private = models.BooleanField(default=False)
    _password = models.CharField(max_length=128, blank=True, null=True)
    organizations = models.ManyToManyField(Organization, related_name='projects')
    likes = models.ManyToManyField(User, related_name='liked_projects', blank=True)
    post_observation_message = models.JSONField(blank=True, default=dict)
    fuzzy = models.BooleanField(default=False)
    private_data = models.BooleanField(default=False)
    email_intro = models.TextField(blank=True, default='')
    email_subject = models.CharField(max_length=255, blank=True, default='')
    countries = models.JSONField(blank=True, default=list)
    is_global = models.BooleanField(default=True)
    ended = models.BooleanField(default=False)
    email_on_observation = models.BooleanField(default=False)
    draft = models.BooleanField(default=True)
    public_map = models.BooleanField(default=False)
    show_post_message = models.BooleanField(default=False)
    last_observation = models.DateTimeField(null=True, blank=True, default=None)

    PLATFORM_ALL = 'all'
    PLATFORM_MOBILE = 'mobile'
    PLATFORM_WEB = 'web'
    PLATFORM_CHOICES = [
        (PLATFORM_ALL, 'All'),
        (PLATFORM_MOBILE, 'Mobile only'),
        (PLATFORM_WEB, 'Web only'),
    ]
    allowed_platforms = models.CharField(max_length=10, choices=PLATFORM_CHOICES, default=PLATFORM_ALL)

    def __str__(self):
        if self.name:
            return self.name
        return f"Project {self.pk}"

    @property
    def total_likes(self):
        return self.likes.count()
    
    @property
    def password(self):
        raise AttributeError("No se puede leer el atributo password directamente")

    @password.setter
    def password(self, raw_password):
        self._password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self._password)


    def toggle_like(self, user):
        if self.likes.filter(id=user.id).exists():
            self.likes.remove(user)
            return False  # False indica que el like fue removido
        else:
            self.likes.add(user)
            return True  # True indica que el like fue añadido

    @property
    def contributions(self):
        # No añadimos contributions como un campo del modelo, por tanto no se guarda en la base de datos. Lo calculamos cada vez que se llama a este método.
        # Intentamos obtener el formulario asociado con este proyecto.
        try:
            return self.fieldform.observations.count()
        except Exception:
            # Si no hay formulario asociado, devolvemos 0.
            return 0

# Modelo para asociar imágenes a un proyecto (Covers para el frontend)       
class ProjectCover(models.Model):
    project = models.ForeignKey(Project, related_name="covers", on_delete=models.CASCADE)
    image = models.ImageField(upload_to='projects/covers/', null=True, blank=True)

    def __str__(self):
        return f"Cover for {self.project.name}"


class ProjectMembership(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['project', 'user']

    def __str__(self):
        return f"{self.user.username} → {self.project.name}"


class ProjectInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_project_invitations')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        return timezone.now() > self.expires_at and self.status == 'pending'
    
    def __str__(self):
        return f"Invitation to {self.email} for {self.project.name}"
    
    class Meta:
        pass