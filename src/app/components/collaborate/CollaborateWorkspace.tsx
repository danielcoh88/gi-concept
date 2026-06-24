import { useState, useCallback } from 'react';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { SystemTreeNav } from './SystemTreeNav';
import { CaseActivityFeed } from './CaseActivityFeed';
import { GenesisAIPanel } from './GenesisAIPanel';
import type {
  WorkspaceProps,
  CaseEntity,
  ActivityFeedItem,
  AIActionWidget,
  AIEventWidget,
  AINextStep,
} from './types';

// ─── Resize Handle ────────────────────────────────────────────────────────────
// Allows users to adjust the tree nav width by dragging.
// Respects min/max constraints to prevent unusable layouts.

const TREE_MIN = 200;
const TREE_MAX = 400;
const TREE_DEFAULT = 260;
const GENESIS_WIDTH = 380;

// ─── Toast ────────────────────────────────────────────────────────────────────
// Lightweight feedback for context menu actions — avoids full navigation.

interface ToastMessage { id: string; text: string }

function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((text: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return { toasts, show };
}

function ToastStack({ toasts }: { toasts: ToastMessage[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ─── Entity Action Handler ─────────────────────────────────────────────────────
// Routes context menu action IDs to user-facing feedback + downstream logic.
// In production: dispatch to global state or call API endpoints.

function useEntityActions(toast: (msg: string) => void) {
  return useCallback((entity: CaseEntity, actionId: string) => {
    const name = entity.label;
    const actions: Record<string, string> = {
      view:            `Opening details for "${name}"`,
      view_map:        `Jumping to Locations map for "${name}"`,
      create_task:     `Creating task linked to "${name}"`,
      add_to_crimeline:`Adding "${name}" to active Crimeline`,
      link_subject:    `Linking "${name}" to a Subject…`,
      link_submission: `Attaching "${name}" to Lab Submission…`,
      run_osint:       `Running OSINT enrichment on "${name}"`,
      add_note:        `Opening note composer for "${name}"`,
      unlink:          `Unlinking "${name}" — confirm in dialog`,
    };
    toast(actions[actionId] ?? `Action "${actionId}" on "${name}"`);
  }, [toast]);
}

// ─── Collaborate Workspace ────────────────────────────────────────────────────
// The primary split-layout case workspace.
//
// Layout (left → right):
//   [SystemTreeNav | resizable] [CaseActivityFeed | flex-1] [GenesisAIPanel | fixed 380px | toggle]
//
// The three-panel layout is designed so investigators can:
//   1. Navigate case structure without losing feed context
//   2. See live activity while querying AI
//   3. Execute AI-recommended actions directly from the panel

export function CollaborateWorkspace({ caseId, caseName, caseStatus }: WorkspaceProps) {
  const [isGenesisOpen, setIsGenesisOpen] = useState(false);
  const [treeWidth, setTreeWidth] = useState(TREE_DEFAULT);
  const [isDragging, setIsDragging] = useState(false);
  const { toasts, show: showToast } = useToast();
  const handleEntityAction = useEntityActions(showToast);

  // Resize handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = treeWidth;

    const onMove = (ev: MouseEvent) => {
      const next = Math.min(TREE_MAX, Math.max(TREE_MIN, startWidth + ev.clientX - startX));
      setTreeWidth(next);
    };
    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [treeWidth]);

  const handleNavigate = useCallback((item: ActivityFeedItem) => {
    showToast(`Navigating to "${item.entityLabel}"`);
  }, [showToast]);

  const handleAIAction = useCallback((widget: AIActionWidget, cta: 'primary' | 'secondary') => {
    showToast(`${cta === 'primary' ? widget.primaryCTA : widget.secondaryCTA}: ${widget.title}`);
  }, [showToast]);

  const handleAIEvent = useCallback((widget: AIEventWidget) => {
    showToast(`${widget.primaryCTA}: ${widget.title}`);
  }, [showToast]);

  const handleNextStep = useCallback((step: AINextStep) => {
    showToast(`Starting: ${step.suggestion}`);
  }, [showToast]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Top toolbar */}
      <WorkspaceToolbar
        caseId={caseId}
        caseName={caseName}
        caseStatus={caseStatus}
        isGenesisOpen={isGenesisOpen}
        onBack={() => {}}
        onDownload={() => showToast('Download dialog opened')}
        onRecord={() => showToast('Recording started')}
        onNotebook={() => showToast('Notebook opened')}
        onShare={() => showToast('Share dialog opened')}
        onToggleGenesis={() => setIsGenesisOpen((v) => !v)}
        onMoreOptions={() => showToast('More options menu')}
      />

      {/* Three-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: System Tree Nav */}
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{ width: treeWidth }}
        >
          <SystemTreeNav caseId={caseId} onEntityAction={handleEntityAction} />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`flex-shrink-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors ${isDragging ? 'bg-blue-400' : 'bg-gray-200'}`}
          title="Drag to resize"
        />

        {/* Center: Case Activity Feed */}
        <div className="flex-1 overflow-hidden">
          <CaseActivityFeed caseId={caseId} onNavigate={handleNavigate} />
        </div>

        {/* Right: Cellebrite AI Panel (toggled) */}
        {isGenesisOpen && (
          <div
            className="flex-shrink-0 overflow-hidden border-l border-gray-200"
            style={{ width: GENESIS_WIDTH }}
          >
            <GenesisAIPanel
              onClose={() => setIsGenesisOpen(false)}
              onActionWidgetExecute={handleAIAction}
              onEventWidgetExecute={handleAIEvent}
              onNextStepExecute={handleNextStep}
            />
          </div>
        )}
      </div>

      {/* Toast feedback */}
      <ToastStack toasts={toasts} />
    </div>
  );
}
