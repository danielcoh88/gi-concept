import { useState } from 'react';
import {
  ChevronRight, ChevronDown, Search, ChevronDown as ChevronDownSm,
  ArrowUpDown, Plus, MoreVertical, Maximize2, AlertTriangle, FileText, ListTodo,
} from 'lucide-react';
import { CASE_TASKS } from './mockTasks';

// ─── Types ────────────────────────────────────────────────────────────────────

type AssignmentStatus = 'approved' | 'pending-analyst' | 'in-review' | 'rejected';

interface SubmissionFile {
  ext: 'UFDR' | 'PDF' | 'DOCX' | 'IMG';
  name: string;
  flagged?: boolean;
}

interface Assignment {
  id: number;
  name: string;
  status: AssignmentStatus;
  examiner: { initials: string; name: string; color: string };
  updatedAt: string;
  files?: SubmissionFile[];
  fileOverflow?: number;
}

interface Submission {
  id: string;
  updates?: number;
  fileCount: number;
  assignmentCount: number;
  examiner: { initials: string; name: string; color: string };
  submittedAt: string;
  assignments?: Assignment[];
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; cls: string }> = {
  'approved':        { label: 'Approved',                  cls: 'bg-green-100 text-green-700 border border-green-200' },
  'pending-analyst': { label: 'Pending Analyst', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  'in-review':       { label: 'In Review',                  cls: 'bg-blue-100 text-blue-700 border border-blue-200'   },
  'rejected':        { label: 'Rejected',                   cls: 'bg-red-100 text-red-700 border border-red-200'      },
};

function StatusBadge({ status }: { status: AssignmentStatus }) {
  const { label, cls } = STATUS_CONFIG[status];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${cls}`}>{label}</span>;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 'sm' }: { initials: string; color: string; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-[10px]';
  return (
    <div style={{ backgroundColor: color }} className={`${dim} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── File pill ────────────────────────────────────────────────────────────────

const FILE_BADGE: Record<string, { bg: string; label: string }> = {
  UFDR: { bg: 'bg-orange-500', label: 'UFDR' },
  PDF:  { bg: 'bg-red-600',    label: 'PDF'  },
  DOCX: { bg: 'bg-blue-600',   label: 'W'    },
  IMG:  { bg: 'bg-gray-400',   label: '🖼'   },
};

function FilePill({ file }: { file: SubmissionFile }) {
  const badge = FILE_BADGE[file.ext] ?? { bg: 'bg-gray-400', label: file.ext };
  return (
    <div className="inline-flex items-center gap-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-xs text-gray-700 dark:text-gray-300 flex-shrink-0">
      <span className={`${badge.bg} text-white rounded text-[9px] font-bold px-1 py-0.5 min-w-[24px] text-center`}>{badge.label}</span>
      <span className="max-w-[100px] truncate">{file.name}</span>
      {file.flagged && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
      <MoreVertical className="w-3 h-3 text-gray-400 flex-shrink-0" />
    </div>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const SUBMISSIONS: Submission[] = [
  {
    id: 'B92M84', updates: 2,
    fileCount: 15, assignmentCount: 3,
    examiner: { initials: 'BO', name: 'Bjorn Olafson', color: '#0f766e' },
    submittedAt: '2023-03-15 09:45:12 (5 minutes ago)',
    assignments: [
      {
        id: 1, name: 'Digital & Multimedia Evidence', status: 'approved',
        examiner: { initials: 'DK', name: 'Daniel Kreag', color: '#047857' },
        updatedAt: 'Updated 5 minutes ago by Anya Petrova',
        files: [
          { ext: 'UFDR', name: 'iphone.ufdr' },
          { ext: 'PDF',  name: 'Report.pdf' },
          { ext: 'DOCX', name: 'Device Notes.docx' },
          { ext: 'PDF',  name: 'CSAMReport.pdf', flagged: true },
          { ext: 'UFDR', name: 'iphone.ufdr' },
          { ext: 'PDF',  name: 'Report.pdf' },
          { ext: 'DOCX', name: 'Device Notes.docx' },
        ],
        fileOverflow: 12,
      },
      {
        id: 2, name: 'Blood Alcohol Analysis', status: 'pending-analyst',
        examiner: { initials: 'AP', name: 'Anya Petrova', color: '#0891b2' },
        updatedAt: 'Updated 2 hours ago',
      },
      {
        id: 3, name: 'Digital & Multimedia Evidence', status: 'approved',
        examiner: { initials: 'AP', name: 'Anya Petrova', color: '#0891b2' },
        updatedAt: 'Updated 1 day',
        files: [
          { ext: 'DOCX', name: 'Device Notes.docx' },
          { ext: 'UFDR', name: 'iphone.ufdr' },
          { ext: 'PDF',  name: 'Report.pdf' },
        ],
      },
    ],
  },
  { id: 'C1089Z', fileCount: 21, assignmentCount: 4, examiner: { initials: 'JS', name: 'Chang Wei',     color: '#16a34a' }, submittedAt: '2023-03-15 09:15:22 (35 minutes ago)' },
  { id: 'D74Q55', fileCount: 6,  assignmentCount: 1, examiner: { initials: 'CW', name: 'Klaus Müller',  color: '#0891b2' }, submittedAt: '2023-03-15 08:52:41 (58 minutes ago)' },
  { id: 'E2201F', fileCount: 18, assignmentCount: 5, examiner: { initials: 'KM', name: 'Lakshmi Patel', color: '#4f46e5' }, submittedAt: '2022-09-21 13:20:40 (2 hours ago)'    },
  { id: 'F5017X', fileCount: 10, assignmentCount: 3, examiner: { initials: 'DR', name: 'Daniela Rossi', color: '#e11d48' }, submittedAt: '2023-03-15 07:55:30 (2 hours ago)'    },
  { id: '1234098', fileCount: 15, assignmentCount: 3, examiner: { initials: 'JS', name: 'John Smith',   color: '#16a34a' }, submittedAt: '2022-09-21, 13:20:40 (2 hours ago)'   },
  { id: '1234098', fileCount: 15, assignmentCount: 3, examiner: { initials: 'JS', name: 'John Smith',   color: '#16a34a' }, submittedAt: '2022-09-21, 13:20:40 (2 hours ago)'   },
  { id: '1234098', fileCount: 15, assignmentCount: 3, examiner: { initials: 'JS', name: 'John Smith',   color: '#16a34a' }, submittedAt: '2022-09-21, 13:20:40 (2 hours ago)'   },
  { id: '1234098', fileCount: 15, assignmentCount: 3, examiner: { initials: 'JS', name: 'John Smith',   color: '#16a34a' }, submittedAt: '2022-09-21, 13:20:40 (2 hours ago)'   },
  { id: '1234098', fileCount: 15, assignmentCount: 3, examiner: { initials: 'JS', name: 'John Smith',   color: '#16a34a' }, submittedAt: '2022-09-21, 13:20:40 (2 hours ago)'   },
  { id: '1234098', fileCount: 15, assignmentCount: 3, examiner: { initials: 'JS', name: 'John Smith',   color: '#16a34a' }, submittedAt: '2022-09-21, 13:20:40 (2 hours ago)'   },
  { id: '1234098', fileCount: 15, assignmentCount: 3, examiner: { initials: 'JS', name: 'John Smith',   color: '#16a34a' }, submittedAt: '2022-09-21, 13:20:40 (2 hours ago)'   },
];

// ─── Submission row ───────────────────────────────────────────────────────────

function SubmissionRow({ sub, expanded, onToggle }: {
  sub: Submission;
  expanded: boolean;
  onToggle: () => void;
}) {
  const linkedTasks = CASE_TASKS.filter(
    t => t.linkedTo?.type === 'submission' && t.linkedTo.label === sub.id
  );

  return (
    <div className={`border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden ${expanded ? 'shadow-sm' : ''}`}>
      {/* Collapsed header */}
      <div
        className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-[#131f35] hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <button className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2 w-48 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{sub.id}</span>
          {sub.updates !== undefined && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap">
              {sub.updates} Updates
            </span>
          )}
          {linkedTasks.length > 0 && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 whitespace-nowrap">
              <ListTodo className="w-2.5 h-2.5" />{linkedTasks.length} {linkedTasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 text-sm text-gray-600 dark:text-gray-400">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>{sub.fileCount} Files, {sub.assignmentCount} {sub.assignmentCount === 1 ? 'Assignment' : 'Assignments'}</span>
        </div>

        <div className="flex items-center gap-2 w-52 flex-shrink-0">
          <Avatar initials={sub.examiner.initials} color={sub.examiner.color} />
          <span className="text-sm text-gray-700 dark:text-gray-300">{sub.examiner.name}</span>
        </div>

        <div className="flex-1 text-sm text-gray-500 dark:text-gray-400 text-right pr-4">{sub.submittedAt}</div>

        <button
          className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <Maximize2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Expanded assignments */}
      {expanded && sub.assignments && (
        <div className="bg-gray-50 dark:bg-[#0f1929] border-t border-gray-200 dark:border-white/10 divide-y divide-gray-200 dark:divide-white/8">
          {linkedTasks.length > 0 && (
            <div className="px-6 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ListTodo className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Linked Tasks</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {linkedTasks.map(t => {
                  const statusColor = {
                    'to-do': 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/15',
                    'in-progress': 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
                    'on-hold': 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
                    'done': 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30',
                  }[t.status];
                  const statusLabel = { 'to-do': 'To Do', 'in-progress': 'In Progress', 'on-hold': 'On Hold', 'done': 'Done' }[t.status];
                  return (
                    <div key={t.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${statusColor}`}>
                      <ListTodo className="w-3 h-3 flex-shrink-0" />
                      <span>{t.name}</span>
                      <span className="opacity-60">· {statusLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {sub.assignments.map(assignment => (
            <div key={assignment.id} className="px-6 py-4">
              {/* Assignment header */}
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{assignment.name}</span>
                  <StatusBadge status={assignment.status} />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Avatar initials={assignment.examiner.initials} color={assignment.examiner.color} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{assignment.examiner.name}</span>
                    {' · '}
                    {assignment.updatedAt}
                  </span>
                </div>
              </div>

              {/* Files */}
              {assignment.files && assignment.files.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {assignment.files.map((file, i) => (
                    <FilePill key={i} file={file} />
                  ))}
                  {assignment.fileOverflow !== undefined && (
                    <span className="text-xs font-semibold text-blue-600 px-2 py-1 bg-blue-50 border border-blue-200 rounded">
                      +{assignment.fileOverflow}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CaseSubmissionsPage({ caseId = '05-CV-07959' }: { caseId?: string }) {
  const [expandedId, setExpandedId] = useState<string | null>('B92M84');
  const [search, setSearch] = useState('');

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0f1929]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0 bg-white dark:bg-[#131f35]">
        <h1 className="text-base font-semibold text-[#12233A] dark:text-white">
          Submissions ({SUBMISSIONS.length})
        </h1>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-[#0064CC] text-white rounded-lg text-sm font-semibold hover:bg-[#015297] transition-colors">
          <Plus className="w-4 h-4" />
          New Lab Submission
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 dark:border-white/8 bg-white dark:bg-[#131f35] flex-shrink-0 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by submission or assignment"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700/50 w-64 bg-white dark:bg-white/5"
          />
        </div>

        {['Submitter', 'Examiner', 'Status'].map(f => (
          <button key={f} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors bg-white dark:bg-transparent">
            {f}
            <ChevronDownSm className="w-3.5 h-3.5 text-gray-400" />
          </button>
        ))}

        <div className="flex-1" />

        {/* Sort */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          Sort by:
          <button className="text-[#0064CC] font-medium hover:underline">Submitted time</button>
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
        </div>

        {/* Lab case ID */}
        <div className="text-xs text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-white/10 pl-3">
          <div className="font-medium text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-wide">Lab case ID</div>
          <div className="font-semibold text-gray-700 dark:text-gray-300">CLBT-2025-00017</div>
        </div>
      </div>

      {/* Submission list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {SUBMISSIONS.filter(s =>
          s.id.toLowerCase().includes(search.toLowerCase()) ||
          s.examiner.name.toLowerCase().includes(search.toLowerCase())
        ).map((sub, i) => (
          <SubmissionRow
            key={`${sub.id}-${i}`}
            sub={sub}
            expanded={expandedId === sub.id && i === 0}
            onToggle={() => toggle(sub.id)}
          />
        ))}
      </div>
    </div>
  );
}
