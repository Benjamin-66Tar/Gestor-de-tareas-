import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface ProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit: Project | null;
}

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
];

export const ProjectDrawer: React.FC<ProjectDrawerProps> = ({
  isOpen,
  onClose,
  projectToEdit,
}) => {
  const { createProject, updateProject, goals } = useAuraState();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [colorHex, setColorHex] = useState('#6366F1');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');
  const [goalId, setGoalId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize form values when opening or switching projectToEdit
  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title);
      setDescription(projectToEdit.description || '');
      setColorHex(projectToEdit.colorHex || '#6366F1');
      setStatus(projectToEdit.status);
      setGoalId(projectToEdit.goalId || '');
    } else {
      setTitle('');
      setDescription('');
      setColorHex('#6366F1');
      setStatus('ACTIVE');
      setGoalId('');
    }
    setErrorMsg('');
  }, [projectToEdit, isOpen]);

  // Handle ESC key to dismiss
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('El título del proyecto es obligatorio');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload: Partial<Project> = {
        title: title.trim(),
        description: description.trim(),
        colorHex,
        status,
        goalId: goalId ? goalId : undefined,
      };

      let ok = false;
      if (projectToEdit) {
        ok = await updateProject(projectToEdit.id, payload);
      } else {
        ok = await createProject(payload);
      }

      if (ok) {
        onClose();
      } else {
        setErrorMsg('Ocurrió un error al guardar el proyecto. Inténtalo de nuevo.');
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
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between animate-slideLeft">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {projectToEdit ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {projectToEdit
                  ? 'Modifica los datos, colores o meta asociada.'
                  : 'Define una iniciativa para organizar tus tareas en un tablero Kanban.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              ✕
            </button>
          </div>

          {/* Form Body */}
          <form id="project-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
            {errorMsg && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Título del Proyecto *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Rediseño del Sistema, Lanzamiento Web..."
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
                placeholder="Describe el alcance u objetivos clave de este proyecto..."
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition resize-none"
              />
            </div>

            {/* Theme Color Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Color de Identificación
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorHex(c)}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                      colorHex === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {colorHex === c && <span className="text-white text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estado del Ciclo de Vida
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-sm text-white outline-none cursor-pointer"
              >
                <option value="ACTIVE">Activo</option>
                <option value="COMPLETED">Completado</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </div>

            {/* Optional Goal Linkage */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Vincular a un Objetivo (Opcional)
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-sm text-white outline-none cursor-pointer"
              >
                <option value="">Ninguno (Independiente)</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    🎯 {g.title} ({g.progressPercentage}%)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Conectar este proyecto a una meta estratégica te permite alinear tareas con resultados clave.
              </p>
            </div>
          </form>

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
              form="project-form"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : projectToEdit ? 'Actualizar Proyecto' : 'Crear Proyecto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
