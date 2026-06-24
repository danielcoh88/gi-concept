import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, X, ChevronDown, ChevronsUpDown, Sparkles, Plus } from 'lucide-react';
import { useAISuggestions } from './useAISuggestions';
import { format, parseISO } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubjectId = 'marcus' | 'elena' | 'david' | 'alex';

interface LocationEvent {
  id:           string;
  subjectId:    SubjectId;
  subjectName:  string;
  datetime:     string;
  time:         string;
  address:      string;
  lat:          number;
  lng:          number;
  sourceType:   string;
  sourceAction: string;
}

// ─── Palettes ─────────────────────────────────────────────────────────────────

const SUBJECTS: Record<SubjectId, { color: string }> = {
  marcus: { color: '#3b82f6' },
  elena:  { color: '#a855f7' },
  david:  { color: '#10b981' },
  alex:   { color: '#f97316' },
};

const SOURCE_STYLE: Record<string, { bg: string; text: string }> = {
  'GPS':        { bg: '#dcfce7', text: '#15803d' },
  'CCTV':       { bg: '#ffedd5', text: '#c2410c' },
  'Cell tower': { bg: '#f1f5f9', text: '#475569' },
  'UFDR':       { bg: '#f3e8ff', text: '#7e22ce' },
  'Wi-Fi':      { bg: '#dbeafe', text: '#1d4ed8' },
};

// ─── Mock Events ──────────────────────────────────────────────────────────────

