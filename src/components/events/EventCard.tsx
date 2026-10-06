import React, { useState } from 'react';
import { EventItem, EventStatus } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface EventCardProps {
  event: EventItem;
  onEdit: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onEdit }) => {
  const { updateEventStatus, deleteEvent, checkIns, streaks, toggleCheckIn } = useAuraState();
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const todayDate = new Date().toISOString().slice(0, 10);
  const isCheckedToday = !!checkIns[`${event.id}_${todayDate}`];
  const currentStreak = streaks[event.id] || 0;

  const handleToggleCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleCheckIn({ eventItemId: event.id, date: todayDate });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar el evento "${event.title}"?`)) {
      setIsUpdating(true);
      await deleteEvent(event.id);
    }
  };

  const handleStatusChange = async (newStatus: EventStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    await updateEventStatus(event.id, newStatus);
    setIsUpdating(false);
  };

  const statusConfig: Record<EventStatus, { label: string; badgeClass: string }> = {
    PROGRAMMED: {
      label: 'Programado',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    COMPLETED: {
      label: 'Completado',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    CANCELED: {
      label: 'Cancelado',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
  };

  // Format time range nicely (e.g., "15:00 - 16:30" or "14 sep, 15:00 - 16:30")
  const formatEventTimes = (startIso: string, endIso: string) => {
    try {
      const start = new Date(startIso);
      const end = new Date(endIso);
      const startTimeStr = start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const endTimeStr = end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

      const sameDay = start.toDateString() === end.toDateString();
      const dateStr = start.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
      });

      return {
        dateStr,
        timeSpan: `${startTimeStr} - ${endTimeStr}`,
        sameDay,
      };
    } catch {
      return { dateStr: '', timeSpan: '', sameDay: true };
    }
  };

  const { dateStr, timeSpan } = formatEventTimes(event.startTime, event.endTime);
  const colorHex = event.colorHex || '#3B82F6';
  const isCompleted = event.status === 'COMPLETED';
  const isCanceled = event.status === 'CANCELED';

  return (
    <div
      className={`relative bg-slate-900/90 border rounded-2xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between group hover:shadow-xl ${
        isCompleted
          ? 'border-emerald-500/30 bg-slate-900/60 opacity-90'
          : isCanceled
          ? 'border-rose-500/20 bg-slate-950/70 opacity-60'
          : 'border-slate-800 hover:border-slate-700/90'
      } ${isUpdating ? 'opacity-40 pointer-events-none' : ''}`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: colorHex,
      }}
    >
      <div>
        {/* Top Header: Category badge, status tag, and edit/delete actions */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-0.5 text-xs font-bold rounded-full border shadow-sm flex items-center gap-1.5"
              style={{
                backgroundColor: `${colorHex}1A`,
                borderColor: `${colorHex}4D`,
                color: colorHex,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorHex }} />
              {event.category}
            </span>

            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                statusConfig[event.status]?.badgeClass || statusConfig.PROGRAMMED.badgeClass
              }`}
            >
              {statusConfig[event.status]?.label || event.status}
            </span>

            {event.reminderMinutes && event.reminderMinutes > 0 && (
              <span
                className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1"
                title={`Recordatorio programado ${event.reminderMinutes} minutos antes`}
              >
                🔔 {event.reminderMinutes}m
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(event)}
              title="Editar evento"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg text-xs transition"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              title="Eliminar evento"
              className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-lg text-xs transition"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          className={`font-extrabold text-base sm:text-lg tracking-tight leading-snug mb-1 ${
            isCanceled
              ? 'line-through text-slate-500'
              : isCompleted
              ? 'text-slate-200'
              : 'text-slate-100'
          }`}
        >
          {event.title}
        </h3>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
            {event.description}
          </p>
        )}

        {/* Schedule & Location Details */}
        <div className="space-y-1.5 my-3 text-xs text-slate-300">
          {/* Time & Date */}
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <span className="text-sm">🕒</span>
            <span className="capitalize text-slate-400">{dateStr}:</span>
            <span className="font-semibold text-slate-100 font-mono">{timeSpan}</span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-slate-400 truncate">
              <span className="text-sm">📍</span>
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Meeting URL */}
          {event.meetingUrl && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm">📹</span>
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 underline underline-offset-2 transition"
                onClick={(e) => e.stopPropagation()}
              >
                <span>Unirse a videollamada</span>
                <span className="text-[10px]">↗</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Footer */}
      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap text-xs">
        {/* Primary Daily Consistency Action: Listo hoy toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {event.status === 'PROGRAMMED' && (
            <button
              onClick={handleToggleCheckIn}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all duration-150 transform active:scale-95 flex items-center gap-1.5 text-xs shadow-md ${
                isCheckedToday
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 ring-2 ring-emerald-400/50'
                  : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
              }`}
              title="Registrar constancia de hoy (no cierra el evento para días futuros)"
            >
              <span>✓</span>
              <span>{isCheckedToday ? 'Realizado hoy' : 'Listo hoy'}</span>
              {currentStreak > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black border ${
                  isCheckedToday
                    ? 'bg-slate-950/20 text-slate-950 border-slate-950/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  🔥 {currentStreak}
                </span>
              )}
            </button>
          )}

          {/* Secondary conclusion action */}
          {event.status === 'PROGRAMMED' && (
            <button
              onClick={(e) => handleStatusChange('COMPLETED', e)}
              className="text-[11px] text-slate-400 hover:text-emerald-400 transition underline underline-offset-2 ml-1"
              title="Concluir evento definitivamente (marca todo el ciclo como terminado)"
            >
              Concluir evento definitivamente
            </button>
          )}

          {event.status !== 'CANCELED' && event.status !== 'COMPLETED' && (
            <button
              onClick={(e) => handleStatusChange('CANCELED', e)}
              className="px-2 py-1 rounded-lg font-medium text-slate-500 hover:text-rose-400 transition text-xs"
              title="Cancelar evento"
            >
              ✕ Cancelar
            </button>
          )}

          {(isCompleted || isCanceled) && (
            <button
              onClick={(e) => handleStatusChange('PROGRAMMED', e)}
              className="px-2.5 py-1 rounded-lg font-semibold bg-blue-500/10 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 transition active:scale-95 text-xs flex items-center gap-1"
            >
              <span>↺</span>
              <span>Reactivar</span>
            </button>
          )}
        </div>

        <button
          onClick={() => onEdit(event)}
          className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition ml-auto"
        >
          Detalles &rarr;
        </button>
      </div>
    </div>
  );
};
