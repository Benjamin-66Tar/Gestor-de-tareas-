import React from 'react';
import { PlanElemento } from '../domain/types';

interface AgendaViewProps {
  elementos: PlanElemento[];
  onItemClick: (item: PlanElemento) => void;
  anioActivo: number;
  mesActivo: number;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  elementos,
  onItemClick,
  anioActivo,
  mesActivo
}) => {
  // Filter elements to display only those falling in the active month
  const itemsFiltrados = elementos.filter(item => {
    if (!item.fecha_limite) return false;
    const date = new Date(item.fecha_limite);
    return date.getFullYear() === anioActivo && date.getMonth() === mesActivo;
  });

  // Sort items by date
  itemsFiltrados.sort((a, b) => {
    return new Date(a.fecha_limite!).getTime() - new Date(b.fecha_limite!).getTime();
  });

  // Group items by local date string for visual grouping
  const agrupadosPorDia: Record<string, PlanElemento[]> = {};
  itemsFiltrados.forEach(item => {
    const localDateStr = item.fecha_limite!.split('T')[0];
    if (!agrupadosPorDia[localDateStr]) {
      agrupadosPorDia[localDateStr] = [];
    }
    agrupadosPorDia[localDateStr].push(item);
  });

  const formatearFechaCabecera = (dateStr: string): string => {
    const parts = dateStr.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col gap-4 p-2 bg-slate-950 animate-fadeIn max-h-[500px] overflow-y-auto scrollbar-thin">
      {itemsFiltrados.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
          <p className="text-sm text-slate-500 font-medium">No hay actividades programadas para este mes.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(agrupadosPorDia).map(dateStr => (
            <div key={dateStr} className="space-y-2">
              {/* Day Header */}
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-b border-slate-900 pb-1">
                {formatearFechaCabecera(dateStr)}
              </h4>
              
              {/* Day's Items list */}
              <div className="space-y-2.5">
                {agrupadosPorDia[dateStr].map(item => (
                  <div
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    style={{ borderLeftColor: item.color_hex }}
                    className="flex justify-between items-center p-3 bg-slate-900 border-l-4 rounded-r-xl border-y border-r border-slate-900/50 hover:bg-slate-800/80 transition-all cursor-pointer transform hover:-translate-x-0.5 active:scale-[0.99] group"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-100 group-hover:text-white transition">
                        {item.titulo}
                      </span>
                      {item.descripcion && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {item.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        style={{ color: item.color_hex, backgroundColor: `${item.color_hex}1A` }}
                        className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border border-transparent tracking-widest"
                      >
                        {item.tipo}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(item.fecha_limite!).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
