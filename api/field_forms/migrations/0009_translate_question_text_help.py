from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('field_forms', '0008_alter_question_answer_type'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE field_forms_question
                    ALTER COLUMN question_text TYPE jsonb
                    USING to_jsonb(question_text),
                    ALTER COLUMN question_help TYPE jsonb
                    USING to_jsonb(question_help);
            """,
            reverse_sql="""
                ALTER TABLE field_forms_question
                    ALTER COLUMN question_text TYPE varchar(200)
                    USING question_text::text,
                    ALTER COLUMN question_help TYPE text
                    USING question_help::text;
            """,
        ),
    ]
