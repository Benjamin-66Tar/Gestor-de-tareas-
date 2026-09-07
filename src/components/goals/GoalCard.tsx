import React, { useState } from 'react';
import { Goal } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit }) => {
  const { toggleMilestone, deleteGoal } = useAuraState();
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar el objetivo "${goal.title}"?`)) {
      setIsDeleting(true);
      await deleteGoal(goal.id);
    }
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

  return (
    <div
      className={`bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between group ${
        isDeleting ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      <div>
        {/* Card Header: Category Tag & Status & Actions */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-0.5 text-xs font-bold rounded-full border shadow-sm"
              style={{
                backgroundColor: `${goal.colorHex}20`,
                borderColor: `${goal.colorHex}50`,
                color: goal.colorHex,
              }}
            >
              {goal.category}
            </span>
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

        {/* Progress Bar */}
        <div className="mt-4 mb-4">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-slate-400 flex items-center gap-1">
              <span>{goal.progressMode === 'MILESTONES' ? 'Progreso por Hitos' : 'Progreso Manual'}</span>
            </span>
            <span
              className="font-black text-sm"
              style={{ color: goal.colorHex }}
            >
              {goal.progressPercentage}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full rounded-full transition-all duration-300 shadow-sm"
              style={{
                width: `${goal.progressPercentage}%`,
                backgroundColor: goal.colorHex,
              }}
            />
          </div>
        </div>

        {/* Milestones Preview or Expansion */}
        {goal.milestones && goal.milestones.length > 0 && (
          <div className="mt-2 border-t border-slate-800/80 pt-3">
            <div
              onClick={() => setExpanded(!expanded)}
              className="flex justify-between items-center text-xs text-slate-400 hover:text-slate-200 cursor-pointer select-none py-1"
            >
              <span className="font-semibold">
                📌 Hitos ({goal.milestones.filter(m => m.isCompleted).length}/{goal.milestones.length})
              </span>
              <span className="text-[10px] text-indigo-400 font-bold">
                {expanded ? 'Ocultar ▲' : 'Ver hitos ▼'}
              </span>
            </div>

            {expanded && (
              <div className="mt-2 space-y-1.5 animate-fadeIn">
                {goal.milestones.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-2 text-xs text-slate-300 p-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer transition select-none"
                  >
                    <input
                      type="checkbox"
                      checked={m.isCompleted}
                      onChange={() => toggleMilestone(goal.id, m.id)}
                      className="w-4 h-4 rounded text-indigo-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
                    />
                    <span className={`flex-1 ${m.isCompleted ? 'line-through text-slate-500' : ''}`}>
                      {m.title}
                    </span>
                    {m.weight !== undefined && m.weight > 1 && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        Peso: {m.weight}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info: Deadline & Creation */}
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
