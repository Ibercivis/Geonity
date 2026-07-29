from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('project', '0023_translate_post_observation_message'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE project_project
                    ALTER COLUMN description TYPE jsonb
                    USING to_jsonb(description);
            """,
            reverse_sql="""
                ALTER TABLE project_project
                    ALTER COLUMN description TYPE varchar(1000)
                    USING description::text;
            """,
        ),
    ]
