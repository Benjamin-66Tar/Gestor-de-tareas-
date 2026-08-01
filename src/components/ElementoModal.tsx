import React, { useState, useEffect } from 'react';
import { useAuraState } from '../context/AuraState';
import { PlanElemento } from '../domain/types';

interface ElementoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDateStr?: string; // Format YYYY-MM-DD
  editingItem?: PlanElemento | null;
}

const TIPO_OPTIONS = [
  { value: 'ACTIVIDAD', label: 'Actividad' },
  { value: 'EVENTO', label: 'Evento' },
  { value: 'OBJETIVO', label: 'Objetivo' },
  { value: 'PROYECTO', label: 'Proyecto' }
];

const PRESET_COLORS = [
  '#FBBF24', // Amber / Calendario
  '#34D399', // Emerald / Objetivos
  '#22D3EE', // Cyan / Proyectos
  '#F87171', // Rose / Eventos
  '#818CF8', // Indigo / Neutral
  '#EC4899'  // Pink / Custom
];

export const ElementoModal: React.FC<ElementoModalProps> = ({
  isOpen,
  onClose,
  selectedDateStr,
  editingItem
}) => {
  const { crearElemento, actualizarElemento, eliminarElemento } = useAuraState();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<'OBJETIVO' | 'PROYECTO' | 'EVENTO' | 'ACTIVIDAD'>('ACTIVIDAD');
  const [colorHex, setColorHex] = useState(PRESET_COLORS[0]);
  const [guardando, setGuardando] = useState(false);

  // Synchronize modal state with editing item or creation defaults
  useEffect(() => {
    if (editingItem) {
      setTitulo(editingItem.titulo);
      setDescripcion(editingItem.descripcion || '');
      setTipo(editingItem.tipo);
      setColorHex(editingItem.color_hex);
    } else {
      setTitulo('');
      setDescripcion('');
      setTipo('ACTIVIDAD');
      setColorHex(PRESET_COLORS[0]);
    }
  }, [editingItem, isOpen]);

  // Adjust color based on type default choice for better UX
  useEffect(() => {
    if (!editingItem) {
      if (tipo === 'OBJETIVO') setColorHex('#34D399');
      else if (tipo === 'PROYECTO') setColorHex('#22D3EE');
      else if (tipo === 'EVENTO') setColorHex('#F87171');
      else setColorHex('#FBBF24');
    }
  }, [tipo, editingItem]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setGuardando(true);

    // Format deadline date to full ISO (e.g. YYYY-MM-DD + time of day)
    let fechaLimiteISO: string | undefined = undefined;
    if (editingItem) {
      fechaLimiteISO = editingItem.fecha_limite;
    } else if (selectedDateStr) {
      // Set to midday to avoid timezone shifts
      fechaLimiteISO = `${selectedDateStr}T12:00:00Z`;
    }

    const itemPayload = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      tipo,
      color_hex: colorHex,
      fecha_limite: fechaLimiteISO
    };

    let exito = false;
    if (editingItem) {
      exito = await actualizarElemento(editingItem.id, itemPayload);
    } else {
      exito = await crearElemento(itemPayload);
    }

    setGuardando(false);
    if (exito) {
      onClose();
    } else {
      alert('Hubo un error al guardar. Verifica la conexión con el servidor backend.');
    }
  };

  const handleEliminar = async () => {
    if (!editingItem) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este elemento del calendario?')) {
      setGuardando(true);
      const exito = await eliminarElemento(editingItem.id);
      setGuardando(false);
      if (exito) {
        onClose();
      } else {
        alert('Hubo un error al eliminar el elemento.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-all">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900/60 border-b border-slate-800/80">
          <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-indigo-400">
            {editingItem ? 'Editar Elemento de Aura' : 'Crear Nuevo Elemento'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all text-xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Título
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Revisión de Arquitectura"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Descripción
            </label>
            <textarea
              placeholder="Detalles sobre esta tarea o evento..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none transition-all"
              >
                {TIPO_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Fecha Límite
              </label>
              <input
                type="text"
                disabled
                value={selectedDateStr || (editingItem?.fecha_limite ? editingItem.fecha_limite.split('T')[0] : '')}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-500 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Identificador Visual (Color)
            </label>
            <div className="flex gap-2.5">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorHex(color)}
                  style={{ backgroundColor: color }}
                  className={`w-8 h-8 rounded-full transition-transform active:scale-95 ${
                    colorHex === color ? 'ring-4 ring-indigo-500/50 scale-110 shadow-lg' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
            {editingItem ? (
              <button
                type="button"
                onClick={handleEliminar}
                disabled={guardando}
                className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/30 hover:border-rose-500/60 text-rose-400 hover:text-white text-sm font-semibold rounded-lg transition active:scale-95 disabled:opacity-50"
              >
                Eliminar
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold rounded-lg transition active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || !titulo.trim()}
                className="px-5 py-2 bg-gradient-to-tr from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-500/15"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
