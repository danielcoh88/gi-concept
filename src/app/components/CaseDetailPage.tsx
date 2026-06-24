import {
  FileText,
  ListTodo,
  Users,
  Layout,
  Map,
  Clock,
  MoreVertical,
  ArrowLeft,
  LayoutDashboard,
  Sparkles,
  MessageSquare,
  Mic,
  BookOpen,
  Plus,
  X,
  Car,
  User,
  Pencil,
  MapPin,
  Package,
  ChevronRight,
  ChevronDown,
  PanelLeftOpen,
  PanelLeftClose,
  CalendarDays,
  Upload,
  CheckCircle,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAISuggestions, toggleAISuggestions } from './useAISuggestions';
import { CaseBriefContent } from './CaseBriefContent';
import { CaseBriefHomePage } from './CaseBriefHomePage';
import { SubjectsTab } from './SubjectsTab';
import { AIWorkspacePage } from './AIWorkspacePage';
import { WhiteboardsPage } from './WhiteboardsPage';
import { CaseWhiteboardPanel } from './CaseWhiteboardPanel';
import { CaseChatPanel } from './CaseChatPanel';
import { CaseTasksPanel } from './CaseTasksPanel';
import { EventsTimelinePage, type CaseEvent } from './EventsTimelinePage';
import { LocationsPage } from './LocationsPage';
import { CaseFilesPage } from './CaseFilesPage';
import { CaseTasksPage } from './CaseTasksPage';
import { CaseSubmissionsPage } from './CaseSubmissionsPage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CaseDetailPageProps {
  caseId: string;
  onBack: () => void;
  onOpenAIWorkspace?: () => void;
}

type ActiveTab =
  | 'brief' | 'files' | 'tasks' | 'submissions'
  | 'subjects' | 'whiteboard' | 'locations' | 'events' | 'timeline' | 'crimelines' | 'notes'
  | 'cellebrite-ai';

interface CaseLocation {
  id: string;
  name: string;
  address: string;
  detail?: string;
}

// ─── Field Row ────────────────────────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-[#5E6974] dark:text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-medium text-[#12233A] dark:text-white">{value || '—'}</div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ label, count, onAdd, addTitle }: {
  label: string; count?: number; onAdd?: () => void; addTitle?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-[#5E6974] dark:text-gray-400 uppercase tracking-wider">{label}</span>
        {count !== undefined && <span className="text-[10px] text-[#5E6974] dark:text-gray-400">({count})</span>}
      </div>
      {onAdd && (
        <button onClick={onAdd} title={addTitle}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <Plus className="w-3 h-3 text-[#5E6974] dark:text-gray-400" />
        </button>
      )}
    </div>
  );
}

// ─── Location Item ────────────────────────────────────────────────────────────

function LocationItem({ location }: { location: CaseLocation }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 dark:border-white/8 last:border-b-0 group">
      <MapPin className="w-3.5 h-3.5 text-[#0064CC] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-[#12233A] dark:text-white truncate">{location.name}</div>
        <div className="text-[10px] text-[#5E6974] dark:text-gray-400 truncate">{location.address}</div>
      </div>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded">
        <MoreVertical className="w-3 h-3 text-[#5E6974] dark:text-gray-400" />
      </button>
    </div>
  );
}

// ─── Event Item ───────────────────────────────────────────────────────────────

function EventItem({ event }: { event: CaseEvent }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 dark:border-white/8 last:border-b-0 group">
      <div className="flex-shrink-0 mt-1.5">
        <div className="w-2 h-2 rounded-full bg-[#0064CC]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-[#12233A] dark:text-white truncate">{event.name}</div>
        <div className="text-[10px] text-[#5E6974] dark:text-gray-400">{event.date} · {event.time}</div>
      </div>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded">
        <MoreVertical className="w-3 h-3 text-[#5E6974] dark:text-gray-400" />
      </button>
    </div>
  );
}

// ─── Case Details Panel ───────────────────────────────────────────────────────

interface CaseDetailsPanelProps {
  caseData: ReturnType<typeof buildCaseData>;
  onClose: () => void;
  onNavigateToLocations: () => void;
  onNavigateToEvents: () => void;
}

