import React, { useState } from 'react';
import { useAuraState } from '../../context/AuraState';

export const AuthForms: React.FC = () => {
  const {
    authMode,
    setAuthMode,
    authLoading,
    authError,
    setAuthError,
    login,
    register,
  } = useAuraState();

  // Local state for Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Local state for Register
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [clientValidationNotice, setClientValidationNotice] = useState<string | null>(null);

  const handleTabSwitch = (mode: 'LOGIN' | 'REGISTER') => {
    setAuthMode(mode);
    setAuthError(null);
    setClientValidationNotice(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientValidationNotice(null);

    const trimmed = loginIdentifier.trim();
    if (!trimmed || !loginPassword) {
      setClientValidationNotice('Por favor completa todos los campos.');
      return;
    }

    await login({
      identifier: trimmed,
      password: loginPassword,
    });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientValidationNotice(null);

    const trimmedUser = registerUsername.trim();
    const trimmedEmail = registerEmail.trim();

    if (!trimmedUser || !trimmedEmail || !registerPassword || !registerPasswordConfirm) {
      setClientValidationNotice('Por favor completa todos los campos.');
      return;
    }

    if (trimmedUser.length < 3) {
      setClientValidationNotice('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    if (registerPassword.length < 6) {
      setClientValidationNotice('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (registerPassword !== registerPasswordConfirm) {
      setClientValidationNotice('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    await register({
      username: trimmedUser,
      email: trimmedEmail,
      password: registerPassword,
      passwordConfirm: registerPasswordConfirm,
    });
  };

  const displayedError = clientValidationNotice || authError;

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl text-slate-100">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-700/60 mb-6" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={authMode === 'LOGIN'}
          onClick={() => handleTabSwitch('LOGIN')}
          className={`flex-1 py-3 text-center text-sm font-bold tracking-wide transition-all relative ${
            authMode === 'LOGIN'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Iniciar Sesión
          {authMode === 'LOGIN' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full" />
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={authMode === 'REGISTER'}
          onClick={() => handleTabSwitch('REGISTER')}
          className={`flex-1 py-3 text-center text-sm font-bold tracking-wide transition-all relative ${
            authMode === 'REGISTER'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Crear Cuenta
          {authMode === 'REGISTER' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-pink-500 to-amber-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Alert banner for validation / backend errors */}
      {displayedError && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5 animate-fadeIn">
          <span className="text-base select-none">⚠️</span>
          <span className="leading-snug">{displayedError}</span>
        </div>
      )}

      {/* Login Form */}
      {authMode === 'LOGIN' && (
        <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Usuario o Correo
            </label>
            <input
              type="text"
              required
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder="ej. benjamin o tu@correo.com"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              disabled={authLoading}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              disabled={authLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => handleTabSwitch('REGISTER')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition underline underline-offset-4"
            >
              ¿No tienes una cuenta? Regístrate gratis
            </button>
          </div>
        </form>
      )}

      {/* Register Form */}
      {authMode === 'REGISTER' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nombre de Usuario
            </label>
            <input
              type="text"
              required
              value={registerUsername}
              onChange={(e) => setRegisterUsername(e.target.value)}
              placeholder="ej. benjamin"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              disabled={authLoading}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              placeholder="ej. tu@correo.com"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              disabled={authLoading}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Contraseña (mínimo 6 caracteres)
            </label>
            <input
              type="password"
              required
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              disabled={authLoading}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              required
              value={registerPasswordConfirm}
              onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
              disabled={authLoading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Creando cuenta...</span>
              </>
            ) : (
              <span>Crear Cuenta</span>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => handleTabSwitch('LOGIN')}
              className="text-xs text-pink-400 hover:text-pink-300 transition underline underline-offset-4"
            >
              ¿Ya tienes una cuenta? Inicia sesión aquí
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
