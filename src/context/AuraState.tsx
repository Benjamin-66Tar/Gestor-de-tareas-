import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
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
  EventItem,
  EventStatus,
  TimeBlock,
  EventFilterCriteria,
  AuthMode,
  LoginCredentials,
  RegisterData,
  AuthSessionUser,
  LearningItem,
  LearningFilterCriteria,
  ProgressMatrixRow,
  GoalFilterHorizon,
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
  actualizarElemento: (id: number | string, elemento: Partial<PlanElemento>) => Promise<boolean>;
  eliminarElemento: (id: number | string) => Promise<boolean>;

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
  goalHorizonFilter: GoalFilterHorizon;
  setGoalHorizonFilter: (filter: GoalFilterHorizon) => void;
  goalMetrics: { total: number; active: number; completed: number; avgProgress: number; shortTerm: number; longTerm: number };
  fetchGoalsList: () => Promise<void>;
  createGoal: (goalData: Partial<Goal>) => Promise<boolean>;
  updateGoal: (id: string, goalData: Partial<Goal>) => Promise<boolean>;
  deleteGoal: (id: string) => Promise<boolean>;
  toggleMilestone: (goalId: string, milestoneId: string) => Promise<boolean>;
  linkGoalComponents: (goalId: string, projectIds: string[], learningItemIds: string[]) => Promise<boolean>;
  concludeGoal: (goalId: string) => Promise<boolean>;

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

  // --- Eventos Section ---
  events: EventItem[];
  eventsLoading: boolean;
  eventsError: string | null;
  eventFilter: EventFilterCriteria;
  setEventFilter: React.Dispatch<React.SetStateAction<EventFilterCriteria>>;
  eventDrawerOpen: boolean;
  setEventDrawerOpen: (open: boolean) => void;
  editingEvent: EventItem | null;
  setEditingEvent: (event: EventItem | null) => void;
  fetchEventsList: () => Promise<void>;
  createEvent: (eventData: Partial<EventItem>) => Promise<boolean>;
  updateEvent: (id: string, eventData: Partial<EventItem>) => Promise<boolean>;
  updateEventStatus: (id: string, status: EventStatus) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  openNewEventDrawer: () => void;
  openEditEventDrawer: (event: EventItem) => void;
  eventsByTimeBlock: Record<TimeBlock, EventItem[]>;

  // --- Welcome & Authentication ---
  currentUser: AuthSessionUser | null;
  authToken: string | null;
  isAuthenticated: boolean;
  isWelcomeOnly: boolean;
  hasEnteredApp: boolean;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  authLoading: boolean;
  authError: string | null;
  setAuthError: (error: string | null) => void;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  enterApp: () => void;
  switchAccount: () => void;

  // --- Aprendizaje (Learning & Knowledge Hub) ---
  learningItems: LearningItem[];
  learningLoading: boolean;
  learningError: string | null;
  learningFilter: LearningFilterCriteria;
  setLearningFilter: React.Dispatch<React.SetStateAction<LearningFilterCriteria>>;
  learningDrawerOpen: boolean;
  setLearningDrawerOpen: (open: boolean) => void;
  activeLearningItem: LearningItem | null;
  setActiveLearningItem: (item: LearningItem | null) => void;
  studyModalOpen: boolean;
  setStudyModalOpen: (open: boolean) => void;
  studyModalItem: LearningItem | null;
  setStudyModalItem: (item: LearningItem | null) => void;
  fetchLearningList: () => Promise<void>;
  openLearningDrawer: (item?: LearningItem | null) => Promise<void>;
  closeLearningDrawer: () => void;
  createLearningItem: (data: Partial<LearningItem>) => Promise<boolean>;
  updateLearningItem: (id: string, updates: Partial<LearningItem>) => Promise<boolean>;
  deleteLearningItem: (id: string) => Promise<boolean>;
  addLearningTopic: (learningId: string, title: string, sectionName?: string) => Promise<boolean>;
  toggleLearningTopic: (learningId: string, topicId: string, isCompleted?: boolean) => Promise<boolean>;
  deleteLearningTopic: (learningId: string, topicId: string) => Promise<boolean>;
  quickIncrementLearning: (id: string, increment?: number, lastPoint?: string) => Promise<boolean>;
  scheduleStudySession: (learningId: string, data: { startTime: string; endTime: string; notes?: string; reminderMinutes?: number }) => Promise<boolean>;
  learningViewMode: 'KANBAN' | 'LIST' | 'MATRIX';
  setLearningViewMode: (mode: 'KANBAN' | 'LIST' | 'MATRIX') => void;
  matrixRows: ProgressMatrixRow[];
  matrixLoading: boolean;
  matrixWeekOffset: number;
  setMatrixWeekOffset: (offset: number) => void;
  matrixSearch: string;
  setMatrixSearch: (search: string) => void;
  fetchProgressMatrix: (offset?: number, search?: string) => Promise<void>;
  advanceMatrixItem: (itemId: string) => Promise<boolean>;

  // --- Constancia & Check-in (Fase 1) ---
  checkIns: Record<string, boolean>;
  streaks: Record<string, number>;
  toggleCheckIn: (params: { learningItemId?: string; eventItemId?: string; date?: string }) => Promise<boolean>;
}

