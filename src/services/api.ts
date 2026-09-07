import { Goal, NotificationItem, UserProfile, PlanElemento, Project, ProjectTask, TaskSubtask, TaskStatus } from '../domain/types';

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

// --- Projects & Tasks Services ---

export function transformTaskFromApi(raw: any): ProjectTask {
  return {
    id: raw.id,
    projectId: raw.project || raw.project_id,
    title: raw.title,
    description: raw.description,
    status: raw.status,
    priority: raw.priority,
    deadline: raw.deadline,
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
    deadline: taskData.deadline || null,
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
  if (taskData.deadline !== undefined) payload.deadline = taskData.deadline;
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

