from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('project', '0020_add_post_observation_message_to_project'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='fuzzy',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='project',
            name='fuzzy_resolution',
            field=models.IntegerField(default=10),
        ),
    ]
