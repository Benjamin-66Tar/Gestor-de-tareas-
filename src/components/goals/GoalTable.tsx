import React from 'react';
import { Goal } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface GoalTableProps {
  goals: Goal[];
  onEdit: (goal: Goal) => void;
}

export const GoalTable: React.FC<GoalTableProps> = ({ goals, onEdit }) => {
  const { deleteGoal } = useAuraState();

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Activo',
    COMPLETED: 'Completado',
    PAUSED: 'En pausa',
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    COMPLETED: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    PAUSED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };

  return (
    <div className="w-full overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            <th className="py-3 px-4">Objetivo</th>
            <th className="py-3 px-4">Categoría</th>
            <th className="py-3 px-4">Progreso</th>
            <th className="py-3 px-4">Hitos</th>
            <th className="py-3 px-4">Fecha Límite</th>
            <th className="py-3 px-4">Estado</th>
            <th className="py-3 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-medium">
          {goals.map((goal) => {
            const completedCount = goal.milestones?.filter(m => m.isCompleted).length || 0;
            const totalCount = goal.milestones?.length || 0;
            const formattedDate = goal.deadline
              ? new Date(goal.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—';

            return (
              <tr
                key={goal.id}
                onClick={() => onEdit(goal)}
                className="hover:bg-slate-800/50 transition cursor-pointer group"
              >
                {/* Title */}
                <td className="py-3.5 px-4 font-bold text-slate-200 group-hover:text-white max-w-xs truncate">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: goal.colorHex }}
                    />
                    <span className="truncate">{goal.title}</span>
                  </div>
                </td>

                {/* Category */}
                <td className="py-3.5 px-4">
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                    style={{
                      backgroundColor: `${goal.colorHex}15`,
                      borderColor: `${goal.colorHex}40`,
                      color: goal.colorHex,
                    }}
                  >
                    {goal.category}
                  </span>
                </td>

                {/* Progress Bar & Percentage */}
                <td className="py-3.5 px-4 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${goal.progressPercentage}%`,
                          backgroundColor: goal.colorHex,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-300 w-8 text-right">
                      {goal.progressPercentage}%
                    </span>
                  </div>
                </td>

                {/* Milestones count */}
                <td className="py-3.5 px-4 text-slate-400 text-center">
                  {totalCount > 0 ? (
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-300">
                      {completedCount} / {totalCount}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                {/* Deadline */}
                <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                  {formattedDate}
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[goal.status] || statusColors.ACTIVE}`}>
                    {statusLabels[goal.status] || goal.status}
                  </span>
                </td>

                {/* Action buttons */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(goal);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg mr-1 transition"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`¿Eliminar "${goal.title}"?`)) {
                        deleteGoal(goal.id);
                      }
                    }}
                    className="p-1.5 text-rose-400 hover:text-rose-200 rounded-lg transition"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
