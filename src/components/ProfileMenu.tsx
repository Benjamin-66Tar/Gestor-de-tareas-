import React, { useEffect, useRef } from 'react';
import { useAuraState } from '../context/AuraState';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useAuraState();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const username = userProfile?.username || 'AuraUser';
  const email = userProfile?.email || 'user@aura.app';

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-14 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-100 animate-fadeIn"
    >
      <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-black text-white shadow-md">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-sm text-slate-100 truncate">{username}</h4>
          <p className="text-xs text-slate-400 truncate">{email}</p>
        </div>
      </div>

      <div className="p-2 divide-y divide-slate-800/60">
        <div className="py-1">
          <button
            onClick={() => {
              alert('Perfil de usuario Aura');
              onClose();
            }}
            className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition flex items-center gap-2"
          >
            <span>👤</span> Mi Perfil
          </button>
          <button
            onClick={() => {
              alert('Ajustes de Tema y Notificaciones');
              onClose();
            }}
            className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition flex items-center gap-2"
          >
            <span>⚙️</span> Ajustes & Apariencia
          </button>
        </div>

        <div className="py-1">
          <button
            onClick={() => {
              alert('Sesión cerrada.');
              onClose();
            }}
            className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-xl transition flex items-center gap-2"
          >
            <span>🚪</span> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};
