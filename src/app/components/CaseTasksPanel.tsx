import { X, Maximize2, ListTodo, Plus, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: number;
  name: string;
  dueDate: string;
  assigneeInitials: string[];
  dueStatus: 'overdue' | 'urgent' | 'upcoming';
  taskStatus: 'not-started' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TASKS: Task[] = [
  { id: 1, name: 'Complete Investigation Report',  dueDate: 'Apr 29', assigneeInitials: ['TH'],           dueStatus: 'overdue',  taskStatus: 'in-progress',  priority: 'urgent' },
  { id: 2, name: 'Surveillance Footage Analysis',  dueDate: 'Apr 30', assigneeInitials: ['MB', 'SK'],     dueStatus: 'urgent',   taskStatus: 'not-started',  priority: 'high'   },
  { id: 3, name: 'Witness Interview',              dueDate: 'May 1',  assigneeInitials: ['DL', 'JR'],     dueStatus: 'urgent',   taskStatus: 'not-started',  priority: 'high'   },
  { id: 4, name: 'Review CCTV Footage',            dueDate: 'May 3',  assigneeInitials: ['AM'],           dueStatus: 'upcoming', taskStatus: 'not-started',  priority: 'medium' },
  { id: 5, name: 'CDR Analysis Cross-Reference',  dueDate: 'May 5',  assigneeInitials: ['MB'],           dueStatus: 'upcoming', taskStatus: 'not-started',  priority: 'medium' },
  { id: 6, name: 'Submit Forensic Report',         dueDate: 'May 8',  assigneeInitials: ['SK', 'DL'],    dueStatus: 'upcoming', taskStatus: 'not-started',  priority: 'low'    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-rose-500', 'bg-cyan-500',
];

function avatarColor(initials: string) {
  let hash = 0;
  for (const c of initials) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function StatusIcon({ status }: { status: Task['taskStatus'] }) {
  if (status === 'completed')  return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
  if (status === 'in-progress') return <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />;
  return <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />;
}

const PRIORITY_DOT: Record<Task['priority'], string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-400',
  medium: 'bg-yellow-400',
  low:    'bg-gray-300',
};

const DUE_STYLE: Record<Task['dueStatus'], string> = {
  overdue:  'text-red-600 font-semibold',
  urgent:   'text-orange-500 font-semibold',
  upcoming: 'text-[#5E6974]',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CaseTasksPanelProps {
  onClose: () => void;
  onExpand: () => void;
}

export function CaseTasksPanel({ onClose, onExpand }: CaseTasksPanelProps) {
  const overdue  = TASKS.filter(t => t.dueStatus === 'overdue').length;
  const urgent   = TASKS.filter(t => t.dueStatus === 'urgent').length;

  return (
    <div className="flex flex-col w-80 border-l border-gray-200 dark:border-white/10 bg-white dark:bg-[#131f35] overflow-hidden flex-shrink-0">

      {/* Header — matches all panels */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#131f35] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <ListTodo className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#12233A] dark:text-white">Tasks</span>
            {overdue > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                <AlertCircle className="w-2.5 h-2.5" />{overdue} overdue
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onExpand}
            title="Open Tasks tab"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#12233A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#12233A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 dark:border-white/8 bg-[#F8F9FB] dark:bg-[#0f1929] flex-shrink-0">
        <span className="text-[11px] text-[#5E6974] dark:text-gray-400">{TASKS.length} total</span>
        <span className="w-px h-3 bg-gray-200 dark:bg-white/10" />
        <span className="text-[11px] text-orange-500 font-semibold">{urgent} urgent</span>
        <span className="w-px h-3 bg-gray-200 dark:bg-white/10" />
        <span className="text-[11px] text-[#5E6974] dark:text-gray-400">
          {TASKS.filter(t => t.taskStatus === 'in-progress').length} in progress
        </span>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-white/8">
        {TASKS.map(task => (
          <div
            key={task.id}
            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <StatusIcon status={task.taskStatus} />

            <div className="flex-1 min-w-0">
              {/* Name + priority dot */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                <p className={`text-xs font-semibold text-[#12233A] dark:text-white leading-snug truncate ${
                  task.taskStatus === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : ''
                }`}>
                  {task.name}
                </p>
              </div>

              {/* Due date + assignees */}
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] ${DUE_STYLE[task.dueStatus]}`}>
                  {task.dueStatus === 'overdue' ? '⚠ ' : ''}{task.dueDate}
                </span>
                <div className="flex items-center -space-x-1.5 flex-shrink-0">
                  {task.assigneeInitials.slice(0, 3).map((ini, i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded-full ${avatarColor(ini)} flex items-center justify-center text-white text-[8px] font-bold border border-white dark:border-[#131f35]`}
                    >
                      {ini}
                    </div>
                  ))}
                  {task.assigneeInitials.length > 3 && (
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/15 flex items-center justify-center text-gray-600 dark:text-gray-300 text-[8px] font-bold border border-white dark:border-[#131f35]">
                      +{task.assigneeInitials.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer — add task */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 dark:border-white/8 bg-white dark:bg-[#131f35]">
        <button className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-dashed border-gray-300 dark:border-white/15 hover:border-gray-400 dark:hover:border-white/25 rounded-lg text-[11px] font-medium text-[#5E6974] dark:text-gray-400 hover:text-[#12233A] dark:hover:text-white transition-all">
          <Plus className="w-3.5 h-3.5" />
          Add task
        </button>
      </div>
    </div>
  );
}
