import React from 'react';
import { useAuraState } from '../../context/AuraState';
import { ProjectsHub } from './ProjectsHub';
import { ProjectWorkspace } from './ProjectWorkspace';
import { ProjectDrawer } from './ProjectDrawer';
import { TaskDrawer } from './TaskDrawer';
import { Project, ProjectTask } from '../../domain/types';

export const ProjectsView: React.FC = () => {
  const {
    activeProject,
    setActiveProject,
    selectProject,
    projectDrawerOpen,
    setProjectDrawerOpen,
    editingProject,
    setEditingProject,
    taskDrawerOpen,
    setTaskDrawerOpen,
    editingTask,
    setEditingTask,
  } = useAuraState();

  const handleSelectProject = async (projectId: string) => {
    await selectProject(projectId);
  };

  const handleOpenCreateProject = () => {
    setEditingProject(null);
    setProjectDrawerOpen(true);
  };

  const handleOpenEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectDrawerOpen(true);
  };

  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskDrawerOpen(true);
  };

  const handleOpenEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setTaskDrawerOpen(true);
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex flex-col">
      {/* Switch between Projects Hub and dedicated Workspace */}
      {activeProject ? (
        <ProjectWorkspace
          project={activeProject}
          onBackToHub={() => setActiveProject(null)}
          onOpenCreateTask={handleOpenCreateTask}
          onOpenEditTask={handleOpenEditTask}
          onOpenEditProject={() => handleOpenEditProject(activeProject)}
        />
      ) : (
        <ProjectsHub
          onSelectProject={handleSelectProject}
          onOpenCreateDrawer={handleOpenCreateProject}
          onOpenEditDrawer={handleOpenEditProject}
        />
      )}

      {/* Slide-over Drawers */}
      <ProjectDrawer
        isOpen={projectDrawerOpen}
        onClose={() => {
          setProjectDrawerOpen(false);
          setEditingProject(null);
        }}
        projectToEdit={editingProject}
      />

      <TaskDrawer
        isOpen={taskDrawerOpen}
        onClose={() => {
          setTaskDrawerOpen(false);
          setEditingTask(null);
        }}
        taskToEdit={editingTask}
        projectId={activeProject ? activeProject.id : ''}
      />
    </div>
  );
};
