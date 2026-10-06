import React, { useMemo } from 'react';
import { useAuraState } from '../../context/AuraState';
import { ProgressMatrixRow } from '../../domain/types';

/**
 * Componente ActivityProgressMatrix (Fase 2 - US11):
 * 
 * Matriz y tabla centralizada de hábitos y progreso de actividades de Aprendizaje.
 * Incluye:
 * - Cuadrícula Lunes a Domingo con indicador del día de hoy.
 * - Navegador de semanas (← Semana Anterior, Hoy, Semana Siguiente →).
 * - Orden prioritario: items pendientes de realizar hoy anclados arriba,
 *   seguidos por completados ordenados por racha activa (🔥).
 * - Botón de avance en 1-clic [ + Avanzar tema ] con respuesta optimista <50ms.
 * - Barra de búsqueda integrada y estado de carga.
 */
export const ActivityProgressMatrix: React.FC = () => {
  const {
    matrixRows,
    matrixLoading,
    matrixWeekOffset,
    setMatrixWeekOffset,
    matrixSearch,
    setMatrixSearch,
    fetchProgressMatrix,
    advanceMatrixItem,
    toggleCheckIn,
    openLearningDrawer,
  } = useAuraState();

  // Filtrado y ordenamiento prioritario:
  // 1. No realizados hoy primero (!isCheckedToday)
  // 2. Realizados hoy después, ordenados de mayor racha a menor
  const sortedRows = useMemo(() => {
    return [...matrixRows].sort((a, b) => {
      // 1. Pendientes hoy primero
      if (!a.isCheckedToday && b.isCheckedToday) return -1;
      if (a.isCheckedToday && !b.isCheckedToday) return 1;

      // 2. Mayor racha primero
      if (b.currentStreak !== a.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }

      // 3. Menor porcentaje de progreso primero (para empujar lo que necesita foco)
      return a.progressPercentage - b.progressPercentage;
    });
  }, [matrixRows]);

  const handlePrevWeek = () => {
    const newOffset = matrixWeekOffset - 1;
    setMatrixWeekOffset(newOffset);
    fetchProgressMatrix(newOffset, matrixSearch);
  };

  const handleNextWeek = () => {
    const newOffset = matrixWeekOffset + 1;
    setMatrixWeekOffset(newOffset);
    fetchProgressMatrix(newOffset, matrixSearch);
  };

  const handleCurrentWeek = () => {
    setMatrixWeekOffset(0);
    fetchProgressMatrix(0, matrixSearch);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMatrixSearch(val);
    fetchProgressMatrix(matrixWeekOffset, val);
  };

  const handleDayClick = (row: ProgressMatrixRow, dayDate: string) => {
    if (row.itemType === 'LEARNING') {
      toggleCheckIn({ learningItemId: row.id, date: dayDate });
    } else {
      toggleCheckIn({ eventItemId: row.id, date: dayDate });
    }
  };

  // Obtener encabezados de días a partir de la primera fila si existe
  const sampleWeek = matrixRows[0]?.weeklyAttendance || [];

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-sm space-y-5 animate-fadeIn">
      {/* 1. Barra de Control: Título, Stepper de Semanas y Buscador */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h3 className="text-lg font-black text-slate-100 tracking-tight">
              Matriz de Progreso y Hábitos
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {matrixRows.length} {matrixRows.length === 1 ? 'actividad' : 'actividades'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Seguimiento de asistencia semanal y avance temático en 1-clic.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
          {/* Buscador en vivo */}
          <div className="relative">
            <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-500 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Filtrar actividad..."
              value={matrixSearch}
              onChange={handleSearchChange}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition w-36 sm:w-48"
            />
          </div>

          {/* Stepper de Semanas */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handlePrevWeek}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition font-bold"
              title="Semana anterior"
            >
              &larr;
            </button>
            <button
              onClick={handleCurrentWeek}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                matrixWeekOffset === 0
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Semana actual"
            >
              {matrixWeekOffset === 0
                ? 'Esta semana'
                : matrixWeekOffset > 0
                ? `+${matrixWeekOffset} sem`
                : `${matrixWeekOffset} sem`}
            </button>
            <button
              onClick={handleNextWeek}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition font-bold"
              title="Semana siguiente"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 2. Tabla / Cuadrícula de Progreso */}
      {matrixLoading && matrixRows.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Cargando matriz de progreso...</p>
        </div>
      ) : sortedRows.length === 0 ? (
        <div className="py-14 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
          <span className="text-3xl block">📖</span>
          <p className="text-sm font-bold text-slate-200">
            {matrixSearch ? 'No se encontraron actividades con ese criterio' : 'Sin actividades de aprendizaje activas'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Crea un nuevo curso o programa una sesión de estudio para visualizar aquí tu constancia y avanzar temas.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-3 w-72">Actividad / Recurso</th>
                <th className="py-3 px-2 text-center w-24">Racha</th>
                {/* 7 Columnas de Asistencia (L a D) */}
                {sampleWeek.length > 0 ? (
                  sampleWeek.map((day) => (
                    <th
                      key={day.date}
                      className={`py-3 px-2 text-center w-12 ${
                        day.isToday ? 'text-purple-300 bg-purple-500/10 rounded-t-lg' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{day.dayLetter}</span>
                        <span className="text-[9px] font-normal text-slate-500">
                          {day.date.slice(8, 10)}
                        </span>
                      </div>
                    </th>
                  ))
                ) : (
                  ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                    <th key={d} className="py-3 px-2 text-center w-12">{d}</th>
                  ))
                )}
                <th className="py-3 px-3 w-48 text-center">Progreso</th>
                <th className="py-3 px-3 text-right w-44">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {sortedRows.map((row) => {
                const colorHex = row.colorHex || '#8B5CF6';

                return (
                  <tr
                    key={row.id}
                    className={`group hover:bg-slate-850/60 transition-colors ${
                      !row.isCheckedToday
                        ? 'bg-purple-950/10'
                        : ''
                    }`}
                  >
                    {/* Columna: Nombre del recurso & Plataforma */}
                    <td className="py-3 px-3">
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm"
                          style={{ backgroundColor: colorHex }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              onClick={() => {
                                if (row.rawLearningItem) {
                                  openLearningDrawer(row.rawLearningItem);
                                }
                              }}
                              className="font-bold text-slate-100 hover:text-purple-300 transition cursor-pointer truncate max-w-[220px]"
                              title={row.title}
                            >
                              {row.title}
                            </span>
                            {row.platformName && (
                              <span className="px-1.5 py-0.2 text-[9px] font-medium rounded bg-slate-800 text-slate-400">
                                {row.platformName}
                              </span>
                            )}
                          </div>
                          {row.nextTopicTitle && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5" title={row.nextTopicTitle}>
                              Próximo: <span className="text-slate-300 font-medium">{row.nextTopicTitle}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Columna: Racha 🔥 */}
                    <td className="py-3 px-2 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <span>🔥</span>
                        <span>{row.currentStreak}</span>
                      </div>
                    </td>

                    {/* 7 Columnas: Lunes a Domingo */}
                    {row.weeklyAttendance.map((day) => {
                      return (
                        <td
                          key={day.date}
                          className={`py-3 px-2 text-center ${
                            day.isToday ? 'bg-purple-500/5' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleDayClick(row, day.date)}
                            className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center transition-all duration-150 transform active:scale-90 ${
                              day.isChecked
                                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                                : day.isToday
                                ? 'border-2 border-dashed border-purple-400/80 hover:bg-purple-500/20 text-purple-300'
                                : 'border border-slate-800 hover:border-slate-700 text-slate-600'
                            }`}
                            title={`${day.date}: ${day.isChecked ? 'Realizado' : 'Pendiente'}`}
                          >
                            {day.isChecked ? (
                              <span className="text-[11px] font-black leading-none">✓</span>
                            ) : day.isToday ? (
                              <span className="text-[10px] font-bold leading-none text-purple-400">+</span>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                            )}
                          </button>
                        </td>
                      );
                    })}

                    {/* Columna: Progreso */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col gap-1 w-full max-w-[140px] mx-auto">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-400">
                            {row.currentUnit ?? 0}/{row.totalUnits ?? 0}
                          </span>
                          <span className="text-purple-300 font-extrabold">
                            {row.progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, row.progressPercentage))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Columna: Acción rápida (1-clic avanzar tema) */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => advanceMatrixItem(row.id)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-extrabold text-[11px] rounded-xl shadow-md shadow-purple-600/20 transition inline-flex items-center gap-1.5 whitespace-nowrap"
                        title="Avanzar automáticamente el siguiente tema o sumar +1 unidad (<50ms)"
                      >
                        <span className="text-xs">+</span>
                        <span>Avanzar tema</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
