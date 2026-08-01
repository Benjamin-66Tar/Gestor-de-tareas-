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

