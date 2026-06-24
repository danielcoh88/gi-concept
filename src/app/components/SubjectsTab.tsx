import { Car, User, Sparkles, Plus, Globe, FileText, Phone, MapPin, Shield, EyeOff, Search, X, Loader2, CheckCircle, ChevronRight, ExternalLink, ListTodo } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CASE_TASKS } from './mockTasks';
import { useAISuggestions } from './useAISuggestions';

interface Subject {
  id: string;
  name: string;
  initials: string;
  type: 'person' | 'vehicle';
  role: 'Victim' | 'Witness' | 'Suspect';
  imageUrl?: string;
  x: number;
  y: number;
}

// Suggested subject position — upper-right of the canvas
const SUGGESTED_X = 680;
const SUGGESTED_Y = 110;

// ─── OSINT Search Sources ─────────────────────────────────────────────────────

interface OsintSource {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconBg: string;
}

const OSINT_SOURCES: OsintSource[] = [
  { id: 'social',   label: 'Social Media & Web',  description: 'Scan public profiles across major platforms and open web',       icon: Globe,    color: 'text-blue-600',   iconBg: 'bg-blue-50'   },
  { id: 'records',  label: 'Public Records',       description: 'Property, court filings, business registrations, voter rolls',    icon: FileText, color: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  { id: 'phone',    label: 'Phone & Email Lookup', description: 'Carrier data, email verification, and reverse lookups',           icon: Phone,    color: 'text-violet-600',  iconBg: 'bg-violet-50'  },
  { id: 'address',  label: 'Address & Location',   description: 'Historical address records, neighbours, and geo-linked data',      icon: MapPin,   color: 'text-orange-600',  iconBg: 'bg-orange-50'  },
  { id: 'criminal', label: 'Criminal Records',      description: 'Public criminal databases, arrest records, warrants',             icon: Shield,   color: 'text-red-600',    iconBg: 'bg-red-50'    },
  { id: 'darkweb',  label: 'Dark Web Scan',         description: 'Mentions on dark web forums, marketplaces, and paste sites',      icon: EyeOff,   color: 'text-gray-600',   iconBg: 'bg-gray-100'  },
];

// ─── Mock OSINT Results ───────────────────────────────────────────────────────

interface OsintResult {
  title: string;
  subtitle: string;
  confidence: 'High' | 'Medium' | 'Low';
  action: string;
}

const MOCK_RESULTS: Record<string, OsintResult[]> = {
  social: [
    { title: 'LinkedIn — John S. Miller',       subtitle: 'Port Operations Manager · Brooklyn, NY · 312 connections',          confidence: 'High',   action: 'Add to Profile' },
    { title: 'Facebook — John Miller',          subtitle: 'Account deactivated · Last active ~8 weeks ago',                    confidence: 'Medium', action: 'Add to Profile' },
    { title: 'Instagram — @j.miller_bk',        subtitle: '41 posts · Private account · Last post Jul 14',                     confidence: 'Medium', action: 'Add to Profile' },
    { title: 'Twitter/X — No profile found',    subtitle: 'No accounts matched this identity',                                  confidence: 'Low',    action: 'Dismiss'        },
  ],
  records: [
    { title: '412 Harbor View Rd, Brooklyn NY', subtitle: 'Registered owner since Apr 2019 · Assessed $1.2M',                   confidence: 'High',   action: 'Add to Profile' },
    { title: 'Miller Transport LLC',            subtitle: 'Business registration · Active since 2021 · Sole director',          confidence: 'High',   action: 'Add to Profile' },
    { title: 'Nassau County Civil Court',       subtitle: 'Small claims filing Mar 2023 — dispute settled',                     confidence: 'Medium', action: 'Add to Profile' },
  ],
  phone: [
    { title: '+1 (718) 555-0183',               subtitle: 'AT&T prepaid · Registered to Miller Transport LLC · Active',         confidence: 'High',   action: 'Add to Profile' },
    { title: 'j.miller.bk@gmail.com',           subtitle: 'Account created 2018 · 2 linked services detected',                  confidence: 'Medium', action: 'Add to Profile' },
  ],
  address: [
    { title: '72 Harbor View Rd, Brooklyn NY',  subtitle: 'Previous residence 2014–2019 · Now listed as storage unit',          confidence: 'High',   action: 'Add to Profile' },
    { title: '18 Port Side Ave, Brooklyn NY',   subtitle: 'Linked via utility records · Possible secondary address',             confidence: 'Medium', action: 'Add to Profile' },
  ],
  criminal: [
    { title: 'No criminal record found',        subtitle: 'No matches across NCIC, state, and county databases',                 confidence: 'High',   action: 'Dismiss'        },
  ],
  darkweb: [
    { title: '2 alias references found',        subtitle: '"j_miller_bk" mentioned on 2 Telegram channels — see report',        confidence: 'Low',    action: 'View Report'    },
  ],
};

function ConfidenceBadge({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  const styles = {
    High:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low:    'bg-gray-100 text-gray-500 border-gray-200',
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${styles[level]}`}>
      {level}
    </span>
  );
}

// ─── OSINT Panel ──────────────────────────────────────────────────────────────

function OsintPanel({
  subject,
  onClose,
}: {
  subject: Subject | null;
  onClose: () => void;
}) {
  const [runningId, setRunningId]     = useState<string | null>(null);
  const [completedId, setCompletedId] = useState<string | null>(null);

  const runSearch = (sourceId: string) => {
    setRunningId(sourceId);
    setCompletedId(null);
    setTimeout(() => {
      setRunningId(null);
      setCompletedId(sourceId);
    }, 1800);
  };

  const results = completedId ? MOCK_RESULTS[completedId] ?? [] : [];

  return (
    <div className="flex-shrink-0 w-80 flex flex-col border-l border-gray-200 dark:border-white/10 bg-white dark:bg-[#131f35] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/8 bg-[#F8F9FB] dark:bg-[#0f1929]">
        <div>
          <p className="text-xs font-bold text-[#12233A] dark:text-white tracking-wide">OSINT Search</p>
          {subject && (
            <p className="text-[11px] text-[#5E6974] dark:text-gray-400 mt-0.5">{subject.name} · {subject.role}</p>
          )}
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg text-[#5E6974] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-[#12233A] dark:hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* No subject selected */}
      {!subject && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 px-6 text-center">
          <Search className="w-8 h-8 text-gray-200" />
          <p className="text-xs font-semibold text-gray-400">Select a subject</p>
          <p className="text-[11px] text-gray-400 leading-relaxed">Click a subject on the canvas to run OSINT searches against their profile.</p>
        </div>
      )}

      {/* Subject selected — source list */}
      {subject && (
        <div className="flex-1 overflow-y-auto">
          {/* Source cards */}
          <div className="px-3 py-3 space-y-1.5">
            <p className="text-[10px] font-bold text-[#5E6974] dark:text-gray-500 uppercase tracking-widest px-1 mb-2">Search Sources</p>
            {OSINT_SOURCES.map((src) => {
              const Icon      = src.icon;
              const isRunning = runningId === src.id;
              const isDone    = completedId === src.id;
              return (
                <div
                  key={src.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer group ${
                    isDone
                      ? 'bg-[#F0F7FF] dark:bg-blue-900/20 border-[#0064CC]/20 dark:border-blue-700/40'
                      : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/8'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${src.iconBg}`}>
                    <Icon className={`w-3.5 h-3.5 ${src.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#12233A] dark:text-white truncate">{src.label}</p>
                    <p className="text-[10px] text-[#5E6974] dark:text-gray-400 leading-snug truncate">{src.description}</p>
                  </div>
                  <button
                    onClick={() => runSearch(src.id)}
                    disabled={isRunning}
                    className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                      isDone
                        ? 'bg-[#0064CC] text-white hover:bg-[#015297]'
                        : isRunning
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-400 cursor-not-allowed'
                        : 'bg-[#12233A] text-white hover:bg-[#1E3A5F] opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isRunning ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isDone ? (
                      <><CheckCircle className="w-3 h-3" />Results</>
                    ) : (
                      <>Run<ChevronRight className="w-3 h-3" /></>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Results */}
          {runningId && (
            <div className="mx-3 mb-3 px-4 py-5 rounded-xl border border-blue-100 bg-blue-50 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 text-[#0064CC] animate-spin" />
              <p className="text-xs font-semibold text-[#12233A] dark:text-white">Searching…</p>
              <p className="text-[11px] text-[#5E6974] dark:text-gray-400 text-center">Cross-referencing open sources against {subject.name}</p>
            </div>
          )}

          {completedId && results.length > 0 && (
            <div className="px-3 pb-4">
              <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-[#F8F9FB] dark:bg-[#0f1929] border-b border-gray-200 dark:border-white/8">
                  <p className="text-[10px] font-bold text-[#12233A] dark:text-white uppercase tracking-wide">
                    {OSINT_SOURCES.find((s) => s.id === completedId)?.label} Results
                  </p>
                  <span className="text-[10px] font-semibold text-[#0064CC] bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                    {results.length} found
                  </span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/8">
                  {results.map((r, i) => (
                    <div key={i} className="px-3 py-2.5 flex items-start gap-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-[11px] font-semibold text-[#12233A] dark:text-white truncate">{r.title}</p>
                        </div>
                        <p className="text-[10px] text-[#5E6974] dark:text-gray-400 leading-snug">{r.subtitle}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <ConfidenceBadge level={r.confidence} />
                          <button className="flex items-center gap-0.5 text-[10px] font-semibold text-[#0064CC] hover:underline transition-colors">
                            {r.action}
                            {r.action !== 'Dismiss' && <ExternalLink className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 border-t border-gray-100 dark:border-white/8 bg-[#F8F9FB] dark:bg-[#0f1929]">
                  <button className="w-full text-[10px] font-semibold text-[#0064CC] hover:underline text-center transition-colors">
                    Add all to subject profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Subject Node Hover Card ──────────────────────────────────────────────────

const STATUS_PILL: Record<string, string> = {
  'to-do':       'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400',
  'in-progress': 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
  'on-hold':     'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
  'done':        'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300',
};
const STATUS_LABEL: Record<string, string> = {
  'to-do': 'To Do', 'in-progress': 'In Progress', 'on-hold': 'On Hold', 'done': 'Done',
};

function SubjectHoverCard({
  subject,
  onRunOsint,
}: {
  subject: Subject;
  onRunOsint: (s: Subject) => void;
}) {
  const linkedTasks = CASE_TASKS.filter(
    t => t.linkedTo?.type === 'subject' && t.linkedTo.label === subject.name
  );

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[200] w-52 bg-white dark:bg-[#131f35] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 py-1 overflow-hidden pointer-events-auto">
      <div className="px-3 py-1.5 border-b border-gray-100 dark:border-white/8">
        <p className="text-[11px] font-bold text-[#12233A] dark:text-white truncate">{subject.name}</p>
        <p className="text-[10px] text-[#5E6974] dark:text-gray-400">{subject.role}</p>
      </div>
      <div className="px-2 py-1 space-y-0.5">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-[#12233A] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
          <User className="w-3 h-3 text-[#5E6974] flex-shrink-0" />
          View Profile
        </button>
        <button
          onClick={() => onRunOsint(subject)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-[#0064CC] hover:bg-blue-50 transition-colors text-left"
        >
          <Globe className="w-3 h-3 flex-shrink-0" />
          Run OSINT Search
        </button>
      </div>

      {linkedTasks.length > 0 && (
        <div className="mx-2 mb-1 mt-0.5 border border-gray-100 dark:border-white/10 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-1">
              <ListTodo className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tasks</span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{linkedTasks.length}</span>
          </div>
          {linkedTasks.map(t => (
            <div key={t.id} className="flex items-center justify-between gap-2 px-2 py-1.5 border-t border-gray-100 dark:border-white/8 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <span className="text-[10px] text-[#12233A] dark:text-gray-200 truncate flex-1">{t.name}</span>
              <span className={`flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded ${STATUS_PILL[t.status]}`}>
                {STATUS_LABEL[t.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SubjectsTab() {
  const aiEnabled                             = useAISuggestions();
  const [dismissed,       setDismissed]       = useState(false);
  // Reset individual dismiss whenever the global flag is re-enabled
  useEffect(() => { if (aiEnabled) setDismissed(false); }, [aiEnabled]);
  const showSuggestion = aiEnabled && !dismissed;
  const [osintPanelOpen,  setOsintPanelOpen]  = useState(false);
  const [osintSubject,    setOsintSubject]    = useState<Subject | null>(null);
  const [hoveredSubject,  setHoveredSubject]  = useState<string | null>(null);

  const subjects: Subject[] = [
    { id: '1', name: 'John Miller',   initials: 'JM', type: 'person',  role: 'Suspect',  imageUrl: 'https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200', x: 200, y: 300 },
    { id: '2', name: 'Sarah Chen',    initials: 'SC', type: 'person',  role: 'Victim',   imageUrl: 'https://images.unsplash.com/photo-1769636929388-99eff95d3bf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200', x: 500, y: 300 },
    { id: '3', name: 'Marcus Davis',  initials: 'MD', type: 'person',  role: 'Witness',  imageUrl: 'https://images.unsplash.com/photo-1762522926157-bcc04bf0b10a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200', x: 800, y: 300 },
    { id: '4', name: 'Robert Miller', initials: 'RM', type: 'person',  role: 'Witness',  imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200', x: 200, y: 100 },
    { id: '5', name: 'Tom Jackson',   initials: 'TJ', type: 'person',  role: 'Witness',  imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200', x: 400, y: 100 },
    { id: '6', name: 'Vehicle 1',     initials: 'V1', type: 'vehicle', role: 'Suspect',  x: 800, y: 500 },
  ];

  const openOsint = (subject: Subject) => {
    setOsintSubject(subject);
    setOsintPanelOpen(true);
    setHoveredSubject(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Victim':   return 'border-red-500 bg-red-50';
      case 'Suspect':  return 'border-orange-500 bg-orange-50';
      case 'Witness':  return 'border-blue-500 bg-blue-50';
      default:         return 'border-gray-300 bg-gray-50';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Victim':   return 'bg-red-100 text-red-700';
      case 'Suspect':  return 'bg-orange-100 text-orange-700';
      case 'Witness':  return 'bg-blue-100 text-blue-700';
      default:         return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0f1929]">

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#131f35]">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-[#12233A] dark:text-white">Subjects</span>
          <span className="text-[11px] font-semibold text-[#5E6974] dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{subjects.length}</span>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-[#0064CC] text-white rounded-lg text-sm font-semibold hover:bg-[#015297] transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Add Subject
        </button>
      </div>

      {/* ── Canvas + OSINT Panel ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Canvas */}
        <div className="relative flex-1 overflow-hidden" onMouseLeave={() => setHoveredSubject(null)}>

          {/* Connection lines */}
          <div className="absolute" style={{ left: '200px', top: '300px', width: '300px', height: '4px', backgroundColor: '#10b981', zIndex: 5, boxShadow: '0 0 10px #10b981' }} />
          <div className="absolute" style={{ left: '500px', top: '300px', width: '300px', height: '4px', backgroundColor: '#10b981', zIndex: 5, boxShadow: '0 0 10px #10b981' }} />
          <div className="absolute" style={{ left: '200px', top: '100px', width: '2px', height: '200px', background: 'repeating-linear-gradient(to bottom, #9ca3af 0, #9ca3af 5px, transparent 5px, transparent 10px)', zIndex: 5 }} />
          <div className="absolute text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-[#0f1929] px-1" style={{ left: '210px', top: '190px', zIndex: 6 }}>Father</div>
          <div className="absolute" style={{ left: '200px', top: '300px', width: '283px', height: '2px', background: 'repeating-linear-gradient(to right, #9ca3af 0, #9ca3af 5px, transparent 5px, transparent 10px)', transformOrigin: '0 0', transform: 'rotate(-45deg)', zIndex: 5 }} />
          <div className="absolute text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-[#0f1929] px-1" style={{ left: '290px', top: '180px', zIndex: 6 }}>Friend</div>
          <div className="absolute" style={{ left: '800px', top: '300px', width: '4px', height: '200px', backgroundColor: '#10b981', zIndex: 5, boxShadow: '0 0 10px #10b981' }} />

          {/* AI suggestion SVG */}
          {showSuggestion && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 6 }}>
              <line x1={SUGGESTED_X} y1={SUGGESTED_Y} x2={200} y2={300} stroke="#a855f7" strokeWidth="2" strokeDasharray="6 4" strokeOpacity="0.7" />
              <text x={(SUGGESTED_X + 200) / 2 - 8} y={(SUGGESTED_Y + 300) / 2 - 6} fill="#9333ea" fontSize="9" fontWeight="600" opacity="0.9">Alias contact</text>
              <line x1={SUGGESTED_X} y1={SUGGESTED_Y} x2={500} y2={300} stroke="#a855f7" strokeWidth="2" strokeDasharray="6 4" strokeOpacity="0.7" />
              <text x={(SUGGESTED_X + 500) / 2 + 10} y={(SUGGESTED_Y + 300) / 2 - 6} fill="#9333ea" fontSize="9" fontWeight="600" opacity="0.9">Co-located</text>
            </svg>
          )}

          {/* Subject nodes */}
          {subjects.map((subject) => {
            const taskCount = CASE_TASKS.filter(
              t => t.linkedTo?.type === 'subject' && t.linkedTo.label === subject.name
            ).length;
            return (
            <div
              key={subject.id}
              className="absolute"
              style={{ left: `${subject.x}px`, top: `${subject.y}px`, transform: 'translate(-50%, -50%)', zIndex: 100 }}
              onMouseEnter={() => setHoveredSubject(subject.id)}
            >
              <div className="relative flex flex-col items-center">
                {/* Hover card */}
                {hoveredSubject === subject.id && (
                  <SubjectHoverCard subject={subject} onRunOsint={openOsint} />
                )}
                {/* Circle */}
                <div
                  className={`w-28 h-28 rounded-full border-4 ${getRoleColor(subject.role)} flex items-center justify-center overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-shadow`}
                  onClick={() => openOsint(subject)}
                >
                  {subject.type === 'person' && subject.imageUrl ? (
                    <img src={subject.imageUrl} alt={subject.name} className="w-full h-full object-cover" />
                  ) : subject.type === 'vehicle' ? (
                    <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                      <Car className="w-14 h-14 text-white" />
                    </div>
                  ) : (
                    <User className="w-14 h-14 text-gray-400" />
                  )}
                </div>
                {/* OSINT active ring */}
                {osintSubject?.id === subject.id && (
                  <div className="absolute inset-0 w-28 h-28 rounded-full border-2 border-[#0064CC] animate-ping opacity-30 pointer-events-none" />
                )}
                <div className="mt-2 text-center">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">{subject.name}</div>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getRoleBadgeColor(subject.role)}`}>
                      {subject.role}
                    </span>
                    {taskCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                        <ListTodo className="w-2.5 h-2.5" />{taskCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            );
          })}

          {/* AI Suggested Subject */}
          {showSuggestion && (
            <div className="absolute" style={{ left: SUGGESTED_X, top: SUGGESTED_Y, transform: 'translate(-50%, -50%)', zIndex: 100 }}>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden shadow-lg" style={{ border: '4px dashed #a855f7', background: 'linear-gradient(135deg, #fb7185, #a855f7)' }}>
                    <span className="text-white text-2xl font-bold select-none">ER</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">Elena Rostova</div>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold mt-1 bg-red-100 text-red-700">Suspect</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button onClick={() => setDismissed(true)} className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-red-500 font-medium transition-colors px-1">Dismiss</button>
                  <button onClick={() => setDismissed(true)} className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-semibold hover:bg-purple-700 transition-colors">
                    <Plus className="w-2.5 h-2.5" />Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* OSINT Panel */}
        {osintPanelOpen && (
          <OsintPanel
            subject={osintSubject}
            onClose={() => { setOsintPanelOpen(false); setOsintSubject(null); }}
          />
        )}
      </div>
    </div>
  );
}
