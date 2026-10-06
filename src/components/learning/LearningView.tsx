import React, { useMemo } from 'react';
import { useAuraState } from '../../context/AuraState';
import { LearningItem, ResourceType, LearningStatus } from '../../domain/types';
import { LearningCard } from './LearningCard';
import { LearningDrawer } from './LearningDrawer';
import { StudySessionModal } from './StudySessionModal';
import { ActivityProgressMatrix } from './ActivityProgressMatrix';

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
  } = useAuraState();

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

  // Status groupings
  const itemsByStatus = useMemo(() => {
    const groups: Record<LearningStatus, LearningItem[]> = {
      IN_PROGRESS: [],
      BACKLOG: [],
      PAUSED: [],
      COMPLETED: [],
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
  const dormantCount = learningItems.filter((i) => i.isDormant).length;

  const handleOpenSchedule = (item: LearningItem) => {
    setStudyModalItem(item);
    setStudyModalOpen(true);
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
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-7xl mx-auto">
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

      {/* 2. Search & Filter Bar */}
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

        {/* View Mode Switcher: Kanban | Lista | Matriz de Progreso (T161) */}
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
            onClick={() => setLearningViewMode('LIST')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              learningViewMode === 'LIST'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Vista de lista / cuadrícula"
          >
            Lista
          </button>
          <button
            onClick={() => setLearningViewMode('MATRIX')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              learningViewMode === 'MATRIX'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-purple-300 hover:text-purple-200 hover:bg-purple-500/10'
            }`}
            title="Matriz semanal de hábitos y progreso con avance en 1-clic"
          >
            <span>📊</span>
            <span>Matriz de Progreso</span>
          </button>
        </div>
      </div>

      {/* 3. Loading & Error States */}
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

      {/* 4. Vista de Matriz de Progreso (Fase 2 - US11) */}
      {learningViewMode === 'MATRIX' && (
        <ActivityProgressMatrix />
      )}

      {/* Empty State para vistas Kanban y Lista */}
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
              ? 'Añade tu primer curso de Udemy, libro técnico o documentación para llevar el control sin olvidos.'
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

      {/* 5. Kanban View (Grouped by status) */}
      {learningViewMode === 'KANBAN' && !learningLoading && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
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

      {/* 6. List/Grid View */}
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

      {/* 6. Slide-Over Continuity Drawer */}
      <LearningDrawer
        isOpen={learningDrawerOpen}
        onClose={closeLearningDrawer}
        onOpenSchedule={handleOpenSchedule}
      />

      {/* 7. Study Session Calendar Scheduler Modal */}
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
