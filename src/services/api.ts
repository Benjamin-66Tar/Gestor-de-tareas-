import { Goal, NotificationItem, UserProfile, PlanElemento } from '../domain/types';

const API_BASE = '/api/v1';

/**
 * Generic fetch helper with JSON parsing and fallback support
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`API Error [${response.status}] ${endpoint}: ${errorBody}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// --- Profile Services ---

export async function fetchUserProfile(): Promise<UserProfile> {
  try {
    return await apiRequest<UserProfile>('/profile/');
  } catch (err) {
    console.warn('Falling back to default profile:', err);
    return {
      id: 'local-user',
      username: 'AuraUser',
      email: 'user@aura.app',
      avatarUrl: null,
      themePreference: 'dark',
    };
  }
}

// --- Notification Services ---

export async function fetchUnreadNotificationsCount(): Promise<number> {
  try {
    const data = await apiRequest<{ unread_count: number }>('/notifications/unread-count/');
    return data.unread_count;
  } catch (err) {
    return 3; // Mock fallback
  }
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const data = await apiRequest<{ results: NotificationItem[] } | NotificationItem[]>('/notifications/');
    return Array.isArray(data) ? data : data.results;
  } catch (err) {
    return [
      {
        id: 'notif-1',
        title: 'Meta próxima a vencer',
        message: 'El objetivo de diseño visual vence hoy.',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif-2',
        title: 'Hito completado',
        message: 'Has terminado el 50% de tus hitos de productividad.',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'notif-3',
        title: 'Bienvenido a Aura',
        message: 'Explora tus secciones de Calendario y Objetivos.',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await apiRequest(`/notifications/${id}/read/`, { method: 'POST' });
  } catch (err) {
    console.warn(`Could not mark notification ${id} as read:`, err);
  }
}

// --- Goals Services ---

export async function fetchGoals(params?: { status?: string; category?: string }): Promise<Goal[]> {
  const queryParts: string[] = [];
  if (params?.status && params.status !== 'ALL') {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params?.category && params.category !== 'ALL') {
    queryParts.push(`category=${encodeURIComponent(params.category)}`);
  }
  const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';

  try {
    return await apiRequest<Goal[]>(`/goals/${queryString}`);
  } catch (err) {
    console.warn('Goals API call failed, using local in-memory fallback:', err);
    return [];
  }
}

export async function createGoalApi(goalData: Partial<Goal>): Promise<Goal> {
  const payload = {
    title: goalData.title,
    description: goalData.description || '',
    category: goalData.category || 'General',
    color_hex: goalData.colorHex || '#10B981',
    deadline: goalData.deadline || null,
    progress_mode: goalData.progressMode || 'MILESTONES',
    progress_percentage: goalData.progressPercentage || 0,
    status: goalData.status || 'ACTIVE',
    milestones: (goalData.milestones || []).map((m, idx) => ({
      title: m.title,
      is_completed: m.isCompleted,
      weight: m.weight || 1,
      target_date: m.targetDate || null,
      order: idx,
    })),
  };

  return await apiRequest<Goal>('/goals/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateGoalApi(id: string, goalData: Partial<Goal>): Promise<Goal> {
  const payload: Record<string, any> = {};
  if (goalData.title !== undefined) payload.title = goalData.title;
  if (goalData.description !== undefined) payload.description = goalData.description;
  if (goalData.category !== undefined) payload.category = goalData.category;
  if (goalData.colorHex !== undefined) payload.color_hex = goalData.colorHex;
  if (goalData.deadline !== undefined) payload.deadline = goalData.deadline;
  if (goalData.progressMode !== undefined) payload.progress_mode = goalData.progressMode;
  if (goalData.progressPercentage !== undefined) payload.progress_percentage = goalData.progressPercentage;
  if (goalData.status !== undefined) payload.status = goalData.status;
  if (goalData.milestones !== undefined) {
    payload.milestones = goalData.milestones.map((m, idx) => ({
      id: m.id,
      title: m.title,
      is_completed: m.isCompleted,
      weight: m.weight || 1,
      target_date: m.targetDate || null,
      order: idx,
    }));
  }

  return await apiRequest<Goal>(`/goals/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteGoalApi(id: string): Promise<void> {
  await apiRequest(`/goals/${id}/`, { method: 'DELETE' });
}

export async function toggleMilestoneApi(goalId: string, milestoneId: string): Promise<{
  milestone_id: string;
  is_completed: boolean;
  goal_progress_percentage: number;
  goal_status: string;
}> {
  return await apiRequest(`/goals/${goalId}/milestones/${milestoneId}/toggle/`, {
    method: 'POST',
  });
}

// --- Calendar & Sync Services ---

export async function fetchCalendarEvents(startDate?: string, endDate?: string): Promise<PlanElemento[]> {
  const query = [];
  if (startDate) query.push(`start_date=${startDate}`);
  if (endDate) query.push(`end_date=${endDate}`);
  const qs = query.length ? `?${query.join('&')}` : '';

  try {
    return await apiRequest<PlanElemento[]>(`/calendar/events/${qs}`);
  } catch (err) {
    console.warn('Calendar events fetch failed, returning empty:', err);
    return [];
  }
}
