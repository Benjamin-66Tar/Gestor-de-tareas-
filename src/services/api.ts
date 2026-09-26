import {
  Goal, GoalMilestone, NotificationItem, UserProfile, PlanElemento,
  Project, ProjectTask, TaskSubtask, TaskStatus, EventItem, EventStatus,
  PushSubscriptionDTO, PushSubscriptionKeys,
  LoginCredentials, RegisterData, AuthResponse, AuthSessionUser
} from '../domain/types';

export const API_BASE = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api/v1`;

function getStoredToken(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('aura_session_token') : null;
  } catch {
    return null;
  }
}

/**
 * Generic fetch helper with JSON parsing, Authorization header, and fallback support
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getStoredToken();
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor backend. Asegúrate de configurar la variable VITE_API_URL.');
  }

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let errorMessage = '';
    if (contentType.includes('application/json')) {
      const errorBody = await response.text().catch(() => '');
      try {
        const parsed = JSON.parse(errorBody);
        errorMessage = parsed.error || parsed.detail || parsed.message;
        if (!errorMessage && parsed.details && typeof parsed.details === 'object') {
          const firstKey = Object.keys(parsed.details)[0];
          const val = parsed.details[firstKey];
          errorMessage = Array.isArray(val) ? val[0] : String(val);
        }
      } catch {
        // not JSON
      }
    }

    if (!errorMessage) {
      if (response.status === 500) {
        errorMessage = 'Error en el servidor backend (500). Asegúrate de que el servicio Django esté en ejecución.';
      } else {
        errorMessage = `Error de servidor [${response.status}] en ${endpoint}`;
      }
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  if (!contentType.includes('application/json')) {
    throw new Error('El backend de Aura aún no está disponible o no responde JSON. Si estás en Vercel, configura la variable de entorno VITE_API_URL.');
  }

  return response.json();
}

// --- Profile Services ---

export async function fetchUserProfile(): Promise<UserProfile> {
  try {
    const data = await apiRequest<any>('/profile/');
    return {
      id: data.id || 'local-user',
      username: data.username || 'AuraUser',
      email: data.email || 'user@aura.app',
      avatarUrl: data.avatar_url ?? data.avatarUrl ?? null,
      themePreference: data.theme_preference ?? data.themePreference ?? 'dark',
    };
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
    const data = await apiRequest<{ results: any[] } | any[]>('/notifications/');
    const rawList = Array.isArray(data) ? data : (data?.results || []);
    return rawList.map((item: any) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      isRead: item.is_read ?? item.isRead ?? false,
      createdAt: item.created_at ?? item.createdAt ?? new Date().toISOString(),
    }));
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

export function transformMilestoneFromApi(raw: any): GoalMilestone {
  return {
    id: raw.id,
    goalId: raw.goal_id ?? raw.goalId,
    title: raw.title || '',
    isCompleted: Boolean(raw.is_completed ?? raw.isCompleted),
    weight: typeof raw.weight === 'number' ? raw.weight : 1,
    targetDate: raw.target_date ?? raw.targetDate ?? null,
    order: typeof raw.order === 'number' ? raw.order : 0,
  };
}

export function transformGoalFromApi(raw: any): Goal {
  return {
    id: raw.id,
    title: raw.title || '',
    description: raw.description || '',
    category: raw.category || 'General',
    colorHex: raw.color_hex ?? raw.colorHex ?? '#10B981',
    startDate: raw.start_date ?? raw.startDate ?? null,
    deadline: raw.deadline || null,
    reminderMinutes: raw.reminder_minutes ?? raw.reminderMinutes ?? 0,
    progressMode: raw.progress_mode ?? raw.progressMode ?? 'MILESTONES',
    progressPercentage: typeof raw.progress_percentage === 'number'
      ? raw.progress_percentage
      : (typeof raw.progressPercentage === 'number' ? raw.progressPercentage : 0),
    status: raw.status || 'ACTIVE',
    milestones: Array.isArray(raw.milestones)
      ? raw.milestones.map(transformMilestoneFromApi)
      : [],
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updated_at ?? raw.updatedAt ?? new Date().toISOString(),
  };
}

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
    const rawGoals = await apiRequest<any[]>(`/goals/${queryString}`);
    return Array.isArray(rawGoals) ? rawGoals.map(transformGoalFromApi) : [];
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
    start_date: goalData.startDate || (goalData as any).start_date || null,
    deadline: goalData.deadline || null,
    reminder_minutes: goalData.reminderMinutes !== undefined
      ? goalData.reminderMinutes
      : ((goalData as any).reminder_minutes !== undefined ? (goalData as any).reminder_minutes : 0),
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

  const createdRaw = await apiRequest<any>('/goals/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return transformGoalFromApi(createdRaw);
}

export async function updateGoalApi(id: string, goalData: Partial<Goal>): Promise<Goal> {
  const payload: Record<string, any> = {};
  if (goalData.title !== undefined) payload.title = goalData.title;
  if (goalData.description !== undefined) payload.description = goalData.description;
  if (goalData.category !== undefined) payload.category = goalData.category;
  if (goalData.colorHex !== undefined) payload.color_hex = goalData.colorHex;
  if (goalData.startDate !== undefined) payload.start_date = goalData.startDate;
  if ((goalData as any).start_date !== undefined) payload.start_date = (goalData as any).start_date;
  if (goalData.deadline !== undefined) payload.deadline = goalData.deadline;
  if (goalData.reminderMinutes !== undefined) payload.reminder_minutes = goalData.reminderMinutes;
  if ((goalData as any).reminder_minutes !== undefined) payload.reminder_minutes = (goalData as any).reminder_minutes;
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

  const updatedRaw = await apiRequest<any>(`/goals/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return transformGoalFromApi(updatedRaw);
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

