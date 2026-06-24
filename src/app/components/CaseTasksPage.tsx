import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  Plus, MoreVertical, AlertCircle, List, LayoutGrid, CalendarDays,
  ChevronUp, ChevronDown, User, MapPin, TestTube, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { CASE_TASKS } from './mockTasks';
import type { Task, TaskStatus, Assignee, LinkedEntity, TaskFile } from './mockTasks';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority   = 'normal' | 'medium' | 'high' | 'overdue';
type ViewMode   = 'list' | 'board' | 'calendar';
type SortCol    = 'name' | 'dueDate' | 'status' | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY_ISO = '2026-06-18';
const MY_USER   = 'YL';

const STATUSES: TaskStatus[] = ['to-do', 'in-progress', 'on-hold', 'done'];

const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  'to-do': 'in-progress', 'in-progress': 'on-hold', 'on-hold': 'done', 'done': 'to-do',
};
const STATUS_LABELS: Record<TaskStatus, string> = {
  'on-hold': 'On Hold', 'in-progress': 'In Progress', 'to-do': 'To Do', 'done': 'Done',
};
const STATUS_STYLES: Record<TaskStatus, string> = {
  'on-hold':     'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  'in-progress': 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  'to-do':       'bg-white text-gray-600 border border-gray-300 dark:bg-white/5 dark:text-gray-400 dark:border-white/15',
  'done':        'bg-green-100 text-green-700 border border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
};
const STATUS_PILL_CAL: Record<TaskStatus, string> = {
  'to-do':       'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300',
  'in-progress': 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
  'on-hold':     'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
  'done':        'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300',
};
const COL_DOT: Record<TaskStatus, string> = {
  'to-do': 'bg-gray-400', 'in-progress': 'bg-blue-500', 'on-hold': 'bg-amber-500', 'done': 'bg-green-500',
};

const LINKED_META = {
  subject:    { Icon: User,     color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30' },
  submission: { Icon: TestTube, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-500/30' },
  location:   { Icon: MapPin,   color: 'text-cyan-500',   bg: 'bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-200 dark:border-cyan-500/30'         },
};

const FILE_COLORS: Record<string, string> = { PDF: 'bg-red-600', DOCX: 'bg-blue-600', UFDR: 'bg-orange-500' };

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}`;
}

function taskIsOverdue(t: Task) { return t.status !== 'done' && t.dueDateISO < TODAY_ISO; }

function buildCalGrid(year: number, month: number): Array<string | null> {
  const startDow  = new Date(year, month, 1).getDay();
  const daysInMo  = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = Array(startDow).fill(null);
  for (let d = 1; d <= daysInMo; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Assignees ────────────────────────────────────────────────────────────────


// ─── Shared sub-components ────────────────────────────────────────────────────

function StatusBadge({ status, onClick }: { status: TaskStatus; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Click to advance status"
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium transition-opacity hover:opacity-75 select-none ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </button>
  );
}

function PriorityDot({ priority }: { priority: Priority }) {
  if (priority === 'overdue') return <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />;
  if (priority === 'high')    return <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />;
  if (priority === 'medium')  return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />;
  return <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20 flex-shrink-0" />;
}

function Avatars({ assignees, sm }: { assignees: Assignee[]; sm?: boolean }) {
  const sz  = sm ? 'w-5 h-5 text-[8px] border' : 'w-6 h-6 text-[9px] border-2';
  const vis = assignees.slice(0, 3);
  const ov  = assignees.length - 3;
  return (
    <div className="flex items-center -space-x-1.5">
      {vis.map((a, i) => (
        <div key={i} style={{ backgroundColor: a.color }}
          className={`${sz} rounded-full flex items-center justify-center text-white font-bold border-white dark:border-[#0f1929] flex-shrink-0`}
          title={a.initials}
        >{a.initials}</div>
      ))}
      {ov > 0 && (
        <div className={`${sz} rounded-full bg-gray-200 dark:bg-white/15 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold border-white dark:border-[#0f1929]`}>
          +{ov}
        </div>
      )}
    </div>
  );
}

