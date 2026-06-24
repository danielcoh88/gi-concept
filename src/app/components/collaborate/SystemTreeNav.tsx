import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Users,
  MapPin,
  FolderOpen,
  ListTodo,
  Package,
  GitBranch,
  MessageSquare,
  Phone,
  User,
  Car,
  Plus,
  Link,
  Map,
  ClipboardList,
  FileText,
  Unlink,
  Eye,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import type { CaseEntity, EntityType, TreeSection, ContextMenuState } from './types';

// ─── Entity Icon Map ──────────────────────────────────────────────────────────

const entityTypeIcons: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  subject:    User,
  location:   MapPin,
  file:       FileText,
  task:       ListTodo,
  submission: Package,
  crimeline:  GitBranch,
  note:       MessageSquare,
  cdr:        Phone,
};

const sectionIcons: Record<EntityType, React.ComponentType<{ className?: string }>> = {
  subject:    Users,
  location:   MapPin,
  file:       FolderOpen,
  task:       ListTodo,
  submission: Package,
  crimeline:  GitBranch,
  note:       MessageSquare,
  cdr:        Phone,
};

// ─── Context Menu Actions ─────────────────────────────────────────────────────
// Actions are filtered by entity type at render time.
// Each action fires onAction(entity, actionId) for the parent to handle.

interface CMAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  applicableTypes: EntityType[];
  variant?: 'default' | 'destructive' | 'primary';
}

const CONTEXT_ACTIONS: CMAction[] = [
  { id: 'view', label: 'View Details', icon: Eye, description: 'Open full detail panel', applicableTypes: ['subject', 'location', 'file', 'task', 'submission', 'crimeline', 'note', 'cdr'], variant: 'default' },
  { id: 'view_map', label: 'View on Map', icon: Map, description: 'Jump to Locations module', applicableTypes: ['location', 'cdr'] },
  { id: 'create_task', label: 'Create Task', icon: ClipboardList, description: 'Add a new task linked to this item', applicableTypes: ['subject', 'location', 'file', 'cdr'], variant: 'primary' },
  { id: 'add_to_crimeline', label: 'Add to Crimeline', icon: GitBranch, description: 'Attach as timeline event', applicableTypes: ['location', 'file', 'submission', 'cdr'] },
  { id: 'link_subject', label: 'Link to Subject', icon: Link, description: 'Associate with a subject profile', applicableTypes: ['location', 'file', 'submission', 'cdr', 'task'] },
  { id: 'link_submission', label: 'Link to Submission', icon: Package, description: 'Attach to a lab submission', applicableTypes: ['subject', 'file'] },
  { id: 'run_osint', label: 'Run OSINT Search', icon: Sparkles, description: 'Enrich with open-source data', applicableTypes: ['subject'] },
  { id: 'add_note', label: 'Add Note', icon: MessageSquare, description: 'Create a case note on this item', applicableTypes: ['subject', 'location', 'file', 'task', 'submission'] },
  { id: 'unlink', label: 'Unlink', icon: Unlink, description: 'Remove connection to this item', applicableTypes: ['subject', 'location', 'file', 'task', 'submission', 'crimeline', 'note', 'cdr'], variant: 'destructive' },
];

// ─── Context Menu ─────────────────────────────────────────────────────────────

interface ContextMenuProps {
  state: ContextMenuState;
  onAction: (entity: CaseEntity, actionId: string) => void;
  onClose: () => void;
}

