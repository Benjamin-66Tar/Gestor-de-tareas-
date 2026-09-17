import React, { useMemo } from 'react';
import { useAuraState } from '../../context/AuraState';
import { EventTimelineBlock } from './EventTimelineBlock';
import { EventDrawer } from './EventDrawer';
import { EventStatus } from '../../domain/types';

export const EventsView: React.FC = () => {
  const {
    events,
    eventsLoading,
    eventsError,
    eventFilter,
    setEventFilter,
    eventDrawerOpen,
    setEventDrawerOpen,
    editingEvent,
    openNewEventDrawer,
    openEditEventDrawer,
    eventsByTimeBlock,
    fetchEventsList,
  } = useAuraState();

  // Extract unique categories from current events
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    events.forEach((e) => {
      if (e.category) cats.add(e.category);
    });
    return Array.from(cats);
  }, [events]);

  // Overall metrics calculation
  const totalEvents = events.length;
  const completedCount = events.filter((e) => e.status === 'COMPLETED').length;
  const todayCount = eventsByTimeBlock.TODAY.length;
  const thisWeekCount = eventsByTimeBlock.THIS_WEEK.length;
  const upcomingCount = eventsByTimeBlock.UPCOMING.length;

  const totalFilteredCount =
    eventsByTimeBlock.TODAY.length +
    eventsByTimeBlock.THIS_WEEK.length +
    eventsByTimeBlock.UPCOMING.length +
    eventsByTimeBlock.PAST.length;

  const hasActiveFilters =
    eventFilter.status !== 'ALL' ||
    eventFilter.category !== 'ALL' ||
    eventFilter.searchQuery.trim() !== '';

  const clearFilters = () => {
    setEventFilter({
      status: 'ALL',
      category: 'ALL',
      searchQuery: '',
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Quick Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800 backdrop-blur-sm shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">
              Agenda de Eventos & Reuniones
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervisa convocatorias, reuniones y compromisos temporales sincronizados con tu calendario.
          </p>
        </div>

        {/* Global Stats Counter */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
              Total
            </span>
            <span className="text-base font-extrabold text-slate-100">{totalEvents}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-amber-400 block text-[10px] uppercase font-bold tracking-wider">
              Hoy
            </span>
            <span className="text-base font-extrabold text-amber-300">{todayCount}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-indigo-400 block text-[10px] uppercase font-bold tracking-wider">
              Esta semana
            </span>
            <span className="text-base font-extrabold text-indigo-300">{thisWeekCount}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-sky-400 block text-[10px] uppercase font-bold tracking-wider">
              Próximos
            </span>
            <span className="text-base font-extrabold text-sky-300">{upcomingCount}</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-emerald-400 block text-[10px] uppercase font-bold tracking-wider">
              Completados
            </span>
            <span className="text-base font-extrabold text-emerald-300">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Lifecycle filters, Category pills, and + Nuevo Evento CTA */}
      <div className="flex flex-col gap-4 bg-slate-900/40 p-4 rounded-3xl border border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Instant Search Bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-2.5 text-xs text-slate-500">🔍</span>
            <input
              type="text"
              value={eventFilter.searchQuery}
              onChange={(e) =>
                setEventFilter((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              placeholder="Buscar por título, descripción o ubicación..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            />
            {eventFilter.searchQuery && (
              <button
                onClick={() => setEventFilter((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action CTA Button */}
          <button
            onClick={openNewEventDrawer}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 transition active:scale-95 shrink-0"
          >
            <span>+</span>
            <span>Nuevo Evento</span>
          </button>
        </div>

        {/* Filter Pills: Status & Categories */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/40">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-1">
              Estado:
            </span>
            {(
              [
                { value: 'ALL', label: 'Todos' },
                { value: 'PROGRAMMED', label: 'Programados' },
                { value: 'COMPLETED', label: 'Completados' },
                { value: 'CANCELED', label: 'Cancelados' },
              ] as { value: 'ALL' | EventStatus; label: string }[]
            ).map((st) => {
              const isSelected = eventFilter.status === st.value;
              return (
                <button
                  key={st.value}
                  onClick={() => setEventFilter((prev) => ({ ...prev, status: st.value }))}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-1">
              Categoría:
            </span>
            <button
              onClick={() => setEventFilter((prev) => ({ ...prev, category: 'ALL' }))}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                eventFilter.category === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Todas
            </button>
            {availableCategories.map((cat) => {
              const isSelected = eventFilter.category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setEventFilter((prev) => ({ ...prev, category: cat }))}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 ml-2 transition"
              >
                Limpiar filtros ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {eventsLoading && events.length === 0 && (
        <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-3xl border border-slate-800 animate-pulse">
          <span className="text-3xl block mb-2">⏳</span>
          <p className="text-xs font-bold">Cargando eventos de la agenda...</p>
        </div>
      )}

      {eventsError && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-2xl flex items-center justify-between gap-4 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{eventsError}</span>
          </div>
          <button
            onClick={() => fetchEventsList()}
            className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-white font-bold rounded-lg transition"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Dynamic Time-Block Sections */}
      {!eventsLoading && totalFilteredCount === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 rounded-3xl border border-slate-800 space-y-3">
          <span className="text-4xl block">🔍</span>
          <h3 className="text-lg font-bold text-slate-200">No se encontraron eventos</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No hay eventos que coincidan con los filtros aplicados. Intenta restablecer los filtros de búsqueda.'
              : 'Aún no tienes eventos programados. Comienza agregando tu primera reunión o actividad.'}
          </p>
          <div className="pt-2">
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                Restablecer filtros
              </button>
            ) : (
              <button
                onClick={openNewEventDrawer}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl transition shadow-lg shadow-indigo-600/25"
              >
                + Crear primer evento
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Hoy */}
          <EventTimelineBlock
            blockKey="TODAY"
            title="Hoy"
            subtitle="Eventos programados para el transcurso del día de hoy"
            icon="⚡"
            events={eventsByTimeBlock.TODAY}
            onEditEvent={openEditEventDrawer}
            defaultExpanded={true}
          />

          {/* 2. Esta semana */}
          <EventTimelineBlock
            blockKey="THIS_WEEK"
            title="Esta semana"
            subtitle="Eventos programados para los próximos días de la semana actual"
            icon="📆"
            events={eventsByTimeBlock.THIS_WEEK}
            onEditEvent={openEditEventDrawer}
            defaultExpanded={true}
          />

          {/* 3. Próximos */}
          <EventTimelineBlock
            blockKey="UPCOMING"
            title="Próximos"
            subtitle="Convocatorias y actividades programadas a futuro"
            icon="🚀"
            events={eventsByTimeBlock.UPCOMING}
            onEditEvent={openEditEventDrawer}
            defaultExpanded={true}
          />

          {/* 4. Pasados */}
          <EventTimelineBlock
            blockKey="PAST"
            title="Pasados"
            subtitle="Eventos y reuniones cuyo horario ha concluido"
            icon="📜"
            events={eventsByTimeBlock.PAST}
            onEditEvent={openEditEventDrawer}
            defaultExpanded={false}
          />
        </div>
      )}

      {/* Slide-over Drawer for Event Creation & Editing */}
      <EventDrawer
        isOpen={eventDrawerOpen}
        onClose={() => setEventDrawerOpen(false)}
        eventToEdit={editingEvent}
      />
    </div>
  );
};
