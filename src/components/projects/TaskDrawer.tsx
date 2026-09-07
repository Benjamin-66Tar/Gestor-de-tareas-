import React, { useState, useEffect } from 'react';
import { ProjectTask, TaskPriority, TaskStatus } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit: ProjectTask | null;
  projectId: string;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  projectId,
}) => {
  const { createTask, updateTask } = useAuraState();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [deadline, setDeadline] = useState('');
  const [subtasks, setSubtasks] = useState<Array<{ id?: string; title: string; isCompleted: boolean }>>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setDeadline(taskToEdit.deadline ? taskToEdit.deadline.substring(0, 10) : '');
      setSubtasks(
        (taskToEdit.subtasks || []).map((s) => ({
          id: s.id,
          title: s.title,
          isCompleted: s.isCompleted,
        }))
      );
    } else {
      setTitle('');
      setDescription('');
      setStatus('TODO');
      setPriority('MEDIUM');
      setDeadline('');
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
    setErrorMsg('');
  }, [taskToEdit, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        title: newSubtaskTitle.trim(),
        isCompleted: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleToggleSubtaskLocal = (index: number) => {
    setSubtasks((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, isCompleted: !s.isCompleted } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('El título de la tarea es obligatorio');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload: Partial<ProjectTask> = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        deadline: deadline || null,
        subtasks: subtasks.map((s, idx) => ({
          id: s.id || '',
          taskId: taskToEdit?.id || '',
          title: s.title,
          isCompleted: s.isCompleted,
          order: idx,
        })),
      };

      let ok = false;
      if (taskToEdit) {
        ok = await updateTask(taskToEdit.id, payload);
      } else {
        ok = await createTask(projectId, payload);
      }

      if (ok) {
        onClose();
      } else {
        setErrorMsg('Ocurrió un error al guardar la tarea. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión al guardar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between animate-slideLeft">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {taskToEdit ? 'Editar Tarea' : 'Nueva Tarea'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configura prioridades, fecha límite y subtareas.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
            {errorMsg && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Título de la Tarea *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Diseñar prototipo de la pantalla principal..."
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descripción (opcional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles adicionales, requerimientos o contexto..."
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition resize-none"
                />
              </div>

              {/* Grid: Status, Priority, Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Columna / Estado
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="TODO">Por hacer</option>
                    <option value="IN_PROGRESS">En progreso</option>
                    <option value="DONE">Completado</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nivel de Prioridad
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="LOW">Baja (🟢)</option>
                    <option value="MEDIUM">Media (🟡)</option>
                    <option value="HIGH">Alta (🔴)</option>
                  </select>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Fecha Límite (se proyectará en el Calendario)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs text-white outline-none cursor-pointer"
                />
              </div>
            </form>

            {/* Subtasks Checklist Section */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Checklist de Subtareas ({subtasks.filter((s) => s.isCompleted).length}/{subtasks.length})
                </label>
              </div>

              {/* Subtasks List */}
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                {subtasks.map((sub, idx) => (
                  <div
                    key={sub.id || idx}
                    className="flex items-center justify-between gap-2 p-2 bg-slate-800/70 border border-slate-700/70 rounded-xl text-xs"
                  >
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sub.isCompleted}
                        onChange={() => handleToggleSubtaskLocal(idx)}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                      />
                      <span className={`text-slate-200 truncate ${sub.isCompleted ? 'line-through text-slate-500' : ''}`}>
                        {sub.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {subtasks.length === 0 && (
                  <p className="text-xs text-slate-500 italic">
                    Sin subtareas asignadas aún.
                  </p>
                )}
              </div>

              {/* Add New Subtask Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask(e);
                    }
                  }}
                  placeholder="Agregar nueva subtarea y presiona Enter..."
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  + Añadir
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/90">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="task-form"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : taskToEdit ? 'Actualizar Tarea' : 'Crear Tarea'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
