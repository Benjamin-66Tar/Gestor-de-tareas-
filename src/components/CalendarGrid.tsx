import React, { useState, useEffect } from 'react';
import { useAuraState } from '../context/AuraState';
import { generateCalendarGrid, getWeeksFromGrid } from '../utils/dateUtils';
import { PlanElemento } from '../domain/types';
import { AgendaView } from './AgendaView';
import { WeekExpandedView } from './WeekExpandedView';

/**
 * Nombres completos de los meses en español para la cabecera.
 */
const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Días de la semana en formato corto iniciando en Lunes según el estándar europeo e ISO.
 */
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * Tipos de filtros admitidos para clasificar elementos del gestor.
 */
type FiltroTipo = 'ALL' | 'ACTIVIDAD' | 'EVENTO' | 'OBJETIVO' | 'PROYECTO';

interface CalendarGridProps {
  onDayClick?: (dateStr: string) => void;
  onItemClick?: (item: PlanElemento) => void;
}

/**
 * Componente Principal del Calendario (CalendarGrid):
 * 
 * Soporta dos modos principales en escritorio:
 * 1. Vista Mensual ('MES'): Despliega los 42 días en 6 filas semanales. Cada fila
 *    cuenta en su lateral izquierdo con un botón de zoom '🔍' que permite agrandar
 *    esa semana específica (ej. semana 17 al 23).
 * 2. Vista Semanal Dedicada ('SEMANA'): Se activa al pulsar el botón de zoom o el
 *    selector de vista, renderizando el componente WeekExpandedView en pantalla completa.
 * 
 * En dispositivos móviles (<768px), conmuta automáticamente a la vista de Agenda.
 */
