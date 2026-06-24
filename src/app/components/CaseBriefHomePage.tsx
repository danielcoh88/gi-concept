import { useState, useRef } from 'react';
import {
  ListTodo, User, CalendarDays, PhoneCall, TestTube, MapPin, Layout,
  Send, Paperclip, AtSign, AlertCircle, Clock, ChevronRight,
  Network, X, Mic, MicOff, FileText, MessageSquare,
} from 'lucide-react';
import './CaseBriefHomePage.css';
import { UnusualBehaviorsWidget } from './UnusualBehaviorsWidget';
import { BriefCaseLeadMatchesWidget } from './BriefCaseLeadMatchesWidget';
import { CaseActivityWidget } from './CaseActivityWidget';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CaseBriefHomePageProps {
  onAIPrompt?: (prompt: string) => void;
  onNavigateTab?: (tab: string) => void;
  caseTitle?: string;
}

type MentionType = 'subject' | 'task' | 'file' | 'event';

interface MentionItem {
  id: string;
  type: MentionType;
  label: string;
  sub: string;
}

// ─── Circle config ────────────────────────────────────────────────────────────

const ACTION_CIRCLES = [
  { id: 'task',       icon: ListTodo,    label: 'Add Task',      from: '#f43f5e', to: '#e11d48', chipLabel: 'Task'         },
  { id: 'subject',    icon: User,        label: 'Add Subject',   from: '#a855f7', to: '#7c3aed', chipLabel: 'Subject'      },
  { id: 'event',      icon: CalendarDays,label: 'Add Event',     from: '#3b82f6', to: '#1d4ed8', chipLabel: 'Event'        },
  { id: 'cdr',        icon: PhoneCall,   label: 'Locate a call or Message', from: '#f59e0b', to: '#d97706', chipLabel: 'CDR' },
  { id: 'submission', icon: TestTube,    label: 'Submit to Lab', from: '#0d9488', to: '#0f766e', chipLabel: 'Submission'   },
  { id: 'patterns',   icon: Network,     label: 'Find Patterns', from: '#ec4899', to: '#be185d', chipLabel: 'Patterns'     },
  { id: 'locations',  icon: MapPin,      label: 'Find a Map route', from: '#06b6d4', to: '#0284c7', chipLabel: 'Location'  },
  { id: 'whiteboard', icon: Layout,      label: 'Create a Whiteboard', from: '#64748b', to: '#475569', chipLabel: 'Whiteboard' },
] as const;

type CircleId = typeof ACTION_CIRCLES[number]['id'];

const CHIP_PLACEHOLDERS: Partial<Record<CircleId, string>> = {
  task:       'Describe the task you want to create…',
  subject:    'Describe the subject to add…',
  event:      'Describe the event to log…',
  cdr:        'What do you want to analyze in the call detail records?',
  submission: 'Describe what you\'re submitting to the lab…',
  patterns:   'What patterns should I look for across subjects and events?',
  locations:  'Which location do you want to add or find?',
  whiteboard: 'Describe the whiteboard you want to create…',
};

const NAV_ONLY: CircleId[] = [];

const ACTION_AI_PROMPTS: Record<CircleId, string> = {
  task:       "I need to create a task for this case. Walk me through it.",
  subject:    "I want to add a new subject to this investigation. Help me fill in the details.",
  event:      "I need to log an event on the crimeline. What information do you need from me?",
  cdr:        "I want to locate a call or message in the evidence. Help me find it.",
  submission: "I need to submit evidence to the lab. Guide me through the process.",
  patterns:   "I want to find patterns across the evidence in this case. What should I look for?",
  locations:  "I need to trace a location or route. Help me investigate it on the map.",
  whiteboard: "I want to create a new whiteboard for this case. Help me set it up.",
};

// ─── Mention data ─────────────────────────────────────────────────────────────

