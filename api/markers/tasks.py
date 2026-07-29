import logging
import requests
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import translation
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger('geonity')


def _reverse_geocode(lat, lng):
    try:
        response = requests.get(
            'https://nominatim.openstreetmap.org/reverse',
            params={'lat': lat, 'lon': lng, 'format': 'json'},
            headers={'User-Agent': 'CitSci-API/1.0'},
            timeout=5,
        )
        if response.ok:
            return response.json().get('display_name', '')
    except Exception:
        pass
    return ''


def notify_admins_new_observation(observation_id, lang='es'):
    from markers.models import Observation
    from field_forms.translation import resolve_translation

    try:
        observation = Observation.objects.select_related(
            'creator',
            'field_form__project__creator',
        ).prefetch_related(
            'field_form__project__administrators',
        ).get(pk=observation_id)
    except Observation.DoesNotExist:
        logger.error(f'notify_admins_new_observation: observation {observation_id} not found')
        return

    project = observation.field_form.project

    recipients = set()
    if project.creator.email:
        recipients.add(project.creator.email)
    for admin in project.administrators.all():
        if admin.email:
            recipients.add(admin.email)
    if observation.creator and observation.creator.email:
        recipients.add(observation.creator.email)

    if not recipients:
        return

    project_name = resolve_translation(project.name, lang)
    custom_message = resolve_translation(project.post_observation_message, lang) if project.post_observation_message else ''

    lat = observation.geoposition.y
    lng = observation.geoposition.x
    address = _reverse_geocode(lat, lng)

    try:
        with translation.override(lang):
            subject = f'[{project_name}] ' + translation.gettext('Nueva observación recibida')
            context = {
                'project_name': project_name,
                'observation_id': observation.id,
                'timestamp': observation.timestamp,
                'lat': round(lat, 6),
                'lng': round(lng, 6),
                'address': address,
                'message': custom_message,
            }
            html_body = render_to_string('email/observation_admin_notification.html', context)
            text_body = (
                f'[{project_name}]\n\n'
                f'{translation.gettext("Nueva observación recibida")} #{observation.id}\n'
                f'{translation.gettext("Fecha")}: {observation.timestamp}\n'
                f'{translation.gettext("Latitud")}: {round(lat, 6)}\n'
                f'{translation.gettext("Longitud")}: {round(lng, 6)}\n'
            )
            if address:
                text_body += f'{translation.gettext("Dirección")}: {address}\n'
            if custom_message:
                text_body += f'\n{custom_message}'
        for recipient in recipients:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient],
            )
            msg.attach_alternative(html_body, 'text/html')
            msg.send(fail_silently=False)
        logger.info(f'Observation notification sent for observation {observation_id} to {recipients}')
    except Exception as e:
        logger.error(f'notify_admins_new_observation failed for observation {observation_id}: {e}')
        raise


def send_observation_email(email_log_id, lang='es'):
    from markers.models import ObservationEmailLog, ObservationFieldValue
    from field_forms.models import Question
    from field_forms.translation import resolve_translation

    try:
        log = ObservationEmailLog.objects.select_related(
            'observation__creator',
            'observation__field_form__project',
            'sent_by',
        ).get(pk=email_log_id)
    except ObservationEmailLog.DoesNotExist:
        logger.error(f'send_observation_email: ObservationEmailLog {email_log_id} not found')
        return

    observation = log.observation
    project = observation.field_form.project

    recipient = observation.creator.email
    if not recipient:
        log.status = ObservationEmailLog.STATUS_FAILED
        log.error = 'Observation creator has no email address'
        log.save()
        return

    reply_to = [log.sent_by.email] if log.allow_reply and log.sent_by and log.sent_by.email else []

    project_name = resolve_translation(project.name, lang)

    try:
        with translation.override(lang):
            context = {
                'subject': log.subject,
                'project_name': project_name,
                'body': log.body,
            }
            html_body = render_to_string('email/observation_admin.html', context)
        msg = EmailMultiAlternatives(
            subject=log.subject,
            body=log.body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
            reply_to=reply_to,
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send(fail_silently=False)
        log.status = ObservationEmailLog.STATUS_SENT
        log.sent_at = timezone.now()
        log.error = ''
        log.save()
        logger.info(f'Observation email {email_log_id} sent to {recipient}')
    except Exception as e:
        log.status = ObservationEmailLog.STATUS_FAILED
        log.error = str(e)
        log.save()
        logger.error(f'send_observation_email {email_log_id} failed: {e}')
        raise