export const CalendarGrid: React.FC<CalendarGridProps> = ({ onDayClick, onItemClick }) => {
  const {
    elementos,
    anioActivo,
    mesActivo,
    setAnioActivo,
    setMesActivo,
    vistaCalendario,
    setVistaCalendario,
    agrandarSemana
  } = useAuraState();

  // Estado local para filtro por tipo (Actividad, Evento, Objetivo, Proyecto)
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('ALL');
  // Detección responsiva de dispositivo móvil
  const [isMobile, setIsMobile] = useState(false);

  // Efecto para escuchar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrado reactivo de elementos según el tipo seleccionado
  const elementosFiltrados = elementos.filter(
    (item) => filtroTipo === 'ALL' || item.tipo === filtroTipo
  );

  // Generación de los 42 días de la cuadrícula mensual con sus respectivos elementos
  const grid = generateCalendarGrid(anioActivo, mesActivo, elementosFiltrados);

  // Agrupación de los 42 días en 6 bloques semanales para permitir el botón de zoom lateral
  const semanasDelMes = getWeeksFromGrid(grid);

  /**
   * Navegación al mes anterior.
   */
  const irMesAnterior = () => {
    if (mesActivo === 0) {
      setMesActivo(11);
      setAnioActivo(anioActivo - 1);
    } else {
      setMesActivo(mesActivo - 1);
    }
  };

  /**
   * Navegación al mes siguiente.
   */
  const irMesSiguiente = () => {
    if (mesActivo === 11) {
      setMesActivo(0);
      setAnioActivo(anioActivo + 1);
    } else {
      setMesActivo(mesActivo + 1);
    }
  };

  /**
   * Reestablece la fecha al día y mes actual.
   */
  const irAHoy = () => {
    const hoy = new Date();
    setMesActivo(hoy.getMonth());
    setAnioActivo(hoy.getFullYear());
  };

  // Mapeo de estilos y colores temáticos para las píldoras de filtrado
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
      {/* 1. Encabezado de Navegación del Calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 border-b border-slate-800 gap-3">
        {/* Título del Mes / Año y Contador */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-indigo-400">
            {NOMBRES_MESES[mesActivo]} {anioActivo}
          </h2>
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {elementosFiltrados.length} elementos
          </span>
        </div>

        {/* Conmutador de Modo de Vista [ Mes | Semana ] y Botones de Navegación */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Selector de modo de vista (solo visible en pantallas no móviles) */}
          {!isMobile && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setVistaCalendario('MES')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  vistaCalendario === 'MES'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Mensual de 42 días"
              >
                Mes
              </button>
              <button
                onClick={() => {
                  // Si pasa a semana, toma la fecha de hoy o el día 1 del mes activo
                  const fechaBase = (mesActivo === new Date().getMonth() && anioActivo === new Date().getFullYear())
                    ? new Date()
                    : new Date(anioActivo, mesActivo, 1);
                  agrandarSemana(fechaBase);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  vistaCalendario === 'SEMANA'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Semanal Agrandada"
              >
                Semana
              </button>
            </div>
          )}

          {/* Flechas de navegación mensual (solo activas si no estamos en vista semanal dedicada) */}
          {vistaCalendario === 'MES' && (
            <div className="flex items-center gap-1.5">
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
          )}
        </div>
      </div>

      {/* 2. Barra de Filtros por Categoría */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
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

        {/* Acceso directo a semanas del mes activo (Filtro rápido semanal) */}
        {!isMobile && vistaCalendario === 'MES' && (
          <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-400">
            <span className="font-bold uppercase tracking-wider text-slate-500 mr-1">Saltar a:</span>
            {semanasDelMes.map((s) => (
              <button
                key={`jump-${s.numeroSemana}`}
                onClick={() => agrandarSemana(s.fechaInicio)}
                className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-400 border border-slate-700/60 transition-all font-mono"
                title={`Agrandar semana del ${s.formattedRange}`}
              >
                {s.formattedRange}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Área de Contenido Principal (Agenda Móvil, Vista Semanal Agrandada, o Cuadrícula Mensual) */}
      {isMobile ? (
        /* Vista de Agenda optimizada para móviles */
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
      ) : vistaCalendario === 'SEMANA' ? (
        /* Vista Agrandada Semanal (Opción A: Zoom de Pantalla Completa en 7 Columnas) */
        <WeekExpandedView
          elementos={elementosFiltrados}
          onDayClick={onDayClick}
          onItemClick={onItemClick}
        />
      ) : (
        /* Vista Mensual con Botón de Zoom en el lateral izquierdo de cada fila */
        <>
          {/* Fila de Encabezados de Columna (ZOOM + LUN a DOM) */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] bg-slate-900/30 border-b border-slate-800/60 text-center py-2.5">
            <span
              className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-center border-r border-slate-800/40"
              title="Columna de botones de zoom semanal"
            >
              ZOOM
            </span>
            {DIAS_SEMANA.map((dia) => (
              <span key={dia} className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {dia}
              </span>
            ))}
          </div>

          {/* Cuadrícula de 6 Filas Semanales con Botón Agrandador a la Izquierda */}
          <div className="flex flex-col flex-1 divide-y divide-slate-900 bg-slate-950 min-h-[450px]">
            {semanasDelMes.map((week) => (
              <div
                key={`${week.numeroSemana}-${week.formattedRange}`}
                className="grid grid-cols-[56px_repeat(7,1fr)] divide-x divide-slate-900 group/row hover:bg-slate-900/20 transition-colors"
              >
                {/* BOTÓN LATERAL IZQUIERDO: Agrandador / Zoom de la Semana */}
                <button
                  onClick={() => agrandarSemana(week.fechaInicio)}
                  className="p-1.5 flex flex-col items-center justify-center gap-1 bg-slate-900/40 hover:bg-indigo-600/30 text-slate-400 hover:text-indigo-200 transition-all border-r border-slate-800/50 group/zoom cursor-pointer active:scale-95"
                  title={`🔍 Agrandar semana ${week.numeroSemana} (${week.formattedRange})`}
                >
                  <span className="text-sm group-hover/zoom:scale-125 transition-transform" role="img" aria-label="Agrandar semana">
                    🔍
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-tight text-slate-400 group-hover/zoom:text-indigo-300">
                    S{week.numeroSemana}
                  </span>
                  <span className="text-[8px] text-slate-500 group-hover/zoom:text-slate-300 text-center leading-none hidden xl:block font-medium">
                    {week.formattedRange}
                  </span>
                </button>

                {/* Los 7 días de la semana actual */}
                {week.days.map((day, idx) => (
                  <div
                    key={`${day.formattedDate}-${idx}`}
                    onClick={() => onDayClick && onDayClick(day.formattedDate)}
                    className={`p-2 flex flex-col justify-between min-h-[80px] hover:bg-slate-900/20 transition cursor-pointer group/cell ${
                      day.isCurrentMonth ? 'bg-slate-950/10' : 'bg-slate-900/5 opacity-30'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          day.isToday
                            ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-extrabold shadow-lg scale-110'
                            : 'text-slate-400 group-hover/cell:text-white'
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

                    {/* Elementos comprimidos en la celda mensual */}
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
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
