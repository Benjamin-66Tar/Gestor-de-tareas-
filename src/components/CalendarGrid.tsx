import React, { useState, useEffect } from 'react';
import { useAuraState } from '../context/AuraState';
import { generateCalendarGrid } from '../utils/dateUtils';
import { PlanElemento } from '../domain/types';
import { AgendaView } from './AgendaView';

// Month names in Spanish
const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Weekday names starting on Monday
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

type FiltroTipo = 'ALL' | 'ACTIVIDAD' | 'EVENTO' | 'OBJETIVO' | 'PROYECTO';

interface CalendarGridProps {
  onDayClick?: (dateStr: string) => void;
  onItemClick?: (item: PlanElemento) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ onDayClick, onItemClick }) => {
  const {
    elementos,
    anioActivo,
    mesActivo,
    setAnioActivo,
    setMesActivo
  } = useAuraState();

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('ALL');
  const [isMobile, setIsMobile] = useState(false);

  // Monitor window resize to detect mobile screen width
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize(); // Trigger once on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter elements locally based on selected filter pill
  const elementosFiltrados = elementos.filter(
    (item) => filtroTipo === 'ALL' || item.tipo === filtroTipo
  );

  // Generate the 42-day calendar grid populated with filtered items
  const grid = generateCalendarGrid(anioActivo, mesActivo, elementosFiltrados);

  const irMesAnterior = () => {
    if (mesActivo === 0) {
      setMesActivo(11);
      setAnioActivo(anioActivo - 1);
    } else {
      setMesActivo(mesActivo - 1);
    }
  };

  const irMesSiguiente = () => {
    if (mesActivo === 11) {
      setMesActivo(0);
      setAnioActivo(anioActivo + 1);
    } else {
      setMesActivo(mesActivo + 1);
    }
  };

  const irAHoy = () => {
    const hoy = new Date();
    setMesActivo(hoy.getMonth());
    setAnioActivo(hoy.getFullYear());
  };

  // Color mapping for active filter states
  const coloresFiltro: Record<FiltroTipo, string> = {
    ALL: 'bg-indigo-600 border-indigo-500 text-white',
    ACTIVIDAD: 'bg-amber-500 border-amber-400 text-slate-950',
    EVENTO: 'bg-rose-500 border-rose-400 text-white',
    OBJETIVO: 'bg-emerald-500 border-emerald-400 text-slate-950',
    PROYECTO: 'bg-cyan-500 border-cyan-400 text-slate-950',
  };

  const labelsFiltros: { value: FiltroTipo; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'ACTIVIDAD', label: 'Actividades' },
    { value: 'EVENTO', label: 'Eventos' },
    { value: 'OBJETIVO', label: 'Objetivos' },
    { value: 'PROYECTO', label: 'Proyectos' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
      {/* Calendar Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-indigo-400">
            {NOMBRES_MESES[mesActivo]} {anioActivo}
          </h2>
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {elementosFiltrados.length} elementos
          </span>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={irMesAnterior}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition active:scale-95"
            title="Mes Anterior"
          >
            &larr;
          </button>
          <button
            onClick={irAHoy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg transition active:scale-95 border border-slate-700"
          >
            Hoy
          </button>
          <button
            onClick={irMesSiguiente}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition active:scale-95"
            title="Mes Siguiente"
          >
            &rarr;
          </button>
        </div>
      </div>

      {/* Filter Selectors */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/80">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">
          Filtrar:
        </span>
        {labelsFiltros.map((filtro) => {
          const isSelected = filtroTipo === filtro.value;
          return (
            <button
              key={filtro.value}
              onClick={() => setFiltroTipo(filtro.value)}
              className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded-full border transition-all duration-150 ${
                isSelected
                  ? `${coloresFiltro[filtro.value]} shadow`
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {filtro.label}
            </button>
          );
        })}
      </div>

      {/* Grid or Agenda View (Responsive Layout) */}
      {isMobile ? (
        <div className="p-4 bg-slate-950 flex-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Vista de Agenda (Móvil)</h3>
            <button
              onClick={() => onDayClick && onDayClick(new Date().toISOString().split('T')[0])}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition active:scale-95"
            >
              + Nuevo Elemento
            </button>
          </div>
          <AgendaView
            elementos={elementosFiltrados}
            onItemClick={(item) => onItemClick && onItemClick(item)}
            anioActivo={anioActivo}
            mesActivo={mesActivo}
          />
        </div>
      ) : (
        <>
          {/* Weekdays Row */}
          <div className="grid grid-cols-7 bg-slate-900/20 border-b border-slate-800/50 text-center py-2">
            {DIAS_SEMANA.map((dia) => (
              <span key={dia} className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {dia}
              </span>
            ))}
          </div>

          {/* Monthly Grid */}
          <div className="grid grid-cols-7 flex-1 bg-slate-950 divide-x divide-y divide-slate-900 border-t border-l border-slate-900 min-h-[450px]">
            {grid.map((day, idx) => {
              return (
                <div
                  key={`${day.formattedDate}-${idx}`}
                  onClick={() => onDayClick && onDayClick(day.formattedDate)}
                  className={`p-2 flex flex-col justify-between min-h-[80px] hover:bg-slate-900/20 transition cursor-pointer group ${
                    day.isCurrentMonth ? 'bg-slate-950/10' : 'bg-slate-900/5 opacity-30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        day.isToday
                          ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-extrabold shadow-lg scale-110'
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                    {day.isToday && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] scrollbar-none">
                    {day.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onItemClick) onItemClick(item);
                        }}
                        style={{ borderLeftColor: item.color_hex }}
                        className="group/item flex flex-col p-1 text-[9px] leading-tight rounded bg-slate-900 border-l-2 hover:bg-slate-800 transition transform hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                      >
                        <span className="font-semibold text-slate-200 group-hover/item:text-white truncate">
                          {item.titulo}
                        </span>
                        <span className="text-[7px] text-slate-500 uppercase tracking-tight">
                          {item.tipo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
