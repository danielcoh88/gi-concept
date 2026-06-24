import { useState } from 'react';
import {
  Sparkles, TrendingUp, MapPin, ChevronRight, Clock,
  ListPlus, CalendarDays, MessageCircle, PhoneOff, Dumbbell,
  Camera, AlertCircle, User, Image as ImageIcon,
} from 'lucide-react';

// ─── Behaviors data ───────────────────────────────────────────────────────────

const unusualBehaviors = [
  {
    id: 1,
    title: 'Spike in WhatsApp group activity',
    description: '47 messages sent in 5 minutes before incident',
    time: '23:45 - 23:50',
    severity: 'high' as const,
    actionType: 'create-task' as const,
    actionLabel: 'Create Task',
  },
  {
    id: 2,
    title: 'Phone powered off entire night',
    description: 'Device offline from 22:00 to 08:30 — unusual pattern',
    time: 'Jul 20 22:00 – Jul 21 08:30',
    severity: 'high' as const,
    actionType: 'create-event' as const,
    actionLabel: 'Add Event',
  },
  {
    id: 3,
    title: 'Missed regular gym visit',
    description: 'No check-in at usual Monday 18:00 gym session',
    time: 'Jul 21, 18:00',
    severity: 'medium' as const,
    actionType: 'create-task' as const,
    actionLabel: 'Create Task',
  },
];

function getActionIcon(actionType: string) {
  if (actionType === 'create-event') return CalendarDays;
  return ListPlus;
}

// ─── Lead matches data ────────────────────────────────────────────────────────

const newLeadMatches = [
  { id: 1, type: 'LOCATION',         icon: MapPin,      iconBgColor: 'bg-blue-100',   iconColor: 'text-blue-600',   matchCount: 3, title: '1234 Oak Street, Los Angeles, CA', navTab: 'locations', imageUrl: undefined },
  { id: 2, type: 'LOCATION',         icon: MapPin,      iconBgColor: 'bg-blue-100',   iconColor: 'text-blue-600',   matchCount: 2, title: 'Central Park West, New York, NY',  navTab: 'locations', imageUrl: undefined },
  { id: 3, type: 'FACE RECOGNITION', icon: Camera,      iconBgColor: 'bg-pink-100',   iconColor: 'text-pink-600',   matchCount: 1, title: 'John Doe',                         navTab: 'subjects',  imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100' },
  { id: 9, type: 'IDENTIFIER',       icon: User,        iconBgColor: 'bg-purple-100', iconColor: 'text-purple-600', matchCount: 1, title: 'Phone: +1 (555) 0147',             navTab: 'subjects',  imageUrl: undefined },
];

// ─── Widget ───────────────────────────────────────────────────────────────────

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export function AIInsightsWidget({ onNavigateTab }: Props) {
  const [activeTab, setActiveTab]     = useState<'behaviors' | 'leads'>('behaviors');
  const [leadsExpanded, setLeadsExpanded] = useState(false);

  const tabs = [
    { id: 'behaviors' as const, label: 'Unusual Behaviors', count: unusualBehaviors.length,   icon: TrendingUp, iconColor: 'text-orange-500' },
    { id: 'leads'     as const, label: 'Lead Matches',      count: newLeadMatches.length,      icon: MapPin,     iconColor: 'text-blue-500'   },
  ];

  return (
    <div className="w-full mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <h2 className="text-sm font-bold text-[#12233A] dark:text-white">AI Insights</h2>
        </div>
        <button
          onClick={() => onNavigateTab?.('subjects')}
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/10 mb-3">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setLeadsExpanded(false); }}
              className={`pb-2.5 px-3 text-xs border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-500 font-semibold'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className={`w-3 h-3 ${activeTab === tab.id ? 'text-blue-500' : tab.iconColor}`} />
              {tab.label}
              <span className={`ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                activeTab === tab.id
                  ? 'bg-blue-500/15 text-blue-500'
                  : 'bg-gray-100 dark:bg-white/8 text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Behaviors tab */}
      {activeTab === 'behaviors' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {unusualBehaviors.map(behavior => {
            const ActionIcon = getActionIcon(behavior.actionType);
            return (
              <div
                key={behavior.id}
                className="p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  {behavior.severity === 'high' ? (
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[9px] font-bold leading-none">!</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex-shrink-0" />
                  )}
                  <p className="text-xs font-semibold text-[#12233A] dark:text-white leading-snug">
                    {behavior.title}
                  </p>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 pl-6 leading-snug line-clamp-2">
                  {behavior.description}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 min-w-0">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{behavior.time}</span>
                  </div>
                  <button
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-400/20 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    <ActionIcon className="w-3 h-3 flex-shrink-0" />
                    {behavior.actionLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Matches tab */}
      {activeTab === 'leads' && (() => {
        const visible = leadsExpanded ? newLeadMatches : newLeadMatches.slice(0, 3);
        const hidden  = newLeadMatches.length - 3;
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {visible.map(match => (
                <div
                  key={match.id}
                  onClick={() => onNavigateTab?.(match.navTab)}
                  className="p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${match.imageUrl ? '' : match.iconBgColor}`}>
                      {match.imageUrl
                        ? <img src={match.imageUrl} alt={match.title} className="w-full h-full object-cover" />
                        : <match.icon className={`w-4 h-4 ${match.iconColor}`} />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                        {match.type}
                      </p>
                      <p className="text-xs font-semibold text-[#12233A] dark:text-white leading-snug truncate">
                        {match.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-semibold">
                      {match.matchCount} {match.matchCount === 1 ? 'match' : 'matches'}
                    </span>
                    <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 rounded text-[10px] font-semibold">
                      New
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {!leadsExpanded && hidden > 0 && (
              <button onClick={() => setLeadsExpanded(true)} className="w-full mt-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-dashed border-blue-200 dark:border-blue-400/20 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                Show {hidden} more
              </button>
            )}
            {leadsExpanded && hidden > 0 && (
              <button onClick={() => setLeadsExpanded(false)} className="w-full mt-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Show less
              </button>
            )}
          </>
        );
      })()}
    </div>
  );
}
