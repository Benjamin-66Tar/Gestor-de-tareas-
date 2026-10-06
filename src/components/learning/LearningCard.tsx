import React from 'react';
import { LearningItem, ResourceType } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface LearningCardProps {
  item: LearningItem;
  onOpenDrawer: (item: LearningItem) => void;
  onOpenSchedule: (item: LearningItem) => void;
}

export const LearningCard: React.FC<LearningCardProps> = ({
  item,
  onOpenDrawer,
  onOpenSchedule,
}) => {
  const { deleteLearningItem, quickIncrementLearning, goals, setTabActiva } = useAuraState();

  const linkedGoal = goals.find((g) => g.id === item.goalId);
  const goalTitle = linkedGoal?.title || item.goalTitle || (item as any).goal_title;

  const resourceTypeConfig: Record<ResourceType, { label: string; icon: string; badgeClass: string }> = {
    COURSE: {
      label: 'Curso',
      icon: '🎓',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    },
    BOOK: {
      label: 'Libro',
      icon: '📖',
      badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    },
    ARTICLE: {
      label: 'Artículo',
      icon: '📰',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
    TECH_DOC: {
      label: 'Doc Técnica',
      icon: '⚙️',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
  };

  const statusConfig = {
    BACKLOG: { label: 'Por empezar', badgeClass: 'bg-slate-700/60 text-slate-300 border-slate-600/50' },
    IN_PROGRESS: { label: 'En curso', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    PAUSED: { label: 'En pausa', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    COMPLETED: { label: 'Completado', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  };

  const currentType = resourceTypeConfig[item.resourceType] || resourceTypeConfig.COURSE;
  const currentStatus = statusConfig[item.status] || statusConfig.BACKLOG;
  const colorHex = item.colorHex || '#8B5CF6';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar "${item.title}"?`)) {
      await deleteLearningItem(item.id);
    }
  };

  const handleQuickIncrement = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await quickIncrementLearning(item.id, 1);
  };

  return (
    <div
      onClick={() => onOpenDrawer(item)}
      className="group relative bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 shadow-lg hover:shadow-purple-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: colorHex,
      }}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Resource Type Badge */}
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border shadow-sm flex items-center gap-1.5 ${currentType.badgeClass}`}>
              <span>{currentType.icon}</span>
              <span>{currentType.label}</span>
            </span>

            {/* Status Badge */}
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${currentStatus.badgeClass}`}>
              {currentStatus.label}
            </span>

            {/* Dormancy Warning Badge */}
            {item.isDormant && (
              <span
                className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse"
                title={`Sin avance en los últimos ${item.dormancyDays} días`}
              >
                <span>⚠️</span>
                <span>+{item.dormancyDays}d sin avance</span>
              </span>
            )}
          </div>

          {/* Quick Actions (top right) */}
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSchedule(item);
              }}
              title="Programar sesión en el calendario"
              className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg text-xs transition"
            >
              📅
            </button>
            <button
              onClick={handleDelete}
              title="Eliminar recurso"
              className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-lg text-xs transition"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-base sm:text-lg text-slate-100 group-hover:text-purple-300 transition-colors leading-snug mb-1">
          {item.title}
        </h3>

        {/* Platform Name and Launcher */}
        <div className="flex items-center gap-2 mb-3 text-xs">
          {item.platformName && (
            <span className="text-slate-400 font-medium">{item.platformName}</span>
          )}
          {item.platformUrl && (
            <a
              href={item.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 hover:underline font-bold text-xs"
              title="Abrir plataforma externa"
            >
              <span>Abrir curso</span>
              <span className="text-[10px]">↗</span>
            </a>
          )}
        </div>

        {/* Linked Goal Badge */}
        {goalTitle && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTabActiva('OBJETIVOS');
              }}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg border shadow-sm flex items-center gap-1.5 transition hover:brightness-125 group/goal cursor-pointer"
              style={{
                backgroundColor: linkedGoal ? `${linkedGoal.colorHex || '#10B981'}18` : '#10B98118',
                borderColor: linkedGoal ? `${linkedGoal.colorHex || '#10B981'}40` : '#10B98140',
                color: linkedGoal ? (linkedGoal.colorHex || '#10B981') : '#10B981',
              }}
              title={`Aporta al objetivo: "${goalTitle}". Haz clic para ir a Objetivos.`}
            >
              <span>🎯</span>
              <span className="text-slate-400 group-hover/goal:text-slate-200">Objetivo:</span>
              <span className="truncate max-w-[220px]">{goalTitle}</span>
              <span className="text-[10px] opacity-60 group-hover/goal:opacity-100">&rarr;</span>
            </button>
          </div>
        )}

        {/* Description (if present) */}
        {item.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Last Point Reached Bookmark */}
        {item.lastPointReached && (
          <div className="mb-4 bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
            <span className="text-purple-400">📍</span>
            <span className="text-slate-400">Último punto:</span>
            <span className="text-slate-200 font-medium truncate">{item.lastPointReached}</span>
          </div>
        )}

        {/* Progress Bar & Stats */}
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span>Progreso</span>
            <span className="text-purple-400 font-bold">{item.progressPercentage}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${item.progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium pt-0.5">
            {item.progressMode === 'TOPICS' ? (
              <span>
                {item.topics?.filter(t => t.isCompleted).length ?? 0} de {item.topics?.length ?? 0} temas completados
              </span>
            ) : (
              <span>
                {item.currentUnit} de {item.totalUnits} {item.resourceType === 'BOOK' ? 'páginas' : 'unidades'}
              </span>
            )}
            {item.status === 'COMPLETED' && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                ✓ ¡Finalizado!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Quick Action Buttons */}
      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          {item.progressMode === 'MANUAL' && item.status !== 'COMPLETED' && (
            <button
              onClick={handleQuickIncrement}
              className="px-2.5 py-1 rounded-lg font-bold bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition active:scale-95 text-xs flex items-center gap-1"
              title="Registrar +1 unidad/página"
            >
              <span>+1</span>
              <span>{item.resourceType === 'BOOK' ? 'pág' : 'ud'}</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSchedule(item);
            }}
            className="px-2.5 py-1 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition active:scale-95 text-xs flex items-center gap-1"
          >
            <span>📅</span>
            <span>Estudiar</span>
          </button>
        </div>

        <button
          onClick={() => onOpenDrawer(item)}
          className="text-xs font-bold text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
        >
          <span>Continuar</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
};
