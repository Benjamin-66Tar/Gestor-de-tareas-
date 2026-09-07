import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  ElementoTipo,
  PlanElemento,
  VistaModoCalendario,
  Goal,
  GoalViewMode,
  GoalFilterCriteria,
  NotificationItem,
  UserProfile,
  Project,
  ProjectTask,
  TaskStatus,
  ProjectFilterCriteria,
  ProjectViewMode,
} from '../domain/types';
import { getGridDateRange } from '../utils/dateUtils';
import * as api from '../services/api';

/**
 * Global application context interface for Aura.
 * Encapsulates navigation, calendar, goals, projects, and notifications.
 */
interface AuraContextProps {
  // --- Navigation & Shell ---
  tabActiva: ElementoTipo;
  setTabActiva: (tab: ElementoTipo) => void;
  userProfile: UserProfile | null;
  unreadNotificationsCount: number;
  notifications: NotificationItem[];
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  profileMenuOpen: boolean;
  setProfileMenuOpen: (open: boolean) => void;
  markNotificationRead: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;

  // --- Calendar Section ---
  elementos: PlanElemento[];
  cargando: boolean;
  error: string | null;
  anioActivo: number;
  mesActivo: number;
  setAnioActivo: (year: number) => void;
  setMesActivo: (month: number) => void;
  vistaCalendario: VistaModoCalendario;
  setVistaCalendario: (vista: VistaModoCalendario) => void;
  fechaSemanaSeleccionada: Date;
  setFechaSemanaSeleccionada: (fecha: Date) => void;
  agrandarSemana: (fechaReferencia: Date) => void;
  irSemanaAnterior: () => void;
  irSemanaSiguiente: () => void;
  fetchElementos: (start?: string, end?: string) => Promise<void>;
  crearElemento: (elemento: Omit<PlanElemento, 'id'>) => Promise<boolean>;
  actualizarElemento: (id: number, elemento: Partial<PlanElemento>) => Promise<boolean>;
  eliminarElemento: (id: number) => Promise<boolean>;

  // --- Objetivos Section ---
  goals: Goal[];
  goalsLoading: boolean;
  goalsError: string | null;
  goalViewMode: GoalViewMode;
  setGoalViewMode: (mode: GoalViewMode) => void;
  goalFilter: GoalFilterCriteria;
  setGoalFilter: React.Dispatch<React.SetStateAction<GoalFilterCriteria>>;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  editingGoal: Goal | null;
  setEditingGoal: (goal: Goal | null) => void;
  fetchGoalsList: () => Promise<void>;
  createGoal: (goalData: Partial<Goal>) => Promise<boolean>;
  updateGoal: (id: string, goalData: Partial<Goal>) => Promise<boolean>;
  deleteGoal: (id: string) => Promise<boolean>;
  toggleMilestone: (goalId: string, milestoneId: string) => Promise<boolean>;

