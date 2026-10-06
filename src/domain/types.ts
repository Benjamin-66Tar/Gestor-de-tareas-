export type ElementoTipo = 'CALENDARIO' | 'OBJETIVOS' | 'PROYECTOS' | 'EVENTOS' | 'APRENDIZAJE';

export interface PlanElemento {
  id: number | string;
  titulo: string;
  descripcion?: string;
  tipo: 'OBJETIVO' | 'PROYECTO' | 'EVENTO' | 'ACTIVIDAD';
  fecha_inicio?: string;
  fecha_limite?: string;
  color_hex: string;
  source_id?: string;
  is_goal_deadline?: boolean;
  is_milestone?: boolean;
  is_project_task?: boolean;
  is_event_item?: boolean;
}

export interface CalendarDay {
  date: Date;
  formattedDate: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  items: PlanElemento[];
}

/**
 * Modos de visualización soportados por el componente de Calendario:
 * - 'MES': Cuadrícula mensual tradicional con 42 días (6 semanas).
 * - 'SEMANA': Modo Agrandador / Enfoque semanal dedicado con 7 columnas amplias.
 * - 'AGENDA': Vista móvil / lista vertical cronológica.
 */
export type VistaModoCalendario = 'MES' | 'SEMANA' | 'AGENDA';

/**
 * Representa una semana individual dentro del calendario, utilizada para
 * los botones de zoom en cada fila y para la vista semanal expandida.
 */
export interface SemanaRango {
  numeroSemana: number;     // Número de semana del año (ej. 34)
  fechaInicio: Date;        // Lunes de inicio de la semana
  fechaFin: Date;           // Domingo de fin de la semana
  formattedRange: string;   // Texto representativo corto (ej. "17 - 23 Ago")
  days: CalendarDay[];      // Los 7 días que componen esta semana con sus elementos
}

// --- Navigation & Objetivos Domain Models ---

export type ActiveTab = 'CALENDARIO' | 'OBJETIVOS' | 'PROYECTOS' | 'EVENTOS' | 'APRENDIZAJE';

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

export type ProgressMode = 'MANUAL' | 'MILESTONES' | 'CONNECTED';

export type GoalViewMode = 'CARDS' | 'LIST';

export type TimeHorizon = 'SHORT_TERM' | 'LONG_TERM';

export type GoalFilterHorizon = 'ALL' | TimeHorizon;

export interface LinkedProjectSummary {
  id: string;
  title: string;
  colorHex: string;
  status: string;
  progressPercentage: number;
}

export interface LinkedLearningSummary {
  id: string;
  title: string;
  resourceType: string;
  status: string;
  progressPercentage: number;
  platformUrl?: string | null;
}

