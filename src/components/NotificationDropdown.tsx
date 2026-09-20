import React, { useEffect, useRef, useState } from 'react';
import { useAuraState } from '../context/AuraState';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead } = useAuraState();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [testSent, setTestSent] = useState(false);

  const {
    status,
    isIOS,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
    clearError,
  } = usePushNotifications();

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

  const handleTestDispatch = async () => {
    const res = await sendTestNotification();
    if (res) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-14 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-100 animate-fadeIn"
    >
      {/* Header */}
      <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-base">🔔</span>
          <h3 className="font-bold text-sm tracking-wide">Notificaciones</h3>
        </div>
        <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
          {notifications.filter(n => !n.isRead).length} nuevas
        </span>
      </div>

      {/* Web Push / Device Alerts Control Banner */}
      <div className="p-3 bg-slate-950/70 border-b border-slate-800/90 text-xs">
        {/* Error message */}
        {error && (
          <div className="mb-2 p-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 flex justify-between items-center text-[11px]">
            <span>{error}</span>
            <button onClick={clearError} className="text-rose-400 font-bold ml-1 hover:text-rose-200">✕</button>
          </div>
        )}

        {/* Test alert success message */}
        {testSent && (
          <div className="mb-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[11px]">
            ✓ Alerta push de prueba enviada al dispositivo.
          </div>
        )}

        {/* iOS PWA Onboarding Helper */}
        {isIOS && !status.isStandalone && (
          <div className="mb-2 p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-0.5">
              <span>📱</span>
              <span>Requerido en iOS (iPhone/iPad):</span>
            </div>
            Para recibir alertas en segundo plano, pulsa Compartir (<span className="font-mono">⎋</span>) y selecciona <strong>"Agregar a Inicio"</strong>. Abre Aura desde el icono instalado para activarlas.
          </div>
        )}

        {/* Status: Browser Not Supported */}
        {!status.isSupported ? (
          <div className="text-slate-500 text-[11px] italic">
            Tu navegador actual no soporta alertas Web Push en segundo plano.
          </div>
        ) : status.permission === 'denied' ? (
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-[11px]">
            ⚠️ Permiso bloqueado en el navegador. Actívalo en los permisos del sitio para recibir alertas.
          </div>
        ) : status.isSubscribed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Alertas activas en este equipo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={isLoading}
                onClick={handleTestDispatch}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded-lg border border-slate-700 transition"
              >
                Probar
              </button>
              <button
                disabled={isLoading}
                onClick={unsubscribe}
                className="px-2 py-1 text-slate-400 hover:text-rose-400 text-[11px] transition"
              >
                Desactivar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <button
              disabled={isLoading}
              onClick={subscribe}
              className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>🔔</span>
              <span>{isLoading ? 'Activando...' : 'Activar alertas en este dispositivo'}</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Avisos 15 min antes de eventos y deadlines de tareas.
            </p>
          </div>
        )}
      </div>

      {/* In-app Notification List */}
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

      {/* Footer */}
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

