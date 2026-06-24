import { useState } from 'react';
import {
  AlertCircle,
  Clock,
  TestTube,
  Link,
  MessageSquare,
  X,
  ChevronRight,
  Download,
  FileCheck,
  TrendingUp,
  Bell,
  CheckCircle,
  Upload,
  RefreshCw,
} from 'lucide-react';
import type {
  HabitReminder,
  KPICardData,
  CrossCaseNotification,
  UrgencyLevel,
} from './types';

// ─── Habit Reminder Bar ───────────────────────────────────────────────────────
// Sticky strip of dismissible, actionable reminders that surface on every login.
// Drives the habit loop: users always know what needs attention before browsing.

interface HabitReminderBarProps {
  reminders: HabitReminder[];
  onDismiss: (id: string) => void;
}

const urgencyRing: Record<UrgencyLevel, string> = {
  critical: 'bg-red-100 border-red-300 text-red-800',
  high: 'bg-orange-100 border-orange-300 text-orange-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  low: 'bg-blue-100 border-blue-300 text-blue-800',
};

const urgencyDot: Record<UrgencyLevel, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

function HabitReminderBar({ reminders, onDismiss }: HabitReminderBarProps) {
  if (reminders.length === 0) return null;

  return (
    <div className="flex items-center gap-3 px-6 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto scrollbar-hide">
      <span className="flex-shrink-0 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
        <Bell className="w-3.5 h-3.5" />
        Reminders
      </span>
      <div className="flex items-center gap-2 flex-nowrap">
        {reminders.map((r) => (
          <div
            key={r.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity ${urgencyRing[r.urgency]}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgencyDot[r.urgency]}`} />
            <span>{r.message}</span>
            <span className="opacity-60">· {r.caseName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(r.id);
              }}
              className="ml-1 hover:opacity-60 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Overview ─────────────────────────────────────────────────────────────
// Priority-ordered cards. Order is: critical > high > medium > low.
// Clicking a card navigates to the relevant filtered view.

const kpiIcons: Record<KPICardData['type'], React.ComponentType<{ className?: string }>> = {
  overdue_task: AlertCircle,
  missing_submission: Clock,
  new_match: Link,
  pending_mention: MessageSquare,
};

const kpiAccent: Record<KPICardData['type'], { border: string; icon: string; count: string }> = {
  overdue_task: { border: 'border-t-red-500', icon: 'text-red-600', count: 'text-red-600' },
  missing_submission: { border: 'border-t-orange-500', icon: 'text-orange-600', count: 'text-orange-600' },
  new_match: { border: 'border-t-blue-500', icon: 'text-blue-600', count: 'text-blue-600' },
  pending_mention: { border: 'border-t-purple-500', icon: 'text-purple-600', count: 'text-purple-600' },
};

interface KPIOverviewProps {
  cards: KPICardData[];
  onCardClick: (card: KPICardData) => void;
}

function KPIOverview({ cards, onCardClick }: KPIOverviewProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = kpiIcons[card.type];
        const accent = kpiAccent[card.type];
        return (
          <button
            key={card.id}
            onClick={() => onCardClick(card)}
            className={`bg-white rounded-lg p-5 shadow-sm border border-gray-200 border-t-4 ${accent.border} hover:shadow-md transition-all text-left group`}
          >
            <div className="flex items-start justify-between mb-3">
              <Icon className={`w-6 h-6 ${accent.icon}`} />
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <div className={`text-4xl font-bold mb-1 ${accent.count}`}>{card.count}</div>
            <div className="text-sm font-semibold text-gray-900">{card.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.sublabel}</div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Cross-Case Notification Feed ─────────────────────────────────────────────
// Aggregated activity stream across all cases the user is part of.
// Tabs allow filtering by personal relevance vs. all activity.

const notifIcons: Record<CrossCaseNotification['type'], React.ComponentType<{ className?: string }>> = {
  download: Download,
  mention: MessageSquare,
  match: FileCheck,
  lab_result: TestTube,
  upload: Upload,
  status_change: RefreshCw,
};

const notifIconBg: Record<CrossCaseNotification['type'], string> = {
  download: 'bg-blue-100 text-blue-600',
  mention: 'bg-purple-100 text-purple-600',
  match: 'bg-green-100 text-green-600',
  lab_result: 'bg-indigo-100 text-indigo-600',
  upload: 'bg-teal-100 text-teal-600',
  status_change: 'bg-gray-100 text-gray-600',
};

interface CrossCaseNotificationFeedProps {
  notifications: CrossCaseNotification[];
  onOpenCase?: (caseId: string) => void;
}

function CrossCaseNotificationFeed({ notifications, onOpenCase }: CrossCaseNotificationFeedProps) {
  const [tab, setTab] = useState<'you' | 'all'>('you');
  const [visibleCount, setVisibleCount] = useState(8);

  const filtered = tab === 'you'
    ? notifications.filter((n) => n.isNew)
    : notifications;
  const visible = filtered.slice(0, visibleCount);

  const newCount = notifications.filter((n) => n.isNew).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">Cross-Case Activity</h3>
          {newCount > 0 && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
              {newCount} new
            </span>
          )}
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</button>
      </div>

      <div className="flex gap-1 px-6 border-b border-gray-200 mb-1">
        {(['you', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-3 text-sm border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {t === 'you' ? 'Relevant to You' : 'All'}
          </button>
        ))}
      </div>

      <div className="divide-y divide-gray-50">
        {visible.map((n) => {
          const Icon = notifIcons[n.type];
          const iconStyle = notifIconBg[n.type];
          const timeAgo = formatTimeAgo(n.timestamp);

          return (
            <div
              key={n.id}
              onClick={() => onOpenCase?.(n.caseId)}
              className="flex items-start gap-3 px-6 py-3 hover:bg-gray-50 transition-colors group relative cursor-pointer"
            >
              {n.isNew && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-purple-600 rounded-full" />
              )}
              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${iconStyle}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{n.message}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-blue-600 font-medium">{n.caseId}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-500">{timeAgo}</span>
                </div>
              </div>
              {n.actionLabel && (
                <button className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-blue-50">
                  {n.actionLabel}
                </button>
              )}
              <ChevronRight className="flex-shrink-0 w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
          );
        })}
      </div>

      {visibleCount < filtered.length && (
        <div className="px-6 py-3 border-t border-gray-100">
          <button
            onClick={() => setVisibleCount((c) => c + 8)}
            className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors font-medium"
          >
            Load more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_REMINDERS: HabitReminder[] = [
  { id: 'r1', message: 'Lab Sample Testing overdue by 1 day', type: 'task', caseId: '05-CV-00234', caseName: 'Downtown Robbery', urgency: 'critical' },
  { id: 'r2', message: 'Submission #B441 missing analyst assignment', type: 'submission', caseId: '05-CV-00189', caseName: 'Vehicle Theft', urgency: 'high' },
  { id: 'r3', message: 'Mark mentioned you in a note', type: 'mention', caseId: '05-CV-00234', caseName: 'Downtown Robbery', urgency: 'medium' },
  { id: 'r4', message: '4 new CDR matches require review', type: 'match', caseId: '05-CV-00156', caseName: 'Fraud Investigation', urgency: 'high' },
  { id: 'r5', message: 'DNA analysis report is ready', type: 'lab', caseId: '05-CV-00178', caseName: 'Missing Person', urgency: 'medium' },
];

const MOCK_KPIS: KPICardData[] = [
  { id: 'k1', type: 'overdue_task', label: 'Overdue Action Items', sublabel: 'Across 3 cases · oldest 4 days', count: 4, urgency: 'critical' },
  { id: 'k2', type: 'missing_submission', label: 'Delayed Submissions', sublabel: 'Missing analyst or priority', count: 2, urgency: 'high' },
  { id: 'k3', type: 'new_match', label: 'New Data Matches', sublabel: 'CDR, OSINT, face recognition', count: 12, urgency: 'medium' },
  { id: 'k4', type: 'pending_mention', label: 'Unread Mentions', sublabel: 'In notes and case feeds', count: 5, urgency: 'low' },
];

const now = new Date();
const MOCK_NOTIFICATIONS: CrossCaseNotification[] = [
  { id: 'n1', type: 'mention', message: 'Mark tagged you in a note on Downtown Robbery', actorName: 'Mark Brown', actorInitials: 'MB', caseId: '05-CV-00234', caseName: 'Downtown Robbery', timestamp: new Date(now.getTime() - 9 * 60000), isNew: true, actionLabel: 'Go to note' },
  { id: 'n2', type: 'lab_result', message: 'DNA analysis completed — submission #A183', actorName: 'System', actorInitials: 'SY', caseId: '05-CV-00234', caseName: 'Downtown Robbery', timestamp: new Date(now.getTime() - 22 * 60000), isNew: true, actionLabel: 'Review' },
  { id: 'n3', type: 'match', message: '3 new CDR location matches cross-referenced', actorName: 'System', actorInitials: 'SY', caseId: '05-CV-00156', caseName: 'Fraud Investigation', timestamp: new Date(now.getTime() - 41 * 60000), isNew: true, actionLabel: 'View matches' },
  { id: 'n4', type: 'download', message: 'Sarah Kim downloaded Evidence_Photos.zip', actorName: 'Sarah Kim', actorInitials: 'SK', caseId: '05-CV-00234', caseName: 'Downtown Robbery', timestamp: new Date(now.getTime() - 70 * 60000), isNew: false },
  { id: 'n5', type: 'upload', message: 'David Lee uploaded CCTV_NightClub_Jul21.mp4', actorName: 'David Lee', actorInitials: 'DL', caseId: '05-CV-00201', caseName: 'Assault Case', timestamp: new Date(now.getTime() - 2.5 * 3600000), isNew: false },
  { id: 'n6', type: 'status_change', message: 'Case status changed to "Under Review"', actorName: 'Jennifer Roberts', actorInitials: 'JR', caseId: '05-CV-00189', caseName: 'Vehicle Theft', timestamp: new Date(now.getTime() - 4 * 3600000), isNew: false },
  { id: 'n7', type: 'match', message: 'Fingerprint match found in submission #C892', actorName: 'System', actorInitials: 'SY', caseId: '05-CV-00234', caseName: 'Downtown Robbery', timestamp: new Date(now.getTime() - 6 * 3600000), isNew: false, actionLabel: 'Review' },
  { id: 'n8', type: 'mention', message: 'Alex Martinez assigned you a new task', actorName: 'Alex Martinez', actorInitials: 'AM', caseId: '05-CV-00201', caseName: 'Assault Case', timestamp: new Date(now.getTime() - 8 * 3600000), isNew: false, actionLabel: 'View task' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface CollaborateDashboardProps {
  onOpenCase?: (caseId: string) => void;
}

export function CollaborateDashboard({ onOpenCase }: CollaborateDashboardProps) {
  const [reminders, setReminders] = useState<HabitReminder[]>(MOCK_REMINDERS);

  const handleDismissReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleKPIClick = (card: KPICardData) => {
    // In production: navigate to filtered view based on card.type
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Habit Reminder Bar — always visible, drives re-engagement */}
      <HabitReminderBar reminders={reminders} onDismiss={handleDismissReminder} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Welcome + actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, James</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                You have{' '}
                <span className="font-semibold text-red-600">4 overdue items</span> and{' '}
                <span className="font-semibold text-blue-600">12 new matches</span> waiting.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm">
                <CheckCircle className="w-4 h-4" />
                Review Overdue
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold">
                <TrendingUp className="w-4 h-4" />
                New Matches
              </button>
            </div>
          </div>

          {/* Priority KPIs */}
          <KPIOverview cards={MOCK_KPIS} onCardClick={handleKPIClick} />

          {/* Cross-case notification feed */}
          <CrossCaseNotificationFeed notifications={MOCK_NOTIFICATIONS} onOpenCase={onOpenCase} />
        </div>
      </div>
    </div>
  );
}
