import { useState, useMemo } from 'react';
import {
  X, CheckCheck, User, Cpu, Sparkles, ChevronRight,
  CheckCircle2, XCircle, AtSign, Bell,
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { cn } from './ui/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActorType = 'human' | 'system' | 'ai';
type DateGroup = 'today' | 'yesterday' | 'older';

interface NotificationEntry {
  id: string;
  actor: string;
  actorType: ActorType;
  action: string;
  caseId: string;
  caseName: string;
  timestamp: string;
  dateGroup: DateGroup;
  isRead: boolean;
  navTab?: string;
  jobStatus?: 'success' | 'error';
  isMention?: boolean;
}

// ─── Mock data — personal notifications only ─────────────────────────────────

const NOTIFICATION_ENTRIES: NotificationEntry[] = [
  {
    id: '1',
    actor: 'Sarah K.',
    actorType: 'human',
    action: '@mentioned you in a comment on the Case Brief',
    caseId: '05-CV-00234',
    caseName: 'Downtown Robbery',
    timestamp: '15 min ago',
    dateGroup: 'today',
    isRead: false,
    navTab: 'brief',
    isMention: true,
  },
  {
    id: '2',
    actor: 'System',
    actorType: 'system',
    action: 'Your report "Investigation Summary" was generated successfully',
    caseId: '05-CV-00234',
    caseName: 'Downtown Robbery',
    timestamp: '42 min ago',
    dateGroup: 'today',
    isRead: false,
    navTab: 'files',
    jobStatus: 'success',
  },
  {
    id: '3',
    actor: 'System',
    actorType: 'system',
    action: 'Your submission to Regional Forensics Lab was accepted',
    caseId: '05-CV-00123',
    caseName: 'Arson Investigation',
    timestamp: '3 hr ago',
    dateGroup: 'today',
    isRead: false,
    navTab: 'submissions',
    jobStatus: 'success',
  },
  {
    id: '4',
    actor: 'David R.',
    actorType: 'human',
    action: '@mentioned you — "Please review the new witness statements"',
    caseId: '05-CV-00456',
    caseName: 'Fraud Case',
    timestamp: '7 hr ago',
    dateGroup: 'today',
    isRead: true,
    navTab: 'notes',
    isMention: true,
  },
  {
    id: '5',
    actor: 'Mark B.',
    actorType: 'human',
    action: 'Assigned you a task: "Review lab submission for Submission Alpha"',
    caseId: '05-CV-00234',
    caseName: 'Downtown Robbery',
    timestamp: '9 hr ago',
    dateGroup: 'today',
    isRead: true,
    navTab: 'tasks',
  },
  {
    id: '6',
    actor: 'System',
    actorType: 'system',
    action: 'Your submission to City Lab failed — invalid file format',
    caseId: '05-CV-00189',
    caseName: 'Homicide Case',
    timestamp: '1 day ago',
    dateGroup: 'yesterday',
    isRead: true,
    navTab: 'submissions',
    jobStatus: 'error',
  },
  {
    id: '7',
    actor: 'Lisa P.',
    actorType: 'human',
    action: '@mentioned you in Case Notes — inconsistency flagged in statement #4',
    caseId: '05-CV-00189',
    caseName: 'Homicide Case',
    timestamp: '1 day ago',
    dateGroup: 'yesterday',
    isRead: true,
    navTab: 'notes',
    isMention: true,
  },
  {
    id: '8',
    actor: 'System',
    actorType: 'system',
    action: 'Your export "Case Summary.pdf" is ready for download',
    caseId: '05-CV-00234',
    caseName: 'Downtown Robbery',
    timestamp: '2 days ago',
    dateGroup: 'older',
    isRead: true,
    navTab: 'files',
    jobStatus: 'success',
  },
  {
    id: '9',
    actor: 'Guardian AI',
    actorType: 'ai',
    action: 'Completed OSINT enrichment you requested for Subject #1 "John Miller"',
    caseId: '05-CV-00234',
    caseName: 'Downtown Robbery',
    timestamp: '3 days ago',
    dateGroup: 'older',
    isRead: true,
    navTab: 'subjects',
  },
];

const INITIAL_UNREAD_COUNT = NOTIFICATION_ENTRIES.filter((e) => !e.isRead).length;

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ActorIcon({ actorType }: { actorType: ActorType }) {
  if (actorType === 'human') {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
        <User className="w-3.5 h-3.5 text-blue-600" />
      </div>
    );
  }
  if (actorType === 'ai') {
    return (
      <div className="w-8 h-8 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-violet-600" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
      <Cpu className="w-3.5 h-3.5 text-gray-500" />
    </div>
  );
}

function SourceBadge({
  actorType,
  isMention,
  jobStatus,
}: {
  actorType: ActorType;
  isMention?: boolean;
  jobStatus?: 'success' | 'error';
}) {
  const base = 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold';
  if (isMention) {
    return (
      <span className={cn(base, 'bg-blue-50 text-blue-600 border border-blue-200')}>
        <AtSign className="w-2.5 h-2.5" />
        mention
      </span>
    );
  }
  if (jobStatus === 'success') {
    return (
      <span className={cn(base, 'bg-emerald-50 text-emerald-700 border border-emerald-200')}>
        <CheckCircle2 className="w-2.5 h-2.5" />
        success
      </span>
    );
  }
  if (jobStatus === 'error') {
    return (
      <span className={cn(base, 'bg-red-50 text-red-600 border border-red-200')}>
        <XCircle className="w-2.5 h-2.5" />
        failed
      </span>
    );
  }
  if (actorType === 'ai') {
    return (
      <span className={cn(base, 'bg-violet-50 text-violet-600 border border-violet-200')}>
        <Sparkles className="w-2.5 h-2.5" />
        AI
      </span>
    );
  }
  if (actorType === 'system') {
    return (
      <span className={cn(base, 'bg-gray-100 text-gray-500 border border-gray-200')}>
        <Cpu className="w-2.5 h-2.5" />
        system
      </span>
    );
  }
  return null;
}

function DateGroupHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-4 pb-1">
      <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500 flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-white/8" />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActivityLogPanelProps {
  open: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  currentCaseId: string | null;
  onEntryNavigate: (caseId: string, tab?: string) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ActivityLogPanel({
  open,
  onClose,
  onMarkAllRead,
  onEntryNavigate,
}: ActivityLogPanelProps) {
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(NOTIFICATION_ENTRIES.filter((e) => e.isRead).map((e) => e.id))
  );

  const totalUnread = NOTIFICATION_ENTRIES.filter((e) => !readIds.has(e.id)).length;

  const handleMarkAllRead = () => {
    setReadIds(new Set(NOTIFICATION_ENTRIES.map((e) => e.id)));
    onMarkAllRead();
  };

  const handleEntryClick = (entry: NotificationEntry) => {
    if (!readIds.has(entry.id)) {
      setReadIds((prev) => new Set([...prev, entry.id]));
    }
    onEntryNavigate(entry.caseId, entry.navTab);
    onClose();
  };

  const groupedEntries = useMemo(() => {
    const groups: { label: string; key: DateGroup; entries: NotificationEntry[] }[] = [
      { label: 'Today',     key: 'today',     entries: [] },
      { label: 'Yesterday', key: 'yesterday', entries: [] },
      { label: 'Older',     key: 'older',     entries: [] },
    ];
    NOTIFICATION_ENTRIES.forEach((entry) => {
      const group = groups.find((g) => g.key === entry.dateGroup);
      group?.entries.push(entry);
    });
    return groups.filter((g) => g.entries.length > 0);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/25 z-[105] transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 w-[480px] bg-white dark:bg-[#131f35] border-l border-gray-200 dark:border-white/10',
          'z-[110] flex flex-col shadow-xl',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 flex-shrink-0 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notifications</h2>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold leading-none">
                  {totalUnread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {totalUnread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Entry List ── */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="pb-4">
            {groupedEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              groupedEntries.map((group) => (
                <div key={group.key}>
                  <DateGroupHeader label={group.label} />
                  {group.entries.map((entry, idx) => {
                    const isUnread = !readIds.has(entry.id);
                    const isLast = idx === group.entries.length - 1;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => handleEntryClick(entry)}
                        className={cn(
                          'w-full text-left flex items-start gap-3 px-5 py-3.5 transition-colors group',
                          'border-l-2',
                          !isLast && 'border-b border-gray-100 dark:border-white/8',
                          isUnread
                            ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            : 'bg-white dark:bg-transparent border-l-transparent hover:bg-gray-50 dark:hover:bg-white/5'
                        )}
                      >
                        {/* Unread dot */}
                        <div className="w-2 flex-shrink-0 flex items-center justify-center mt-[14px]">
                          {isUnread && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          )}
                        </div>

                        <ActorIcon actorType={entry.actorType} />

                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span
                              className={cn(
                                'text-sm truncate',
                                isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'
                              )}
                            >
                              {entry.actor}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 font-normal">
                              {entry.timestamp}
                            </span>
                          </div>

                          <p className={cn('text-sm leading-snug mb-2', isUnread ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500')}>
                            {entry.action}
                          </p>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {entry.caseId}
                            </span>
                            <SourceBadge
                              actorType={entry.actorType}
                              isMention={entry.isMention}
                              jobStatus={entry.jobStatus}
                            />
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-3" />
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* ── Footer ── */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-white/8 flex-shrink-0">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Personal notifications from the last 7 days
          </p>
        </div>
      </div>
    </>
  );
}

export { INITIAL_UNREAD_COUNT };
