import {
  Sparkles, ExternalLink, ListPlus, AlertCircle, AlertTriangle,
  MapPin, User, Camera, Image, TestTube, ChevronRight, Link,
  Bell, MessageSquare, MessageCircle, PhoneOff, Dumbbell,
  Clock, CalendarDays, TrendingUp, Check, Cpu,
  GripVertical, GripHorizontal, LayoutGrid, Save, X, Plus, RotateCcw, ListFilter, ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAISuggestions } from './useAISuggestions';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import './CaseBriefContent.css';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { HTML5Backend } from 'react-dnd-html5-backend';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: number;
  name: string;
  dueDate: string;
  dueDateIso: string;
  dueDateRaw: Date;
  assignedTo: string[];
  dueStatus: 'overdue' | 'urgent' | 'upcoming';
  taskStatus: 'not-started' | 'in-progress' | 'completed';
  daysUntilDue: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeNames: string[];
  description: string;
  linkedEntities: { label: string; value: string }[];
  attachedFiles: { name: string; fileType: string }[];
}

interface CaseLeadMatch {
  id: number;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
  matchCount: number;
  title: string;
  category: 'locations' | 'events' | 'identifiers' | 'faces' | 'images';
  isNew: boolean;
  imageUrl?: string;
}

type WidgetId = 'ai-zone' | 'tasks-submissions' | 'unusual-behaviors' | 'case-lead-matches' | 'activity-log';
type WidgetWidthKey  = 'full' | 'half';
type WidgetHeightKey = 'compact' | 'default' | 'tall';

interface WidgetConfig {
  id:      WidgetId;
  width:   WidgetWidthKey;
  height:  WidgetHeightKey;
  hidden?: boolean;
}

