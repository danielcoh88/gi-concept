import { useState } from 'react';
import {
  Upload,
  MessageSquare,
  Link,
  Plus,
  RefreshCw,
  CheckCircle,
  FileCheck,
  TestTube,
  FolderOpen,
  Share2,
  Download,
  Flag,
  Reply,
  ArrowRight,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import type { ActivityFeedItem, FeedActionType } from './types';

// ─── Icon & Style Maps ────────────────────────────────────────────────────────

const actionIcons: Record<FeedActionType, React.ComponentType<{ className?: string }>> = {
  upload:     Upload,
  mention:    MessageSquare,
  link:       Link,
  create:     Plus,
  update:     RefreshCw,
  complete:   CheckCircle,
  lab_result: TestTube,
  match:      FileCheck,
  move:       FolderOpen,
  share:      Share2,
  download:   Download,
};

const actionBg: Record<FeedActionType, string> = {
  upload:     'bg-teal-100 text-teal-700',
  mention:    'bg-purple-100 text-purple-700',
  link:       'bg-blue-100 text-blue-700',
  create:     'bg-green-100 text-green-700',
  update:     'bg-gray-100 text-gray-600',
  complete:   'bg-green-100 text-green-700',
  lab_result: 'bg-indigo-100 text-indigo-700',
  match:      'bg-orange-100 text-orange-700',
  move:       'bg-gray-100 text-gray-600',
  share:      'bg-blue-100 text-blue-700',
  download:   'bg-gray-100 text-gray-600',
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Feed Item ────────────────────────────────────────────────────────────────
// Self-contained row. Hover reveals inline actions: Reply, Flag, Navigate.
// Unread indicator is a left-edge purple dot — same visual language as GI shell.

interface FeedItemProps {
  item: ActivityFeedItem;
  onReply: (id: string) => void;
  onFlag: (id: string) => void;
  onNavigate: (item: ActivityFeedItem) => void;
}

function FeedItemRow({ item, onReply, onFlag, onNavigate }: FeedItemProps) {
  const ActionIcon = actionIcons[item.actionType];
  const bgStyle = actionBg[item.actionType];

  return (
    <div className="relative group">
      {/* New indicator */}
      {item.isNew && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-600 rounded-r-full" />
      )}

      <div className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-default ${item.isFlagged ? 'bg-amber-50' : ''}`}>
        {/* Actor avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${item.actorColor}`}
          title={item.actorName}
        >
          {item.actorInitials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 leading-snug">
            <span className="font-semibold">{item.actorName}</span>{' '}
            <span className="text-gray-600">{item.action}</span>{' '}
            <button
              onClick={() => onNavigate(item)}
              className="font-medium text-blue-600 hover:underline"
            >
              {item.entityLabel}
            </button>
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${bgStyle}`}>
              <ActionIcon className="w-2.5 h-2.5" />
              <span className="capitalize">{item.actionType.replace('_', ' ')}</span>
            </div>
            <span className="text-xs text-gray-400">{timeAgo(item.timestamp)}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{formatTime(item.timestamp)}</span>
            {item.replyCount !== undefined && item.replyCount > 0 && (
              <>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-500">{item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}</span>
              </>
            )}
          </div>
        </div>

        {/* Inline actions — appear on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onReply(item.id)}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button
            onClick={() => onFlag(item.id)}
            className={`p-1.5 rounded hover:bg-amber-100 transition-colors ${item.isFlagged ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
            title={item.isFlagged ? 'Unflag' : 'Flag'}
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate(item)}
            className="p-1.5 rounded hover:bg-blue-100 transition-colors"
            title="Go to item"
          >
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Date Group Header ────────────────────────────────────────────────────────

function DateGroupHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ─── Mock Feed Data ───────────────────────────────────────────────────────────

const now = new Date();
const MOCK_FEED: ActivityFeedItem[] = [
  { id: 'f1', timestamp: new Date(now.getTime() - 9 * 60000), actorName: 'Mark Brown', actorInitials: 'MB', actorColor: 'bg-blue-500', actionType: 'mention', action: 'mentioned you in a note on', entityType: 'note', entityLabel: 'CCTV confirms location match', entityId: 'note-1', caseId: '05-CV-00234', isNew: true, isMention: true, replyCount: 0 },
  { id: 'f2', timestamp: new Date(now.getTime() - 22 * 60000), actorName: 'System', actorInitials: 'SY', actorColor: 'bg-indigo-500', actionType: 'lab_result', action: 'lab results returned for', entityType: 'submission', entityLabel: 'Submission #A183 — DNA Analysis', entityId: 'sub-a183', caseId: '05-CV-00234', isNew: true },
  { id: 'f3', timestamp: new Date(now.getTime() - 41 * 60000), actorName: 'Sarah Kim', actorInitials: 'SK', actorColor: 'bg-purple-500', actionType: 'upload', action: 'uploaded', entityType: 'file', entityLabel: 'GasStation_Jul21_23h52.mp4', entityId: 'file-1', caseId: '05-CV-00234', isNew: true },
  { id: 'f4', timestamp: new Date(now.getTime() - 65 * 60000), actorName: 'System', actorInitials: 'SY', actorColor: 'bg-orange-500', actionType: 'match', action: '3 new CDR location overlaps found in', entityType: 'cdr', entityLabel: 'Phone Records — John Miller', entityId: 'cdr-1', caseId: '05-CV-00234', isNew: true },
  { id: 'f5', timestamp: new Date(now.getTime() - 1.8 * 3600000), actorName: 'David Lee', actorInitials: 'DL', actorColor: 'bg-teal-500', actionType: 'link', action: 'linked subject', entityType: 'subject', entityLabel: 'John Miller → Location: Gas Station', entityId: 'sub-1', caseId: '05-CV-00234', isNew: false },
  { id: 'f6', timestamp: new Date(now.getTime() - 2.3 * 3600000), actorName: 'Jennifer Roberts', actorInitials: 'JR', actorColor: 'bg-pink-500', actionType: 'create', action: 'created task', entityType: 'task', entityLabel: 'Witness Interview - Marcus Davis', entityId: 'task-3', caseId: '05-CV-00234', isNew: false, replyCount: 2 },
  { id: 'f7', timestamp: new Date(now.getTime() - 4 * 3600000), actorName: 'Mark Brown', actorInitials: 'MB', actorColor: 'bg-blue-500', actionType: 'update', action: 'added event to Crimeline:', entityType: 'crimeline', entityLabel: 'Jul 21 — Night of Incident', entityId: 'cl-1', caseId: '05-CV-00234', isNew: false },
  { id: 'f8', timestamp: new Date(now.getTime() - 5.5 * 3600000), actorName: 'Alex Martinez', actorInitials: 'AM', actorColor: 'bg-green-500', actionType: 'complete', action: 'completed task', entityType: 'task', entityLabel: 'Process CCTV Footage', entityId: 'task-x', caseId: '05-CV-00234', isNew: false },
  { id: 'f9', timestamp: new Date(now.getTime() - 23 * 3600000), actorName: 'David Lee', actorInitials: 'DL', actorColor: 'bg-teal-500', actionType: 'upload', action: 'uploaded', entityType: 'file', entityLabel: 'Latent_Prints_002.jpg', entityId: 'file-4', caseId: '05-CV-00234', isNew: false },
  { id: 'f10', timestamp: new Date(now.getTime() - 25 * 3600000), actorName: 'Sarah Kim', actorInitials: 'SK', actorColor: 'bg-purple-500', actionType: 'mention', action: 'mentioned you in', entityType: 'note', entityLabel: 'Witness timeline inconsistency', entityId: 'note-2', caseId: '05-CV-00234', isNew: false, isMention: true },
];

// ─── Group by date ────────────────────────────────────────────────────────────

interface DateGroup { label: string; items: ActivityFeedItem[] }

function groupByDate(items: ActivityFeedItem[]): DateGroup[] {
  const groups: DateGroup[] = [];
  let lastLabel = '';
  for (const item of items) {
    const diffH = (Date.now() - item.timestamp.getTime()) / 3600000;
    const label = diffH < 24 ? 'Today' : diffH < 48 ? 'Yesterday' : 'Earlier';
    if (label !== lastLabel) {
      groups.push({ label, items: [] });
      lastLabel = label;
    }
    groups[groups.length - 1].items.push(item);
  }
  return groups;
}

// ─── Case Activity Feed ───────────────────────────────────────────────────────

export interface CaseActivityFeedProps {
  caseId: string;
  onNavigate?: (item: ActivityFeedItem) => void;
}

type FeedTab = 'all' | 'you' | 'flagged';

export function CaseActivityFeed({ caseId: _caseId, onNavigate }: CaseActivityFeedProps) {
  const [tab, setTab] = useState<FeedTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [feedItems] = useState<ActivityFeedItem[]>(MOCK_FEED);

  const filtered = feedItems
    .map((item) => ({ ...item, isFlagged: flaggedIds.has(item.id) }))
    .filter((item) => {
      if (tab === 'you') return item.isMention || item.isNew;
      if (tab === 'flagged') return item.isFlagged;
      return true;
    })
    .filter((item) =>
      !searchQuery ||
      item.entityLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.action.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const groups = groupByDate(filtered);
  const newCount = feedItems.filter((i) => i.isNew).length;

  const handleFlag = (id: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleNavigate = (item: ActivityFeedItem) => {
    onNavigate?.(item);
  };

  const tabs: { id: FeedTab; label: string; count?: number }[] = [
    { id: 'all', label: 'All Activity' },
    { id: 'you', label: 'For You', count: newCount },
    { id: 'flagged', label: 'Flagged', count: flaggedIds.size || undefined },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Case Activity</h3>
          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Filter options">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 pb-1.5 px-2 text-xs border-b-2 transition-colors font-medium ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  tab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No activity found</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <DateGroupHeader label={group.label} />
              {group.items.map((item) => (
                <FeedItemRow
                  key={item.id}
                  item={item}
                  onReply={() => {}}
                  onFlag={handleFlag}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Compose area stub */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-text hover:border-blue-300 transition-colors">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Add a note or @mention...</span>
        </div>
      </div>
    </div>
  );
}
