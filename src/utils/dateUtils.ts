import { CalendarDay, PlanElemento } from '../domain/types';

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
