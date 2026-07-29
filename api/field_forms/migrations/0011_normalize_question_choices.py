from django.db import migrations


def normalize_choices(apps, schema_editor):
    Question = apps.get_model('field_forms', 'Question')
    for question in Question.objects.exclude(choices=None):
        choices = question.choices
        if not isinstance(choices, list) or len(choices) == 0:
            continue

        normalized = []
        changed = False
        for choice in choices:
            # Already normalized: {"value": ..., "label": ...}
            if isinstance(choice, dict) and 'value' in choice and 'label' in choice:
                normalized.append(choice)
                continue

            # Old format: {"default": "Uno"} or {"es": "Uno", "en": "One"}
            if isinstance(choice, dict) and 'value' not in choice:
                # Use the default or first available language as the base label
                label_str = choice.get('default') or next(iter(choice.values()), '')
                value = label_str.lower().replace(' ', '_')
                value = ''.join(c for c in value if c.isalnum() or c in ['_', '-'])
                normalized.append({'value': value, 'label': choice})
                changed = True
                continue

            # Plain string
            if isinstance(choice, str):
                value = choice.lower().replace(' ', '_')
                value = ''.join(c for c in value if c.isalnum() or c in ['_', '-'])
                normalized.append({'value': value, 'label': {'default': choice}})
                changed = True
                continue

            # Unknown format, leave as-is
            normalized.append(choice)

        if changed:
            question.choices = normalized
            question.save(update_fields=['choices'])


class Migration(migrations.Migration):

    dependencies = [
        ('field_forms', '0010_add_allow_other_to_question'),
    ]

    operations = [
        migrations.RunPython(normalize_choices, migrations.RunPython.noop),
    ]
