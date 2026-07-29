from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('project', '0022_remove_project_fuzzy_resolution'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE project_project
                    ALTER COLUMN post_observation_message TYPE jsonb
                    USING to_jsonb(post_observation_message);
            """,
            reverse_sql="""
                ALTER TABLE project_project
                    ALTER COLUMN post_observation_message TYPE text
                    USING post_observation_message::text;
            """,
        ),
    ]
