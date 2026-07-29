from django.contrib import admin
from .models import Observation, ObservationAudio, ProjectObservationField, ObservationFieldValue

@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
	list_display = ('id', 'project_name', 'field_form', 'creator', 'timestamp')
	list_select_related = ('field_form', 'field_form__project', 'creator')

	@admin.display(ordering='field_form__project__name', description='Proyecto')
	def project_name(self, obj):
		project = getattr(getattr(obj, 'field_form', None), 'project', None)
		if project is None:
			return '-'
		return getattr(project, 'name', str(project))


@admin.register(ObservationAudio)
class ObservationAudioAdmin(admin.ModelAdmin):
    list_display = ('id', 'observation', 'question', 'audio')
    list_select_related = ('observation', 'question')


@admin.register(ProjectObservationField)
class ProjectObservationFieldAdmin(admin.ModelAdmin):
	list_display = ('id', 'project', 'key', 'label', 'field_type', 'required', 'order')
	list_select_related = ('project',)
	search_fields = ('key', 'label', 'project__name')
	list_filter = ('field_type', 'required')


@admin.register(ObservationFieldValue)
class ObservationFieldValueAdmin(admin.ModelAdmin):
	list_display = ('id', 'observation', 'field', 'value', 'updated_by', 'updated_at')
	list_select_related = ('observation', 'field', 'updated_by')