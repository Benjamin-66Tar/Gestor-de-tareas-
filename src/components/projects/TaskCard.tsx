import React, { useState } from 'react';
import { ProjectTask, TaskStatus, TaskPriority } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface TaskCardProps {
  task: ProjectTask;
  projectColor?: string;
  onEdit: (task: ProjectTask) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, projectColor = '#6366F1', onEdit }) => {
  const { moveTaskStatus, deleteTask, toggleSubtask } = useAuraState();
  const [isDeleting, setIsDeleting] = useState(false);
  const [subtasksExpanded, setSubtasksExpanded] = useState(false);

  const priorityStyles: Record<TaskPriority, { bg: string; text: string; border: string; label: string }> = {
    HIGH: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', label: 'Alta' },
    MEDIUM: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Media' },
    LOW: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Baja' },
  };

  const priorityInfo = priorityStyles[task.priority] || priorityStyles.MEDIUM;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar la tarea "${task.title}"?`)) {
      setIsDeleting(true);
      await deleteTask(task.id);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Quick move handlers for accessible column switching
  const handleQuickMove = async (e: React.MouseEvent, targetStatus: TaskStatus) => {
    e.stopPropagation();
    await moveTaskStatus(task.id, targetStatus);
  };

  const STATUS_ORDER: TaskStatus[] = ['BACKLOG', 'ANALYSIS', 'IN_PROGRESS', 'TESTING', 'DONE'];
  const STATUS_NAMES: Record<string, string> = {
    BACKLOG: 'Backlog',
    ANALYSIS: 'Análisis',
    IN_PROGRESS: 'Desarrollo',
    TESTING: 'Pruebas',
    DONE: 'Completo',
    TODO: 'Backlog',
  };

  const currentStatus = (task.status === 'TODO' ? 'BACKLOG' : task.status) as TaskStatus;
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const prevStatus = currentIndex > 0 ? STATUS_ORDER[currentIndex - 1] : null;
  const nextStatus = currentIndex >= 0 && currentIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIndex + 1] : null;

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.isCompleted).length;
  const totalSubtasks = subtasks.length;

  const formattedStart = task.startDate
    ? new Date(task.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null;
  const formattedDeadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null;

  const calculatedDays = task.startDate && task.deadline
    ? Math.max(1, Math.round((new Date(task.deadline).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : (task.estimatedDays || null);

  const isOverdue = Boolean(task.deadline && new Date(task.deadline).getTime() < Date.now() && task.status !== 'DONE');
  const daysOverdue = isOverdue && task.deadline
    ? Math.max(1, Math.ceil((Date.now() - new Date(task.deadline).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onEdit(task)}
      style={{ borderLeftColor: projectColor, borderLeftWidth: '3px' }}
      className={`group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing relative select-none ${
        isDeleting ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      {/* Top row: Priority Badge, Dates & Action buttons */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}>
            {priorityInfo.label}
          </span>

          {/* Date range or deadline badge */}
          {(formattedStart || formattedDeadline) && (
            <span
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border flex items-center gap-1 ${
                isOverdue
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <span>📅</span>
              <span>
                {formattedStart && formattedDeadline
                  ? `${formattedStart} - ${formattedDeadline}${calculatedDays ? ` (${calculatedDays}d)` : ''}`
                  : (formattedDeadline || formattedStart)}
              </span>
            </span>
          )}

          {/* Deviation alert badge */}
          {isOverdue && (
            <span
              title={`Esta tarea supera el tiempo estimado por ${daysOverdue} días`}
              className="px-2 py-0.5 text-[10px] font-semibold rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1"
            >
              <span>⚠️</span>
              <span>+{daysOverdue}d desvío</span>
            </span>
          )}

          {/* Deviation cause chip */}
          {task.deviationReason && (
            <span
              title={`Motivo del desvío: ${task.deviationReason}`}
              className="px-2 py-0.5 text-[10px] font-medium rounded-full border bg-slate-800 text-indigo-300 border-indigo-500/30 flex items-center gap-1 truncate max-w-[120px]"
            >
              <span>📝</span>
              <span className="truncate">{task.deviationReason}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            title="Editar detalles"
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded text-xs transition"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            title="Eliminar tarea"
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded text-xs transition"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className={`text-sm font-semibold text-slate-100 mb-1 leading-snug ${task.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>
        {task.title}
      </h4>

      {/* Description Preview */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Subtasks Progress / Checklist Indicator */}
      {totalSubtasks > 0 && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSubtasksExpanded(!subtasksExpanded);
            }}
            className="flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer mb-1.5"
          >
            <span className="flex items-center gap-1.5">
              <span>☑️</span>
              <span>Subtareas ({completedSubtasks}/{totalSubtasks})</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {subtasksExpanded ? '▲ ocultar' : '▼ ver'}
            </span>
          </div>

          {/* Micro Progress Bar for Subtasks */}
          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>

          {/* Collapsible Subtasks Checklist */}
          {subtasksExpanded && (
            <div className="mt-2 space-y-1.5 pl-1">
              {subtasks.map((sub) => (
                <label
                  key={sub.id}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-xs text-slate-300 hover:text-slate-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={sub.isCompleted}
                    onChange={() => toggleSubtask(sub.id)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className={`text-[11px] truncate ${sub.isCompleted ? 'line-through text-slate-500' : ''}`}>
                    {sub.title}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Column Switcher Quick Arrows (for touch / mouse accessibility) */}
      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
        <div>
          {prevStatus && (
            <button
              onClick={(e) => handleQuickMove(e, prevStatus)}
              title={`Mover a ${STATUS_NAMES[prevStatus]}`}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 hover:text-slate-200 rounded font-semibold transition"
            >
              ← {STATUS_NAMES[prevStatus]}
            </button>
          )}
        </div>

        <div>
          {nextStatus && (
            <button
              onClick={(e) => handleQuickMove(e, nextStatus)}
              title={`Mover a ${STATUS_NAMES[nextStatus]}`}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 hover:text-slate-200 rounded font-semibold transition"
            >
              {STATUS_NAMES[nextStatus]} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
