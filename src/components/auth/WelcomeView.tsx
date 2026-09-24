import React from 'react';
import { useAuraState } from '../../context/AuraState';

export const WelcomeView: React.FC = () => {
  const { currentUser, userProfile, enterApp, switchAccount } = useAuraState();

  const displayName = currentUser?.username || userProfile?.username || 'Usuario';
  const displayEmail = currentUser?.email || userProfile?.email || '';
  const avatarUrl =
    userProfile?.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

  return (
    <div className="w-full max-w-md mx-auto p-8 sm:p-10 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl text-slate-100 flex flex-col items-center text-center animate-fadeIn">
      {/* User Avatar with radiant ambient ring */}
      <div className="relative mb-5 group">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur group-hover:opacity-100 transition duration-300" />
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/30 bg-slate-800 flex items-center justify-center shadow-xl">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initial if image fails
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <span className="text-3xl font-black text-white select-none absolute">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Greeting */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        ¡Hola de nuevo,{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-300">
          {displayName}
        </span>
        !
      </h2>
      {displayEmail && (
        <p className="mt-1 text-xs text-slate-400 font-mono tracking-wide">
          {displayEmail}
        </p>
      )}

      <p className="mt-4 text-sm text-slate-300 max-w-xs leading-relaxed">
        Tu espacio de trabajo está listo. Retoma tus proyectos, objetivos y tareas donde los dejaste.
      </p>

      {/* Primary 1-Click Direct Entry Button */}
      <div className="w-full mt-8 space-y-3">
        <button
          type="button"
          onClick={enterApp}
          className="w-full py-4 px-6 rounded-xl font-bold text-base text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 active:scale-[0.98] transition-all duration-150 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 group"
        >
          <span>Entrar a Aura</span>
          <span className="text-lg group-hover:translate-x-1 transition-transform">✨</span>
        </button>

        {/* Secondary Account Switch Action */}
        <button
          type="button"
          onClick={switchAccount}
          className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 hover:underline underline-offset-4"
        >
          <span>🔄</span>
          <span>¿No eres {displayName}? Cambiar de cuenta</span>
        </button>
      </div>
    </div>
  );
};