function LinkedBadge({ entity }: { entity: LinkedEntity }) {
  const m = LINKED_META[entity.type];
  const Icon = m.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${m.bg}`}>
      <Icon className={`w-3 h-3 ${m.color} flex-shrink-0`} />
      <span className={`${m.color} truncate max-w-[110px]`}>{entity.label}</span>
    </span>
  );
}

function FileBadge({ file }: { file: TaskFile }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className={`inline-flex items-center justify-center ${FILE_COLORS[file.ext]} text-white rounded text-[9px] font-bold px-1 py-0.5 min-w-[26px] flex-shrink-0`}>
        {file.ext === 'DOCX' ? 'W' : file.ext}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[90px]">{file.name}</span>
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ tasks, selected, onToggle, onToggleAll, onCycle }: {
  tasks: Task[];
  selected: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onCycle: (id: number) => void;
}) {
  const [sortCol, setSortCol] = useState<SortCol>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    if (!sortCol) return tasks;
    return [...tasks].sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'name')    cmp = a.name.localeCompare(b.name);
      if (sortCol === 'dueDate') cmp = a.dueDateISO.localeCompare(b.dueDateISO);
      if (sortCol === 'status')  cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [tasks, sortCol, sortDir]);

  const allSel = tasks.length > 0 && tasks.every(t => selected.has(t.id));

  function Th({ col, children }: { col: SortCol; children: ReactNode }) {
    const active = sortCol === col;
    return (
      <th
        onClick={() => handleSort(col)}
        className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none"
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {active
            ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
            : <span className="w-3" />
          }
        </span>
      </th>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-white/10">
            <th className="w-10 py-3 pr-2">
              <input type="checkbox" checked={allSel} onChange={onToggleAll}
                className="rounded border-gray-300 dark:border-white/20 text-blue-600" />
            </th>
            <Th col="name">Task Name</Th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Assignee</th>
            <Th col="dueDate">Due Date</Th>
            <Th col="status">Status</Th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Linked To</th>
            <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Files</th>
            <th className="w-10 py-3 px-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/8">
          {sorted.map(task => (
            <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
              <td className="py-2.5 pr-2">
                <input type="checkbox" checked={selected.has(task.id)} onChange={() => onToggle(task.id)}
                  className="rounded border-gray-300 dark:border-white/20 text-blue-600" />
              </td>
              <td className="py-2.5 px-3 max-w-[200px]">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate block">{task.name}</span>
              </td>
              <td className="py-2.5 px-3"><Avatars assignees={task.assignees} /></td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1.5">
                  {taskIsOverdue(task) && <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                  <span className={`text-xs whitespace-nowrap ${taskIsOverdue(task) ? 'text-red-500 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                    {fmt(task.dueDateISO)}
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-3">
                <StatusBadge status={task.status} onClick={() => onCycle(task.id)} />
              </td>
              <td className="py-2.5 px-3">
                {task.linkedTo && <LinkedBadge entity={task.linkedTo} />}
              </td>
              <td className="py-2.5 px-3">
                {task.file && <FileBadge file={task.file} />}
              </td>
              <td className="py-2.5 px-3">
                <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Board View ───────────────────────────────────────────────────────────────

function BoardView({ tasks, onCycle }: { tasks: Task[]; onCycle: (id: number) => void }) {
  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { 'to-do': [], 'in-progress': [], 'on-hold': [], 'done': [] };
    tasks.forEach(t => map[t.status].push(t));
    return map;
  }, [tasks]);

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-5">
      <div className="flex gap-4 h-full min-w-max">
        {STATUSES.map(status => (
          <div key={status} className="w-64 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3 px-0.5">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${COL_DOT[status]}`} />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{STATUS_LABELS[status]}</span>
              <span className="ml-auto text-[11px] text-gray-400 bg-gray-100 dark:bg-white/10 rounded-full px-2 py-0.5 font-medium">
                {byStatus[status].length}
              </span>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-0.5">
              {byStatus[status].map(task => (
                <div key={task.id}
                  className="bg-white dark:bg-[#1a2844] rounded-xl p-3.5 border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <PriorityDot priority={task.priority} />
                    <span className="text-sm font-medium text-gray-800 dark:text-white leading-snug">{task.name}</span>
                  </div>

                  {task.linkedTo && (
                    <div className="mb-2.5">
                      <LinkedBadge entity={task.linkedTo} />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-white/8">
                    <div className="flex items-center gap-1.5">
                      {taskIsOverdue(task) && <AlertCircle className="w-3 h-3 text-red-500" />}
                      <span className={`text-[11px] ${taskIsOverdue(task) ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {fmt(task.dueDateISO)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onCycle(task.id)}
                        title="Advance status"
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium cursor-pointer hover:opacity-75 transition-opacity ${STATUS_STYLES[status]}`}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                      <Avatars assignees={task.assignees} sm />
                    </div>
                  </div>
                </div>
              ))}

              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors border border-dashed border-gray-200 dark:border-white/10 mt-1">
                <Plus className="w-3.5 h-3.5" /> Add task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({ tasks, year, month, onPrev, onNext }: {
  tasks: Task[];
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const cells = useMemo(() => buildCalGrid(year, month), [year, month]);

  const byDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => { (map[t.dueDateISO] ??= []).push(t); });
    return map;
  }, [tasks]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-1.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-white/10 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
        {cells.map((iso, i) => {
          const isToday    = iso === TODAY_ISO;
          const day        = iso ? parseInt(iso.split('-')[2]) : null;
          const dayTasks   = iso ? (byDate[iso] ?? []) : [];
          const overflow   = Math.max(0, dayTasks.length - 3);
          const visible    = dayTasks.slice(0, 3);

          return (
            <div key={i} className={`min-h-[88px] p-1.5 flex flex-col transition-colors ${
              iso
                ? 'bg-white dark:bg-[#111827] hover:bg-gray-50 dark:hover:bg-[#1a2236] cursor-default'
                : 'bg-gray-50 dark:bg-[#0d1520]'
            }`}>
              {day !== null && (
                <span className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                  isToday ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {day}
                </span>
              )}
              <div className="flex flex-col gap-0.5">
                {visible.map(t => (
                  <div key={t.id}
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${STATUS_PILL_CAL[t.status]}`}
                    title={t.name}
                  >
                    {t.name}
                  </div>
                ))}
                {overflow > 0 && (
                  <span className="text-[10px] text-gray-400 px-1.5">+{overflow} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bulk Action Bar ──────────────────────────────────────────────────────────

function BulkBar({ count, onMarkDone, onDelete, onClear }: {
  count: number;
  onMarkDone: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#131f35] border-t border-gray-200 dark:border-white/10 px-6 py-3 flex items-center gap-3 shadow-lg z-20">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{count} selected</span>
      <div className="w-px h-4 bg-gray-200 dark:bg-white/15" />
      <button
        onClick={onMarkDone}
        className="px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400 text-xs font-semibold border border-green-200 dark:border-green-500/30 hover:bg-green-100 dark:hover:bg-green-500/25 transition-colors"
      >
        Mark Done
      </button>
      <button
        onClick={onDelete}
        className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/25 transition-colors"
      >
        Delete
      </button>
      <button onClick={onClear} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CaseTasksPage() {
  const [tasks,    setTasks]    = useState<Task[]>(CASE_TASKS);
  const [view,     setView]     = useState<ViewMode>('list');
  const [myOnly,   setMyOnly]   = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [calYear,  setCalYear]  = useState(2026);
  const [calMonth, setCalMonth] = useState(5); // June (0-indexed)

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const pct       = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const visible = myOnly
    ? tasks.filter(t => t.assignees.some(a => a.initials === MY_USER))
    : tasks;

  const cycleStatus = (id: number) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: STATUS_NEXT[t.status] } : t));

  const toggleRow = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () =>
    setSelected(
      visible.every(t => selected.has(t.id)) ? new Set() : new Set(visible.map(t => t.id))
    );

  const bulkMarkDone = () => {
    setTasks(prev => prev.map(t => selected.has(t.id) ? { ...t, status: 'done' as TaskStatus } : t));
    setSelected(new Set());
  };

  const bulkDelete = () => {
    setTasks(prev => prev.filter(t => !selected.has(t.id)));
    setSelected(new Set());
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const viewBtn = (v: ViewMode) =>
    `p-2 rounded-lg transition-colors ${view === v ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0f1929] relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0 bg-white dark:bg-[#131f35]">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-[#12233A] dark:text-white">Tasks</h1>
          <span className="text-xs text-gray-400 font-medium tabular-nums">{doneCount} / {tasks.length} complete</span>
          <div className="w-24 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMyOnly(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              myOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15'
            }`}
          >
            My Tasks
          </button>

          <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-white/5 rounded-lg p-0.5">
            <button className={viewBtn('list')}     onClick={() => setView('list')}     title="List view">
              <List        className="w-4 h-4" />
            </button>
            <button className={viewBtn('board')}    onClick={() => setView('board')}    title="Board view">
              <LayoutGrid  className="w-4 h-4" />
            </button>
            <button className={viewBtn('calendar')} onClick={() => setView('calendar')} title="Calendar view">
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>

          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#0064CC] text-white rounded-lg text-sm font-semibold hover:bg-[#015297] transition-colors">
            <Plus className="w-4 h-4" />
            Add a Task
          </button>
        </div>
      </div>

      {view === 'list' && (
        <ListView
          tasks={visible}
          selected={selected}
          onToggle={toggleRow}
          onToggleAll={toggleAll}
          onCycle={cycleStatus}
        />
      )}
      {view === 'board' && (
        <BoardView tasks={visible} onCycle={cycleStatus} />
      )}
      {view === 'calendar' && (
        <CalendarView
          tasks={visible}
          year={calYear}
          month={calMonth}
          onPrev={prevMonth}
          onNext={nextMonth}
        />
      )}

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          onMarkDone={bulkMarkDone}
          onDelete={bulkDelete}
          onClear={() => setSelected(new Set())}
        />
      )}
    </div>
  );
}
