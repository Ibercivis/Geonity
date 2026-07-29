from django.db import migrations


def description_to_json(apps, schema_editor):
    Organization = apps.get_model('organizations', 'Organization')
    for org in Organization.objects.all():
        desc = org.description
        if isinstance(desc, str) and desc.strip():
            org.description = {'es': desc.strip()}
            org.save(update_fields=['description'])
        elif not desc:
            org.description = {}
            org.save(update_fields=['description'])


def description_to_str(apps, schema_editor):
    Organization = apps.get_model('organizations', 'Organization')
    for org in Organization.objects.all():
        desc = org.description
        if isinstance(desc, dict):
            org.description = desc.get('es') or next(iter(desc.values()), '')
            org.save(update_fields=['description'])


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0008_description_jsonfield'),
    ]

    operations = [
        migrations.RunPython(description_to_json, description_to_str),
    ]
