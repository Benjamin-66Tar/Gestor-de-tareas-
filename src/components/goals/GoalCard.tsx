import React, { useState, useMemo } from 'react';
import { Goal } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
}

/**
 * Componente GoalCard (Fases 3 y 4 - US12 y US13):
 * 
 * Tarjeta de Objetivo Estratégico con soporte para:
 * - Clasificación de horizontes temporales (Corto Plazo vs Largo Plazo con resplandor dorado / ámbar).
 * - Desglose de progreso ponderado / equitativo (Proyectos, Aprendizaje, Hitos).
 * - Acordeones desplegables con enlaces directos a proyectos y cursos de aprendizaje.
 * - Banner de celebración al alcanzar el 100% con confirmación explícita para concluir.
 */
export const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit }) => {
  const {
    toggleMilestone,
    deleteGoal,
    learningItems,
    openLearningDrawer,
    projects,
    setActiveProject,
    setTabActiva,
    concludeGoal,
  } = useAuraState();

  const [milestonesExpanded, setMilestonesExpanded] = useState<boolean>(false);
  const [projectsExpanded, setProjectsExpanded] = useState<boolean>(false);
  const [learningExpanded, setLearningExpanded] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isConcluding, setIsConcluding] = useState<boolean>(false);

  const isLongTerm = goal.timeHorizon === 'LONG_TERM';

  // Proyectos vinculados (directos del serializer o inferidos del estado)
  const allLinkedProjects = useMemo(() => {
    if (goal.linkedProjects && goal.linkedProjects.length > 0) {
      return goal.linkedProjects;
    }
    return (projects || [])
      .filter((p) => p.goalId === goal.id || (p as any).goal === goal.id)
      .map((p) => ({
        id: p.id,
        title: p.title,
        colorHex: p.colorHex,
        progressPercentage: p.progressPercentage || 0,
        status: p.status,
      }));
  }, [goal.linkedProjects, projects, goal.id]);

  // Recursos de aprendizaje vinculados (directos del serializer o inferidos)
  const allLinkedLearning = useMemo(() => {
    if (goal.linkedCourses && goal.linkedCourses.length > 0) {
      return goal.linkedCourses;
    }
    return (learningItems || [])
      .filter((l) => (l.goalId === goal.id || (l as any).goal === goal.id) && !(l as any).isDeleted)
      .map((l) => ({
        id: l.id,
        title: l.title,
        resourceType: l.resourceType,
        colorHex: l.colorHex,
        progressPercentage: l.progressPercentage || 0,
        status: l.status,
      }));
  }, [goal.linkedCourses, learningItems, goal.id]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar el objetivo "${goal.title}"?`)) {
      setIsDeleting(true);
      await deleteGoal(goal.id);
    }
  };

  const handleConclude = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConcluding(true);
    await concludeGoal(goal.id);
    setIsConcluding(false);
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    COMPLETED: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    PAUSED: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Activo',
    COMPLETED: 'Completado',
    PAUSED: 'En pausa',
  };

  const formattedDeadline = goal.deadline
    ? new Date(goal.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null;

  const colorHex = isLongTerm ? '#F59E0B' : (goal.colorHex || (goal as any).color_hex || '#10B981');
  const progressPercentage = typeof goal.progressPercentage === 'number'
    ? goal.progressPercentage
    : (typeof (goal as any).progress_percentage === 'number' ? (goal as any).progress_percentage : 0);
  const progressMode = goal.progressMode || (goal as any).progress_mode || 'MILESTONES';
  const isReached100 = goal.isAchieved100 || progressPercentage >= 100;

  return (
    <div
      className={`relative rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between group ${
        isLongTerm
          ? 'bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-900 border-2 border-amber-400/40 shadow-xl shadow-amber-950/20 ring-1 ring-amber-400/20 hover:border-amber-400/60'
          : 'bg-slate-900 border border-slate-800 hover:border-slate-700/80 shadow-lg'
      } ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <div>
        {/* Card Header: Category Tag, Horizon Badge, Status & Actions */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Categoría */}
            <span
              className="px-2.5 py-0.5 text-xs font-bold rounded-full border shadow-sm"
              style={{
                backgroundColor: `${colorHex}20`,
                borderColor: `${colorHex}50`,
                color: colorHex,
              }}
            >
              {goal.category}
            </span>

            {/* Distintivo de Horizonte Temporal (Fase 3 - US12) */}
            {isLongTerm ? (
              <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full border bg-amber-500/20 text-amber-300 border-amber-400/50 flex items-center gap-1 shadow-sm">
                <span>🏔️</span>
                <span>Largo Plazo</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full border bg-sky-500/20 text-sky-300 border-sky-500/30 flex items-center gap-1">
                <span>⚡</span>
                <span>Corto Plazo</span>
              </span>
            )}

            {/* Objetivo padre si existe */}
            {goal.parentGoalTitle && (
              <span
                className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700 truncate max-w-[150px]"
                title={`Objetivo padre: ${goal.parentGoalTitle}`}
              >
                ↳ {goal.parentGoalTitle}
              </span>
            )}

            {/* Estado */}
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[goal.status] || statusColors.ACTIVE}`}>
              {statusLabels[goal.status] || goal.status}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(goal)}
              title="Editar meta"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg text-xs transition"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              title="Eliminar meta"
              className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-lg text-xs transition"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Title and Description */}
        <h3 className="font-extrabold text-base sm:text-lg text-slate-100 tracking-tight leading-snug mb-1">
          {goal.title}
        </h3>
        {goal.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
            {goal.description}
          </p>
        )}

        {/* Banner de Celebración al 100% (Fase 4 - US13) */}
        {isReached100 && goal.status !== 'COMPLETED' && (
          <div className="my-3 p-3 bg-gradient-to-r from-emerald-950/60 via-amber-950/30 to-emerald-950/60 border border-emerald-400/50 rounded-xl flex items-center justify-between gap-2 shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="text-xs font-black text-emerald-300">
                  ¡Meta alcanzada al 100%!
                </p>
                <p className="text-[10px] text-slate-300">
                  Todos los componentes vinculados se han completado con éxito.
                </p>
              </div>
            </div>
            <button
              onClick={handleConclude}
              disabled={isConcluding}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-lg shadow-md active:scale-95 transition whitespace-nowrap"
              title="Concluir y archivar objetivo definitivamente"
            >
              {isConcluding ? 'Concluyendo...' : 'Concluir meta'}
            </button>
          </div>
        )}

        {/* Progress Bar & Mode */}
        <div className="mt-3 mb-2">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-slate-400 flex items-center gap-1">
              <span>
                {progressMode === 'CONNECTED'
                  ? 'Progreso Ponderado Integrado'
                  : progressMode === 'MILESTONES'
                  ? 'Progreso por Hitos'
                  : 'Progreso Manual'}
              </span>
            </span>
            <span
              className="font-black text-sm"
              style={{ color: colorHex }}
            >
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full rounded-full transition-all duration-300 shadow-sm"
              style={{
                width: `${Math.min(100, Math.max(0, progressPercentage))}%`,
                backgroundColor: colorHex,
              }}
            />
          </div>
        </div>

        {/* Multi-factor Breakdown Chips (Fase 4 - US13) */}
        {goal.breakdown && (
          <div className="flex items-center gap-1.5 flex-wrap my-2 text-[10px] font-bold">
            {goal.breakdown.projects != null && (
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
                🚀 Proyectos: {goal.breakdown.projects}%
              </span>
            )}
            {goal.breakdown.learning != null && (
              <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                📚 Aprendizaje: {goal.breakdown.learning}%
              </span>
            )}
            {goal.breakdown.milestones != null && (
              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                📌 Hitos: {goal.breakdown.milestones}%
              </span>
            )}
          </div>
        )}

        {/* Acordeón de Hitos */}
        {goal.milestones && goal.milestones.length > 0 && (
          <div className="mt-2 border-t border-slate-800/80 pt-2.5">
            <div
              onClick={() => setMilestonesExpanded(!milestonesExpanded)}
              className="flex justify-between items-center text-xs text-slate-400 hover:text-slate-200 cursor-pointer select-none py-1"
            >
              <span className="font-semibold flex items-center gap-1 text-indigo-300">
                <span>📌</span>
                <span>Hitos ({goal.milestones.filter(m => Boolean(m.isCompleted ?? (m as any).is_completed)).length}/{goal.milestones.length})</span>
              </span>
              <span className="text-[10px] text-indigo-400 font-bold">
                {milestonesExpanded ? 'Ocultar ▲' : 'Ver hitos ▼'}
              </span>
            </div>

            {milestonesExpanded && (
              <div className="mt-2 space-y-1.5 animate-fadeIn">
                {goal.milestones.map((m) => {
                  const isDone = Boolean(m.isCompleted ?? (m as any).is_completed);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 text-xs text-slate-300 p-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer transition select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleMilestone(goal.id, m.id)}
                        className="w-4 h-4 rounded text-indigo-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
                      />
                      <span className={`flex-1 ${isDone ? 'line-through text-slate-500' : ''}`}>
                        {m.title}
                      </span>
                      {m.weight !== undefined && m.weight > 1 && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          Peso: {m.weight}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Acordeón de Proyectos Vinculados (Fase 4 - US13) */}
        {allLinkedProjects.length > 0 && (
          <div className="mt-2 border-t border-slate-800/80 pt-2.5">
            <div
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="flex justify-between items-center text-xs text-slate-400 hover:text-slate-200 cursor-pointer select-none py-1"
            >
              <span className="font-semibold flex items-center gap-1.5 text-blue-300">
                <span>🚀</span>
                <span>Proyectos ({allLinkedProjects.filter(p => p.progressPercentage === 100).length}/{allLinkedProjects.length})</span>
              </span>
              <span className="text-[10px] text-blue-400 font-bold">
                {projectsExpanded ? 'Ocultar ▲' : 'Ver proyectos ▼'}
              </span>
            </div>

            {projectsExpanded && (
              <div className="mt-2 space-y-1.5 animate-fadeIn">
                {allLinkedProjects.map((p) => {
                  const isDone = p.progressPercentage === 100;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        const targetProj = projects.find(proj => proj.id === p.id);
                        if (targetProj) {
                          setActiveProject(targetProj);
                          setTabActiva('PROYECTOS');
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/40 transition cursor-pointer flex flex-col gap-1.5 group/item"
                      title="Haz clic para abrir el espacio de trabajo del proyecto"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className={`font-semibold truncate group-hover/item:text-blue-300 transition-colors ${isDone ? 'text-emerald-300' : 'text-slate-200'}`}>
                          {p.title}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {p.progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isDone ? 'bg-emerald-400' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, p.progressPercentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Acordeón de Recursos de Aprendizaje Vinculados (Fase 4 - US13) */}
        {allLinkedLearning.length > 0 && (
          <div className="mt-2 border-t border-slate-800/80 pt-2.5">
            <div
              onClick={() => setLearningExpanded(!learningExpanded)}
              className="flex justify-between items-center text-xs text-slate-400 hover:text-slate-200 cursor-pointer select-none py-1"
            >
              <span className="font-semibold flex items-center gap-1.5 text-purple-300">
                <span>📚</span>
                <span>Aprendizaje ({allLinkedLearning.filter(l => l.status === 'COMPLETED' || l.progressPercentage === 100).length}/{allLinkedLearning.length})</span>
              </span>
              <span className="text-[10px] text-purple-400 font-bold">
                {learningExpanded ? 'Ocultar ▲' : 'Ver cursos ▼'}
              </span>
            </div>

            {learningExpanded && (
              <div className="mt-2 space-y-1.5 animate-fadeIn">
                {allLinkedLearning.map((item) => {
                  const typeIcons: Record<string, string> = {
                    COURSE: '🎓',
                    BOOK: '📖',
                    ARTICLE: '📰',
                    TECH_DOC: '⚙️',
                  };
                  const isCompleted = item.status === 'COMPLETED' || item.progressPercentage === 100;
                  const rawItem = (learningItems || []).find(l => l.id === item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (rawItem) {
                          openLearningDrawer(rawItem);
                        } else {
                          setTabActiva('APRENDIZAJE');
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-purple-500/40 transition cursor-pointer flex flex-col gap-1.5 group/item"
                      title="Haz clic para ver o continuar este recurso"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs">{typeIcons[item.resourceType] || '📚'}</span>
                          <span className={`font-semibold truncate group-hover/item:text-purple-300 transition-colors ${isCompleted ? 'text-emerald-300' : 'text-slate-200'}`}>
                            {item.title}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          {isCompleted ? '✓ 100%' : `${item.progressPercentage}%`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, item.progressPercentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info: Deadline & Manage button */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-400 font-medium">
        {formattedDeadline ? (
          <span className="flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/40">
            <span>⏰</span> Límite: {formattedDeadline}
          </span>
        ) : (
          <span className="text-slate-500 italic">Sin fecha límite</span>
        )}

        <button
          onClick={() => onEdit(goal)}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          Gestionar →
        </button>
      </div>
    </div>
  );
};
