import { Download, Mic, BookOpen, Sparkles, MoreVertical, ArrowLeft, Share2 } from 'lucide-react';
import type { CaseStatus } from './types';

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  'Active Investigation': 'bg-blue-100 text-blue-700 border-blue-200',
  'Under Review':         'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Pending Investigation':'bg-orange-100 text-orange-700 border-orange-200',
  'Active':               'bg-teal-100 text-teal-700 border-teal-200',
  'Suspended':            'bg-gray-100 text-gray-600 border-gray-200',
  'Cold Case':            'bg-purple-100 text-purple-700 border-purple-200',
  'Resolved':             'bg-green-100 text-green-700 border-green-200',
  'Closed':               'bg-gray-100 text-gray-500 border-gray-200',
  'Pending Trial':        'bg-indigo-100 text-indigo-700 border-indigo-200',
};

// ─── Quick Action ─────────────────────────────────────────────────────────────
// Each button in the toolbar follows the same visual pattern — icon + label,
// with a tight hover state. Tooltips appear on hover for discoverability.

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: number;
  variant?: 'default' | 'primary' | 'ai';
}

function QuickAction({ icon: Icon, label, onClick, active, badge, variant = 'default' }: QuickActionProps) {
  const base = 'group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all';

  const variantStyles = {
    default: active
      ? 'bg-gray-200 text-gray-900'
      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    ai: active
      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
      : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200 text-purple-700 hover:from-purple-500/20 hover:to-blue-500/20',
  };

  return (
    <button onClick={onClick} className={`${base} ${variantStyles[variant]}`} title={label}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
      {/* Tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
        {label}
      </div>
    </button>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

// ─── Workspace Toolbar ────────────────────────────────────────────────────────
// Persistent top bar within the Collaborate workspace.
// Left: case identity (back nav, case ID, name, status badge).
// Right: quick-access tools ordered by usage frequency, with Cellebrite AI toggle.

export interface WorkspaceToolbarProps {
  caseId: string;
  caseName: string;
  caseStatus: CaseStatus;
  isGenesisOpen: boolean;
  onBack: () => void;
  onDownload: () => void;
  onRecord: () => void;
  onNotebook: () => void;
  onShare: () => void;
  onToggleGenesis: () => void;
  onMoreOptions: () => void;
}

export function WorkspaceToolbar({
  caseId,
  caseName,
  caseStatus,
  isGenesisOpen,
  onBack,
  onDownload,
  onRecord,
  onNotebook,
  onShare,
  onToggleGenesis,
  onMoreOptions,
}: WorkspaceToolbarProps) {
  const statusStyle = statusStyles[caseStatus] ?? 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 flex-shrink-0 gap-4">
      {/* Left: Case identity */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          title="Back to Cases"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 flex-shrink-0">{caseId}</span>
            <span className="text-gray-300 flex-shrink-0">·</span>
            <span className="text-sm text-gray-600 truncate">{caseName}</span>
          </div>
        </div>

        <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle}`}>
          {caseStatus}
        </span>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <QuickAction icon={Download} label="Download" onClick={onDownload} />
        <QuickAction icon={Mic} label="Record" onClick={onRecord} />
        <QuickAction icon={BookOpen} label="Notebook" onClick={onNotebook} />
        <QuickAction icon={Share2} label="Share" onClick={onShare} />

        <Divider />

        {/* Cellebrite AI toggle — visually distinct to signal intelligence capability */}
        <QuickAction
          icon={Sparkles}
          label="Cellebrite AI"
          onClick={onToggleGenesis}
          active={isGenesisOpen}
          variant="ai"
        />

        <button
          onClick={onMoreOptions}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          title="More options"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
