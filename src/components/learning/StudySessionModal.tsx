import React, { useState, useEffect } from 'react';
import { LearningItem } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface StudySessionModalProps {
  isOpen: boolean;
  item: LearningItem | null;
  onClose: () => void;
}

export const StudySessionModal: React.FC<StudySessionModalProps> = ({
  isOpen,
  item,
  onClose,
}) => {
  const { scheduleStudySession } = useAuraState();

  // Helper to get formatted local datetime for input
  const getFormattedDateTime = (offsetMinutes: number = 0) => {
    const d = new Date(Date.now() + offsetMinutes * 60000);
    // Pad to ISO format without timezone suffix for <input type="datetime-local">
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [reminderMinutes, setReminderMinutes] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      const start = getFormattedDateTime(60); // 1 hour from now
      const end = getFormattedDateTime(150); // 2.5 hours from now (90 min session)
      setStartTime(start);
      setEndTime(end);
      setNotes(item.lastPointReached ? `Continuar desde: ${item.lastPointReached}` : '');
      setReminderMinutes(15);
      setErrorMsg(null);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      setErrorMsg('Por favor especifica la fecha y hora de inicio y fin.');
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (endDate <= startDate) {
      setErrorMsg('La hora de finalización debe ser posterior a la de inicio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const success = await scheduleStudySession(item.id, {
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      notes,
      reminderMinutes,
    });

    setIsSubmitting(false);
    if (success) {
      onClose();
    } else {
      setErrorMsg('No se pudo programar la sesión de estudio.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Programar Sesión de Estudio
              </h3>
              <p className="text-xs text-purple-400 font-semibold truncate max-w-[260px]">
                {item.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Start Time */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Hora de Inicio *
            </label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Hora de Finalización *
            </label>
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Reminder lead time */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Recordatorio anticipado (Web Push)
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
            >
              <option value={0}>Al momento exacto</option>
              <option value={5}>5 minutos antes</option>
              <option value={10}>10 minutos antes</option>
              <option value={15}>15 minutos antes (Recomendado)</option>
              <option value={30}>30 minutos antes</option>
              <option value={60}>1 hora antes</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Notas u Objetivos del Bloque
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Revisar módulo 3 y resolver laboratorio práctico..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl shadow-lg shadow-purple-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{isSubmitting ? 'Guardando...' : 'Programar en Calendario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
