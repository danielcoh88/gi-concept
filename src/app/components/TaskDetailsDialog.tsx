import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle, Pencil, Tag, Paperclip } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaskDetail {
  id: number;
  name: string;
  dueDate: string;
  dueDateIso: string;
  dueStatus: 'overdue' | 'urgent' | 'upcoming';
  taskStatus: 'not-started' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeNames: string[];
  description: string;
  linkedEntities: { label: string; value: string }[];
  attachedFiles: { name: string; fileType: string }[];
}

interface TaskDetailsDialogProps {
  task: TaskDetail | null;
  onClose: () => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const DUE_STATUS_CONFIG: Record<TaskDetail['dueStatus'], { label: string; bg: string; text: string }> = {
  overdue:  { label: 'Overdue',  bg: 'bg-red-100',   text: 'text-red-700'   },
  urgent:   { label: 'Due Soon', bg: 'bg-amber-100', text: 'text-amber-700' },
  upcoming: { label: 'Upcoming', bg: 'bg-blue-100',  text: 'text-blue-700'  },
};

const TASK_STATUS_CONFIG: Record<TaskDetail['taskStatus'], { label: string; bg: string; text: string }> = {
  'not-started': { label: 'Not Started', bg: 'bg-gray-100',   text: 'text-gray-600'  },
  'in-progress': { label: 'In Progress', bg: 'bg-blue-100',   text: 'text-blue-700'  },
  'completed':   { label: 'Completed',   bg: 'bg-green-100',  text: 'text-green-700' },
};

const PRIORITY_CONFIG: Record<TaskDetail['priority'], { label: string; bg: string; text: string }> = {
  urgent: { label: 'Urgent', bg: 'bg-red-100',    text: 'text-red-700'    },
  high:   { label: 'High',   bg: 'bg-orange-100', text: 'text-orange-700' },
  medium: { label: 'Medium', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  low:    { label: 'Low',    bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

const FILE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  pdf:  { bg: 'bg-red-100',    text: 'text-red-700'    },
  xlsx: { bg: 'bg-green-100',  text: 'text-green-700'  },
  csv:  { bg: 'bg-green-100',  text: 'text-green-700'  },
  mp4:  { bg: 'bg-purple-100', text: 'text-purple-700' },
  jpg:  { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  png:  { bg: 'bg-blue-100',   text: 'text-blue-700'   },
};

const AVATAR_COLORS = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-green-400 to-green-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
];

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Edit draft ───────────────────────────────────────────────────────────────

interface EditDraft {
  name: string;
  taskStatus: TaskDetail['taskStatus'];
  priority: TaskDetail['priority'];
  dueDateIso: string;
  description: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskDetailsDialog({ task, onClose }: TaskDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft]         = useState<EditDraft | null>(null);
  const [localStatus, setLocalStatus] = useState<TaskDetail['taskStatus'] | null>(null);

  // Escape: exit edit mode first, then close
  useEffect(() => {
    if (!task) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isEditing) { cancelEdit(); } else { onClose(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [task, onClose, isEditing]);

  // Reset per-task local state when the selected task changes
  useEffect(() => {
    setIsEditing(false);
    setDraft(null);
    setLocalStatus(null);
  }, [task?.id]);

  if (!task) return null;

  const currentTaskStatus = localStatus ?? task.taskStatus;
  const displayName       = (isEditing ? draft?.name : null) ?? task.name;
  const displayDesc       = (isEditing ? draft?.description : null) ?? task.description;
  const displayPriority   = (isEditing ? draft?.priority : null) ?? task.priority;
  const displayStatus     = (isEditing ? draft?.taskStatus : null) ?? currentTaskStatus;

  const startEdit = () => {
    setDraft({
      name:        task.name,
      taskStatus:  currentTaskStatus,
      priority:    task.priority,
      dueDateIso:  task.dueDateIso,
      description: task.description,
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft(null);
  };

  const saveEdit = () => {
    if (draft) setLocalStatus(draft.taskStatus);
    setIsEditing(false);
  };

  const markComplete = () => setLocalStatus('completed');

  const isComplete = displayStatus === 'completed';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4"
      onClick={e => { if (e.target === e.currentTarget && !isEditing) onClose(); }}
    >
      <div className="bg-white dark:bg-[#131f35] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[88vh]">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/8 flex-shrink-0">
          {isEditing ? (
            <input
              autoFocus
              value={draft!.name}
              onChange={e => setDraft(d => d ? { ...d, name: e.target.value } : d)}
              className="flex-1 text-base font-bold text-gray-900 dark:text-white border-b-2 border-blue-500 outline-none bg-transparent pb-0.5 leading-snug"
            />
          ) : (
            <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{displayName}</h2>
          )}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Meta chips */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Due-date indicator — derived from date, always read-only */}
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${DUE_STATUS_CONFIG[task.dueStatus].bg} ${DUE_STATUS_CONFIG[task.dueStatus].text}`}>
              {DUE_STATUS_CONFIG[task.dueStatus].label}
            </span>

            {/* Task lifecycle status */}
            {isEditing ? (
              <select
                value={draft!.taskStatus}
                onChange={e => setDraft(d => d ? { ...d, taskStatus: e.target.value as TaskDetail['taskStatus'] } : d)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/15 outline-none cursor-pointer dark:[color-scheme:dark]"
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            ) : (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${TASK_STATUS_CONFIG[displayStatus].bg} ${TASK_STATUS_CONFIG[displayStatus].text}`}>
                {TASK_STATUS_CONFIG[displayStatus].label}
              </span>
            )}

            {/* Priority */}
            {isEditing ? (
              <select
                value={draft!.priority}
                onChange={e => setDraft(d => d ? { ...d, priority: e.target.value as TaskDetail['priority'] } : d)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/15 outline-none cursor-pointer dark:[color-scheme:dark]"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
            ) : (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_CONFIG[displayPriority].bg} ${PRIORITY_CONFIG[displayPriority].text}`}>
                {PRIORITY_CONFIG[displayPriority].label} Priority
              </span>
            )}

            {/* Due date */}
            {isEditing ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/15">
                <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                <input
                  type="date"
                  value={draft!.dueDateIso}
                  onChange={e => setDraft(d => d ? { ...d, dueDateIso: e.target.value } : d)}
                  className="text-xs text-gray-700 dark:text-gray-300 bg-transparent outline-none dark:[color-scheme:dark]"
                />
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                Due {task.dueDate}
              </span>
            )}
          </div>

          {/* Assignees — read-only; manage via Task Management module */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Assigned To</p>
            <div className="flex flex-col gap-2">
              {task.assigneeNames.map((name, i) => (
                <div key={name} className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                    {initials(name)}
                  </div>
                  <span className="text-sm text-gray-800 dark:text-gray-200">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Description</p>
            {isEditing ? (
              <textarea
                value={draft!.description}
                onChange={e => setDraft(d => d ? { ...d, description: e.target.value } : d)}
                rows={4}
                className="w-full text-sm text-gray-700 dark:text-gray-300 leading-relaxed border border-gray-200 dark:border-white/10 rounded-lg p-3 outline-none focus:border-blue-400 dark:focus:border-blue-500 resize-none bg-gray-50 dark:bg-white/5"
              />
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{displayDesc}</p>
            )}
          </div>

          {/* Attached files */}
          {task.attachedFiles.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Attached Files</p>
              <div className="flex flex-col gap-1.5">
                {task.attachedFiles.map(file => {
                  const ext   = file.fileType.toLowerCase();
                  const color = FILE_TYPE_COLORS[ext] ?? { bg: 'bg-gray-100', text: 'text-gray-600' };
                  return (
                    <div key={file.name} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
                      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${color.bg} ${color.text}`}>
                        {ext.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{file.name}</span>
                      <Paperclip className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Linked entities */}
          {task.linkedEntities.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Linked Evidence & Entities</p>
              <div className="flex flex-wrap gap-1.5">
                {task.linkedEntities.map(entity => (
                  <span
                    key={`${entity.label}-${entity.value}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium border border-gray-200 dark:border-white/10"
                  >
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">{entity.label}:</span> {entity.value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-white/8 flex-shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={markComplete}
                disabled={isComplete}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isComplete
                    ? 'text-green-700 bg-green-50 border border-green-200 cursor-default'
                    : 'text-white bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {isComplete ? 'Completed' : 'Mark as Complete'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
