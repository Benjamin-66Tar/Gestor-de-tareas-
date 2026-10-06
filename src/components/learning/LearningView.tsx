import React, { useMemo, useState } from 'react';
import { useAuraState } from '../../context/AuraState';
import { LearningItem, ResourceType, LearningStatus } from '../../domain/types';
import { LearningCard } from './LearningCard';
import { LearningDrawer } from './LearningDrawer';
import { StudySessionModal } from './StudySessionModal';
import { ActivityProgressMatrix } from './ActivityProgressMatrix';
import { LearningTableView } from './LearningTableView';

export const LearningView: React.FC = () => {
  const {
    learningItems,
    learningLoading,
    learningError,
    learningFilter,
    setLearningFilter,
    learningDrawerOpen,
    openLearningDrawer,
    closeLearningDrawer,
    studyModalOpen,
    setStudyModalOpen,
    studyModalItem,
    setStudyModalItem,
    fetchLearningList,
    learningViewMode,
    setLearningViewMode,
    bulkUpdateLearningItems,
    quickAddLearningItem,
    goals,
  } = useAuraState();

  // Quick-Add inline bar state (Choice 4.B)
  const [quickAddInput, setQuickAddInput] = useState('');
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickAddFeedback, setQuickAddFeedback] = useState<string | null>(null);

  // Triage banner state (Choice 3.A)
  const [triageDismissed, setTriageDismissed] = useState(false);
  const [triageLoading, setTriageLoading] = useState(false);

  // Multi-selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  // Live URL inference for quick-add
  const detectedPlatform = useMemo(() => {
    const raw = quickAddInput.trim().toLowerCase();
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) return null;
    if (raw.includes('youtube.com') || raw.includes('youtu.be')) return { name: 'YouTube', color: '#EF4444', icon: '▶️' };
    if (raw.includes('udemy.com')) return { name: 'Udemy', color: '#A435F0', icon: '🎓' };
    if (raw.includes('coursera.org')) return { name: 'Coursera', color: '#0056D2', icon: '🎓' };
    if (raw.includes('platzi.com')) return { name: 'Platzi', color: '#00BF63', icon: '💚' };
    if (raw.includes('github.com')) return { name: 'GitHub', color: '#6E5494', icon: '🐙' };
    if (raw.includes('medium.com')) return { name: 'Medium', color: '#00AB6C', icon: '📰' };
    return { name: 'Web', color: '#8B5CF6', icon: '🌐' };
  }, [quickAddInput]);

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddInput.trim() || quickAddLoading) return;
    setQuickAddLoading(true);
    setQuickAddFeedback(null);
    const success = await quickAddLearningItem(quickAddInput.trim());
    setQuickAddLoading(false);
    if (success) {
      setQuickAddInput('');
      setQuickAddFeedback('¡Recurso guardado en "Por Empezar"!');
      setTimeout(() => setQuickAddFeedback(null), 3000);
    } else {
      setQuickAddFeedback('Hubo un error al guardar.');
    }
  };

  // Dormant items for triage banner
  const dormantItems = useMemo(() => {
    return learningItems.filter((i) => i.isDormant && i.status === 'IN_PROGRESS');
  }, [learningItems]);

  const handleTriagePauseAll = async () => {
    if (dormantItems.length === 0) return;
    setTriageLoading(true);
    const ids = dormantItems.map((d) => d.id);
    await bulkUpdateLearningItems(ids, 'UPDATE_STATUS', { status: 'PAUSED' });
    setTriageLoading(false);
    setTriageDismissed(true);
  };

  const handleTriageDropAll = async () => {
    if (dormantItems.length === 0) return;
    if (
      !confirm(
        `¿Descartar los ${dormantItems.length} recursos inactivos?\nSe liberará tu enfoque y no perjudicará tus objetivos.`
      )
    ) {
      return;
    }
    setTriageLoading(true);
    const ids = dormantItems.map((d) => d.id);
    await bulkUpdateLearningItems(ids, 'UPDATE_STATUS', {
      status: 'DROPPED',
      dropped_reason: 'Inactividad prolongada (Triage asistido)',
    });
    setTriageLoading(false);
    setTriageDismissed(true);
  };

  // Weekly focus items
  const focusItems = useMemo(() => {
    return learningItems.filter(
      (i) => Boolean(i.is_focus ?? i.isFocus) && i.status !== 'DROPPED' && i.status !== 'COMPLETED'
    );
  }, [learningItems]);

  // Resource Type pills
  const typePills: { type: 'ALL' | ResourceType; label: string; icon: string }[] = [
    { type: 'ALL', label: 'Todos', icon: '✨' },
    { type: 'COURSE', label: 'Cursos', icon: '🎓' },
    { type: 'BOOK', label: 'Libros', icon: '📖' },
    { type: 'ARTICLE', label: 'Artículos', icon: '📰' },
    { type: 'TECH_DOC', label: 'Documentación', icon: '⚙️' },
  ];

  // Filter items in memory based on current search & filters
  const filteredItems = useMemo(() => {
    const q = learningFilter.searchQuery.trim().toLowerCase();
    return learningItems.filter((item) => {
      // Status filter
      if (learningFilter.status !== 'ALL' && item.status !== learningFilter.status) {
        return false;
      }
      // Resource type filter
      if (learningFilter.resourceType !== 'ALL' && item.resourceType !== learningFilter.resourceType) {
        return false;
      }
      // Search text
      if (q) {
        const matchesTitle = (item.title || '').toLowerCase().includes(q);
        const matchesPlatform = (item.platformName || '').toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesLastPoint = (item.lastPointReached || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesPlatform && !matchesDesc && !matchesLastPoint) {
          return false;
        }
      }
      return true;
    });
  }, [learningItems, learningFilter]);

  // Status groupings for Kanban
  const itemsByStatus = useMemo(() => {
    const groups: Record<LearningStatus, LearningItem[]> = {
      IN_PROGRESS: [],
      BACKLOG: [],
      PAUSED: [],
      COMPLETED: [],
      DROPPED: [],
    };
    filteredItems.forEach((item) => {
      if (groups[item.status]) {
        groups[item.status].push(item);
      } else {
        groups.BACKLOG.push(item);
      }
    });
    return groups;
  }, [filteredItems]);

  // Overall metric counters
  const totalCount = learningItems.length;
  const inProgressCount = learningItems.filter((i) => i.status === 'IN_PROGRESS').length;
  const completedCount = learningItems.filter((i) => i.status === 'COMPLETED').length;
  const dormantCount = learningItems.filter((i) => i.isDormant && i.status === 'IN_PROGRESS').length;
  const droppedCount = learningItems.filter((i) => i.status === 'DROPPED').length;

  const handleOpenSchedule = (item: LearningItem) => {
    setStudyModalItem(item);
    setStudyModalOpen(true);
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedIds(filteredItems.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Bulk action operations
  const handleBulkStatus = async (newStatus: LearningStatus) => {
    if (selectedIds.length === 0 || bulkActionLoading) return;
    if (newStatus === 'DROPPED') {
      const proceed = confirm(
        `¿Descartar los ${selectedIds.length} recursos seleccionados?\nSe liberará tu enfoque y se desvincularán de tus objetivos sin alterar sus estadísticas.`
      );
      if (!proceed) return;
    }
    setBulkActionLoading(true);
    await bulkUpdateLearningItems(selectedIds, 'UPDATE_STATUS', {
      status: newStatus,
      dropped_reason: newStatus === 'DROPPED' ? 'Descarte masivo en lote' : undefined,
    });
    setSelectedIds([]);
    setBulkActionLoading(false);
  };

  const handleBulkLinkGoal = async (goalId: string) => {
    if (selectedIds.length === 0 || !goalId || bulkActionLoading) return;
    setBulkActionLoading(true);
    await bulkUpdateLearningItems(selectedIds, 'LINK_GOAL', { goal_id: goalId });
    setSelectedGoalId('');
    setSelectedIds([]);
    setBulkActionLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 || bulkActionLoading) return;
    if (confirm(`¿Eliminar definitivamente los ${selectedIds.length} recursos seleccionados?`)) {
      setBulkActionLoading(true);
      await bulkUpdateLearningItems(selectedIds, 'SOFT_DELETE');
      setSelectedIds([]);
      setBulkActionLoading(false);
    }
  };

  const columnsConfig: { status: LearningStatus; label: string; icon: string; headerClass: string }[] = [
    {
      status: 'IN_PROGRESS',
      label: 'En Curso',
      icon: '⚡',
      headerClass: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    },
    {
      status: 'BACKLOG',
      label: 'Por Empezar',
      icon: '⏳',
      headerClass: 'text-slate-400 border-slate-700/60 bg-slate-800/40',
    },
    {
      status: 'PAUSED',
      label: 'En Pausa',
      icon: '⏸️',
      headerClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    },
    {
      status: 'COMPLETED',
      label: 'Completados',
      icon: '🏆',
      headerClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
    {
      status: 'DROPPED',
      label: 'Descartados',
      icon: '📦',
      headerClass: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-7xl mx-auto">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800 backdrop-blur-sm shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">
              Aprendizaje & Conocimiento
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Gestiona cursos, libros, lecturas y documentación técnica. Retoma donde te quedaste y agenda sesiones de estudio directamente en tu calendario.
          </p>
        </div>

        {/* Right side stats + New Item button */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Metrics Pill */}
          <div className="flex items-center gap-3 sm:gap-5 text-xs bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Total
              </span>
              <span className="text-base font-extrabold text-slate-100">{totalCount}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-purple-400 block text-[10px] uppercase font-bold tracking-wider">
                En curso
              </span>
              <span className="text-base font-extrabold text-purple-300">{inProgressCount}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-emerald-400 block text-[10px] uppercase font-bold tracking-wider">
                Hechos
              </span>
              <span className="text-base font-extrabold text-emerald-300">{completedCount}</span>
            </div>
            {dormantCount > 0 && (
              <>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-amber-400 block text-[10px] uppercase font-bold tracking-wider">
                    Inactivos
                  </span>
                  <span className="text-base font-extrabold text-amber-300 flex items-center gap-0.5">
                    <span>⚠️</span>
                    <span>{dormantCount}</span>
                  </span>
                </div>
              </>
            )}
            {droppedCount > 0 && (
              <>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-rose-400 block text-[10px] uppercase font-bold tracking-wider">
                    Descartados
                  </span>
                  <span className="text-base font-extrabold text-rose-300">{droppedCount}</span>
                </div>
              </>
            )}
          </div>

          {/* New Learning Resource Button */}
          <button
            onClick={() => openLearningDrawer(null)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-600/25 transition flex items-center gap-2"
          >
            <span>+</span>
            <span>Nuevo Recurso</span>
          </button>
        </div>
      </div>

      {/* 2. Quick-Add Inline Bar (Choice 4.B - Zero Friction Input) */}
      <form
        onSubmit={handleQuickAddSubmit}
        className="bg-slate-900/50 border border-slate-800/90 rounded-2xl p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-sm"
      >
        <div className="relative flex-1 flex items-center">
          <span className="pl-3 pr-2 text-slate-500 text-sm">⚡</span>
          <input
            type="text"
            placeholder="Pegar URL o escribir título para registrar en 1 segundo (ej. https://youtube.com/... o Libro Clean Code)..."
            value={quickAddInput}
            onChange={(e) => setQuickAddInput(e.target.value)}
            disabled={quickAddLoading}
            className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none pr-3"
          />
          {detectedPlatform && (
            <span
              className="mr-2 px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 border shrink-0"
              style={{
                backgroundColor: `${detectedPlatform.color}15`,
                borderColor: `${detectedPlatform.color}40`,
                color: detectedPlatform.color,
              }}
            >
              <span>{detectedPlatform.icon}</span>
              <span>{detectedPlatform.name}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {quickAddFeedback && (
            <span className="text-xs text-purple-300 font-bold px-2 animate-fadeIn">
              {quickAddFeedback}
            </span>
          )}
          <button
            type="submit"
            disabled={!quickAddInput.trim() || quickAddLoading}
            className="px-4 py-2 bg-purple-600/90 hover:bg-purple-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <span>{quickAddLoading ? 'Guardando...' : '+ Guardar Rápido'}</span>
          </button>
        </div>
      </form>

      {/* 3. Dormancy Triage Banner (Choice 3.A - Proactive Decongestion) */}
      {dormantItems.length >= 2 && !triageDismissed && (
        <div className="bg-gradient-to-r from-amber-500/15 via-slate-900/80 to-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧹</span>
            <div>
              <h4 className="text-xs font-black text-amber-200 tracking-wide uppercase">
                Triage Anti-Saturación: Despeja tu enfoque
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Tienes <strong className="text-amber-300 font-bold">{dormantItems.length} recursos</strong> en curso sin actividad hace más de 7 días. Paúsalos o descártalos con un solo clic para liberar tu mente sin culpa.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto text-xs">
            <button
              onClick={handleTriagePauseAll}
              disabled={triageLoading}
              className="px-3 py-1.5 rounded-xl font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition active:scale-95"
            >
              ⏸️ Pausar inactivos ({dormantItems.length})
            </button>
            <button
              onClick={handleTriageDropAll}
              disabled={triageLoading}
              className="px-3 py-1.5 rounded-xl font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition active:scale-95"
            >
              📦 Descartar inactivos
            </button>
            <button
              onClick={() => setTriageDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition"
              title="Ocultar sugerencia"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 4. Weekly Focus Section ("⭐ Mi Enfoque Semanal" - Anti-Overload) */}
      {focusItems.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-purple-500/10 border border-amber-500/30 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <h3 className="text-sm font-black text-amber-200 uppercase tracking-wider">
                Mi Enfoque Semanal ({focusItems.length}/3)
              </h3>
            </div>
            {focusItems.length > 3 && (
              <span className="text-[11px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 font-semibold">
                ⚠️ Superaste el límite recomendado de 3
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {focusItems.map((item) => (
              <LearningCard
                key={item.id}
                item={item}
                onOpenDrawer={(i) => openLearningDrawer(i)}
                onOpenSchedule={handleOpenSchedule}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Search & Filter Bar + View Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/80">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por título, plataforma o notas..."
            value={learningFilter.searchQuery}
            onChange={(e) =>
              setLearningFilter((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        {/* Resource Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {typePills.map((pill) => (
            <button
              key={pill.type}
              onClick={() =>
                setLearningFilter((prev) => ({ ...prev, resourceType: pill.type }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                learningFilter.resourceType === pill.type
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{pill.icon}</span>
              <span>{pill.label}</span>
            </button>
          ))}
        </div>

        {/* View Mode Switcher: Kanban | Tabla (Alta Densidad) | Lista | Matriz de Progreso */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-end md:self-auto overflow-x-auto">
          <button
            onClick={() => setLearningViewMode('KANBAN')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              learningViewMode === 'KANBAN'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vista de columnas por estado"
          >
            Kanban
          </button>
          <button
            onClick={() => setLearningViewMode('TABLE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
              learningViewMode === 'TABLE'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vista compacta de tabla (Alta densidad para muchos recursos)"
          >
            <span>📋</span>
            <span>Tabla</span>
          </button>
          <button
            onClick={() => setLearningViewMode('LIST')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              learningViewMode === 'LIST'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vista de cuadrícula de tarjetas"
          >
            Tarjetas
          </button>
          <button
            onClick={() => setLearningViewMode('MATRIX')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              learningViewMode === 'MATRIX'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-purple-300 hover:text-purple-200 hover:bg-purple-500/10'
            }`}
            title="Matriz semanal de hábitos y constancia"
          >
            <span>📊</span>
            <span>Matriz</span>
          </button>
        </div>
      </div>

      {/* 6. Loading & Error States */}
      {learningLoading && learningItems.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-44 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {learningError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300">
          <span>{learningError}</span>
          <button
            onClick={() => fetchLearningList()}
            className="underline font-bold hover:text-rose-200"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 7. Matriz de Progreso (Fase 2) */}
      {learningViewMode === 'MATRIX' && <ActivityProgressMatrix />}

      {/* 8. Vista de Tabla / Alta Densidad (Pilar 3) */}
      {learningViewMode === 'TABLE' && !learningLoading && (
        <LearningTableView
          items={filteredItems}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onOpenDrawer={(i) => openLearningDrawer(i)}
          onOpenSchedule={handleOpenSchedule}
        />
      )}

      {/* Empty State para Kanban, Lista y Tabla */}
      {learningViewMode !== 'MATRIX' && !learningLoading && filteredItems.length === 0 && (
        <div className="text-center py-16 px-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
          <span className="text-4xl mb-3 block">📚</span>
          <h3 className="text-base font-bold text-slate-200 mb-1">
            {learningItems.length === 0
              ? 'No tienes actividades de aprendizaje registradas'
              : 'No se encontraron recursos con los filtros actuales'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {learningItems.length === 0
              ? 'Usa la barra rápida de arriba o el botón Nuevo Recurso para comenzar tu biblioteca sin saturarte.'
              : 'Prueba cambiando el tipo de recurso o limpiando los términos de búsqueda.'}
          </p>
          {learningItems.length === 0 && (
            <button
              onClick={() => openLearningDrawer(null)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition"
            >
              + Agregar Primer Recurso
            </button>
          )}
        </div>
      )}

      {/* 9. Kanban View (Grouped by status) */}
      {learningViewMode === 'KANBAN' && !learningLoading && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {columnsConfig.map((col) => {
            const items = itemsByStatus[col.status] || [];
            return (
              <div
                key={col.status}
                className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-3 flex flex-col gap-3 min-h-[220px]"
              >
                {/* Column Header */}
                <div
                  className={`px-3 py-2 rounded-2xl border flex items-center justify-between text-xs font-extrabold ${col.headerClass}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.icon}</span>
                    <span>{col.label}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-950/60 text-[11px] font-mono">
                    {items.length}
                  </span>
                </div>

                {/* Column Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <LearningCard
                      key={item.id}
                      item={item}
                      onOpenDrawer={(i) => openLearningDrawer(i)}
                      onOpenSchedule={handleOpenSchedule}
                    />
                  ))}
                  {items.length === 0 && (
                    <p className="text-[11px] text-slate-600 text-center py-6 italic">
                      Vacío
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 10. List/Grid View */}
      {learningViewMode === 'LIST' && !learningLoading && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <LearningCard
              key={item.id}
              item={item}
              onOpenDrawer={(i) => openLearningDrawer(i)}
              onOpenSchedule={handleOpenSchedule}
            />
          ))}
        </div>
      )}

      {/* 11. Floating Bulk Actions Bar (Pilar 2) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-purple-500/50 shadow-2xl shadow-purple-900/40 rounded-2xl px-5 py-3 flex items-center gap-3 flex-wrap max-w-3xl backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">
              {selectedIds.length} seleccionados
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              onClick={() => handleBulkStatus('IN_PROGRESS')}
              disabled={bulkActionLoading}
              className="px-2.5 py-1.5 rounded-xl font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 transition active:scale-95"
            >
              ⚡ En Curso
            </button>
            <button
              onClick={() => handleBulkStatus('PAUSED')}
              disabled={bulkActionLoading}
              className="px-2.5 py-1.5 rounded-xl font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition active:scale-95"
            >
              ⏸️ Pausar
            </button>
            <button
              onClick={() => handleBulkStatus('COMPLETED')}
              disabled={bulkActionLoading}
              className="px-2.5 py-1.5 rounded-xl font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 transition active:scale-95"
            >
              🏆 Completar
            </button>
            <button
              onClick={() => handleBulkStatus('DROPPED')}
              disabled={bulkActionLoading}
              className="px-2.5 py-1.5 rounded-xl font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition active:scale-95"
            >
              📦 Descartar
            </button>

            {/* Link to Goal Dropdown */}
            {goals.length > 0 && (
              <select
                value={selectedGoalId}
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkLinkGoal(e.target.value);
                  }
                }}
                disabled={bulkActionLoading}
                className="px-2.5 py-1.5 rounded-xl font-bold bg-slate-950 text-slate-300 border border-slate-700 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="">🎯 Vincular a Objetivo...</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    🎯 {g.title}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              className="px-2.5 py-1.5 rounded-xl font-bold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition active:scale-95"
              title="Eliminar seleccionados"
            >
              🗑️
            </button>
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="ml-auto text-slate-400 hover:text-slate-100 text-xs px-2 py-1 rounded-lg hover:bg-slate-800 transition"
            title="Deseleccionar todos"
          >
            ✕
          </button>
        </div>
      )}

      {/* 12. Slide-Over Continuity Drawer */}
      <LearningDrawer
        isOpen={learningDrawerOpen}
        onClose={closeLearningDrawer}
        onOpenSchedule={handleOpenSchedule}
      />

      {/* 13. Study Session Calendar Scheduler Modal */}
      <StudySessionModal
        isOpen={studyModalOpen}
        item={studyModalItem}
        onClose={() => {
          setStudyModalOpen(false);
          setStudyModalItem(null);
        }}
      />
    </div>
  );
};
