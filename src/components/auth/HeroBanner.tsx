import React from 'react';

export interface HeroBannerProps {
  appName?: string;
  firstPhrase?: string;
  secondPhrase?: string;
  customImageUrl?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  appName = 'Aura',
  firstPhrase = 'Organiza tu día con claridad y propósito.',
  secondPhrase = 'Transforma cada meta en un logro tangible.',
  customImageUrl,
}) => {
  return (
    <div className="relative flex flex-col justify-between p-6 sm:p-10 lg:p-12 h-full min-h-[380px] bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 text-white overflow-hidden shadow-2xl">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/20">
          ✨
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-pink-100 to-amber-200">
            {appName}
          </h1>
          <p className="text-xs uppercase tracking-widest text-indigo-200/80 font-semibold">
            Productividad & Enfoque
          </p>
        </div>
      </div>

      {/* Centerpiece Visual / Illustration */}
      <div className="relative z-10 my-6 sm:my-8 flex justify-center items-center">
        {customImageUrl ? (
          <img
            src={customImageUrl}
            alt="Productividad Aura"
            className="w-full max-w-sm max-h-72 object-contain drop-shadow-2xl rounded-2xl border border-white/10"
          />
        ) : (
          <div className="w-full max-w-sm aspect-[4/3] relative flex items-center justify-center">
            {/* Custom SVG Modern Productivity Artwork */}
            <svg
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-2xl"
              aria-label="Ilustración de productividad Aura"
            >
              <defs>
                <linearGradient id="auraCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="auraAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="auraCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Ambient orbiting ring */}
              <circle cx="200" cy="150" r="110" stroke="url(#auraCircleGrad)" strokeWidth="2" strokeDasharray="6 6" />
              <circle cx="200" cy="150" r="130" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

              {/* Backing frosted card */}
              <rect x="70" y="65" width="260" height="170" rx="20" fill="url(#auraCardGrad)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

              {/* Card Header simulation */}
              <rect x="95" y="90" width="80" height="12" rx="6" fill="rgba(255,255,255,0.85)" />
              <rect x="95" y="112" width="130" height="8" rx="4" fill="rgba(255,255,255,0.4)" />

              {/* Progress Bar */}
              <rect x="95" y="138" width="210" height="10" rx="5" fill="rgba(0,0,0,0.25)" />
              <rect x="95" y="138" width="155" height="10" rx="5" fill="url(#auraAccentGrad)" />

              {/* Interactive simulated checklist items */}
              <g transform="translate(95, 165)">
                <circle cx="8" cy="8" r="8" fill="#10b981" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="24" y="4" width="120" height="8" rx="4" fill="rgba(255,255,255,0.7)" />
              </g>

              <g transform="translate(95, 192)">
                <circle cx="8" cy="8" r="8" fill="#6366f1" />
                <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="24" y="4" width="90" height="8" rx="4" fill="rgba(255,255,255,0.7)" />
              </g>

              {/* Floating Badge 1 - Target / Goals */}
              <g transform="translate(260, 45)">
                <rect width="64" height="40" rx="12" fill="#1e1b4b" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <text x="32" y="25" textAnchor="middle" fontSize="16">🎯</text>
              </g>

              {/* Floating Badge 2 - High Speed / Streak */}
              <g transform="translate(50, 180)">
                <rect width="56" height="40" rx="12" fill="#311042" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <text x="28" y="25" textAnchor="middle" fontSize="16">⚡</text>
              </g>

              {/* Sparkling accents */}
              <circle cx="285" cy="180" r="3" fill="#fde047" className="animate-ping" />
              <circle cx="105" cy="50" r="2" fill="#f472b6" />
              <circle cx="330" cy="120" r="2.5" fill="#38bdf8" />
            </svg>
          </div>
        )}
      </div>

      {/* The 2 Inspirational Phrases */}
      <div className="relative z-10 space-y-3">
        {/* Phrase 1 */}
        <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-white/15 shadow-sm transition hover:bg-white/15">
          <span className="text-xl leading-none select-none">🎯</span>
          <div>
            <p className="text-sm sm:text-base font-semibold text-white tracking-wide">
              "{firstPhrase}"
            </p>
          </div>
        </div>

        {/* Phrase 2 */}
        <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-white/15 shadow-sm transition hover:bg-white/15">
          <span className="text-xl leading-none select-none">✨</span>
          <div>
            <p className="text-sm sm:text-base font-semibold text-indigo-100 tracking-wide">
              "{secondPhrase}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
