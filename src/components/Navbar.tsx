import React from 'react';
import { useAuraState } from '../context/AuraState';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileMenu } from './ProfileMenu';

export const Navbar: React.FC = () => {
  const {
    userProfile,
    unreadNotificationsCount,
    notificationsOpen,
    setNotificationsOpen,
    profileMenuOpen,
    setProfileMenuOpen,
  } = useAuraState();

  // Edge case: Extremely high notification counts ("99+")
  const badgeLabel = unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount.toString();

  const toggleNotifications = () => {
    setProfileMenuOpen(false);
    setNotificationsOpen(!notificationsOpen);
  };

  const toggleProfile = () => {
    setNotificationsOpen(false);
    setProfileMenuOpen(!profileMenuOpen);
  };

  const userInitial = (userProfile?.username || 'U').charAt(0).toUpperCase();

  return (
    <header className="relative w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-3 sm:px-6 text-white flex justify-between items-center shadow-lg z-30 select-none">
      {/* Brand Logo with vibrant typography */}
      <div className="flex items-center gap-3 cursor-pointer group">
        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shadow-inner border border-white/30 transform group-hover:scale-105 transition-transform duration-200">
          ✨
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider drop-shadow-md bg-clip-text text-transparent bg-gradient-to-r from-white via-pink-100 to-amber-200">
            Aura
          </h1>
        </div>
      </div>

      {/* Utility Actions */}
      <div className="flex items-center gap-3 sm:gap-4 relative">
        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            aria-label="Notificaciones"
            className="relative p-2.5 bg-white/15 hover:bg-white/25 active:scale-95 rounded-full transition-all duration-150 border border-white/20 shadow-sm"
          >
            <span className="text-lg leading-none">🔔</span>
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md border-2 border-slate-900 animate-bounce">
                {badgeLabel}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
          />
        </div>

        {/* Profile Avatar Button */}
        <div className="relative">
          <button
            onClick={toggleProfile}
            aria-label="Perfil de usuario"
            className="w-10 h-10 rounded-full bg-white text-indigo-700 font-extrabold flex items-center justify-center shadow-md hover:ring-2 hover:ring-white/80 active:scale-95 transition-all duration-150 overflow-hidden"
          >
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm">{userInitial}</span>
            )}
          </button>

          <ProfileMenu
            isOpen={profileMenuOpen}
            onClose={() => setProfileMenuOpen(false)}
          />
        </div>
      </div>
    </header>
  );
};