function CaseDetailsPanel({ caseData, onClose, onNavigateToLocations, onNavigateToEvents }: CaseDetailsPanelProps) {
  const MAX = 3;
  const shownLocs   = caseData.locations.slice(0, MAX);
  const shownEvents = caseData.events.slice(0, MAX);
  const moreLocs    = caseData.locations.length > MAX;
  const moreEvents  = caseData.events.length > MAX;

  return (
    <div className="w-72 flex-shrink-0 bg-white dark:bg-[#131f35] border-r border-gray-200 dark:border-white/10 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/8 flex-shrink-0">
        <span className="text-sm font-bold text-[#12233A] dark:text-white">Case Details</span>
        <div className="flex items-center gap-0.5">
          <button title="Edit" className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <Pencil className="w-3.5 h-3.5 text-[#5E6974] dark:text-gray-400" />
          </button>
          <button onClick={onClose} title="Close" className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <X className="w-3.5 h-3.5 text-[#5E6974] dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div className="space-y-3">
          <FieldRow label="Creation date"        value={caseData.crimeDetails.creationDate} />
          <FieldRow label="Most serious offense"  value={caseData.crimeDetails.mostSeriousOffense} />
          <FieldRow label="Offense date"          value={caseData.crimeDetails.offenseDate} />
          <FieldRow label="Description"           value={caseData.crimeDetails.description || '—'} />
        </div>

        <div className="border-t border-gray-100 dark:border-white/8" />

        <div>
          <SectionHeader label="Locations" count={caseData.locations.length}
            onAdd={() => {}} addTitle="Add location" />
          {caseData.locations.length === 0 ? (
            <div className="text-center py-5">
              <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-[10px] text-[#5E6974] dark:text-gray-400 leading-relaxed">No locations added yet.</p>
            </div>
          ) : (
            <>
              {shownLocs.map((l) => <LocationItem key={l.id} location={l} />)}
              <button onClick={onNavigateToLocations}
                className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-[#0064CC] hover:text-[#015297] font-medium py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                {moreLocs ? `Show all locations (${caseData.locations.length})` : 'Open in map'}
                <ChevronRight className="w-3 h-3" />
              </button>
            </>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-white/8" />

        <div>
          <SectionHeader label="Events" count={caseData.events.length}
            onAdd={() => {}} addTitle="Add event" />
          {caseData.events.length === 0 ? (
            <div className="text-center py-5">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-[10px] text-[#5E6974] dark:text-gray-400 leading-relaxed">No events yet.</p>
            </div>
          ) : (
            <>
              {shownEvents.map((e) => <EventItem key={e.id} event={e} />)}
              {moreEvents && (
                <button onClick={onNavigateToEvents}
                  className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-[#0064CC] hover:text-[#015297] font-medium py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  Show all events ({caseData.events.length})
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mock Data Builder ────────────────────────────────────────────────────────

function buildCaseData(caseId: string) {
  return {
    id: caseId,
    title: 'Downtown Robbery Investigation',
    thumbnailUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?crop=entropy&cs=tinysrgb&fit=crop&w=72&h=72&q=80',
    caseOfficer: { name: 'Mark Brown', initials: 'MB' },
    unit: 'Homicide',
    createdDate: '2026-04-15',
    createdBy: 'Sarah Kim',
    caseAge: '15 days',
    status: 'Active Investigation',
    collaborators: [
      { initials: 'MB', name: 'Mark Brown', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=faces&fit=crop&w=56&h=56&q=80' },
      { initials: 'SK', name: 'Sarah Kim',  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=faces&fit=crop&w=56&h=56&q=80' },
      { initials: 'DL', name: 'David Lee',  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=faces&fit=crop&w=56&h=56&q=80' },
    ],
    crimeDetails: {
      creationDate:       'Jul 21, 2023',
      mostSeriousOffense: 'Felony',
      offenseDate:        'Jul 21, 2023',
      description:        'Armed robbery at downtown jewelry store',
    },
    locations: [
      { id: 'l1', name: 'Crime Scene',        address: 'Netanya Bloch St 34'       },
      { id: 'l2', name: 'Gas Station',         address: 'Shell — Main St & 5th Ave' },
      { id: 'l3', name: "Suspect's Residence", address: '72 Harbor View Rd'         },
      { id: 'l4', name: 'Witness Home',        address: '15 Elm Street, Apt 4B'    },
    ] as CaseLocation[],
    events: [
      { id: 'e1', name: '911 Call Received',         date: 'Jul 21, 2023', time: '23:42', description: "Emergency call placed from victim's phone.", type: 'communication' as const },
      { id: 'e2', name: 'Police Arrive on Scene',     date: 'Jul 21, 2023', time: '23:51', description: 'First responders secured the perimeter.',  address: 'Netanya Bloch St 34', type: 'procedure' as const },
      { id: 'e3', name: 'Suspect Identified on CCTV', date: 'Jul 22, 2023', time: '00:15', description: 'Gas station footage reviewed.',             type: 'discovery'    as const },
      { id: 'e4', name: 'Search Warrant Issued',      date: 'Jul 22, 2023', time: '08:30', description: 'Warrant approved by magistrate court.',     type: 'procedure'    as const },
      { id: 'e5', name: 'Suspect Apprehended',         date: 'Jul 22, 2023', time: '11:45', description: 'John Miller arrested at 72 Harbor View Rd.', address: '72 Harbor View Rd', type: 'incident' as const },
    ] as CaseEvent[],
  };
}

// ─── Status styles ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  'Active Investigation': 'bg-blue-100 text-blue-700 border-blue-200',
  'Under Review':         'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Closed':               'bg-gray-100 text-gray-500 border-gray-200',
  'Resolved':             'bg-green-100 text-green-700 border-green-200',
  'Open':                 'bg-blue-100 text-blue-700 border-blue-200',
};

// ─── Quick Add ────────────────────────────────────────────────────────────────

const QUICK_ADD_OPTIONS = [
  { id: 'task',       icon: ListTodo,    label: 'Task',       desc: 'Assign and track an action item',    color: 'text-orange-600', bg: 'bg-orange-50'  },
  { id: 'file',       icon: FileText,    label: 'Case File',  desc: 'Upload a file to this case',         color: 'text-blue-600',   bg: 'bg-blue-50'    },
  { id: 'submission', icon: Package,     label: 'Submission', desc: 'Submit evidence to the lab',         color: 'text-violet-600', bg: 'bg-violet-50'  },
  { id: 'location',   icon: MapPin,      label: 'Location',   desc: 'Add a location or case lead',        color: 'text-emerald-600',bg: 'bg-emerald-50' },
  { id: 'event',      icon: CalendarDays,label: 'Event',      desc: 'Log an event to the timeline',      color: 'text-rose-600',   bg: 'bg-rose-50'    },
  { id: 'whiteboard', icon: Layout,      label: 'Whiteboard', desc: 'Open the case whiteboard canvas',   color: 'text-gray-600',   bg: 'bg-gray-100'   },
] as const;

type QuickAddEntity = typeof QUICK_ADD_OPTIONS[number]['id'];

const MOCK_ASSIGNEES = ['Mark Brown', 'Sarah Kim', 'David Lee', 'Jennifer Roberts', 'Alex Martinez'];

function QuickAddModal({ entity, onClose, onSuccess }: {
  entity: QuickAddEntity;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [taskName,      setTaskName]      = useState('');
  const [assignee,      setAssignee]      = useState('');
  const [priority,      setPriority]      = useState('Medium');
  const [dueDate,       setDueDate]       = useState('');
  const [description,   setDescription]   = useState('');
  const [fileName,      setFileName]      = useState('');
  const [folder,        setFolder]        = useState('General');
  const [subType,       setSubType]       = useState('Physical');
  const [subPriority,   setSubPriority]   = useState('Standard');
  const [locName,       setLocName]       = useState('');
  const [locAddress,    setLocAddress]    = useState('');
  const [locType,       setLocType]       = useState('Address');
  const [eventDesc,     setEventDesc]     = useState('');
  const [eventDate,     setEventDate]     = useState('');
  const [eventTime,     setEventTime]     = useState('');
  const [eventType,     setEventType]     = useState('Incident');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cfg = QUICK_ADD_OPTIONS.find(o => o.id === entity)!;
  const Icon = cfg.icon;

  const labelCls = 'block text-xs font-semibold text-[#5E6974] mb-1';
  const inputCls = 'w-full px-3 py-2 bg-white dark:bg-[#0f1929] border border-gray-200 dark:border-white/10 rounded-lg text-sm text-[#12233A] dark:text-white outline-none focus:border-[#0064CC] focus:ring-1 focus:ring-[#0064CC]/20 transition-all placeholder-gray-300 dark:placeholder-gray-600';
  const selectCls = inputCls + ' cursor-pointer';

  const handleSubmit = () => {
    const labels: Record<QuickAddEntity, string> = {
      task:       `Task "${taskName || 'Untitled'}" created`,
      file:       `File "${fileName || 'untitled'}" uploaded`,
      submission: 'Lab submission created',
      location:   `Location "${locName || 'Untitled'}" added`,
      event:      `Event logged to timeline`,
      whiteboard: 'Whiteboard opened',
    };
    onSuccess(labels[entity]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/30 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div className="w-[420px] bg-white dark:bg-[#131f35] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden" onMouseDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-white/8">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
            <Icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#12233A] dark:text-white">
              {entity === 'file' ? 'Upload Case File' : entity === 'whiteboard' ? 'Open Whiteboard' : `Add ${cfg.label}`}
            </p>
            <p className="text-[11px] text-[#5E6974] dark:text-gray-400">{cfg.desc}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-5 space-y-4">

          {entity === 'task' && (<>
            <div>
              <label className={labelCls}>Task name <span className="text-red-400">*</span></label>
              <input className={inputCls} placeholder="e.g. Interview witness at Harbor View Rd" value={taskName} onChange={e => setTaskName(e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Assigned to</label>
                <select className={selectCls} value={assignee} onChange={e => setAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {MOCK_ASSIGNEES.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Priority</label>
                <select className={selectCls} value={priority} onChange={e => setPriority(e.target.value)}>
                  {['Low','Medium','High','Urgent'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Due date</label>
              <input type="date" className={inputCls} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Description <span className="text-gray-300 font-normal">optional</span></label>
              <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Additional context…" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </>)}

          {entity === 'file' && (<>
            <div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={e => setFileName(e.target.files?.[0]?.name ?? '')} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#0064CC] hover:bg-blue-50/40 transition-all group"
              >
                <Upload className="w-6 h-6 text-gray-300 group-hover:text-[#0064CC] transition-colors" />
                {fileName
                  ? <span className="text-sm font-semibold text-[#12233A]">{fileName}</span>
                  : <><span className="text-sm font-medium text-gray-400">Click to upload or drag & drop</span><span className="text-[11px] text-gray-300">Any file type · max 500 MB</span></>}
              </button>
            </div>
            <div>
              <label className={labelCls}>Description <span className="text-gray-300 font-normal">optional</span></label>
              <input className={inputCls} placeholder="What is this file?" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Folder</label>
              <select className={selectCls} value={folder} onChange={e => setFolder(e.target.value)}>
                {['General','Evidence','Reports','Lab Deliverables','Subject Files'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </>)}

          {entity === 'submission' && (<>
            <div>
              <label className={labelCls}>Item description <span className="text-red-400">*</span></label>
              <input className={inputCls} placeholder="e.g. Samsung Galaxy S21 — IMEI 35-456789" value={taskName} onChange={e => setTaskName(e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Evidence type</label>
                <select className={selectCls} value={subType} onChange={e => setSubType(e.target.value)}>
                  {['Physical','Digital','Biological','Chemical','Documentary'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Priority</label>
                <select className={selectCls} value={subPriority} onChange={e => setSubPriority(e.target.value)}>
                  {['Standard','Rush','Critical'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes <span className="text-gray-300 font-normal">optional</span></label>
              <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Chain of custody notes, handling instructions…" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </>)}

          {entity === 'location' && (<>
            <div>
              <label className={labelCls}>Location name <span className="text-red-400">*</span></label>
              <input className={inputCls} placeholder="e.g. Harbor View Storage Unit" value={locName} onChange={e => setLocName(e.target.value)} autoFocus />
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <input className={inputCls} placeholder="Street address or coordinates" value={locAddress} onChange={e => setLocAddress(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={selectCls} value={locType} onChange={e => setLocType(e.target.value)}>
                {['Address','Point of Interest','Crime Scene','Cell Tower','Surveillance Point','Case Lead'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Notes <span className="text-gray-300 font-normal">optional</span></label>
              <input className={inputCls} placeholder="Relevance to the case…" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </>)}

          {entity === 'event' && (<>
            <div>
              <label className={labelCls}>Event description <span className="text-red-400">*</span></label>
              <input className={inputCls} placeholder="e.g. Suspect device pinged cell tower A14" value={eventDesc} onChange={e => setEventDesc(e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" className={inputCls} value={eventDate} onChange={e => setEventDate(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Time</label>
                <input type="time" className={inputCls} value={eventTime} onChange={e => setEventTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Event type</label>
              <select className={selectCls} value={eventType} onChange={e => setEventType(e.target.value)}>
                {['Incident','Movement','Communication','Transaction','Surveillance','Lab Result','Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </>)}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-100 dark:border-white/8 bg-[#F8F9FB] dark:bg-[#0f1929]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#5E6974] dark:text-gray-400 hover:text-[#12233A] dark:hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 bg-[#0064CC] text-white text-sm font-semibold rounded-xl hover:bg-[#015297] transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {entity === 'task' ? 'Create Task' : entity === 'file' ? 'Upload File' : entity === 'submission' ? 'Create Submission' : entity === 'location' ? 'Add Location' : entity === 'event' ? 'Log Event' : 'Open Whiteboard'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Case Detail Page ─────────────────────────────────────────────────────────

export function CaseDetailPage({ caseId, onBack }: CaseDetailPageProps) {
  const aiSuggestionsEnabled                        = useAISuggestions();
  const [kebabOpen,         setKebabOpen]          = useState(false);
  const [quickAddOpen,      setQuickAddOpen]       = useState(false);
  const [quickAddModal,     setQuickAddModal]      = useState<QuickAddEntity | null>(null);
  const [quickAddToast,     setQuickAddToast]      = useState<string | null>(null);
  const [quickAddPos,       setQuickAddPos]        = useState({ top: 0, right: 0 });
  const quickAddBtnRef                              = useRef<HTMLButtonElement>(null);
  const [activeTab,         setActiveTab]          = useState<ActiveTab>('brief');
  const [isCaseDetailsOpen, setIsCaseDetailsOpen] = useState(false);
  const [isCaseNavExpanded, setIsCaseNavExpanded] = useState(false);
  const [activeSubView,     setActiveSubView]     = useState<'events-timeline' | null>(null);
  type ActivePanel = 'genesis-ai' | 'chat' | 'whiteboard' | 'tasks' | null;
  const [activePanel,          setActivePanelRaw]    = useState<ActivePanel>(null);
  const [isWhiteboardExpanded, setIsWhiteboardExpanded] = useState(false);
  const [chatInitialThreadId,  setChatInitialThreadId]  = useState<string | undefined>();
  const [aiPrompt, setAiPrompt] = useState<string | undefined>();
  const [aiDraft,  setAiDraft]  = useState<string | undefined>();
  const [navTooltip, setNavTooltip] = useState<{ label: string; x: number; y: number } | null>(null);

  const setActivePanel = (panel: ActivePanel) => {
    if (panel !== 'genesis-ai') { setAiPrompt(undefined); setAiDraft(undefined); }
    setActivePanelRaw(panel);
  };

  const openQuickAdd = () => {
    if (quickAddBtnRef.current) {
      const r = quickAddBtnRef.current.getBoundingClientRect();
      setQuickAddPos({ top: r.top, right: window.innerWidth - r.left + 8 });
    }
    setQuickAddOpen(v => !v);
  };

  useEffect(() => {
    if (!quickAddOpen) return;
    const handler = (e: MouseEvent) => {
      if (quickAddBtnRef.current && !quickAddBtnRef.current.closest('[data-quickadd]')?.contains(e.target as Node)) {
        setQuickAddOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [quickAddOpen]);

  useEffect(() => {
    if (!quickAddToast) return;
    const t = setTimeout(() => setQuickAddToast(null), 3000);
    return () => clearTimeout(t);
  }, [quickAddToast]);

  const openChatWithLabThread = (submissionId: string) => {
    setChatInitialThreadId(submissionId);
    setActivePanel('chat');
  };

  const openAIWithPrompt = (prompt: string) => {
    setAiPrompt(prompt);
    handleTabChange('cellebrite-ai');
  };

  const openAIWithDraft = (draft: string) => {
    setAiPrompt(undefined);
    setAiDraft(draft);
    setActivePanel('genesis-ai');
  };

  const caseDetailsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isCaseDetailsOpen) return;
    const handler = (e: MouseEvent) => {
      if (caseDetailsRef.current && !caseDetailsRef.current.contains(e.target as Node)) {
        setIsCaseDetailsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isCaseDetailsOpen]);

  const [whiteboardItems,   setWhiteboardItems]   = useState<Array<{
    id: string; type: string; content?: string; name?: string;
    role?: string; subjectType?: string; imageUrl?: string; x: number; y: number;
  }>>([]);

  const caseData    = buildCaseData(caseId);
  const statusStyle = STATUS_STYLES[caseData.status] ?? 'bg-gray-100 text-gray-600 border-gray-200';

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setActiveSubView(null);
    setActivePanelRaw(null);
    if (tab !== 'cellebrite-ai') {
      setAiPrompt(undefined);
    }
  };

  const handleNavigateToLocations = () => { setActiveSubView(null); setActiveTab('locations'); };
  const handleNavigateToEvents    = () => { setActiveSubView('events-timeline'); };

  const navItems: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    id: ActiveTab;
    count?: number;
    hasAlert?: boolean;
    isActiveOverride?: boolean;
    onCustomClick?: () => void;
  }[] = [
    { icon: LayoutDashboard, label: 'Brief',          id: 'brief'                                      },
    { icon: Sparkles,        label: 'Cellebrite AI',   id: 'cellebrite-ai'                                                                                           },
    { icon: FileText,        label: 'Case Files',      id: 'files',       count: 145                                                                                 },
    { icon: ListTodo,        label: 'Tasks',           id: 'tasks',       count: 15, hasAlert: true                                                                  },
    { icon: Package,         label: 'Submissions',     id: 'submissions', count: 12                                                                                  },
    { icon: Users,           label: 'Subjects',        id: 'subjects',    count: 6                                                                                   },
    { icon: Layout,          label: 'Whiteboard',      id: 'whiteboard',  count: 12                                                                                  },
    { icon: Map,             label: 'Locations',       id: 'locations',   count: caseData.locations.length                                                           },
    { icon: CalendarDays,    label: 'Events Timeline', id: 'events',      count: caseData.events.length, isActiveOverride: activeSubView === 'events-timeline', onCustomClick: handleNavigateToEvents },
  ];

  const renderContent = () => {
    if (activeTab === 'cellebrite-ai') {
      return (
        <AIWorkspacePage
          key={aiPrompt ?? 'ai-workspace'}
          mode="fullscreen"
          caseId={caseId}
          caseName={caseData.title}
          contextTab="cellebrite-ai"
          initialPrompt={aiPrompt}
          onClose={() => handleTabChange('brief')}
        />
      );
    }
    if (activeSubView === 'events-timeline') {
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#131f35]">
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#131f35]">
            <h1 className="text-base font-semibold text-[#12233A] dark:text-white">Events Timeline</h1>
            <button
              onClick={() => {}}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0064CC] text-white rounded-lg text-sm font-semibold hover:bg-[#015297] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#F1F4F6] dark:bg-[#0f1929]">
            <EventsTimelinePage
              events={caseData.events}
              caseId={caseData.id}
              caseName={caseData.title}
              onBack={() => setActiveSubView(null)}
              onAddEvent={() => {}}
            />
          </div>
        </div>
      );
    }
    if (activeTab === 'brief') {
      return (
        <CaseBriefHomePage
          onAIPrompt={openAIWithPrompt}
          onNavigateTab={(tab) => tab === 'events' ? handleNavigateToEvents() : handleTabChange(tab)}
          caseTitle={caseData.title}
        />
      );
    }

    if (activeTab === 'locations') {
      return (
        <LocationsPage
          caseId={caseData.id}
          caseName={caseData.title}
          onBack={() => handleTabChange('brief')}
        />
      );
    }
    if (activeTab === 'files') {
      return <CaseFilesPage />;
    }
    if (activeTab === 'tasks') {
      return <CaseTasksPage />;
    }
    if (activeTab === 'submissions') {
      return <CaseSubmissionsPage caseId={caseData.id} />;
    }
    if (activeTab === 'subjects') {
      return <SubjectsTab />;
    }
    if (activeTab === 'whiteboard') {
      if (isWhiteboardExpanded) {
        return (
          <CaseWhiteboardPanel
            isExpanded
            onClose={() => { setIsWhiteboardExpanded(false); setIsWhiteboardOpen(true); setActiveTab('brief'); }}
            onExpand={() => {}}
          />
        );
      }
      return <WhiteboardsPage />;
    }

    return (
      <div className="flex-1 overflow-y-auto p-6 bg-[#F1F4F6] dark:bg-[#0f1929]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-base font-bold text-[#12233A] dark:text-white mb-4">
            {navItems.find((n) => n.id === activeTab)?.label}
          </h2>
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center">
              {(() => { const item = navItems.find((n) => n.id === activeTab); const Icon = item?.icon ?? FileText; return <Icon className="w-5 h-5 text-gray-400" />; })()}
            </div>
            <p className="text-sm font-semibold text-[#12233A] dark:text-white">
              {navItems.find((n) => n.id === activeTab)?.label}
            </p>
            <p className="text-xs text-[#5E6974] dark:text-gray-400">This module is not available in the current prototype.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#131f35] border-b border-gray-200 dark:border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-3 gap-4 @container/header">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4 text-[#5E6974] dark:text-gray-400" />
            </button>
            <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0 border border-white/10">
              {caseData.thumbnailUrl
                ? <img src={caseData.thumbnailUrl} alt={caseData.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-blue-100 flex items-center justify-center"><FileText className="w-5 h-5 text-[#0064CC]" /></div>
              }
            </div>
            {/* Popover anchor */}
            <div ref={caseDetailsRef} className="relative">
              <button
                onClick={() => setIsCaseDetailsOpen((v) => !v)}
                className={`flex items-start gap-1.5 text-left rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors ${
                  isCaseDetailsOpen ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
                title={isCaseDetailsOpen ? 'Close Case Details' : 'Open Case Details'}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#0064CC] leading-tight">{caseData.id}</div>
                  <div className="text-xs text-[#5E6974] dark:text-gray-400 truncate max-w-[180px]">{caseData.title}</div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#5E6974] dark:text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-150 ${
                    isCaseDetailsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* ── Case Details Popover ────────────────────────────────── */}
              {isCaseDetailsOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-white dark:bg-[#131f35] rounded-xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden">

                  {/* Popover header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/8 bg-white dark:bg-[#131f35] sticky top-0">
                    <span className="text-sm font-bold text-[#12233A] dark:text-white">Case Details</span>
                    <div className="flex items-center gap-0.5">
                      <button title="Edit" className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-[#5E6974] dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => setIsCaseDetailsOpen(false)}
                        title="Close"
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-[#5E6974] dark:text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable body */}
                  <div className="overflow-y-auto max-h-[420px] px-4 py-4 space-y-4">

                    {/* Case fields */}
                    <div className="space-y-3">
                      <FieldRow label="Creation date"        value={caseData.crimeDetails.creationDate} />
                      <FieldRow label="Most serious offense" value={caseData.crimeDetails.mostSeriousOffense} />
                      <FieldRow label="Offense date"         value={caseData.crimeDetails.offenseDate} />
                      <FieldRow label="Description"          value={caseData.crimeDetails.description || '—'} />
                    </div>

                    <div className="border-t border-gray-100 dark:border-white/8" />

                    {/* Locations */}
                    <div>
                      <SectionHeader
                        label="Locations"
                        count={caseData.locations.length}
                        onAdd={() => {}}
                        addTitle="Add location"
                      />
                      {caseData.locations.length === 0 ? (
                        <div className="text-center py-3">
                          <MapPin className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                          <p className="text-[10px] text-[#5E6974] dark:text-gray-400">No locations added yet.</p>
                        </div>
                      ) : (
                        <>
                          {caseData.locations.slice(0, 3).map((l) => (
                            <LocationItem key={l.id} location={l} />
                          ))}
                          <button
                            onClick={() => { setIsCaseDetailsOpen(false); handleNavigateToLocations(); }}
                            className="mt-1.5 w-full flex items-center justify-center gap-1 text-xs text-[#0064CC] hover:text-[#015297] font-medium py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            {caseData.locations.length > 3
                              ? `Show all locations (${caseData.locations.length})`
                              : 'Open in map'}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="border-t border-gray-100 dark:border-white/8" />

                    {/* Events */}
                    <div>
                      <SectionHeader
                        label="Events"
                        count={caseData.events.length}
                        onAdd={() => {}}
                        addTitle="Add event"
                      />
                      {caseData.events.length === 0 ? (
                        <div className="text-center py-3">
                          <Clock className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                          <p className="text-[10px] text-[#5E6974] dark:text-gray-400">No events yet.</p>
                        </div>
                      ) : (
                        <>
                          {caseData.events.slice(0, 3).map((e) => (
                            <EventItem key={e.id} event={e} />
                          ))}
                          {caseData.events.length > 3 && (
                            <button
                              onClick={() => { setIsCaseDetailsOpen(false); handleNavigateToEvents(); }}
                              className="mt-1.5 w-full flex items-center justify-center gap-1 text-xs text-[#0064CC] hover:text-[#015297] font-medium py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              Show all events ({caseData.events.length})
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0 divide-x divide-gray-200 dark:divide-white/10 flex-shrink-0">
            {/* Case Officer — always visible */}
            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] text-[#5E6974] dark:text-gray-400 mb-0.5 whitespace-nowrap">Case Officer</span>
              <span className="text-xs font-semibold text-[#12233A] dark:text-white whitespace-nowrap">{caseData.caseOfficer.name}</span>
            </div>
            {/* Unit — hide below ~950px container */}
            <div className="hidden @[950px]/header:flex flex-col items-center px-4">
              <span className="text-[10px] text-[#5E6974] dark:text-gray-400 mb-0.5 whitespace-nowrap">Unit</span>
              <span className="text-xs font-semibold text-[#12233A] dark:text-white whitespace-nowrap">{caseData.unit}</span>
            </div>
            {/* Creation Date — hide below ~950px container */}
            <div className="hidden @[950px]/header:flex flex-col items-center px-4">
              <span className="text-[10px] text-[#5E6974] dark:text-gray-400 mb-0.5 whitespace-nowrap">Creation Date</span>
              <span className="text-xs font-semibold text-[#12233A] dark:text-white whitespace-nowrap">{caseData.createdDate}</span>
            </div>
            {/* Created by — hide below ~1150px container */}
            <div className="hidden @[1150px]/header:flex flex-col items-center px-4">
              <span className="text-[10px] text-[#5E6974] dark:text-gray-400 mb-0.5 whitespace-nowrap">Created by</span>
              <span className="text-xs font-semibold text-[#12233A] dark:text-white whitespace-nowrap">{caseData.createdBy}</span>
            </div>
            {/* Case Age — hide below ~1150px container */}
            <div className="hidden @[1150px]/header:flex flex-col items-center px-4">
              <span className="text-[10px] text-[#5E6974] dark:text-gray-400 mb-0.5 whitespace-nowrap">Case Age</span>
              <span className="text-xs font-semibold text-[#12233A] dark:text-white whitespace-nowrap">{caseData.caseAge}</span>
            </div>
            {/* Status — always visible */}
            <div className="flex flex-col items-center px-4">
              <span className="text-[10px] text-[#5E6974] dark:text-gray-400 mb-0.5">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle}`}>
                {caseData.status}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4">
              <div className="flex items-center -space-x-2">
                {caseData.collaborators.map((c, i) => (
                  <div key={i} title={c.name}
                    className="w-7 h-7 rounded-full border-2 border-white dark:border-[#131f35] overflow-hidden flex-shrink-0">
                    {c.avatarUrl
                      ? <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">{c.initials}</div>
                    }
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full border-2 border-white dark:border-[#131f35] bg-gray-100 dark:bg-white/15 flex items-center justify-center text-[9px] font-bold text-gray-500 dark:text-gray-300 flex-shrink-0">
                  +10
                </div>
              </div>
              <button className="px-2.5 py-1 bg-[#0064CC] hover:bg-[#015297] text-white rounded text-xs font-semibold transition-colors">
                Invite
              </button>
              <div className="relative">
                <button
                  onClick={() => setKebabOpen(v => !v)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-[#5E6974] dark:text-gray-400" />
                </button>
                {kebabOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setKebabOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white dark:bg-[#131f35] rounded-lg shadow-lg border border-gray-200 dark:border-white/10 py-1">
                      <button
                        onClick={() => { toggleAISuggestions(); setKebabOpen(false); }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-[#12233A] dark:text-white font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          AI Suggestions
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          aiSuggestionsEnabled
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {aiSuggestionsEnabled ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Case module nav (expand / collapse) */}
        <div
          style={{ width: isCaseNavExpanded ? 192 : 52 }}
          className="flex-shrink-0 bg-white dark:bg-[#131f35] border-r border-gray-200 dark:border-white/10 flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out"
        >
          <nav className="flex-1 py-2 px-1 space-y-0.5 overflow-hidden">
            {navItems.map((item) => {
              const isActive = item.isActiveOverride ?? (activeTab === item.id && !activeSubView);
              return (
                <div key={item.id}>
                  {item.id === 'files' && (
                    <div className={`my-1.5 ${isCaseNavExpanded ? 'mx-2' : 'mx-3'} h-px bg-gray-200 dark:bg-white/10`} />
                  )}
                <button
                  onClick={() => item.onCustomClick ? item.onCustomClick() : handleTabChange(item.id)}
                  onMouseEnter={(e) => {
                    if (!isCaseNavExpanded) {
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setNavTooltip({ label: item.label, x: r.right + 8, y: r.top + r.height / 2 });
                    }
                  }}
                  onMouseLeave={() => setNavTooltip(null)}
                  className={`
                    w-full flex items-center py-2 rounded-lg
                    transition-colors relative
                    ${isCaseNavExpanded ? 'gap-2 px-2' : 'justify-center'}
                    ${isActive && item.id === 'cellebrite-ai'
                      ? 'bg-gradient-to-b from-purple-500 to-blue-500 text-white'
                      : isActive
                      ? 'bg-[#0064CC] text-white'
                      : item.id === 'cellebrite-ai'
                      ? 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700'
                      : 'text-[#5E6974] dark:text-gray-400 hover:bg-[#E7EBF1] dark:hover:bg-white/10 hover:text-[#12233A] dark:hover:text-white'}
                  `}
                >
                  <div className="flex-shrink-0 w-4 h-4 relative flex items-center justify-center">
                    <item.icon className="w-4 h-4" />
                    {/* Static alert dot — no animation */}
                    {!isCaseNavExpanded && !isActive && item.hasAlert && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                    )}
                  </div>

                  {isCaseNavExpanded && (
                    <>
                      <span className="flex-1 text-left text-xs font-medium truncate whitespace-nowrap select-none">
                        {item.label}
                      </span>
                      {item.count !== undefined && (
                        <span className={`
                          flex-shrink-0 min-w-[18px] text-center px-1 py-0.5 rounded
                          text-[9px] font-bold leading-none
                          ${isActive
                            ? 'bg-white/25 text-white'
                            : item.hasAlert
                              ? 'bg-red-100 text-red-600'
                              : 'bg-[#E7EBF1] dark:bg-white/10 text-[#5E6974] dark:text-gray-400'}
                        `}>
                          {item.count}
                        </span>
                      )}
                    </>
                  )}
                </button>
                </div>
              );
            })}
          </nav>

          {/* Expand / Collapse toggle */}
          <div className="flex-shrink-0 px-1 py-2 border-t border-gray-100 dark:border-white/8">
            <button
              onClick={() => setIsCaseNavExpanded((v) => !v)}
              title={isCaseNavExpanded ? 'Collapse navigation' : 'Expand navigation'}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[#5E6974] dark:text-gray-400 hover:bg-[#E7EBF1] dark:hover:bg-white/10 hover:text-[#12233A] dark:hover:text-white transition-colors"
            >
              {isCaseNavExpanded ? (
                <>
                  <PanelLeftClose className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-[10px] font-medium whitespace-nowrap select-none">Collapse</span>
                </>
              ) : (
                <PanelLeftOpen className="w-3.5 h-3.5 flex-shrink-0 mx-auto" />
              )}
            </button>
          </div>
        </div>

        {/* Main content — min-w-0 allows it to shrink when side panels open */}
        <div className="relative flex-1 min-w-0 flex overflow-hidden">
          {renderContent()}
        </div>

        {/* Cellebrite AI — side panel */}
        {activePanel === 'genesis-ai' && activeTab !== 'cellebrite-ai' && (
          <AIWorkspacePage
            mode="panel"
            caseId={caseId}
            caseName={caseData.title}
            contextTab={activeTab}
            onExpand={() => { setActivePanel(null); handleTabChange('cellebrite-ai'); }}
            onClose={() => { setActivePanel(null); }}
          />
        )}

        {/* Whiteboard Panel */}
        {activePanel === 'whiteboard' && (
          <CaseWhiteboardPanel
            onClose={() => setActivePanel(null)}
            onExpand={() => { setActivePanel(null); setIsWhiteboardExpanded(true); setActiveTab('whiteboard'); }}
          />
        )}

        {/* Chat Panel */}
        {activePanel === 'chat' && (
          <CaseChatPanel
            onClose={() => setActivePanel(null)}
            initialTab={chatInitialThreadId ? 'lab' : undefined}
            initialThreadId={chatInitialThreadId}
          />
        )}

        {/* ── Sticky Action Sidebar ───────────────────────────────────── */}
        {activeTab !== 'cellebrite-ai' && <div className="flex-shrink-0 flex flex-col items-center gap-1 py-3 px-1 bg-white dark:bg-[#131f35] border-l border-gray-200 dark:border-white/10 w-12">

          {/* ＋ Quick Add */}
          <div data-quickadd="true">
            <button
              ref={quickAddBtnRef}
              onClick={openQuickAdd}
              title="Quick Add"
              className={`group relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                quickAddOpen
                  ? 'bg-[#0064CC] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-white/10 text-[#12233A] dark:text-white hover:bg-[#0064CC] hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              {!quickAddOpen && (
                <div className="absolute right-full mr-2 px-2 py-1 bg-[#12233A] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  Quick Add
                </div>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="w-5 h-px bg-gray-200 dark:bg-white/10 my-1" />

          {/* Panel buttons */}
          {[
            { icon: Sparkles,      label: 'Cellebrite AI',  panel: 'genesis-ai' as ActivePanel, gradient: true,  badge: undefined },
            { icon: MessageSquare, label: 'Chat',            panel: 'chat'       as ActivePanel, gradient: false, badge: 20        },
            { icon: Layout,        label: 'Whiteboard',      panel: 'whiteboard' as ActivePanel, gradient: false, badge: undefined },
            { icon: BookOpen,      label: 'Storyteller',     panel: null,                        gradient: false, badge: undefined },
            { icon: Mic,           label: 'Recorder',        panel: null,                        gradient: false, badge: undefined },
          ].map(({ icon: Icon, label, panel, gradient, badge }) => {
            const isTabActive = panel === 'genesis-ai' && activeTab === 'cellebrite-ai';
            const isDisabled = panel === 'genesis-ai' && activeTab === 'brief';
            const active = !isTabActive && panel !== null && activePanel === panel;
            const action = isDisabled
              ? undefined
              : panel === 'genesis-ai'
              ? isTabActive
                ? () => handleTabChange('brief')
                : () => setActivePanel(activePanel === panel ? null : panel)
              : panel !== null
              ? () => setActivePanel(activePanel === panel ? null : panel)
              : undefined;
            return (
              <button
                key={label}
                onClick={action ?? undefined}
                disabled={isDisabled}
                title={isDisabled ? 'Cellebrite AI is available in the AI tab' : label}
                className={`group relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isDisabled
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-40'
                    : active && gradient
                    ? 'bg-gradient-to-b from-purple-500 to-blue-500 shadow-sm'
                    : active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : action
                    ? 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white'
                    : 'text-gray-300 dark:text-gray-600 cursor-default'
                }`}
              >
                <Icon className={`w-4 h-4 ${active && gradient ? 'text-white' : ''}`} />
                {badge && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center border border-white">
                    <span className="text-white text-[8px] font-bold">{badge}</span>
                  </div>
                )}
                <div className="absolute right-full mr-2 px-2 py-1 bg-[#12233A] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {label}
                </div>
              </button>
            );
          })}
        </div>}
      </div>

      {/* Case-nav tooltip — fixed so it escapes the sidebar's overflow-hidden */}
      {navTooltip && !isCaseNavExpanded && (
        <div
          className="fixed z-[300] pointer-events-none -translate-y-1/2 px-2 py-1 rounded bg-[#12233A] text-white text-[10px] font-medium whitespace-nowrap"
          style={{ top: navTooltip.y, left: navTooltip.x }}
        >
          {navTooltip.label}
        </div>
      )}

      {/* Quick Add Popover — fixed, opens to the left of the sidebar */}
      {quickAddOpen && (
        <div
          data-quickadd="true"
          className="fixed z-[350] w-60 bg-white dark:bg-[#131f35] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
          style={{ top: quickAddPos.top, right: quickAddPos.right }}
        >
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/8">
            <p className="text-[10px] font-bold text-[#5E6974] dark:text-gray-400 uppercase tracking-widest">Add to case</p>
          </div>
          <div className="py-1">
            {QUICK_ADD_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setQuickAddOpen(false);
                    if (opt.id === 'whiteboard') {
                      setActivePanel('whiteboard');
                    } else {
                      setQuickAddModal(opt.id as QuickAddEntity);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${opt.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${opt.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#12233A] dark:text-white">{opt.label}</p>
                    <p className="text-[10px] text-[#5E6974] dark:text-gray-400 leading-tight truncate">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Add Creation Modal */}
      {quickAddModal && (
        <QuickAddModal
          entity={quickAddModal}
          onClose={() => setQuickAddModal(null)}
          onSuccess={(msg) => { setQuickAddModal(null); setQuickAddToast(msg); }}
        />
      )}

      {/* Success Toast */}
      {quickAddToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2.5 px-4 py-2.5 bg-[#12233A] text-white rounded-xl shadow-2xl text-sm font-medium pointer-events-none select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          {quickAddToast}
        </div>
      )}

    </div>
  );
}
