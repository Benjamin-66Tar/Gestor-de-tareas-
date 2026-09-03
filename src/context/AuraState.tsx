import React, { createContext, useState, useContext, useEffect } from 'react';
import { ElementoTipo, PlanElemento, VistaModoCalendario } from '../domain/types';
import { getGridDateRange } from '../utils/dateUtils';

/**
 * Propiedades del contexto global de Aura.
 * Incluye gestión de elementos (CRUD), navegación mensual y el nuevo estado
 * para el modo semanal / agrandador de semanas (Vista Semanal Dedicada).
 */
interface AuraContextProps {
  tabActiva: ElementoTipo;
  setTabActiva: (tab: ElementoTipo) => void;
  elementos: PlanElemento[];
  cargando: boolean;
  error: string | null;
  anioActivo: number;
  mesActivo: number;
  setAnioActivo: (year: number) => void;
  setMesActivo: (month: number) => void;
  
  // --- Estado del Modo Agrandador / Vista Semanal ---
  vistaCalendario: VistaModoCalendario;
  setVistaCalendario: (vista: VistaModoCalendario) => void;
  fechaSemanaSeleccionada: Date;
  setFechaSemanaSeleccionada: (fecha: Date) => void;
  agrandarSemana: (fechaReferencia: Date) => void;
  irSemanaAnterior: () => void;
  irSemanaSiguiente: () => void;

  // --- Operaciones Asíncronas ---
  fetchElementos: (start?: string, end?: string) => Promise<void>;
  crearElemento: (elemento: Omit<PlanElemento, 'id'>) => Promise<boolean>;
  actualizarElemento: (id: number, elemento: Partial<PlanElemento>) => Promise<boolean>;
  eliminarElemento: (id: number) => Promise<boolean>;
}

const AuraContext = createContext<AuraContextProps | undefined>(undefined);

const API_BASE = 'http://127.0.0.1:6001/api/v1/elementos/';

export const AuraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabActiva, setTabActiva] = useState<ElementoTipo>('CALENDARIO');
  const [elementos, setElementos] = useState<PlanElemento[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active calendar navigation
  const today = new Date();
  const [anioActivo, setAnioActivo] = useState<number>(today.getFullYear());
  const [mesActivo, setMesActivo] = useState<number>(today.getMonth()); // 0-11

  // --- Estado del Modo Agrandador / Vista Semanal ---
  // Permite alternar entre la cuadrícula de 42 días ('MES') y la semana ampliada ('SEMANA')
  const [vistaCalendario, setVistaCalendario] = useState<VistaModoCalendario>('MES');
  // Fecha ancla utilizada para determinar qué semana se está visualizando en modo ampliado
  const [fechaSemanaSeleccionada, setFechaSemanaSeleccionada] = useState<Date>(today);

  /**
   * Activa el modo 'Agrandador de Semana' (Zoom Semanal Dedicado) para la semana de la fecha recibida.
   * Sincroniza automáticamente anioActivo y mesActivo para asegurar la recarga de eventos del backend.
   */
  const agrandarSemana = (fechaReferencia: Date) => {
    setFechaSemanaSeleccionada(fechaReferencia);
    if (fechaReferencia.getFullYear() !== anioActivo) {
      setAnioActivo(fechaReferencia.getFullYear());
    }
    if (fechaReferencia.getMonth() !== mesActivo) {
      setMesActivo(fechaReferencia.getMonth());
    }
    setVistaCalendario('SEMANA');
  };

  /**
   * Desplaza la semana activa 7 días hacia atrás en el tiempo.
   * Si cambia de mes o año, actualiza mesActivo y anioActivo.
   */
  const irSemanaAnterior = () => {
    const nuevaFecha = new Date(
      fechaSemanaSeleccionada.getFullYear(),
      fechaSemanaSeleccionada.getMonth(),
      fechaSemanaSeleccionada.getDate() - 7
    );
    setFechaSemanaSeleccionada(nuevaFecha);
    if (nuevaFecha.getMonth() !== mesActivo || nuevaFecha.getFullYear() !== anioActivo) {
      setMesActivo(nuevaFecha.getMonth());
      setAnioActivo(nuevaFecha.getFullYear());
    }
  };

  /**
   * Desplaza la semana activa 7 días hacia adelante en el tiempo.
   * Si cambia de mes o año, actualiza mesActivo y anioActivo.
   */
  const irSemanaSiguiente = () => {
    const nuevaFecha = new Date(
      fechaSemanaSeleccionada.getFullYear(),
      fechaSemanaSeleccionada.getMonth(),
      fechaSemanaSeleccionada.getDate() + 7
    );
    setFechaSemanaSeleccionada(nuevaFecha);
    if (nuevaFecha.getMonth() !== mesActivo || nuevaFecha.getFullYear() !== anioActivo) {
      setMesActivo(nuevaFecha.getMonth());
      setAnioActivo(nuevaFecha.getFullYear());
    }
  };

  // Fetch items from the Django backend API
  const fetchElementos = async (start?: string, end?: string) => {
    setCargando(true);
    setError(null);
    try {
      let url = API_BASE;
      if (start && end) {
        url += `?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`;
      } else {
        // Fallback to active month grid date range
        const range = getGridDateRange(anioActivo, mesActivo);
        url += `?start_date=${encodeURIComponent(range.startStr)}&end_date=${encodeURIComponent(range.endStr)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.statusText}`);
      }
      const data = await response.json();
      setElementos(data);
    } catch (err: any) {
      console.error('Error al cargar elementos de Aura:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  // Trigger fetch when active year/month changes, or when active tab is Calendario
  useEffect(() => {
    if (tabActiva === 'CALENDARIO') {
      const range = getGridDateRange(anioActivo, mesActivo);
      fetchElementos(range.startStr, range.endStr);
    }
  }, [anioActivo, mesActivo, tabActiva]);

  // CRUD Operations
  const crearElemento = async (newEl: Omit<PlanElemento, 'id'>): Promise<boolean> => {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEl)
      });
      if (response.ok) {
        // Refetch to ensure cache updates and consistency
        const range = getGridDateRange(anioActivo, mesActivo);
        await fetchElementos(range.startStr, range.endStr);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al crear elemento:', err);
      return false;
    }
  };

  const actualizarElemento = async (id: number, updatedFields: Partial<PlanElemento>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (response.ok) {
        const range = getGridDateRange(anioActivo, mesActivo);
        await fetchElementos(range.startStr, range.endStr);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al actualizar elemento:', err);
      return false;
    }
  };

  const eliminarElemento = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}${id}/`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const range = getGridDateRange(anioActivo, mesActivo);
        await fetchElementos(range.startStr, range.endStr);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error al eliminar elemento:', err);
      return false;
    }
  };

  return (
    <AuraContext.Provider value={{
      tabActiva,
      setTabActiva,
      elementos,
      cargando,
      error,
      anioActivo,
      mesActivo,
      setAnioActivo,
      setMesActivo,
      // Propiedades de la vista semanal / agrandador de semanas
      vistaCalendario,
      setVistaCalendario,
      fechaSemanaSeleccionada,
      setFechaSemanaSeleccionada,
      agrandarSemana,
      irSemanaAnterior,
      irSemanaSiguiente,
      // Operaciones de datos
      fetchElementos,
      crearElemento,
      actualizarElemento,
      eliminarElemento
    }}>
      {children}
    </AuraContext.Provider>
  );
};

export const useAuraState = () => {
  const context = useContext(AuraContext);
  if (!context) throw new Error('useAuraState debe usarse dentro de un AuraProvider');
  return context;
};
