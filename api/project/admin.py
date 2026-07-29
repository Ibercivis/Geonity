from django import forms
from django.contrib import admin
from django.db.models import Count
from .models import Project, ProjectCover, Topic, HasTag, ProjectInvitation


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'creator_email', 'admin_emails', 'observation_count', 'draft', 'public_map']
    list_editable = ['draft', 'public_map']
    list_filter = ['draft', 'public_map']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('creator').prefetch_related('administrators').annotate(
            _observation_count=Count('fieldform__observations', distinct=True)
        )

    def creator_email(self, obj):
        return obj.creator.email if obj.creator else '-'
    creator_email.short_description = 'Creador'

    def admin_emails(self, obj):
        emails = [u.email for u in obj.administrators.all()]
        return ', '.join(emails) if emails else '-'
    admin_emails.short_description = 'Administradores'

    def observation_count(self, obj):
        return obj._observation_count
    observation_count.short_description = 'Muestras'
    observation_count.admin_order_field = '_observation_count'


TOPIC_LANGUAGES = [
    ('es', 'Español'),
    ('en', 'English'),
    ('fr', 'Français'),
    ('pt', 'Português'),
    ('it', 'Italiano'),
    ('de', 'Deutsch'),
]


class TopicAdminForm(forms.ModelForm):
    class Meta:
        model = Topic
        fields = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        topic_data = {}
        if self.instance and isinstance(self.instance.topic, dict):
            topic_data = self.instance.topic
        for code, label in TOPIC_LANGUAGES:
            self.fields[f'topic_{code}'] = forms.CharField(
                label=label,
                required=(code == 'es'),
                initial=topic_data.get(code, ''),
                widget=forms.TextInput(attrs={'size': 60}),
            )

    def clean(self):
        cleaned_data = super().clean()
        topic = {}
        for code, _ in TOPIC_LANGUAGES:
            value = cleaned_data.get(f'topic_{code}', '').strip()
            if value:
                topic[code] = value
        if not topic.get('es'):
            self.add_error('topic_es', 'El nombre en español es obligatorio.')
        cleaned_data['topic'] = topic
        return cleaned_data

    def save(self, commit=True):
        self.instance.topic = self.cleaned_data['topic']
        return super().save(commit=commit)


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    form = TopicAdminForm
    list_display = ['id', 'topic_es', 'topic_en', 'topic_fr', 'topic_pt', 'topic_it', 'topic_de']
    search_fields = ['id']

    def _lang(self, obj, code):
        if isinstance(obj.topic, dict):
            return obj.topic.get(code, '-')
        return '-'

    def topic_es(self, obj): return self._lang(obj, 'es')
    def topic_en(self, obj): return self._lang(obj, 'en')
    def topic_fr(self, obj): return self._lang(obj, 'fr')
    def topic_pt(self, obj): return self._lang(obj, 'pt')
    def topic_it(self, obj): return self._lang(obj, 'it')
    def topic_de(self, obj): return self._lang(obj, 'de')

    topic_es.short_description = 'Español'
    topic_en.short_description = 'English'
    topic_fr.short_description = 'Français'
    topic_pt.short_description = 'Português'
    topic_it.short_description = 'Italiano'
    topic_de.short_description = 'Deutsch'


admin.site.register(ProjectCover)
admin.site.register(HasTag)
admin.site.register(ProjectInvitation)
