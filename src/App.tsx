import React from 'react';
import { AuraProvider, useAuraState } from './context/AuraState';
import { ElementoTipo } from './domain/types';

// Navbar Component
const Navbar: React.FC = () => (
  <header className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 text-white flex justify-between items-center shadow-md">
    <h1 className="text-2xl font-black tracking-wider drop-shadow-sm">Aura</h1>
    <div className="flex items-center gap-4">
      <button className="relative p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
        🔔 <span className="absolute top-0 right-0 bg-red-500 text-xs w-4 h-4 rounded-full flex items-center justify-center">3</span>
      </button>
      <div className="w-9 h-9 bg-white text-indigo-600 rounded-full flex items-center justify-center font-bold shadow-inner cursor-pointer">
        U
      </div>
    </div>
  </header>
);

// TabBar Component
const TabBar: React.FC = () => {
  const { tabActiva, setTabActiva } = useAuraState();
  const tabs: ElementoTipo[] = ['CALENDARIO', 'OBJETIVOS', 'PROYECTOS', 'EVENTOS'];

  const coloresTab: Record<ElementoTipo, string> = {
    CALENDARIO: 'bg-amber-400',
    OBJETIVOS: 'bg-emerald-400',
    PROYECTOS: 'bg-cyan-400',
    EVENTOS: 'bg-rose-400',
  };

  return (
    <nav className="flex bg-slate-900 p-2 gap-2 shadow-inner">
      {tabs.map((tab) => {
        const select = tabActiva === tab;
        return (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`flex-1 py-3 text-xs font-bold tracking-widest rounded-xl transition-all duration-200 transform ${
              select ? `${coloresTab[tab]} text-slate-950 scale-105 shadow-md` : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        );
      })}
    </nav>
  );
};

// Contenido Dinámico (Vistas Maquetadas)
const ContenidoPrincipal: React.FC = () => {
  const { tabActiva } = useAuraState();

  return (
    <main className="p-6 flex-1 bg-slate-950 text-slate-100 min-h-[calc(100vh-130px)]">
      {tabActiva === 'CALENDARIO' && (
        <div className="animate-fadeIn">
          <h2 className="text-xl font-bold text-amber-400 mb-4">Línea de Tiempo / Calendario</h2>
          <div className="border-l-4 border-amber-400 pl-4 space-y-4">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-sm">
              <span className="text-xs text-amber-400 font-mono">09:00 AM</span>
              <p className="font-semibold text-white">Revisión de Arquitectura del Sistema Aura</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 shadow-sm">
              <span className="text-xs text-amber-400 font-mono">03:00 PM</span>
              <p className="font-semibold text-white">Maquetación de Componentes React</p>
            </div>
          </div>
        </div>
      )}
      {tabActiva === 'OBJETIVOS' && <div className="text-emerald-400 text-lg font-bold animate-fadeIn">🎯 Panel de Objetivos Estratégicos</div>}
      {tabActiva === 'PROYECTOS' && <div className="text-cyan-400 text-lg font-bold animate-fadeIn">💻 Gestión de Espacios y Proyectos Activos</div>}
      {tabActiva === 'EVENTOS' && <div className="text-rose-400 text-lg font-bold animate-fadeIn">📅 Próximos Eventos y Fechas Clave</div>}
    </main>
  );
};

// Main App Container
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
