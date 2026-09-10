import React, { useState } from 'react';
import { AuraProvider, useAuraState } from './context/AuraState';
import { PlanElemento } from './domain/types';
import { Navbar } from './components/Navbar';
import { TabBar } from './components/TabBar';
import { CalendarGrid } from './components/CalendarGrid';
import { GoalsView } from './components/goals/GoalsView';
import { ProjectsView } from './components/projects/ProjectsView';
import { ElementoModal } from './components/ElementoModal';

// Dynamic viewport content router based on active tab
const ContenidoPrincipal: React.FC = () => {
  const { tabActiva } = useAuraState();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<string | undefined>(undefined);
  const [editingItem, setEditingItem] = useState<PlanElemento | null>(null);

  const handleDayClick = (dateStr: string, endDateStr?: string) => {
    setSelectedDate(dateStr);
    setSelectedEndDate(endDateStr);
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleItemClick = (item: PlanElemento) => {
    setSelectedDate(undefined);
    setSelectedEndDate(undefined);
    setEditingItem(item);
    setModalOpen(true);
  };

  return (
    <main className="p-4 sm:p-6 flex-1 bg-slate-950 text-slate-100 min-h-[calc(100vh-125px)]">
      {/* 1. Calendario */}
      {tabActiva === 'CALENDARIO' && (
        <section className="animate-fadeIn">
          <CalendarGrid onDayClick={handleDayClick} onItemClick={handleItemClick} />
          <ElementoModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            selectedDateStr={selectedDate}
            selectedEndDateStr={selectedEndDate}
            editingItem={editingItem}
          />
        </section>
      )}

      {/* 2. Objetivos (Estratégicos & Hitos) */}
      {tabActiva === 'OBJETIVOS' && (
        <section className="animate-fadeIn max-w-7xl mx-auto">
          <GoalsView />
        </section>
      )}

      {/* 3. Proyectos (Hub & Espacio de Trabajo) */}
      {tabActiva === 'PROYECTOS' && (
        <section className="animate-fadeIn max-w-7xl mx-auto">
          <ProjectsView />
        </section>
      )}

      {/* 4. Eventos (Placeholder de Sección) */}
      {tabActiva === 'EVENTOS' && (
        <section className="animate-fadeIn p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <span className="text-4xl block">🎉</span>
          <h2 className="text-xl font-bold text-rose-400">Próximos Eventos & Reuniones</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Visualiza convocatorias, reuniones sincronizadas y fechas clave de tu equipo.
          </p>
        </section>
      )}
    </main>
  );
};

// Root Application Shell
const App: React.FC = () => {
  return (
    <AuraProvider>
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
        <Navbar />
        <TabBar />
        <ContenidoPrincipal />
      </div>
    </AuraProvider>
  );
};

export default App;
