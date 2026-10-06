import React, { useMemo } from 'react';
import { Project, ProjectTask, TaskStatus } from '../../domain/types';
import { KanbanColumn } from './KanbanColumn';
import { useAuraState } from '../../context/AuraState';

interface KanbanBoardProps {
  project: Project;
  onEditTask: (task: ProjectTask) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ project, onEditTask }) => {
  const { moveTaskStatus, createTask } = useAuraState();

  const tasksByStatus = useMemo(() => {
    const all = project.tasks || [];
    return {
      BACKLOG: all.filter(t => t.status === 'BACKLOG' || t.status === 'TODO'),
      ANALYSIS: all.filter(t => t.status === 'ANALYSIS'),
      IN_PROGRESS: all.filter(t => t.status === 'IN_PROGRESS'),
      TESTING: all.filter(t => t.status === 'TESTING'),
      DONE: all.filter(t => t.status === 'DONE'),
      TODO: [],
    };
  }, [project.tasks]);

  const handleDropTask = async (taskId: string, newStatus: TaskStatus) => {
    await moveTaskStatus(taskId, newStatus);
  };

  const handleQuickAddTask = async (status: TaskStatus, title: string) => {
    await createTask(project.id, {
      title,
      status,
      priority: 'MEDIUM',
    });
  };

  const columns: { status: TaskStatus; title: string }[] = [
    { status: 'BACKLOG', title: 'Backlog' },
    { status: 'ANALYSIS', title: 'Análisis' },
    { status: 'IN_PROGRESS', title: 'Desarrollo' },
    { status: 'TESTING', title: 'Pruebas' },
    { status: 'DONE', title: 'Completo' },
  ];

  return (
    <div className="w-full flex-1 overflow-x-auto pb-6 pt-2 scrollbar-thin">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 min-w-[1200px] xl:min-w-0">
        {columns.map(col => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            tasks={tasksByStatus[col.status] || []}
            projectColor={project.colorHex}
            onEditTask={onEditTask}
            onDropTask={handleDropTask}
            onQuickAddTask={handleQuickAddTask}
          />
        ))}
      </div>
    </div>
  );
};
