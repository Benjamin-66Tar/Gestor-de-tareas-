import React, { useEffect } from 'react';
import { useAuraState } from '../context/AuraState';
import { PlanElemento } from '../domain/types';
import { getWeekDaysForDate, formatWeekTitle, getWeekNumber } from '../utils/dateUtils';

/**
 * Propiedades recibidas por el componente WeekExpandedView.
 */
interface WeekExpandedViewProps {
  elementos: PlanElemento[];
  onDayClick?: (dateStr: string) => void;
  onItemClick?: (item: PlanElemento) => void;
}

/**
 * Nombres de los días de la semana para los encabezados de columna.
 */
const DIAS_SEMANA_COMPLETO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_SEMANA_CORTO = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

/**
 * Componente WeekExpandedView (Modo Agrandador / Enfoque Semanal):
 * 
 * Despliega una semana específica (ej. 17 al 23 de Agosto) en 7 columnas amplias y espaciosas.
 * Las tareas de cada día se presentan en orden cronológico en tarjetas detalladas.
 * Permite añadir elementos directamente a un día específico y navegar entre semanas.
 */
export const WeekExpandedView: React.FC<WeekExpandedViewProps> = ({
  elementos,
  onDayClick,
  onItemClick
}) => {
  const {
    fechaSemanaSeleccionada,
    setFechaSemanaSeleccionada,
    setVistaCalendario,
    irSemanaAnterior,
    irSemanaSiguiente
  } = useAuraState();

  // Generar los 7 días de la semana activa a partir de la fecha seleccionada
  const diasSemana = getWeekDaysForDate(fechaSemanaSeleccionada, elementos);
  const fechaInicio = diasSemana[0]?.date || new Date();
  const fechaFin = diasSemana[6]?.date || new Date();
  const numeroSemana = getWeekNumber(fechaInicio);

  // Atajo de teclado: Al presionar la tecla Escape, regresar a la vista mensual
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVistaCalendario('MES');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setVistaCalendario]);

  // Total de elementos en esta semana y desglose por categorías
  const totalElementosSemana = diasSemana.reduce((acc, dia) => acc + dia.items.length, 0);

  // Ir a la semana de la fecha actual (Hoy)
  const irAHoy = () => {
    setFechaSemanaSeleccionada(new Date());
  };

  /**
   * Formatea la hora de un elemento ISO (ej: 2026-08-22T14:30:00Z -> "14:30")
   */
  const formatearHora = (fechaIso?: string): string => {
    if (!fechaIso) return '';
    try {
      const fecha = new Date(fechaIso);
      return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-slate-950 text-slate-100 animate-fadeIn">
      {/* 1. Barra de Control y Navegación Semanal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-slate-900/90 border-b border-slate-800 gap-4">
        {/* Lado Izquierdo: Botón para volver y Título del Rango */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setVistaCalendario('MES')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all border border-slate-700/80 shadow-sm active:scale-95 group"
            title="Volver a la vista del mes completo (o presiona ESC)"
          >
            <span className="text-amber-400 group-hover:-translate-x-0.5 transition-transform">&larr;</span>
            <span>Volver al Mes</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-900 text-slate-400 rounded border border-slate-700">ESC</kbd>
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-indigo-300 to-indigo-400">
                {formatWeekTitle(fechaInicio, fechaFin)}
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm">
                Semana {numeroSemana}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Modo Agrandador Semanal &bull; {totalElementosSemana} {totalElementosSemana === 1 ? 'elemento programado' : 'elementos programados'}
            </span>
          </div>
        </div>

        {/* Lado Derecho: Controles de paso semanal (Anterior, Hoy, Siguiente) */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button
            onClick={irSemanaAnterior}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition border border-slate-700/60 active:scale-95"
            title="Ver semana anterior"
          >
            <span>&larr;</span>
            <span className="hidden sm:inline">Semana Anterior</span>
          </button>
          
          <button
            onClick={irAHoy}
            className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white text-xs font-bold rounded-lg transition border border-indigo-500/40 active:scale-95"
            title="Ir a la semana actual"
          >
            Hoy
          </button>

          <button
            onClick={irSemanaSiguiente}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition border border-slate-700/60 active:scale-95"
            title="Ver semana siguiente"
          >
            <span className="hidden sm:inline">Semana Siguiente</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* 2. Cuadrícula de 7 Columnas Agrandadas (Lunes a Domingo) */}
      <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-7 gap-3 flex-1 bg-slate-950 overflow-x-auto min-h-[580px]">
        {diasSemana.map((dia, idx) => {
          const esHoy = dia.isToday;
          const cantidadItems = dia.items.length;

          return (
            <div
              key={dia.formattedDate}
              className={`flex flex-col justify-between rounded-2xl border transition-all duration-200 min-h-[480px] bg-slate-900/30 ${
                esHoy
                  ? 'border-indigo-500/60 bg-gradient-to-b from-indigo-950/20 via-slate-900/40 to-slate-950 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-950/30'
                  : 'border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              {/* Encabezado de la Columna del Día */}
              <div className={`p-3 border-b rounded-t-2xl flex flex-col gap-1 ${
                esHoy ? 'bg-indigo-950/40 border-indigo-500/30' : 'bg-slate-900/70 border-slate-800/80'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <span className="hidden xl:inline">{DIAS_SEMANA_COMPLETO[idx]}</span>
                    <span className="xl:hidden">{DIAS_SEMANA_CORTO[idx]}</span>
                  </span>
                  {esHoy && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-indigo-500 text-white tracking-widest animate-pulse">
                      Hoy
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-0.5">
                  <span className={`text-2xl font-black ${
                    esHoy ? 'text-indigo-400' : 'text-slate-100'
                  }`}>
                    {dia.dayNumber}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    {cantidadItems === 0 ? 'Sin tareas' : `${cantidadItems} ${cantidadItems === 1 ? 'tarea' : 'tareas'}`}
                  </span>
                </div>
              </div>

              {/* Lista de Tarjetas de Tareas en Orden Cronológico */}
              <div className="flex-1 p-2.5 flex flex-col gap-2.5 overflow-y-auto max-h-[440px] scrollbar-thin">
                {cantidadItems === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center text-slate-600">
                    <span className="text-xl mb-1 opacity-40">☕</span>
                    <p className="text-[11px] font-medium">Día libre</p>
                  </div>
                ) : (
                  dia.items.map((item) => {
                    const horaStr = formatearHora(item.fecha_limite);
                    return (
                      <div
                        key={item.id}
                        onClick={() => onItemClick && onItemClick(item)}
                        style={{ borderLeftColor: item.color_hex }}
                        className="group flex flex-col p-2.5 bg-slate-900 border border-slate-800/90 border-l-4 rounded-xl hover:bg-slate-850 hover:border-slate-700 transition-all cursor-pointer transform hover:-translate-y-0.5 hover:shadow-lg shadow-black/40"
                      >
                        {/* Tipo y Hora */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            style={{ color: item.color_hex, backgroundColor: `${item.color_hex}1A` }}
                            className="px-1.5 py-0.5 text-[8px] font-extrabold uppercase rounded tracking-wider"
                          >
                            {item.tipo}
                          </span>
                          {horaStr && (
                            <span className="text-[10px] font-mono text-slate-400 font-medium">
                              🕒 {horaStr}
                            </span>
                          )}
                        </div>

                        {/* Título */}
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-white transition-colors line-clamp-2">
                          {item.titulo}
                        </h4>

                        {/* Descripción (si existe) */}
                        {item.descripcion && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                            {item.descripcion}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Botón "+ Añadir" directo en el pie de cada columna */}
              <div className="p-2 border-t border-slate-800/60 bg-slate-900/20 rounded-b-2xl">
                <button
                  onClick={() => onDayClick && onDayClick(dia.formattedDate)}
                  className="w-full py-1.5 px-2 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-indigo-600/30 hover:border-indigo-500/40 border border-slate-800/80 rounded-xl transition-all active:scale-98"
                >
                  <span className="text-indigo-400 font-black">+</span>
                  <span>Añadir</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
