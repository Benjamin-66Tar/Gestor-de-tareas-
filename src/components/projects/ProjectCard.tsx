import React, { useState } from 'react';
import { Project } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface ProjectCardProps {
  project: Project;
  onSelect: (projectId: string) => void;
  onEdit: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, onEdit }) => {
  const { deleteProject, goals } = useAuraState();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar el proyecto "${project.title}"? Todas sus tareas serán eliminadas.`)) {
      setIsDeleting(true);
      await deleteProject(project.id);
    }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    COMPLETED: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    ARCHIVED: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Activo',
    COMPLETED: 'Completado',
    ARCHIVED: 'Archivado',
  };

  const linkedGoal = project.goalId ? goals.find(g => g.id === project.goalId) : null;
  const progress = Math.min(100, Math.max(0, project.progressPercentage || 0));

  return (
    <div
      onClick={() => onSelect(project.id)}
      className={`group bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
        isDeleting ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      {/* Top color indicator bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 transition-all"
        style={{ backgroundColor: project.colorHex || '#6366F1' }}
      />

      <div>
        {/* Card Header: Status badge & Edit/Delete actions */}
        <div className="flex justify-between items-start gap-2 mb-3 mt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2.5 py-0.5 text-xs font-bold rounded-full border shadow-sm flex items-center gap-1.5"
              style={{
                backgroundColor: `${project.colorHex}15`,
                borderColor: `${project.colorHex}40`,
                color: project.colorHex,
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: project.colorHex }}
              />
              Proyecto
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[project.status] || statusColors.ACTIVE}`}>
              {statusLabels[project.status] || project.status}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              title="Editar proyecto"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg text-xs transition"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              title="Eliminar proyecto"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs transition"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Title and Description */}
        <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
          {project.title}
        </h3>
        {project.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Linked Goal Pill (if any) */}
        {linkedGoal && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
            <span>🎯</span>
            <span className="truncate max-w-[180px]">Meta: {linkedGoal.title}</span>
          </div>
        )}
      </div>

      {/* Card Footer: Progress Bar and Task Count */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
          <span className="text-slate-400 flex items-center gap-1">
            <span>📋</span>
            <span>{project.completedTasks}/{project.totalTasks} tareas</span>
          </span>
          <span
            className="font-bold text-xs"
            style={{ color: project.colorHex || '#818cf8' }}
          >
            {progress}%
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: project.colorHex || '#6366F1',
            }}
          />
        </div>
      </div>
    </div>
  );
};
