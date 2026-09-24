import React, { useState } from 'react';
import { AuraProvider, useAuraState } from './context/AuraState';
import { PlanElemento } from './domain/types';
import { Navbar } from './components/Navbar';
import { TabBar } from './components/TabBar';
import { CalendarGrid } from './components/CalendarGrid';
import { GoalsView } from './components/goals/GoalsView';
import { ProjectsView } from './components/projects/ProjectsView';
import { EventsView } from './components/events/EventsView';
import { ElementoModal } from './components/ElementoModal';
import { AuthView } from './components/auth/AuthView';

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

      {/* 4. Eventos (Agenda & Convocatorias) */}
      {tabActiva === 'EVENTOS' && (
        <section className="animate-fadeIn max-w-7xl mx-auto">
          <EventsView />
        </section>
      )}
    </main>
  );
};

// Main Application Navigation Shell
const AppShell: React.FC = () => {
  const { isAuthenticated, hasEnteredApp } = useAuraState();

  if (!isAuthenticated || !hasEnteredApp) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-pink-500 selection:text-white animate-fadeIn">
      <Navbar />
      <TabBar />
      <ContenidoPrincipal />
    </div>
  );
};

// Root Application Shell
const App: React.FC = () => {
  return (
    <AuraProvider>
      <AppShell />
    </AuraProvider>
  );
};

export default App;
