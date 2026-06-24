import { useCallback, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
} from '@xyflow/react';
import type { Connection, Node, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  X, CheckSquare, User, MapPin, Sparkles,
  FileText, Layout, Clock, ChevronDown, Maximize2, Minimize2,
} from 'lucide-react';

const WHITEBOARDS = [
  { id: '1', name: 'Intelligence Analysis Dashboard' },
  { id: '2', name: 'Case Management Dashboard' },
  { id: '3', name: 'Starlight - All Task Force' },
  { id: '4', name: 'Lightmat Portal' },
  { id: '5', name: 'Quotes child' },
  { id: '6', name: 'UI | Left Shift Project' },
];

// ─── Entity type styling ──────────────────────────────────────────────────────

const ENTITY_CONFIG: Record<string, {
  icon:      React.ComponentType<{ className?: string }>;
  bg:        string;
  border:    string;
  iconColor: string;
  label:     string;
}> = {
  task:       { icon: CheckSquare, bg: 'bg-blue-50',   border: 'border-blue-200',   iconColor: 'text-blue-600',   label: 'Task'       },
  subject:    { icon: User,        bg: 'bg-purple-50', border: 'border-purple-200', iconColor: 'text-purple-600', label: 'Subject'    },
  location:   { icon: MapPin,      bg: 'bg-green-50',  border: 'border-green-200',  iconColor: 'text-green-600',  label: 'Location'   },
  insight:    { icon: Sparkles,    bg: 'bg-violet-50', border: 'border-violet-200', iconColor: 'text-violet-600', label: 'Insight'    },
  submission: { icon: FileText,    bg: 'bg-amber-50',  border: 'border-amber-200',  iconColor: 'text-amber-600',  label: 'Submission' },
  event:      { icon: Clock,       bg: 'bg-orange-50', border: 'border-orange-200', iconColor: 'text-orange-600', label: 'Event'      },
};

const FALLBACK_CONFIG = ENTITY_CONFIG.submission;

// ─── EntityNode ───────────────────────────────────────────────────────────────

interface EntityNodeData {
  type:      string;
  title:     string;
  subtitle?: string;
  [key: string]: unknown;
}

function EntityNode({ data }: { data: EntityNodeData }) {
  const cfg  = ENTITY_CONFIG[data.type] ?? FALLBACK_CONFIG;
  const Icon = cfg.icon;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 10, height: 10, background: '#cbd5e1', borderColor: '#94a3b8' }}
      />
      <div className={`px-3 py-2.5 bg-white dark:bg-[#131f35] rounded-xl border-2 shadow-md ${cfg.border} min-w-[160px] max-w-[240px]`}>
        <div className="flex items-start gap-2">
          <div className={`flex-shrink-0 w-7 h-7 ${cfg.bg} rounded-lg flex items-center justify-center mt-0.5`}>
            <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${cfg.iconColor}`}>
              {cfg.label}
            </p>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug break-words">
              {(data.label as string) || (data.title as string) || '(unnamed)'}
            </p>
            {data.subtitle && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight break-words">{data.subtitle as string}</p>
            )}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 10, height: 10, background: '#cbd5e1', borderColor: '#94a3b8' }}
      />
    </>
  );
}

const nodeTypes: NodeTypes = { entity: EntityNode };

// ─── Inner canvas (must be inside ReactFlowProvider) ──────────────────────────

interface WhiteboardCanvasProps {
  nodes:         Node[];
  edges:         ReturnType<typeof useEdgesState>[0];
  onNodesChange: ReturnType<typeof useNodesState>[1];
  onEdgesChange: ReturnType<typeof useEdgesState>[1];
  setNodes:      React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges:      ReturnType<typeof useEdgesState>[2];
}

function WhiteboardCanvas({
  nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges,
}: WhiteboardCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (connection: Connection) => setEdges(eds => addEdge(connection, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Try the purpose-built key first, then fall back to text/plain
    const raw =
      e.dataTransfer.getData('application/reactflow-entity') ||
      e.dataTransfer.getData('text/plain');
    if (!raw) return;

    try {
      const payload = JSON.parse(raw) as {
        type?: string; id?: string;
        title?: string; name?: string; content?: string;
        subtitle?: string;
      };

      // Resolve the display label — use || so empty strings also fall through
      const label =
        payload.title   ||
        payload.name    ||
        payload.content ||
        '(unnamed)';

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      const newNode: Node = {
        id:   `${payload.type ?? 'entity'}-${Date.now()}`,
        type: 'entity',
        position,
        data: {
          label,
          type:     payload.type     ?? 'entity',
          subtitle: payload.subtitle ?? undefined,
        },
      };
      setNodes(nds => [...nds, newNode]);
    } catch { /* ignore malformed payload */ }
  }, [screenToFlowPosition, setNodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      nodeTypes={nodeTypes}
      deleteKeyCode="Backspace"
      fitView={false}
      minZoom={0.2}
      maxZoom={4}
    >
      <Controls position="bottom-left" />
      <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#e2e8f0" />
    </ReactFlow>
  );
}

// ─── Exported panel — in-flow flex sibling, no overlay ───────────────────────

interface CaseWhiteboardPanelProps {
  onClose: () => void;
  onExpand?: () => void;
  isExpanded?: boolean;
}

export function CaseWhiteboardPanel({ onClose, onExpand, isExpanded = false }: CaseWhiteboardPanelProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedId, setSelectedId] = useState(WHITEBOARDS[0].id);

  const containerClass = isExpanded
    ? 'flex-1 flex flex-col overflow-hidden bg-[#F8FAFC] dark:bg-[#0f1929]'
    : 'flex-shrink-0 w-[620px] border-l border-gray-200 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0f1929] flex flex-col overflow-hidden';

  return (
    <div className={containerClass}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-[#131f35] border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Layout className="w-3.5 h-3.5 text-blue-600" />
          </div>
          {/* Whiteboard dropdown */}
          <div className="relative">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="appearance-none pl-2 pr-7 py-1 text-sm font-semibold text-[#12233A] dark:text-white bg-transparent dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-lg hover:border-gray-300 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer dark:[color-scheme:dark]"
            >
              {WHITEBOARDS.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {isExpanded ? (
            <button
              onClick={onClose}
              title="Back to side panel"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#12233A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={onExpand}
                title="Open in tab"
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
            </>
          )}
        </div>
      </div>

      {/* React Flow canvas — fills remaining height */}
      <div className="flex-1 min-h-0">
        <ReactFlowProvider>
          <WhiteboardCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            setNodes={setNodes}
            setEdges={setEdges}
          />
        </ReactFlowProvider>
      </div>

    </div>
  );
}