const AuraContext = createContext<AuraContextProps | undefined>(undefined);

const API_ELEMENTOS_BASE = `${api.API_BASE}/elementos/`;

export const AuraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 0. Welcome & Authentication state
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('aura_session_token');
    } catch {
      return null;
    }
  });

  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(() => {
    try {
      const saved = localStorage.getItem('aura_session_user');
      return saved ? (JSON.parse(saved) as AuthSessionUser) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!authToken && !!currentUser;
  const [isWelcomeOnly, setIsWelcomeOnly] = useState<boolean>(() => {
    try {
      const token = localStorage.getItem('aura_session_token');
      const user = localStorage.getItem('aura_session_user');
      return !!token && !!user;
    } catch {
      return false;
    }
  });
  const [hasEnteredApp, setHasEnteredApp] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem('aura_session_user');
      if (savedUser) {
        return JSON.parse(savedUser) as UserProfile;
      }
    } catch {
      // Fallback
    }
    return null;
  });
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(3);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);

  // Validate session on mount
  useEffect(() => {
    if (authToken) {
      api.getSessionApi()
        .then(res => {
          if (res.user) {
            const userObj = res.user;
            setCurrentUser(userObj);
            localStorage.setItem('aura_session_user', JSON.stringify(userObj));
            setUserProfile(prev => prev || userObj);
          }
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('aura_session_token');
          localStorage.removeItem('aura_session_user');
          setCurrentUser(null);
          setAuthToken(null);
          setIsWelcomeOnly(false);
          setHasEnteredApp(false);
        });
    }
  }, [authToken]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await api.loginApi(credentials);
      setAuthToken(res.token);
      setCurrentUser(res.user);
      localStorage.setItem('aura_session_token', res.token);
      localStorage.setItem('aura_session_user', JSON.stringify(res.user));
      setUserProfile(res.user);
      setIsWelcomeOnly(false);
      setHasEnteredApp(true);
      return true;
    } catch (err: any) {
      setAuthError(err.message || 'Error al iniciar sesión');
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await api.registerApi(data);
      setAuthToken(res.token);
      setCurrentUser(res.user);
      localStorage.setItem('aura_session_token', res.token);
      localStorage.setItem('aura_session_user', JSON.stringify(res.user));
      setUserProfile(res.user);
      setIsWelcomeOnly(false);
      setHasEnteredApp(true);
      return true;
    } catch (err: any) {
      setAuthError(err.message || 'Error al crear la cuenta');
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logoutApi();
    } catch (e) {
      console.warn('Error reporting logout to server:', e);
    }
    localStorage.removeItem('aura_session_token');
    localStorage.removeItem('aura_session_user');
    setAuthToken(null);
    setCurrentUser(null);
    setUserProfile(null);
    setIsWelcomeOnly(false);
    setHasEnteredApp(false);
    setAuthMode('LOGIN');
    setAuthError(null);
  };

  const enterApp = () => {
    setHasEnteredApp(true);
  };

  const switchAccount = () => {
    localStorage.removeItem('aura_session_token');
    localStorage.removeItem('aura_session_user');
    setAuthToken(null);
    setCurrentUser(null);
    setUserProfile(null);
    setIsWelcomeOnly(false);
    setHasEnteredApp(false);
    setAuthMode('LOGIN');
    setAuthError(null);
  };

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
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
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
  const [goalHorizonFilter, setGoalHorizonFilter] = useState<GoalFilterHorizon>('ALL');

  const goalMetrics = useMemo(() => {
    const filtered = goals.filter(g => {
      if (goalHorizonFilter === 'ALL') return true;
      return (g.timeHorizon || 'SHORT_TERM') === goalHorizonFilter;
    });
    const total = filtered.length;
    const active = filtered.filter(g => g.status === 'ACTIVE').length;
    const completed = filtered.filter(g => g.status === 'COMPLETED').length;
    const avgProgress = total > 0 ? Math.round(filtered.reduce((acc, g) => acc + g.progressPercentage, 0) / total) : 0;
    const shortTerm = goals.filter(g => (g.timeHorizon || 'SHORT_TERM') === 'SHORT_TERM').length;
    const longTerm = goals.filter(g => g.timeHorizon === 'LONG_TERM').length;
    return { total, active, completed, avgProgress, shortTerm, longTerm };
  }, [goals, goalHorizonFilter]);

  const fetchGoalsList = useCallback(async () => {
    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const data = await api.fetchGoals({
        status: goalFilter.status,
        category: goalFilter.category,
        timeHorizon: goalHorizonFilter !== 'ALL' ? goalHorizonFilter : undefined,
      });
      setGoals(data);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setGoalsError('Error al cargar objetivos');
    } finally {
      setGoalsLoading(false);
    }
  }, [goalFilter.status, goalFilter.category, goalHorizonFilter]);

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

  const linkGoalComponents = useCallback(async (goalId: string, projectIds: string[], learningItemIds: string[]): Promise<boolean> => {
    try {
      const updated = await api.linkGoalComponentsApi(goalId, projectIds, learningItemIds);
      setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
      return true;
    } catch (err) {
      console.error('Error linking goal components:', err);
      return false;
    }
  }, []);

  const concludeGoal = useCallback(async (goalId: string): Promise<boolean> => {
    try {
      await api.concludeGoalApi(goalId);
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: 'COMPLETED' as any, progressPercentage: 100 } : g));
      return true;
    } catch (err) {
      console.error('Error concluding goal:', err);
      return false;
    }
  }, []);

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
      setActiveProject(prev => {
        if (!prev) return null;
        const currentTasks = prev.tasks || [];
        const updatedTasks = currentTasks.map(t => t.id === taskId ? updated : t);
        const completed = updatedTasks.filter(t => t.status === 'DONE').length;
        const total = updatedTasks.length;
        return {
          ...prev,
          tasks: updatedTasks,
          totalTasks: total,
          completedTasks: completed,
          progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      });

      setProjects(prev => prev.map(p => {
        if (activeProject && p.id === activeProject.id) {
          const currentTasks = p.tasks || [];
          const updatedTasks = currentTasks.map(t => t.id === taskId ? updated : t);
          const completed = updatedTasks.filter(t => t.status === 'DONE').length;
          const total = updatedTasks.length;
          return {
            ...p,
            tasks: updatedTasks,
            totalTasks: total,
            completedTasks: completed,
            progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        }
        return p;
      }));

      fetchElementos();
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const moveTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<boolean> => {
    setActiveProject(prev => {
      if (!prev) return null;
      const oldTasks = prev.tasks || [];
      const optimisticTasks = oldTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      const completed = optimisticTasks.filter(t => t.status === 'DONE').length;
      const total = optimisticTasks.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        ...prev,
        tasks: optimisticTasks,
        totalTasks: total,
        completedTasks: completed,
        progressPercentage: progress,
      };
    });

    try {
      const res = await api.updateTaskStatusApi(taskId, newStatus);
      setActiveProject(prev => {
        if (!prev) return null;
        const currentTasks = prev.tasks || [];
        const updatedTasks = currentTasks.map(t => t.id === taskId ? res.task : t);
        const completed = updatedTasks.filter(t => t.status === 'DONE').length;
        const total = updatedTasks.length;
        return {
          ...prev,
          tasks: updatedTasks,
          status: (res.projectStatus as any) || prev.status,
          progressPercentage: res.projectProgressPercentage ?? prev.progressPercentage,
          totalTasks: total,
          completedTasks: completed,
        };
      });

      setProjects(prev => prev.map(p => {
        if (activeProject && p.id === activeProject.id) {
          const currentTasks = p.tasks || [];
          const updatedTasks = currentTasks.map(t => t.id === taskId ? res.task : t);
          const completed = updatedTasks.filter(t => t.status === 'DONE').length;
          const total = updatedTasks.length;
          return {
            ...p,
            tasks: updatedTasks,
            status: (res.projectStatus as any) || p.status,
            progressPercentage: res.projectProgressPercentage ?? p.progressPercentage,
            totalTasks: total,
            completedTasks: completed,
          };
        }
        return p;
      }));

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

  // --- 6. Eventos State & Operations ---
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<EventFilterCriteria>({
    status: 'ALL',
    category: 'ALL',
    searchQuery: '',
  });
  const [eventDrawerOpen, setEventDrawerOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  const fetchEventsList = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const serverEvents = await api.fetchEvents({
        status: eventFilter.status,
        category: eventFilter.category,
        search: eventFilter.searchQuery,
      });
      setEvents(serverEvents);
    } catch (err) {
      console.warn('Error fetching events from API:', err);
      setEventsError('No se pudieron cargar los eventos.');
    } finally {
      setEventsLoading(false);
    }
  }, [eventFilter]);

  const openNewEventDrawer = () => {
    setEditingEvent(null);
    setEventDrawerOpen(true);
  };

  const openEditEventDrawer = (event: EventItem) => {
    setEditingEvent(event);
    setEventDrawerOpen(true);
  };

  const createEvent = async (eventData: Partial<EventItem>): Promise<boolean> => {
    try {
      const created = await api.createEventApi(eventData);
      setEvents(prev => [created, ...prev]);
      setEventDrawerOpen(false);
      fetchElementos();
      refreshNotifications();
      return true;
    } catch (err) {
      console.error('Error creating event:', err);
      return false;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<EventItem>): Promise<boolean> => {
    try {
      const updated = await api.updateEventApi(id, eventData);
      setEvents(prev => prev.map(e => e.id === id ? updated : e));
      setEventDrawerOpen(false);
      fetchElementos();
      return true;
    } catch (err) {
      console.error('Error updating event:', err);
      return false;
    }
  };

  const updateEventStatus = async (id: string, status: EventStatus): Promise<boolean> => {
    try {
      const updated = await api.updateEventStatusApi(id, status);
      setEvents(prev => prev.map(e => e.id === id ? updated : e));
      fetchElementos();
      return true;
    } catch (err) {
      console.error('Error updating event status:', err);
      return false;
    }
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    try {
      await api.deleteEventApi(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      fetchElementos();
      return true;
    } catch (err) {
      console.error('Error deleting event:', err);
      return false;
    }
  };

  const eventsByTimeBlock = React.useMemo(() => {
    const blocks: Record<TimeBlock, EventItem[]> = {
      TODAY: [],
      THIS_WEEK: [],
      UPCOMING: [],
      PAST: [],
    };

    const query = eventFilter.searchQuery.trim().toLowerCase();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const currentDay = now.getDay();
    const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday, 23, 59, 59, 999);

    const filtered = events.filter(e => {
      if (eventFilter.status !== 'ALL' && e.status !== eventFilter.status) return false;
      if (eventFilter.category !== 'ALL' && e.category.toLowerCase() !== eventFilter.category.toLowerCase()) return false;
      if (query) {
        const matchesTitle = e.title.toLowerCase().includes(query);
        const matchesDesc = (e.description || '').toLowerCase().includes(query);
        const matchesLoc = (e.location || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesLoc) return false;
      }
      return true;
    });

    for (const item of filtered) {
      const end = new Date(item.endTime);
      const start = new Date(item.startTime);
      let block: TimeBlock = 'UPCOMING';

      if (end < now) {
        block = 'PAST';
      } else if (start <= todayEnd && end >= todayStart) {
        block = 'TODAY';
      } else if (start <= endOfWeek) {
        block = 'THIS_WEEK';
      } else {
        block = 'UPCOMING';
      }

      blocks[block].push({ ...item, timeBlock: block });
    }

    return blocks;
  }, [events, eventFilter]);

  // 5. Aprendizaje (Learning & Knowledge Hub)
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [learningLoading, setLearningLoading] = useState<boolean>(false);
  const [learningError, setLearningError] = useState<string | null>(null);
  const [learningFilter, setLearningFilter] = useState<LearningFilterCriteria>({
    status: 'ALL',
    resourceType: 'ALL',
    searchQuery: '',
  });
  const [learningDrawerOpen, setLearningDrawerOpen] = useState<boolean>(false);
  const [activeLearningItem, setActiveLearningItem] = useState<LearningItem | null>(null);
  const [studyModalOpen, setStudyModalOpen] = useState<boolean>(false);
  const [studyModalItem, setStudyModalItem] = useState<LearningItem | null>(null);

  const fetchLearningList = useCallback(async () => {
    try {
      setLearningLoading(true);
      setLearningError(null);
      const items = await api.fetchLearningItems(learningFilter);
      setLearningItems(items);
    } catch (err) {
      console.warn('Error fetching learning items:', err);
      setLearningError('No se pudieron cargar los recursos de aprendizaje.');
    } finally {
      setLearningLoading(false);
    }
  }, [learningFilter]);

  const openLearningDrawer = useCallback(async (item?: LearningItem | null) => {
    if (item && item.id) {
      try {
        const detail = await api.fetchLearningItemDetail(item.id);
        setActiveLearningItem(detail);
      } catch (err) {
        console.warn('Failed to load item detail, using shallow item:', err);
        setActiveLearningItem(item);
      }
    } else {
      setActiveLearningItem(null);
    }
    setLearningDrawerOpen(true);
  }, []);

  const closeLearningDrawer = useCallback(() => {
    setLearningDrawerOpen(false);
    setActiveLearningItem(null);
  }, []);

  const createLearningItem = useCallback(async (data: Partial<LearningItem>): Promise<boolean> => {
    try {
      const created = await api.createLearningItemApi(data);
      setLearningItems(prev => [created, ...prev]);
      closeLearningDrawer();
      return true;
    } catch (err) {
      console.error('Error creating learning item:', err);
      return false;
    }
  }, [closeLearningDrawer]);

  const updateLearningItem = useCallback(async (id: string, updates: Partial<LearningItem>): Promise<boolean> => {
    try {
      const updated = await api.updateLearningItemApi(id, updates);
      setLearningItems(prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
      if (activeLearningItem?.id === id) {
        setActiveLearningItem(prev => prev ? { ...prev, ...updated } : null);
      }
      return true;
    } catch (err) {
      console.error('Error updating learning item:', err);
      return false;
    }
  }, [activeLearningItem]);

  const deleteLearningItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.deleteLearningItemApi(id);
      setLearningItems(prev => prev.filter(item => item.id !== id));
      if (activeLearningItem?.id === id) {
        closeLearningDrawer();
      }
      return true;
    } catch (err) {
      console.error('Error deleting learning item:', err);
      return false;
    }
  }, [activeLearningItem, closeLearningDrawer]);

  const addLearningTopic = useCallback(async (learningId: string, title: string, sectionName?: string): Promise<boolean> => {
    try {
      const newTopic = await api.addLearningTopicApi(learningId, { title, sectionName });
      setActiveLearningItem(prev => {
        if (!prev || prev.id !== learningId) return prev;
        const currentTopics = prev.topics || [];
        return {
          ...prev,
          topics: [...currentTopics, newTopic],
        };
      });
      const refreshed = await api.fetchLearningItemDetail(learningId);
      setActiveLearningItem(refreshed);
      setLearningItems(prev => prev.map(item => item.id === learningId ? refreshed : item));
      return true;
    } catch (err) {
      console.error('Error adding learning topic:', err);
      return false;
    }
  }, []);

  const toggleLearningTopic = useCallback(async (learningId: string, topicId: string, isCompleted?: boolean): Promise<boolean> => {
    try {
      setActiveLearningItem(prev => {
        if (!prev || prev.id !== learningId || !prev.topics) return prev;
        const updatedTopics = prev.topics.map(t =>
          t.id === topicId ? { ...t, isCompleted: isCompleted !== undefined ? isCompleted : !t.isCompleted } : t
        );
        return { ...prev, topics: updatedTopics };
      });

      const res = await api.toggleLearningTopicApi(learningId, topicId, isCompleted);
      setActiveLearningItem(prev => {
        if (!prev || prev.id !== learningId) return prev;
        const updatedTopics = (prev.topics || []).map(t =>
          t.id === topicId ? { ...t, isCompleted: res.isCompleted } : t
        );
        return {
          ...prev,
          topics: updatedTopics,
          progressPercentage: res.parentProgressPercentage,
          status: res.parentStatus,
          isDormant: false,
          dormancyDays: 0,
        };
      });

      setLearningItems(prev => prev.map(item => {
        if (item.id === learningId) {
          return {
            ...item,
            progressPercentage: res.parentProgressPercentage,
            status: res.parentStatus,
            isDormant: false,
            dormancyDays: 0,
          };
        }
        return item;
      }));
      if (res.parentProgressPercentage === 100) {
        fetchGoalsList();
      }
      return true;
    } catch (err) {
      console.error('Error toggling learning topic:', err);
      return false;
    }
  }, [fetchGoalsList]);

  const deleteLearningTopic = useCallback(async (learningId: string, topicId: string): Promise<boolean> => {
    try {
      await api.deleteLearningTopicApi(learningId, topicId);
      const refreshed = await api.fetchLearningItemDetail(learningId);
      setActiveLearningItem(refreshed);
      setLearningItems(prev => prev.map(item => item.id === learningId ? refreshed : item));
      return true;
    } catch (err) {
      console.error('Error deleting topic:', err);
      return false;
    }
  }, []);

  const quickIncrementLearning = useCallback(async (id: string, increment: number = 1, lastPoint?: string): Promise<boolean> => {
    try {
      const res = await api.logLearningActivityApi(id, { incrementUnits: increment, newLastPoint: lastPoint });
      setLearningItems(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            currentUnit: res.currentUnit,
            progressPercentage: res.progressPercentage,
            lastActivityAt: res.lastActivityAt,
            dormancyDays: 0,
            isDormant: false,
            lastPointReached: lastPoint || item.lastPointReached,
          };
        }
        return item;
      }));
      if (activeLearningItem?.id === id) {
        setActiveLearningItem(prev => prev ? {
          ...prev,
          currentUnit: res.currentUnit,
          progressPercentage: res.progressPercentage,
          lastActivityAt: res.lastActivityAt,
          dormancyDays: 0,
          isDormant: false,
          lastPointReached: lastPoint || prev.lastPointReached,
        } : null);
      }
      if (res.progressPercentage === 100) {
        fetchGoalsList();
      }
      return true;
    } catch (err) {
      console.error('Error logging learning activity:', err);
      return false;
    }
  }, [activeLearningItem, fetchGoalsList]);

  const scheduleStudySession = useCallback(async (
    learningId: string,
    data: { startTime: string; endTime: string; notes?: string; reminderMinutes?: number }
  ): Promise<boolean> => {
    try {
      const newEvent = await api.scheduleStudySessionApi(learningId, data);
      setEvents(prev => [newEvent, ...prev]);
      setStudyModalOpen(false);
      setStudyModalItem(null);
      fetchElementos();
      refreshNotifications();
      return true;
    } catch (err) {
      console.error('Error scheduling study session:', err);
      return false;
    }
  }, [fetchElementos, refreshNotifications]);

  // --- Progress & Habits Matrix State (Fase 2) ---
  const [learningViewMode, setLearningViewMode] = useState<'KANBAN' | 'LIST' | 'MATRIX'>('KANBAN');
  const [matrixWeekOffset, setMatrixWeekOffset] = useState<number>(0);
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [matrixRows, setMatrixRows] = useState<ProgressMatrixRow[]>([]);
  const [matrixLoading, setMatrixLoading] = useState<boolean>(false);

  // --- Constancia & Check-ins State (Fase 1) ---
  const [checkIns, setCheckIns] = useState<Record<string, boolean>>({});
  const [streaks, setStreaks] = useState<Record<string, number>>({});

  const fetchProgressMatrix = useCallback(async (offset = matrixWeekOffset, search = matrixSearch) => {
    setMatrixLoading(true);
    try {
      const res = await api.getProgressMatrixApi(offset, search);
      setMatrixRows(res.rows);
      const newChecks: Record<string, boolean> = {};
      const newStreaks: Record<string, number> = {};
      res.rows.forEach(r => {
        newStreaks[r.id] = r.currentStreak;
        r.weeklyAttendance.forEach(w => {
          newChecks[`${r.id}_${w.date}`] = w.isChecked;
        });
      });
      setCheckIns(prev => ({ ...prev, ...newChecks }));
      setStreaks(prev => ({ ...prev, ...newStreaks }));
    } catch (err) {
      console.warn('Error fetching progress matrix:', err);
    } finally {
      setMatrixLoading(false);
    }
  }, [matrixWeekOffset, matrixSearch]);

  const toggleCheckIn = useCallback(async (params: {
    learningItemId?: string;
    eventItemId?: string;
    date?: string;
  }): Promise<boolean> => {
    const id = params.learningItemId || params.eventItemId;
    if (!id) return false;
    const todayDate = params.date || new Date().toISOString().slice(0, 10);
    const key = `${id}_${todayDate}`;
    const currentVal = !!checkIns[key];
    const nextVal = !currentVal;

    // Optimistic instantaneous feedback (<50ms)
    setCheckIns(prev => ({ ...prev, [key]: nextVal }));
    setStreaks(prev => {
      const currentStreak = prev[id] || 0;
      const newStreak = nextVal ? currentStreak + 1 : Math.max(0, currentStreak - 1);
      return { ...prev, [id]: newStreak };
    });

    // Optimistically update matrix row if loaded
    setMatrixRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const currentStreak = r.currentStreak || 0;
      const newStreak = nextVal ? currentStreak + 1 : Math.max(0, currentStreak - 1);
      return {
        ...r,
        isCheckedToday: nextVal,
        currentStreak: newStreak,
        weeklyAttendance: r.weeklyAttendance.map(w =>
          w.date === todayDate ? { ...w, isChecked: nextVal } : w
        ),
      };
    }));

    try {
      const res = await api.toggleCheckInApi({
        learning_item_id: params.learningItemId,
        event_item_id: params.eventItemId,
        date: params.date,
      });
      setCheckIns(prev => ({ ...prev, [key]: res.is_completed }));
      setStreaks(prev => ({ ...prev, [id]: res.streak_count }));
      setMatrixRows(prev => prev.map(r => {
        if (r.id !== id) return r;
        return {
          ...r,
          isCheckedToday: res.is_completed,
          currentStreak: res.streak_count,
          weeklyAttendance: r.weeklyAttendance.map(w =>
            w.date === todayDate ? { ...w, isChecked: res.is_completed } : w
          ),
        };
      }));
      return true;
    } catch (err) {
      console.error('Error toggling check-in:', err);
      // Revert optimistic state
      setCheckIns(prev => ({ ...prev, [key]: currentVal }));
      return false;
    }
  }, [checkIns]);

  const advanceMatrixItem = useCallback(async (itemId: string): Promise<boolean> => {
    const todayDate = new Date().toISOString().slice(0, 10);
    // Optimistic advance (<50ms)
    setMatrixRows(prev => prev.map(r => {
      if (r.id !== itemId) return r;
      const currentU = (r.currentUnit ?? 0) + 1;
      const totalU = r.totalUnits || 1;
      const pct = Math.min(100, Math.round((currentU / totalU) * 100));
      return {
        ...r,
        currentUnit: currentU,
        progressPercentage: pct,
        isCheckedToday: true,
        currentStreak: r.isCheckedToday ? r.currentStreak : r.currentStreak + 1,
        weeklyAttendance: r.weeklyAttendance.map(w =>
          w.date === todayDate ? { ...w, isChecked: true } : w
        ),
      };
    }));
    setCheckIns(prev => ({ ...prev, [`${itemId}_${todayDate}`]: true }));

    try {
      const res = await api.advanceMatrixItemApi(itemId);
      setMatrixRows(prev => prev.map(r => {
        if (r.id !== itemId) return r;
        return {
          ...r,
          currentUnit: res.current_unit ?? r.currentUnit,
          totalUnits: res.total_units ?? r.totalUnits,
          progressPercentage: res.progress_percentage ?? r.progressPercentage,
          nextTopicTitle: res.next_topic_title || r.nextTopicTitle,
          isCheckedToday: true,
        };
      }));
      fetchLearningList();
      fetchGoalsList();
      return true;
    } catch (err) {
      console.error('Error advancing matrix item:', err);
      fetchProgressMatrix(matrixWeekOffset, matrixSearch);
      return false;
    }
  }, [fetchLearningList, fetchGoalsList, fetchProgressMatrix, matrixWeekOffset, matrixSearch]);

  useEffect(() => {
    if (tabActiva === 'APRENDIZAJE' && learningViewMode === 'MATRIX') {
      fetchProgressMatrix(matrixWeekOffset, matrixSearch);
    }
  }, [tabActiva, learningViewMode, matrixWeekOffset, matrixSearch, fetchProgressMatrix]);

  // Unified Calendar CRUD Operations (Seamlessly delegating between Goals, Projects, Events, and native items)
  const crearElemento = async (newEl: Omit<PlanElemento, 'id'>): Promise<boolean> => {
    try {
      if (newEl.tipo === 'OBJETIVO') {
        const success = await createGoal({
          title: newEl.titulo,
          description: newEl.descripcion || '',
          colorHex: newEl.color_hex,
          startDate: newEl.fecha_inicio || null,
          deadline: newEl.fecha_limite || null,
          progressMode: 'MILESTONES',
          status: 'ACTIVE',
        });
        if (success) {
          await fetchElementos();
          return true;
        }
        return false;
      }

      if (newEl.tipo === 'EVENTO') {
        const success = await createEvent({
          title: newEl.titulo,
          description: newEl.descripcion || '',
          colorHex: newEl.color_hex,
          startTime: newEl.fecha_inicio || newEl.fecha_limite || new Date().toISOString(),
          endTime: newEl.fecha_limite || newEl.fecha_inicio || new Date().toISOString(),
          status: 'PROGRAMMED',
        });
        if (success) {
          await fetchElementos();
          return true;
        }
        return false;
      }

      if (newEl.tipo === 'PROYECTO') {
        const success = await createProject({
          title: newEl.titulo,
          description: newEl.descripcion || '',
          colorHex: newEl.color_hex,
          status: 'ACTIVE',
        });
        if (success) {
          await fetchElementos();
          return true;
        }
        return false;
      }

      // Native fallback (ACTIVIDAD)
      const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('aura_session_token') : null);
      const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(API_ELEMENTOS_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
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

  const actualizarElemento = async (id: number | string, updatedFields: Partial<PlanElemento>): Promise<boolean> => {
    try {
      const idStr = String(id);
      if (idStr.startsWith('goal-')) {
        const goalId = idStr.replace('goal-', '');
        const cleanTitle = updatedFields.titulo ? updatedFields.titulo.replace(/^[🎯📌]\s*/, '') : undefined;
        const success = await updateGoal(goalId, {
          title: cleanTitle,
          description: updatedFields.descripcion,
          colorHex: updatedFields.color_hex,
          startDate: updatedFields.fecha_inicio || null,
          deadline: updatedFields.fecha_limite || null,
        });
        if (success) {
          await fetchElementos();
          return true;
        }
        return false;
      }

      if (idStr.startsWith('task-')) {
        const taskId = idStr.replace('task-', '');
        const cleanTitle = updatedFields.titulo ? updatedFields.titulo.replace(/^[📋]\s*/, '') : undefined;
        const success = await updateTask(taskId, {
          title: cleanTitle,
          description: updatedFields.descripcion,
          deadline: updatedFields.fecha_limite || null,
        });
        if (success) {
          await fetchElementos();
          return true;
        }
        return false;
      }

      if (idStr.startsWith('event-')) {
        const eventId = idStr.replace('event-', '');
        const cleanTitle = updatedFields.titulo ? updatedFields.titulo.replace(/^[📅]\s*/, '') : undefined;
        const success = await updateEvent(eventId, {
          title: cleanTitle,
          description: updatedFields.descripcion,
          colorHex: updatedFields.color_hex,
          startTime: updatedFields.fecha_inicio,
          endTime: updatedFields.fecha_limite,
        });
        if (success) {
          await fetchElementos();
          return true;
        }
        return false;
      }

      // Native fallback
      const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('aura_session_token') : null);
      const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_ELEMENTOS_BASE}${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
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

  const eliminarElemento = async (id: number | string): Promise<boolean> => {
    try {
      const idStr = String(id);
      if (idStr.startsWith('goal-')) {
        const goalId = idStr.replace('goal-', '');
        const success = await deleteGoal(goalId);
        if (success) {
          await fetchElementos();
          return true;
        }
        return false;
      }

      if (idStr.startsWith('task-')) {
        const taskId = idStr.replace('task-', '');
        const success = await deleteTask(taskId);
        if (success) {
          await fetchElementos();
          return true;
        }
        return false;
      }

      if (idStr.startsWith('event-')) {
        const eventId = idStr.replace('event-', '');
        const success = await deleteEvent(eventId);
        if (success) {
          await fetchElementos();
          return true;
        }
        return false;
      }

      // Native fallback
      const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('aura_session_token') : null);
      const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_ELEMENTOS_BASE}${id}/`, {
        method: 'DELETE',
        headers: { ...authHeader },
      });
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
      fetchLearningList();
    } else if (tabActiva === 'PROYECTOS') {
      fetchProjectsList();
    } else if (tabActiva === 'EVENTOS') {
      fetchEventsList();
    } else if (tabActiva === 'APRENDIZAJE') {
      fetchLearningList();
      fetchGoalsList();
    }
  }, [tabActiva, anioActivo, mesActivo, fetchElementos, fetchGoalsList, fetchProjectsList, fetchEventsList, fetchLearningList]);

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
      goalHorizonFilter,
      setGoalHorizonFilter,
      goalMetrics,
      fetchGoalsList,
      createGoal,
      updateGoal,
      deleteGoal,
      toggleMilestone,
      linkGoalComponents,
      concludeGoal,

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

      // Eventos
      events,
      eventsLoading,
      eventsError,
      eventFilter,
      setEventFilter,
      eventDrawerOpen,
      setEventDrawerOpen,
      editingEvent,
      setEditingEvent,
      fetchEventsList,
      createEvent,
      updateEvent,
      updateEventStatus,
      deleteEvent,
      openNewEventDrawer,
      openEditEventDrawer,
      eventsByTimeBlock,

      // Welcome & Authentication
      currentUser,
      authToken,
      isAuthenticated,
      isWelcomeOnly,
      hasEnteredApp,
      authMode,
      setAuthMode,
      authLoading,
      authError,
      setAuthError,
      login,
      register,
      logout,
      enterApp,
      switchAccount,

      // Aprendizaje
      learningItems,
      learningLoading,
      learningError,
      learningFilter,
      setLearningFilter,
      learningDrawerOpen,
      setLearningDrawerOpen,
      activeLearningItem,
      setActiveLearningItem,
      studyModalOpen,
      setStudyModalOpen,
      studyModalItem,
      setStudyModalItem,
      fetchLearningList,
      openLearningDrawer,
      closeLearningDrawer,
      createLearningItem,
      updateLearningItem,
      deleteLearningItem,
      addLearningTopic,
      toggleLearningTopic,
      deleteLearningTopic,
      quickIncrementLearning,
      scheduleStudySession,
      learningViewMode,
      setLearningViewMode,
      matrixRows,
      matrixLoading,
      matrixWeekOffset,
      setMatrixWeekOffset,
      matrixSearch,
      setMatrixSearch,
      fetchProgressMatrix,
      advanceMatrixItem,
      checkIns,
      streaks,
      toggleCheckIn,
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
