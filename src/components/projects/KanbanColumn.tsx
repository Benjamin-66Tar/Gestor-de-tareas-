import React, { useState } from 'react';
import { ProjectTask, TaskStatus } from '../../domain/types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: ProjectTask[];
  projectColor?: string;
  onEditTask: (task: ProjectTask) => void;
  onDropTask: (taskId: string, newStatus: TaskStatus) => void;
  onQuickAddTask: (status: TaskStatus, title: string) => Promise<void>;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tasks,
  projectColor = '#6366F1',
  onEditTask,
  onDropTask,
  onQuickAddTask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Column header configurations
  const columnConfigs: Record<TaskStatus, { icon: string; headerColor: string; pillColor: string }> = {
    TODO: {
      icon: '⭕',
      headerColor: 'text-slate-200',
      pillColor: 'bg-slate-700/60 text-slate-300 border-slate-600/40',
    },
    IN_PROGRESS: {
      icon: '⏳',
      headerColor: 'text-indigo-300',
      pillColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    DONE: {
      icon: '✅',
      headerColor: 'text-emerald-300',
      pillColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
  };

  const config = columnConfigs[status];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId') || e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onQuickAddTask(status, quickTitle.trim());
      setQuickTitle('');
      setIsQuickAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col w-full min-w-[280px] max-w-full lg:max-w-md bg-slate-950/60 rounded-2xl border transition-all duration-200 p-3.5 sm:p-4 ${
        isDragOver
          ? 'border-indigo-500/80 bg-indigo-950/20 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30'
          : 'border-slate-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-sm">{config.icon}</span>
          <h3 className={`text-sm font-bold tracking-tight ${config.headerColor}`}>
            {title}
          </h3>
        </div>
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${config.pillColor}`}>
          {tasks.length}
        </span>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[140px] pr-1 scrollbar-thin">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            projectColor={projectColor}
            onEdit={onEditTask}
          />
        ))}

        {tasks.length === 0 && !isQuickAdding && (
          <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/60 rounded-xl text-slate-500 text-xs text-center p-3">
            <span>Arrastra tareas aquí</span>
          </div>
        )}
      </div>

      {/* Inline Quick Add Task Footer */}
      <div className="mt-3 pt-2">
        {isQuickAdding ? (
          <form onSubmit={handleQuickAddSubmit} className="space-y-2 animate-fadeIn">
            <input
              type="text"
              autoFocus
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="¿Qué tarea deseas agregar?..."
              className="w-full px-3 py-2 bg-slate-900 border border-indigo-500/60 focus:border-indigo-400 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none shadow-sm"
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsQuickAdding(false);
                  setQuickTitle('');
                }}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 rounded-lg transition"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!quickTitle.trim() || isSubmitting}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                {isSubmitting ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsQuickAdding(true)}
            className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 transition cursor-pointer"
          >
            <span className="text-sm leading-none">+</span>
            <span>Añadir tarea</span>
          </button>
        )}
      </div>
    </div>
  );
};
