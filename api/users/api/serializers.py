from rest_framework import serializers, generics
from django.contrib.auth.models import User
from users.models import Profile
from organizations.models import Organization
from project.models import Project, ProjectCover
from django_countries.fields import Country
from django_countries import countries
from dj_rest_auth.registration.serializers import RegisterSerializer as DefaultRegisterSerializer
from django.utils import timezone
import re

class ProjectSummarySerializer(serializers.ModelSerializer):
    cover = serializers.SerializerMethodField()
    observation_count = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'cover', 'observation_count', 'likes_count']
    
    def get_cover(self, obj):
        cover = obj.covers.first()
        if cover:
            return ProjectCoverSerializer(cover).data
        return None
    
    def get_observation_count(self, obj):
        # Contar observaciones a través del fieldform
        if hasattr(obj, 'fieldform'):
            return obj.fieldform.observations.count()
        return 0
    
    def get_likes_count(self, obj):
        return obj.likes.count()

class ProjectCoverSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCover
        fields = ['image']

class OrganizationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'principalName']

class OrganizationDetailSerializer(serializers.ModelSerializer):
    user_role = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = ['id', 'principalName', 'logo', 'cover', 'description', 'type', 'user_role']
    
    def get_user_role(self, obj):
        user = self.context.get('user')
        if not user:
            return None

        if obj.creator_id == user.id:
            return 'creator'
        elif obj.administrators.filter(id=user.id).exists():
            return 'administrator'
        elif obj.members.filter(id=user.id).exists():
            return 'member'
        return None
    
    def get_type(self, obj):
        from organizations.models import Type
        types = obj.type.all()
        return [{'id': t.id, 'type': t.type} for t in types]

class CustomCountryFieldSerializer(serializers.Field):
    def to_representation(self, value):
        country_code = str(value)  # Convertir el valor directamente a un string.
        country_name = dict(countries).get(country_code, country_code)
        return {
            "code": country_code,
            "name": country_name
        }
    
    def to_internal_value(self, data):
        country = Country(data)
        if not country.code:
            raise serializers.ValidationError("Código de país no válido. Use código ISO de 2 letras (ej: ES, FR, US).")
        return country.code

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    created_organizations = serializers.SerializerMethodField()
    admin_organizations = serializers.SerializerMethodField()
    member_organizations = serializers.SerializerMethodField()
    participated_projects = serializers.SerializerMethodField()
    created_projects = serializers.SerializerMethodField()
    liked_projects = serializers.SerializerMethodField()
    country = CustomCountryFieldSerializer()
    cover = serializers.ImageField(required=False)

    class Meta:
        model = Profile
        fields = ['username', 'email', 'first_name', 'last_name', 'biography', 'visibility', 'country', 'cover', 'created_organizations', 'admin_organizations', 'member_organizations', 'participated_projects', 'created_projects', 'liked_projects']

    def get_admin_organizations(self, obj):
        organizations = Organization.objects.filter(administrators__in=[obj.user]).prefetch_related('type')
        return OrganizationDetailSerializer(organizations, many=True, context={'user': obj.user}).data

    def get_member_organizations(self, obj):
        organizations = Organization.objects.filter(members__in=[obj.user]).prefetch_related('type')
        return OrganizationDetailSerializer(organizations, many=True, context={'user': obj.user}).data

    def get_created_organizations(self, obj):
        organizations = Organization.objects.filter(creator=obj.user).prefetch_related('type')
        return OrganizationDetailSerializer(organizations, many=True, context={'user': obj.user}).data

    def get_participated_projects(self, obj):
        # Query directa evitando la doble consulta
        projects = Project.objects.filter(
            fieldform__observations__creator=obj.user
        ).distinct()
        return ProjectSummarySerializer(projects, many=True).data

    def get_created_projects(self, obj): 
        projects = Project.objects.filter(creator=obj.user)
        return ProjectSummarySerializer(projects, many=True).data
    
    def get_liked_projects(self, obj):
        return ProjectSummarySerializer(obj.user.liked_projects.all(), many=True).data
    
    def update(self, instance, validated_data):
        # Extract user data
        user_data = {}
        if 'user' in validated_data:
            user_data = validated_data.pop('user')
        
        # Update user fields
        if user_data:
            user = instance.user
            user.first_name = user_data.get('first_name', user.first_name)
            user.last_name = user_data.get('last_name', user.last_name)
            user.save()
        
        # Update profile fields
        return super().update(instance, validated_data)
    

class CustomRegisterSerializer(DefaultRegisterSerializer):
    username = serializers.CharField(required=False, allow_blank=True, default='')
    terms_version = serializers.CharField(required=False, allow_blank=True, default='')
    privacy_version = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_username(self, username):
        if not username:
            return username
        return super().validate_username(username)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        username = self.validated_data.get('username', '').strip()
        if not username:
            base = self.validated_data.get('email', '').split('@')[0]
            base = re.sub(r'[^\w.@+-]', '_', base) or 'user'
            username = base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f'{base}{counter}'
                counter += 1
        data['username'] = username
        data['terms_version'] = self.validated_data.get('terms_version', '')
        data['privacy_version'] = self.validated_data.get('privacy_version', '')
        return data

    def custom_signup(self, request, user):
        terms_version = self.cleaned_data.get('terms_version', '')
        privacy_version = self.cleaned_data.get('privacy_version', '')
        now = timezone.now()
        profile = user.profile
        if terms_version:
            profile.terms_version = terms_version
            profile.terms_accepted_at = now
        if privacy_version:
            profile.privacy_version = privacy_version
            profile.privacy_accepted_at = now
        profile.save()


class UserDetailsSerializer(serializers.ModelSerializer):
    terms_accepted_at = serializers.DateTimeField(source='profile.terms_accepted_at', read_only=True)
    terms_version = serializers.CharField(source='profile.terms_version', read_only=True)
    privacy_accepted_at = serializers.DateTimeField(source='profile.privacy_accepted_at', read_only=True)
    privacy_version = serializers.CharField(source='profile.privacy_version', read_only=True)

    class Meta:
        model = User
        fields = ['pk', 'email', 'terms_accepted_at', 'terms_version', 'privacy_accepted_at', 'privacy_version']
        read_only_fields = fields


class ConsentSerializer(serializers.Serializer):
    terms_version = serializers.CharField()
    privacy_version = serializers.CharField()

    def update_consent(self, user):
        now = timezone.now()
        profile = user.profile
        profile.terms_version = self.validated_data['terms_version']
        profile.terms_accepted_at = now
        profile.privacy_version = self.validated_data['privacy_version']
        profile.privacy_accepted_at = now
        profile.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'profile']
        extra_kwargs = {'password': {'write_only': True, 'required': True}}