  // --- Proyectos Section ---
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  projectViewMode: ProjectViewMode;
  setProjectViewMode: (mode: ProjectViewMode) => void;
  projectFilter: ProjectFilterCriteria;
  setProjectFilter: React.Dispatch<React.SetStateAction<ProjectFilterCriteria>>;
  projectDrawerOpen: boolean;
  setProjectDrawerOpen: (open: boolean) => void;
  editingProject: Project | null;
  setEditingProject: (project: Project | null) => void;
  taskDrawerOpen: boolean;
  setTaskDrawerOpen: (open: boolean) => void;
  editingTask: ProjectTask | null;
  setEditingTask: (task: ProjectTask | null) => void;
  fetchProjectsList: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  createProject: (projectData: Partial<Project>) => Promise<boolean>;
  updateProject: (id: string, projectData: Partial<Project>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  createTask: (projectId: string, taskData: Partial<ProjectTask>) => Promise<boolean>;
  updateTask: (taskId: string, taskData: Partial<ProjectTask>) => Promise<boolean>;
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  toggleSubtask: (subtaskId: string) => Promise<boolean>;
}

const AuraContext = createContext<AuraContextProps | undefined>(undefined);

const API_ELEMENTOS_BASE = '/api/v1/elementos/';

export const AuraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Persistent active tab navigation
  const [tabActiva, setTabActivaState] = useState<ElementoTipo>(() => {
    try {
      const saved = localStorage.getItem('aura_active_tab') as ElementoTipo;
      if (saved && ['CALENDARIO', 'OBJETIVOS', 'PROYECTOS', 'EVENTOS'].includes(saved)) {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'CALENDARIO';
  });

  const setTabActiva = (tab: ElementoTipo) => {
    setTabActivaState(tab);
    try {
      localStorage.setItem('aura_active_tab', tab);
    } catch (e) {
      console.warn('Could not persist tab in localStorage:', e);
    }
  };

  // 2. User profile & notifications state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(3);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);

  const refreshNotifications = useCallback(async () => {
    try {
      const [count, list, profile] = await Promise.all([
        api.fetchUnreadNotificationsCount(),
        api.fetchNotifications(),
        api.fetchUserProfile(),
      ]);
      setUnreadNotificationsCount(count);
      setNotifications(list);
      setUserProfile(profile);
    } catch (err) {
      console.warn('Error refreshing notifications:', err);
    }
  }, []);

  const markNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
  };

  // 3. Calendar state & operations
  const [elementos, setElementos] = useState<PlanElemento[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const [anioActivo, setAnioActivo] = useState<number>(today.getFullYear());
  const [mesActivo, setMesActivo] = useState<number>(today.getMonth());
  const [vistaCalendario, setVistaCalendario] = useState<VistaModoCalendario>('MES');
  const [fechaSemanaSeleccionada, setFechaSemanaSeleccionada] = useState<Date>(today);

  const agrandarSemana = (fechaReferencia: Date) => {
    setFechaSemanaSeleccionada(fechaReferencia);
    if (fechaReferencia.getFullYear() !== anioActivo) setAnioActivo(fechaReferencia.getFullYear());
    if (fechaReferencia.getMonth() !== mesActivo) setMesActivo(fechaReferencia.getMonth());
    setVistaCalendario('SEMANA');
  };

  const irSemanaAnterior = () => {
    const nuevaFecha = new Date(fechaSemanaSeleccionada.getFullYear(), fechaSemanaSeleccionada.getMonth(), fechaSemanaSeleccionada.getDate() - 7);
    setFechaSemanaSeleccionada(nuevaFecha);
    if (nuevaFecha.getMonth() !== mesActivo || nuevaFecha.getFullYear() !== anioActivo) {
      setMesActivo(nuevaFecha.getMonth());
      setAnioActivo(nuevaFecha.getFullYear());
    }
  };

  const irSemanaSiguiente = () => {
    const nuevaFecha = new Date(fechaSemanaSeleccionada.getFullYear(), fechaSemanaSeleccionada.getMonth(), fechaSemanaSeleccionada.getDate() + 7);
    setFechaSemanaSeleccionada(nuevaFecha);
    if (nuevaFecha.getMonth() !== mesActivo || nuevaFecha.getFullYear() !== anioActivo) {
      setMesActivo(nuevaFecha.getMonth());
      setAnioActivo(nuevaFecha.getFullYear());
    }
  };

  const fetchElementos = useCallback(async (start?: string, end?: string) => {
    setCargando(true);
    setError(null);
    try {
      const range = getGridDateRange(anioActivo, mesActivo);
      const startStr = start || range.startStr;
      const endStr = end || range.endStr;

      // 1. Fetch native calendar items
      let nativeItems: PlanElemento[] = [];
      try {
        const url = `${API_ELEMENTOS_BASE}?start_date=${encodeURIComponent(startStr)}&end_date=${encodeURIComponent(endStr)}`;
        const res = await fetch(url);
        if (res.ok) {
          nativeItems = await res.json();
        }
      } catch (e) {
        console.warn('Native elementos fetch failed, will rely on sync:', e);
      }

      // 2. Fetch synchronized goal deadlines from backend service
      const goalDeadlineItems = await api.fetchCalendarEvents(startStr, endStr);

      // Merge avoiding duplicate IDs
      const combined = [...nativeItems];
      for (const item of goalDeadlineItems) {
        if (!combined.some(c => String(c.id) === String(item.id))) {
          combined.push(item);
        }
      }

      setElementos(combined);
    } catch (err) {
      console.error('Error fetching calendar items:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }, [anioActivo, mesActivo]);

  const crearElemento = async (newEl: Omit<PlanElemento, 'id'>): Promise<boolean> => {
    try {
      const res = await fetch(API_ELEMENTOS_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEl),
      });
      if (res.ok) {
        await fetchElementos();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al crear elemento:', err);
      return false;
    }
  };

  const actualizarElemento = async (id: number, updatedFields: Partial<PlanElemento>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_ELEMENTOS_BASE}${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        await fetchElementos();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al actualizar elemento:', err);
      return false;
    }
  };

  const eliminarElemento = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_ELEMENTOS_BASE}${id}/`, { method: 'DELETE' });
      if (res.ok) {
        await fetchElementos();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al eliminar elemento:', err);
      return false;
    }
  };

  // 4. Objetivos (Goals) state & operations
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState<boolean>(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [goalViewMode, setGoalViewMode] = useState<GoalViewMode>('CARDS');
  const [goalFilter, setGoalFilter] = useState<GoalFilterCriteria>({
    status: 'ALL',
    category: 'ALL',
    searchQuery: '',
  });
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const fetchGoalsList = useCallback(async () => {
    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const data = await api.fetchGoals({
        status: goalFilter.status,
        category: goalFilter.category,
      });
      setGoals(data);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setGoalsError('Error al cargar objetivos');
    } finally {
      setGoalsLoading(false);
    }
  }, [goalFilter.status, goalFilter.category]);

  const createGoal = async (goalData: Partial<Goal>): Promise<boolean> => {
    try {
      const created = await api.createGoalApi(goalData);
      setGoals(prev => [created, ...prev]);
      // Refetch calendar events to display projected deadline if present
      if (created.deadline) {
        fetchElementos();
      }
      return true;
    } catch (err) {
      console.error('Error creating goal:', err);
      return false;
    }
  };

  const updateGoal = async (id: string, goalData: Partial<Goal>): Promise<boolean> => {
    try {
      const updated = await api.updateGoalApi(id, goalData);
      setGoals(prev => prev.map(g => g.id === id ? updated : g));
      fetchElementos();
      return true;
    } catch (err) {
      console.error('Error updating goal:', err);
      return false;
    }
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    try {
      await api.deleteGoalApi(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      fetchElementos();
      return true;
    } catch (err) {
      console.error('Error deleting goal:', err);
      return false;
    }
  };

  const toggleMilestone = async (goalId: string, milestoneId: string): Promise<boolean> => {
    try {
      const res = await api.toggleMilestoneApi(goalId, milestoneId);
      setGoals(prev => prev.map(g => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map(m =>
          m.id === milestoneId ? { ...m, isCompleted: res.is_completed } : m
        );
        return {
          ...g,
          milestones: updatedMilestones,
          progressPercentage: res.goal_progress_percentage,
          status: res.goal_status as any,
        };
      }));
      return true;
    } catch (err) {
      console.error('Error toggling milestone:', err);
      return false;
    }
  };

  // 5. Proyectos (Projects) state & operations
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projectViewMode, setProjectViewMode] = useState<ProjectViewMode>('KANBAN');
  const [projectFilter, setProjectFilter] = useState<ProjectFilterCriteria>({
    status: 'ACTIVE',
    searchQuery: '',
  });
  const [projectDrawerOpen, setProjectDrawerOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  const fetchProjectsList = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const data = await api.fetchProjects({
        status: projectFilter.status,
        search: projectFilter.searchQuery,
      });
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjectsError('Error al cargar proyectos');
    } finally {
      setProjectsLoading(false);
    }
  }, [projectFilter.status, projectFilter.searchQuery]);

  const selectProject = async (projectId: string) => {
    try {
      const proj = await api.fetchProjectById(projectId);
      setActiveProject(proj);
    } catch (err) {
      console.error('Error fetching project detail:', err);
    }
  };

  const createProject = async (projectData: Partial<Project>): Promise<boolean> => {
    try {
      const created = await api.createProjectApi(projectData);
      setProjects(prev => [created, ...prev]);
      return true;
    } catch (err) {
      console.error('Error creating project:', err);
      return false;
    }
  };

  const updateProject = async (id: string, projectData: Partial<Project>): Promise<boolean> => {
    try {
      const updated = await api.updateProjectApi(id, projectData);
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
      if (activeProject?.id === id) {
        setActiveProject(prev => prev ? { ...prev, ...updated } : null);
      }
      return true;
    } catch (err) {
      console.error('Error updating project:', err);
      return false;
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      await api.deleteProjectApi(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProject?.id === id) {
        setActiveProject(null);
      }
      fetchElementos();
      return true;
    } catch (err) {
      console.error('Error deleting project:', err);
      return false;
    }
  };

  const createTask = async (projectId: string, taskData: Partial<ProjectTask>): Promise<boolean> => {
    try {
      const newTask = await api.createProjectTaskApi(projectId, taskData);
      if (activeProject && activeProject.id === projectId) {
        const currentTasks = activeProject.tasks || [];
        const updatedTasks = [...currentTasks, newTask];
        const completed = updatedTasks.filter(t => t.status === 'DONE').length;
        const total = updatedTasks.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        setActiveProject({
          ...activeProject,
          tasks: updatedTasks,
          totalTasks: total,
          completedTasks: completed,
          progressPercentage: progress,
        });
        setProjects(prev => prev.map(p => p.id === projectId ? {
          ...p,
          totalTasks: total,
          completedTasks: completed,
          progressPercentage: progress,
        } : p));
      }
      if (newTask.deadline) {
        fetchElementos();
      }
      return true;
    } catch (err) {
      console.error('Error creating task:', err);
      return false;
    }
  };

  const updateTask = async (taskId: string, taskData: Partial<ProjectTask>): Promise<boolean> => {
    try {
      const updated = await api.updateProjectTaskApi(taskId, taskData);
      if (activeProject) {
        const currentTasks = activeProject.tasks || [];
        const updatedTasks = currentTasks.map(t => t.id === taskId ? updated : t);
        const completed = updatedTasks.filter(t => t.status === 'DONE').length;
        const total = updatedTasks.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        setActiveProject({
          ...activeProject,
          tasks: updatedTasks,
          totalTasks: total,
          completedTasks: completed,
          progressPercentage: progress,
        });
        setProjects(prev => prev.map(p => p.id === activeProject.id ? {
          ...p,
          totalTasks: total,
          completedTasks: completed,
          progressPercentage: progress,
        } : p));
      }
      fetchElementos();
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      return false;
    }
  };

  const moveTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<boolean> => {
    if (activeProject) {
      const oldTasks = activeProject.tasks || [];
      const taskIndex = oldTasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        const optimisticTasks = oldTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        const completed = optimisticTasks.filter(t => t.status === 'DONE').length;
        const total = optimisticTasks.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        setActiveProject({
          ...activeProject,
          tasks: optimisticTasks,
          totalTasks: total,
          completedTasks: completed,
          progressPercentage: progress,
        });
      }
    }
    try {
      const res = await api.updateTaskStatusApi(taskId, newStatus);
      if (activeProject) {
        const currentTasks = activeProject.tasks || [];
        const updatedTasks = currentTasks.map(t => t.id === taskId ? res.task : t);
        const completed = updatedTasks.filter(t => t.status === 'DONE').length;
        const total = updatedTasks.length;
        setActiveProject(prev => prev ? {
          ...prev,
          tasks: updatedTasks,
          status: res.projectStatus as any,
          progressPercentage: res.projectProgressPercentage,
          totalTasks: total,
          completedTasks: completed,
        } : null);
        setProjects(prev => prev.map(p => p.id === activeProject.id ? {
          ...p,
          status: res.projectStatus as any,
          progressPercentage: res.projectProgressPercentage,
          totalTasks: total,
          completedTasks: completed,
        } : p));
      }
      return true;
    } catch (err) {
      console.error('Error moving task status:', err);
      if (activeProject) {
        selectProject(activeProject.id);
      }
      return false;
    }
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
      await api.deleteProjectTaskApi(taskId);
      if (activeProject) {
        const currentTasks = activeProject.tasks || [];
        const updatedTasks = currentTasks.filter(t => t.id !== taskId);
        const completed = updatedTasks.filter(t => t.status === 'DONE').length;
        const total = updatedTasks.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        setActiveProject({
          ...activeProject,
          tasks: updatedTasks,
          totalTasks: total,
          completedTasks: completed,
          progressPercentage: progress,
        });
        setProjects(prev => prev.map(p => p.id === activeProject.id ? {
          ...p,
          totalTasks: total,
          completedTasks: completed,
          progressPercentage: progress,
        } : p));
      }
      fetchElementos();
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      return false;
    }
  };

  const toggleSubtask = async (subtaskId: string): Promise<boolean> => {
    try {
      const updated = await api.toggleSubtaskApi(subtaskId);
      if (activeProject && activeProject.tasks) {
        const updatedTasks = activeProject.tasks.map(t => {
          if (!t.subtasks || !t.subtasks.some(s => s.id === subtaskId)) return t;
          return {
            ...t,
            subtasks: t.subtasks.map(s => s.id === subtaskId ? updated : s),
          };
        });
        setActiveProject({ ...activeProject, tasks: updatedTasks });
      }
      return true;
    } catch (err) {
      console.error('Error toggling subtask:', err);
      return false;
    }
  };

  // Initial load effects
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (tabActiva === 'CALENDARIO') {
      const range = getGridDateRange(anioActivo, mesActivo);
      fetchElementos(range.startStr, range.endStr);
    } else if (tabActiva === 'OBJETIVOS') {
      fetchGoalsList();
    } else if (tabActiva === 'PROYECTOS') {
      fetchProjectsList();
    }
  }, [tabActiva, anioActivo, mesActivo, fetchElementos, fetchGoalsList, fetchProjectsList]);

  return (
    <AuraContext.Provider value={{
      // Navigation & Shell
      tabActiva,
      setTabActiva,
      userProfile,
      unreadNotificationsCount,
      notifications,
      notificationsOpen,
      setNotificationsOpen,
      profileMenuOpen,
      setProfileMenuOpen,
      markNotificationRead,
      refreshNotifications,

      // Calendar
      elementos,
      cargando,
      error,
      anioActivo,
      mesActivo,
      setAnioActivo,
      setMesActivo,
      vistaCalendario,
      setVistaCalendario,
      fechaSemanaSeleccionada,
      setFechaSemanaSeleccionada,
      agrandarSemana,
      irSemanaAnterior,
      irSemanaSiguiente,
      fetchElementos,
      crearElemento,
      actualizarElemento,
      eliminarElemento,

      // Objetivos
      goals,
      goalsLoading,
      goalsError,
      goalViewMode,
      setGoalViewMode,
      goalFilter,
      setGoalFilter,
      drawerOpen,
      setDrawerOpen,
      editingGoal,
      setEditingGoal,
      fetchGoalsList,
      createGoal,
      updateGoal,
      deleteGoal,
      toggleMilestone,

      // Proyectos
      projects,
      projectsLoading,
      projectsError,
      activeProject,
      setActiveProject,
      projectViewMode,
      setProjectViewMode,
      projectFilter,
      setProjectFilter,
      projectDrawerOpen,
      setProjectDrawerOpen,
      editingProject,
      setEditingProject,
      taskDrawerOpen,
      setTaskDrawerOpen,
      editingTask,
      setEditingTask,
      fetchProjectsList,
      selectProject,
      createProject,
      updateProject,
      deleteProject,
      createTask,
      updateTask,
      moveTaskStatus,
      deleteTask,
      toggleSubtask,
    }}>
      {children}
    </AuraContext.Provider>
  );
};

export const useAuraState = () => {
  const context = useContext(AuraContext);
  if (!context) throw new Error('useAuraState debe usarse dentro de un AuraProvider');
  return context;
};
