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
      TODO: all.filter(t => t.status === 'TODO'),
      IN_PROGRESS: all.filter(t => t.status === 'IN_PROGRESS'),
      DONE: all.filter(t => t.status === 'DONE'),
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
    { status: 'TODO', title: 'Por hacer' },
    { status: 'IN_PROGRESS', title: 'En progreso' },
    { status: 'DONE', title: 'Completado' },
  ];

  return (
    <div className="w-full flex-1 overflow-x-auto pb-6 pt-2 scrollbar-thin">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 min-w-[860px] md:min-w-0">
        {columns.map(col => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            tasks={tasksByStatus[col.status]}
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
