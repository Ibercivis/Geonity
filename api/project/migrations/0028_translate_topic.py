from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('project', '0027_add_email_subject_to_project'),
    ]

    operations = [
        # 1. Añadir columna JSON temporal
        migrations.AddField(
            model_name='topic',
            name='topic_json',
            field=models.JSONField(null=True),
        ),
        # 2. Copiar datos existentes envueltos en {"es": valor}
        migrations.RunSQL(
            sql="UPDATE project_topic SET topic_json = json_build_object('es', topic::text);",
            reverse_sql="UPDATE project_topic SET topic = topic_json->>'es';",
        ),
        # 3. Borrar columna original
        migrations.RemoveField(
            model_name='topic',
            name='topic',
        ),
        # 4. Renombrar la nueva columna
        migrations.RenameField(
            model_name='topic',
            old_name='topic_json',
            new_name='topic',
        ),
        # 5. Quitar null=True
        migrations.AlterField(
            model_name='topic',
            name='topic',
            field=models.JSONField(),
        ),
    ]
