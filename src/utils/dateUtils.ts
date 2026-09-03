import { CalendarDay, PlanElemento, SemanaRango } from '../domain/types';

/**
 * Formats a Date object as a local YYYY-MM-DD string.
 */
export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generates an array of 42 CalendarDay objects representing the calendar grid
 * for a specific year and month (0-indexed, where 0 is January).
 * The grid starts on Monday.
 */
export const generateCalendarGrid = (year: number, month: number, items: PlanElemento[] = []): CalendarDay[] => {
  const firstDayOfMonth = new Date(year, month, 1);
  
  // Calculate padding days from the previous month to start on Monday
  // In JavaScript: Sunday is 0, Monday is 1, ..., Saturday is 6.
  // We want Lunes (1) -> 0 padding, Martes (2) -> 1 padding, ..., Domingo (0) -> 6 padding.
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0-6
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  const startDate = new Date(year, month, 1 - paddingDays);
  const grid: CalendarDay[] = [];
  const todayStr = formatLocalDate(new Date());

  // Map items by their due date for O(N) lookup
  const itemsMap: Record<string, PlanElemento[]> = {};
  items.forEach(item => {
    if (item.fecha_limite) {
      // Parse ISO string from backend (e.g. 2026-07-15T12:00:00Z) to get YYYY-MM-DD
      const datePart = item.fecha_limite.split('T')[0];
      if (!itemsMap[datePart]) {
        itemsMap[datePart] = [];
      }
      itemsMap[datePart].push(item);
    }
  });

  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const formattedDate = formatLocalDate(currentDate);
    
    grid.push({
      date: currentDate,
      formattedDate,
      dayNumber: currentDate.getDate(),
      isCurrentMonth: currentDate.getMonth() === month,
      isToday: formattedDate === todayStr,
      items: itemsMap[formattedDate] || []
    });
  }

  return grid;
};

/**
 * Helper to get the start and end dates of the grid as local ISO strings
 * for querying the backend API.
 */
export const getGridDateRange = (year: number, month: number): { startStr: string; endStr: string } => {
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  const startGridDate = new Date(year, month, 1 - paddingDays);
  // Grid end date is 41 days after start date
  const endGridDate = new Date(startGridDate.getFullYear(), startGridDate.getMonth(), startGridDate.getDate() + 41, 23, 59, 59);

  return {
    startStr: startGridDate.toISOString(),
    endStr: endGridDate.toISOString()
  };
};

/**
 * Nombres cortos de los meses en español para etiquetas de rangos.
 */
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Nombres completos de los meses en español para encabezados.
 */
const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Calcula el número de semana ISO-8601 para una fecha determinada.
 * El estándar ISO-8601 considera que las semanas inician en Lunes y la
 * primera semana del año contiene el 4 de enero.
 */
export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Día 0 en JS es Domingo; en ISO Lunes es 1 y Domingo es 7.
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Divide la cuadrícula mensual de 42 días en 6 semanas (filas de 7 días).
 * Cada semana incluye información de rango (ej. "17 - 23 Ago"), número de semana
 * y los 7 días con sus elementos asociados.
 */
export const getWeeksFromGrid = (grid: CalendarDay[]): SemanaRango[] => {
  const weeks: SemanaRango[] = [];
  
  for (let i = 0; i < grid.length; i += 7) {
    const weekDays = grid.slice(i, i + 7);
    if (weekDays.length < 7) break;
    
    const firstDay = weekDays[0].date;
    const lastDay = weekDays[6].date;
    const weekNum = getWeekNumber(firstDay);

    const sameMonth = firstDay.getMonth() === lastDay.getMonth();
    const formattedRange = sameMonth
      ? `${firstDay.getDate()} - ${lastDay.getDate()} ${MESES_CORTOS[firstDay.getMonth()]}`
      : `${firstDay.getDate()} ${MESES_CORTOS[firstDay.getMonth()]} - ${lastDay.getDate()} ${MESES_CORTOS[lastDay.getMonth()]}`;

    weeks.push({
      numeroSemana: weekNum,
      fechaInicio: firstDay,
      fechaFin: lastDay,
      formattedRange,
      days: weekDays
    });
  }

  return weeks;
};

/**
 * Genera los 7 días de una semana específica (Lunes a Domingo) alrededor de una fecha objetivo.
 * Mapea y ordena cronológicamente los elementos que caen en cada día.
 */
export const getWeekDaysForDate = (targetDate: Date, items: PlanElemento[] = []): CalendarDay[] => {
  // Obtener el día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
  const day = targetDate.getDay();
  // Calcular la diferencia para llegar al Lunes previo o actual
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + diffToMonday);
  const todayStr = formatLocalDate(new Date());

  // Mapear elementos por fecha
  const itemsMap: Record<string, PlanElemento[]> = {};
  items.forEach(item => {
    if (item.fecha_limite) {
      const datePart = item.fecha_limite.split('T')[0];
      if (!itemsMap[datePart]) itemsMap[datePart] = [];
      itemsMap[datePart].push(item);
    }
  });

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const formattedDate = formatLocalDate(current);
    
    // Obtener elementos del día y ordenarlos cronológicamente por hora
    const dayItems = (itemsMap[formattedDate] || []).slice().sort((a, b) => {
      const timeA = a.fecha_limite ? new Date(a.fecha_limite).getTime() : 0;
      const timeB = b.fecha_limite ? new Date(b.fecha_limite).getTime() : 0;
      return timeA - timeB;
    });

    days.push({
      date: current,
      formattedDate,
      dayNumber: current.getDate(),
      isCurrentMonth: true,
      isToday: formattedDate === todayStr,
      items: dayItems
    });
  }

  return days;
};

/**
 * Formatea el título legible de la semana completa en español.
 * Ejemplo: "17 al 23 de Agosto de 2026" o "27 de Julio al 2 de Agosto de 2026"
 */
export const formatWeekTitle = (startDate: Date, endDate: Date): string => {
  const diaInicio = startDate.getDate();
  const diaFin = endDate.getDate();
  const mesInicio = MESES_LARGOS[startDate.getMonth()];
  const mesFin = MESES_LARGOS[endDate.getMonth()];
  const anio = endDate.getFullYear();

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${diaInicio} al ${diaFin} de ${mesFin} de ${anio}`;
  }
  return `${diaInicio} de ${mesInicio} al ${diaFin} de ${mesFin} de ${anio}`;
};
