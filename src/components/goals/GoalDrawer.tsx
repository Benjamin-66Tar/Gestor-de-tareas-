import React, { useState, useEffect } from 'react';
import { Goal, GoalMilestone, ProgressMode, GoalStatus } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface GoalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit: Goal | null;
}

const COLOR_PRESETS = [
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#EF4444', // Red
];

const CATEGORY_PRESETS = ['General', 'Trabajo', 'Aprendizaje', 'Salud', 'Finanzas', 'Proyectos'];

export const GoalDrawer: React.FC<GoalDrawerProps> = ({ isOpen, onClose, goalToEdit }) => {
  const { createGoal, updateGoal } = useAuraState();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [colorHex, setColorHex] = useState('#10B981');
  const [deadline, setDeadline] = useState('');
  const [progressMode, setProgressMode] = useState<ProgressMode>('MILESTONES');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [status, setStatus] = useState<GoalStatus>('ACTIVE');
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneWeight, setNewMilestoneWeight] = useState<number>(1);
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Populate or reset form fields
  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title || '');
      setDescription(goalToEdit.description || '');
      setCategory(goalToEdit.category || 'General');
      setColorHex(goalToEdit.colorHex || (goalToEdit as any).color_hex || '#10B981');
      setDeadline(goalToEdit.deadline ? goalToEdit.deadline.slice(0, 16) : '');
      setProgressMode(goalToEdit.progressMode || (goalToEdit as any).progress_mode || 'MILESTONES');
      setProgressPercentage(
        typeof goalToEdit.progressPercentage === 'number'
          ? goalToEdit.progressPercentage
          : (typeof (goalToEdit as any).progress_percentage === 'number' ? (goalToEdit as any).progress_percentage : 0)
      );
      setStatus(goalToEdit.status || 'ACTIVE');
      setMilestones(
        goalToEdit.milestones
          ? goalToEdit.milestones.map((m: any) => ({
              id: m.id,
              title: m.title || '',
              isCompleted: Boolean(m.isCompleted ?? m.is_completed),
              weight: typeof m.weight === 'number' ? m.weight : 1,
              targetDate: m.targetDate ?? m.target_date ?? null,
              order: typeof m.order === 'number' ? m.order : 0,
            }))
          : []
      );
    } else {
      setTitle('');
      setDescription('');
      setCategory('General');
      setColorHex('#10B981');
      setDeadline('');
      setProgressMode('MILESTONES');
      setProgressPercentage(0);
      setStatus('ACTIVE');
      setMilestones([]);
    }
    setNewMilestoneTitle('');
    setNewMilestoneWeight(1);
    setNewMilestoneDate('');
  }, [goalToEdit, isOpen]);

  // Recalculate preview progress for milestones mode
  const calculatedProgress = React.useMemo(() => {
    if (progressMode === 'MANUAL') return progressPercentage;
    if (milestones.length === 0) return 0;
    const totalWeight = milestones.reduce((sum, m) => sum + (m.weight && m.weight > 0 ? m.weight : 1), 0);
    if (totalWeight <= 0) return 0;
    const completedWeight = milestones
      .filter(m => m.isCompleted)
      .reduce((sum, m) => sum + (m.weight && m.weight > 0 ? m.weight : 1), 0);
    return Math.min(100, Math.max(0, Math.round((completedWeight / totalWeight) * 100)));
  }, [progressMode, progressPercentage, milestones]);

  if (!isOpen) return null;

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    const newM: GoalMilestone = {
      id: `local-m-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      isCompleted: false,
      weight: Math.max(1, newMilestoneWeight || 1),
      targetDate: newMilestoneDate || null,
      order: milestones.length,
    };

    setMilestones([...milestones, newM]);
    setNewMilestoneTitle('');
    setNewMilestoneWeight(1);
    setNewMilestoneDate('');
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleToggleMilestone = (index: number) => {
    const updated = [...milestones];
    updated[index].isCompleted = !updated[index].isCompleted;
    setMilestones(updated);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Por favor ingresa un título para el objetivo.');
      return;
    }

    setIsSaving(true);
    const payload: Partial<Goal> = {
      title: title.trim(),
      description: description.trim(),
      category,
      colorHex,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      progressMode,
      progressPercentage: progressMode === 'MANUAL' ? progressPercentage : calculatedProgress,
      status,
      milestones,
    };

    let success = false;
    if (goalToEdit) {
      success = await updateGoal(goalToEdit.id, payload);
    } else {
      success = await createGoal(payload);
    }

    setIsSaving(false);
    if (success) {
      onClose();
    } else {
      alert('Ocurrió un error al guardar el objetivo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Slide-over drawer container */}
      <div className="relative w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col z-10 text-slate-100 animate-slideLeft">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              {goalToEdit ? 'Editar Objetivo' : 'Nuevo Objetivo Estratégico'}
            </span>
            <h2 className="text-xl font-black text-slate-100 mt-0.5">
              {goalToEdit ? goalToEdit.title : 'Configurar Meta & Hitos'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Título del Objetivo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Dominar arquitectura en capas con Django y React"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Descripción
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas o contexto sobre lo que implica cumplir esta meta..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Category & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              >
                {CATEGORY_PRESETS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Color Temático
              </label>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColorHex(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      colorHex === color ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Deadline & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Fecha Límite
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="ACTIVE">Activo</option>
                <option value="COMPLETED">Completado</option>
                <option value="PAUSED">En Pausa</option>
              </select>
            </div>
          </div>

          {/* Progress Mode Selector */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Modo de Progreso
              </label>
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setProgressMode('MILESTONES')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    progressMode === 'MILESTONES' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Por Hitos
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMode('MANUAL')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    progressMode === 'MANUAL' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Manual (0-100%)
                </button>
              </div>
            </div>

            {/* Manual Slider View */}
            {progressMode === 'MANUAL' ? (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Porcentaje asignado</span>
                  <span className="text-indigo-400 text-sm font-black">{progressPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(parseInt(e.target.value) || 0)}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            ) : (
              <div className="pt-1">
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                  <span>Progreso calculado por hitos</span>
                  <span className="text-emerald-400 font-black text-sm">{calculatedProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${calculatedProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Milestones Management (Available in both, critical for MILESTONES mode) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Lista de Hitos / Sub-metas ({milestones.length})
              </h4>
              <span className="text-[10px] text-slate-400">
                Ponderación personalizada disponible
              </span>
            </div>

            {/* Existing milestones checklist */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {milestones.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2 bg-slate-950/30 rounded-lg text-center">
                  No hay hitos añadidos todavía.
                </p>
              ) : (
                milestones.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="flex items-center justify-between gap-2 p-2.5 bg-slate-800/70 border border-slate-700/60 rounded-xl text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={m.isCompleted}
                      onChange={() => handleToggleMilestone(idx)}
                      className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <div className="flex-1 truncate">
                      <span className={m.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}>
                        {m.title}
                      </span>
                      {m.targetDate && (
                        <span className="block text-[10px] text-slate-400">
                          📅 {m.targetDate}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      Peso: {m.weight || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1 text-xs"
                      title="Eliminar hito"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add new milestone inline form */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <input
                type="text"
                placeholder="Añadir nuevo hito..."
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-[10px] text-slate-400">Peso:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newMilestoneWeight}
                    onChange={(e) => setNewMilestoneWeight(parseInt(e.target.value) || 1)}
                    className="w-14 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-center text-slate-200"
                  />
                </div>
                <input
                  type="date"
                  value={newMilestoneDate}
                  onChange={(e) => setNewMilestoneDate(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300"
                />
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition"
                >
                  + Agregar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : goalToEdit ? 'Actualizar Meta' : 'Guardar Meta'}
          </button>
        </div>
      </div>
    </div>
  );
};
