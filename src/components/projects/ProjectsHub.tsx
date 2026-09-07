import React, { useState, useMemo } from 'react';
import { useAuraState } from '../../context/AuraState';
import { ProjectCard } from './ProjectCard';
import { Project, ProjectStatus } from '../../domain/types';

interface ProjectsHubProps {
  onSelectProject: (projectId: string) => void;
  onOpenCreateDrawer: () => void;
  onOpenEditDrawer: (project: Project) => void;
}

export const ProjectsHub: React.FC<ProjectsHubProps> = ({
  onSelectProject,
  onOpenCreateDrawer,
  onOpenEditDrawer,
}) => {
  const {
    projects,
    projectsLoading,
    projectsError,
    projectFilter,
    setProjectFilter,
  } = useAuraState();

  const [searchLocal, setSearchLocal] = useState('');

  // Status filter pills definition
  const statusOptions: { label: string; value: ProjectStatus | 'ALL' }[] = [
    { label: 'Activos', value: 'ACTIVE' },
    { label: 'Completados', value: 'COMPLETED' },
    { label: 'Archivados', value: 'ARCHIVED' },
    { label: 'Todos', value: 'ALL' },
  ];

  // In-memory instant search and filtering (<50ms response)
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Lifecycle filter
      if (projectFilter.status !== 'ALL' && p.status !== projectFilter.status) {
        return false;
      }
      // Instant text search
      if (searchLocal.trim()) {
        const query = searchLocal.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesDesc = p.description ? p.description.toLowerCase().includes(query) : false;
        if (!matchesTitle && !matchesDesc) {
          return false;
        }
      }
      return true;
    });
  }, [projects, projectFilter.status, searchLocal]);

  // Metric counters
  const counts = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'ACTIVE').length;
    const completed = projects.filter(p => p.status === 'COMPLETED').length;
    return { total, active, completed };
  }, [projects]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Top Header & Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Hub de Proyectos
              </span>
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              {counts.active} activos
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Organiza tus iniciativas en tableros Kanban interactivos y haz seguimiento en tiempo real.
          </p>
        </div>

        {/* Primary Action: + Nuevo Proyecto */}
        <button
          onClick={onOpenCreateDrawer}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <span className="text-base font-bold">+</span>
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Control Bar: Filter Pills & Instant Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-thin">
          {statusOptions.map((opt) => {
            const isActive = projectFilter.status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setProjectFilter(prev => ({ ...prev, status: opt.value }))}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Instant Search Bar */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchLocal}
            onChange={(e) => setSearchLocal(e.target.value)}
            placeholder="Buscar por título o descripción..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-800/80 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
          />
          <span className="absolute left-3 top-2 text-xs text-slate-500">
            🔍
          </span>
          {searchLocal && (
            <button
              onClick={() => setSearchLocal('')}
              className="absolute right-2.5 top-1.5 text-xs text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {projectsError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{projectsError}</span>
        </div>
      )}

      {/* Loading Skeleton / Spinner */}
      {projectsLoading && projects.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-52 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-6 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-full" />
              </div>
              <div className="h-3 bg-slate-800 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-4">
            📁
          </div>
          <h3 className="text-lg font-bold text-slate-200 mb-1">
            {searchLocal || projectFilter.status !== 'ALL'
              ? 'No se encontraron proyectos con estos filtros'
              : 'Aún no tienes proyectos creados'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            {searchLocal || projectFilter.status !== 'ALL'
              ? 'Prueba modificando los filtros de estado o el término de búsqueda.'
              : 'Comienza creando tu primer proyecto para gestionar tareas en tu tablero Kanban.'}
          </p>
          <button
            onClick={onOpenCreateDrawer}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
          >
            + Crear Primer Proyecto
          </button>
        </div>
      ) : (
        /* Grid of Project Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onSelectProject}
              onEdit={onOpenEditDrawer}
            />
          ))}
        </div>
      )}
    </div>
  );
};
