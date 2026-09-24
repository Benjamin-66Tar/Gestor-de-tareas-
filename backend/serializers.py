from rest_framework import serializers
from django.db import transaction
from .models import ElementoAura, UserProfile, Notification, Goal, GoalMilestone, Project, ProjectTask, TaskSubtask, EventItem, PushSubscription

class ElementoAuraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElementoAura
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, default='AuraUser')
    email = serializers.EmailField(source='user.email', read_only=True, default='user@aura.app')

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'avatar_url', 'theme_preference']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'created_at']


class GoalMilestoneSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = GoalMilestone
        fields = ['id', 'title', 'is_completed', 'weight', 'target_date', 'order']


class GoalSerializer(serializers.ModelSerializer):
    milestones = GoalMilestoneSerializer(many=True, required=False)

    class Meta:
        model = Goal
        fields = [
            'id', 'title', 'description', 'category', 'color_hex',
            'start_date', 'deadline', 'progress_mode', 'progress_percentage', 'status',
            'milestones', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        with transaction.atomic():
            milestones_data = validated_data.pop('milestones', [])
            goal = Goal.objects.create(**validated_data)
            for idx, milestone_data in enumerate(milestones_data):
                milestone_data.pop('id', None)
                if 'order' not in milestone_data:
                    milestone_data['order'] = idx
                GoalMilestone.objects.create(goal=goal, **milestone_data)
            return goal

    def update(self, instance, validated_data):
        with transaction.atomic():
            milestones_data = validated_data.pop('milestones', None)
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if milestones_data is not None:
                existing_ids = []
                for idx, m_data in enumerate(milestones_data):
                    m_id = m_data.get('id', None)
                    if 'order' not in m_data:
                        m_data['order'] = idx
                    if m_id and GoalMilestone.objects.filter(id=m_id, goal=instance).exists():
                        m_obj = GoalMilestone.objects.get(id=m_id, goal=instance)
                        for k, v in m_data.items():
                            if k != 'id':
                                setattr(m_obj, k, v)
                        m_obj.save()
                        existing_ids.append(m_obj.id)
                    else:
                        m_data.pop('id', None)
                        new_m = GoalMilestone.objects.create(goal=instance, **m_data)
                        existing_ids.append(new_m.id)
                # Remove milestones that were deleted in the UI
                instance.milestones.exclude(id__in=existing_ids).delete()

            return instance


class TaskSubtaskSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = TaskSubtask
        fields = ['id', 'title', 'is_completed', 'order']


class ProjectTaskSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    subtasks = TaskSubtaskSerializer(many=True, required=False)
    project_id = serializers.UUIDField(source='project.id', read_only=True)

    class Meta:
        model = ProjectTask
        fields = [
            'id', 'project', 'project_id', 'title', 'description',
            'status', 'priority', 'deadline', 'order', 'subtasks',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'project': {'required': False}
        }

    def create(self, validated_data):
        with transaction.atomic():
            subtasks_data = validated_data.pop('subtasks', [])
            task = ProjectTask.objects.create(**validated_data)
            for idx, s_data in enumerate(subtasks_data):
                s_data.pop('id', None)
                if 'order' not in s_data:
                    s_data['order'] = idx
                TaskSubtask.objects.create(task=task, **s_data)
            return task

    def update(self, instance, validated_data):
        with transaction.atomic():
            subtasks_data = validated_data.pop('subtasks', None)
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if subtasks_data is not None:
                existing_ids = []
                for idx, s_data in enumerate(subtasks_data):
                    s_id = s_data.get('id', None)
                    if 'order' not in s_data:
                        s_data['order'] = idx
                    if s_id and TaskSubtask.objects.filter(id=s_id, task=instance).exists():
                        s_obj = TaskSubtask.objects.get(id=s_id, task=instance)
                        for k, v in s_data.items():
                            if k != 'id':
                                setattr(s_obj, k, v)
                        s_obj.save()
                        existing_ids.append(s_obj.id)
                    else:
                        s_data.pop('id', None)
                        new_s = TaskSubtask.objects.create(task=instance, **s_data)
                        existing_ids.append(new_s.id)
                instance.subtasks.exclude(id__in=existing_ids).delete()

            return instance


class ProjectSerializer(serializers.ModelSerializer):
    tasks = ProjectTaskSerializer(many=True, read_only=True)
    total_tasks = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
    goal_title = serializers.CharField(source='goal.title', read_only=True, default=None)

    class Meta:
        model = Project
        fields = [
            'id', 'user', 'goal', 'goal_title', 'title', 'description',
            'color_hex', 'status', 'progress_percentage', 'tasks',
            'total_tasks', 'completed_tasks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'progress_percentage', 'created_at', 'updated_at']

    def get_total_tasks(self, obj):
        if hasattr(obj, 'annotated_total_tasks'):
            return obj.annotated_total_tasks
        return obj.tasks.count()

    def get_completed_tasks(self, obj):
        if hasattr(obj, 'annotated_completed_tasks'):
            return obj.annotated_completed_tasks
        return obj.tasks.filter(status='DONE').count()


class EventItemSerializer(serializers.ModelSerializer):
    time_block = serializers.SerializerMethodField()

    class Meta:
        model = EventItem
        fields = [
            'id', 'user', 'title', 'description', 'start_time', 'end_time',
            'location', 'meeting_url', 'category', 'color_hex', 'status',
            'reminder_minutes', 'time_block', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'time_block', 'created_at', 'updated_at']

    def validate(self, data):
        start_time = data.get('start_time') or (self.instance.start_time if self.instance else None)
        end_time = data.get('end_time') or (self.instance.end_time if self.instance else None)

        if start_time and end_time and end_time < start_time:
            raise serializers.ValidationError({
                "end_time": "La fecha y hora de finalización no puede ser anterior a la de inicio."
            })
        return data

    def get_time_block(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        now = timezone.now()

        if obj.end_time < now:
            return 'PAST'

        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)

        if obj.start_time <= today_end and obj.end_time >= today_start:
            return 'TODAY'

        days_to_sunday = 6 - now.weekday()
        end_of_week = (today_start + timedelta(days=days_to_sunday)).replace(hour=23, minute=59, second=59, microsecond=999999)

        if obj.start_time <= end_of_week:
            return 'THIS_WEEK'

        return 'UPCOMING'


class PushSubscriptionKeysSerializer(serializers.Serializer):
    p256dh = serializers.CharField(max_length=255)
    auth = serializers.CharField(max_length=255)


class PushSubscriptionSerializer(serializers.ModelSerializer):
    keys = PushSubscriptionKeysSerializer(write_only=True)

    class Meta:
        model = PushSubscription
        fields = ['id', 'endpoint', 'keys', 'user_agent', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        keys_data = validated_data.pop('keys')
        endpoint = validated_data.get('endpoint')
        user = validated_data.get('user', None)
        user_agent = validated_data.get('user_agent', '')
        p256dh = keys_data.get('p256dh')
        auth = keys_data.get('auth')

        subscription, created = PushSubscription.objects.update_or_create(
            user=user,
            endpoint=endpoint,
            defaults={
                'p256dh': p256dh,
                'auth': auth,
                'user_agent': user_agent,
            }
        )
        return subscription

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['keys'] = {
            'p256dh': instance.p256dh,
            'auth': instance.auth
        }
        return ret


# --- Authentication Serializers ---
from django.contrib.auth.models import User

class UserRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    password_confirm = serializers.CharField(min_length=6, write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está registrado.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                "password_confirm": "Las contraseñas no coinciden."
            })
        return data

    def create(self, validated_data):
        username = validated_data['username']
        email = validated_data['email']
        password = validated_data['password']

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        UserProfile.objects.get_or_create(user=user)
        return user


class UserLoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class UserSessionSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    theme_preference = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar_url', 'theme_preference']

    def get_avatar_url(self, obj):
        profile = getattr(obj, 'userprofile', None)
        return profile.avatar_url if profile else None

    def get_theme_preference(self, obj):
        profile = getattr(obj, 'userprofile', None)
        return profile.theme_preference if profile else 'dark'