function EntityContextMenu({ state, onAction, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const applicable = CONTEXT_ACTIONS.filter((a) => a.applicableTypes.includes(state.entity.type));

  // Close on outside click or Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  // Flip menu upward if it would overflow viewport bottom
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: state.x,
    top: state.y,
    zIndex: 1000,
    minWidth: 220,
  };

  const variantStyles: Record<string, string> = {
    default: 'text-gray-700 hover:bg-gray-50',
    primary: 'text-blue-600 hover:bg-blue-50',
    destructive: 'text-red-600 hover:bg-red-50',
  };

  return (
    <div ref={menuRef} style={menuStyle}>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 overflow-hidden">
        {/* Entity header */}
        <div className="px-4 py-2.5 border-b border-gray-100">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">
            {state.entity.type}
          </div>
          <div className="text-sm font-semibold text-gray-900 truncate">{state.entity.label}</div>
          {state.entity.sublabel && (
            <div className="text-xs text-gray-500 truncate">{state.entity.sublabel}</div>
          )}
        </div>

        {/* Actions */}
        {applicable.map((action) => {
          const Icon = action.icon;
          const style = variantStyles[action.variant ?? 'default'];
          return (
            <button
              key={action.id}
              onClick={() => { onAction(state.entity, action.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${style}`}
              title={action.description}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">{action.label}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

interface TreeNodeProps {
  entity: CaseEntity;
  depth?: number;
  onEntityClick: (entity: CaseEntity, x: number, y: number) => void;
}

function TreeNode({ entity, depth = 0, onEntityClick }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = entity.children && entity.children.length > 0;
  const EntityIcon = entityTypeIcons[entity.type];

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) setExpanded((v) => !v);
    else onEntityClick(entity, e.clientX, e.clientY);
  }, [entity, hasChildren, onEntityClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEntityClick(entity, e.clientX, e.clientY);
  }, [entity, onEntityClick]);

  const roleColors: Record<string, string> = {
    Suspect: 'text-orange-600',
    Victim: 'text-red-600',
    Witness: 'text-blue-600',
    Unknown: 'text-gray-500',
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-100 group transition-colors select-none"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {hasChildren ? (
          expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        ) : (
          <div className="w-3.5 h-3.5 flex-shrink-0" />
        )}

        {/* Sub-type icon for subjects */}
        {entity.type === 'subject' && entity.subType === 'vehicle'
          ? <Car className="w-4 h-4 text-gray-500 flex-shrink-0" />
          : <EntityIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
        }

        <span className="flex-1 text-sm text-gray-700 truncate">{entity.label}</span>

        {/* Role badge for subjects */}
        {entity.role && (
          <span className={`text-xs font-semibold flex-shrink-0 ${roleColors[entity.role] ?? 'text-gray-500'}`}>
            {entity.role}
          </span>
        )}

        {/* Badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {entity.isNew && (
            <span className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0" title="New" />
          )}
          {entity.hasAlert && (
            <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
          )}
        </div>

        {/* Quick add on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); onEntityClick(entity, e.clientX, e.clientY); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-200 rounded"
          title="Quick actions"
        >
          <Plus className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      {expanded && hasChildren && (
        <div>
          {entity.children!.map((child) => (
            <TreeNode key={child.id} entity={child} depth={depth + 1} onEntityClick={onEntityClick} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tree Section ─────────────────────────────────────────────────────────────

interface TreeSectionComponentProps {
  section: TreeSection;
  onEntityClick: (entity: CaseEntity, x: number, y: number) => void;
}

function TreeSectionComponent({ section, onEntityClick }: TreeSectionComponentProps) {
  const [expanded, setExpanded] = useState(true);
  const SectionIcon = sectionIcons[section.entityType];

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors rounded-lg group"
      >
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        }
        <SectionIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
        <span className="flex-1 text-sm font-semibold text-gray-700 text-left">{section.label}</span>
        <div className="flex items-center gap-1.5">
          {section.newCount !== undefined && section.newCount > 0 && (
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">
              {section.newCount}
            </span>
          )}
          {section.alertCount !== undefined && section.alertCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">
              !{section.alertCount}
            </span>
          )}
          <span className="text-xs text-gray-400">{section.count}</span>
        </div>
      </button>

      {expanded && (
        <div className="ml-2">
          {section.entities.map((entity) => (
            <TreeNode key={entity.id} entity={entity} onEntityClick={onEntityClick} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mock Tree Data ───────────────────────────────────────────────────────────
// Represents case 05-CV-00234: Downtown Robbery Investigation

const MOCK_TREE: TreeSection[] = [
  {
    id: 's-subjects', entityType: 'subject', label: 'Subjects', count: 4, alertCount: 1,
    entities: [
      { id: 'sub-1', type: 'subject', label: 'John Miller', sublabel: 'DOB: Mar 12, 1988', subType: 'person', role: 'Suspect', hasAlert: true },
      { id: 'sub-2', type: 'subject', label: 'Sarah Chen', sublabel: 'DOB: Jul 5, 1995', subType: 'person', role: 'Victim' },
      { id: 'sub-3', type: 'subject', label: 'Marcus Davis', sublabel: 'DOB: Nov 22, 1980', subType: 'person', role: 'Witness' },
      { id: 'sub-4', type: 'subject', label: 'Blue Honda Civic — 8LMX203', subType: 'vehicle', role: 'Suspect' },
    ],
  },
  {
    id: 's-locations', entityType: 'location', label: 'Locations', count: 3, newCount: 1,
    entities: [
      { id: 'loc-1', type: 'location', label: 'Crime Scene', sublabel: 'Netanya Bloch St 34' },
      { id: 'loc-2', type: 'location', label: 'Gas Station', sublabel: 'Shell — Main St & 5th Ave', isNew: true },
      { id: 'loc-3', type: 'location', label: "Suspect's Residence", sublabel: '72 Harbor View Rd' },
    ],
  },
  {
    id: 's-files', entityType: 'file', label: 'Case Files', count: 12,
    entities: [
      {
        id: 'folder-1', type: 'file', label: 'CCTV Footage', children: [
          { id: 'file-1', type: 'file', label: 'GasStation_Jul21_23h52.mp4', sublabel: '1.2 GB', isNew: true },
          { id: 'file-2', type: 'file', label: 'NightClub_Entry_Jul21.mp4', sublabel: '845 MB' },
        ],
      },
      {
        id: 'folder-2', type: 'file', label: 'Evidence Photos', children: [
          { id: 'file-3', type: 'file', label: 'Scene_Overview_001.jpg', sublabel: '4.2 MB' },
          { id: 'file-4', type: 'file', label: 'Latent_Prints_002.jpg', sublabel: '3.8 MB' },
        ],
      },
      { id: 'file-5', type: 'file', label: 'Witness_Statement_Davis.pdf', sublabel: '120 KB' },
    ],
  },
  {
    id: 's-tasks', entityType: 'task', label: 'Tasks', count: 3, alertCount: 1,
    entities: [
      { id: 'task-1', type: 'task', label: 'Complete Investigation Report', sublabel: 'Overdue · Apr 29', hasAlert: true },
      { id: 'task-2', type: 'task', label: 'Lab Sample Testing', sublabel: 'Due today · MB, SK' },
      { id: 'task-3', type: 'task', label: 'Witness Interview - Marcus Davis', sublabel: 'Due May 1 · DL, JR' },
    ],
  },
  {
    id: 's-submissions', entityType: 'submission', label: 'Submissions', count: 3, newCount: 2,
    entities: [
      { id: 'sub-a183', type: 'submission', label: 'Submission #A183', sublabel: 'DNA Analysis — Results ready', isNew: true },
      { id: 'sub-b441', type: 'submission', label: 'Submission #B441', sublabel: 'Toxicology — In progress', isNew: true },
      { id: 'sub-c892', type: 'submission', label: 'Submission #C892', sublabel: 'Fingerprint — Complete' },
    ],
  },
  {
    id: 's-crimelines', entityType: 'crimeline', label: 'Crimelines', count: 1,
    entities: [
      { id: 'cl-1', type: 'crimeline', label: 'Jul 21 — Night of Incident', sublabel: '14 events · Last edited 2h ago' },
    ],
  },
  {
    id: 's-notes', entityType: 'note', label: 'Case Notes', count: 6, newCount: 2,
    entities: [
      { id: 'note-1', type: 'note', label: 'Mark B. — CCTV confirms location match', sublabel: '22 min ago', isNew: true },
      { id: 'note-2', type: 'note', label: 'Sarah K. — Witness timeline inconsistency', sublabel: '2h ago', isNew: true },
      { id: 'note-3', type: 'note', label: 'David L. — Alibi cross-check needed', sublabel: '5h ago' },
    ],
  },
  {
    id: 's-cdr', entityType: 'cdr', label: 'CDR Records', count: 1, alertCount: 1,
    entities: [
      { id: 'cdr-1', type: 'cdr', label: 'Phone Records — John Miller', sublabel: 'Jul 20–22 · 3 location overlaps found', hasAlert: true },
    ],
  },
];

// ─── System Tree Nav ──────────────────────────────────────────────────────────

export interface SystemTreeNavProps {
  caseId: string;
  onEntityAction?: (entity: CaseEntity, actionId: string) => void;
}

export function SystemTreeNav({ caseId: _caseId, onEntityAction }: SystemTreeNavProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleEntityClick = useCallback((entity: CaseEntity, x: number, y: number) => {
    setContextMenu({ entity, x, y });
  }, []);

  const handleAction = useCallback((entity: CaseEntity, actionId: string) => {
    setContextMenu(null);
    onEntityAction?.(entity, actionId);
  }, [onEntityAction]);

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 relative">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Case Structure</h3>
      </div>

      {/* Scrollable tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {MOCK_TREE.map((section) => (
          <TreeSectionComponent
            key={section.id}
            section={section}
            onEntityClick={handleEntityClick}
          />
        ))}
      </div>

      {/* Context menu portal */}
      {contextMenu && (
        <EntityContextMenu
          state={contextMenu}
          onAction={handleAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
