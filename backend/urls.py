from django.contrib import admin
from django.urls import path
from .views import (
    ElementoAuraListAPI,
    ElementoAuraDetailAPI,
    UserProfileAPI,
    NotificationUnreadCountAPI,
    NotificationListAPI,
    NotificationMarkReadAPI,
    GoalListCreateAPI,
    GoalDetailAPI,
    GoalMilestoneToggleAPI,
    CalendarEventsAPI,
    ProjectListCreateAPI,
    ProjectDetailAPI,
    ProjectTaskListCreateAPI,
    ProjectTaskDetailAPI,
    ProjectTaskStatusAPI,
    TaskSubtaskToggleAPI,
    EventListCreateAPI,
    EventDetailAPI,
    EventStatusAPI,
    VapidPublicKeyAPI,
    PushSubscribeAPI,
    PushUnsubscribeAPI,
    PushTestDispatchAPI,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/elementos/', ElementoAuraListAPI.as_view(), name='elemento-aura-list'),
    path('api/v1/elementos/<int:pk>/', ElementoAuraDetailAPI.as_view(), name='elemento-aura-detail'),
    
    # Profile
    path('api/v1/profile/', UserProfileAPI.as_view(), name='user-profile'),
    
    # Notifications
    path('api/v1/notifications/unread-count/', NotificationUnreadCountAPI.as_view(), name='notifications-unread-count'),
    path('api/v1/notifications/', NotificationListAPI.as_view(), name='notifications-list'),
    path('api/v1/notifications/<uuid:pk>/read/', NotificationMarkReadAPI.as_view(), name='notification-mark-read'),
    path('api/v1/notifications/push/public-key/', VapidPublicKeyAPI.as_view(), name='push-public-key'),
    path('api/v1/notifications/push/subscribe/', PushSubscribeAPI.as_view(), name='push-subscribe'),
    path('api/v1/notifications/push/unsubscribe/', PushUnsubscribeAPI.as_view(), name='push-unsubscribe'),
    path('api/v1/notifications/push/test/', PushTestDispatchAPI.as_view(), name='push-test-dispatch'),
    
    # Goals
    path('api/v1/goals/', GoalListCreateAPI.as_view(), name='goals-list-create'),
    path('api/v1/goals/<uuid:pk>/', GoalDetailAPI.as_view(), name='goal-detail'),
    path('api/v1/goals/<uuid:goal_id>/milestones/<uuid:milestone_id>/toggle/', GoalMilestoneToggleAPI.as_view(), name='milestone-toggle'),
    
    # Projects
    path('api/v1/projects/', ProjectListCreateAPI.as_view(), name='projects-list-create'),
    path('api/v1/projects/<uuid:pk>/', ProjectDetailAPI.as_view(), name='project-detail'),
    path('api/v1/projects/<uuid:project_id>/tasks/', ProjectTaskListCreateAPI.as_view(), name='project-tasks-list-create'),
    path('api/v1/tasks/<uuid:pk>/', ProjectTaskDetailAPI.as_view(), name='task-detail'),
    path('api/v1/tasks/<uuid:pk>/status/', ProjectTaskStatusAPI.as_view(), name='task-status'),
    path('api/v1/subtasks/<uuid:pk>/toggle/', TaskSubtaskToggleAPI.as_view(), name='subtask-toggle'),
    
    # Events
    path('api/v1/events/', EventListCreateAPI.as_view(), name='events-list-create'),
    path('api/v1/events/<uuid:pk>/', EventDetailAPI.as_view(), name='event-detail'),
    path('api/v1/events/<uuid:pk>/status/', EventStatusAPI.as_view(), name='event-status'),

    # Calendar Sync
    path('api/v1/calendar/events/', CalendarEventsAPI.as_view(), name='calendar-events-sync'),
]