const MENTION_ITEMS: MentionItem[] = [
  { id: 's1', type: 'subject', label: 'John Doe',                      sub: 'Suspect' },
  { id: 's2', type: 'subject', label: 'Jane Smith',                    sub: 'Witness' },
  { id: 's3', type: 'subject', label: 'Michael Torres',                sub: 'Person of Interest' },
  { id: 't1', type: 'task',    label: 'Complete Investigation Report',  sub: 'Overdue · Apr 29' },
  { id: 't2', type: 'task',    label: 'Surveillance Footage Analysis',  sub: 'Due Apr 30' },
  { id: 't3', type: 'task',    label: 'Witness Interview',              sub: 'Due May 1' },
  { id: 'f1', type: 'file',    label: 'Crime Scene Photos',             sub: 'PDF · 2.4 MB' },
  { id: 'f2', type: 'file',    label: 'Witness Statements',             sub: 'DOCX · 890 KB' },
  { id: 'f3', type: 'file',    label: 'CCTV Footage Analysis',          sub: 'PDF · 5.1 MB' },
  { id: 'e1', type: 'event',   label: 'Bank Robbery 9:45 AM',           sub: 'Apr 15, 2026' },
  { id: 'e2', type: 'event',   label: 'Getaway Vehicle Spotted',        sub: 'Apr 15, 2026' },
  { id: 'e3', type: 'event',   label: 'Suspect Identified',             sub: 'Apr 16, 2026' },
];

const MENTION_TYPE_META: Record<MentionType, { label: string; Icon: typeof User; color: string; bg: string }> = {
  subject: { label: 'Subjects', Icon: User,         color: 'text-purple-400', bg: 'bg-purple-500/15' },
  task:    { label: 'Tasks',    Icon: ListTodo,      color: 'text-orange-400', bg: 'bg-orange-500/15' },
  file:    { label: 'Files',    Icon: FileText,      color: 'text-blue-400',   bg: 'bg-blue-500/15'   },
  event:   { label: 'Events',   Icon: CalendarDays,  color: 'text-green-400',  bg: 'bg-green-500/15'  },
};

// ─── Static data ──────────────────────────────────────────────────────────────

const URGENT_TASKS = [
  { id: 1, name: 'Complete Investigation Report',  dueDate: 'Apr 29', overdue: true,  assignees: ['TH'] },
  { id: 2, name: 'Surveillance Footage Analysis',  dueDate: 'Apr 30', overdue: false, assignees: ['MB', 'SK'] },
  { id: 3, name: 'Witness Interview',              dueDate: 'May 1',  overdue: false, assignees: ['DL', 'JR', 'AM'] },
];

const LAB_RESULTS = [
  { id: 1, submissionId: '#A183', name: 'DNA Biological Sample',         timeAgo: '2 min ago',  files: ['PDF', 'UFDR'] },
  { id: 2, submissionId: '#B441', name: 'Blood Alcohol Analysis',        timeAgo: '10 min ago', files: ['PDF', 'DOCX'] },
  { id: 3, submissionId: '#C892', name: 'Fingerprint & Trace Evidence',  timeAgo: '25 min ago', files: ['PDF'] },
  { id: 4, submissionId: '#L021', name: 'Ballistics & Firearms',         timeAgo: '1 hour ago', files: ['DOCX', 'PDF'] },
  { id: 5, submissionId: '#M334', name: 'Fiber Trace Analysis',          timeAgo: '2 hours ago',files: ['PDF', 'DOCX'] },
  { id: 6, submissionId: '#N567', name: 'Digital & Multimedia Evidence', timeAgo: '3 hours ago',files: ['PDF'] },
  { id: 7, submissionId: '#O789', name: 'Physical Evidence Examination', timeAgo: '5 hours ago',files: ['UFDR', 'PDF'] },
  { id: 8, submissionId: '#P901', name: 'Hair & Fiber Comparison',       timeAgo: '8 hours ago',files: ['PDF'] },
];