export interface GoalProgressBreakdown {
  projectsAvg?: number | null;
  coursesAvg?: number | null;
  milestonesAvg?: number | null;
  presentCount: number;
  projects?: number | null;
  learning?: number | null;
  milestones?: number | null;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  themePreference: 'light' | 'dark';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface GoalMilestone {
  id: string;
  goalId?: string;
  title: string;
  isCompleted: boolean;
  weight?: number; // Custom weight for weighted progress calculation
  targetDate?: string | null;
  order: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  colorHex: string;
  startDate?: string | null;
  deadline?: string | null;
  reminderMinutes?: number;
  timeHorizon?: TimeHorizon;
  parentGoalId?: string | null;
  parentGoalTitle?: string | null;
  progressMode: ProgressMode;
  progressPercentage: number; // 0 to 100
  status: GoalStatus;
  milestones: GoalMilestone[];
  linkedLearningCount?: number;
  linkedProjects?: LinkedProjectSummary[];
  linkedCourses?: LinkedLearningSummary[];
  breakdown?: GoalProgressBreakdown | null;
  isAchieved100?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalFilterCriteria {
  status: 'ALL' | GoalStatus;
  category: string; // 'ALL' or specific category
  timeHorizon?: 'ALL' | TimeHorizon;
  searchQuery: string;
}

// --- Proyectos Domain Models ---

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type ProjectViewMode = 'KANBAN' | 'LIST';

export interface TaskSubtask {
  id: string;
  taskId?: string;
  title: string;
  isCompleted: boolean;
  order: number;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string | null;
  deadline?: string | null;
  reminderMinutes?: number;
  order: number;
  subtasks: TaskSubtask[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  colorHex: string;
  status: ProjectStatus;
  progressPercentage: number; // 0 to 100
  goalId?: string | null; // Optional linked Goal
  tasks?: ProjectTask[];
  totalTasks?: number;
  completedTasks?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectFilterCriteria {
  status: 'ALL' | ProjectStatus;
  searchQuery: string;
}

// --- Eventos Domain Models ---

export type EventStatus = 'PROGRAMMED' | 'COMPLETED' | 'CANCELED';

export type TimeBlock = 'TODAY' | 'THIS_WEEK' | 'UPCOMING' | 'PAST';

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  location?: string | null;
  meetingUrl?: string | null;
  category: string;
  colorHex: string;
  status: EventStatus;
  reminderMinutes?: number | null;
  timeBlock?: TimeBlock;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventFilterCriteria {
  status: 'ALL' | EventStatus;
  category: string; // 'ALL' or specific category
  searchQuery: string;
}

// --- Web Push Notifications & PWA Domain Models ---

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionDTO {
  id: string;
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
  createdAt: string;
}

export interface WebPushStatus {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isStandalone: boolean; // True if running as installed PWA (essential for iOS)
}

// --- Welcome & Authentication Domain Models ---

export type AuthMode = 'LOGIN' | 'REGISTER';

export interface LoginCredentials {
  identifier: string; // username or email
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface AuthSessionUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  themePreference: 'light' | 'dark';
}

export interface AuthResponse {
  token: string;
  user: AuthSessionUser;
  message?: string;
}

export interface AuthState {
  user: AuthSessionUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isWelcomeOnly: boolean; // True when user has active session and sees welcome screen
  activeTab: AuthMode;
  isLoading: boolean;
  error: string | null;
}

// --- Aprendizaje (Learning & Knowledge) Domain Models ---

export type ResourceType = 'COURSE' | 'BOOK' | 'ARTICLE' | 'TECH_DOC';

export type LearningStatus = 'BACKLOG' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';

export type LearningProgressMode = 'MANUAL' | 'TOPICS';

export interface LearningTopic {
  id: string;
  learningItemId?: string;
  title: string;
  isCompleted: boolean;
  order: number;
  sectionName?: string | null;
}

export interface LearningItem {
  id: string;
  title: string;
  description?: string;
  resourceType: ResourceType;
  platformName?: string;
  platformUrl?: string;
  colorHex: string;
  status: LearningStatus;
  progressMode: LearningProgressMode;
  progressPercentage: number; // 0 to 100
  currentUnit: number;
  totalUnits: number;
  lastPointReached?: string;
  takeawaysMarkdown?: string;
  goalId?: string | null;
  goalTitle?: string | null;
  projectId?: string | null;
  projectTitle?: string | null;
  lastActivityAt: string;
  dormancyDays?: number;
  isDormant?: boolean;
  dormancyAlertDays?: number;
  topics?: LearningTopic[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningFilterCriteria {
  status: 'ALL' | LearningStatus;
  resourceType: 'ALL' | ResourceType;
  searchQuery: string;
}

// --- Constancia Diaria y Matriz de Progreso (Fases 1 y 2) ---

export type StreakMode = 'CONSECUTIVE' | 'WEEKLY_TARGET';

export interface ActivityCheckIn {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  learningItemId?: string | null;
  eventItemId?: string | null;
  isCompleted: boolean;
  streakCount: number;
  createdAt?: string;
}

export interface WeeklyAttendanceDay {
  date: string; // YYYY-MM-DD
  dayLetter: string; // 'L', 'M', 'X', 'J', 'V', 'S', 'D'
  isToday: boolean;
  isChecked: boolean;
}

export interface ProgressMatrixRow {
  id: string;
  title: string;
  itemType: 'LEARNING' | 'EVENT';
  platformName?: string;
  colorHex: string;
  currentStreak: number;
  weeklyAttendance: WeeklyAttendanceDay[];
  progressPercentage: number;
  progressMode: 'TOPICS' | 'MANUAL';
  currentUnit?: number;
  totalUnits?: number;
  nextTopicTitle?: string;
  isCheckedToday: boolean;
  rawLearningItem?: LearningItem;
  rawEventItem?: EventItem;
}


