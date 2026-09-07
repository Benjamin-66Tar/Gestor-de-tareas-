import React, { useEffect, useRef } from 'react';
import { useAuraState } from '../context/AuraState';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead } = useAuraState();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-14 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-100 animate-fadeIn"
    >
      <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-base">🔔</span>
          <h3 className="font-bold text-sm tracking-wide">Notificaciones</h3>
        </div>
        <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
          {notifications.filter(n => !n.isRead).length} nuevas
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No tienes notificaciones pendientes.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markNotificationRead(notif.id)}
              className={`p-3.5 transition cursor-pointer hover:bg-slate-800/60 flex items-start justify-between gap-3 ${
                !notif.isRead ? 'bg-indigo-950/20' : 'opacity-70'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-pink-500 inline-block animate-pulse"></span>
                  )}
                  <h4 className="text-xs font-bold text-slate-200">{notif.title}</h4>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{notif.message}</p>
                <span className="text-[10px] text-slate-500 block">
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {!notif.isRead && (
                <button
                  title="Marcar como leída"
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationRead(notif.id);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 text-[11px] p-1 font-semibold whitespace-nowrap"
                >
                  ✓
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 bg-slate-950/60 border-t border-slate-800 text-center">
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-200 font-medium transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