const EVENTS: LocationEvent[] = [
  // ── Jul 21 ──────────────────────────────────────────────────────────────────
  { id: 'ev-1',  subjectId: 'marcus', subjectName: 'Marcus Vance',  datetime: '2023-07-21T23:31:00', time: '23:31:00', address: '1180 Oak St (Gas Station)',    lat: 32.3155, lng: 34.8588, sourceType: 'CCTV',       sourceAction: 'Visited'             },
  { id: 'ev-2',  subjectId: 'marcus', subjectName: 'Marcus Vance',  datetime: '2023-07-21T23:42:00', time: '23:42:00', address: 'Netanya Bloch St 34',           lat: 32.3245, lng: 34.8518, sourceType: 'GPS',        sourceAction: 'Visited'             },
  { id: 'ev-3',  subjectId: 'elena',  subjectName: 'Elena Rostova', datetime: '2023-07-21T23:42:00', time: '23:42:00', address: 'Netanya Bloch St 34',           lat: 32.3243, lng: 34.8521, sourceType: 'GPS',        sourceAction: 'Visited'             },
  { id: 'ev-4',  subjectId: 'marcus', subjectName: 'Marcus Vance',  datetime: '2023-07-21T23:51:00', time: '23:51:00', address: 'Harbor Blvd & Main St',         lat: 32.3212, lng: 34.8496, sourceType: 'Cell tower', sourceAction: 'Unknown Reliability' },
  { id: 'ev-9',  subjectId: 'david',  subjectName: 'David Chen',    datetime: '2023-07-21T22:15:00', time: '22:15:00', address: 'Kikar HaAtzmaut, Netanya',      lat: 32.3317, lng: 34.8586, sourceType: 'GPS',        sourceAction: 'Visited'             },
  { id: 'ev-10', subjectId: 'alex',   subjectName: 'Alex Turner',   datetime: '2023-07-21T23:18:00', time: '23:18:00', address: 'Sderot Binyamin, Netanya',      lat: 32.3198, lng: 34.8534, sourceType: 'CCTV',       sourceAction: 'Visited'             },
  { id: 'ev-11', subjectId: 'david',  subjectName: 'David Chen',    datetime: '2023-07-21T23:35:00', time: '23:35:00', address: '1180 Oak St (Gas Station)',     lat: 32.3157, lng: 34.8590, sourceType: 'CCTV',       sourceAction: 'Visited'             },
  { id: 'ev-12', subjectId: 'alex',   subjectName: 'Alex Turner',   datetime: '2023-07-22T00:05:00', time: '00:05:00', address: 'Herzl Blvd & Raziel St',        lat: 32.3260, lng: 34.8478, sourceType: 'Cell tower', sourceAction: 'Unknown Reliability' },
  // ── Jul 22 ──────────────────────────────────────────────────────────────────
  { id: 'ev-5',  subjectId: 'marcus', subjectName: 'Marcus Vance',  datetime: '2023-07-22T00:09:00', time: '00:09:00', address: '412 Harbor View Rd',            lat: 32.3292, lng: 34.8442, sourceType: 'GPS',        sourceAction: 'Visited'             },
  { id: 'ev-6',  subjectId: 'elena',  subjectName: 'Elena Rostova', datetime: '2023-07-22T00:09:00', time: '00:09:00', address: '412 Harbor View Rd',            lat: 32.3290, lng: 34.8445, sourceType: 'UFDR',       sourceAction: 'Visited'             },
  { id: 'ev-7',  subjectId: 'marcus', subjectName: 'Marcus Vance',  datetime: '2023-07-22T00:22:00', time: '00:22:00', address: '412 Harbor View Rd',            lat: 32.3292, lng: 34.8442, sourceType: 'Cell tower', sourceAction: 'Unknown Reliability' },
  { id: 'ev-8',  subjectId: 'marcus', subjectName: 'Marcus Vance',  datetime: '2023-07-22T11:45:00', time: '11:45:00', address: '72 Harbor View Rd',             lat: 32.3278, lng: 34.8452, sourceType: 'GPS',        sourceAction: 'Visited'             },
  { id: 'ev-13', subjectId: 'david',  subjectName: 'David Chen',    datetime: '2023-07-22T09:30:00', time: '09:30:00', address: 'Ir Yamim Mall, Netanya',        lat: 32.3104, lng: 34.8562, sourceType: 'GPS',        sourceAction: 'Visited'             },
  { id: 'ev-14', subjectId: 'alex',   subjectName: 'Alex Turner',   datetime: '2023-07-22T11:00:00', time: '11:00:00', address: 'Sironit Beach, Netanya',        lat: 32.3352, lng: 34.8521, sourceType: 'CCTV',       sourceAction: 'Visited'             },
  { id: 'ev-15', subjectId: 'elena',  subjectName: 'Elena Rostova', datetime: '2023-07-22T15:10:00', time: '15:10:00', address: 'Sironit Beach, Netanya',        lat: 32.3350, lng: 34.8525, sourceType: 'GPS',        sourceAction: 'Visited'             },
  { id: 'ev-16', subjectId: 'marcus', subjectName: 'Marcus Vance',  datetime: '2023-07-22T14:20:00', time: '14:20:00', address: 'Netanya Central Station',       lat: 32.3165, lng: 34.8631, sourceType: 'GPS',        sourceAction: 'Visited'             },
  // ── Jul 23 ──────────────────────────────────────────────────────────────────
  { id: 'ev-17', subjectId: 'marcus', subjectName: 'Marcus Vance',  datetime: '2023-07-23T09:00:00', time: '09:00:00', address: 'Netanya Hospital',              lat: 32.3136, lng: 34.8669, sourceType: 'GPS',        sourceAction: 'Visited'             },
  { id: 'ev-18', subjectId: 'elena',  subjectName: 'Elena Rostova', datetime: '2023-07-23T10:15:00', time: '10:15:00', address: '221 Raziel St, Netanya',        lat: 32.3228, lng: 34.8551, sourceType: 'GPS',        sourceAction: 'Visited'             },
  { id: 'ev-19', subjectId: 'david',  subjectName: 'David Chen',    datetime: '2023-07-23T08:45:00', time: '08:45:00', address: 'Netanya Central Station',       lat: 32.3165, lng: 34.8631, sourceType: 'GPS',        sourceAction: 'Visited'             },
  { id: 'ev-20', subjectId: 'alex',   subjectName: 'Alex Turner',   datetime: '2023-07-23T14:30:00', time: '14:30:00', address: 'Ruppin Academic Center',        lat: 32.3073, lng: 34.8614, sourceType: 'UFDR',       sourceAction: 'Visited'             },
  { id: 'ev-21', subjectId: 'david',  subjectName: 'David Chen',    datetime: '2023-07-23T16:00:00', time: '16:00:00', address: 'Poleg Industrial Zone',         lat: 32.3042, lng: 34.8538, sourceType: 'Wi-Fi',      sourceAction: 'Visited'             },
  { id: 'ev-22', subjectId: 'alex',   subjectName: 'Alex Turner',   datetime: '2023-07-23T17:45:00', time: '17:45:00', address: 'Kikar HaAtzmaut, Netanya',      lat: 32.3315, lng: 34.8588, sourceType: 'GPS',        sourceAction: 'Visited'             },
  { id: 'ev-23', subjectId: 'elena',  subjectName: 'Elena Rostova', datetime: '2023-07-23T19:20:00', time: '19:20:00', address: 'Herzl Blvd & Raziel St',        lat: 32.3262, lng: 34.8476, sourceType: 'Cell tower', sourceAction: 'Unknown Reliability' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDate(events: LocationEvent[]) {
  const map = new Map<string, LocationEvent[]>();
  for (const ev of events) {
    const key = ev.datetime.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return Array.from(map.entries()).map(([key, evs]) => ({
    dateKey: key,
    label:   format(parseISO(key), 'yyyy-MM-dd (EEEE)'),
    events:  evs,
  }));
}

interface MapPin {
  lat:      number;
  lng:      number;
  address:  string;
  events:   LocationEvent[];
  subjects: SubjectId[];
}

function buildPins(events: LocationEvent[]): MapPin[] {
  const map = new Map<string, LocationEvent[]>();
  for (const ev of events) {
    const key = `${ev.lat.toFixed(3)},${ev.lng.toFixed(3)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return Array.from(map.values()).map(evs => ({
    lat:      evs[0].lat,
    lng:      evs[0].lng,
    address:  evs[0].address,
    events:   evs,
    subjects: [...new Set(evs.map(e => e.subjectId))] as SubjectId[],
  }));
}

function makeDivIconHtml(subjects: SubjectId[], count: number, isActive: boolean): string {
  const c1  = SUBJECTS[subjects[0]].color;
  const c2  = subjects[1] ? SUBJECTS[subjects[1]].color : c1;
  const bg  = subjects.length > 1
    ? `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`
    : c1;
  const size = count > 1 ? 30 : 22;
  const ring = isActive ? `box-shadow:0 0 0 3px rgba(255,255,255,0.9),0 0 0 5px ${c1};` : '';
  return `<div style="
    width:${size}px;height:${size}px;border-radius:50%;
    background:${bg};border:2px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.25);${ring}
    display:flex;align-items:center;justify-content:center;
    font-size:10px;color:white;font-weight:700;
    cursor:pointer;
  ">${count > 1 ? count : ''}</div>`;
}

// ─── AI Suggested Location ────────────────────────────────────────────────────

const SUGGESTED_LOCATION = {
  address: '18 Port Side Ave',
  label:   "Elena Rostova's Last Known Residence",
  reason:  'Device metadata from UFDR recovery places her here 3 hrs before the incident. Cell tower pings confirm proximity.',
  source:  'UFDR – Elena Rostova',
  lat:     32.3185,
  lng:     34.8612,
};

function makeSuggestedPinHtml(): string {
  return `<div style="
    width:32px;height:32px;border-radius:50%;
    border:3px dashed #a855f7;
    background:linear-gradient(135deg,#fb7185,#a855f7);
    display:flex;align-items:center;justify-content:center;
    font-size:13px;color:white;font-weight:700;
    box-shadow:0 0 14px rgba(168,85,247,0.45);
    cursor:pointer;
  ">✦</div>`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SourceBadge({ type, action }: { type: string; action: string }) {
  const s = SOURCE_STYLE[type] ?? { bg: '#f1f5f9', text: '#475569' };
  return (
    <div className="flex items-center gap-1 mt-1.5">
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.text }}>
        {type}
      </span>
      <span className="text-[10px] text-[#5E6974] dark:text-gray-500">•</span>
      <span className="text-[10px] text-[#5E6974] dark:text-gray-500">{action}</span>
    </div>
  );
}

function EventCard({
  event, isSelected, isLast, onClick,
}: {
  event: LocationEvent; isSelected: boolean; isLast: boolean; onClick: () => void;
}) {
  const color = SUBJECTS[event.subjectId].color;
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 px-4 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
    >
      <div className="flex flex-col items-center pt-3 flex-shrink-0">
        <div className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-[#131f35] shadow-sm" style={{ background: color }} />
        {!isLast && <div className="flex-1 w-px bg-gray-200 dark:bg-white/10 mt-1" style={{ minHeight: 20 }} />}
      </div>
      <div className={`flex-1 py-3 min-w-0 ${!isLast ? 'border-b border-gray-100 dark:border-white/8' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-semibold text-[#12233A] dark:text-white">{event.subjectName}</span>
          <span className="text-[11px] font-mono text-[#5E6974] dark:text-gray-400 flex-shrink-0">{event.time}</span>
        </div>
        <p className="text-[11px] text-[#5E6974] dark:text-gray-400 mt-0.5 truncate">{event.address}</p>
        <SourceBadge type={event.sourceType} action={event.sourceAction} />
      </div>
    </div>
  );
}

// ─── Imperative Leaflet map ───────────────────────────────────────────────────

function LeafletMap({
  pins, selectedEventId, onPinClick, showSuggestion,
}: {
  pins: MapPin[]; selectedEventId: string | null; onPinClick: (id: string) => void; showSuggestion: boolean;
}) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const markersRef      = useRef<L.Marker[]>([]);
  const suggestMarkerRef = useRef<L.Marker | null>(null);

  const rebuildMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    pins.forEach(pin => {
      const isActive = pin.events.some(e => e.id === selectedEventId);
      const size     = pin.events.length > 1 ? 30 : 22;
      const icon     = L.divIcon({
        className:   '',
        html:        makeDivIconHtml(pin.subjects, pin.events.length, isActive),
        iconSize:    [size, size],
        iconAnchor:  [size / 2, size / 2],
        popupAnchor: [0, -size / 2 - 2],
      });

      const popupHtml = `
        <div style="font-size:12px;min-width:160px">
          <p style="font-weight:600;color:#12233A;margin-bottom:4px">${pin.address}</p>
          ${pin.events.map(ev => `
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
              <div style="width:8px;height:8px;border-radius:50%;background:${SUBJECTS[ev.subjectId].color};flex-shrink:0"></div>
              <span style="color:#5E6974">${ev.subjectName}</span>
              <span style="color:#5E6974;font-family:monospace">${ev.time}</span>
            </div>`).join('')}
        </div>`;

      const marker = L.marker([pin.lat, pin.lng], { icon });
      marker.bindPopup(popupHtml);
      marker.on('click', () => onPinClick(pin.events[0].id));
      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [pins, selectedEventId, onPinClick]);

  // Initialise map once — English tiles via Esri World Street Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center:      [32.3225, 34.85],
      zoom:        14,
      zoomControl: false,
    });

    // Esri World Street Map: globally renders all labels in English
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, &copy; OpenStreetMap contributors, and the GIS User Community',
        maxZoom: 19,
      },
    ).addTo(map);

    mapRef.current = map;

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { rebuildMarkers(); }, [rebuildMarkers]);

  useEffect(() => {
    if (!mapRef.current || !selectedEventId) return;
    const ev = EVENTS.find(e => e.id === selectedEventId);
    if (ev) mapRef.current.flyTo([ev.lat, ev.lng], 17, { duration: 0.7 });
  }, [selectedEventId]);

  // Suggested location pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (suggestMarkerRef.current) { suggestMarkerRef.current.remove(); suggestMarkerRef.current = null; }
    if (!showSuggestion) return;
    const icon = L.divIcon({
      className:   '',
      html:        makeSuggestedPinHtml(),
      iconSize:    [32, 32],
      iconAnchor:  [16, 16],
      popupAnchor: [0, -20],
    });
    const popup = `<div style="font-size:12px;min-width:180px">
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
        <span style="font-size:10px;font-weight:700;color:#7e22ce;background:#f3e8ff;padding:1px 6px;border-radius:99px">Suggested by AI</span>
      </div>
      <p style="font-weight:600;color:#12233A;margin-bottom:2px">${SUGGESTED_LOCATION.label}</p>
      <p style="color:#5E6974;font-size:11px">${SUGGESTED_LOCATION.address}</p>
    </div>`;
    const marker = L.marker([SUGGESTED_LOCATION.lat, SUGGESTED_LOCATION.lng], { icon });
    marker.bindPopup(popup);
    marker.addTo(map);
    suggestMarkerRef.current = marker;
  }, [showSuggestion]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Zoom controls — bottom-right, matching reference */}
      <div className="absolute bottom-8 right-3 z-[1000] flex flex-col shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
        <button onClick={() => mapRef.current?.zoomIn()}  className="w-8 h-8 bg-white dark:bg-[#131f35] hover:bg-gray-50 dark:hover:bg-white/10 flex items-center justify-center text-[#12233A] dark:text-white font-semibold text-base transition-colors border-b border-gray-200 dark:border-white/10" title="Zoom in">+</button>
        <button onClick={() => mapRef.current?.zoomOut()} className="w-8 h-8 bg-white dark:bg-[#131f35] hover:bg-gray-50 dark:hover:bg-white/10 flex items-center justify-center text-[#12233A] dark:text-white font-semibold text-base transition-colors" title="Zoom out">−</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface LocationsPageProps {
  caseId:   string;
  caseName: string;
  onBack:   () => void;
}

export function LocationsPage({ caseId }: LocationsPageProps) {
  const aiEnabled                                         = useAISuggestions();
  const [selectedEventId,       setSelectedEventId]       = useState<string | null>(null);
  const [search,                setSearch]                = useState('');
  const [dismissedLocation,     setDismissedLocation]     = useState(false);
  // Reset individual dismiss when global flag is re-enabled
  useEffect(() => { if (aiEnabled) setDismissedLocation(false); }, [aiEnabled]);
  const showSuggestedLocation = aiEnabled && !dismissedLocation;
  const sidebarRef = useRef<HTMLDivElement>(null);

  const filteredEvents = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? EVENTS : EVENTS.filter(ev =>
      ev.subjectName.toLowerCase().includes(q) || ev.address.toLowerCase().includes(q),
    );
  }, [search]);

  const dateGroups = useMemo(() => groupByDate(filteredEvents), [filteredEvents]);
  const mapPins    = useMemo(() => buildPins(filteredEvents),   [filteredEvents]);

  const handleEventClick = useCallback((id: string) => {
    setSelectedEventId(prev => prev === id ? null : id);
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    sidebarRef.current
      ?.querySelector(`[data-event-id="${selectedEventId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedEventId]);

  return (
    <div className="flex-1 flex overflow-hidden min-h-0 bg-white dark:bg-[#0f1929]">

      {/* ── Left sidebar ───────────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-white/10 overflow-hidden">

        {/* Sidebar title */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#131f35]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold text-[#12233A] dark:text-white">Locations</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0064CC] text-white rounded-lg text-xs font-semibold hover:bg-[#015297] transition-colors">
              <Plus className="w-3 h-3" />
              Add Location
            </button>
            <button title="Sort" className="p-1 text-[#5E6974] dark:text-gray-400 hover:text-[#12233A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors">
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AI Suggested Location */}
        {showSuggestedLocation && (
          <div className="m-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700/50 p-3">
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                Suggested by AI
              </span>
            </div>
            <div className="flex items-start gap-2.5 mb-2.5">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#fb7185,#a855f7)' }}>
                <span className="text-white text-xs font-bold">✦</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#12233A] dark:text-white leading-snug">{SUGGESTED_LOCATION.label}</p>
                <p className="text-[11px] text-[#5E6974] dark:text-gray-400 mt-0.5">{SUGGESTED_LOCATION.address}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
                1 Source
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setDismissedLocation(true)} className="text-[10px] text-[#5E6974] dark:text-gray-400 hover:text-red-500 font-medium transition-colors px-1">
                  Dismiss
                </button>
                <button onClick={() => setDismissedLocation(true)} className="flex items-center gap-1 px-2.5 py-1 bg-[#0064CC] text-white rounded-lg text-[10px] font-semibold hover:bg-[#015297] transition-colors">
                  <Plus className="w-2.5 h-2.5" />
                  Add Location
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Date-grouped event list */}
        <div className="flex-1 overflow-y-auto" ref={sidebarRef}>
          {dateGroups.length === 0 ? (
            <div className="flex items-center justify-center py-16 px-4">
              <p className="text-xs text-[#5E6974] dark:text-gray-400">No events match your filter.</p>
            </div>
          ) : dateGroups.map(group => (
            <div key={group.dateKey}>
              <div className="px-4 py-2 bg-[#F1F4F6] dark:bg-[#0f1929] border-y border-gray-200 dark:border-white/8 sticky top-0 z-10">
                <p className="text-[10px] font-semibold text-[#5E6974] dark:text-gray-400 tracking-wide">{group.label}</p>
              </div>
              {group.events.map((ev, idx) => (
                <div key={ev.id} data-event-id={ev.id}>
                  <EventCard
                    event={ev}
                    isSelected={selectedEventId === ev.id}
                    isLast={idx === group.events.length - 1}
                    onClick={() => handleEventClick(ev.id)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right pane: toolbar + map ───────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">

        {/* Horizontal filter toolbar */}
        <div className="flex-shrink-0 bg-white dark:bg-[#131f35] border-b border-gray-200 dark:border-white/10 px-3 py-2 flex items-center gap-2">

          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg w-40 focus:outline-none focus:border-[#0064CC] focus:ring-1 focus:ring-[#0064CC]/20 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          {/* Filter dropdowns */}
          {(['Date', 'Subjects', 'Tags', 'Sources'] as const).map(label => (
            <button
              key={label}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[#12233A] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap flex-shrink-0"
            >
              {label}
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          ))}

          {/* Mobile's non-visited toggle */}
          <div className="flex items-center gap-1.5 px-1 flex-shrink-0">
            <div className="w-7 h-4 bg-gray-200 dark:bg-white/15 rounded-full relative flex-shrink-0">
              <div className="w-3 h-3 bg-white rounded-full shadow absolute left-0.5 top-0.5 transition-transform" />
            </div>
            <span className="text-xs text-[#5E6974] dark:text-gray-400 whitespace-nowrap">Mobile's non-visited</span>
          </div>

          <div className="flex-1" />

          {/* Clear Filters */}
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-[#0064CC] hover:underline font-medium whitespace-nowrap flex-shrink-0"
            >
              Clear Filters
            </button>
          )}

          {/* Dismiss / close icon */}
          <button
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors flex-shrink-0"
            title="Close toolbar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Leaflet map */}
        <div className="flex-1 min-h-0">
          <LeafletMap
            pins={mapPins}
            selectedEventId={selectedEventId}
            onPinClick={handleEventClick}
            showSuggestion={showSuggestedLocation}
          />
        </div>
      </div>
    </div>
  );
}
