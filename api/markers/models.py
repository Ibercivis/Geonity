import uuid
from django.contrib.gis.db import models as gis_models
from django.db import models
from django.db.models import JSONField
from django.contrib.auth.models import User
from field_forms.models import FieldForm, Question
from project.models import Project

class Observation(models.Model):
    PLATFORM_MOBILE = 'mobile'
    PLATFORM_WEB = 'web'
    PLATFORM_CHOICES = [
        (PLATFORM_MOBILE, 'Mobile'),
        (PLATFORM_WEB, 'Web'),
    ]

    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='observations')
    field_form = models.ForeignKey(FieldForm, on_delete=models.CASCADE, related_name='observations')
    timestamp = models.DateTimeField()
    geoposition = gis_models.PointField()
    data = JSONField()
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        creator = self.creator or 'deleted user'
        return f"Observation by {creator} on {self.timestamp:%Y-%m-%d %H:%M}"

class ObservationImage(models.Model):
    observation = models.ForeignKey(Observation, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='images/')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)

    def __str__(self):
        return f"Image for {self.observation} - {self.question.question_text}"


def audio_upload_path(instance, filename):
    ext = filename.rsplit('.', 1)[-1] if '.' in filename else 'm4a'
    project_id = instance.observation.field_form.project_id
    return f'audio/{project_id}/{uuid.uuid4().hex}.{ext}'


class ObservationAudio(models.Model):
    observation = models.ForeignKey(Observation, related_name='audios', on_delete=models.CASCADE)
    audio = models.FileField(upload_to=audio_upload_path)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)

    def __str__(self):
        return f"Audio for {self.observation} - {self.question.question_text}"


class ProjectObservationField(models.Model):
    """
    Campos administrativos para observaciones.
    Estos campos son creados y gestionados por administradores del proyecto
    para añadir información adicional a las observaciones después de su creación.
    
    Ejemplo de uso:
    - Campo para validación: "¿Especie confirmada?" (bool)
    - Campo para clasificación: "Estado de conservación" (choice)
    - Campo para notas: "Comentarios del experto" (text)
    
    Se diferencian de las Questions del FieldForm porque:
    - Questions: campos que los usuarios completan al crear una observación
    - ProjectObservationField: campos que los admins completan después
    """
    TYPE_BOOL = 'bool'
    TYPE_CHOICE = 'choice'
    TYPE_MULTICHOICE = 'mchoice'
    TYPE_TEXT = 'text'
    TYPE_NUMBER = 'number'
    TYPE_DATE = 'date'

    FIELD_TYPES = [
        (TYPE_BOOL, 'Boolean'),
        (TYPE_CHOICE, 'Choice'),
        (TYPE_MULTICHOICE, 'Multichoice'),
        (TYPE_TEXT, 'Text'),
        (TYPE_NUMBER, 'Number'),
        (TYPE_DATE, 'Date'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='observation_fields')
    key = models.SlugField(max_length=64)
    label = models.CharField(max_length=128)
    field_type = models.CharField(max_length=16, choices=FIELD_TYPES)
    required = models.BooleanField(default=False)
    choices = JSONField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    help_text = models.CharField(max_length=255, blank=True)
    public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['project', 'key'], name='uniq_project_observation_field_key'),
        ]
        ordering = ['order', 'id']

    def __str__(self):
        project_name = getattr(self.project, 'name', None)
        if project_name:
            return f"{project_name}: {self.key}"
        return f"Project {self.project_id}: {self.key}"


class ObservationFieldValue(models.Model):
    observation = models.ForeignKey(Observation, on_delete=models.CASCADE, related_name='admin_field_values')
    field = models.ForeignKey(ProjectObservationField, on_delete=models.CASCADE, related_name='values')
    value = JSONField(null=True, blank=True)
    updated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='updated_observation_field_values')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['observation', 'field'], name='uniq_observation_admin_field'),
        ]

    def __str__(self):
        return f"Observation {self.observation_id} - {self.field.key}"


class ObservationEmailLog(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_SENT = 'sent'
    STATUS_FAILED = 'failed'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_SENT, 'Sent'),
        (STATUS_FAILED, 'Failed'),
    ]

    observation = models.ForeignKey(Observation, on_delete=models.CASCADE, related_name='email_logs')
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sent_observation_emails')
    subject = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    include_observation_data = models.BooleanField(default=False)
    allow_reply = models.BooleanField(default=False)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        creator = self.observation.creator
        recipient = creator.email if creator else 'deleted user'
        return f"Email to {recipient} re observation {self.observation_id} [{self.status}]"
