from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0007_alter_invitation_unique_together'),
    ]

    operations = [
        # Step 1: convert existing plain-text values to valid JSON strings in-place
        migrations.RunSQL(
            sql="""
                UPDATE organizations_organization
                SET description = CASE
                    WHEN description IS NULL OR description = '' THEN '{}'
                    ELSE json_build_object('es', description)::text
                END
                WHERE description IS NULL
                   OR description = ''
                   OR description NOT LIKE '{%';
            """,
            reverse_sql="""
                UPDATE organizations_organization
                SET description = description::jsonb ->> 'es'
                WHERE description LIKE '{%';
            """,
        ),
        # Step 2: alter column type now that all values are valid JSON
        migrations.AlterField(
            model_name='organization',
            name='description',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
