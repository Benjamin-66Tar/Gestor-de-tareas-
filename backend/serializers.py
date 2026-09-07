from rest_framework import serializers
from .models import ElementoAura, UserProfile, Notification, Goal, GoalMilestone

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

