export type ElementoTipo = 'CALENDARIO' | 'OBJETIVOS' | 'PROYECTOS' | 'EVENTOS';

export interface PlanElemento {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: 'OBJETIVO' | 'PROYECTO' | 'EVENTO' | 'ACTIVIDAD';
  fecha_limite?: string;
  color_hex: string;
}
