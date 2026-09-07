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

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.isCompleted).length;
  const totalSubtasks = subtasks.length;

  const formattedDeadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null;

  const isOverdue = task.deadline && new Date(task.deadline).getTime() < Date.now() && task.status !== 'DONE';

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
      {/* Top row: Priority Badge, Deadline & Action buttons */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}>
            {priorityInfo.label}
          </span>

          {formattedDeadline && (
            <span
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border flex items-center gap-1 ${
                isOverdue
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <span>📅</span>
              <span>{formattedDeadline}</span>
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
          {task.status !== 'TODO' && (
            <button
              onClick={(e) => handleQuickMove(e, task.status === 'DONE' ? 'IN_PROGRESS' : 'TODO')}
              title={`Mover a ${task.status === 'DONE' ? 'En progreso' : 'Por hacer'}`}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 hover:text-slate-200 rounded font-semibold transition"
            >
              ← {task.status === 'DONE' ? 'En progreso' : 'Por hacer'}
            </button>
          )}
        </div>

        <div>
          {task.status !== 'DONE' && (
            <button
              onClick={(e) => handleQuickMove(e, task.status === 'TODO' ? 'IN_PROGRESS' : 'DONE')}
              title={`Mover a ${task.status === 'TODO' ? 'En progreso' : 'Completado'}`}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 hover:text-slate-200 rounded font-semibold transition"
            >
              {task.status === 'TODO' ? 'En progreso' : 'Completado'} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
