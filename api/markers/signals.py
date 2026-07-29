from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from markers.models import Observation


def _invalidate_observation_cache(field_form_id):
    cache.delete(f'observations_map_{field_form_id}')
    for resolution in range(1, 7):
        cache.delete(f'observations_hex_{field_form_id}_{resolution}')


@receiver(post_save, sender=Observation)
def update_project_last_observation(sender, instance, **kwargs):
    project = instance.field_form.project
    if project.last_observation is None or instance.timestamp > project.last_observation:
        project.last_observation = instance.timestamp
        project.save(update_fields=['last_observation'])
    _invalidate_observation_cache(instance.field_form_id)


@receiver(post_delete, sender=Observation)
def invalidate_map_cache_on_delete(sender, instance, **kwargs):
    _invalidate_observation_cache(instance.field_form_id)
