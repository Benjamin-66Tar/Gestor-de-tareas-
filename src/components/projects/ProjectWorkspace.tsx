import React from 'react';
import { Project, ProjectTask, TaskPriority, TaskStatus } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';
import { KanbanBoard } from './KanbanBoard';

interface ProjectWorkspaceProps {
  project: Project;
  onBackToHub: () => void;
  onOpenCreateTask: () => void;
  onOpenEditTask: (task: ProjectTask) => void;
  onOpenEditProject: () => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  onBackToHub,
  onOpenCreateTask,
  onOpenEditTask,
  onOpenEditProject,
}) => {
  const {
    projectViewMode,
    setProjectViewMode,
    goals,
    moveTaskStatus,
    deleteTask,
  } = useAuraState();

  const linkedGoal = project.goalId ? goals.find(g => g.id === project.goalId) : null;
  const progress = Math.min(100, Math.max(0, project.progressPercentage || 0));
  const tasks = project.tasks || [];

  const priorityStyles: Record<TaskPriority, { bg: string; text: string; label: string }> = {
    HIGH: { bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30', text: 'text-rose-400', label: 'Alta' },
    MEDIUM: { bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', text: 'text-amber-400', label: 'Media' },
    LOW: { bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', text: 'text-emerald-400', label: 'Baja' },
  };

  const statusStyles: Record<TaskStatus, { bg: string; text: string; label: string }> = {
    TODO: { bg: 'bg-slate-700/60 border-slate-600/40', text: 'text-slate-300', label: 'Por hacer' },
    IN_PROGRESS: { bg: 'bg-indigo-500/20 border-indigo-500/30', text: 'text-indigo-300', label: 'En progreso' },
    DONE: { bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-300', label: 'Completado' },
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col flex-1 animate-fadeIn">
      {/* Breadcrumb & Top Actions Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <button
            onClick={onBackToHub}
            className="hover:text-indigo-400 flex items-center gap-1 transition cursor-pointer"
          >
            <span>←</span>
            <span>Hub de Proyectos</span>
          </button>
          <span>/</span>
          <span className="text-slate-100 font-bold truncate max-w-[200px] sm:max-w-md">
            {project.title}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenEditProject}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>✏️</span>
            <span>Editar Proyecto</span>
          </button>
          <button
            onClick={onOpenCreateTask}
            className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <span className="text-sm leading-none">+</span>
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Project Workspace Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6 backdrop-blur-sm relative overflow-hidden shadow-lg">
        <div
          className="absolute top-0 left-0 bottom-0 w-1.5"
          style={{ backgroundColor: project.colorHex || '#6366F1' }}
        />

        <div className="pl-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {project.title}
                </h1>
                <span
                  className="px-2.5 py-0.5 text-xs font-bold rounded-full border"
                  style={{
                    backgroundColor: `${project.colorHex}20`,
                    borderColor: `${project.colorHex}40`,
                    color: project.colorHex,
                  }}
                >
                  {project.status === 'ACTIVE' ? 'Activo' : project.status === 'COMPLETED' ? 'Completado' : 'Archivado'}
                </span>

                {linkedGoal && (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1">
                    <span>🎯</span>
                    <span>{linkedGoal.title}</span>
                  </span>
                )}
              </div>

              {project.description && (
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>

            {/* Progress and View Mode Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Progress Box */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 min-w-[200px] w-full sm:w-auto">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Avance Total</span>
                  <span className="font-bold text-slate-200">{progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: project.colorHex || '#6366F1',
                    }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  {project.completedTasks} de {project.totalTasks} tareas completadas
                </div>
              </div>

              {/* View Switcher: Kanban vs List */}
              <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 self-stretch sm:self-center">
                <button
                  onClick={() => setProjectViewMode('KANBAN')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    projectViewMode === 'KANBAN'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>📊</span>
                  <span>Kanban</span>
                </button>
                <button
                  onClick={() => setProjectViewMode('LIST')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    projectViewMode === 'LIST'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>📋</span>
                  <span>Lista</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      {projectViewMode === 'KANBAN' ? (
        <KanbanBoard project={project} onEditTask={onOpenEditTask} />
      ) : (
        /* List / Table View of Tasks */
        <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tarea</th>
                  <th className="py-3 px-4 font-semibold">Estado</th>
                  <th className="py-3 px-4 font-semibold">Prioridad</th>
                  <th className="py-3 px-4 font-semibold">Fecha Límite</th>
                  <th className="py-3 px-4 font-semibold">Subtareas</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No hay tareas registradas en este proyecto aún.
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => {
                    const statusConfig = statusStyles[t.status];
                    const priorityConfig = priorityStyles[t.priority];
                    const subtasks = t.subtasks || [];
                    const completedSubs = subtasks.filter(s => s.isCompleted).length;

                    return (
                      <tr
                        key={t.id}
                        onClick={() => onOpenEditTask(t)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-slate-100">
                          <div className={t.status === 'DONE' ? 'line-through text-slate-400' : ''}>
                            {t.title}
                          </div>
                          {t.description && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              {t.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={t.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => moveTaskStatus(t.id, e.target.value as TaskStatus)}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold outline-none cursor-pointer ${statusConfig.bg} ${statusConfig.text}`}
                          >
                            <option value="TODO">Por hacer</option>
                            <option value="IN_PROGRESS">En progreso</option>
                            <option value="DONE">Completado</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${priorityConfig.bg}`}>
                            {priorityConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {t.deadline
                            ? new Date(t.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                        <td className="py-3 px-4">
                          {subtasks.length > 0 ? (
                            <span className="text-slate-400">
                              {completedSubs}/{subtasks.length}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`¿Eliminar la tarea "${t.title}"?`)) {
                                deleteTask(t.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
