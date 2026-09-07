from rest_framework import serializers
from .models import ElementoAura, UserProfile, Notification, Goal, GoalMilestone, Project, ProjectTask, TaskSubtask

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
            'deadline', 'progress_mode', 'progress_percentage', 'status',
            'milestones', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        milestones_data = validated_data.pop('milestones', [])
        goal = Goal.objects.create(**validated_data)
        for idx, milestone_data in enumerate(milestones_data):
            milestone_data.pop('id', None)
            if 'order' not in milestone_data:
                milestone_data['order'] = idx
            GoalMilestone.objects.create(goal=goal, **milestone_data)
        return goal

    def update(self, instance, validated_data):
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
        subtasks_data = validated_data.pop('subtasks', [])
        task = ProjectTask.objects.create(**validated_data)
        for idx, s_data in enumerate(subtasks_data):
            s_data.pop('id', None)
            if 'order' not in s_data:
                s_data['order'] = idx
            TaskSubtask.objects.create(task=task, **s_data)
        return task

    def update(self, instance, validated_data):
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
        return obj.tasks.count()

    def get_completed_tasks(self, obj):
        return obj.tasks.filter(status='DONE').count()

