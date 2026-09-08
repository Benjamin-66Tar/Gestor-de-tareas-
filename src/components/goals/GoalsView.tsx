import React, { useState, useMemo } from 'react';
import { useAuraState } from '../../context/AuraState';
import { GoalCard } from './GoalCard';
import { GoalTable } from './GoalTable';
import { GoalDrawer } from './GoalDrawer';
import { Goal } from '../../domain/types';

export const GoalsView: React.FC = () => {
  const {
    goals,
    goalsLoading,
    goalsError,
    goalViewMode,
    setGoalViewMode,
    goalFilter,
    setGoalFilter,
    drawerOpen,
    setDrawerOpen,
    editingGoal,
    setEditingGoal,
  } = useAuraState();

  const [searchLocal, setSearchLocal] = useState('');

  const openCreateDrawer = () => {
    setEditingGoal(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (goal: Goal) => {
    setEditingGoal(goal);
    setDrawerOpen(true);
  };

  // Extract unique categories from current goals
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    goals.forEach(g => {
      if (g.category) cats.add(g.category);
    });
    return Array.from(cats);
  }, [goals]);

  // Client-side filtering for ultra-fast responsiveness (<50ms)
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      // Status filter
      if (goalFilter.status !== 'ALL' && g.status !== goalFilter.status) {
        return false;
      }
      // Category filter
      if (goalFilter.category !== 'ALL' && g.category !== goalFilter.category) {
        return false;
      }
      // Search filter
      if (searchLocal.trim()) {
        const query = searchLocal.toLowerCase();
        const matchesTitle = g.title.toLowerCase().includes(query);
        const matchesDesc = g.description?.toLowerCase().includes(query);
        const matchesCat = g.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [goals, goalFilter, searchLocal]);

  // Overall metrics calculation
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
  const activeGoals = goals.filter(g => g.status === 'ACTIVE').length;
  const avgProgress = totalGoals > 0
    ? Math.round(
        goals.reduce((acc, g) => {
          const p = typeof g.progressPercentage === 'number'
            ? g.progressPercentage
            : (typeof (g as any).progress_percentage === 'number' ? (g as any).progress_percentage : 0);
          return acc + p;
        }, 0) / totalGoals
      )
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Quick Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800 backdrop-blur-sm shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">
              Panel de Objetivos Estratégicos
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervisa metas cuantitativas, ponderación de hitos y progreso en tiempo real.
          </p>
        </div>

        {/* Global Stats Counter */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Activas</span>
            <span className="text-sm font-black text-emerald-400">{activeGoals}</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Cumplidas</span>
            <span className="text-sm font-black text-indigo-400">{completedGoals}</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Avance Promedio</span>
            <span className="text-sm font-black text-pink-400">{avgProgress}%</span>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={openCreateDrawer}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all duration-150 transform hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap"
        >
          <span className="text-sm font-black">+</span> Nuevo Objetivo
        </button>
      </div>

      {/* Controls Bar: Search, Filters & View Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        {/* Search & Category filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-2.5 text-xs text-slate-500">🔍</span>
            <input
              type="text"
              value={searchLocal}
              onChange={(e) => setSearchLocal(e.target.value)}
              placeholder="Buscar meta o categoría..."
              className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'ACTIVE', label: 'Activas' },
              { id: 'COMPLETED', label: 'Completadas' },
              { id: 'PAUSED', label: 'En pausa' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setGoalFilter(prev => ({ ...prev, status: st.id as any }))}
                className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
                  goalFilter.status === st.id
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          {availableCategories.length > 0 && (
            <select
              value={goalFilter.category}
              onChange={(e) => setGoalFilter(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todas las Categorías</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>

        {/* View Mode Switcher (Cards vs List) */}
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">Vista:</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setGoalViewMode('CARDS')}
              title="Vista de cuadrícula de tarjetas"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                goalViewMode === 'CARDS'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>▦</span> Tarjetas
            </button>
            <button
              onClick={() => setGoalViewMode('LIST')}
              title="Vista de tabla / lista compacta"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                goalViewMode === 'LIST'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>☰</span> Lista
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {goalsLoading ? (
        <div className="p-12 text-center text-slate-400 animate-pulse text-sm">
          Cargando objetivos...
        </div>
      ) : goalsError ? (
        <div className="p-8 text-center text-rose-400 text-xs bg-rose-950/20 rounded-2xl border border-rose-900/40">
          {goalsError}
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 text-slate-400 space-y-3">
          <span className="text-4xl block">🎯</span>
          <h3 className="text-base font-bold text-slate-200">No se encontraron objetivos</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchLocal || goalFilter.status !== 'ALL' || goalFilter.category !== 'ALL'
              ? 'Prueba modificando tus filtros o término de búsqueda.'
              : 'Empieza definiendo tu primera meta estratégica con sus hitos clave.'}
          </p>
          <button
            onClick={openCreateDrawer}
            className="mt-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-xs font-bold transition"
          >
            Crear primer objetivo
          </button>
        </div>
      ) : goalViewMode === 'CARDS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEditDrawer}
            />
          ))}
        </div>
      ) : (
        <GoalTable
          goals={filteredGoals}
          onEdit={openEditDrawer}
        />
      )}

      {/* Slide-over Drawer for Create / Edit */}
      <GoalDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        goalToEdit={editingGoal}
      />
    </div>
  );
};
