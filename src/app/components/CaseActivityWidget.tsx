import { useState, useRef, useEffect } from 'react';
import {
  Clock, ListFilter, User, Sparkles, ChevronRight, ChevronDown,
} from 'lucide-react';
import { Cpu } from 'lucide-react';

const ACTIVITY_ACTION_TYPES = [
  { id: 'comments', label: 'Comments & Mentions' },
  { id: 'status',   label: 'Status Changes'      },
  { id: 'system',   label: 'System Events'       },
  { id: 'ai',       label: 'AI Activity'         },
  { id: 'files',    label: 'File Uploads'        },
] as const;

function matchesActivityTimeframe(timestamp: string, timeframe: string): boolean {
  if (timeframe === 'all') return true;
  if (timestamp.includes('min') || timestamp.includes('hr')) return true;
  if (timeframe === 'today') return false;
  const m = timestamp.match(/^(\d+)\s*day/);
  const days = m ? parseInt(m[1]) : 1;
  if (timeframe === '7d')  return days <= 7;
  if (timeframe === '30d') return days <= 30;
  return true;
}

const caseActivityItems = [
  { id: 'ca1', actor: 'Sarah K.',    actorType: 'human'  as const, action: '@mentioned you in a comment on the Case Brief',           timestamp: '15 min ago', navTab: 'brief',       category: 'comments', isMe: false },
  { id: 'ca2', actor: 'System',      actorType: 'system' as const, action: 'Report "Investigation Summary" generated successfully',   timestamp: '42 min ago', navTab: 'files',       category: 'system',   isMe: false },
  { id: 'ca3', actor: 'Guardian AI', actorType: 'ai'     as const, action: 'Identified 3 new suspect connections from device data',   timestamp: '1 hr ago',   navTab: 'subjects',    category: 'ai',       isMe: false },
  { id: 'ca4', actor: 'Tom H.',      actorType: 'human'  as const, action: '10 files uploaded to Submission Alpha',                   timestamp: '2 hr ago',   navTab: 'submissions', category: 'files',    isMe: true  },
  { id: 'ca5', actor: 'Mark B.',     actorType: 'human'  as const, action: 'Updated case status to "Active Investigation"',           timestamp: '4 hr ago',   navTab: 'brief',       category: 'status',   isMe: false },
  { id: 'ca6', actor: 'System',      actorType: 'system' as const, action: 'Lab results returned for Submission #3 — Toxicology',     timestamp: '8 hr ago',   navTab: 'submissions', category: 'system',   isMe: false },
  { id: 'ca7', actor: 'Guardian AI', actorType: 'ai'     as const, action: 'Completed OSINT enrichment for Subject #1 "John Miller"', timestamp: '1 day ago',  navTab: 'subjects',    category: 'ai',       isMe: false },
  { id: 'ca8', actor: 'System',      actorType: 'system' as const, action: 'Flagged 2 overlapping coordinates in location timeline',  timestamp: '2 days ago', navTab: 'locations',   category: 'system',   isMe: false },
];

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export function CaseActivityWidget({ onNavigateTab }: Props) {
  const [activityScope,     setActivityScope]     = useState<'all' | 'mine'>('all');
  const [activityTypes,     setActivityTypes]     = useState<Set<string>>(() => new Set(ACTIVITY_ACTION_TYPES.map(t => t.id)));
  const [activityTimeframe, setActivityTimeframe] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [filterOpen,        setFilterOpen]        = useState(false);
  const [visibleCount,      setVisibleCount]      = useState(5);
  const [loadingMore,       setLoadingMore]       = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 5, caseActivityItems.length));
      setLoadingMore(false);
    }, 700);
  };

  const activeFilterCount =
    (activityTypes.size < ACTIVITY_ACTION_TYPES.length ? 1 : 0) +
    (activityTimeframe !== 'all' ? 1 : 0);

  const typeAndTimeFilter = (item: typeof caseActivityItems[0]) =>
    activityTypes.has(item.category) && matchesActivityTimeframe(item.timestamp, activityTimeframe);

  const allCount  = caseActivityItems.filter(typeAndTimeFilter).length;
  const mineCount = caseActivityItems.filter(i => i.isMe && typeAndTimeFilter(i)).length;

  const filteredItems = caseActivityItems.filter(item =>
    (activityScope === 'all' || item.isMe) && typeAndTimeFilter(item)
  );

  return (
    <div className="w-full mb-12">

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-bold text-[#12233A] dark:text-white">Case Activity</h2>
        </div>

        {/* Filter */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              activeFilterCount > 0
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-400/20'
                : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-600 text-white rounded-full text-[9px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute top-full right-0 mt-1.5 z-50 bg-white dark:bg-[#1c2640] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-56 py-3">
              <div className="px-3 pb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Action Type</p>
                {ACTIVITY_ACTION_TYPES.map(type => (
                  <label key={type.id} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activityTypes.has(type.id)}
                      onChange={() => setActivityTypes(prev => {
                        const next = new Set(prev);
                        next.has(type.id) ? next.delete(type.id) : next.add(type.id);
                        return next;
                      })}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                  </label>
                ))}
              </div>
              <div className="mx-3 border-t border-gray-100 dark:border-white/10" />
              <div className="px-3 pt-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Timeframe</p>
                <div className="relative">
                  <select
                    value={activityTimeframe}
                    onChange={e => setActivityTimeframe(e.target.value as typeof activityTimeframe)}
                    className="w-full appearance-none text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 pr-7 outline-none focus:border-blue-400 bg-gray-50 dark:bg-white/5 cursor-pointer"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs — All / My Activity */}
      <div className="flex border-b border-gray-200 dark:border-white/10 mb-3">
        {([
          { id: 'all'  as const, label: 'All',        count: allCount  },
          { id: 'mine' as const, label: 'My Activity', count: mineCount },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivityScope(tab.id)}
            className={`pb-2.5 px-3 text-xs border-b-2 transition-colors whitespace-nowrap ${
              activityScope === tab.id
                ? 'border-blue-500 text-blue-500 font-semibold'
                : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              activityScope === tab.id
                ? 'bg-blue-500/15 text-blue-500'
                : 'bg-gray-100 dark:bg-white/8 text-gray-400'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <ListFilter className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400 font-medium">No activity matches the current filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.slice(0, visibleCount).map(item => (
            <button
              key={item.id}
              onClick={() => onNavigateTab?.(item.navTab)}
              className="w-full text-left p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-3">
                {item.actorType === 'human' ? (
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                ) : item.actorType === 'ai' ? (
                  <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Cpu className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-[#12233A] dark:text-white">{item.actor}</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{item.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">{item.action}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0 mt-1.5" />
              </div>
            </button>
          ))}

          {loadingMore && [1, 2].map(i => (
            <div key={i} className="p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-2/3" />
                  <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more / all caught up */}
      {visibleCount < filteredItems.length && !loadingMore && (
        <button
          onClick={handleLoadMore}
          className="w-full mt-3 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-center py-2.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl border border-dashed border-blue-200 dark:border-blue-400/20 transition-colors"
        >
          Load more activity
        </button>
      )}
      {visibleCount >= filteredItems.length && filteredItems.length > 0 && !loadingMore && (
        <p className="text-xs text-gray-400 text-center mt-3">
          All caught up · {filteredItems.length} event{filteredItems.length !== 1 ? 's' : ''} shown
        </p>
      )}
    </div>
  );
}
