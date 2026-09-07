import React from 'react';
import { useAuraState } from '../context/AuraState';
import { ElementoTipo } from '../domain/types';

export const TabBar: React.FC = () => {
  const { tabActiva, setTabActiva } = useAuraState();

  const tabs: { type: ElementoTipo; label: string; icon: string; activeColor: string }[] = [
    { type: 'CALENDARIO', label: 'Calendario', icon: '📅', activeColor: 'bg-amber-400 text-slate-950 shadow-amber-400/25' },
    { type: 'OBJETIVOS', label: 'Objetivos', icon: '🎯', activeColor: 'bg-emerald-400 text-slate-950 shadow-emerald-400/25' },
    { type: 'PROYECTOS', label: 'Proyectos', icon: '💻', activeColor: 'bg-cyan-400 text-slate-950 shadow-cyan-400/25' },
    { type: 'EVENTOS', label: 'Eventos', icon: '🎉', activeColor: 'bg-rose-400 text-slate-950 shadow-rose-400/25' },
  ];

  return (
    <nav
      aria-label="Secciones de navegación principal"
      className="flex bg-slate-900 border-b border-slate-800 px-3 py-2 gap-2 overflow-x-auto no-scrollbar select-none"
    >
      {tabs.map((tab) => {
        const isSelected = tabActiva === tab.type;
        return (
          <button
            key={tab.type}
            onClick={() => setTabActiva(tab.type)}
            className={`flex-1 min-w-[110px] py-2.5 px-3 text-xs font-black tracking-wider uppercase rounded-xl transition-all duration-150 flex items-center justify-center gap-2 transform active:scale-95 ${
              isSelected
                ? `${tab.activeColor} shadow-md font-extrabold scale-[1.02]`
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
