import React, { useState, useEffect, useMemo } from 'react';
import { Goal, GoalMilestone, ProgressMode, GoalStatus, TimeHorizon } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';
import { formatToLocalInputDate } from '../../utils/dateUtils';

interface GoalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit: Goal | null;
}

const COLOR_PRESETS = [
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#F59E0B', // Amber / Gold
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#EF4444', // Red
];

const CATEGORY_PRESETS = ['General', 'Trabajo', 'Aprendizaje', 'Salud', 'Finanzas', 'Proyectos'];

const REMINDER_OPTIONS = [
  { value: 0, label: 'Al momento exacto (0 min)' },
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 1440, label: '1 día antes' },
];

/**
 * Componente GoalDrawer (Fases 3 y 4 - US12 y US13):
 * 
 * Panel lateral para creación y edición de objetivos estratégicos.
 * Incluye:
 * - Clasificador de Horizonte Temporal (Corto Plazo vs Largo Plazo) con sugerencia inteligente según fecha límite (<=30 vs >30 días).
 * - Selector de objetivo padre (para vincular metas de corto plazo a objetivos estratégicos de largo plazo).
 * - Selectores multiselección bidireccionales para vincular Proyectos y Recursos de Aprendizaje.
 * - Modo de progreso integrado ('CONNECTED') que calcula promedio equitativo automáticamente.
 */
