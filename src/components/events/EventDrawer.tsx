import React, { useState, useEffect } from 'react';
import { EventItem, EventStatus } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface EventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit: EventItem | null;
}

const COLOR_PRESETS = [
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
];

const CATEGORY_PRESETS = ['Trabajo', 'Reunión', 'Personal', 'Social', 'Salud', 'General'];

const REMINDER_OPTIONS = [
  { value: 0, label: 'Sin recordatorio' },
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 1440, label: '1 día antes' },
];

const formatToInputDate = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
};

export const EventDrawer: React.FC<EventDrawerProps> = ({ isOpen, onClose, eventToEdit }) => {
  const { createEvent, updateEvent } = useAuraState();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Trabajo');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [colorHex, setColorHex] = useState('#3B82F6');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [status, setStatus] = useState<EventStatus>('PROGRAMMED');
  const [reminderMinutes, setReminderMinutes] = useState<number>(15);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form state
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setDescription(eventToEdit.description || '');

      const isPresetCat = CATEGORY_PRESETS.includes(eventToEdit.category);
      if (isPresetCat) {
        setCategory(eventToEdit.category);
        setIsCustomCategory(false);
        setCustomCategory('');
      } else {
        setCategory('Otro');
        setIsCustomCategory(true);
        setCustomCategory(eventToEdit.category || '');
      }

      setColorHex(eventToEdit.colorHex || '#3B82F6');

      try {
        setStartTime(formatToInputDate(new Date(eventToEdit.startTime)));
        setEndTime(formatToInputDate(new Date(eventToEdit.endTime)));
      } catch {
        const now = new Date();
        setStartTime(formatToInputDate(now));
        const end = new Date(now.getTime() + 60 * 60 * 1000);
        setEndTime(formatToInputDate(end));
      }

      setLocation(eventToEdit.location || '');
      setMeetingUrl(eventToEdit.meetingUrl || '');
      setStatus(eventToEdit.status || 'PROGRAMMED');
      setReminderMinutes(typeof eventToEdit.reminderMinutes === 'number' ? eventToEdit.reminderMinutes : 15);
    } else {
      // Default to next full hour
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      const startStr = formatToInputDate(now);

      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const endStr = formatToInputDate(oneHourLater);

      setTitle('');
      setDescription('');
      setCategory('Trabajo');
      setIsCustomCategory(false);
      setCustomCategory('');
      setColorHex('#3B82F6');
      setStartTime(startStr);
      setEndTime(endStr);
      setLocation('');
      setMeetingUrl('');
      setStatus('PROGRAMMED');
      setReminderMinutes(15);
    }
    setErrorMessage(null);
  }, [eventToEdit, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('El título del evento es obligatorio.');
      return;
    }

    if (!startTime || !endTime) {
      setErrorMessage('Las fechas y horas de inicio y fin son obligatorias.');
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setErrorMessage('Las fechas ingresadas no son válidas.');
      return;
    }

    if (endDate < startDate) {
      setErrorMessage('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }

    const finalCategory = isCustomCategory ? (customCategory.trim() || 'General') : category;

    setIsSaving(true);

    const eventPayload: Partial<EventItem> = {
      title: trimmedTitle,
      description: description.trim() || '',
      category: finalCategory,
      colorHex: colorHex,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      location: location.trim() || null,
      meetingUrl: meetingUrl.trim() || null,
      status: status,
      reminderMinutes: reminderMinutes > 0 ? reminderMinutes : null,
    };

    let success = false;
    if (eventToEdit) {
      success = await updateEvent(eventToEdit.id, eventPayload);
    } else {
      success = await createEvent(eventPayload);
    }

    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      setErrorMessage('Ocurrió un error al guardar el evento. Intenta de nuevo.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideInRight">
          {/* Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="text-2xl p-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                📅
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-100 tracking-tight">
                  {eventToEdit ? 'Editar Evento' : 'Nuevo Evento'}
                </h2>
                <p className="text-xs text-slate-400">
                  {eventToEdit ? 'Modifica los datos del evento o reunión' : 'Programa una reunión o actividad en la agenda'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
            >
              ✕
            </button>
          </div>

          {/* Form Body */}
          <form id="event-drawer-form" onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
            {errorMessage && (
              <div className="p-3.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-2xl flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Título del Evento *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Sincronización semanal de arquitectura"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Category & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Categoría
                </label>
                <select
                  value={isCustomCategory ? 'Otro' : category}
                  onChange={(e) => {
                    if (e.target.value === 'Otro') {
                      setIsCustomCategory(true);
                    } else {
                      setIsCustomCategory(false);
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                >
                  {CATEGORY_PRESETS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Otro">+ Personalizada</option>
                </select>

                {isCustomCategory && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Nombre de categoría"
                    className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Color Temático
                </label>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setColorHex(preset)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        colorHex === preset ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: preset }}
                      title={preset}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Start and End Datetime */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Inicio *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Fin *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Location & Meeting URL */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Ubicación Física (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-500">📍</span>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej: Sala de Juntas B / Av. Reforma 123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Enlace Virtual (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-500">📹</span>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Reminder & Status (when editing) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Recordatorio
                </label>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                >
                  {REMINDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Estado del Evento
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EventStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="PROGRAMMED">Programado</option>
                  <option value="COMPLETED">Completado</option>
                  <option value="CANCELED">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Descripción / Notas
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Puntos a tratar, orden del día o contexto adicional..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>
          </form>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-800/80 bg-slate-900/60 sticky bottom-0 z-10 backdrop-blur-md flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="event-drawer-form"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25 transition active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : eventToEdit ? 'Actualizar Evento' : 'Guardar Evento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
