from django.contrib import admin
from .models import FieldForm, Question


class QuestionInline(admin.TabularInline):
	model = Question
	extra = 0
	fields = ('question_text', 'answer_type', 'mandatory')


@admin.register(FieldForm)
class FieldFormAdmin(admin.ModelAdmin):
	list_display = ('id', 'project_name')
	list_select_related = ('project',)
	inlines = (QuestionInline,)

	fields = ('project',)

	@admin.display(ordering='project__name', description='Proyecto')
	def project_name(self, obj):
		return getattr(obj.project, 'name', str(obj.project))

	def get_readonly_fields(self, request, obj=None):
		if obj is not None:
			return ('project',)
		return ()


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'field_form', 'project_name', 'answer_type', 'mandatory', 'order')
    list_select_related = ('field_form__project',)
    list_filter = ('field_form', 'field_form__project')

    @admin.display(ordering='field_form__project__name', description='Project')
    def project_name(self, obj):
        return obj.field_form.project.name