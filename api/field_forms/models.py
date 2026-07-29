from django.db import models
from project.models import Project

# Create your models here.

# Define el modelo FieldForm, que está asociado a un proyecto
class FieldForm(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE)

    def __str__(self):
        return f"Field Form: {self.project.name}"

# Define el modelo Question, que está asociado a un FieldForm y tiene un tipo de respuesta
class Question(models.Model):
    STRING = 'STR'
    NUMBER = 'NUM'
    DATE = 'DATE'
    IMAGE = 'IMG'
    AUDIO = 'AUDIO'
    CHOICE = 'CHOICE'
    MULTICHOICE = 'MCHOICE'
    QR = 'QR'
    QUESTION_TYPES = [
        (STRING, 'String'),
        (NUMBER, 'Number'),
        (DATE, 'Date'),
        (IMAGE, 'Image'),
        (AUDIO, 'Audio'),
        (CHOICE, 'Choice'),
        (MULTICHOICE, 'Multichoice'),
        (QR, 'QR/Barcode'),
    ]
    field_form = models.ForeignKey(FieldForm, related_name='questions', on_delete=models.CASCADE)
    question_text = models.JSONField()
    question_help = models.JSONField(blank=True, null=True)
    answer_type = models.CharField(max_length=10, choices=QUESTION_TYPES)
    mandatory = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    choices = models.JSONField(null=True, blank=True)  # Array de opciones para tipo CHOICE: ["Opción 1", "Opción 2"] o [{"value": "opt1", "label": "Opción 1"}]
    allow_other = models.BooleanField(default=False)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        text = self.question_text
        if isinstance(text, dict):
            return next(iter(text.values()), f"Question {self.pk}")
        return str(text) if text else f"Question {self.pk}"