const PENDING_SUBMISSIONS = [
  { id: 10, submissionId: '#H774', name: 'Digital & Multimedia Evidence',   sentDaysAgo: 20 },
  { id: 11, submissionId: '#F445', name: 'Ballistics & Firearms',           sentDaysAgo: 15 },
  { id: 12, submissionId: '#D201', name: 'DNA Biological Sample',           sentDaysAgo: 12 },
  { id: 13, submissionId: '#J256', name: 'Hair & Fiber Comparison',         sentDaysAgo: 10 },
  { id: 14, submissionId: '#E330', name: 'Fiber Trace Analysis',            sentDaysAgo: 8  },
  { id: 15, submissionId: '#G112', name: 'Fingerprint & Trace Evidence',    sentDaysAgo: 6  },
  { id: 16, submissionId: '#I903', name: 'Footwear Impression',             sentDaysAgo: 5  },
  { id: 17, submissionId: '#K088', name: 'Physical Evidence Examination',   sentDaysAgo: 3  },
];

const AVATAR_COLORS = [
  'from-blue-400 to-blue-600', 'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600', 'from-green-400 to-green-600',
  'from-orange-400 to-orange-600', 'from-teal-400 to-teal-600',
];

const FILE_EXT_COLORS: Record<string, string> = {
  PDF: 'bg-red-600', DOCX: 'bg-blue-600', UFDR: 'bg-orange-500',
};

