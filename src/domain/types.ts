export type ElementoTipo = 'CALENDARIO' | 'OBJETIVOS' | 'PROYECTOS' | 'EVENTOS';

export interface PlanElemento {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: 'OBJETIVO' | 'PROYECTO' | 'EVENTO' | 'ACTIVIDAD';
  fecha_limite?: string;
  color_hex: string;
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

export type ActiveTab = 'CALENDARIO' | 'OBJETIVOS' | 'PROYECTOS' | 'EVENTOS';

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

export type ProgressMode = 'MANUAL' | 'MILESTONES';

export type GoalViewMode = 'CARDS' | 'LIST';

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
  deadline?: string | null;
  progressMode: ProgressMode;
  progressPercentage: number; // 0 to 100
  status: GoalStatus;
  milestones: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalFilterCriteria {
  status: 'ALL' | GoalStatus;
  category: string; // 'ALL' or specific category
  searchQuery: string;
}


