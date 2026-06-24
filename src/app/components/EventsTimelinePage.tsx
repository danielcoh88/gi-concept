import { Plus, Clock, MapPin, Calendar, Sparkles } from 'lucide-react';
import { Fragment, useState } from 'react';
import { useAISuggestions } from './useAISuggestions';

export interface CaseEvent {
  id: string;
  name: string;
  date: string;
  time: string;
  description?: string;
  address?: string;
  type?: 'incident' | 'movement' | 'discovery' | 'procedure' | 'communication';
}

const typeConfig: Record<NonNullable<CaseEvent['type']>, { color: string; dot: string }> = {
  incident:      { color: 'border-red-500',    dot: 'bg-red-500' },
  movement:      { color: 'border-blue-500',   dot: 'bg-blue-500' },
  discovery:     { color: 'border-green-500',  dot: 'bg-green-500' },
  procedure:     { color: 'border-purple-500', dot: 'bg-purple-500' },
  communication: { color: 'border-orange-500', dot: 'bg-orange-500' },
};

// Groups events by date for the timeline header separators
function groupByDate(events: CaseEvent[]): { date: string; events: CaseEvent[] }[] {
  const map = new Map<string, CaseEvent[]>();
  for (const e of events) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }
  return Array.from(map.entries()).map(([date, events]) => ({ date, events }));
}

// ─── AI Suggestion constants ──────────────────────────────────────────────────

const AI_INJECT_BEFORE_ID = 'e3';
const AI_SOURCES = ['Marcus Vance UFDR', 'Elena Rostova UFDR'];

// ─── Source tag with hover tooltip ───────────────────────────────────────────

function SourceTag({ sources }: { sources: string[] }) {
  return (
    <span className="relative inline-flex group/src cursor-default select-none">
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
        {sources.length} {sources.length === 1 ? 'Source' : 'Sources'}
      </span>
      <div className="absolute bottom-full left-0 mb-1.5 z-50 px-2.5 py-1.5 bg-[#12233A] text-white text-[10px] rounded shadow-lg opacity-0 group-hover/src:opacity-100 pointer-events-none transition-opacity min-w-max leading-relaxed">
        {sources.map(s => <div key={s}>· {s}</div>)}
      </div>
    </span>
  );
}

// ─── AI Suggested Event Card ──────────────────────────────────────────────────

function AISuggestedEventCard({ onAdd, onDismiss }: { onAdd: () => void; onDismiss: () => void }) {
  return (
    <div className="relative flex gap-4">
      {/* Sparkle timeline node — replaces the standard circle dot */}
      <div className="flex-shrink-0 z-10 mt-3">
        <div className="w-[23px] h-[23px] rounded-full bg-purple-100 border-2 border-purple-400 border-dashed flex items-center justify-center shadow-sm">
          <Sparkles className="w-3 h-3 text-purple-500" />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 bg-purple-50 dark:bg-purple-900/10 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700/40 p-4">

        {/* AI label pill */}
        <div className="mb-2.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5" />
            Suggested by AI
          </span>
        </div>

        {/* Title + time */}
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3 className="text-sm font-semibold text-[#12233A] dark:text-white leading-snug">
            Coordinated Meeting at Scene
          </h3>
          <div className="flex items-center gap-1 text-xs text-purple-500 flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span>00:09</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#5E6974] dark:text-gray-400 leading-relaxed mb-3">
          Geolocation overlap indicates Marcus Vance and Elena Rostova&apos;s devices were both
          present at 412 Harbor View Rd.
        </p>

        {/* Source tag + action bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <SourceTag sources={AI_SOURCES} />

          <div className="flex items-center gap-2">
            <button
              onClick={onDismiss}
              className="text-xs text-[#5E6974] hover:text-red-500 font-medium transition-colors px-1 py-1"
            >
              Dismiss
            </button>
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0064CC] text-white rounded-lg text-xs font-semibold hover:bg-[#015297] transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface EventsTimelinePageProps {
  events: CaseEvent[];
  caseId: string;
  caseName: string;
  onBack: () => void;
  onAddEvent?: () => void;
}

export function EventsTimelinePage({
  events,
  caseId,
  caseName,
  onBack,
  onAddEvent,
}: EventsTimelinePageProps) {
  const [dismissed, setDismissed] = useState(false);
  const aiEnabled = useAISuggestions();
  const showSuggestion = aiEnabled && !dismissed;

  const groups = groupByDate(events);
  const total = events.length;

  const handleSuggestionAdd = () => {
    setDismissed(true);
    onAddEvent?.();
  };

  const handleSuggestionDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="bg-[#F1F4F6] dark:bg-[#0f1929] rounded-lg">
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-4">
            <Clock className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-[#12233A] dark:text-white mb-1">No Events Yet</h3>
          <p className="text-xs text-[#5E6974] dark:text-gray-400 mb-4">
            Document key moments in the investigation as they unfold.
          </p>
          <button
            onClick={onAddEvent}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0064CC] text-white rounded-lg text-sm font-semibold hover:bg-[#015297] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Event
          </button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
          {groups.map((group, gi) => (
              <div key={group.date}>
                {/* Date group header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5E6974] dark:text-gray-400 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    {group.date}
                  </div>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">{group.events.length}</span>
                </div>

                {/* Events in this date group */}
                <div className="relative">
                  {/* Vertical connector line */}
                  <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gray-200 dark:bg-white/10 z-0" />

                  <div className="space-y-4">
                    {group.events.map((event, idx) => {
                      const cfg = typeConfig[event.type ?? 'incident'];
                      const isLast = gi === groups.length - 1 && idx === group.events.length - 1;

                      return (
                        <Fragment key={event.id}>
                          {/* Inject AI suggestion card immediately before the target event */}
                          {showSuggestion && event.id === AI_INJECT_BEFORE_ID && (
                            <AISuggestedEventCard
                              onAdd={handleSuggestionAdd}
                              onDismiss={handleSuggestionDismiss}
                            />
                          )}

                          <div className="relative flex gap-4">
                            {/* Timeline dot */}
                            <div className="flex-shrink-0 z-10 mt-3">
                              <div className={`w-[23px] h-[23px] rounded-full bg-white dark:bg-[#0f1929] border-2 ${cfg.color} flex items-center justify-center shadow-sm`}>
                                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                              </div>
                            </div>

                            {/* Event card */}
                            <div className="flex-1 bg-white dark:bg-[#131f35] rounded-lg border border-gray-200 dark:border-white/10 p-4 hover:border-[#0064CC]/30 dark:hover:border-blue-700/40 hover:shadow-sm transition-all group cursor-pointer">
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <h3 className="text-sm font-semibold text-[#12233A] dark:text-white leading-snug">
                                  {event.name}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-[#5E6974] dark:text-gray-400 flex-shrink-0">
                                  <Clock className="w-3 h-3" />
                                  <span>{event.time}</span>
                                </div>
                              </div>

                              {event.description && (
                                <p className="text-xs text-[#5E6974] dark:text-gray-400 leading-relaxed mb-2">
                                  {event.description}
                                </p>
                              )}

                              {event.address && (
                                <div className="flex items-center gap-1 text-xs text-[#5E6974] dark:text-gray-400">
                                  <MapPin className="w-3 h-3 flex-shrink-0 text-[#0064CC]" />
                                  <span>{event.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
