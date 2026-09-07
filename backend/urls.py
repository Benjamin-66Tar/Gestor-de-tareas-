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
    
    # Goals
    path('api/v1/goals/', GoalListCreateAPI.as_view(), name='goals-list-create'),
    path('api/v1/goals/<uuid:pk>/', GoalDetailAPI.as_view(), name='goal-detail'),
    path('api/v1/goals/<uuid:goal_id>/milestones/<uuid:milestone_id>/toggle/', GoalMilestoneToggleAPI.as_view(), name='milestone-toggle'),
    
    # Calendar Sync
    path('api/v1/calendar/events/', CalendarEventsAPI.as_view(), name='calendar-events-sync'),
]

