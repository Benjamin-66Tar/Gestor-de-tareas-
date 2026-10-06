import React, { useState, useEffect } from 'react';
import {
  LearningItem,
  ResourceType,
  LearningStatus,
  LearningProgressMode,
} from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface LearningDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSchedule: (item: LearningItem) => void;
}

const RESOURCE_TYPES: { type: ResourceType; label: string; icon: string }[] = [
  { type: 'COURSE', label: 'Curso', icon: '🎓' },
  { type: 'BOOK', label: 'Libro', icon: '📖' },
  { type: 'ARTICLE', label: 'Artículo', icon: '📰' },
  { type: 'TECH_DOC', label: 'Doc Técnica', icon: '⚙️' },
];

const STATUS_OPTIONS: { status: LearningStatus; label: string }[] = [
  { status: 'BACKLOG', label: 'Por empezar' },
  { status: 'IN_PROGRESS', label: 'En curso' },
  { status: 'PAUSED', label: 'En pausa' },
  { status: 'COMPLETED', label: 'Completado' },
];

export const LearningDrawer: React.FC<LearningDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSchedule,
}) => {
  const {
    activeLearningItem,
    createLearningItem,
    updateLearningItem,
    deleteLearningItem,
    addLearningTopic,
    toggleLearningTopic,
    deleteLearningTopic,
    goals,
    projects,
  } = useAuraState();

  const isEditing = Boolean(activeLearningItem && activeLearningItem.id);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('COURSE');
  const [platformName, setPlatformName] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [colorHex, setColorHex] = useState('#8B5CF6');
  const [status, setStatus] = useState<LearningStatus>('IN_PROGRESS');
  const [progressMode, setProgressMode] = useState<LearningProgressMode>('TOPICS');
  const [currentUnit, setCurrentUnit] = useState<number>(0);
  const [totalUnits, setTotalUnits] = useState<number>(10);
  const [lastPointReached, setLastPointReached] = useState('');
  const [takeawaysMarkdown, setTakeawaysMarkdown] = useState('');
  const [dormancyAlertDays, setDormancyAlertDays] = useState<number>(7);
  const [goalId, setGoalId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');

  // Inline topic creation state
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSection, setNewTopicSection] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeLearningItem) {
      setTitle(activeLearningItem.title || '');
      setDescription(activeLearningItem.description || '');
      setResourceType(activeLearningItem.resourceType || 'COURSE');
      setPlatformName(activeLearningItem.platformName || '');
      setPlatformUrl(activeLearningItem.platformUrl || '');
      setColorHex(activeLearningItem.colorHex || '#8B5CF6');
      setStatus(activeLearningItem.status || 'IN_PROGRESS');
      setProgressMode(activeLearningItem.progressMode || 'TOPICS');
      setCurrentUnit(activeLearningItem.currentUnit || 0);
      setTotalUnits(activeLearningItem.totalUnits || 10);
      setLastPointReached(activeLearningItem.lastPointReached || '');
      setTakeawaysMarkdown(activeLearningItem.takeawaysMarkdown || '');
      setDormancyAlertDays(activeLearningItem.dormancyAlertDays || 7);
      setGoalId(activeLearningItem.goalId || '');
      setProjectId(activeLearningItem.projectId || '');
    } else {
      // New item defaults
      setTitle('');
      setDescription('');
      setResourceType('COURSE');
      setPlatformName('');
      setPlatformUrl('');
      setColorHex('#8B5CF6');
      setStatus('IN_PROGRESS');
      setProgressMode('TOPICS');
      setCurrentUnit(0);
      setTotalUnits(10);
      setLastPointReached('');
      setTakeawaysMarkdown('');
      setDormancyAlertDays(7);
      setGoalId('');
      setProjectId('');
    }
    setErrorMessage(null);
  }, [activeLearningItem, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('El título del recurso es obligatorio.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const payload: Partial<LearningItem> = {
      title: title.trim(),
      description: description.trim(),
      resourceType,
      platformName: platformName.trim(),
      platformUrl: platformUrl.trim(),
      colorHex,
      status,
      progressMode,
      currentUnit: Number(currentUnit) || 0,
      totalUnits: Number(totalUnits) || 0,
      lastPointReached: lastPointReached.trim(),
      takeawaysMarkdown: takeawaysMarkdown.trim(),
      dormancyAlertDays: Number(dormancyAlertDays) || 7,
      goalId: goalId || null,
      projectId: projectId || null,
    };

    let success = false;
    if (isEditing && activeLearningItem) {
      success = await updateLearningItem(activeLearningItem.id, payload);
    } else {
      success = await createLearningItem(payload);
    }

    setIsSaving(false);
    if (!success) {
      setErrorMessage('Hubo un error al guardar el recurso. Intenta de nuevo.');
    }
  };

  const handleAddTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !activeLearningItem) return;
    setIsAddingTopic(true);
    await addLearningTopic(activeLearningItem.id, newTopicTitle.trim(), newTopicSection.trim() || undefined);
    setNewTopicTitle('');
    setNewTopicSection('');
    setIsAddingTopic(false);
  };

  const handleDelete = async () => {
    if (!activeLearningItem) return;
    if (confirm(`¿Eliminar definitivamente "${activeLearningItem.title}"?`)) {
      await deleteLearningItem(activeLearningItem.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-fade-in">
      <div
        className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-y-auto animate-slide-left text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full shadow"
              style={{ backgroundColor: colorHex }}
            />
            <div>
              <h2 className="text-base font-extrabold tracking-tight uppercase">
                {isEditing ? 'Continuidad de Aprendizaje' : 'Nuevo Recurso de Aprendizaje'}
              </h2>
              {isEditing && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-purple-400 font-semibold">{activeLearningItem?.title}</span>
                  {activeLearningItem?.platformUrl && (
                    <a
                      href={activeLearningItem.platformUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-purple-300 font-bold inline-flex items-center gap-0.5 underline"
                    >
                      <span>Abrir</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && activeLearningItem && (
              <button
                type="button"
                onClick={() => onOpenSchedule(activeLearningItem)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition flex items-center gap-1"
                title="Programar sesión en el calendario"
              >
                <span>📅</span>
                <span className="hidden sm:inline">Sesión</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
              title="Cerrar panel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Type Selector Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Tipo de Recurso
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RESOURCE_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setResourceType(t.type)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    resourceType === t.type
                      ? 'bg-purple-500/20 border-purple-500 text-purple-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Título *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Arquitectura Limpia con TypeScript..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Status & Progress Mode Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LearningStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.status} value={s.status}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Modo de Progreso
              </label>
              <select
                value={progressMode}
                onChange={(e) => setProgressMode(e.target.value as LearningProgressMode)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
              >
                <option value="TOPICS">Modular por Temas / Temario</option>
                <option value="MANUAL">Unidades / Páginas directas</option>
              </select>
            </div>
          </div>

          {/* Platform Name & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Plataforma / Fuente
              </label>
              <input
                type="text"
                placeholder="Ej. Udemy, O'Reilly, Coursera, Docs..."
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Enlace / URL de Acceso Directo
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={platformUrl}
                onChange={(e) => setPlatformUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          {/* Bookmark: Last Point Reached */}
          <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base text-purple-400">📍</span>
              <label className="text-xs font-extrabold uppercase tracking-wider text-purple-300">
                Último Punto Alcanzado (Marcador de Continuidad)
              </label>
            </div>
            <p className="text-xs text-slate-400 mb-2.5">
              Guarda el capítulo, video o página exacta en la que quedaste para retomar sin fricción.
            </p>
            <input
              type="text"
              placeholder="Ej. Sección 4: Lección 12 - Hooks de sincronización"
              value={lastPointReached}
              onChange={(e) => setLastPointReached(e.target.value)}
              className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3.5 py-2 text-sm text-purple-100 focus:outline-none focus:border-purple-400 transition"
            />
          </div>

          {/* Topics Checklist Section (if mode is TOPICS and editing) */}
          {progressMode === 'TOPICS' && isEditing && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>📋</span>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    Temario Modular ({activeLearningItem?.topics?.filter(t => t.isCompleted).length || 0} / {activeLearningItem?.topics?.length || 0})
                  </h4>
                </div>
                <span className="text-xs font-bold text-purple-400">
                  {activeLearningItem?.progressPercentage || 0}%
                </span>
              </div>

              {/* Topics List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(!activeLearningItem?.topics || activeLearningItem.topics.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-2 text-center">
                    Aún no has agregado temas al temario. Agrega el primer módulo abajo.
                  </p>
                ) : (
                  activeLearningItem.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={topic.isCompleted}
                          onChange={() => toggleLearningTopic(activeLearningItem.id, topic.id)}
                          className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-700 focus:ring-purple-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-medium block truncate ${topic.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {topic.title}
                          </span>
                          {topic.sectionName && (
                            <span className="text-[10px] text-purple-400/80 font-semibold block truncate">
                              {topic.sectionName}
                            </span>
                          )}
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={() => deleteLearningTopic(activeLearningItem.id, topic.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition text-xs"
                        title="Eliminar tema"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Topic Inline Form */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Título del tema o lección..."
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Sección / Módulo (opcional)"
                  value={newTopicSection}
                  onChange={(e) => setNewTopicSection(e.target.value)}
                  className="sm:w-36 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  disabled={isAddingTopic || !newTopicTitle.trim()}
                  onClick={handleAddTopicSubmit}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition"
                >
                  + Añadir
                </button>
              </div>
            </div>
          )}

          {/* Manual Units Section (if mode is MANUAL) */}
          {progressMode === 'MANUAL' && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Progreso por Páginas o Unidades Directas
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Unidad / Página Actual:</span>
                  <input
                    type="number"
                    min={0}
                    value={currentUnit}
                    onChange={(e) => setCurrentUnit(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Total de Unidades / Páginas:</span>
                  <input
                    type="number"
                    min={1}
                    value={totalUnits}
                    onChange={(e) => setTotalUnits(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Markdown Key Takeaways */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>📝</span>
                <span>Notas Clave / Key Takeaways (Markdown)</span>
              </label>
              <span className="text-[10px] text-slate-400">Soporta Markdown</span>
            </div>
            <textarea
              rows={4}
              placeholder="### Ideas Principales&#10;- Principio de responsabilidad única...&#10;- Evitar acoplamiento en módulos."
              value={takeawaysMarkdown}
              onChange={(e) => setTakeawaysMarkdown(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500 transition resize-y"
            />
          </div>

          {/* Optional Links: Goal and Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Vincular a Objetivo (Opcional)
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
              >
                <option value="">Sin vincular</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
              {goalId && (
                <span className="text-[10px] text-purple-400 mt-1 block">
                  ✓ Al completar el 100%, se actualizarán los hitos y avance de esta meta.
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Vincular a Proyecto (Opcional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
              >
                <option value="">Sin vincular</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Inactivity Dormancy Alert Threshold */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Alerta de inactividad (Días sin avance)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={30}
                value={dormancyAlertDays}
                onChange={(e) => setDormancyAlertDays(Number(e.target.value))}
                className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
              />
              <span className="text-xs text-slate-400">
                días (Aura te enviará un empujón amistoso por Web Push si no avanzas).
              </span>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-xl transition"
              >
                Eliminar Recurso
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl shadow-lg shadow-purple-600/20 transition disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Recurso')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