interface CaseBriefContentProps {
  onAIPrompt?:    (prompt: string) => void;
  onAIDraft?:     (draft: string)  => void;
  onNavigateTab?: (tab: string)    => void;
  onLabMessage?:  (submissionId: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-green-400 to-green-600',
  'from-orange-400 to-orange-600',
  'from-teal-400 to-teal-600',
];

const WIDGET_LABELS: Record<WidgetId, string> = {
  'ai-zone':            'AI Insights and Suggestions',
  'tasks-submissions':  'Tasks & Submissions',
  'unusual-behaviors':  'Unusual Behaviors',
  'case-lead-matches':  'Case Lead Matches',
  'activity-log':       'Case Activity',
};

const WIDGET_HEIGHTS: Record<WidgetHeightKey, number> = {
  compact: 280,
  default: 440,
  tall:    680,
};

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

const DEFAULT_WIDGET_CONFIGS: WidgetConfig[] = [
  { id: 'ai-zone',           width: 'full', height: 'default' },
  { id: 'tasks-submissions', width: 'full', height: 'default' },
  { id: 'unusual-behaviors', width: 'half', height: 'default' },
  { id: 'case-lead-matches', width: 'half', height: 'default' },
  { id: 'activity-log',      width: 'half', height: 'default' },
];

const STORAGE_KEY = 'gi-case-brief-layout-v1';
const DND_TYPE    = 'CASE_BRIEF_WIDGET';

// ─── Status indicator ─────────────────────────────────────────────────────────

function StatusIndicator({ status, daysUntilDue }: { status: string; daysUntilDue: number }) {
  if (status === 'overdue') {
    return (
      <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-base leading-none">!</span>
      </div>
    );
  }
  const totalDays = 7;
  const pct  = Math.max(0, Math.min(100, ((totalDays - daysUntilDue) / totalDays) * 100));
  const arc  = (pct / 100) * 360;
  const circ = 2 * Math.PI * 11;
  return (
    <svg className="w-7 h-7 -rotate-90 flex-shrink-0" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="11" fill="none" stroke="#e5e7eb" strokeWidth="3" />
      <circle cx="13" cy="13" r="11" fill="none"
        stroke={daysUntilDue <= 1 ? '#f97316' : '#6b7280'} strokeWidth="3"
        strokeDasharray={`${(arc / 360) * circ} ${circ}`} strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Draggable widget wrapper ─────────────────────────────────────────────────

interface DraggableWidgetCardProps {
  config:         WidgetConfig;
  index:          number;
  isEditMode:     boolean;
  onMove:         (from: number, to: number) => void;
  onToggleWidth:  (id: WidgetId) => void;
  onResizeStart:  (e: React.MouseEvent, id: WidgetId) => void;
  onRemove:       (id: WidgetId) => void;
  children:       React.ReactNode;
}

function DraggableWidgetCard({
  config, index, isEditMode, onMove, onToggleWidth, onResizeStart, onRemove, children,
}: DraggableWidgetCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: DND_TYPE,
    item: () => ({ id: config.id, index }),
    canDrag: () => isEditMode,
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop<{ id: WidgetId; index: number }, void, { isOver: boolean }>({
    accept: DND_TYPE,
    hover(item, monitor) {
      if (!ref.current) return;
      const from = item.index;
      const to   = index;
      if (from === to) return;

      const rect    = ref.current.getBoundingClientRect();
      const midY    = (rect.bottom - rect.top) / 2;
      const clientY = (monitor.getClientOffset()?.y ?? 0) - rect.top;

      if (from < to && clientY < midY) return;
      if (from > to && clientY > midY) return;

      onMove(from, to);
      item.index = to;
    },
    collect: monitor => ({ isOver: monitor.isOver({ shallow: true }) }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`relative transition-opacity duration-150 ${
        config.width === 'full' ? 'col-span-1 lg:col-span-2' : 'col-span-1'
      } ${isDragging ? 'opacity-25' : 'opacity-100'}`}
      style={isEditMode ? { height: WIDGET_HEIGHTS[config.height] } : undefined}
    >
      {/* Drop zone highlight */}
      {isOver && isEditMode && !isDragging && (
        <div className="absolute inset-0 z-20 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/50 pointer-events-none" />
      )}

      {/* Edit mode ring */}
      {isEditMode && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-dashed ring-blue-300/50 pointer-events-none z-10" />
      )}

      {/* Drag handle */}
      {isEditMode && (
        <div
          className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 bg-white/95 dark:bg-[#131f35]/95 backdrop-blur-sm border border-blue-200 dark:border-blue-700/50 rounded-lg px-2 py-1 shadow-sm select-none"
          style={{ cursor: 'grab' }}
        >
          <GripVertical className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-[10px] text-blue-500 font-semibold">{WIDGET_LABELS[config.id]}</span>
        </div>
      )}

      {/* Width toggle */}
      {isEditMode && (
        <button
          onClick={() => onToggleWidth(config.id)}
          className="absolute top-2.5 right-[72px] z-30 bg-white/95 dark:bg-[#131f35]/95 border border-blue-200 dark:border-blue-700/50 rounded-lg px-2 py-1 text-[10px] text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
        >
          {config.width === 'full' ? '½ Width' : '⇔ Full'}
        </button>
      )}

      {/* Remove widget */}
      {isEditMode && (
        <button
          onClick={() => onRemove(config.id)}
          className="absolute top-2.5 right-2.5 z-30 w-7 h-7 flex items-center justify-center bg-white/95 dark:bg-[#131f35]/95 border border-red-200 dark:border-red-700/50 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm"
          title="Remove widget"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Content — pointer-events-none in edit mode so accidental clicks don't fire */}
      <div className={`h-full overflow-y-auto rounded-xl ${isEditMode ? 'pointer-events-none overflow-hidden' : ''}`}>
        {children}
      </div>

      {/* SE Resize handle */}
      {isEditMode && (
        <div
          className="absolute bottom-0 right-0 z-30 w-9 h-9 flex items-end justify-end p-1.5"
          style={{ cursor: 'se-resize', pointerEvents: 'all' }}
          onMouseDown={e => { e.stopPropagation(); onResizeStart(e, config.id); }}
        >
          <div className="w-5 h-5 rounded bg-blue-100 border border-blue-300 flex items-center justify-center shadow-sm">
            <GripHorizontal className="w-3 h-3 text-blue-500 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Source tag with tooltip ──────────────────────────────────────────────────

function SourceTag({ sources }: { sources: string[] }) {
  const label = sources.length === 1 ? '1 Source' : `${sources.length} Sources`;
  return (
    <span className="relative group/src inline-flex cursor-default">
      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded select-none">
        {label}
      </span>
      <div className="absolute bottom-full left-0 mb-1.5 z-50 px-2.5 py-1.5 bg-[#12233A] text-white text-[10px] rounded shadow-lg opacity-0 group-hover/src:opacity-100 pointer-events-none transition-opacity min-w-max leading-relaxed">
        {sources.map(s => <div key={s}>{sources.length > 1 ? '· ' : ''}{s}</div>)}
      </div>
    </span>
  );
}

// ─── Subject Details Dialog ───────────────────────────────────────────────────

type SubjectName = 'Marcus Vance' | 'Elena Rostova';

interface SubjectDetail {
  name: SubjectName;
  role: string;
  aliases?: string;
  evidence: string[];
}

const SUBJECT_DETAILS: Record<SubjectName, SubjectDetail> = {
  'Marcus Vance': {
    name: 'Marcus Vance',
    role: 'Primary Suspect',
    evidence: ['iPhone 14 Pro (UFDR)', 'Call Logs'],
  },
  'Elena Rostova': {
    name: 'Elena Rostova',
    role: 'Person of Interest',
    aliases: "'G_07'",
    evidence: ['Pixel 7 (UFDR)'],
  },
};

function SubjectDetailsDialog({ subject, onClose }: { subject: SubjectDetail | null; onClose: () => void }) {
  if (!subject) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#131f35] rounded-2xl shadow-2xl border border-purple-200/80 dark:border-purple-700/40 w-80 p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{subject.name}</p>
            <p className="text-xs text-purple-600 font-medium">{subject.role}</p>
          </div>
        </div>
        {subject.aliases && (
          <div className="mb-3">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Known Aliases</p>
            <p className="text-xs text-gray-700 dark:text-gray-300">{subject.aliases}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Evidence</p>
          <ul className="flex flex-col gap-1.5">
            {subject.evidence.map((ev, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                {ev}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CaseBriefContent({ onAIPrompt, onAIDraft, onNavigateTab, onLabMessage }: CaseBriefContentProps) {
  const aiSuggestionsEnabled = useAISuggestions();

  // ── Widget grid state ──────────────────────────────────────────────────────

  const [isEditMode,     setIsEditMode]     = useState(false);
  const [savedConfigs,   setSavedConfigs]   = useState<WidgetConfig[]>(DEFAULT_WIDGET_CONFIGS);
  const [previewConfigs, setPreviewConfigs] = useState<WidgetConfig[]>(DEFAULT_WIDGET_CONFIGS);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WidgetConfig[];
        setSavedConfigs(parsed);
        setPreviewConfigs(parsed);
      }
    } catch { /* ignore malformed */ }
  }, []);

  const activeConfigs = isEditMode ? previewConfigs : savedConfigs;

  const handleStartEdit = () => {
    setPreviewConfigs(savedConfigs);
    setIsEditMode(true);
  };

  const handleSave = () => {
    setSavedConfigs(previewConfigs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(previewConfigs));
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setPreviewConfigs(savedConfigs);
    setIsEditMode(false);
  };

  const moveWidget = useCallback((from: number, to: number) => {
    setPreviewConfigs(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const toggleWidth = useCallback((id: WidgetId) => {
    setPreviewConfigs(prev => prev.map(c =>
      c.id === id ? { ...c, width: c.width === 'full' ? 'half' : 'full' } : c
    ));
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent, widgetId: WidgetId) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    let   currentHeight = 0;
    setPreviewConfigs(prev => {
      const found = prev.find(c => c.id === widgetId);
      if (found) currentHeight = WIDGET_HEIGHTS[found.height];
      return prev;
    });

    const onMouseMove = (ev: MouseEvent) => {
      const delta  = ev.clientY - startY;
      const target = currentHeight + delta;

      const steps = Object.entries(WIDGET_HEIGHTS) as [WidgetHeightKey, number][];
      const closest = steps.reduce<WidgetHeightKey>((best, [key, value]) =>
        Math.abs(value - target) < Math.abs(WIDGET_HEIGHTS[best] - target) ? key : best
      , 'default');

      setPreviewConfigs(prev => prev.map(c =>
        c.id === widgetId ? { ...c, height: closest } : c
      ));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  }, []);

  // ── Remove / restore / reset ──────────────────────────────────────────────

  const removeWidget = useCallback((id: WidgetId) => {
    setPreviewConfigs(prev => prev.map(c => c.id === id ? { ...c, hidden: true } : c));
  }, []);

  const restoreWidget = useCallback((id: WidgetId) => {
    setPreviewConfigs(prev => prev.map(c => c.id === id ? { ...c, hidden: false } : c));
    setAddWidgetMenuOpen(false);
  }, []);

  const resetLayout = useCallback(() => {
    setPreviewConfigs(DEFAULT_WIDGET_CONFIGS);
  }, []);

  const [addWidgetMenuOpen, setAddWidgetMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addWidgetMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddWidgetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addWidgetMenuOpen]);

  // ── Existing operational state ─────────────────────────────────────────────

  const [aiZoneTab,           setAiZoneTab]           = useState<string>('all');
  const [activityScope,       setActivityScope]       = useState<'all' | 'mine'>('all');
  const [activityTypes,       setActivityTypes]       = useState<Set<string>>(() => new Set(ACTIVITY_ACTION_TYPES.map(t => t.id)));
  const [activityTimeframe,   setActivityTimeframe]   = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [activityFilterOpen,  setActivityFilterOpen]  = useState(false);
  const activityFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activityFilterOpen) return;
    const handler = (e: MouseEvent) => {
      if (activityFilterRef.current && !activityFilterRef.current.contains(e.target as Node)) {
        setActivityFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activityFilterOpen]);
  const [leadMatchesTab,  setLeadMatchesTab]  = useState<CaseLeadMatch['category'] | 'new'>('new');
  const [submissionsTab,  setSubmissionsTab]  = useState<'results' | 'pending'>('results');
  const [selectedTask,    setSelectedTask]    = useState<Task | null>(null);
  const [subjectDialog,   setSubjectDialog]   = useState<SubjectName | null>(null);
  const [toast,  setToast]  = useState<string | null>(null);
  const [activityVisibleCount, setActivityVisibleCount] = useState(5);
  const [activityLoadingMore,  setActivityLoadingMore]  = useState(false);
  const [activeSource, setActiveSource] = useState<{
    behaviorId: number;
    idx: number;
    anchor: { top: number; left: number; right: number; bottom: number };
  } | null>(null);
  const sourcePopoverRef = useRef<HTMLDivElement>(null);

  const caseActivityItems = [
    { id: 'ca1', actor: 'Sarah K.',    actorType: 'human'  as const, action: '@mentioned you in a comment on the Case Brief',            timestamp: '15 min ago',  navTab: 'brief',       isMention: true,               category: 'comments', isMe: false },
    { id: 'ca2', actor: 'System',      actorType: 'system' as const, action: 'Report "Investigation Summary" generated successfully',   timestamp: '42 min ago',  navTab: 'files',       jobStatus: 'success' as const, category: 'system',   isMe: false },
    { id: 'ca3', actor: 'Guardian AI', actorType: 'ai'     as const, action: 'Identified 3 new suspect connections from device data',    timestamp: '1 hr ago',    navTab: 'subjects',                                   category: 'ai',       isMe: false },
    { id: 'ca4', actor: 'Tom H.',      actorType: 'human'  as const, action: '10 files uploaded to Submission Alpha',                   timestamp: '2 hr ago',    navTab: 'submissions',                                category: 'files',    isMe: true  },
    { id: 'ca5', actor: 'Mark B.',     actorType: 'human'  as const, action: 'Updated case status to "Active Investigation"',           timestamp: '4 hr ago',    navTab: 'brief',                                      category: 'status',   isMe: false },
    { id: 'ca6', actor: 'System',      actorType: 'system' as const, action: 'Lab results returned for Submission #3 — Toxicology',     timestamp: '8 hr ago',    navTab: 'submissions', jobStatus: 'success' as const, category: 'system',   isMe: false },
    { id: 'ca7', actor: 'Guardian AI', actorType: 'ai'     as const, action: 'Completed OSINT enrichment for Subject #1 "John Miller"', timestamp: '1 day ago',   navTab: 'subjects',                                   category: 'ai',       isMe: false },
    { id: 'ca8', actor: 'System',      actorType: 'system' as const, action: 'Flagged 2 overlapping coordinates in location timeline',  timestamp: '2 days ago',  navTab: 'locations',   jobStatus: 'success' as const, category: 'system',   isMe: false },
  ];

  const handleLoadMoreActivity = () => {
    setActivityLoadingMore(true);
    setTimeout(() => {
      setActivityVisibleCount(prev => Math.min(prev + 5, caseActivityItems.length));
      setActivityLoadingMore(false);
    }, 700);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const getActionIcon = (actionType: string) => {
    if (actionType === 'create-event')   return CalendarDays;
    if (actionType === 'add-subject')    return User;
    if (actionType === 'verify-location') return MapPin;
    return ListPlus;
  };

  const handleNextStepAction = (item: { actionType: string; title?: string; headline?: string }) => {
    if (item.actionType === 'verify-location') {
      onNavigateTab?.('locations');
      return;
    }
    const text = item.headline ?? item.title ?? '';
    const truncated = text.length > 42 ? text.slice(0, 42) + '…' : text;
    const messages: Record<string, string> = {
      'create-task':  `Task created: "${truncated}"`,
      'create-event': `Event added: "${truncated}"`,
      'add-subject':  `Subject added: "${truncated}"`,
    };
    showToast(messages[item.actionType] ?? `Done: "${truncated}"`);
  };

  // ── Static data ────────────────────────────────────────────────────────────

  const tasks: Task[] = [
    {
      id: 1, name: 'Complete Investigation Report',
      dueDate: 'Apr 29', dueDateIso: '2026-04-29', dueDateRaw: new Date('2026-04-29'),
      assignedTo: ['TH'], dueStatus: 'overdue', taskStatus: 'in-progress', daysUntilDue: -1,
      priority: 'urgent',
      assigneeNames: ['Thomas Hawkins'],
      description: 'Compile all investigative findings — witness testimonies, forensic results, CCTV analysis, and subject profiles — into a formally structured report for submission to the prosecutor\'s office. Ensure all evidence is cited and chain-of-custody documentation is attached.',
      linkedEntities: [
        { label: 'Subject',    value: 'John Miller'       },
        { label: 'Location',   value: 'Harbor View Rd'    },
        { label: 'Submission', value: '#A183 DNA Match'   },
        { label: 'Submission', value: '#B441 Toxicology'  },
      ],
      attachedFiles: [
        { name: 'Report_Draft_v2.pdf',  fileType: 'pdf'  },
        { name: 'Evidence_Index.xlsx',  fileType: 'xlsx' },
      ],
    },
    {
      id: 2, name: 'Surveillance Footage Analysis',
      dueDate: 'Apr 30', dueDateIso: '2026-04-30', dueDateRaw: new Date('2026-04-30'),
      assignedTo: ['MB', 'SK'], dueStatus: 'urgent', taskStatus: 'not-started', daysUntilDue: 0,
      priority: 'high',
      assigneeNames: ['Marcus Brown', 'Sarah Kim'],
      description: 'Review and timestamp all CCTV and surveillance footage from Harbor View Rd and surrounding areas between 23:00–01:00. Identify vehicle movements, pedestrian activity, and any direct sighting of subjects. Export relevant clips and log findings in the case timeline.',
      linkedEntities: [
        { label: 'Location', value: 'Harbor View Rd'              },
        { label: 'Event',    value: 'CCTV Timestamp 00:09'        },
        { label: 'Subject',  value: 'Marcus Vance'                },
        { label: 'Subject',  value: 'Elena Rostova'               },
      ],
      attachedFiles: [
        { name: 'Harbor_View_CCTV_Clip.mp4',    fileType: 'mp4' },
        { name: 'Footage_Review_Checklist.pdf',  fileType: 'pdf' },
      ],
    },
    {
      id: 3, name: 'Witness Interview',
      dueDate: 'May 1', dueDateIso: '2026-05-01', dueDateRaw: new Date('2026-05-01'),
      assignedTo: ['DL', 'JR', 'AM'], dueStatus: 'urgent', taskStatus: 'not-started', daysUntilDue: 1,
      priority: 'high',
      assigneeNames: ['David Lee', 'Jane Rodriguez', 'Alex Morgan'],
      description: 'Conduct a formal recorded interview with the witness identified at the gas station on Harbor View Rd. Clarify timeline discrepancies between the witness account and CCTV footage. David Lee leads questioning, Jane Rodriguez handles documentation, Alex Morgan monitors recording equipment.',
      linkedEntities: [
        { label: 'Location', value: 'Harbor View Rd Gas Station' },
        { label: 'Subject',  value: 'John Miller'                },
        { label: 'Device',   value: 'Interview Recording Unit'   },
        { label: 'Event',    value: 'CCTV Timestamp 00:12'       },
      ],
      attachedFiles: [
        { name: 'Interview_Protocol.pdf',       fileType: 'pdf' },
        { name: 'Harbor_View_CCTV_Clip.mp4',    fileType: 'mp4' },
      ],
    },
  ].sort((a, b) => a.dueDateRaw.getTime() - b.dueDateRaw.getTime());

  const pendingSubmissions = [
    { id: 1,  submissionId: '#D201', item: 'DNA sample — blood from scene',           sentDaysAgo: 12, assignmentName: 'DNA Biological Sample'            },
    { id: 2,  submissionId: '#E330', item: 'Fiber analysis — suspect clothing',        sentDaysAgo: 8,  assignmentName: 'Fiber Trace Analysis'             },
    { id: 10, submissionId: '#F445', item: 'Ballistics — recovered bullet casing',    sentDaysAgo: 15, assignmentName: 'Ballistics & Firearms'            },
    { id: 11, submissionId: '#G112', item: 'Latent fingerprints — door handle',       sentDaysAgo: 6,  assignmentName: 'Fingerprint & Trace Evidence'     },
    { id: 12, submissionId: '#H774', item: 'Digital device — suspect mobile phone',   sentDaysAgo: 20, assignmentName: 'Digital & Multimedia Evidence'    },
    { id: 13, submissionId: '#I903', item: 'Shoe print cast — crime scene',           sentDaysAgo: 5,  assignmentName: 'Footwear Impression'              },
    { id: 14, submissionId: '#J256', item: 'Hair sample — victim clothing',           sentDaysAgo: 10, assignmentName: 'Hair & Fiber Comparison'          },
    { id: 15, submissionId: '#K088', item: 'Glass fragment — forced entry point',     sentDaysAgo: 3,  assignmentName: 'Physical Evidence Examination'    },
  ];

  const labResults = [
    { id: 3,  submissionId: '#A183', result: 'DNA match — victim blood confirmed',     timeAgo: '2 min ago',   assignmentName: 'DNA Biological Sample',          assignmentType: 'DNA Forensics',       files: [{ ext: 'PDF',  name: 'DNA_Analysis_Report.pdf' }, { ext: 'UFDR', name: 'iphone.ufdr' }, { ext: 'PDF', name: 'ChainOfCustody.pdf' }] },
    { id: 4,  submissionId: '#B441', result: 'Toxicology report ready',                timeAgo: '10 min ago',  assignmentName: 'Blood Alcohol Analysis',         assignmentType: 'Toxicology',          files: [{ ext: 'PDF',  name: 'Toxicology_Report.pdf' }, { ext: 'DOCX', name: 'LabNotes.docx' }] },
    { id: 5,  submissionId: '#C892', result: 'Fingerprint analysis complete',          timeAgo: '25 min ago',  assignmentName: 'Fingerprint & Trace Evidence',   assignmentType: 'Fingerprint ID',      files: [{ ext: 'PDF',  name: 'Fingerprint_Results.pdf' }] },
    { id: 16, submissionId: '#L021', result: 'Ballistics — firearm match confirmed',   timeAgo: '1 hour ago',  assignmentName: 'Ballistics & Firearms',          assignmentType: 'Ballistics',          files: [{ ext: 'DOCX', name: 'Ballistics_Match.docx' }, { ext: 'PDF', name: 'Evidence_Photos.pdf' }, { ext: 'UFDR', name: 'device_dump.ufdr' }, { ext: 'PDF', name: 'Report.pdf' }] },
    { id: 17, submissionId: '#M334', result: 'Fiber comparison — positive result',     timeAgo: '2 hours ago', assignmentName: 'Fiber Trace Analysis',           assignmentType: 'Trace Evidence',      files: [{ ext: 'PDF',  name: 'Fiber_Analysis.pdf' }, { ext: 'DOCX', name: 'Notes.docx' }] },
    { id: 18, submissionId: '#N567', result: 'Blood spatter analysis ready',           timeAgo: '3 hours ago', assignmentName: 'Digital & Multimedia Evidence',  assignmentType: 'Blood Pattern',       files: [{ ext: 'PDF',  name: 'BloodSpatter_Report.pdf' }] },
    { id: 19, submissionId: '#O789', result: 'Soil sample analysis complete',          timeAgo: '5 hours ago', assignmentName: 'Physical Evidence Examination',  assignmentType: 'Chemical Analysis',   files: [{ ext: 'UFDR', name: 'Soil_Sample.ufdr' }, { ext: 'PDF', name: 'Analysis.pdf' }, { ext: 'DOCX', name: 'Summary.docx' }] },
    { id: 20, submissionId: '#P901', result: 'Dental record comparison done',          timeAgo: '8 hours ago', assignmentName: 'Hair & Fiber Comparison',        assignmentType: 'Forensic Odontology', files: [{ ext: 'PDF',  name: 'Dental_Records.pdf' }] },
  ];

  const caseLeadMatches: CaseLeadMatch[] = [
    { id: 1, type: 'LOCATION',         icon: MapPin,      iconBgColor: 'bg-blue-100',   iconColor: 'text-blue-600',   matchCount: 3, title: '1234 Oak Street, Los Angeles, CA',  category: 'locations',   isNew: true  },
    { id: 2, type: 'LOCATION',         icon: MapPin,      iconBgColor: 'bg-blue-100',   iconColor: 'text-blue-600',   matchCount: 2, title: 'Central Park West, New York, NY',   category: 'locations',   isNew: true  },
    { id: 3, type: 'FACE RECOGNITION', icon: Camera,      iconBgColor: 'bg-pink-100',   iconColor: 'text-pink-600',   matchCount: 1, title: 'John Doe',                          category: 'faces',       isNew: true,  imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100' },
    { id: 4, type: 'LOCATION',         icon: MapPin,      iconBgColor: 'bg-blue-100',   iconColor: 'text-blue-600',   matchCount: 2, title: 'Downtown Mall, Seattle, WA',        category: 'locations',   isNew: false },
    { id: 5, type: 'FACE RECOGNITION', icon: Camera,      iconBgColor: 'bg-pink-100',   iconColor: 'text-pink-600',   matchCount: 2, title: 'Jane Smith',                        category: 'faces',       isNew: false, imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100' },
    { id: 6, type: 'EVENT',            icon: AlertCircle, iconBgColor: 'bg-orange-100', iconColor: 'text-orange-600', matchCount: 3, title: 'Crime scene timestamp',              category: 'events',      isNew: false },
    { id: 7, type: 'IDENTIFIER',       icon: User,        iconBgColor: 'bg-purple-100', iconColor: 'text-purple-600', matchCount: 1, title: 'SSN: ***-**-5678',                  category: 'identifiers', isNew: false },
    { id: 8, type: 'IMAGE',            icon: Image,       iconBgColor: 'bg-green-100',  iconColor: 'text-green-600',  matchCount: 4, title: 'Vehicle Image Match',               category: 'images',      isNew: false },
    { id: 9, type: 'IDENTIFIER',       icon: User,        iconBgColor: 'bg-purple-100', iconColor: 'text-purple-600', matchCount: 1, title: 'Phone: +1 (555) 0147',              category: 'identifiers', isNew: true  },
  ];

  const aiInsights = [
    {
      id: 1,
      headline: 'Vance & Rostova co-located at scene — 00:09',
      detail: 'UFDR cross-reference confirms both devices at 412 Harbor View Rd at 00:09 — a coordinated meeting 6 min before the incident.',
      tag: '412 Harbor View Rd',
      sources: ['UFDR – Marcus Vance', 'UFDR – Elena Rostova'],
      areas: ['Locations', 'Subjects'],
      severity: 'critical' as const,
      actionType: 'verify-location' as const,
      actionLabel: 'View Location',
    },
    {
      id: 2,
      headline: 'Burner call to Vance → device goes dark',
      detail: 'Incoming call from unregistered +1-555-0183 at 23:51 (2m 14s). Vance\'s device went offline immediately after — until 00:22.',
      tag: '23:51 · Night of incident',
      sources: ['UFDR – Marcus Vance', 'CDR Analysis'],
      areas: ['Events', 'Subjects'],
      severity: 'high' as const,
      actionType: 'create-event' as const,
      actionLabel: 'Add Event',
    },
    {
      id: 3,
      headline: "Deleted Telegram chats link Vance to alias 'G_07'",
      detail: "Fragment recovery reveals Vance coordinating with alias 'G_07' (believed to be Elena Rostova). Location pins in the chats match the crime scene.",
      tag: 'Deleted · Recovered via UFDR',
      sources: ['UFDR – Marcus Vance'],
      areas: ['Tasks', 'Subjects'],
      severity: 'high' as const,
      actionType: 'create-task' as const,
      actionLabel: 'Create Task',
    },
  ];

  const unusualBehaviors = [
    { id: 1, icon: MessageCircle, iconBgColor: 'bg-orange-100', iconColor: 'text-orange-600', title: 'Spike in WhatsApp group activity',  description: '47 messages sent in 5 minutes before incident',         time: '23:45 - 23:50',                  severity: 'high'   as const, sources: [{ name: 'Device Extraction', detail: 'UFDR extraction · Marcus Vance\'s iPhone · Jul 21',              canOpenInViewer: true  }, { name: 'Call Records',        detail: 'CDR metadata · outgoing calls · Jul 21, 23:40–23:55', canOpenInViewer: true  }], actionType: 'create-task'  as const, actionLabel: 'Create Task' },
    { id: 2, icon: PhoneOff,      iconBgColor: 'bg-red-100',    iconColor: 'text-red-600',    title: 'Phone powered off entire night',    description: 'Device offline from 22:00 to 08:30 — unusual pattern', time: 'Jul 20, 22:00 - Jul 21, 08:30', severity: 'high'   as const, sources: [{ name: 'CDR Data',             detail: 'Carrier records · 10.5h gap · Jul 20 22:00 – Jul 21 08:30', canOpenInViewer: true  }],                                                                                                        actionType: 'create-event' as const, actionLabel: 'Add Event'   },
    { id: 3, icon: Dumbbell,      iconBgColor: 'bg-yellow-100', iconColor: 'text-yellow-600', title: 'Missed regular gym visit',          description: 'No check-in at usual Monday 18:00 gym session',        time: 'Jul 21, 18:00',                  severity: 'medium' as const, sources: [{ name: 'Physical Surveillance', detail: 'Field observation log · no subject at location · Jul 21 18:00', canOpenInViewer: false }, { name: 'Location Check-ins', detail: 'GPS & cell tower · no match to gym address · Jul 21 18:00',  canOpenInViewer: true  }], actionType: 'create-task'  as const, actionLabel: 'Create Task' },
  ];

  const urgentTaskCount       = tasks.filter(t => t.status !== 'upcoming').length;
  const overdueTaskCount      = tasks.filter(t => t.status === 'overdue').length;
  const newMatchCount         = caseLeadMatches.filter(m => m.isNew).length;
  const unusualBehaviorsCount = 5;

  const leadMatchesTabs: { id: CaseLeadMatch['category'] | 'new'; label: string }[] = [
    { id: 'new',         label: 'New'         },
    { id: 'locations',   label: 'Locations'   },
    { id: 'events',      label: 'Events'      },
    { id: 'identifiers', label: 'Identifiers' },
    { id: 'faces',       label: 'Faces'       },
    { id: 'images',      label: 'Images'      },
  ];

  const visibleMatches = caseLeadMatches.filter(m =>
    leadMatchesTab === 'new' ? m.isNew : m.category === leadMatchesTab
  );

  // ── Responsive helpers ────────────────────────────────────────────────────

  const getConfigFor = (id: WidgetId) => activeConfigs.find(c => c.id === id);
  const isNarrow     = (id: WidgetId) => getConfigFor(id)?.width === 'half';

  // ── Widget renderers ─────────────────────────────────────────────────────

  const renderWithSubjectLinks = (text: string): React.ReactNode => {
    const pattern = /(Marcus Vance|Elena Rostova)/g;
    const parts = text.split(pattern);
    return parts.map((part, i) => {
      if (part === 'Marcus Vance' || part === 'Elena Rostova') {
        return (
          <span
            key={i}
            onClick={() => setSubjectDialog(part as SubjectName)}
            className="text-purple-700 font-semibold cursor-pointer hover:text-purple-900 hover:underline transition-colors"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const renderAIZone = () => {
    // Derive area counts and build tab list
    const areaCountMap: Record<string, number> = {};
    aiInsights.forEach(i => i.areas.forEach(a => { areaCountMap[a] = (areaCountMap[a] ?? 0) + 1; }));
    const areaTabs = Object.entries(areaCountMap).sort((a, b) => b[1] - a[1]);

    const tabs = [
      { id: 'all', label: 'Most Critical' },
      ...areaTabs.map(([area, count]) => ({ id: area, label: `${area} (${count})` })),
    ];

    const visibleInsights = aiZoneTab === 'all'
      ? aiInsights
      : aiInsights.filter(i => i.areas.includes(aiZoneTab));

    // Map area names to navigable module tabs
    const AREA_TAB: Record<string, string> = {
      Locations:   'locations',
      Tasks:       'tasks',
      Events:      'events',
      Subjects:    'subjects',
      Submissions: 'submissions',
    };
    const handleAreaClick = (area: string) => {
      const tab = AREA_TAB[area];
      if (tab) onNavigateTab?.(tab);
    };

    return (
      <div className="relative rounded-2xl overflow-hidden border border-purple-300/60 shadow-[0_0_0_1px_rgba(168,85,247,0.10),0_4px_24px_rgba(168,85,247,0.10)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#faf5ff] via-[#f3f0ff] to-[#eff6ff] dark:from-[#1a1033] dark:via-[#160d2e] dark:to-[#0f1929] pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-purple-300/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header — title only, no counter */}
        <div className="relative z-10 flex items-center gap-2.5 px-5 py-3.5 border-b border-purple-200/60 dark:border-purple-700/30 bg-white/30 dark:bg-black/20 backdrop-blur-sm">
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl blur-sm opacity-40" />
            <div className="relative w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold bg-gradient-to-r from-purple-700 to-blue-600 bg-clip-text text-transparent leading-tight">AI Insights and Suggestions</p>
            <p className="text-[10px] text-purple-400/90 font-medium">Guardian AI · Case Analysis</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="relative z-10 flex border-b border-purple-200/60 dark:border-purple-700/30 bg-white/20 dark:bg-black/10 overflow-x-auto">
          {tabs.map(tab => {
            const isActive = tab.id === aiZoneTab;
            return (
              <button
                key={tab.id}
                onClick={() => setAiZoneTab(tab.id)}
                className={`px-3.5 py-2.5 text-xs border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-purple-600 text-purple-700 font-semibold'
                    : 'border-transparent text-gray-400 hover:text-purple-600 hover:border-purple-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Insight grid — 3 columns on desktop */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3 px-5 py-4">
          {visibleInsights.map(insight => {
            const isCritical = insight.severity === 'critical';
            const severityBorder = isCritical ? 'border-l-red-400' : 'border-l-orange-400';
            const severityBadge = isCritical
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-orange-50 text-orange-600 border-orange-200';
            const severityLabel = isCritical ? 'CRITICAL' : 'HIGH';

            // Tab-aware action
            const TAB_ACTION: Record<string, { label: string; type: typeof insight.actionType }> = {
              Subjects:  { label: 'Add Subject',  type: 'verify-location' },
              Locations: { label: 'Add Location', type: 'verify-location' },
              Events:    { label: 'Add Event',    type: 'create-event'    },
              Tasks:     { label: 'Create Task',  type: 'create-task'     },
            };
            const tabAction = aiZoneTab !== 'all' ? TAB_ACTION[aiZoneTab] : null;
            const actionLabel = tabAction?.label ?? insight.actionLabel;
            const actionType  = tabAction?.type  ?? insight.actionType;
            const ActionIcon  = getActionIcon(actionType);

            return (
              <div
                key={insight.id}
                className={`relative p-3.5 rounded-xl border-l-[3px] border border-purple-200/70 dark:border-purple-700/30 transition-all flex flex-col gap-2.5 bg-white/70 dark:bg-white/5 hover:border-purple-300/80 dark:hover:border-purple-600/40 hover:bg-white/90 dark:hover:bg-white/8 hover:shadow-sm ${severityBorder}`}
              >
                {/* Severity badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded blur-sm opacity-30" />
                    <Sparkles className="relative w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded border ${severityBadge}`}>
                    {severityLabel}
                  </span>
                </div>

                {/* Headline + tooltip (tooltip scoped to headline hover only) */}
                <div className="group relative">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug cursor-default">
                    {renderWithSubjectLinks(insight.headline)}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 leading-snug">{insight.tag}</p>
                  {/* Tooltip — only fires when headline text is hovered */}
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-64 px-3 py-2.5 bg-[#12233A] text-white text-[11px] leading-relaxed rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
                    {insight.detail}
                    <div className="absolute top-full left-4 w-2 h-2 bg-[#12233A] rotate-45 -mt-1" />
                  </div>
                </div>

                {/* Source + action */}
                <div className="flex items-center justify-between gap-2 mt-auto">
                  <SourceTag sources={insight.sources} />
                  <button
                    onClick={() => handleNextStepAction(insight)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                  >
                    <ActionIcon className="w-3 h-3 flex-shrink-0" />
                    {actionLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contextual footer deep-link */}
        {(() => {
          const tabLinkLabel: Record<string, string> = {
            Locations: 'View all Locations',
            Events:    'View all Events',
            Subjects:  'View all Subjects',
            Tasks:     'View all Tasks',
            all:       'View all AI Insights',
          };
          const tabLinkRoute: Record<string, string> = {
            Locations: 'locations',
            Events:    'events',
            Subjects:  'subjects',
            Tasks:     'tasks',
            all:       'cellebrite-ai',
          };
          const label = tabLinkLabel[aiZoneTab] ?? 'View all AI Insights';
          const route = tabLinkRoute[aiZoneTab];
          return (
            <div className="relative z-10 flex justify-end px-5 pb-4 -mt-1">
              <button
                onClick={() => route && onNavigateTab?.(route)}
                className="flex items-center gap-1 text-sm font-medium text-purple-700 hover:underline transition-colors"
              >
                {label}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderTasksSubmissions = () => {
    const narrow = isNarrow('tasks-submissions');
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Tasks */}
        <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10 flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">{urgentTaskCount} Urgent Tasks</h3>
            </div>
            <button onClick={() => onNavigateTab?.('tasks')} className="text-sm text-blue-600 hover:text-blue-700 transition-colors">See all</button>
          </div>
          <div className="case-brief-widget-scroll overflow-y-auto flex-1 min-h-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Task</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Due</th>
                  {!narrow && <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Assigned</th>}
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr
                    key={task.id}
                    draggable
                    onDragStart={e => {
                      const payload = JSON.stringify({ type: 'task', id: String(task.id), title: task.name, subtitle: `Due: ${task.dueDate}` });
                      e.dataTransfer.setData('application/reactflow-entity', payload);
                      e.dataTransfer.setData('text/plain', payload);
                      e.dataTransfer.effectAllowed = 'copy';
                      (e.currentTarget as HTMLElement).style.opacity = '0.5';
                    }}
                    onDragEnd={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    onClick={() => setSelectedTask(task)}
                    className="border-b border-gray-100 dark:border-white/8 hover:bg-gray-50 dark:hover:bg-white/5 group cursor-pointer"
                  >
                    <td className="py-3 px-3 text-sm text-gray-900 dark:text-white">{narrow ? task.name.split(' ').slice(0, 2).join(' ') + '…' : task.name}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <StatusIndicator status={task.dueStatus} daysUntilDue={task.daysUntilDue} />
                        <span className="text-sm text-gray-900 dark:text-white">{task.dueDate}</span>
                      </div>
                    </td>
                    {!narrow && (
                      <td className="py-3 px-3">
                        <div className="flex items-center -space-x-2">
                          {task.assignedTo.map((initials, i) => (
                            <div key={i} title={initials} className={`w-6 h-6 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white`}>{initials}</div>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submissions */}
        <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10 flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">8 Submission Updates</h3>
            </div>
            <button onClick={() => onNavigateTab?.('submissions')} className="text-sm text-blue-600 hover:text-blue-700 transition-colors">See all</button>
          </div>
          <div className="flex border-b border-gray-200 dark:border-white/10 mb-3">
            {([
              { id: 'results' as const, label: 'Results Ready',        count: labResults.length         },
              { id: 'pending' as const, label: 'Awaiting Lab Response', count: pendingSubmissions.length },
            ]).map(tab => (
              <button key={tab.id} onClick={() => setSubmissionsTab(tab.id)}
                className={`pb-2.5 px-3 text-xs border-b-2 transition-colors whitespace-nowrap ${submissionsTab === tab.id ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>
                {tab.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${submissionsTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="case-brief-widget-scroll overflow-y-auto flex-1 min-h-0 space-y-2 pr-0.5">
            {submissionsTab === 'results' && labResults.map(result => (
              <div key={result.id} className="flex items-start justify-between p-3 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Submission {result.submissionId}</span>
                    <span className="flex-shrink-0 text-[10px] text-gray-400 dark:text-gray-500">{result.timeAgo}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{result.assignmentName}</span>
                  </div>
                  {result.files && result.files.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {result.files.slice(0, 2).map((f, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5 text-[10px] text-gray-600 dark:text-gray-400 flex-shrink-0">
                          <span className={`text-white rounded text-[8px] font-bold px-1 py-px leading-none ${f.ext === 'PDF' ? 'bg-red-600' : f.ext === 'DOCX' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                            {f.ext === 'DOCX' ? 'W' : f.ext}
                          </span>
                          <span className="max-w-[80px] truncate">{f.name}</span>
                        </span>
                      ))}
                      {result.files.length > 2 && (
                        <span className="relative group/overflow flex-shrink-0">
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded text-[10px] font-semibold cursor-default">
                            +{result.files.length - 2} more
                          </span>
                          <div className="absolute bottom-full left-0 mb-1.5 z-50 bg-[#12233A] text-white text-[10px] rounded shadow-lg px-2.5 py-1.5 opacity-0 group-hover/overflow:opacity-100 pointer-events-none transition-opacity min-w-max space-y-1">
                            {result.files.slice(2).map((f, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <span className={`text-white rounded text-[8px] font-bold px-1 py-px leading-none ${f.ext === 'PDF' ? 'bg-red-600' : f.ext === 'DOCX' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                                  {f.ext === 'DOCX' ? 'W' : f.ext}
                                </span>
                                {f.name}
                              </div>
                            ))}
                          </div>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => onNavigateTab?.('submissions')} className="flex-shrink-0 ml-3 mt-0.5 text-sm text-blue-600 hover:text-blue-700 transition-colors">Review</button>
              </div>
            ))}
            {submissionsTab === 'pending' && [...pendingSubmissions].sort((a, b) => b.sentDaysAgo - a.sentDaysAgo).map(sub => (
              <div key={sub.id} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Submission {sub.submissionId}</span>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">{sub.assignmentName}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Sent {sub.sentDaysAgo} days ago</span>
                  </div>
                </div>
                <button
                  onClick={() => onLabMessage?.(sub.submissionId)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />Message
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderUnusualBehaviors = () => (
    <div className="bg-white dark:bg-[#131f35] rounded-lg p-5 shadow-sm border border-gray-200 dark:border-white/10 h-[420px] flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Unusual Behaviors</h3>
      </div>
      <div className="case-brief-widget-scroll flex-1 min-h-0 overflow-y-auto space-y-2.5">
        {unusualBehaviors.map(behavior => {
          const ActionIcon = getActionIcon(behavior.actionType);
          return (
            <div key={behavior.id} className="p-3.5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              {/* Top row: icon + title + severity */}
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-9 h-9 ${behavior.iconBgColor} rounded-lg flex items-center justify-center`}>
                  <behavior.icon className={`w-4 h-4 ${behavior.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{behavior.title}</h4>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold ${behavior.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {behavior.severity === 'high' ? 'High' : 'Medium'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{behavior.description}</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                    <Clock className="w-3 h-3" /><span>{behavior.time}</span>
                  </div>
                </div>
              </div>

              {/* Actions + source numbers on same line */}
              <div className="flex items-center justify-between gap-2 mt-2.5">
                {/* Numbered source badges — number only, tooltip on hover */}
                <div className="flex items-center gap-1">
                  {behavior.sources.map((src, idx) => {
                    const isOpen = activeSource?.behaviorId === behavior.id && activeSource.idx === idx;
                    return (
                      <div key={idx} className={`relative ${!isOpen ? 'group/src' : ''}`}>
                        <button
                          onClick={e => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActiveSource(isOpen ? null : {
                              behaviorId: behavior.id,
                              idx,
                              anchor: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
                            });
                          }}
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                            isOpen
                              ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600'
                          }`}
                        >
                          {idx + 1}
                        </button>
                        {/* Hover tooltip — hidden when popover is open */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[#12233A] text-white text-[10px] rounded shadow-md whitespace-nowrap opacity-0 group-hover/src:opacity-100 pointer-events-none transition-opacity z-20">
                          {src.name}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleNextStepAction(behavior)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors whitespace-nowrap"
                >
                  <ActionIcon className="w-3 h-3 flex-shrink-0" />
                  {behavior.actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed-position source popover — escapes overflow-hidden */}
      {activeSource && (() => {
        const behavior = unusualBehaviors.find(b => b.id === activeSource.behaviorId);
        const src = behavior?.sources[activeSource.idx];
        if (!behavior || !src) return null;
        const { anchor } = activeSource;
        // Position above the badge; fall back to below if too close to top
        const spaceAbove = anchor.top;
        const popoverH = src.canOpenInViewer ? 116 : 88;
        const showAbove = spaceAbove > popoverH + 12;
        const top = showAbove ? anchor.top - popoverH - 8 : anchor.bottom + 8;
        return (
          <div
            ref={sourcePopoverRef}
            style={{ position: 'fixed', top, left: Math.max(8, anchor.left - 8), zIndex: 9999, width: 220 }}
            className="bg-white dark:bg-[#131f35] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-3"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  {activeSource.idx + 1}
                </span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{src.name}</span>
              </div>
              <button onClick={() => setActiveSource(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white flex-shrink-0 mt-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed mb-2.5">{src.detail}</p>
            {src.canOpenInViewer && (
              <button className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white rounded-lg text-[11px] font-semibold transition-colors">
                <ExternalLink className="w-3 h-3" />
                Open in Viewer
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );

  const renderCaseLeadMatches = () => (
    <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10 h-[420px] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white">Case Lead Matches</h3>
        <button onClick={() => onNavigateTab?.('subjects')} className="text-sm text-blue-600 hover:text-blue-700 transition-colors">See all</button>
      </div>
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-white/10 overflow-x-auto pb-1 flex-shrink-0">
        {leadMatchesTabs.map(tab => {
          const count  = tab.id === 'new' ? caseLeadMatches.filter(m => m.isNew).length : caseLeadMatches.filter(m => m.category === tab.id).length;
          const hasNew = tab.id === 'new' ? true : caseLeadMatches.some(m => m.category === tab.id && m.isNew);
          return (
            <button key={tab.id} onClick={() => setLeadMatchesTab(tab.id)}
              className={`relative pb-2 px-2.5 border-b-2 transition-colors whitespace-nowrap text-xs ${leadMatchesTab === tab.id ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>
              {tab.label}
              {count > 0 && tab.id !== 'new' && <span className="ml-1 px-1 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded text-[10px] font-semibold">{count}</span>}
              {hasNew && <span className="absolute top-0.5 right-0 w-1.5 h-1.5 bg-purple-600 rounded-full" />}
            </button>
          );
        })}
      </div>
      <div className="case-brief-widget-scroll flex-1 min-h-0 overflow-y-auto">
      <div className="grid grid-cols-1 gap-2">
        {visibleMatches.map(match => (
          <div
            key={match.id}
            draggable
            onDragStart={e => {
              const entityType = match.category === 'faces' ? 'subject' : match.category === 'locations' ? 'location' : 'entity';
              const payload = JSON.stringify({ type: entityType, id: String(match.id), title: match.title, subtitle: match.type });
              e.dataTransfer.setData('application/reactflow-entity', payload);
              e.dataTransfer.setData('text/plain', payload);
              e.dataTransfer.effectAllowed = 'copy';
              (e.currentTarget as HTMLElement).style.opacity = '0.5';
            }}
            onDragEnd={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            className="flex items-center justify-between gap-3 p-3 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-grab group relative"
          >
            {match.isNew && leadMatchesTab !== 'new' && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-purple-600 rounded-full" />}
            <div className={`flex-shrink-0 w-10 h-10 ${match.iconBgColor} rounded-lg flex items-center justify-center overflow-hidden ${match.isNew && leadMatchesTab !== 'new' ? 'ml-3' : ''}`}>
              {match.imageUrl ? <img src={match.imageUrl} alt={match.title} className="w-full h-full object-cover" /> : <match.icon className={`w-5 h-5 ${match.iconColor}`} />}
            </div>
            <div className="flex-1 min-w-0">
              {leadMatchesTab === 'new' && <p className="text-[10px] font-semibold text-gray-400 uppercase mb-0.5">{match.type}</p>}
              <p className="text-sm text-gray-900 dark:text-white truncate">{match.title}</p>
              {leadMatchesTab !== 'new' && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold">{match.matchCount} {match.matchCount === 1 ? 'match' : 'matches'}</span>}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => onNavigateTab?.(match.category === 'locations' ? 'locations' : match.category === 'events' ? 'events' : 'subjects')}
                className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
              >Review</button>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );

  const renderActivityLog = () => {
    const activeFilterCount =
      (activityScope !== 'all' ? 1 : 0) +
      (activityTypes.size < ACTIVITY_ACTION_TYPES.length ? 1 : 0) +
      (activityTimeframe !== 'all' ? 1 : 0);

    const filteredItems = caseActivityItems.filter(item =>
      (activityScope === 'all' || item.isMe) &&
      activityTypes.has(item.category) &&
      matchesActivityTimeframe(item.timestamp, activityTimeframe)
    );

    return (
    <div className="bg-white dark:bg-[#131f35] rounded-lg shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden h-[420px] flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Case Activity</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">This case only</span>
          <div className="relative" ref={activityFilterRef}>
            <button
              onClick={() => setActivityFilterOpen(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                activeFilterCount > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white'
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

            {activityFilterOpen && (
              <div className="absolute top-full right-0 mt-1.5 z-50 bg-white dark:bg-[#131f35] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 w-56 py-3">
                {/* User scope */}
                <div className="px-3 pb-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">User Scope</p>
                  {(['all', 'mine'] as const).map(scope => (
                    <label key={scope} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="radio"
                        name="activityScope"
                        value={scope}
                        checked={activityScope === scope}
                        onChange={() => setActivityScope(scope)}
                        className="accent-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{scope === 'all' ? 'All Activity' : 'My Activity'}</span>
                    </label>
                  ))}
                </div>

                <div className="mx-3 border-t border-gray-100 dark:border-white/8" />

                {/* Action types */}
                <div className="px-3 py-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Action Type</p>
                  {ACTIVITY_ACTION_TYPES.map(type => (
                    <label key={type.id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activityTypes.has(type.id)}
                        onChange={() => {
                          setActivityTypes(prev => {
                            const next = new Set(prev);
                            next.has(type.id) ? next.delete(type.id) : next.add(type.id);
                            return next;
                          });
                        }}
                        className="accent-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                    </label>
                  ))}
                </div>

                <div className="mx-3 border-t border-gray-100 dark:border-white/8" />

                {/* Timeframe */}
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
      </div>
      <div className="case-brief-widget-scroll flex-1 min-h-0 overflow-y-auto divide-y divide-gray-100 dark:divide-white/8">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-5 py-8">
            <ListFilter className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400 font-medium">No activity matches the current filters.</p>
          </div>
        ) : filteredItems.slice(0, activityVisibleCount).map(item => (
          <button key={item.id} onClick={() => onNavigateTab?.(item.navTab)}
            className="w-full text-left flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
            {item.actorType === 'human' ? (
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5"><User className="w-3.5 h-3.5 text-blue-600" /></div>
            ) : item.actorType === 'ai' ? (
              <div className="w-8 h-8 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0 mt-0.5"><Sparkles className="w-3.5 h-3.5 text-violet-600" /></div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5"><Cpu className="w-3.5 h-3.5 text-gray-500" /></div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{item.actor}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{item.timestamp}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">{item.action}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 mt-2" />
          </button>
        ))}
        {activityLoadingMore && [1, 2].map(i => (
          <div key={i} className="flex items-start gap-3 px-5 py-3.5 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-2/3" />
              <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-transparent flex-shrink-0">
        {activityVisibleCount < caseActivityItems.length && !activityLoadingMore ? (
          <button onClick={handleLoadMoreActivity} className="w-full text-xs text-blue-600 hover:text-blue-700 font-semibold text-center py-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">Load more activity</button>
        ) : !activityLoadingMore ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">All caught up · {caseActivityItems.length} events shown</p>
        ) : null}
      </div>
    </div>
    );
  };

  const WIDGET_RENDERERS: Record<WidgetId, () => React.ReactNode> = {
    'ai-zone':            renderAIZone,
    'tasks-submissions':  renderTasksSubmissions,
    'unusual-behaviors':  renderUnusualBehaviors,
    'case-lead-matches':  renderCaseLeadMatches,
    'activity-log':       renderActivityLog,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">

        {/* Edit mode grid-line overlay */}
        {isEditMode && (
          <div
            className="fixed inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: [
                'linear-gradient(to right, rgba(99,102,241,0.07) 1px, transparent 1px)',
                'linear-gradient(to bottom, rgba(99,102,241,0.07) 1px, transparent 1px)',
              ].join(','),
              backgroundSize: '32px 32px',
            }}
          />
        )}

        {/* Edit mode resize handle CSS */}
        {isEditMode && (
          <style>{`
            .react-resizable-handle { display: none; }
          `}</style>
        )}

        {/* ── Dashboard header: title + controls on one row ─────────── */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-base font-bold text-[#12233A] dark:text-white">Brief</h2>
          <div className="flex items-center gap-2 flex-wrap">
          {isEditMode ? (
            <>
              {/* Reset layout */}
              <button
                onClick={resetLayout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-colors shadow-sm"
                title="Reset all widgets to default positions and sizes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Layout
              </button>

              {/* Add Widget dropdown — only when there are hidden widgets */}
              {(() => {
                const hiddenWidgets = previewConfigs.filter(c => c.hidden);
                if (hiddenWidgets.length === 0) return null;
                return (
                  <div ref={addMenuRef} className="relative">
                    <button
                      onClick={() => setAddWidgetMenuOpen(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Widget
                      {hiddenWidgets.length > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-bold leading-none">
                          {hiddenWidgets.length}
                        </span>
                      )}
                    </button>
                    {addWidgetMenuOpen && (
                      <div className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#131f35] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 py-1.5 min-w-[200px]">
                        <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hidden Widgets</p>
                        {hiddenWidgets.map(c => (
                          <button
                            key={c.id}
                            onClick={() => restoreWidget(c.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-left"
                          >
                            <Plus className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            {WIDGET_LABELS[c.id]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="w-px h-5 bg-gray-200 dark:bg-white/10" />

              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 rounded-lg transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                Save Layout
              </button>
            </>
          ) : (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg transition-colors shadow-sm"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Customize Layout
            </button>
          )}
          </div>
        </div>

        {/* ── 1. KPI Cards — always locked ──────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { icon: AlertCircle, iconColor: 'text-red-600',    count: urgentTaskCount,       label: 'Urgent Tasks'              },
            { icon: TestTube,    iconColor: 'text-purple-600', count: labResults.length,     label: 'New Lab Results Came Back' },
            { icon: Link,        iconColor: 'text-green-600',  count: newMatchCount,         label: 'New Case Lead Matches'     },
            { icon: TrendingUp,  iconColor: 'text-orange-600', count: unusualBehaviorsCount, label: 'Unusual Behaviors'         },
          ] as const).map(({ icon: Icon, iconColor, count, label }) => (
            <div
              key={label}
              className={`bg-white dark:bg-[#131f35] rounded-lg py-3 px-4 shadow-sm border transition-shadow flex items-center gap-3 ${
                isEditMode ? 'border-gray-200 dark:border-white/10 opacity-60 cursor-not-allowed' : 'border-gray-200 dark:border-white/10 hover:shadow-md'
              }`}
            >
              {isEditMode && (
                <div className="absolute top-1 right-1 px-1 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-[8px] text-gray-400 font-bold uppercase tracking-wide">Locked</div>
              )}
              <Icon className={`flex-shrink-0 w-7 h-7 ${iconColor}`} />
              <div className="min-w-0">
                <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{count}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 2. Draggable / resizable widget grid ──────────────────── */}
        {(() => {
          const visibleConfigs = activeConfigs.filter(c => !c.hidden && (c.id !== 'ai-zone' || aiSuggestionsEnabled));
          const ubVisible  = visibleConfigs.some(c => c.id === 'unusual-behaviors');
          const clmVisible = visibleConfigs.some(c => c.id === 'case-lead-matches');
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {visibleConfigs.map((config, index) => {
                /* ── Unusual Behaviors + Case Lead Matches: hardcoded flex pair ── */
                if (config.id === 'unusual-behaviors') {
                  return (
                    <div key="ub-clm-row" className="col-span-1 lg:col-span-2 flex flex-col lg:flex-row gap-6 items-stretch">
                      <div className="flex-1 min-w-0">{renderUnusualBehaviors()}</div>
                      {clmVisible && <div className="flex-1 min-w-0">{renderCaseLeadMatches()}</div>}
                    </div>
                  );
                }
                if (config.id === 'case-lead-matches' && ubVisible) {
                  return null; // already rendered inside the UB wrapper above
                }
                /* ── All other widgets via DraggableWidgetCard ── */
                return (
                  <DraggableWidgetCard
                    key={config.id}
                    config={config}
                    index={index}
                    isEditMode={isEditMode}
                    onMove={moveWidget}
                    onToggleWidth={toggleWidth}
                    onResizeStart={handleResizeStart}
                    onRemove={removeWidget}
                  >
                    {WIDGET_RENDERERS[config.id]()}
                  </DraggableWidgetCard>
                );
              })}
              {visibleConfigs.length === 0 && isEditMode && (
                <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                  <p className="text-sm text-gray-400 mb-3">All widgets are hidden</p>
                  <p className="text-xs text-gray-400">Use <strong className="text-blue-500">Add Widget</strong> above to restore them</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Entity-creation toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 px-4 py-2.5 bg-[#12233A] text-white rounded-xl shadow-2xl text-sm font-medium pointer-events-none select-none">
            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            {toast}
          </div>
        )}

      </div>

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      {/* Subject Details Dialog */}
      <SubjectDetailsDialog
        subject={subjectDialog ? SUBJECT_DETAILS[subjectDialog] : null}
        onClose={() => setSubjectDialog(null)}
      />

    </DndProvider>
  );
}
