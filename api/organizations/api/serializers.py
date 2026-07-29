from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from organizations.models import Organization, Type, Invitation
from django.contrib.auth.models import User
from users.api.serializers import UserSerializer
from django.utils import timezone
from field_forms.translation import get_language_from_request, resolve_translation, ISO_3166_1_ALPHA2

class TypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Type
        fields = '__all__'

class OrganizationSerializer(serializers.ModelSerializer):
    type = TypeSerializer(many=True, read_only=True)
    creator = UserSerializer(read_only=True)
    administrators = UserSerializer(many=True, read_only=True)
    members = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Organization
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        raw = request and request.query_params.get('raw', '').lower() == 'true'
        if not raw:
            lang = get_language_from_request(request)
            ret['description'] = resolve_translation(ret.get('description'), lang)
        return ret

class OrganizationSerializerCreateUpdate(serializers.ModelSerializer):
    type = serializers.PrimaryKeyRelatedField(
        queryset=Type.objects.all(),
        many=True,
        required=False)
    creator = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False)
    administrators = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False)
    members = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False)
    logo = serializers.ImageField(required=False)
    cover = serializers.ImageField(required=False)
    is_creator = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = '__all__'

    def get_is_creator(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.creator == request.user

    def get_is_admin(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.administrators.filter(id=request.user.id).exists()

    def get_is_member(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        user = request.user
        return (
            obj.creator == user or
            obj.administrators.filter(id=user.id).exists() or
            obj.members.filter(id=user.id).exists()
        )

    def _user_display(self, user):
        try:
            profile = user.profile
        except Exception:
            profile = None
        if profile and profile.visibility:
            full_name = f"{user.first_name} {user.last_name}".strip()
            return {"id": user.id, "name": full_name or user.username}
        return {"id": user.id, "name": "Anonymous"}

    def to_representation(self, instance):
        ret = super().to_representation(instance)

        # Collect all members: creator + admins + explicit members
        seen = set()
        all_members = []

        def add_user(user):
            if user.id not in seen:
                seen.add(user.id)
                all_members.append(self._user_display(user))

        if instance.creator:
            add_user(instance.creator)
        for user in instance.administrators.select_related('profile').all():
            add_user(user)
        for user in instance.members.select_related('profile').all():
            add_user(user)

        ret['members'] = all_members
        request = self.context.get('request')
        raw = request and request.query_params.get('raw', '').lower() == 'true'
        if not raw:
            lang = get_language_from_request(request)
            ret['description'] = resolve_translation(ret.get('description'), lang)
        return ret

    def validate_countries(self, value):
        if not value:
            return value
        invalid = [c for c in value if not isinstance(c, str) or c.upper() not in ISO_3166_1_ALPHA2]
        if invalid:
            raise serializers.ValidationError(
                f'Códigos de país no válidos: {invalid}. Se esperan códigos ISO 3166-1 alpha-2.'
            )
        return [c.upper() for c in value]

    def validate(self, data):
        is_global = data.get('is_global', getattr(self.instance, 'is_global', True))
        if not is_global and not data.get('countries', getattr(self.instance, 'countries', [])):
            raise serializers.ValidationError({'countries': _('Debe especificar al menos un país si la organización no es global.')})
        return data

    def to_internal_value(self, data):
        # Limpia 'administrators' y 'members' si contienen cadenas vacías
        data = super().to_internal_value(data)
        for key in ['administrators', 'members']:
            if key in data and not isinstance(data[key], list):
                if data[key]:
                    data[key] = [data[key]]
                else:
                    data[key] = []
        return data

    def create(self, validated_data, *args, **kwargs):
        type = validated_data.pop('type')
        administrators_data = validated_data.pop('administrators', [])
        members_data = validated_data.pop('members', [])

        organization = Organization.objects.create(**validated_data)
        for type in type:
            organization.type.add(type)

        if administrators_data:
            organization.administrators.set(administrators_data)
        if members_data:
            organization.members.set(members_data)

        organization.save()
        return organization

    def update(self, instance, validated_data):
        type = validated_data.pop('type', None) # Añade un valor predeterminado None
        creator_data = validated_data.pop('creator', None)
        administrators_data = validated_data.pop('administrators', None)
        members_data = validated_data.pop('members', None)

        instance.principalName = validated_data.get('principalName', instance.principalName)
        instance.url = validated_data.get('url', instance.url)
        instance.description = validated_data.get('description', instance.description)
        instance.contactName = validated_data.get('contactName', instance.contactName)
        instance.contactMail = validated_data.get('contactMail', instance.contactMail)
        instance.logo = validated_data.get('logo', instance.logo)
        instance.cover = validated_data.get('cover', instance.cover)
        instance.countries = validated_data.get('countries', instance.countries)
        instance.is_global = validated_data.get('is_global', instance.is_global)
        
        #for type in type:
        #    instance.type.add(type)
        if type is not None:  # Solo actualiza el campo 'type' si está presente en la solicitud
            instance.type.set(type)

        if creator_data and self.context['request'].user == instance.creator:
            instance.creator = creator_data

        if administrators_data:
            instance.administrators.set(administrators_data)

        if members_data:
            instance.members.set(members_data)
    
        instance.save()
        return instance

class InvitationSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.principalName', read_only=True)
    invited_by_name = serializers.CharField(source='invited_by.username', read_only=True)
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = Invitation
        fields = ['id', 'organization', 'organization_name', 'email', 'role', 'status', 'invited_by', 'invited_by_name', 'created_at', 'expires_at', 'is_expired']
        read_only_fields = ['id', 'status', 'invited_by', 'created_at', 'expires_at']
    
    def get_is_expired(self, obj):
        return obj.is_expired()

class InvitationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ['email', 'role']
    
    def validate_email(self, value):
        return value.lower()