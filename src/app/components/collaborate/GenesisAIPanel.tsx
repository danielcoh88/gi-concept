import { useState, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  Map,
  Clock,
  CheckSquare,
  Search,
  Link,
  ChevronRight,
  AlertTriangle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  MapPin,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import type { AIResponse, AIActionWidget, AIEventWidget, AINextStep, EntityType, UrgencyLevel } from './types';

// ─── Source Selector ──────────────────────────────────────────────────────────

const SOURCES: { id: EntityType; label: string }[] = [
  { id: 'cdr',        label: 'CDR' },
  { id: 'subject',    label: 'Subjects' },
  { id: 'location',   label: 'Locations' },
  { id: 'file',       label: 'Files' },
  { id: 'submission', label: 'Lab' },
  { id: 'crimeline',  label: 'Crimelines' },
  { id: 'note',       label: 'Notes' },
];

interface SourceSelectorProps {
  selected: EntityType[];
  onChange: (sources: EntityType[]) => void;
}

function SourceSelector({ selected, onChange }: SourceSelectorProps) {
  const toggle = (id: EntityType) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {SOURCES.map((s) => {
        const active = selected.includes(s.id);
        return (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              active
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Confidence Meter ─────────────────────────────────────────────────────────

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{value}%</span>
    </div>
  );
}

// ─── Action Widget ────────────────────────────────────────────────────────────

const urgencyBorder: Record<UrgencyLevel, string> = {
  critical: 'border-l-red-500',
  high:     'border-l-orange-500',
  medium:   'border-l-yellow-500',
  low:      'border-l-blue-400',
};

const actionWidgetIcons: Record<AIActionWidget['type'], React.ComponentType<{ className?: string }>> = {
  map_location: MapPin,
  create_task:  CheckSquare,
  run_osint:    Search,
  link_entity:  Link,
};

interface ActionWidgetProps {
  widget: AIActionWidget;
  onAction: (widget: AIActionWidget, cta: 'primary' | 'secondary') => void;
}

function ActionWidgetCard({ widget, onAction }: ActionWidgetProps) {
  const Icon = actionWidgetIcons[widget.type];
  const border = urgencyBorder[widget.urgency];

  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${border} rounded-lg p-3 space-y-2`}>
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 w-7 h-7 bg-blue-100 rounded flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-900 leading-tight">{widget.title}</span>
            {(widget.urgency === 'critical' || widget.urgency === 'high') && (
              <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{widget.description}</p>
        </div>
      </div>

      {widget.type === 'map_location' && widget.coordinates && (
        <div className="flex items-center gap-2 px-2.5 py-2 bg-gray-50 rounded text-xs text-gray-600 border border-gray-100">
          <Map className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="font-medium">{widget.coordinates.label}</span>
          <span className="text-gray-400 ml-auto">
            {widget.coordinates.lat.toFixed(4)}°, {widget.coordinates.lng.toFixed(4)}°
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onAction(widget, 'primary')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          {widget.primaryCTA}
          <ArrowRight className="w-3 h-3" />
        </button>
        {widget.secondaryCTA && (
          <button
            onClick={() => onAction(widget, 'secondary')}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold hover:bg-gray-200 transition-colors"
          >
            {widget.secondaryCTA}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Event Widget ─────────────────────────────────────────────────────────────

const eventTypeStyles: Record<AIEventWidget['type'], { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  incident:      { icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  movement:      { icon: MapPin,        color: 'text-blue-600 bg-blue-50' },
  communication: { icon: Copy,          color: 'text-purple-600 bg-purple-50' },
  transaction:   { icon: ChevronRight,  color: 'text-green-600 bg-green-50' },
};

interface EventWidgetProps {
  widget: AIEventWidget;
  onAction: (widget: AIEventWidget) => void;
}

function EventWidgetCard({ widget, onAction }: EventWidgetProps) {
  const { icon: Icon, color } = eventTypeStyles[widget.type];
  const date = new Date(widget.eventTimestamp);
  const formattedDate = `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center ${color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-900 leading-tight block">{widget.title}</span>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{widget.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded text-xs text-gray-600 border border-gray-100">
        <Calendar className="w-3 h-3 text-gray-400" />
        <span>{formattedDate}</span>
        <Clock className="w-3 h-3 text-gray-400 ml-1.5" />
        <span className="capitalize">{widget.type}</span>
      </div>

      <button
        onClick={() => onAction(widget)}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-semibold hover:bg-purple-700 transition-colors"
      >
        {widget.primaryCTA}
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Next Steps ───────────────────────────────────────────────────────────────

const stepActionStyles: Record<AINextStep['actionType'], { label: string; color: string }> = {
  investigate: { label: 'Investigate', color: 'bg-blue-100 text-blue-700' },
  verify:      { label: 'Verify',      color: 'bg-yellow-100 text-yellow-700' },
  document:    { label: 'Document',    color: 'bg-gray-100 text-gray-600' },
  escalate:    { label: 'Escalate',    color: 'bg-red-100 text-red-700' },
};

interface NextStepItemProps {
  step: AINextStep;
  index: number;
  onExecute: (step: AINextStep) => void;
}

function NextStepItem({ step, index, onExecute }: NextStepItemProps) {
  const { label, color } = stepActionStyles[step.actionType];
  return (
    <button
      onClick={() => onExecute(step)}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
    >
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 mb-0.5">{step.suggestion}</p>
        <p className="text-xs text-gray-500 leading-snug">{step.rationale}</p>
        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${color}`}>{label}</span>
      </div>
      <ChevronRight className="flex-shrink-0 w-4 h-4 text-gray-300 group-hover:text-gray-500 mt-1 transition-colors" />
    </button>
  );
}

// ─── Mock Response ────────────────────────────────────────────────────────────

const MOCK_RESPONSE: AIResponse = {
  id: 'resp-001',
  summary: 'Analysis reveals 3 overlapping time-location windows between suspect John Miller\'s claimed alibi and cell tower pings placing a device linked to him within 400m of the crime scene between 23:40–23:55 on Jul 21.',
  confidence: 78,
  processingMs: 1840,
  sources: ['cdr', 'location', 'subject'],
  actionWidgets: [
    {
      id: 'aw-1',
      title: 'Suspect Location Overlap',
      description: 'Cell tower sectors A14 and A15 place a device linked to John Miller at the crime scene window.',
      type: 'map_location',
      coordinates: { lat: 32.0853, lng: 34.7818, label: 'Crime Scene Overlap Zone' },
      urgency: 'high',
      primaryCTA: 'View on Map',
      secondaryCTA: 'Add Case Lead',
    },
    {
      id: 'aw-2',
      title: 'Create Warrant Task',
      description: 'Probable cause established for full CDR warrant for device IMEI 35-123456-789012.',
      type: 'create_task',
      urgency: 'critical',
      primaryCTA: 'Create Task',
      secondaryCTA: 'Draft Template',
    },
  ],
  eventWidgets: [
    {
      id: 'ew-1',
      title: 'Cell Tower Ping — Tower A14',
      description: 'Device linked to John Miller pinged sector A14, placing it 380m from the crime scene.',
      eventTimestamp: '2023-07-21T23:47:00',
      type: 'movement',
      relatedEntityIds: ['sub-1', 'cdr-1'],
      crimelineId: 'cl-1',
      primaryCTA: 'Add to Crimeline',
    },
    {
      id: 'ew-2',
      title: 'Gas Station CCTV Match',
      description: 'CCTV timestamp at Shell Station matches CDR ping 5 min after incident. Plate matches Blue Honda Civic.',
      eventTimestamp: '2023-07-21T23:52:00',
      type: 'incident',
      relatedEntityIds: ['sub-4', 'file-1', 'loc-2'],
      crimelineId: 'cl-1',
      primaryCTA: 'Add to Crimeline',
    },
  ],
  nextSteps: [
    { id: 'ns-1', suggestion: 'Obtain full CDR warrant for IMEI 35-123456-789012', rationale: 'Current data covers only 3 days. A 30-day record would confirm alibi pattern.', actionType: 'investigate', urgency: 'critical' },
    { id: 'ns-2', suggestion: 'Cross-reference gas station receipt timestamps', rationale: 'Payment records at 23:52 could place subject at scene 5 min after incident.', actionType: 'verify', urgency: 'high' },
    { id: 'ns-3', suggestion: 'Request surrounding street surveillance', rationale: '3 cameras on Main St cover exit routes. Footage may confirm vehicle direction.', actionType: 'investigate', urgency: 'medium' },
    { id: 'ns-4', suggestion: 'Document CDR findings in case notes', rationale: 'Auditable record of AI-assisted analysis strengthens chain of custody.', actionType: 'document', urgency: 'low' },
  ],
  timestamp: new Date(),
};

const SUGGESTED_QUERIES = [
  'Cross-reference overlapping location data between suspect movements and CDR cell tower pings',
  'What inconsistencies exist in the witness timeline?',
  'Summarize all new lab results and their case implications',
];

// ─── Cellebrite AI Panel ─────────────────────────────────────────────────────────

export interface GenesisAIPanelProps {
  onClose: () => void;
  onActionWidgetExecute?: (widget: AIActionWidget, cta: 'primary' | 'secondary') => void;
  onEventWidgetExecute?: (widget: AIEventWidget) => void;
  onNextStepExecute?: (step: AINextStep) => void;
}

type PanelState = 'idle' | 'loading' | 'response';

export function GenesisAIPanel({
  onClose,
  onActionWidgetExecute,
  onEventWidgetExecute,
  onNextStepExecute,
}: GenesisAIPanelProps) {
  const [query, setQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<EntityType[]>(['cdr', 'location', 'subject']);
  const [panelState, setPanelState] = useState<PanelState>('response');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!query.trim() || selectedSources.length === 0) return;
    setPanelState('loading');
    setTimeout(() => setPanelState('response'), 1800);
  };

  const handleSuggestedQuery = (q: string) => {
    setQuery(q);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">Cellebrite AI</div>
            <div className="text-[10px] text-gray-500">Multi-source investigation intelligence</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/60 rounded transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Query area */}
        <div className="px-4 py-4 border-b border-gray-100 space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Data Sources
            </label>
            <SourceSelector selected={selectedSources} onChange={setSelectedSources} />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Query
            </label>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
                placeholder="Ask across selected sources… (⌘ Enter to send)"
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-colors"
              />
              <button
                onClick={handleSubmit}
                disabled={!query.trim() || selectedSources.length === 0 || panelState === 'loading'}
                className="absolute bottom-2 right-2 p-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-40"
                title="Send (⌘ Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {panelState === 'idle' && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Suggested</div>
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuery(q)}
                  className="w-full text-left text-xs text-gray-600 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 hover:border-purple-200 hover:text-purple-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {panelState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <p className="text-sm text-gray-500">Analyzing {selectedSources.length} source{selectedSources.length !== 1 ? 's' : ''}…</p>
          </div>
        )}

        {/* Response */}
        {panelState === 'response' && (
          <div className="px-4 py-4 space-y-5">
            {/* Summary */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Summary</div>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Copy response">
                    <Copy className="w-3 h-3 text-gray-400" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Helpful">
                    <ThumbsUp className="w-3 h-3 text-gray-400" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Not helpful">
                    <ThumbsDown className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{MOCK_RESPONSE.summary}</p>
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-400">Confidence</span>
                  <span className="text-[10px] text-gray-400">
                    {MOCK_RESPONSE.processingMs}ms · {MOCK_RESPONSE.sources.join(', ')}
                  </span>
                </div>
                <ConfidenceMeter value={MOCK_RESPONSE.confidence} />
              </div>
            </div>

            {/* Action Widgets */}
            {MOCK_RESPONSE.actionWidgets.filter(Boolean).length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Map className="w-3 h-3" /> Recommended Actions
                </div>
                <div className="space-y-2">
                  {MOCK_RESPONSE.actionWidgets.filter(Boolean).map((w) => (
                    <ActionWidgetCard
                      key={w!.id}
                      widget={w!}
                      onAction={(widget, cta) => onActionWidgetExecute?.(widget, cta)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Event Widgets */}
            {MOCK_RESPONSE.eventWidgets.filter(Boolean).length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Timeline Events
                </div>
                <div className="space-y-2">
                  {MOCK_RESPONSE.eventWidgets.filter(Boolean).map((w) => (
                    <EventWidgetCard
                      key={w!.id}
                      widget={w!}
                      onAction={(widget) => onEventWidgetExecute?.(widget)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {MOCK_RESPONSE.nextSteps.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Next Steps
                </div>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
                  {MOCK_RESPONSE.nextSteps.map((step, i) => (
                    <NextStepItem
                      key={step.id}
                      step={step}
                      index={i}
                      onExecute={(s) => onNextStepExecute?.(s)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
