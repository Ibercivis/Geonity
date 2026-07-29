from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from field_forms.models import FieldForm, Question


@receiver(post_save, sender=FieldForm)
def touch_project_on_fieldform_save(sender, instance, **kwargs):
    instance.project.save(update_fields=['updated_at'])


@receiver(post_save, sender=Question)
@receiver(post_delete, sender=Question)
def touch_project_on_question_change(sender, instance, **kwargs):
    instance.field_form.project.save(update_fields=['updated_at'])