export const GoalDrawer: React.FC<GoalDrawerProps> = ({ isOpen, onClose, goalToEdit }) => {
  const {
    createGoal,
    updateGoal,
    linkGoalComponents,
    goals,
    projects,
    learningItems,
  } = useAuraState();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [colorHex, setColorHex] = useState('#10B981');
  const [deadline, setDeadline] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number>(0);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('SHORT_TERM');
  const [parentGoalId, setParentGoalId] = useState<string | null>(null);
  const [linkedProjectIds, setLinkedProjectIds] = useState<string[]>([]);
  const [linkedLearningIds, setLinkedLearningIds] = useState<string[]>([]);
  const [progressMode, setProgressMode] = useState<ProgressMode>('MILESTONES');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [status, setStatus] = useState<GoalStatus>('ACTIVE');
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneWeight, setNewMilestoneWeight] = useState<number>(1);
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Lista de posibles objetivos padre (objetivos de largo plazo excluyendo el actual)
  const candidateParentGoals = useMemo(() => {
    return (goals || []).filter(
      (g) => g.timeHorizon === 'LONG_TERM' && (!goalToEdit || g.id !== goalToEdit.id)
    );
  }, [goals, goalToEdit]);

  // Poblar o reiniciar el formulario
  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title || '');
      setDescription(goalToEdit.description || '');
      setCategory(goalToEdit.category || 'General');
      setColorHex(goalToEdit.colorHex || (goalToEdit as any).color_hex || '#10B981');
      const rawStart = goalToEdit.startDate || (goalToEdit as any).start_date;
      if (rawStart) {
        setIsRangeMode(true);
        setStartDate(formatToLocalInputDate(rawStart));
      } else {
        setIsRangeMode(false);
        setStartDate('');
      }
      setDeadline(formatToLocalInputDate(goalToEdit.deadline));
      setReminderMinutes(
        typeof goalToEdit.reminderMinutes === 'number'
          ? goalToEdit.reminderMinutes
          : (typeof (goalToEdit as any).reminder_minutes === 'number' ? (goalToEdit as any).reminder_minutes : 0)
      );
      setTimeHorizon(goalToEdit.timeHorizon || 'SHORT_TERM');
      setParentGoalId(goalToEdit.parentGoalId || (goalToEdit as any).parent_goal || null);
      
      // Proyectos vinculados existentes
      const currentProjIds = goalToEdit.linkedProjects
        ? goalToEdit.linkedProjects.map((p) => p.id)
        : (projects || []).filter((p) => p.goalId === goalToEdit.id || (p as any).goal === goalToEdit.id).map((p) => p.id);
      setLinkedProjectIds(currentProjIds);

      // Cursos vinculados existentes
      const currentLearningIds = goalToEdit.linkedCourses
        ? goalToEdit.linkedCourses.map((c) => c.id)
        : (learningItems || []).filter((l) => (l.goalId === goalToEdit.id || (l as any).goal === goalToEdit.id) && !(l as any).isDeleted).map((l) => l.id);
      setLinkedLearningIds(currentLearningIds);

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
      setIsRangeMode(false);
      setStartDate('');
      setDeadline('');
      setReminderMinutes(0);
      setTimeHorizon('SHORT_TERM');
      setParentGoalId(null);
      setLinkedProjectIds([]);
      setLinkedLearningIds([]);
      setProgressMode('MILESTONES');
      setProgressPercentage(0);
      setStatus('ACTIVE');
      setMilestones([]);
    }
    setNewMilestoneTitle('');
    setNewMilestoneWeight(1);
    setNewMilestoneDate('');
  }, [goalToEdit, isOpen, projects, learningItems]);

  // Sugerencia inteligente de horizonte temporal al cambiar la fecha límite
  const handleDeadlineChange = (val: string) => {
    setDeadline(val);
    if (val) {
      const now = new Date();
      const start = startDate ? new Date(startDate) : now;
      const target = new Date(val);
      const diffDays = Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        setTimeHorizon('LONG_TERM');
        if (colorHex === '#10B981') setColorHex('#F59E0B');
      } else {
        setTimeHorizon('SHORT_TERM');
      }
    }
  };

  // Recálculo del progreso para vista previa
  const calculatedProgress = useMemo(() => {
    if (progressMode === 'MANUAL') return progressPercentage;
    if (progressMode === 'CONNECTED') {
      // Simular cálculo multicomponente
      const components: number[] = [];
      if (linkedProjectIds.length > 0) {
        const pList = (projects || []).filter((p) => linkedProjectIds.includes(p.id));
        const avgP = pList.length > 0 ? Math.round(pList.reduce((acc, p) => acc + (p.progressPercentage || 0), 0) / pList.length) : 0;
        components.push(avgP);
      }
      if (linkedLearningIds.length > 0) {
        const lList = (learningItems || []).filter((l) => linkedLearningIds.includes(l.id));
        const avgL = lList.length > 0 ? Math.round(lList.reduce((acc, l) => acc + (l.progressPercentage || 0), 0) / lList.length) : 0;
        components.push(avgL);
      }
      if (milestones.length > 0) {
        const totalW = milestones.reduce((sum, m) => sum + (m.weight || 1), 0);
        const doneW = milestones.filter((m) => m.isCompleted).reduce((sum, m) => sum + (m.weight || 1), 0);
        components.push(totalW > 0 ? Math.round((doneW / totalW) * 100) : 0);
      }
      if (components.length === 0) return 0;
      return Math.round(components.reduce((a, b) => a + b, 0) / components.length);
    }
    if (milestones.length === 0) return 0;
    const totalWeight = milestones.reduce((sum, m) => sum + (m.weight && m.weight > 0 ? m.weight : 1), 0);
    if (totalWeight <= 0) return 0;
    const completedWeight = milestones
      .filter((m) => m.isCompleted)
      .reduce((sum, m) => sum + (m.weight && m.weight > 0 ? m.weight : 1), 0);
    return Math.min(100, Math.max(0, Math.round((completedWeight / totalWeight) * 100)));
  }, [progressMode, progressPercentage, milestones, linkedProjectIds, linkedLearningIds, projects, learningItems]);

  const goalRangeText = useMemo(() => {
    if (!isRangeMode || !startDate || !deadline) return null;
    const d1 = new Date(startDate);
    const d2 = new Date(deadline);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays <= 0) return 'La fecha límite debe ser igual o posterior a la fecha de inicio';
    return `Abarca del día ${d1.getDate()} al ${d2.getDate()} (${diffDays} días)`;
  }, [isRangeMode, startDate, deadline]);

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

  const toggleProjectLink = (projectId: string) => {
    setLinkedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const toggleLearningLink = (learningId: string) => {
    setLinkedLearningIds((prev) =>
      prev.includes(learningId) ? prev.filter((id) => id !== learningId) : [...prev, learningId]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Por favor ingresa un título para el objetivo.');
      return;
    }

    setIsSaving(true);

    // Si tiene proyectos o cursos vinculados, sugerir o adoptar modo CONNECTED
    const finalMode =
      linkedProjectIds.length > 0 || linkedLearningIds.length > 0
        ? 'CONNECTED'
        : progressMode;

    const payload: Partial<Goal> & { reminder_minutes?: number } = {
      title: title.trim(),
      description: description.trim(),
      category,
      colorHex,
      startDate: isRangeMode && startDate ? new Date(startDate).toISOString() : null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      reminderMinutes,
      reminder_minutes: reminderMinutes,
      timeHorizon,
      parentGoalId: parentGoalId || null,
      progressMode: finalMode,
      progressPercentage: finalMode === 'MANUAL' ? progressPercentage : calculatedProgress,
      status,
      milestones,
    };

    let savedGoalId = goalToEdit?.id;
    let success = false;

    if (goalToEdit) {
      success = await updateGoal(goalToEdit.id, payload);
    } else {
      success = await createGoal(payload);
      // Obtener el ID recién creado si es posible o esperar sincronización
      if (success && goals.length > 0) {
        savedGoalId = goals[0]?.id;
      }
    }

    // Vincular componentes si hay objetivo activo
    if (success && savedGoalId) {
      await linkGoalComponents(savedGoalId, linkedProjectIds, linkedLearningIds);
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
      <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col z-10 text-slate-100 animate-slideLeft">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                {goalToEdit ? 'Editar Objetivo' : 'Nuevo Objetivo Estratégico'}
              </span>
              {timeHorizon === 'LONG_TERM' && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50">
                  🏔️ Largo Plazo
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-100 mt-0.5">
              {goalToEdit ? goalToEdit.title : 'Configurar Meta & Horizontes'}
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

          {/* Clasificador de Horizonte Temporal (Fase 3 - US12) */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⏱️</span> Horizonte Temporal
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sugerencia automática según fecha límite con opción de cambio manual.
                </p>
              </div>
            </div>

            {/* Selector Pills: Corto Plazo vs Largo Plazo */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTimeHorizon('SHORT_TERM')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  timeHorizon === 'SHORT_TERM'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <span>⚡</span>
                <span>Corto Plazo (≤ 30 días)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTimeHorizon('LONG_TERM');
                  if (colorHex === '#10B981') setColorHex('#F59E0B');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border ${
                  timeHorizon === 'LONG_TERM'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <span>🏔️</span>
                <span>Largo Plazo (&gt; 30 días)</span>
              </button>
            </div>

            {/* Selector de Objetivo Padre (si hay candidatos) */}
            {candidateParentGoals.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Vincular a Objetivo Estratégico Padre (Opcional)
                </label>
                <select
                  value={parentGoalId || ''}
                  onChange={(e) => setParentGoalId(e.target.value ? e.target.value : null)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="">Sin objetivo padre (Independiente)</option>
                  {candidateParentGoals.map((pGoal) => (
                    <option key={pGoal.id} value={pGoal.id}>
                      🏔️ {pGoal.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
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

          {/* Deadline, Rango & Status */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>🗓️</span> Fechas y Plazos
              </span>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRangeMode(false)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    !isRangeMode
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fecha Límite
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRangeMode(true);
                    if (!startDate) {
                      const now = new Date();
                      setStartDate(formatToLocalInputDate(now));
                    }
                    if (!deadline) {
                      const end = new Date();
                      end.setDate(end.getDate() + 5);
                      setDeadline(formatToLocalInputDate(end));
                    }
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    isRangeMode
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ↔ Abarcar Rango
                </button>
              </div>
            </div>

            <div className={`grid ${isRangeMode ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              {isRangeMode && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 rounded-xl text-xs text-slate-100 focus:outline-none transition cursor-pointer font-mono"
                  />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {isRangeMode ? 'Fecha de Fin (Límite)' : 'Fecha Límite'}
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => handleDeadlineChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 rounded-xl text-xs text-slate-100 focus:outline-none transition cursor-pointer font-mono"
                />
              </div>
            </div>

            {/* Reminder & Web Push Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <span>🔔</span> Recordatorio y Alerta Push
              </label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 hover:border-slate-600 focus:border-emerald-500 rounded-xl text-xs text-slate-100 focus:outline-none transition cursor-pointer"
              >
                {REMINDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {goalRangeText && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium animate-fadeIn">
                <span className="text-sm">✨</span>
                <span>{goalRangeText}</span>
              </div>
            )}
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

          {/* Pickers Multiselección de Proyectos y Aprendizaje (Fase 4 - US13) */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🚀</span> Vincular Proyectos ({linkedProjectIds.length})
                </label>
                <span className="text-[10px] text-blue-400 font-semibold">
                  Alineación táctica
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Selecciona proyectos de tu tablero que contribuyen directamente al cumplimiento de esta meta.
              </p>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(projects || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-2 bg-slate-900/40 rounded-lg text-center">
                    No hay proyectos creados aún.
                  </p>
                ) : (
                  (projects || []).map((proj) => {
                    const isSelected = linkedProjectIds.includes(proj.id);
                    return (
                      <div
                        key={proj.id}
                        onClick={() => toggleProjectLink(proj.id)}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition select-none ${
                          isSelected
                            ? 'bg-blue-950/30 border-blue-500/50 text-slate-100'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-blue-500 bg-slate-800 border-slate-700 pointer-events-none"
                          />
                          <span className="font-semibold truncate">{proj.title}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-blue-300">
                          {proj.progressPercentage || 0}%
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📚</span> Vincular Recursos de Aprendizaje ({linkedLearningIds.length})
                </label>
                <span className="text-[10px] text-purple-400 font-semibold">
                  Conocimiento aplicado
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Selecciona cursos, libros o documentación técnica que aportan al objetivo.
              </p>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(learningItems || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-2 bg-slate-900/40 rounded-lg text-center">
                    No hay recursos de aprendizaje creados aún.
                  </p>
                ) : (
                  (learningItems || []).map((learn) => {
                    const isSelected = linkedLearningIds.includes(learn.id);
                    return (
                      <div
                        key={learn.id}
                        onClick={() => toggleLearningLink(learn.id)}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition select-none ${
                          isSelected
                            ? 'bg-purple-950/30 border-purple-500/50 text-slate-100'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-purple-500 bg-slate-800 border-slate-700 pointer-events-none"
                          />
                          <span className="font-semibold truncate">{learn.title}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-purple-300">
                          {learn.progressPercentage || 0}%
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Progress Mode Selector */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Modo de Progreso
              </label>
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setProgressMode('CONNECTED')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    progressMode === 'CONNECTED' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Integrado
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMode('MILESTONES')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    progressMode === 'MILESTONES' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Por Hitos
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMode('MANUAL')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    progressMode === 'MANUAL' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Manual
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
                  <span>
                    {progressMode === 'CONNECTED'
                      ? 'Progreso ponderado automático (Proyectos + Aprendizaje + Hitos)'
                      : 'Progreso calculado por hitos'}
                  </span>
                  <span className="text-emerald-400 font-black text-sm">{calculatedProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{ width: `${calculatedProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Milestones Management */}
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
