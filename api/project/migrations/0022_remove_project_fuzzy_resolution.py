from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('project', '0021_project_fuzzy'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='project',
            name='fuzzy_resolution',
        ),
    ]
