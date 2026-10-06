import React, { useState, useMemo } from 'react';
import { LearningItem, LearningStatus, ResourceType } from '../../domain/types';
import { useAuraState } from '../../context/AuraState';

interface LearningTableViewProps {
  items: LearningItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onOpenDrawer: (item: LearningItem) => void;
  onOpenSchedule: (item: LearningItem) => void;
}

type SortField = 'title' | 'progress' | 'lastActivity' | 'status' | 'type';
type SortOrder = 'asc' | 'desc';

export const LearningTableView: React.FC<LearningTableViewProps> = ({
  items,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onOpenDrawer,
  onOpenSchedule,
}) => {
  const {
    toggleLearningFocus,
    updateLearningItem,
    deleteLearningItem,
    learningItems,
    quickIncrementLearning,
  } = useAuraState();

  const [sortField, setSortField] = useState<SortField>('lastActivity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'progress') {
        comparison = (a.progressPercentage || 0) - (b.progressPercentage || 0);
      } else if (sortField === 'lastActivity') {
        const timeA = new Date(a.lastActivityAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.lastActivityAt || b.createdAt || 0).getTime();
        comparison = timeA - timeB;
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      } else if (sortField === 'type') {
        comparison = (a.resourceType || '').localeCompare(b.resourceType || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, sortField, sortOrder]);

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const handleToggleFocus = async (item: LearningItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.status === 'DROPPED' || item.status === 'COMPLETED') return;
    const isFocus = Boolean(item.is_focus ?? item.isFocus);
    if (!isFocus) {
      const activeCount = learningItems.filter(i => Boolean(i.is_focus ?? i.isFocus)).length;
      if (activeCount >= 3) {
        const proceed = confirm(
          `Ya tienes ${activeCount} recursos fijados en tu Enfoque Semanal.\nSe sugiere mantener máximo 2 o 3 activos a la vez para no dispersarte.\n\n¿Deseas fijar "${item.title}" de todos modos?`
        );
        if (!proceed) return;
      }
    }
    await toggleLearningFocus(item.id);
  };

  const handleStatusChange = async (item: LearningItem, newStatus: LearningStatus) => {
    if (newStatus === 'DROPPED') {
      const proceed = confirm(
        `¿Descartar "${item.title}"?\nSe liberará de tu enfoque activo y se desvinculará de tus objetivos sin alterar sus estadísticas.`
      );
      if (!proceed) return;
    }
    await updateLearningItem(item.id, {
      status: newStatus,
      is_focus: newStatus === 'DROPPED' || newStatus === 'COMPLETED' ? false : (item.is_focus ?? item.isFocus),
      isFocus: newStatus === 'DROPPED' || newStatus === 'COMPLETED' ? false : (item.is_focus ?? item.isFocus),
    });
  };

  const handleDelete = async (item: LearningItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar definitivamente "${item.title}"?`)) {
      await deleteLearningItem(item.id);
    }
  };

  const typeConfig: Record<ResourceType, { label: string; icon: string }> = {
    COURSE: { label: 'Curso', icon: '🎓' },
    BOOK: { label: 'Libro', icon: '📖' },
    ARTICLE: { label: 'Artículo', icon: '📰' },
    TECH_DOC: { label: 'Doc Técnica', icon: '⚙️' },
  };

  const statusConfig: Record<LearningStatus, { label: string; badgeClass: string }> = {
    BACKLOG: { label: 'Por empezar', badgeClass: 'bg-slate-800 text-slate-300 border-slate-700' },
    IN_PROGRESS: { label: 'En curso', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    PAUSED: { label: 'En pausa', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    COMPLETED: { label: 'Completado', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    DROPPED: { label: 'Descartado', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                  title="Seleccionar todos"
                />
              </th>
              <th className="py-3 px-2 w-8 text-center" title="Enfoque Semanal">
                ⭐
              </th>
              <th
                onClick={() => handleSort('title')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Recurso</span>
                  {sortField === 'title' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th
                onClick={() => handleSort('type')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition select-none w-28"
              >
                <div className="flex items-center gap-1">
                  <span>Tipo</span>
                  {sortField === 'type' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th className="py-3 px-3 w-32">Plataforma</th>
              <th
                onClick={() => handleSort('progress')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition select-none w-36"
              >
                <div className="flex items-center gap-1">
                  <span>Progreso</span>
                  {sortField === 'progress' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition select-none w-32"
              >
                <div className="flex items-center gap-1">
                  <span>Estado</span>
                  {sortField === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th
                onClick={() => handleSort('lastActivity')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition select-none w-32"
              >
                <div className="flex items-center gap-1">
                  <span>Actividad</span>
                  {sortField === 'lastActivity' && (sortOrder === 'asc' ? '▲' : '▼')}
                </div>
              </th>
              <th className="py-3 px-3 w-28 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isFocus = Boolean(item.is_focus ?? item.isFocus);
              const currentType = typeConfig[item.resourceType] || typeConfig.COURSE;
              const currentStatus = statusConfig[item.status] || statusConfig.BACKLOG;

              return (
                <tr
                  key={item.id}
                  onClick={() => onOpenDrawer(item)}
                  className={`group transition hover:bg-slate-800/40 cursor-pointer ${
                    isSelected ? 'bg-purple-950/20' : ''
                  }`}
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor: item.colorHex || '#8B5CF6',
                  }}
                >
                  {/* Select Checkbox */}
                  <td
                    onClick={(e) => e.stopPropagation()}
                    className="py-2.5 px-3 text-center"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.id)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                    />
                  </td>

                  {/* Focus Toggle Star */}
                  <td
                    onClick={(e) => handleToggleFocus(item, e)}
                    className="py-2.5 px-2 text-center"
                    title={isFocus ? 'En enfoque semanal' : 'Fijar en enfoque semanal'}
                  >
                    <button
                      type="button"
                      disabled={item.status === 'DROPPED' || item.status === 'COMPLETED'}
                      className={`text-sm transition ${
                        isFocus
                          ? 'text-amber-400 scale-110 drop-shadow'
                          : 'text-slate-600 group-hover:text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      {isFocus ? '⭐' : '☆'}
                    </button>
                  </td>

                  {/* Title & Goal Badge */}
                  <td className="py-2.5 px-4 max-w-xs sm:max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 group-hover:text-purple-300 transition truncate">
                        {item.title}
                      </span>
                      {item.platformUrl && (
                        <a
                          href={item.platformUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Abrir recurso externo"
                          className="text-slate-500 hover:text-purple-400 text-xs shrink-0"
                        >
                          ↗
                        </a>
                      )}
                    </div>
                    {item.goalTitle && (
                      <div className="text-[10px] text-emerald-400/90 font-medium truncate flex items-center gap-1 mt-0.5">
                        <span>🎯</span>
                        <span>{item.goalTitle}</span>
                      </div>
                    )}
                  </td>

                  {/* Resource Type */}
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-[11px] text-slate-300 font-medium">
                      <span>{currentType.icon}</span>
                      <span>{currentType.label}</span>
                    </span>
                  </td>

                  {/* Platform */}
                  <td className="py-2.5 px-3 text-slate-400 font-medium truncate max-w-[120px]">
                    {item.platformName || '—'}
                  </td>

                  {/* Progress Bar & Percentage */}
                  <td className="py-2.5 px-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                        <span>{item.progressPercentage}%</span>
                        <span className="text-[10px] text-slate-400">
                          {item.progressMode === 'TOPICS'
                            ? `${item.topics?.filter(t => t.isCompleted).length || 0}/${item.topics?.length || 0}`
                            : `${item.currentUnit}/${item.totalUnits}`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                          style={{ width: `${item.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td
                    onClick={(e) => e.stopPropagation()}
                    className="py-2.5 px-3"
                  >
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item, e.target.value as LearningStatus)}
                      className={`text-[11px] font-bold py-1 px-2 rounded-xl border bg-slate-950 focus:outline-none focus:border-purple-500 cursor-pointer ${currentStatus.badgeClass}`}
                    >
                      <option value="BACKLOG">Por empezar</option>
                      <option value="IN_PROGRESS">En curso</option>
                      <option value="PAUSED">En pausa</option>
                      <option value="COMPLETED">Completado</option>
                      <option value="DROPPED">Descartado</option>
                    </select>
                  </td>

                  {/* Activity & Dormancy */}
                  <td className="py-2.5 px-3">
                    {item.isDormant && item.status === 'IN_PROGRESS' ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30"
                        title={`Sin actividad hace ${item.dormancyDays} días`}
                      >
                        <span>⚠️</span>
                        <span>{item.dormancyDays}d inactivo</span>
                      </span>
                    ) : item.status === 'COMPLETED' ? (
                      <span className="text-emerald-400 text-[11px] font-semibold">✓ Concluido</span>
                    ) : item.status === 'DROPPED' ? (
                      <span className="text-rose-400 text-[11px] font-semibold">📦 Descartado</span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        {item.dormancyDays !== undefined ? `${item.dormancyDays}d atrás` : 'Reciente'}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td
                    onClick={(e) => e.stopPropagation()}
                    className="py-2.5 px-3 text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      {item.progressMode === 'MANUAL' && item.status !== 'COMPLETED' && (
                        <button
                          onClick={() => quickIncrementLearning(item.id, 1)}
                          title="Registrar +1"
                          className="p-1 text-purple-400 hover:text-purple-300 hover:bg-slate-800 rounded text-xs transition"
                        >
                          +1
                        </button>
                      )}
                      <button
                        onClick={() => onOpenSchedule(item)}
                        title="Programar en calendario"
                        className="p-1 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded text-xs transition"
                      >
                        📅
                      </button>
                      <button
                        onClick={() => onOpenDrawer(item)}
                        title="Editar detalles"
                        className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded text-xs transition"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => handleDelete(item, e)}
                        title="Eliminar"
                        className="p-1 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded text-xs transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
