import React from 'react';
import { useAuraState } from '../../context/AuraState';
import { HeroBanner } from './HeroBanner';
import { AuthForms } from './AuthForms';
import { WelcomeView } from './WelcomeView';

export const AuthView: React.FC = () => {
  const { isAuthenticated, isWelcomeOnly } = useAuraState();

  const isReturningUser = isAuthenticated && isWelcomeOnly;

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/60 backdrop-blur-xl grid grid-cols-1 md:grid-cols-2">
        {/* Part 1: Visual Hero Panel with Image and 2 Phrases */}
        <div className="w-full h-full">
          <HeroBanner
            appName="Aura"
            firstPhrase="Organiza tu día con claridad y propósito."
            secondPhrase="Transforma cada meta en un logro tangible."
          />
        </div>

        {/* Part 2: Dynamic Action Panel (Welcome direct entry for returning users OR Auth Forms for new/switched users) */}
        <div className="w-full p-6 sm:p-8 lg:p-10 flex items-center justify-center bg-slate-900/40">
          {isReturningUser ? <WelcomeView /> : <AuthForms />}
        </div>
      </div>
    </div>
  );
};