// --- Projects & Tasks Services ---

export function transformTaskFromApi(raw: any): ProjectTask {
  return {
    id: raw.id,
    projectId: raw.project || raw.project_id,
    title: raw.title,
    description: raw.description,
    status: raw.status,
    priority: raw.priority,
    startDate: raw.start_date ?? raw.startDate ?? null,
    deadline: raw.deadline,
    reminderMinutes: raw.reminder_minutes ?? raw.reminderMinutes ?? 0,
    order: raw.order ?? 0,
    subtasks: (raw.subtasks || []).map((s: any) => ({
      id: s.id,
      taskId: raw.id,
      title: s.title,
      isCompleted: s.is_completed,
      order: s.order ?? 0,
    })),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function transformProjectFromApi(raw: any): Project {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    colorHex: raw.color_hex,
    status: raw.status,
    progressPercentage: raw.progress_percentage ?? 0,
    goalId: raw.goal,
    totalTasks: raw.total_tasks ?? (raw.tasks ? raw.tasks.length : 0),
    completedTasks: raw.completed_tasks ?? (raw.tasks ? raw.tasks.filter((t: any) => t.status === 'DONE').length : 0),
    tasks: raw.tasks ? raw.tasks.map(transformTaskFromApi) : undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export async function fetchProjects(params?: { status?: string; search?: string }): Promise<Project[]> {
  const queryParts: string[] = [];
  if (params?.status && params.status !== 'ALL') {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params?.search) {
    queryParts.push(`search=${encodeURIComponent(params.search)}`);
  }
  const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';

  try {
    const rawList = await apiRequest<any[]>(`/projects/${queryString}`);
    return rawList.map(transformProjectFromApi);
  } catch (err) {
    console.warn('Projects API call failed, using empty fallback:', err);
    return [];
  }
}

export async function fetchProjectById(id: string): Promise<Project> {
  const raw = await apiRequest<any>(`/projects/${id}/`);
  return transformProjectFromApi(raw);
}

export async function createProjectApi(projectData: Partial<Project>): Promise<Project> {
  const payload = {
    title: projectData.title,
    description: projectData.description || '',
    color_hex: projectData.colorHex || '#6366F1',
    status: projectData.status || 'ACTIVE',
    goal: projectData.goalId || null,
  };

  const raw = await apiRequest<any>('/projects/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return transformProjectFromApi(raw);
}

export async function updateProjectApi(id: string, projectData: Partial<Project>): Promise<Project> {
  const payload: Record<string, any> = {};
  if (projectData.title !== undefined) payload.title = projectData.title;
  if (projectData.description !== undefined) payload.description = projectData.description;
  if (projectData.colorHex !== undefined) payload.color_hex = projectData.colorHex;
  if (projectData.status !== undefined) payload.status = projectData.status;
  if (projectData.goalId !== undefined) payload.goal = projectData.goalId;

  const raw = await apiRequest<any>(`/projects/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return transformProjectFromApi(raw);
}

export async function deleteProjectApi(id: string): Promise<void> {
  await apiRequest(`/projects/${id}/`, { method: 'DELETE' });
}

export async function fetchProjectTasks(projectId: string): Promise<ProjectTask[]> {
  try {
    const rawList = await apiRequest<any[]>(`/projects/${projectId}/tasks/`);
    return rawList.map(transformTaskFromApi);
  } catch (err) {
    console.warn('Fetch tasks failed:', err);
    return [];
  }
}

export async function createProjectTaskApi(projectId: string, taskData: Partial<ProjectTask>): Promise<ProjectTask> {
  const payload = {
    title: taskData.title,
    description: taskData.description || '',
    status: taskData.status || 'TODO',
    priority: taskData.priority || 'MEDIUM',
    start_date: taskData.startDate || (taskData as any).start_date || null,
    deadline: taskData.deadline || null,
    reminder_minutes: taskData.reminderMinutes !== undefined
      ? taskData.reminderMinutes
      : ((taskData as any).reminder_minutes !== undefined ? (taskData as any).reminder_minutes : 0),
    subtasks: (taskData.subtasks || []).map((s, idx) => ({
      title: s.title,
      is_completed: s.isCompleted,
      order: idx,
    })),
  };

  const raw = await apiRequest<any>(`/projects/${projectId}/tasks/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return transformTaskFromApi(raw);
}

export async function updateProjectTaskApi(taskId: string, taskData: Partial<ProjectTask>): Promise<ProjectTask> {
  const payload: Record<string, any> = {};
  if (taskData.title !== undefined) payload.title = taskData.title;
  if (taskData.description !== undefined) payload.description = taskData.description;
  if (taskData.status !== undefined) payload.status = taskData.status;
  if (taskData.priority !== undefined) payload.priority = taskData.priority;
  if (taskData.startDate !== undefined) payload.start_date = taskData.startDate;
  if ((taskData as any).start_date !== undefined) payload.start_date = (taskData as any).start_date;
  if (taskData.deadline !== undefined) payload.deadline = taskData.deadline;
  if (taskData.reminderMinutes !== undefined) payload.reminder_minutes = taskData.reminderMinutes;
  if ((taskData as any).reminder_minutes !== undefined) payload.reminder_minutes = (taskData as any).reminder_minutes;
  if (taskData.subtasks !== undefined) {
    payload.subtasks = taskData.subtasks.map((s, idx) => ({
      id: s.id,
      title: s.title,
      is_completed: s.isCompleted,
      order: idx,
    }));
  }

  const raw = await apiRequest<any>(`/tasks/${taskId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return transformTaskFromApi(raw);
}

export async function updateTaskStatusApi(taskId: string, status: TaskStatus): Promise<{
  task: ProjectTask;
  projectProgressPercentage: number;
  projectStatus: string;
}> {
  const raw = await apiRequest<any>(`/tasks/${taskId}/status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return {
    task: transformTaskFromApi(raw.task),
    projectProgressPercentage: raw.project_progress_percentage,
    projectStatus: raw.project_status,
  };
}

export async function deleteProjectTaskApi(taskId: string): Promise<void> {
  await apiRequest(`/tasks/${taskId}/`, { method: 'DELETE' });
}

export async function toggleSubtaskApi(subtaskId: string): Promise<TaskSubtask> {
  const raw = await apiRequest<any>(`/subtasks/${subtaskId}/toggle/`, {
    method: 'PATCH',
  });
  return {
    id: raw.id,
    title: raw.title,
    isCompleted: raw.is_completed,
    order: raw.order,
  };
}

// --- Events Services ---

export function transformEventFromApi(raw: any): EventItem {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    startTime: raw.start_time ?? raw.startTime,
    endTime: raw.end_time ?? raw.endTime,
    location: raw.location,
    meetingUrl: raw.meeting_url ?? raw.meetingUrl,
    category: raw.category || 'General',
    colorHex: raw.color_hex ?? raw.colorHex ?? '#3B82F6',
    status: raw.status || 'PROGRAMMED',
    reminderMinutes: raw.reminder_minutes ?? raw.reminderMinutes ?? 15,
    timeBlock: raw.time_block ?? raw.timeBlock,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  };
}

export async function fetchEvents(params?: { status?: string; category?: string; time_block?: string; search?: string }): Promise<EventItem[]> {
  const queryParts: string[] = [];
  if (params?.status && params.status !== 'ALL') {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params?.category && params.category !== 'ALL') {
    queryParts.push(`category=${encodeURIComponent(params.category)}`);
  }
  if (params?.time_block && params.time_block !== 'ALL') {
    queryParts.push(`time_block=${encodeURIComponent(params.time_block)}`);
  }
  if (params?.search) {
    queryParts.push(`search=${encodeURIComponent(params.search)}`);
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  try {
    const data = await apiRequest<any[]>(`/events/${queryString}`);
    return data.map(transformEventFromApi);
  } catch (err) {
    console.warn('Failed to fetch events from backend:', err);
    return [];
  }
}

export async function createEventApi(eventData: Partial<EventItem>): Promise<EventItem> {
  const payload: Record<string, any> = {
    title: eventData.title,
    description: eventData.description,
    start_time: eventData.startTime,
    end_time: eventData.endTime,
    location: eventData.location,
    meeting_url: eventData.meetingUrl,
    category: eventData.category || 'General',
    color_hex: eventData.colorHex || '#3B82F6',
    status: eventData.status || 'PROGRAMMED',
    reminder_minutes: eventData.reminderMinutes ?? 15,
  };

  const raw = await apiRequest<any>('/events/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return transformEventFromApi(raw);
}

export async function updateEventApi(eventId: string, eventData: Partial<EventItem>): Promise<EventItem> {
  const payload: Record<string, any> = {};
  if (eventData.title !== undefined) payload.title = eventData.title;
  if (eventData.description !== undefined) payload.description = eventData.description;
  if (eventData.startTime !== undefined) payload.start_time = eventData.startTime;
  if (eventData.endTime !== undefined) payload.end_time = eventData.endTime;
  if (eventData.location !== undefined) payload.location = eventData.location;
  if (eventData.meetingUrl !== undefined) payload.meeting_url = eventData.meetingUrl;
  if (eventData.category !== undefined) payload.category = eventData.category;
  if (eventData.colorHex !== undefined) payload.color_hex = eventData.colorHex;
  if (eventData.status !== undefined) payload.status = eventData.status;
  if (eventData.reminderMinutes !== undefined) payload.reminder_minutes = eventData.reminderMinutes;

  const raw = await apiRequest<any>(`/events/${eventId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return transformEventFromApi(raw);
}

export async function updateEventStatusApi(eventId: string, status: EventStatus): Promise<EventItem> {
  const raw = await apiRequest<any>(`/events/${eventId}/status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return transformEventFromApi(raw);
}

export async function deleteEventApi(eventId: string): Promise<void> {
  await apiRequest(`/events/${eventId}/`, { method: 'DELETE' });
}

// --- Web Push Notification Services ---

export async function getVapidPublicKey(): Promise<string> {
  const data = await apiRequest<{ public_key: string }>('/notifications/push/public-key/');
  return data.public_key;
}

export async function subscribePushApi(subscriptionData: {
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
}): Promise<PushSubscriptionDTO> {
  const payload = {
    endpoint: subscriptionData.endpoint,
    keys: subscriptionData.keys,
    user_agent: subscriptionData.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
  };
  const data = await apiRequest<any>('/notifications/push/subscribe/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    id: data.id,
    endpoint: data.endpoint,
    keys: data.keys,
    userAgent: data.user_agent,
    createdAt: data.created_at,
  };
}

export async function unsubscribePushApi(endpoint: string): Promise<{ detail: string; deleted_count: number }> {
  return await apiRequest<{ detail: string; deleted_count: number }>('/notifications/push/unsubscribe/', {
    method: 'POST',
    body: JSON.stringify({ endpoint }),
  });
}

export async function testPushNotificationApi(payload?: {
  title?: string;
  message?: string;
  url?: string;
}): Promise<{ dispatched: number; failed: number }> {
  return await apiRequest<{ dispatched: number; failed: number }>('/notifications/push/test/', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

// --- Welcome & Authentication Services ---

export async function registerApi(data: RegisterData): Promise<AuthResponse> {
  const payload = {
    username: data.username,
    email: data.email,
    password: data.password,
    password_confirm: data.passwordConfirm,
  };
  const res = await apiRequest<any>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    token: res.token,
    user: {
      id: String(res.user.id),
      username: res.user.username,
      email: res.user.email,
      avatarUrl: res.user.avatar_url ?? null,
      themePreference: res.user.theme_preference ?? 'dark',
    },
    message: res.message,
  };
}

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  const payload = {
    identifier: credentials.identifier,
    password: credentials.password,
  };
  const res = await apiRequest<any>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    token: res.token,
    user: {
      id: String(res.user.id),
      username: res.user.username,
      email: res.user.email,
      avatarUrl: res.user.avatar_url ?? null,
      themePreference: res.user.theme_preference ?? 'dark',
    },
  };
}

export async function logoutApi(): Promise<void> {
  try {
    await apiRequest('/auth/logout/', { method: 'POST' });
  } catch (err) {
    console.warn('Logout API notice:', err);
  }
}

export async function getSessionApi(): Promise<{ isAuthenticated: boolean; user: AuthSessionUser | null }> {
  try {
    const res = await apiRequest<any>('/auth/session/');
    if (res.is_authenticated && res.user) {
      return {
        isAuthenticated: true,
        user: {
          id: String(res.user.id),
          username: res.user.username,
          email: res.user.email,
          avatarUrl: res.user.avatar_url ?? null,
          themePreference: res.user.theme_preference ?? 'dark',
        },
      };
    }
    return { isAuthenticated: false, user: null };
  } catch (err) {
    return { isAuthenticated: false, user: null };
  }
}


