import React, { useState } from 'react';
import { EventItem, TimeBlock } from '../../domain/types';
import { EventCard } from './EventCard';

interface EventTimelineBlockProps {
  blockKey: TimeBlock;
  title: string;
  subtitle?: string;
  icon: string;
  events: EventItem[];
  onEditEvent: (event: EventItem) => void;
  defaultExpanded?: boolean;
}

export const EventTimelineBlock: React.FC<EventTimelineBlockProps> = ({
  blockKey,
  title,
  subtitle,
  icon,
  events,
  onEditEvent,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  // Badge styling per time block
  const badgeStyles: Record<TimeBlock, string> = {
    TODAY: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    THIS_WEEK: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    UPCOMING: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    PAST: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-sm transition-all">
      {/* Block Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none group"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl sm:text-2xl p-2 rounded-2xl bg-slate-800/60 border border-slate-700/60 group-hover:scale-105 transition-transform">
            {icon}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-100 tracking-tight group-hover:text-amber-400 transition-colors">
                {title}
              </h3>
              <span
                className={`px-2 py-0.5 text-xs font-bold rounded-full border ${
                  badgeStyles[blockKey]
                }`}
              >
                {events.length}
              </span>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Expand / Collapse Button */}
        <button
          type="button"
          aria-label={isExpanded ? 'Contraer bloque' : 'Expandir bloque'}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition"
        >
          <span
            className={`inline-block transform transition-transform duration-200 text-xs font-bold ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`}
          >
            ▼
          </span>
        </button>
      </div>

      {/* Block Content (Cards or Empty placeholder) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800/50">
          {events.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 bg-slate-950/30 rounded-2xl border border-slate-800/40 border-dashed">
              <span>No hay eventos registrados para este período.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onEdit={onEditEvent} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
