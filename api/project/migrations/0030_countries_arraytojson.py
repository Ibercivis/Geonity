from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('project', '0029_add_countries_to_project'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE project_project
                ALTER COLUMN countries TYPE jsonb
                USING to_jsonb(countries);
            """,
            reverse_sql="""
                ALTER TABLE project_project
                ALTER COLUMN countries TYPE varchar(2)[]
                USING ARRAY(SELECT jsonb_array_elements_text(countries));
            """,
        ),
    ]