const SUGGESTED_PROMPTS = [
  "What's new since yesterday?",
  'Summarize suspect activity',
  'What should I do next?',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CaseBriefHomePage({
  onAIPrompt,
  onNavigateTab,
  caseTitle = 'Downtown Robbery Investigation',
}: CaseBriefHomePageProps) {
  const [inputValue, setInputValue] = useState('');
  const [activeChip, setActiveChip] = useState<CircleId | null>(null);
  const [mentionChips, setMentionChips] = useState<MentionItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [submissionsTab, setSubmissionsTab] = useState<'results' | 'pending'>('results');
  const [submissionsExpanded, setSubmissionsExpanded] = useState(false);
  const [mention, setMention] = useState({ active: false, query: '', startIndex: 0, selectedIdx: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const chipConfig = ACTION_CIRCLES.find(c => c.id === activeChip);
  const placeholder = activeChip
    ? (CHIP_PLACEHOLDERS[activeChip] ?? 'Type your message…')
    : 'Ask anything about this case, or describe what you need to create…';

  // Filtered mention list
  const mentionFiltered = mention.active
    ? (mention.query
        ? MENTION_ITEMS.filter(i => i.label.toLowerCase().includes(mention.query.toLowerCase()))
        : MENTION_ITEMS)
    : [];

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed && !activeChip) return;
    const message = activeChip && trimmed
      ? `[${chipConfig?.chipLabel}] ${trimmed}`
      : trimmed || `[${chipConfig?.chipLabel}]`;
    setIsTransitioning(true);
    setTimeout(() => {
      onAIPrompt?.(message);
      setInputValue('');
      setActiveChip(null);
    }, 320);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const atMatch = before.match(/@([^\s@]*)$/);
    if (atMatch) {
      setMention(prev => ({
        ...prev,
        active: true,
        query: atMatch[1],
        startIndex: cursor - atMatch[0].length,
        selectedIdx: 0,
      }));
    } else if (mention.active) {
      setMention(prev => ({ ...prev, active: false }));
    }
  };

  const handleMentionSelect = (item: MentionItem) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart ?? inputValue.length;
    // Strip the @query from the text
    const before = inputValue.slice(0, mention.startIndex);
    const after = inputValue.slice(cursor);
    const cleaned = (before + after).replace(/\s+$/, '');
    setInputValue(cleaned);
    // Add as chip (no duplicates)
    setMentionChips(prev => prev.find(c => c.id === item.id) ? prev : [...prev, item]);
    setMention({ active: false, query: '', startIndex: 0, selectedIdx: 0 });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cleaned.length, cleaned.length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mention.active && mentionFiltered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMention(prev => ({ ...prev, selectedIdx: Math.min(prev.selectedIdx + 1, mentionFiltered.length - 1) }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMention(prev => ({ ...prev, selectedIdx: Math.max(prev.selectedIdx - 1, 0) }));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleMentionSelect(mentionFiltered[mention.selectedIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setMention({ active: false, query: '', startIndex: 0, selectedIdx: 0 });
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAddContextClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart ?? inputValue.length;
    const before = inputValue.slice(0, cursor);
    const after = inputValue.slice(cursor);
    const prefix = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
    const newValue = `${before}${prefix}@${after}`;
    const atIndex = before.length + prefix.length;
    setInputValue(newValue);
    setMention({ active: true, query: '', startIndex: atIndex, selectedIdx: 0 });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(atIndex + 1, atIndex + 1);
    }, 0);
  };

  const handleCircleClick = (id: CircleId) => {
    if (NAV_ONLY.includes(id)) {
      onNavigateTab?.(id);
      return;
    }
    const prompt = ACTION_AI_PROMPTS[id];
    if (prompt) {
      setIsTransitioning(true);
      setTimeout(() => {
        onAIPrompt?.(prompt);
      }, 320);
      return;
    }
    setActiveChip(prev => (prev === id ? null : id));
    textareaRef.current?.focus();
  };

  // Group items for the unfiltered view
  const mentionGroups = (['subject', 'task', 'file', 'event'] as MentionType[]).map(type => ({
    type,
    meta: MENTION_TYPE_META[type],
    items: MENTION_ITEMS.filter(i => i.type === type),
  }));

  return (
    <div className={`brief-bg flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
      <div className="flex flex-col items-center px-6 pt-12 pb-12 max-w-4xl mx-auto w-full">

        {/* Greeting */}
        <h1 className="text-3xl font-bold text-[#12233A] dark:text-white mb-1.5 text-center">
          Hi Daniel,
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">
          What would you like to investigate today?
        </p>

        {/* Chat input — animated rainbow gradient border */}
        <div className="w-[75%] mb-8 relative">
          <div className="brief-animated-border p-[2px] rounded-2xl">
            <div className="rounded-[14px] bg-white dark:bg-[#131f35] px-5 py-4">

              {/* Chips row — action chip + mention chips */}
              {(activeChip || mentionChips.length > 0) && (
                <div className="flex items-center gap-1.5 flex-wrap mb-3 pb-3 border-b border-gray-100 dark:border-white/10">
                  {activeChip && chipConfig && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                      style={{
                        background: `${chipConfig.from}18`,
                        borderColor: `${chipConfig.from}40`,
                        color: chipConfig.from,
                      }}
                    >
                      <chipConfig.icon className="w-3 h-3" />
                      {chipConfig.chipLabel}
                      <button onClick={() => setActiveChip(null)} className="ml-0.5 hover:opacity-70 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {mentionChips.map(chip => {
                    const meta = MENTION_TYPE_META[chip.type];
                    const Icon = meta.Icon;
                    return (
                      <span
                        key={chip.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-white/10 ${meta.bg} ${meta.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        {chip.label}
                        <button
                          onClick={() => setMentionChips(prev => prev.filter(c => c.id !== chip.id))}
                          className="ml-0.5 hover:opacity-70 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Textarea with dropdown anchored below it */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setTimeout(() => setMention(prev => ({ ...prev, active: false })), 150)}
                  placeholder={placeholder}
                  className="w-full bg-transparent text-[#12233A] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm resize-none focus:outline-none min-h-[36px] leading-relaxed"
                  rows={2}
                />

                {/* @mention dropdown — anchored below the textarea */}
                {mention.active && mentionFiltered.length > 0 && (
                  <div className="absolute top-full left-0 w-72 mt-1 z-50 rounded-xl bg-[#1c2640] border border-white/10 shadow-2xl overflow-hidden">
                    <div className="max-h-72 overflow-y-auto py-1">
                      {mention.query ? (
                        mentionFiltered.map((item, i) => {
                          const meta = MENTION_TYPE_META[item.type];
                          const Icon = meta.Icon;
                          return (
                            <button
                              key={item.id}
                              onMouseDown={e => { e.preventDefault(); handleMentionSelect(item); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${i === mention.selectedIdx ? 'bg-white/10' : 'hover:bg-white/6'}`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                                <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm text-white truncate">{item.label}</div>
                                <div className="text-[11px] text-gray-400 truncate">{item.sub}</div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        mentionGroups.map(({ type, meta, items }) => {
                          const Icon = meta.Icon;
                          const startIdx = MENTION_ITEMS.findIndex(i => i.type === type);
                          return (
                            <div key={type}>
                              <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                {meta.label}
                              </div>
                              {items.map((item, localIdx) => {
                                const globalIdx = startIdx + localIdx;
                                return (
                                  <button
                                    key={item.id}
                                    onMouseDown={e => { e.preventDefault(); handleMentionSelect(item); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${globalIdx === mention.selectedIdx ? 'bg-white/10' : 'hover:bg-white/6'}`}
                                  >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                                      <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm text-white truncate">{item.label}</div>
                                      <div className="text-[11px] text-gray-400 truncate">{item.sub}</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested prompts — visible only when input is idle */}
              {!inputValue && !activeChip && (
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  {SUGGESTED_PROMPTS.map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setInputValue(prompt);
                        textareaRef.current?.focus();
                      }}
                      className="px-3 py-1.5 rounded-full text-xs border border-gray-200 dark:border-white/15 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 hover:border-purple-400/60 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all duration-150"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-1">
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    <Paperclip className="w-3.5 h-3.5" />
                    Attach
                  </button>
                  <button
                    onClick={handleAddContextClick}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <AtSign className="w-3.5 h-3.5" />
                    Add context
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRecording(r => !r)}
                    title={isRecording ? 'Stop recording' : 'Start voice recording'}
                    className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isRecording
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isRecording && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!inputValue.trim() && !activeChip}
                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white shadow-sm hover:from-purple-600 hover:to-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Action circles */}
        <div className="w-full mb-12 overflow-x-auto py-3 px-4">
          <div className="flex items-start justify-center gap-6 min-w-max mx-auto">
            {ACTION_CIRCLES.map(action => {
              const Icon = action.icon;
              const isActive = activeChip === action.id;
              return (
                <button
                  key={action.id}
                  onClick={() => handleCircleClick(action.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-200"
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${action.from}, ${action.to})`
                        : `linear-gradient(135deg, ${action.from}cc, ${action.to}cc)`,
                      boxShadow: isActive ? `0 0 0 3px ${action.from}40` : undefined,
                      transform: isActive ? 'scale(1.12)' : undefined,
                    }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span
                    className={`text-[11px] font-medium text-center leading-tight max-w-[76px] transition-colors ${isActive ? '' : 'text-gray-500 dark:text-gray-300'}`}
                    style={{ color: isActive ? action.from : undefined }}
                  >
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-gray-200 dark:border-white/10 mb-12" />

        {/* Urgent Tasks */}
        <div className="w-full mb-12">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-[#12233A] dark:text-white">{URGENT_TASKS.length} Urgent Tasks</h2>
            </div>
            <button
              onClick={() => onNavigateTab?.('tasks')}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {URGENT_TASKS.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  {task.overdue ? (
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[9px] font-bold leading-none">!</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-orange-400 flex-shrink-0" />
                  )}
                  <p className="text-xs font-semibold text-[#12233A] dark:text-white leading-snug">{task.name}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {task.dueDate}
                  </div>
                  <div className="flex -space-x-1.5">
                    {task.assignees.map((initials, j) => (
                      <div
                        key={j}
                        title={initials}
                        className={`w-5 h-5 rounded-full bg-gradient-to-br ${AVATAR_COLORS[j % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[8px] font-bold border border-white dark:border-[#0c1220]`}
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submission Updates */}
        <div className="w-full mb-12">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TestTube className="w-4 h-4 text-purple-500" />
              <h2 className="text-sm font-bold text-[#12233A] dark:text-white">
                {LAB_RESULTS.length + PENDING_SUBMISSIONS.length} Submission Updates
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab?.('submissions')}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-white/10 mb-3">
            {([
              { id: 'results' as const, label: 'Results Ready',         count: LAB_RESULTS.length         },
              { id: 'pending' as const, label: 'Awaiting Lab Response',  count: PENDING_SUBMISSIONS.length },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => { setSubmissionsTab(tab.id); setSubmissionsExpanded(false); }}
                className={`pb-2.5 px-3 text-xs border-b-2 transition-colors whitespace-nowrap ${
                  submissionsTab === tab.id
                    ? 'border-blue-500 text-blue-500 font-semibold'
                    : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  submissionsTab === tab.id
                    ? 'bg-blue-500/15 text-blue-500'
                    : 'bg-gray-100 dark:bg-white/8 text-gray-400'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Results Ready */}
          {submissionsTab === 'results' && (() => {
            const visible = submissionsExpanded ? LAB_RESULTS : LAB_RESULTS.slice(0, 3);
            const hidden  = LAB_RESULTS.length - 3;
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {visible.map(result => (
                    <div
                      key={result.id}
                      onClick={() => onNavigateTab?.('submissions')}
                      className="p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[9px] font-bold leading-none">✓</span>
                        </div>
                        <p className="text-xs font-semibold text-[#12233A] dark:text-white leading-snug">{result.name}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />{result.timeAgo}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {result.files.map((ext, i) => (
                            <span key={i} className={`text-white rounded text-[9px] font-bold px-1.5 py-0.5 ${FILE_EXT_COLORS[ext] ?? 'bg-gray-500'}`}>{ext}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {!submissionsExpanded && hidden > 0 && (
                  <button onClick={() => setSubmissionsExpanded(true)} className="w-full mt-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-dashed border-blue-200 dark:border-blue-400/20 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                    Show {hidden} more
                  </button>
                )}
                {submissionsExpanded && hidden > 0 && (
                  <button onClick={() => setSubmissionsExpanded(false)} className="w-full mt-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    Show less
                  </button>
                )}
              </>
            );
          })()}

          {/* Awaiting Lab Response */}
          {submissionsTab === 'pending' && (() => {
            const sorted  = [...PENDING_SUBMISSIONS].sort((a, b) => b.sentDaysAgo - a.sentDaysAgo);
            const visible  = submissionsExpanded ? sorted : sorted.slice(0, 3);
            const hidden   = sorted.length - 3;
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {visible.map(sub => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex-shrink-0" />
                        <p className="text-xs font-semibold text-[#12233A] dark:text-white leading-snug">{sub.name}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />Sent {sub.sentDaysAgo}d ago
                        </div>
                        <button
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-white/8 hover:bg-gray-100 dark:hover:bg-white/15 border border-gray-200 dark:border-white/15 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {!submissionsExpanded && hidden > 0 && (
                  <button onClick={() => setSubmissionsExpanded(true)} className="w-full mt-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-dashed border-blue-200 dark:border-blue-400/20 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                    Show {hidden} more
                  </button>
                )}
                {submissionsExpanded && hidden > 0 && (
                  <button onClick={() => setSubmissionsExpanded(false)} className="w-full mt-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    Show less
                  </button>
                )}
              </>
            );
          })()}
        </div>

        {/* Divider */}

        <UnusualBehaviorsWidget onNavigateTab={onNavigateTab} />
        <BriefCaseLeadMatchesWidget onNavigateTab={onNavigateTab} />

        <CaseActivityWidget onNavigateTab={onNavigateTab} />

      </div>
    </div>
  );
}
