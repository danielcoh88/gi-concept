import { useState, useRef, useEffect, useCallback } from 'react';
import './AIWorkspacePage.css';
import {
  Sparkles, ChevronDown, X, Plus, Send, Paperclip,
  BookOpen, Lock, Globe, Search, CheckSquare, Clock,
  MapPin, User, FileText, ChevronUp, Zap,
  Smartphone, Cloud, Phone, Database, Users,
  PanelLeftOpen, PanelLeftClose, FolderOpen, ChevronRight,
  Image, Video, Maximize2, Minimize2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Skill {
  id: string;
  name: string;
  description: string;
  author: string;
  authorInitials: string;
  visibility: 'private' | 'agency';
}

interface EvidenceDetail {
  label: string;
  value: string;
  confidence?: 'High' | 'Medium' | 'Low';
  sources?: string[];
}

interface StructuredResponse {
  findingsSummary: string;
  evidenceDetails: EvidenceDetail[];
  confidenceAssessment: string;
  nextRecommendedAction: string;
}

interface ActionChip {
  id: string;
  label: string;
  type: 'task' | 'crimeline' | 'subject' | 'note';
}

type AttachedFileType = 'image' | 'video' | 'pdf' | 'document' | 'file';

interface AttachedFile {
  name: string;
  type: AttachedFileType;
  size: string;
  previewUrl?: string;
}

interface LocationMatch {
  address: string;
  lat: number;
  lng: number;
  confidence: 'High' | 'Medium' | 'Low';
  clues: string[];
  neighbourhood: string;
  city: string;
}

interface FaceMatchResult {
  matches: Array<{ timestamp: string; seconds: number; confidence: number }>;
  totalDuration: string;
  bestFrameDescription: string;
  appearanceNotes: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachedFiles?: AttachedFile[];
  structuredResponse?: StructuredResponse;
  locationMatch?: LocationMatch;
  faceMatch?: FaceMatchResult;
  actionChips?: ActionChip[];
}

// ─── Mock data ─────────────────────────────────────────────────────────────

const MOCK_CASES = [
  { id: '05-CV-00234', name: 'Downtown Robbery Investigation' },
  { id: '05-CV-00189', name: 'Vehicle Theft Case' },
  { id: '05-CV-00156', name: 'Fraud Investigation – Tech Company' },
  { id: '05-CV-00178', name: 'Missing Person Report' },
];

const MOCK_SOURCES = [
  { id: 's1', filename: 'Cami_iPhone13.ufdr',         fileType: 'UFDR', icon: Smartphone, meta: '3.2 GB · 14,823 items', device: 'iPhone 13'       },
  { id: 's2', filename: 'Mark_SamsungGalaxy.ufdr',    fileType: 'UFDR', icon: Smartphone, meta: '2.1 GB · 9,401 items',  device: 'Samsung Galaxy'  },
  { id: 's3', filename: 'CDR_Records_Q1_2026.cdr',    fileType: 'CDR',  icon: Phone,      meta: '47,200 records',        device: null               },
  { id: 's4', filename: 'iCloud_Backup_042.ufdr',     fileType: 'UFDR', icon: Cloud,      meta: '8.7 GB · 31,045 items', device: 'iCloud'           },
];

const FILE_TYPE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  UFDR: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'    },
  CDR:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  PDF:  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'     },
};

// ─── Subjects ─────────────────────────────────────────────────────────────────
const MOCK_SUBJECTS = [
  { id: 'sub1', name: 'Marcus Vance',    role: 'Suspect',             initials: 'MV', color: 'bg-red-100 text-red-700'     },
  { id: 'sub2', name: 'Elena Rostova',   role: 'Witness',             initials: 'ER', color: 'bg-amber-100 text-amber-700' },
  { id: 'sub3', name: 'Cami Montgomery', role: 'Person of Interest',  initials: 'CM', color: 'bg-violet-100 text-violet-700' },
  { id: 'sub4', name: 'James Doakes',    role: 'Victim',              initials: 'JD', color: 'bg-gray-100 text-gray-700'   },
];

// ─── Timeframe ────────────────────────────────────────────────────────────────
const TIMEFRAME_PRESETS = [
  { id: 'tf1', label: 'Last 24 hours',              short: '24h'         },
  { id: 'tf2', label: 'Last 7 days',                short: '7d'          },
  { id: 'tf3', label: 'Last 30 days',               short: '30d'         },
  { id: 'tf4', label: 'Last 90 days',               short: '90d'         },
  { id: 'tf5', label: 'Incident date ± 7 days',     short: '±7d'         },
  { id: 'tf6', label: 'Apr 12 – Apr 19, 2026',      short: 'Apr 12–19'   },
];

// ─── Output Mode ──────────────────────────────────────────────────────────────
const OUTPUT_MODES = [
  { id: 'om1', label: 'Quick Brief',   description: 'Bullet-point summary, fast to scan',          icon: '⚡' },
  { id: 'om2', label: 'Deep Analysis', description: 'Thorough breakdown with all evidence links',  icon: '🔍' },
  { id: 'om3', label: 'Report Ready',  description: 'Formal language for case report inclusion',   icon: '📄' },
  { id: 'om4', label: 'Timeline',      description: 'Chronological sequence of events',            icon: '🕐' },
];

const MY_SKILLS: Skill[] = [
  {
    id: 'ms1',
    name: 'Extract Crypto Slang',
    description: 'Scans messages for cryptocurrency terminology and wallet references.',
    author: 'You',
    authorInitials: 'TZ',
    visibility: 'private',
  },
  {
    id: 'ms2',
    name: 'Financial Pattern Finder',
    description: 'Identifies unusual financial patterns and large transfers in communications.',
    author: 'You',
    authorInitials: 'TZ',
    visibility: 'private',
  },
];

const AGENCY_SKILLS: Skill[] = [
  {
    id: 'as1',
    name: 'Device Owner Identification',
    description: 'Identifies device ownership from UFDR metadata, contacts, and device info records.',
    author: 'Mark Brown',
    authorInitials: 'MB',
    visibility: 'agency',
  },
  {
    id: 'as2',
    name: 'Communication Network Mapper',
    description: 'Maps the top communication relationships by frequency, duration, and recency.',
    author: 'Sarah Kim',
    authorInitials: 'SK',
    visibility: 'agency',
  },
  {
    id: 'as3',
    name: 'Crypto Transaction Tracer',
    description: 'Traces cryptocurrency references across messages, apps, and browser history.',
    author: 'David Lee',
    authorInitials: 'DL',
    visibility: 'agency',
  },
  {
    id: 'as4',
    name: 'Dark Web Activity Detector',
    description: 'Flags references to .onion sites, Tor usage, and darknet marketplace terminology.',
    author: 'Jennifer Roberts',
    authorInitials: 'JR',
    visibility: 'agency',
  },
  {
    id: 'as5',
    name: 'Draft Search Warrant',
    description: 'Generates a formal search warrant affidavit from case evidence, subject details, and probable cause summary.',
    author: 'Mark Brown',
    authorInitials: 'MB',
    visibility: 'agency',
  },
  {
    id: 'as6',
    name: 'Geo-locate Image',
    description: 'Identifies the precise GPS location from any photo using visual landmarks, street signs, and environmental features.',
    author: 'Intelligence Unit',
    authorInitials: 'IU',
    visibility: 'agency',
  },
  {
    id: 'as7',
    name: 'Face Match in Video',
    description: 'Scans any video footage frame-by-frame to find a suspect\'s face, returning exact timestamps, confidence scores, and a still frame.',
    author: 'Cybercrime Unit',
    authorInitials: 'CU',
    visibility: 'agency',
  },
];

const MOCK_LOCATION_MATCH: LocationMatch = {
  address: '412 Harbor View Rd, Brooklyn, NY 11209',
  lat: 40.6929,
  lng: -73.9892,
  confidence: 'High',
  neighbourhood: 'Red Hook, Brooklyn',
  city: 'New York, NY',
  clues: [
    'Street sign visible in background: "Harbor View Rd" (bottom-left corner)',
    'Red brick warehouse facade — consistent with Red Hook industrial district architecture',
    'Overhead elevated highway structure matches BQE overpass section at Columbia St',
    'Water tower silhouette and Manhattan skyline bearing confirm south-facing camera angle',
  ],
};

const MOCK_FACE_MATCH: FaceMatchResult = {
  totalDuration: '47:12',
  bestFrameDescription: 'Male suspect, approx. 30–40 years, dark jacket, facing camera at 00:02:34',
  appearanceNotes: 'Subject wears dark hooded jacket, baseball cap tilted down. Partial face visible at 00:02:34 — best match. Brief full-face exposure at 00:15:47 during cash retrieval.',
  matches: [
    { timestamp: '00:02:34', seconds: 154,  confidence: 91 },
    { timestamp: '00:15:47', seconds: 947,  confidence: 87 },
    { timestamp: '00:41:12', seconds: 2472, confidence: 74 },
  ],
};

const CONTEXT_PROMPTS: Record<string, { text: string; category: string }[]> = {
  brief: [
    { text: "Summarize the current case status and key findings.",          category: "Summary"   },
    { text: "What are the most critical next steps for this investigation?", category: "Planning"  },
    { text: "Draft an executive summary of this case.",                     category: "Report"    },
    { text: "Are there any patterns in the activity log worth flagging?",   category: "Analysis"  },
  ],
  files: [
    { text: "Which files are most relevant to the primary suspect?",        category: "Evidence"  },
    { text: "Summarize the content of the UFDR submissions.",               category: "Devices"   },
    { text: "List all files linked to Marcus Vance.",                       category: "Subjects"  },
    { text: "Are there any files flagged for review?",                      category: "Flags"     },
  ],
  tasks: [
    { text: "Which tasks are overdue and what's the impact?",               category: "Priority"  },
    { text: "Who has the most outstanding tasks on this case?",             category: "Workload"  },
    { text: "Draft a task for reviewing the latest surveillance footage.",  category: "Create"    },
    { text: "Summarize the current team workload.",                         category: "Summary"   },
  ],
  submissions: [
    { text: "Summarize the latest lab results and their significance.",     category: "Results"   },
    { text: "Which submissions have been pending the longest?",             category: "Pending"   },
    { text: "What do the DNA results tell us about the crime scene?",       category: "Analysis"  },
    { text: "Draft a follow-up for the pending ballistics submission.",     category: "Follow-up" },
  ],
  subjects: [
    { text: "What connections exist between the subjects?",                 category: "Network"   },
    { text: "Summarize Marcus Vance's known locations and activity.",       category: "Profile"   },
    { text: "What is Elena Rostova's role in this case?",                   category: "Profile"   },
    { text: "Find any OSINT data linking these subjects.",                  category: "OSINT"     },
  ],
  locations: [
    { text: "Where were subjects located at the time of the incident?",    category: "Locations" },
    { text: "Are there overlapping location patterns between subjects?",    category: "Patterns"  },
    { text: "Summarize the CDR timeline for the 24h before the incident.", category: "CDR"       },
    { text: "Identify any unusual location activity in the last 7 days.",  category: "Anomaly"   },
  ],
  events: [
    { text: "Summarize the sequence of events on the night of the incident.", category: "Timeline" },
    { text: "Are there any timeline gaps that need investigation?",         category: "Gaps"      },
    { text: "Which event is most critical to establish probable cause?",    category: "Legal"     },
    { text: "Draft an event entry for the surveillance footage timestamp.", category: "Create"    },
  ],
  whiteboard: [
    { text: "Suggest connections between subjects and locations.",          category: "Links"     },
    { text: "What entities should be linked based on the evidence?",       category: "Evidence"  },
    { text: "Summarize the current investigation theory.",                  category: "Summary"   },
    { text: "Are there any missing links in the evidence chain?",          category: "Gaps"      },
  ],
  default: [
    { text: "Who owns this device and what are their aliases?",            category: "Identity"  },
    { text: "Map the top 5 contacts by call frequency and duration.",      category: "Network"   },
    { text: "Summarize all location activity in the last 30 days.",        category: "Locations" },
    { text: "Find any references to financial transactions or crypto.",    category: "Financial" },
  ],
};

// ─── Conversation history ─────────────────────────────────────────────────────

interface ConversationItem {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages: ChatMessage[];
}

const MOCK_RESPONSE: StructuredResponse = {
  findingsSummary:
    'The device is an iPhone 13c named explicitly "Cami\'s iPhone". Three independent data sources corroborate the same owner identity.',
  evidenceDetails: [
    { label: 'Device Owner Name',  value: 'DeviceInfo explicitly states the owner\'s name as "Cami\'s iPhone"',           confidence: 'High', sources: ['DeviceInfo · 489'] },
    { label: 'Email Identifiers',  value: 'Two accounts registered: cami.montgomery7@gmail.com, cami.mont@yahoo.com',   confidence: 'High', sources: ['Accounts · 12']   },
    { label: 'Phone Number',       value: 'Primary number +1 (502) 229-5100 confirmed via carrier data',                  confidence: 'High', sources: ['CDR Records · 3']  },
  ],
  confidenceAssessment: 'Overall Confidence: High — device name, two "Cami" emails, phone number, and contacts all point to the same user.',
  nextRecommendedAction: 'Analyze call/SMS/messaging logs for +1 (502) 229-5100 and both email accounts to map communication patterns and key contacts.',
};

const now = new Date();
const hrs  = (h: number) => new Date(now.getTime() - h * 3_600_000);
const days = (d: number) => new Date(now.getTime() - d * 86_400_000);

const MOCK_HISTORY: ConversationItem[] = [
  {
    id: 'h1',
    title: 'Device owner identification',
    preview: 'Who is the owner of this device?',
    timestamp: hrs(1),
    messages: [
      { id: 'h1u1', role: 'user',      content: 'Who is the owner of this device?', timestamp: '10:14 AM' },
      { id: 'h1a1', role: 'assistant', content: '', timestamp: '10:14 AM', structuredResponse: MOCK_RESPONSE,
        actionChips: [
          { id: 'c1', label: 'Add Event to Crimeline', type: 'crimeline' },
          { id: 'c2', label: 'Create Task',            type: 'task'      },
          { id: 'c3', label: 'Add as Subject',         type: 'subject'   },
        ],
      },
    ],
  },
  {
    id: 'h2',
    title: 'Contact network mapping',
    preview: 'Map the top 5 contacts by call frequency',
    timestamp: hrs(3),
    messages: [
      { id: 'h2u1', role: 'user',      content: 'Map the top 5 contacts by call frequency and duration.', timestamp: '08:42 AM' },
      { id: 'h2a1', role: 'assistant', content: '', timestamp: '08:43 AM', structuredResponse: {
          findingsSummary: 'Five primary contacts identified from CDR and messaging logs across the extraction period.',
          evidenceDetails: [
            { label: 'Top Contact', value: '+1 (502) 229-5100 — 147 calls, avg 4m 12s', confidence: 'High', sources: ['CDR · 2,341'] },
            { label: '2nd Contact', value: 'alias "ghost_07" — 89 Signal messages, encrypted', confidence: 'Medium', sources: ['Signal · 89'] },
          ],
          confidenceAssessment: 'High confidence on CDR data. Signal messages are metadata-only.',
          nextRecommendedAction: 'Subpoena carrier records for +1 (502) 229-5100 and attempt Signal account attribution.',
        },
      },
    ],
  },
  {
    id: 'h3',
    title: 'Financial transaction analysis',
    preview: 'Find references to financial transactions or crypto',
    timestamp: days(1),
    messages: [
      { id: 'h3u1', role: 'user',      content: 'Find any references to financial transactions or crypto.', timestamp: 'Yesterday 3:20 PM' },
      { id: 'h3a1', role: 'assistant', content: '', timestamp: 'Yesterday 3:21 PM', structuredResponse: {
          findingsSummary: '14 cryptocurrency wallet addresses found across SMS, Telegram, and browser history.',
          evidenceDetails: [
            { label: 'Wallet References', value: '3 Bitcoin, 8 Ethereum, 3 Monero addresses identified', confidence: 'High', sources: ['SMS · 4', 'Telegram · 6', 'Chrome · 4'] },
          ],
          confidenceAssessment: 'High — wallet formats validated against known patterns.',
          nextRecommendedAction: 'Run blockchain tracing on all identified wallet addresses via Chainalysis.',
        },
      },
    ],
  },
  {
    id: 'h4',
    title: 'Location activity summary',
    preview: 'Summarize all location activity in the last 30 days',
    timestamp: days(3),
    messages: [
      { id: 'h4u1', role: 'user',      content: 'Summarize all location activity in the last 30 days.', timestamp: '3 days ago' },
      { id: 'h4a1', role: 'assistant', content: '', timestamp: '3 days ago', structuredResponse: {
          findingsSummary: '312 location data points processed. Three recurring locations identified outside the subject\'s known address.',
          evidenceDetails: [
            { label: 'Primary Location',   value: '412 Harbor View Rd — visited 22 times, mostly 00:00–02:00', confidence: 'High' },
            { label: 'Secondary Location', value: 'Downtown Warehouse District — 8 visits, average 47 min',    confidence: 'High' },
          ],
          confidenceAssessment: 'High — GPS and cell tower data corroborated.',
          nextRecommendedAction: 'Cross-reference 412 Harbor View Rd with known associate addresses.',
        },
      },
    ],
  },
  {
    id: 'h5',
    title: 'Dark web activity check',
    preview: 'Any dark web or Tor references in messages?',
    timestamp: days(5),
    messages: [
      { id: 'h5u1', role: 'user',      content: 'Any dark web or Tor references in messages?', timestamp: '5 days ago' },
      { id: 'h5a1', role: 'assistant', content: '', timestamp: '5 days ago', structuredResponse: {
          findingsSummary: 'Two .onion URLs found in Telegram messages. Tor Browser detected in app usage logs.',
          evidenceDetails: [
            { label: 'Onion URLs', value: '2 unique .onion addresses shared via Telegram DMs', confidence: 'High', sources: ['Telegram · 2'] },
            { label: 'Tor Browser', value: 'Installed and used on 6 occasions — last use 3 days prior to device extraction', confidence: 'High' },
          ],
          confidenceAssessment: 'High — artifacts confirmed via app installation records.',
          nextRecommendedAction: 'Submit .onion URLs to CJIS for dark marketplace identification.',
        },
      },
    ],
  },
  {
    id: 'h6',
    title: 'Deleted messages recovery',
    preview: 'Recover and summarize deleted SMS messages',
    timestamp: days(7),
    messages: [
      { id: 'h6u1', role: 'user',      content: 'Recover and summarize deleted SMS messages.', timestamp: '7 days ago' },
      { id: 'h6a1', role: 'assistant', content: '', timestamp: '7 days ago', structuredResponse: {
          findingsSummary: '43 deleted SMS messages recovered from unallocated storage. 12 reference the incident date.',
          evidenceDetails: [
            { label: 'Recovered Messages', value: '43 messages — content partially intact, timestamps preserved', confidence: 'Medium' },
          ],
          confidenceAssessment: 'Medium — partial fragmentation in 8 messages.',
          nextRecommendedAction: 'Forward 12 incident-related messages to forensic analyst for full reconstruction.',
        },
      },
    ],
  },
];

// ─── Projects ─────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  description: string;
  instructions: string;
  color: string;
  conversations: ConversationItem[];
  createdAt: Date;
}

const PROJECT_COLORS = ['blue', 'violet', 'emerald', 'rose', 'amber', 'cyan'] as const;
type ProjectColor = typeof PROJECT_COLORS[number];

const PROJECT_COLOR_MAP: Record<ProjectColor, { dot: string; bg: string; text: string; border: string; badge: string }> = {
  blue:    { dot: 'bg-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-700'    },
  violet:  { dot: 'bg-violet-500',  bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  badge: 'bg-violet-100 text-violet-700'  },
  emerald: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  rose:    { dot: 'bg-rose-500',    bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-700'    },
  amber:   { dot: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700'   },
  cyan:    { dot: 'bg-cyan-500',    bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200',    badge: 'bg-cyan-100 text-cyan-700'    },
};

const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Financial Trail Analysis',
    description: 'Track cryptocurrency and financial transactions linked to the suspect.',
    instructions: 'Focus exclusively on financial evidence: crypto wallets, bank references, and transaction patterns. Flag any amounts over $10,000. Present findings using formal language suitable for court documentation.',
    color: 'emerald',
    createdAt: days(3),
    conversations: [
      { id: 'p1c1', title: 'Crypto wallet mapping', preview: 'Find all wallet addresses in the extraction', timestamp: days(2),
        messages: [
          { id: 'p1u1', role: 'user', content: 'Find all wallet addresses in the extraction.', timestamp: '2 days ago' },
          { id: 'p1a1', role: 'assistant', content: '', timestamp: '2 days ago', structuredResponse: {
            findingsSummary: '14 cryptocurrency wallet addresses found across SMS, Telegram, and browser history.',
            evidenceDetails: [{ label: 'Wallet Addresses', value: '3 Bitcoin, 8 Ethereum, 3 Monero addresses identified', confidence: 'High', sources: ['SMS · 4', 'Telegram · 6'] }],
            confidenceAssessment: 'High — wallet formats validated.',
            nextRecommendedAction: 'Run blockchain tracing via Chainalysis.',
          }},
        ],
      },
      { id: 'p1c2', title: 'Transaction pattern review', preview: 'Any recurring payment patterns?', timestamp: days(1),
        messages: [
          { id: 'p1u2', role: 'user', content: 'Any recurring payment patterns in the last 90 days?', timestamp: 'Yesterday' },
          { id: 'p1a2', role: 'assistant', content: '', timestamp: 'Yesterday', structuredResponse: {
            findingsSummary: 'Three recurring payment clusters identified: weekly transfers to a single address on Wednesdays.',
            evidenceDetails: [{ label: 'Weekly Transfers', value: 'Every Wednesday 22:00–23:00, avg 0.4 BTC per transfer', confidence: 'High' }],
            confidenceAssessment: 'High — 12 consecutive occurrences over 90 days.',
            nextRecommendedAction: 'Cross-reference Wednesday timestamps with location data.',
          }},
        ],
      },
    ],
  },
  {
    id: 'p2',
    name: 'Subject Network Mapping',
    description: 'Map communication relationships and identify unknown associates.',
    instructions: 'Analyze communication patterns between all identified subjects. Identify clusters, intermediaries, and timing correlations. Present findings as network relationships with confidence scores.',
    color: 'violet',
    createdAt: days(6),
    conversations: [
      { id: 'p2c1', title: 'Communication cluster analysis', preview: 'Who are the key intermediaries?', timestamp: days(4),
        messages: [
          { id: 'p2u1', role: 'user', content: 'Who are the key intermediaries in the communication network?', timestamp: '4 days ago' },
          { id: 'p2a1', role: 'assistant', content: '', timestamp: '4 days ago', structuredResponse: {
            findingsSummary: 'Two high-centrality nodes identified: alias "ghost_07" and an unknown number +1 (555) 0183.',
            evidenceDetails: [{ label: 'Ghost_07', value: 'Connects 4 known subjects — 89 Signal messages, 0 calls', confidence: 'High' }],
            confidenceAssessment: 'High centrality confirmed via network analysis.',
            nextRecommendedAction: 'Attempt Signal account attribution for ghost_07.',
          }},
        ],
      },
    ],
  },
];

const WARRANT_RESPONSE: StructuredResponse = {
  findingsSummary:
    'AFFIDAVIT IN SUPPORT OF SEARCH WARRANT — Case 05-CV-00234. Based on digital evidence extracted from the subject\'s device and CDR records, probable cause exists to believe that the premises at 412 Harbor View Rd contain evidence of the offenses charged.',
  evidenceDetails: [
    {
      label: 'Probable Cause Summary',
      value: 'Digital forensic analysis of Cami Montgomery\'s iPhone 13 (UFDR extraction, Apr 15 2026) revealed (1) geolocation data placing the device at 412 Harbor View Rd on the night of the incident, (2) encrypted Telegram communications with alias "ghost_07" referencing the location, and (3) browser history consistent with pre-incident reconnaissance.',
      confidence: 'High',
      sources: ['Cami_iPhone13.ufdr', 'CDR Records Q1 2026'],
    },
    {
      label: 'Items to be Seized',
      value: 'Any and all digital storage devices, mobile phones, computers, hard drives, USB drives, or cloud-accessible media containing evidence of communications, financial transactions, or location data relevant to Case 05-CV-00234.',
      confidence: 'High',
    },
    {
      label: 'Legal Authority',
      value: 'This warrant is sought pursuant to 18 U.S.C. § 2703 and applicable state statutes governing digital evidence search and seizure.',
      confidence: 'High',
    },
  ],
  confidenceAssessment:
    'Probable cause supported by corroborating digital evidence from two independent extraction sources and verified CDR location data. Recommend legal review prior to submission.',
  nextRecommendedAction:
    'Forward draft to supervising officer and district attorney\'s office for review. Ensure chain of custody documentation is completed before warrant execution.',
};

// ─── Quick-action guided first responses ─────────────────────────────────────
// Keyed by the exact prompt string sent from CaseBriefHomePage action buttons.

const QUICK_ACTION_RESPONSES: Record<string, string> = {
  "I need to create a task for this case. Walk me through it.":
    "Let's create a task together — I'll walk you through each field.\n\n**What's the task title?** Be as specific as possible so your team can identify it at a glance.",

  "I want to add a new subject to this investigation. Help me fill in the details.":
    "I'll help you add a new subject. Let's start with the basics.\n\n**What's the subject's full name?** Include any known aliases if you have them.",

  "I need to log an event on the crimeline. What information do you need from me?":
    "Let's log this event on the crimeline step by step.\n\n**What happened?** Describe the event in your own words — we'll pin the date, time, and location next.",

  "I want to locate a call or message in the evidence. Help me find it.":
    "I'll search the call detail records and communications data for you.\n\n**What are you looking for?** Give me a phone number, contact name, or keyword — and a date range if you know it.",

  "I need to submit evidence to the lab. Guide me through the process.":
    "Let's prepare a lab submission. I'll make sure the packing slip is complete.\n\n**What items are you submitting?** List the physical or digital evidence items you want to send.",

  "I want to find patterns across the evidence in this case. What should I look for?":
    "I'll analyze the case data for patterns. What kind are you after?\n\n- **Communication** — who is talking to whom, and how often\n- **Location** — places where subjects overlap\n- **Behavioral** — time-of-day routines or gaps in activity\n- **Financial** — transaction references or wallet addresses\n\nWhich would you like me to focus on first?",

  "I need to trace a location or route. Help me investigate it on the map.":
    "I'll pull up the location data for you. **What address or place do you want to investigate?** You can also give me a subject name and a time window if you want to trace a movement.",

  "I want to create a new whiteboard for this case. Help me set it up.":
    "Let's set up a new whiteboard. **What do you want to call it?** And what's the main theory or focus you want to map out — suspects, timeline, relationships, or something else?",
};

// ─── Confidence Badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  const colors = {
    High: 'bg-green-100 text-green-700 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Low: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[level]}`}>
      {level}
    </span>
  );
}

// ─── AI Response Card ─────────────────────────────────────────────────────────

function AIResponseCard({ response }: { response: StructuredResponse }) {
  return (
    <div className="bg-white dark:bg-[#131f35] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-white/8">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Findings Summary</p>
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{response.findingsSummary}</p>
      </div>

      <div className="p-4 border-b border-gray-100 dark:border-white/8">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Evidence Details</p>
        <div className="space-y-3">
          {response.evidenceDetails.map((detail, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{detail.label}</span>
                {detail.confidence && <ConfidenceBadge level={detail.confidence} />}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{detail.value}</p>
              {detail.sources && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {detail.sources.map((src, j) => (
                    <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] rounded-full border border-blue-100">
                      <FileText className="w-2.5 h-2.5" />
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-gray-100 dark:border-white/8">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Confidence Assessment</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{response.confidenceAssessment}</p>
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Next Recommended Action</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{response.nextRecommendedAction}</p>
      </div>
    </div>
  );
}

// ─── Action Chips ─────────────────────────────────────────────────────────────

const CHIP_ICONS: Record<ActionChip['type'], React.ComponentType<{ className?: string }>> = {
  task: CheckSquare,
  crimeline: Clock,
  subject: User,
  note: FileText,
};

// ─── Location Response Card ───────────────────────────────────────────────────

function LocationResponseCard({ match }: { match: LocationMatch }) {
  const bbox = `${match.lng - 0.015},${match.lat - 0.012},${match.lng + 0.015},${match.lat + 0.012}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${match.lat},${match.lng}`;

  return (
    <div className="bg-white dark:bg-[#131f35] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden w-full max-w-[520px]">
      {/* Map embed */}
      <div className="relative w-full" style={{ height: 220 }}>
        <iframe
          src={mapSrc}
          className="w-full h-full border-0"
          title="Location map"
          loading="lazy"
        />
        {/* Confidence badge overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg shadow">
          <MapPin className="w-3 h-3" /> {match.confidence} confidence
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Identified Location</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{match.address}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{match.neighbourhood} · {match.lat.toFixed(4)}°N, {Math.abs(match.lng).toFixed(4)}°W</p>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Visual Evidence Used</p>
          <ul className="space-y-1.5">
            {match.clues.map((clue, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-bold mt-0.5">{i + 1}</span>
                {clue}
              </li>
            ))}
          </ul>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${match.lat},${match.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline"
        >
          <MapPin className="w-3 h-3" /> Open in Google Maps →
        </a>
      </div>
    </div>
  );
}

// ─── Face Match Response Card ─────────────────────────────────────────────────

function FaceMatchResponseCard({ match }: { match: FaceMatchResult }) {
  const totalSeconds = (() => {
    const [m, s] = match.totalDuration.split(':').map(Number);
    return m * 60 + s;
  })();

  return (
    <div className="bg-white dark:bg-[#131f35] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden w-full max-w-[520px]">
      {/* Mock video frame with face detection box */}
      <div className="relative bg-gray-900 w-full flex items-center justify-center" style={{ height: 200 }}>
        {/* Scanline overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }}
        />
        {/* Face detection bounding box */}
        <div className="relative w-28 h-28">
          {/* Animated corner brackets */}
          {[['top-0 left-0','border-t-2 border-l-2'],['top-0 right-0','border-t-2 border-r-2'],['bottom-0 left-0','border-b-2 border-l-2'],['bottom-0 right-0','border-b-2 border-r-2']].map(([pos, bdr], i) => (
            <div key={i} className={`absolute w-4 h-4 ${pos} ${bdr} border-green-400`} />
          ))}
          {/* Silhouette */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-500" />
            </div>
          </div>
          {/* Confidence badge on box */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-400 text-gray-900 text-[10px] font-bold rounded whitespace-nowrap">
            {match.matches[0].confidence}% match
          </div>
        </div>

        {/* Timestamp + filename overlay */}
        <div className="absolute bottom-2 left-3 text-green-400 text-[11px] font-mono">
          {match.matches[0].timestamp}
        </div>
        <div className="absolute bottom-2 right-3 text-gray-400 text-[11px] font-mono">
          surveillance_footage.mp4
        </div>
      </div>

      {/* Video timeline */}
      <div className="px-4 py-3 bg-gray-950 border-t border-gray-800">
        <div className="relative h-1.5 bg-gray-700 rounded-full w-full">
          <div className="absolute inset-y-0 left-0 bg-gray-500 rounded-full" style={{ width: '35%' }} />
          {match.matches.map((m) => (
            <div
              key={m.timestamp}
              className="absolute -top-1 w-3 h-3 rounded-full border-2 border-gray-900 flex-shrink-0"
              style={{
                left: `${(m.seconds / totalSeconds) * 100}%`,
                backgroundColor: m.confidence >= 88 ? '#4ade80' : m.confidence >= 78 ? '#facc15' : '#f87171',
                transform: 'translateX(-50%)',
              }}
              title={`${m.timestamp} — ${m.confidence}%`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-gray-500 font-mono">00:00:00</span>
          <span className="text-[10px] text-gray-400 font-semibold">{match.matches.length} matches found</span>
          <span className="text-[10px] text-gray-500 font-mono">{match.totalDuration}</span>
        </div>
      </div>

      {/* Match list */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Detection Results</p>
          <div className="space-y-2">
            {match.matches.map((m, i) => (
              <div key={m.timestamp} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                }`}>{i + 1}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 font-mono">{m.timestamp}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${m.confidence}%`,
                        backgroundColor: m.confidence >= 88 ? '#22c55e' : m.confidence >= 78 ? '#eab308' : '#ef4444',
                      }} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{m.confidence}%</span>
                  </div>
                </div>
                {i === 0 && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Best</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Appearance Notes</p>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{match.appearanceNotes}</p>
        </div>
      </div>
    </div>
  );
}

// ─── File type icon helper ────────────────────────────────────────────────────

function FileTypeIcon({ type, className = 'w-5 h-5' }: { type: AttachedFileType; className?: string }) {
  if (type === 'image')    return <Image    className={`${className} text-blue-500`}   />;
  if (type === 'video')    return <Video    className={`${className} text-violet-500`} />;
  if (type === 'pdf')      return <FileText className={`${className} text-red-500`}    />;
  if (type === 'document') return <FileText className={`${className} text-blue-600`}   />;
  return                          <Paperclip className={`${className} text-gray-500`}  />;
}

const FILE_TYPE_BG: Record<AttachedFileType, string> = {
  image:    'bg-blue-100',
  video:    'bg-violet-100',
  pdf:      'bg-red-100',
  document: 'bg-blue-100',
  file:     'bg-gray-100',
};

function ActionChipBar({
  chips,
  onExecute,
}: {
  chips: ActionChip[];
  onExecute: (chip: ActionChip) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {chips.map((chip) => {
        const Icon = CHIP_ICONS[chip.type];
        return (
          <button
            key={chip.id}
            onClick={() => onExecute(chip)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-colors shadow-sm"
          >
            <Icon className="w-3 h-3" />
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Source Tag ───────────────────────────────────────────────────────────────

function SourceTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900 transition-colors ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── Source Dropdown ──────────────────────────────────────────────────────────

function SourceDropdown({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 transition-colors shadow-sm"
      >
        <FileText className="w-3.5 h-3.5 text-gray-400" />
        {selectedIds.length === 0
          ? 'Select sources'
          : `${selectedIds.length} source${selectedIds.length > 1 ? 's' : ''}`}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 w-64 bg-white dark:bg-[#131f35] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg py-1 overflow-hidden">
          {MOCK_SOURCES.map((src) => {
            const checked = selectedIds.includes(src.id);
            return (
              <button
                key={src.id}
                onClick={() => onToggle(src.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 text-left transition-colors"
              >
                <span
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-white/20'
                  }`}
                >
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{src.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Case Dropdown ────────────────────────────────────────────────────────────

function CaseDropdown({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = MOCK_CASES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.id.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = MOCK_CASES.find((c) => c.id === selectedId);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 transition-colors shadow-sm font-medium"
      >
        <FileText className="w-3.5 h-3.5 text-gray-400" />
        {selected ? selected.id : 'Select case'}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 w-72 bg-white dark:bg-[#131f35] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-white/8">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-white/5 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                className="flex-1 bg-transparent text-sm dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Search cases…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="py-1 max-h-56 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => { onSelect(c.id); setOpen(false); setQuery(''); }}
                className={`w-full flex flex-col px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 text-left transition-colors ${
                  c.id === selectedId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <span className={`text-xs font-semibold ${c.id === selectedId ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>{c.id}</span>
                <span className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skill Card ───────────────────────────────────────────────────────────────

function SkillCard({
  skill,
  onUse,
}: {
  skill: Skill;
  onUse: (skill: Skill) => void;
}) {
  return (
    <div className="bg-white dark:bg-[#131f35] border border-gray-200 dark:border-white/10 rounded-xl p-4 hover:border-blue-200 dark:hover:border-blue-700/50 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{skill.name}</span>
        </div>
        <span className="flex-shrink-0">
          {skill.visibility === 'private'
            ? <Lock className="w-3.5 h-3.5 text-gray-400" />
            : <Globe className="w-3.5 h-3.5 text-blue-400" />}
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2">{skill.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/15 flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-300">
            {skill.authorInitials}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">By {skill.author}</span>
        </div>
        <button
          onClick={() => onUse(skill)}
          className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Use Now
        </button>
      </div>
    </div>
  );
}

// ─── Create Skill Form ────────────────────────────────────────────────────────

function CreateSkillForm({ onSave, onCancel }: { onSave: (skill: Skill) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'agency'>('private');

  const handleSave = () => {
    if (!name.trim() || !instructions.trim()) return;
    onSave({
      id: `ms-${Date.now()}`,
      name: name.trim(),
      description: instructions.trim().slice(0, 100),
      author: 'You',
      authorInitials: 'TZ',
      visibility,
    });
  };

  return (
    <div className="border border-blue-200 dark:border-blue-700/40 rounded-xl bg-blue-50/40 dark:bg-blue-900/10 p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800 dark:text-white">New Skill</p>

      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Skill Name</label>
        <input
          className="w-full px-3 py-2 bg-white dark:bg-[#0f1929] border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all placeholder-gray-400 dark:placeholder-gray-600"
          placeholder="e.g. Extract Financial Crypto Slang"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Instructions / System Prompt</label>
        <textarea
          className="w-full px-3 py-2 bg-white dark:bg-[#0f1929] border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all placeholder-gray-400 dark:placeholder-gray-600 resize-none"
          rows={4}
          placeholder="You are an investigative AI assistant. When analyzing evidence, focus on cryptocurrency terminology, wallet addresses, and transaction references…"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Visibility</label>
        <div className="flex gap-2">
          <button
            onClick={() => setVisibility('private')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
              visibility === 'private'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Keep Private
          </button>
          <button
            onClick={() => setVisibility('agency')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
              visibility === 'agency'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Share with Agency
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={!name.trim() || !instructions.trim()}
          className="flex-1 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save Skill
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Chat History Sidebar ────────────────────────────────────────────────────

function timeLabel(date: Date): string {
  const diffH = (Date.now() - date.getTime()) / 3_600_000;
  if (diffH < 24)  return 'Today';
  if (diffH < 48)  return 'Yesterday';
  if (diffH < 168) return 'Previous 7 days';
  return 'Older';
}

// ─── Create Project Dialog ────────────────────────────────────────────────────

function CreateProjectDialog({ onSave, onCancel }: {
  onSave: (project: Project) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [color, setColor] = useState<ProjectColor>('blue');

  const handleCreate = () => {
    if (!name.trim()) return;
    onSave({
      id: `p-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      color,
      conversations: [],
      createdAt: new Date(),
    });
  };

  const c = PROJECT_COLOR_MAP[color];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-[520px] bg-white dark:bg-[#131f35] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/8">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center`}>
              <FolderOpen className={`w-4 h-4 ${c.text}`} />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white">Create new project</span>
          </div>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Project name */}
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Project name</label>
            <input
              autoFocus
              className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white dark:bg-[#0f1929] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all placeholder-gray-400 dark:placeholder-gray-600"
              placeholder="e.g. Financial Trail Analysis"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Description <span className="font-normal text-gray-400 normal-case">(optional)</span></label>
            <input
              className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white dark:bg-[#0f1929] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all placeholder-gray-400 dark:placeholder-gray-600"
              placeholder="What is this investigation angle about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Custom AI instructions */}
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide block mb-1">
              AI instructions <span className="font-normal text-gray-400 normal-case">(optional)</span>
            </label>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">Tell Cellebrite AI how to behave in this project — focus areas, output style, terminology to use.</p>
            <textarea
              rows={4}
              className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white dark:bg-[#0f1929] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all placeholder-gray-400 dark:placeholder-gray-600 resize-none"
              placeholder="e.g. Focus on financial evidence only. Flag amounts over $10,000. Use formal language suitable for court documentation."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide block mb-2">Color</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((pc) => (
                <button key={pc} onClick={() => setColor(pc)}
                  className={`w-7 h-7 rounded-full ${PROJECT_COLOR_MAP[pc].dot} transition-transform hover:scale-110 ${color === pc ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-white/30 scale-110' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/8">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Create project
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chat History Sidebar ────────────────────────────────────────────────────

function ChatHistorySidebar({
  conversations, activeId, onSelect, onNewChat, onDelete,
  projects, activeProjectId, onSelectProject, onNewProjectChat, onCreateProject,
  collapsed, onToggleCollapsed,
}: {
  conversations: ConversationItem[];
  activeId: string | null;
  onSelect: (conv: ConversationItem) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (project: Project, conv?: ConversationItem) => void;
  onNewProjectChat: (project: Project) => void;
  onCreateProject: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<string[]>(['p1', 'p2']);

  const groups: Record<string, ConversationItem[]> = {};
  conversations.forEach((c) => {
    const label = timeLabel(c.timestamp);
    if (!groups[label]) groups[label] = [];
    groups[label].push(c);
  });
  const ORDER = ['Today', 'Yesterday', 'Previous 7 days', 'Older'];
  const sortedGroups = ORDER.filter((k) => groups[k]);

  if (collapsed) {
    return (
      <div className="flex-shrink-0 flex flex-col items-center py-4 gap-3 bg-white dark:bg-[#131f35] border-r border-gray-200 dark:border-white/10" style={{ width: 44 }}>
        <button
          onClick={onToggleCollapsed}
          title="Show chat history"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <button
          onClick={onNewChat}
          title="New chat"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#131f35] border-r border-gray-200 dark:border-white/10 overflow-hidden transition-[width] duration-200" style={{ width: 240 }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 pt-4 pb-3">
        <button
          onClick={onNewChat}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 dark:bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 dark:hover:bg-white/15 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
        <button
          onClick={onToggleCollapsed}
          title="Collapse"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-white transition-colors flex-shrink-0"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">

        {/* ── Projects ── */}
        <div className="mt-2 mb-4">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Projects</p>
            <button
              onClick={onCreateProject}
              title="New project"
              className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {projects.map((proj) => {
              const c = PROJECT_COLOR_MAP[proj.color as ProjectColor] ?? PROJECT_COLOR_MAP.blue;
              const isExpanded = expandedProjects.includes(proj.id);
              const isActiveProject = proj.id === activeProjectId;
              return (
                <div key={proj.id}>
                  {/* Project row */}
                  <div className={`flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer group transition-colors ${isActiveProject && !activeId ? 'bg-gray-100 dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                    <button onClick={() => setExpandedProjects((prev) => prev.includes(proj.id) ? prev.filter((i) => i !== proj.id) : [...prev, proj.id])}
                      className="flex-shrink-0">
                      <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    <button onClick={() => onSelectProject(proj)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{proj.name}</span>
                    </button>
                  </div>

                  {/* Conversations within project */}
                  {isExpanded && (
                    <div className="ml-5 space-y-0.5 mb-1">
                      {proj.conversations.map((conv) => {
                        const isActive = conv.id === activeId;
                        return (
                          <div key={conv.id} className="relative group"
                            onMouseEnter={() => setHoveredId(conv.id)}
                            onMouseLeave={() => setHoveredId(null)}>
                            <button onClick={() => onSelectProject(proj, conv)}
                              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${isActive ? `${c.bg} border ${c.border}` : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                              <span className={`text-[11px] font-medium truncate ${isActive ? c.text : 'text-gray-700 dark:text-gray-300'}`}>{conv.title}</span>
                            </button>
                            {hoveredId === conv.id && !isActive && (
                              <button onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:bg-red-100 hover:text-red-600">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {projects.length === 0 && (
              <button onClick={onCreateProject}
                className="w-full flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Create your first project
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-2 border-t border-gray-100 dark:border-white/8 mb-4" />

        {/* ── Chat History ── */}
        <div className="space-y-4">
          {sortedGroups.map((group) => (
            <div key={group}>
              <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group}</p>
              <div className="space-y-0.5">
                {groups[group].map((conv) => {
                  const isActive = conv.id === activeId;
                  return (
                    <div key={conv.id} className="relative group"
                      onMouseEnter={() => setHoveredId(conv.id)}
                      onMouseLeave={() => setHoveredId(null)}>
                      <button onClick={() => onSelect(conv)}
                        className={`w-full flex flex-col gap-0.5 px-3 py-2.5 rounded-xl text-left transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700/40' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                        <span className={`text-xs font-semibold truncate leading-tight ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>{conv.title}</span>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight">{conv.preview}</span>
                      </button>
                      {hoveredId === conv.id && !isActive && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 text-gray-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Clock className="w-7 h-7 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No recent chats</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Source Picker Panel ──────────────────────────────────────────────────────

function FileTypeBadge({ type }: { type: string }) {
  const style = FILE_TYPE_STYLE[type] ?? { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide border ${style.bg} ${style.text} ${style.border}`}>
      {type}
    </span>
  );
}

function SourcePickerPanel({
  open,
  onClose,
  selectedIds,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-[380px] z-50 bg-white dark:bg-[#131f35] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/8">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-800 dark:text-white">Evidence Sources</span>
          {selectedIds.length > 0 && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {selectedIds.length} selected
            </span>
          )}
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* File list */}
      <div className="py-1.5">
        {MOCK_SOURCES.map((src) => {
          const selected = selectedIds.includes(src.id);
          const Icon = src.icon;
          return (
            <button
              key={src.id}
              onClick={() => onToggle(src.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left ${selected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
            >
              {/* Checkbox */}
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-white/20'
              }`}>
                {selected && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* File icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-blue-100' : 'bg-gray-100 dark:bg-white/10'}`}>
                <Icon className={`w-4 h-4 ${selected ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`} />
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-semibold truncate ${selected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {src.filename}
                  </span>
                  <FileTypeBadge type={src.fileType} />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{src.meta}{src.device ? ` · ${src.device}` : ''}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/8 flex items-center justify-between">
        <button
          onClick={() => MOCK_SOURCES.forEach((s) => { if (!selectedIds.includes(s.id)) onToggle(s.id); })}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Select all
        </button>
        {selectedIds.length > 0 && (
          <button
            onClick={() => MOCK_SOURCES.forEach((s) => { if (selectedIds.includes(s.id)) onToggle(s.id); })}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Reusable floating panel shell ───────────────────────────────────────────

function ContextPanel({
  open, onClose, title, icon, children,
}: {
  open: boolean; onClose: () => void; title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 z-50 bg-white dark:bg-[#131f35] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/8">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-gray-800 dark:text-white">{title}</span>
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}

// ─── Subject picker ───────────────────────────────────────────────────────────

function SubjectPickerPanel({ open, onClose, selectedIds, onToggle }: {
  open: boolean; onClose: () => void; selectedIds: string[]; onToggle: (id: string) => void;
}) {
  return (
    <ContextPanel open={open} onClose={onClose} title="Subjects" icon={<Users className="w-4 h-4 text-violet-500" />}>
      <div className="w-72 py-1.5">
        {MOCK_SUBJECTS.map((sub) => {
          const selected = selectedIds.includes(sub.id);
          return (
            <button key={sub.id} onClick={() => onToggle(sub.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${selected ? 'bg-violet-50/40 dark:bg-violet-900/10' : ''}`}>
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-violet-600 border-violet-600' : 'border-gray-300 dark:border-white/20'}`}>
                {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${sub.color}`}>
                {sub.initials}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{sub.name}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{sub.role}</p>
              </div>
            </button>
          );
        })}
      </div>
    </ContextPanel>
  );
}

// ─── Timeframe picker ─────────────────────────────────────────────────────────

function TimeframePickerPanel({ open, onClose, selectedId, onSelect }: {
  open: boolean; onClose: () => void; selectedId: string | null; onSelect: (id: string | null) => void;
}) {
  return (
    <ContextPanel open={open} onClose={onClose} title="Timeframe" icon={<Clock className="w-4 h-4 text-emerald-500" />}>
      <div className="w-64 py-1.5">
        {selectedId && (
          <button onClick={() => { onSelect(null); onClose(); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/8 mb-1">
            <X className="w-3 h-3" /> Clear timeframe
          </button>
        )}
        {TIMEFRAME_PRESETS.map((tf) => {
          const active = selectedId === tf.id;
          return (
            <button key={tf.id} onClick={() => { onSelect(tf.id); onClose(); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left ${active ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
              <span className={`text-sm font-medium ${active ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>{tf.label}</span>
              {active && <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
          );
        })}
      </div>
    </ContextPanel>
  );
}

// ─── Output mode picker ───────────────────────────────────────────────────────

function OutputModePickerPanel({ open, onClose, selectedId, onSelect }: {
  open: boolean; onClose: () => void; selectedId: string | null; onSelect: (id: string | null) => void;
}) {
  return (
    <ContextPanel open={open} onClose={onClose} title="Output Mode" icon={<FileText className="w-4 h-4 text-amber-500" />}>
      <div className="w-72 py-1.5">
        {OUTPUT_MODES.map((mode) => {
          const active = selectedId === mode.id;
          return (
            <button key={mode.id} onClick={() => { onSelect(active ? null : mode.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left ${active ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}>
              <span className="text-xl flex-shrink-0 leading-none">{mode.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${active ? 'text-amber-700 dark:text-amber-400' : 'text-gray-800 dark:text-gray-200'}`}>{mode.label}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">{mode.description}</p>
              </div>
              {active && <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 16 16"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
          );
        })}
      </div>
    </ContextPanel>
  );
}

// ─── Add context menu ─────────────────────────────────────────────────────────

function AddContextMenu({ open, onClose, onPick }: {
  open: boolean; onClose: () => void; onPick: (type: 'subjects' | 'timeframe' | 'mode') => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onClose]);
  if (!open) return null;
  const items = [
    { type: 'subjects'  as const, icon: <Users className="w-4 h-4 text-violet-500" />,  label: 'Subjects',     desc: 'Scope to specific persons of interest' },
    { type: 'timeframe' as const, icon: <Clock className="w-4 h-4 text-emerald-500" />, label: 'Timeframe',    desc: 'Filter evidence by date range'         },
    { type: 'mode'      as const, icon: <FileText className="w-4 h-4 text-amber-500" />,label: 'Output Mode',  desc: 'Brief, report-ready, or timeline'      },
  ];
  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 w-72 z-50 bg-white dark:bg-[#131f35] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
      <p className="px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/8">Add context</p>
      {items.map((item) => (
        <button key={item.type} onClick={() => { onPick(item.type); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">{item.icon}</div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">{item.label}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{item.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Skills Library Drawer ────────────────────────────────────────────────────

function SkillsLibraryDrawer({
  open,
  onClose,
  onUseSkill,
}: {
  open: boolean;
  onClose: () => void;
  onUseSkill: (skill: Skill) => void;
}) {
  const [activeTab, setActiveTab] = useState<'my' | 'agency'>('agency');
  const [mySkills, setMySkills] = useState<Skill[]>(MY_SKILLS);
  const [agencySkills] = useState<Skill[]>(AGENCY_SKILLS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSaveSkill = (skill: Skill) => {
    setMySkills((prev) => [skill, ...prev]);
    setShowCreateForm(false);
  };

  const filteredMy = mySkills.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredAgency = agencySkills.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.author.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-[400px] bg-gray-50 dark:bg-[#0f1929] border-l border-gray-200 dark:border-white/10 flex flex-col shadow-2xl transition-transform duration-250 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white dark:bg-[#131f35] border-b border-gray-200 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-base font-semibold text-gray-900 dark:text-white">Skills Library</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 bg-white dark:bg-[#131f35] border-b border-gray-100 dark:border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-white/10 rounded-lg">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Search skills…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#131f35] flex-shrink-0">
          {(['my', 'agency'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              {tab === 'my' ? 'My Skills' : 'Agency Skills'}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'my' && (
            <>
              {/* Create button */}
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700/50 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create New Skill
                </button>
              )}

              {showCreateForm && (
                <CreateSkillForm
                  onSave={handleSaveSkill}
                  onCancel={() => setShowCreateForm(false)}
                />
              )}

              {filteredMy.length === 0 && !showCreateForm && (
                <div className="text-center py-10 text-gray-400">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No private skills yet.</p>
                  <p className="text-xs mt-1">Create one to get started.</p>
                </div>
              )}

              {filteredMy.map((skill) => (
                <SkillCard key={skill.id} skill={skill} onUse={(s) => { onUseSkill(s); onClose(); }} />
              ))}
            </>
          )}

          {activeTab === 'agency' && (
            <>
              {filteredAgency.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No agency skills found.</p>
                </div>
              )}
              {filteredAgency.map((skill) => (
                <SkillCard key={skill.id} skill={skill} onUse={(s) => { onUseSkill(s); onClose(); }} />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: string; text: string }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((text: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, show };
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg shadow-xl">
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface AIWorkspacePageProps {
  caseId?: string;
  caseName?: string;
  mode?: 'panel' | 'fullscreen';
  contextTab?: string;
  initialPrompt?: string;
  onExpand?: () => void;
  onCollapse?: () => void;
  onClose?: () => void;
}

export function AIWorkspacePage({ caseId: propCaseId, caseName: propCaseName, mode = 'fullscreen', contextTab, initialPrompt, onExpand, onCollapse, onClose }: AIWorkspacePageProps = {}) {
  const inCaseContext = !!propCaseId;
  const isPanel = mode === 'panel';
  const suggestedPrompts = CONTEXT_PROMPTS[contextTab ?? 'default'] ?? CONTEXT_PROMPTS.default;
  const [conversations, setConversations] = useState<ConversationItem[]>(MOCK_HISTORY);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [historySidebarCollapsed, setHistorySidebarCollapsed] = useState(isPanel);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(propCaseId ?? null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false);
  const [subjectPanelOpen, setSubjectPanelOpen] = useState(false);
  const [timeframePanelOpen, setTimeframePanelOpen] = useState(false);
  const [modePanelOpen, setModePanelOpen] = useState(false);
  const [addContextMenuOpen, setAddContextMenuOpen] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedTimeframeId, setSelectedTimeframeId] = useState<string | null>(null);
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<AttachedFile[]>([]);
  const [panelHistoryOpen, setPanelHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSubject = useCallback((id: string) => {
    setSelectedSubjectIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }, []);

  const selectedSubjects = MOCK_SUBJECTS.filter((s) => selectedSubjectIds.includes(s.id));
  const selectedTimeframe = TIMEFRAME_PRESETS.find((t) => t.id === selectedTimeframeId) ?? null;
  const selectedMode = OUTPUT_MODES.find((m) => m.id === selectedModeId) ?? null;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toasts, show: showToast } = useToast();

  const hasConversation = messages.length > 0;
  const selectedCase = inCaseContext
    ? { id: propCaseId!, name: propCaseName ?? propCaseId! }
    : MOCK_CASES.find((c) => c.id === selectedCaseId);
  const selectedSources = MOCK_SOURCES.filter((s) => selectedSourceIds.includes(s.id));

  useEffect(() => {
    if (panelScrollRef.current) {
      panelScrollRef.current.scrollTop = panelScrollRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const toggleSource = useCallback((id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newAttached: AttachedFile[] = files.map((file) => {
      const isImage    = file.type.startsWith('image/');
      const isVideo    = file.type.startsWith('video/');
      const isPdf      = file.type === 'application/pdf';
      const isDocument = file.type.includes('word') || file.type.includes('spreadsheet')
                      || file.type.includes('presentation') || file.name.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt|csv)$/i) !== null;
      const fileType: AttachedFileType = isImage ? 'image' : isVideo ? 'video' : isPdf ? 'pdf' : isDocument ? 'document' : 'file';
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
      const sizeStr = file.size > 1_000_000
        ? `${(file.size / 1_000_000).toFixed(1)} MB`
        : `${(file.size / 1_000).toFixed(0)} KB`;
      return { name: file.name, type: fileType, size: sizeStr, previewUrl };
    });

    setPendingFiles((prev) => [...prev, ...newAttached]);
    e.target.value = '';
  }, []);

  const sendMessage = useCallback((text?: string) => {
    const content = (text ?? inputValue).trim();
    const isGeoSkill  = activeSkill?.id === 'as6';
    const isFaceSkill = activeSkill?.id === 'as7';

    if (!content && pendingFiles.length === 0) return;

    const files = [...pendingFiles];
    setPendingFiles([]);

    const displayContent = content || (isGeoSkill ? 'Identify the location in this image.' : isFaceSkill ? 'Find the suspect in this footage.' : 'Analyze the attached file(s).');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: displayContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedFiles: files.length > 0 ? files : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const isWarrantSkill = activeSkill?.id === 'as5';

      let aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (isGeoSkill) {
        aiMsg = { ...aiMsg,
          locationMatch: MOCK_LOCATION_MATCH,
          actionChips: [
            { id: 'g1', label: 'Add to Case Locations', type: 'crimeline' },
            { id: 'g2', label: 'Create Case Lead',      type: 'note'      },
            { id: 'g3', label: 'Create Task',           type: 'task'      },
          ],
        };
      } else if (isFaceSkill) {
        aiMsg = { ...aiMsg,
          faceMatch: MOCK_FACE_MATCH,
          actionChips: [
            { id: 'f1', label: 'Add as Subject',            type: 'subject'  },
            { id: 'f2', label: 'Export Best Frame',         type: 'note'     },
            { id: 'f3', label: 'Create Task: Review Frame', type: 'task'     },
          ],
        };
      } else if (isWarrantSkill) {
        aiMsg = { ...aiMsg,
          structuredResponse: WARRANT_RESPONSE,
          actionChips: [
            { id: 'w1', label: 'Save as Case Note',       type: 'note' },
            { id: 'w2', label: 'Create Task: Legal Review', type: 'task' },
          ],
        };
      } else if (QUICK_ACTION_RESPONSES[displayContent]) {
        aiMsg = { ...aiMsg, content: QUICK_ACTION_RESPONSES[displayContent] };
      } else {
        aiMsg = { ...aiMsg,
          structuredResponse: MOCK_RESPONSE,
          actionChips: [
            { id: 'c1', label: 'Add Event to Crimeline', type: 'crimeline' },
            { id: 'c2', label: 'Create Task',            type: 'task'      },
            { id: 'c3', label: 'Add as Subject',         type: 'subject'   },
            { id: 'c4', label: 'Save as Note',           type: 'note'      },
          ],
        };
      }

      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1400);
  }, [inputValue, activeSkill, pendingFiles]);

  const initialPromptFiredRef = useRef(false);
  useEffect(() => {
    if (!isPanel && initialPrompt && !initialPromptFiredRef.current) {
      initialPromptFiredRef.current = true;
      sendMessage(initialPrompt);
    }
    // only fire on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleChipExecute = (chip: ActionChip) => {
    const labels: Record<ActionChip['type'], string> = {
      task: 'Opening Create Task dialog…',
      crimeline: 'Opening Add Event to Crimeline dialog…',
      subject: 'Opening Add Subject dialog…',
      note: 'Saved as Case Note.',
    };
    showToast(labels[chip.type]);
  };

  const handleSelectConversation = useCallback((conv: ConversationItem) => {
    setActiveConversationId(conv.id);
    setMessages(conv.messages);
  }, []);

  const handleNewChat = useCallback(() => {
    // Save current conversation if it has messages
    if (messages.length > 0 && activeConversationId === null) {
      const title = messages[0]?.content?.slice(0, 48) ?? 'New conversation';
      const newConv: ConversationItem = {
        id: `c-${Date.now()}`,
        title,
        preview: messages[0]?.content ?? '',
        timestamp: new Date(),
        messages,
      };
      setConversations((prev) => [newConv, ...prev]);
    }
    setMessages([]);
    setActiveConversationId(null);
    setInputValue('');
  }, [messages, activeConversationId]);

  const handleDeleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setMessages([]);
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  const handleSelectProject = useCallback((proj: Project, conv?: ConversationItem) => {
    setActiveProjectId(proj.id);
    setActiveConversationId(conv?.id ?? null);
    setMessages(conv?.messages ?? []);
  }, []);

  const handleNewProjectChat = useCallback((proj: Project) => {
    setActiveProjectId(proj.id);
    setActiveConversationId(null);
    setMessages([]);
    setHistorySidebarCollapsed(true);
  }, []);

  const handleCreateProject = useCallback((proj: Project) => {
    setProjects((prev) => [proj, ...prev]);
    setCreateProjectOpen(false);
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const handleUseSkill = (skill: Skill) => {
    setActiveSkill(skill);
    const slug = '/' + skill.name.toLowerCase().replace(/\s+/g, '-');
    setInputValue(slug + ' ');
    setTimeout(() => {
      inputRef.current?.focus();
      const len = (slug + ' ').length;
      inputRef.current?.setSelectionRange(len, len);
    }, 0);
  };

  // ─── Panel mode ────────────────────────────────────────────────────────────
  if (isPanel) {
    return (
      <div className="relative w-96 flex-shrink-0 border-l border-purple-200 dark:border-purple-700/30 bg-gradient-to-b from-purple-50/70 via-blue-50/40 to-white dark:from-[#1a1033] dark:via-[#160d2e] dark:to-[#131f35] flex flex-col overflow-hidden">
        <div className="absolute top-0 right-0 w-52 h-52 bg-gradient-to-bl from-purple-200/40 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-24 left-0 w-40 h-40 bg-gradient-to-tr from-cyan-200/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-purple-700/30 bg-white dark:bg-white/5 dark:backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#12233A] dark:text-white">Cellebrite AI</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setPanelHistoryOpen((v) => !v)} title="Chat history"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#12233A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <Clock className="w-3.5 h-3.5" />
            </button>
            <button onClick={onExpand} title="Open full screen"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#12233A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} title="Close"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#12233A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={activeSkill?.id === 'as6' ? 'image/*' : activeSkill?.id === 'as7' ? 'video/*' : '*'}
          onChange={handleFileChange}
        />

        {/* History overlay */}
        {panelHistoryOpen && (
          <div className="absolute inset-0 z-20 bg-white dark:bg-[#131f35] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-white/8 flex-shrink-0">
              <span className="text-sm font-semibold text-gray-800 dark:text-white">Chat History</span>
              <button onClick={() => setPanelHistoryOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-3 py-2 border-b border-gray-100 dark:border-white/8 flex-shrink-0">
              <button onClick={() => { handleNewChat(); setPanelHistoryOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2 bg-gray-900 dark:bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 dark:hover:bg-white/15 transition-colors">
                <Plus className="w-4 h-4" /> New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {/* Projects */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Projects</p>
                  <button onClick={() => { setCreateProjectOpen(true); setPanelHistoryOpen(false); }}
                    className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>
                <div className="space-y-0.5">
                  {projects.map((proj) => {
                    const c = PROJECT_COLOR_MAP[proj.color as ProjectColor] ?? PROJECT_COLOR_MAP.blue;
                    return (
                      <button key={proj.id} onClick={() => { handleSelectProject(proj); setPanelHistoryOpen(false); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-left transition-colors">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{proj.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-white/8" />
              {/* Conversation history groups */}
              {Object.entries(
                conversations.reduce<Record<string, ConversationItem[]>>((acc, c) => {
                  const label = timeLabel(c.timestamp);
                  if (!acc[label]) acc[label] = [];
                  acc[label].push(c);
                  return acc;
                }, {})
              )
                .sort(([a], [b]) => ['Today', 'Yesterday', 'Previous 7 days', 'Older'].indexOf(a) - ['Today', 'Yesterday', 'Previous 7 days', 'Older'].indexOf(b))
                .map(([group, convs]) => (
                  <div key={group}>
                    <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group}</p>
                    <div className="space-y-0.5">
                      {convs.map((conv) => (
                        <button key={conv.id} onClick={() => { handleSelectConversation(conv); setPanelHistoryOpen(false); }}
                          className={`w-full flex flex-col gap-0.5 px-3 py-2.5 rounded-xl text-left transition-colors ${conv.id === activeConversationId ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700/40' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                          <span className={`text-xs font-semibold truncate ${conv.id === activeConversationId ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>{conv.title}</span>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{conv.preview}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              {conversations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="w-7 h-7 text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400">No recent chats</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat area */}
        <div ref={panelScrollRef} className="flex-1 overflow-y-auto">
          <div className={`px-4 py-4 ${hasConversation ? 'min-h-full flex flex-col justify-end gap-3' : 'min-h-full flex flex-col'}`}>

            {/* Empty state */}
            {!hasConversation && (
              <div className="flex flex-col flex-1 justify-center gap-6 py-4">
                {/* Brand identity */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-purple-500/25 blur-xl scale-150" />
                    <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight">Cellebrite AI</p>
                    {inCaseContext && propCaseName && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[200px]">{propCaseName}</p>
                    )}
                  </div>
                </div>

                {/* Suggestion cards */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2.5 px-0.5">Try asking</p>
                  <div className="space-y-2">
                    {suggestedPrompts.map((p) => (
                      <button
                        key={p.text}
                        onClick={() => sendMessage(p.text)}
                        className="w-full text-left group relative overflow-hidden rounded-xl border border-purple-100 dark:border-purple-800/50 bg-white dark:bg-white/[0.03] hover:bg-purple-50/50 dark:hover:bg-purple-900/10 hover:border-purple-300/60 dark:hover:border-purple-600/40 transition-all duration-150 shadow-sm hover:shadow-md"
                      >
                        <div className="px-3.5 py-2.5 flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 mb-1.5">
                              {p.category}
                            </span>
                            <p className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white leading-snug">
                              {p.text}
                            </p>
                          </div>
                          <div className="w-6 h-6 rounded-lg bg-purple-100/80 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-purple-500 transition-colors flex-shrink-0">
                            <Send className="w-3 h-3 text-purple-400 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white' : 'bg-white dark:bg-white/5 border border-purple-100 dark:border-purple-700/30 text-gray-700 dark:text-gray-300'} rounded-2xl px-3.5 py-2.5 text-sm shadow-sm`}>
                  {msg.role === 'assistant' && msg.structuredResponse ? (
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">{msg.structuredResponse.findingsSummary}</p>
                      {msg.structuredResponse.evidenceDetails.slice(0, 2).map((d, i) => (
                        <div key={i} className="mt-1.5 p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-xs">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{d.label}: </span>
                          <span className="text-gray-600 dark:text-gray-400">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="leading-relaxed">{msg.content}</span>
                  )}
                  {msg.actionChips && msg.role === 'assistant' && (
                    <ActionChipBar chips={msg.actionChips} onExecute={handleChipExecute} />
                  )}
                </div>
              </div>
            ))}

            {/* Loading */}
            {isLoading && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white dark:bg-white/5 border border-purple-100 dark:border-purple-700/30 rounded-2xl px-3.5 py-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input footer */}
        <div className="relative z-10 flex-shrink-0 px-3 pb-3 pt-2 border-t border-purple-100 dark:border-purple-700/30 bg-white/90 dark:bg-[#160d2e]/95 backdrop-blur-sm">
          {/* Active skill pill */}
          {activeSkill && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-2 bg-violet-50 border border-violet-200 rounded-lg text-xs text-violet-700 font-semibold">
              <Zap className="w-3 h-3 flex-shrink-0" />
              <span className="truncate flex-1">{activeSkill.name}</span>
              <button onClick={() => setActiveSkill(null)} className="opacity-60 hover:opacity-100 flex-shrink-0"><X className="w-3 h-3" /></button>
            </div>
          )}

          {/* Pending files */}
          {pendingFiles.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {pendingFiles.map((f, i) => (
                f.type === 'image' && f.previewUrl ? (
                  <div key={i} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 flex-shrink-0">
                    <img src={f.previewUrl} className="w-full h-full object-cover" alt={f.name} />
                    <button onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div key={i} className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg max-w-[140px]">
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${FILE_TYPE_BG[f.type]}`}>
                      <FileTypeIcon type={f.type} className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] text-gray-700 dark:text-gray-300 truncate">{f.name}</span>
                    <button onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Selected context pills */}
          {(selectedSources.length > 0 || selectedSubjects.length > 0 || selectedTimeframe || selectedMode) && (
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedSources.map((src) => {
                const Icon = src.icon;
                const s = FILE_TYPE_STYLE[src.fileType] ?? { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
                return (
                  <span key={src.id} className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full border text-[10px] font-medium ${s.bg} ${s.text} ${s.border}`}>
                    <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="max-w-[70px] truncate">{src.filename.split('.')[0]}</span>
                    <button onClick={() => toggleSource(src.id)} className="opacity-50 hover:opacity-100 ml-0.5"><X className="w-2.5 h-2.5" /></button>
                  </span>
                );
              })}
              {selectedSubjects.map((sub) => (
                <span key={sub.id} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-[10px] font-medium text-violet-700">
                  <span>{sub.initials}</span>
                  <button onClick={() => toggleSubject(sub.id)} className="opacity-50 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              {selectedTimeframe && (
                <span className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[10px] font-medium text-emerald-700">
                  <Clock className="w-2.5 h-2.5" />{selectedTimeframe.short}
                  <button onClick={() => setSelectedTimeframeId(null)} className="opacity-50 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {selectedMode && (
                <span className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-[10px] font-medium text-amber-700">
                  <span className="text-sm leading-none">{selectedMode.icon}</span>{selectedMode.label}
                  <button onClick={() => setSelectedModeId(null)} className="opacity-50 hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
            </div>
          )}

          {/* Textarea */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-blue-100/50 dark:from-purple-800/20 dark:to-blue-800/20 rounded-xl blur-sm" />
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
              onKeyDown={handleKeyDown}
              placeholder={
                activeSkill?.id === 'as6' ? 'Or describe the scene to help locate…'
                : activeSkill?.id === 'as7' ? 'Describe the suspect to narrow the search…'
                : activeSkill ? `Using "${activeSkill.name}" — type your question…`
                : inCaseContext ? `Ask anything about ${propCaseName ?? 'this case'}…`
                : 'What are you trying to find out?'
              }
              rows={2}
              disabled={isLoading}
              className="relative w-full pl-3.5 pr-12 py-3 bg-white/95 dark:bg-white/5 border border-purple-200 dark:border-purple-700/40 rounded-xl text-sm text-gray-900 dark:text-white placeholder-purple-300 dark:placeholder-purple-400/40 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 shadow-sm disabled:opacity-60"
            />
            <button
              onClick={() => sendMessage()}
              disabled={(!inputValue.trim() && pendingFiles.length === 0) || isLoading}
              className={`absolute right-2.5 bottom-2.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${(inputValue.trim() || pendingFiles.length > 0) && !isLoading ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95' : 'bg-gray-100 dark:bg-white/10 text-gray-300 dark:text-gray-500 cursor-not-allowed'}`}
              title="Send (Enter)"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Context toolbar */}
          <div className="relative flex items-center gap-1 mt-2 flex-wrap">
            {/* Floating panels — anchor to this relative container */}
            <SourcePickerPanel open={sourcePanelOpen} onClose={() => setSourcePanelOpen(false)} selectedIds={selectedSourceIds} onToggle={toggleSource} />
            <SubjectPickerPanel open={subjectPanelOpen} onClose={() => setSubjectPanelOpen(false)} selectedIds={selectedSubjectIds} onToggle={toggleSubject} />
            <TimeframePickerPanel open={timeframePanelOpen} onClose={() => setTimeframePanelOpen(false)} selectedId={selectedTimeframeId} onSelect={setSelectedTimeframeId} />
            <OutputModePickerPanel open={modePanelOpen} onClose={() => setModePanelOpen(false)} selectedId={selectedModeId} onSelect={setSelectedModeId} />
            <AddContextMenu open={addContextMenuOpen} onClose={() => setAddContextMenuOpen(false)}
              onPick={(type) => {
                if (type === 'subjects')  setSubjectPanelOpen(true);
                if (type === 'timeframe') setTimeframePanelOpen(true);
                if (type === 'mode')      setModePanelOpen(true);
              }}
            />

            {/* Skills */}
            <button onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[11px] text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
              <Zap className="w-3 h-3 text-violet-500" />Skills
            </button>

            {/* Sources */}
            <button onClick={() => setSourcePanelOpen((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${selectedSourceIds.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>
              <Database className="w-3 h-3 text-blue-500" />
              {selectedSourceIds.length > 0 ? `${selectedSourceIds.length} source${selectedSourceIds.length > 1 ? 's' : ''}` : 'Sources'}
            </button>

            {/* + (subjects / timeframe / output mode) */}
            <button onClick={() => setAddContextMenuOpen((v) => !v)}
              className="flex items-center gap-0.5 px-2 py-1 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded-lg text-[11px] text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-white/20 transition-colors">
              <Plus className="w-3 h-3" />
            </button>

            {/* Attach */}
            <button onClick={() => fileInputRef.current?.click()} title="Attach file"
              className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[11px] text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
              <Paperclip className="w-3 h-3" />
            </button>

          </div>
        </div>

        {/* Skills drawer */}
        <SkillsLibraryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onUseSkill={handleUseSkill} />

        {/* Create project dialog */}
        {createProjectOpen && (
          <CreateProjectDialog onSave={handleCreateProject} onCancel={() => setCreateProjectOpen(false)} />
        )}

        <ToastStack toasts={toasts} />
      </div>
    );
  }

  // ─── Full screen mode ───────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 z-20 bg-white dark:bg-[#0f1929] flex flex-col overflow-hidden">

      {/* ── Fullscreen header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/8 bg-white dark:bg-[#131f35] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold bg-gradient-to-r from-purple-700 to-blue-600 bg-clip-text text-transparent">Cellebrite AI</span>
        </div>
        <div className="flex items-center gap-2">
          {onCollapse && (
            <button onClick={onCollapse} title="Collapse to panel"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
              <Minimize2 className="w-3.5 h-3.5" /> Collapse
            </button>
          )}
        </div>
      </div>

      {/* ── Body with persistent sidebar ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Persistent sidebar */}
        <ChatHistorySidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
          onDelete={handleDeleteConversation}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onNewProjectChat={handleNewProjectChat}
          onCreateProject={() => setCreateProjectOpen(true)}
          collapsed={historySidebarCollapsed}
          onToggleCollapsed={() => setHistorySidebarCollapsed((v) => !v)}
        />

      {/* ── Main workspace ── */}
      <div className="flex flex-col flex-1 overflow-hidden">

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!hasConversation ? (

          /* ══════════════════════════════════════════
             EMPTY STATE — Animated hero layout
          ══════════════════════════════════════════ */
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 relative [background:linear-gradient(160deg,#dbeafe_0%,#ede9fe_35%,#f0f9ff_65%,#ffffff_100%)] dark:[background:linear-gradient(160deg,#1a1033_0%,#160d2e_35%,#0f1929_65%,#131f35_100%)]"
          >
            {/* Animated blobs */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="ai-blob ai-blob-1" style={{ width: 520, height: 520, top: '-80px',  left: '-60px',  background: 'rgba(59,130,246,0.28)' }} />
              <div className="ai-blob ai-blob-2" style={{ width: 480, height: 480, bottom: '-60px', right: '-80px', background: 'rgba(139,92,246,0.22)' }} />
              <div className="ai-blob ai-blob-3" style={{ width: 360, height: 360, top: '30%',  right: '5%',    background: 'rgba(99,102,241,0.18)' }} />
              <div className="ai-blob ai-blob-4" style={{ width: 300, height: 300, bottom: '15%', left: '8%',    background: 'rgba(96,165,250,0.20)' }} />
            </div>

            <div className="ai-content-fadein w-full max-w-[640px] flex flex-col items-center gap-7 py-10 relative z-10">

              {/* Brand mark */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-white/80 dark:border-white/15 shadow-xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-xs font-bold tracking-[0.2em] text-indigo-500 uppercase">Cellebrite AI</span>
              </div>

              {/* Greeting */}
              <div className="text-center">
                <h2 className="text-[28px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                  {activeProject ? `${activeProject.name}` : 'What would you like\nto investigate today?'}
                </h2>
                {activeProject ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{activeProject.description}</p>
                ) : inCaseContext && propCaseName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    {propCaseName} · <span className="text-gray-400 dark:text-gray-500 font-normal">{propCaseId}</span>
                  </p>
                )}
                {activeProject?.instructions && (
                  <div className={`mt-4 px-4 py-3 rounded-xl border text-left text-xs leading-relaxed dark:bg-white/5 dark:border-white/10 dark:text-gray-300 ${PROJECT_COLOR_MAP[activeProject.color as ProjectColor]?.bg ?? 'bg-gray-50'} ${PROJECT_COLOR_MAP[activeProject.color as ProjectColor]?.border ?? 'border-gray-200'} ${PROJECT_COLOR_MAP[activeProject.color as ProjectColor]?.text ?? 'text-gray-600'}`}>
                    <span className="font-bold block mb-1">AI Instructions</span>
                    {activeProject.instructions}
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept={activeSkill?.id === 'as6' ? 'image/*' : activeSkill?.id === 'as7' ? 'video/*' : '*'}
                onChange={handleFileChange}
              />

              {/* ── Big centered input box ── */}
              <div className="w-full bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-white/90 dark:border-white/10 shadow-lg hover:shadow-xl focus-within:shadow-xl focus-within:bg-white dark:focus-within:bg-white/8 transition-all duration-200">

                {/* Media skill upload zone */}
                {(activeSkill?.id === 'as6' || activeSkill?.id === 'as7') && pendingFiles.length === 0 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 py-5 border-b border-dashed border-gray-200 dark:border-white/10 hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors rounded-t-2xl"
                  >
                    {activeSkill.id === 'as6'
                      ? <Image className="w-7 h-7 text-blue-400" />
                      : <Video className="w-7 h-7 text-violet-400" />}
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {activeSkill.id === 'as6' ? 'Click to upload an image to geo-locate' : 'Click to upload any surveillance footage'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {activeSkill.id === 'as6' ? 'JPG, PNG, HEIC' : 'MP4, MOV, AVI'} — or type a description below
                    </p>
                  </button>
                )}

                {/* Pending file preview inside input */}
                {pendingFiles.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-white/8 flex-wrap">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="relative group flex-shrink-0">
                        {f.type === 'image' && f.previewUrl ? (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
                            <img src={f.previewUrl} className="w-full h-full object-cover" alt={f.name} />
                            <button
                              onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-gray-900/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            ><X className="w-2.5 h-2.5 text-white" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 pl-2.5 pr-2 py-2 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl max-w-[180px]">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${FILE_TYPE_BG[f.type]}`}>
                              <FileTypeIcon type={f.type} className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight">{f.name}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">{f.size}</p>
                            </div>
                            <button
                              onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                              className="flex-shrink-0 text-gray-400 hover:text-gray-700 ml-0.5"
                            ><X className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 text-gray-400 hover:border-gray-400 dark:hover:border-white/20 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                    >
                      <Plus className="w-4 h-4 mb-0.5" />
                      <span className="text-[9px] font-medium">Add</span>
                    </button>
                  </div>
                )}

                {/* Textarea */}
                <textarea
                  ref={inputRef}
                  rows={3}
                  className="w-full px-5 pt-4 pb-2 bg-transparent text-sm text-gray-900 dark:text-white outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600 leading-relaxed rounded-t-2xl"
                  placeholder={
                    activeSkill?.id === 'as6' ? 'Or describe the scene to help locate…'
                    : activeSkill?.id === 'as7' ? 'Describe the suspect to narrow the search…'
                    : activeSkill ? `Using "${activeSkill.name}" — type your question…`
                    : inCaseContext ? `Ask anything about ${propCaseName ?? 'this case'}…`
                    : 'Ask anything about your evidence…'
                  }
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                />

                {/* Context toolbar */}
                <div className="relative flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/8 gap-2 flex-wrap">

                  {/* All floating panels anchor here */}
                  <SourcePickerPanel  open={sourcePanelOpen}  onClose={() => setSourcePanelOpen(false)}  selectedIds={selectedSourceIds} onToggle={toggleSource} />
                  <SubjectPickerPanel open={subjectPanelOpen} onClose={() => setSubjectPanelOpen(false)} selectedIds={selectedSubjectIds} onToggle={toggleSubject} />
                  <TimeframePickerPanel open={timeframePanelOpen} onClose={() => setTimeframePanelOpen(false)} selectedId={selectedTimeframeId} onSelect={setSelectedTimeframeId} />
                  <OutputModePickerPanel open={modePanelOpen} onClose={() => setModePanelOpen(false)} selectedId={selectedModeId} onSelect={setSelectedModeId} />
                  <AddContextMenu open={addContextMenuOpen} onClose={() => setAddContextMenuOpen(false)}
                    onPick={(type) => {
                      if (type === 'subjects')  { setSubjectPanelOpen(true);   }
                      if (type === 'timeframe') { setTimeframePanelOpen(true); }
                      if (type === 'mode')      { setModePanelOpen(true);      }
                    }}
                  />

                  <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">

                    {/* Skills — always visible */}
                    {activeSkill ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-50 border border-violet-200 rounded-lg text-xs text-violet-700 font-semibold">
                        <Zap className="w-3 h-3" />{activeSkill.name}
                        <button onClick={() => setActiveSkill(null)} className="ml-0.5 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setDrawerOpen(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                        <Zap className="w-3 h-3 text-violet-500" />Skills<ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>
                    )}

                    {/* Sources pills / button */}
                    {selectedSources.length === 0 ? (
                      <button onClick={() => setSourcePanelOpen((v) => !v)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                        <Database className="w-3 h-3 text-blue-500" />Sources<ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>
                    ) : selectedSources.map((src) => {
                      const Icon = src.icon;
                      const s = FILE_TYPE_STYLE[src.fileType] ?? { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
                      return (
                        <div key={src.id} className={`flex items-center gap-1.5 pl-2 pr-1.5 py-1.5 rounded-lg border text-xs font-medium ${s.bg} ${s.text} ${s.border}`}>
                          <Icon className="w-3 h-3 flex-shrink-0" />
                          <span className="max-w-[90px] truncate">{src.filename}</span>
                          <span className="font-bold opacity-50 text-[10px]">{src.fileType}</span>
                          <button onClick={() => toggleSource(src.id)} className="ml-0.5 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
                        </div>
                      );
                    })}

                    {/* Subjects pills */}
                    {selectedSubjects.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-1.5 pl-2 pr-1.5 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-xs font-medium text-violet-700">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${sub.color}`}>{sub.initials}</div>
                        <span className="max-w-[80px] truncate">{sub.name}</span>
                        <button onClick={() => toggleSubject(sub.id)} className="ml-0.5 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
                      </div>
                    ))}

                    {/* Timeframe pill */}
                    {selectedTimeframe && (
                      <div className="flex items-center gap-1.5 pl-2 pr-1.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{selectedTimeframe.short}</span>
                        <button onClick={() => setSelectedTimeframeId(null)} className="ml-0.5 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
                      </div>
                    )}

                    {/* Output mode pill */}
                    {selectedMode && (
                      <div className="flex items-center gap-1.5 pl-2 pr-1.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-xs font-medium text-amber-700">
                        <span className="text-sm leading-none">{selectedMode.icon}</span>
                        <span>{selectedMode.label}</span>
                        <button onClick={() => setSelectedModeId(null)} className="ml-0.5 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
                      </div>
                    )}

                    {/* + Add context */}
                    <button onClick={() => setAddContextMenuOpen((v) => !v)}
                      className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded-lg text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-white/20 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach file"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white transition-colors"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button onClick={() => sendMessage()} disabled={!inputValue.trim() && pendingFiles.length === 0}
                      className="w-9 h-9 flex-shrink-0 bg-gray-900 dark:bg-white/10 rounded-xl flex items-center justify-center hover:bg-gray-700 dark:hover:bg-white/15 disabled:opacity-20 disabled:cursor-not-allowed transition-all">
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick action pills */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p.text}
                    onClick={() => sendMessage(p.text)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/80 dark:border-white/10 rounded-full text-sm text-gray-700 dark:text-gray-300 font-medium shadow-sm hover:bg-white dark:hover:bg-white/10 hover:shadow-md hover:text-gray-900 dark:hover:text-white transition-all duration-150"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    {p.text}
                  </button>
                ))}
              </div>

            </div>
          </div>

        ) : (

          /* ══════════════════════════════════════════
             ACTIVE CHAT — standard layout
          ══════════════════════════════════════════ */
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Active project banner */}
            {activeProject && (
              <div className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-2.5 border-b dark:border-white/10 dark:bg-white/5 ${PROJECT_COLOR_MAP[activeProject.color as ProjectColor]?.border ?? 'border-gray-200'} ${PROJECT_COLOR_MAP[activeProject.color as ProjectColor]?.bg ?? 'bg-gray-50'}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PROJECT_COLOR_MAP[activeProject.color as ProjectColor]?.dot ?? 'bg-gray-400'}`} />
                <span className={`text-xs font-bold dark:text-gray-300 ${PROJECT_COLOR_MAP[activeProject.color as ProjectColor]?.text ?? 'text-gray-700'}`}>{activeProject.name}</span>
                <span className="text-[11px] text-gray-400 truncate flex-1">{activeProject.description}</span>
                <button onClick={() => setActiveProjectId(null)} className="text-[11px] text-gray-400 hover:text-gray-600 flex-shrink-0">Exit project</button>
              </div>
            )}

            {/* Sources context bar */}
            {selectedSources.length > 0 && (
              <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2 border-b border-gray-100 dark:border-white/8 bg-gray-50 dark:bg-white/5 flex-wrap">
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Analyzing:</span>
                {selectedSources.map((src) => {
                  const Icon = src.icon;
                  const style = FILE_TYPE_STYLE[src.fileType] ?? { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
                  return (
                    <span key={src.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${style.bg} ${style.text} ${style.border}`}>
                      <Icon className="w-3 h-3" />
                      <span className="max-w-[140px] truncate">{src.filename}</span>
                      <FileTypeBadge type={src.fileType} />
                    </span>
                  );
                })}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="min-h-full flex flex-col justify-end gap-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[11px] font-bold self-start ${
                    msg.role === 'user'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gradient-to-br from-blue-500 to-violet-600 text-white'
                  }`}>
                    {msg.role === 'user' ? 'TZ' : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[82%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.role === 'user' ? (
                      <div className="flex flex-col gap-2 items-end">
                        {/* Attached files */}
                        {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-end">
                            {msg.attachedFiles.map((f, i) => (
                              f.type === 'image' && f.previewUrl ? (
                                <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border border-gray-700 flex-shrink-0">
                                  <img src={f.previewUrl} className="w-full h-full object-cover" alt={f.name} />
                                </div>
                              ) : (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-gray-300 max-w-[220px]">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${FILE_TYPE_BG[f.type]} opacity-90`}>
                                    <FileTypeIcon type={f.type} className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-gray-200 text-[11px]">{f.name}</p>
                                    <p className="text-gray-500 text-[10px]">{f.size}</p>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        )}
                        <div className="bg-gray-900 text-white text-sm px-4 py-3 rounded-2xl rounded-tr-sm leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.content && !msg.structuredResponse && !msg.locationMatch && !msg.faceMatch && (
                          <div className="bg-white dark:bg-white/5 border border-purple-100 dark:border-purple-700/30 text-gray-700 dark:text-gray-300 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.content.replace(/\*\*(.+?)\*\*/g, '$1')}
                          </div>
                        )}
                        {msg.structuredResponse && <AIResponseCard response={msg.structuredResponse} />}
                        {msg.locationMatch && <LocationResponseCard match={msg.locationMatch} />}
                        {msg.faceMatch && <FaceMatchResponseCard match={msg.faceMatch} />}
                        {msg.actionChips && <ActionChipBar chips={msg.actionChips} onExecute={handleChipExecute} />}
                      </>
                    )}
                    <span className="text-[10px] text-gray-400 mt-1.5 px-1">{msg.timestamp}</span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-[#131f35] border border-gray-200 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex flex-col gap-2 w-64">
                    <div className="h-2.5 w-48 bg-gray-200 dark:bg-white/10 rounded-full animate-pulse" />
                    <div className="h-2.5 w-36 bg-gray-200 dark:bg-white/10 rounded-full animate-pulse" />
                    <div className="h-2.5 w-44 bg-gray-200 dark:bg-white/10 rounded-full animate-pulse" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom input (active chat only) ── */}
        {hasConversation && (
          <div className="flex-shrink-0 border-t border-gray-100 dark:border-white/8 bg-white dark:bg-[#131f35] px-5 py-4">
            <div className="w-full max-w-[760px] mx-auto">
              {activeSkill && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 border border-violet-200 rounded-full text-xs text-violet-700 font-semibold">
                    <Zap className="w-3 h-3" />
                    {activeSkill.name}
                    <button onClick={() => setActiveSkill(null)} className="ml-1 hover:text-violet-900"><X className="w-3 h-3" /></button>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Skill active</span>
                </div>
              )}
              {/* Pending file in bottom input */}
              {pendingFiles.length > 0 && (
                <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                  {pendingFiles.map((f, i) => (
                    f.type === 'image' && f.previewUrl ? (
                      <div key={i} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 flex-shrink-0">
                        <img src={f.previewUrl} className="w-full h-full object-cover" alt={f.name} />
                        <button
                          onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        ><X className="w-3 h-3 text-white" /></button>
                      </div>
                    ) : (
                      <div key={i} className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg max-w-[160px]">
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${FILE_TYPE_BG[f.type]}`}>
                          <FileTypeIcon type={f.type} className="w-3 h-3" />
                        </div>
                        <span className="text-[11px] text-gray-700 dark:text-gray-300 truncate">{f.name}</span>
                        <button onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  ))}
                </div>
              )}
              <div className="bg-white dark:bg-[#0f1929] border border-gray-200 dark:border-white/10 rounded-2xl focus-within:border-gray-400 dark:focus-within:border-white/20 focus-within:shadow-sm transition-all">
                <textarea
                  ref={inputRef}
                  rows={1}
                  className="w-full px-4 pt-3 pb-2 bg-transparent text-sm text-gray-900 dark:text-white outline-none resize-none placeholder-gray-400 dark:placeholder-gray-600 leading-relaxed"
                  placeholder={
                    activeSkill?.id === 'as6' ? 'Upload an image or describe the scene…'
                    : activeSkill?.id === 'as7' ? 'Upload footage or describe the suspect…'
                    : inCaseContext ? `Ask anything about ${propCaseName ?? 'this case'}…` : 'Ask anything…'
                  }
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                />
                {/* Toolbar */}
                <div className="relative flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-white/8 gap-2">
                  <SourcePickerPanel  open={sourcePanelOpen}  onClose={() => setSourcePanelOpen(false)}  selectedIds={selectedSourceIds} onToggle={toggleSource} />
                  <SubjectPickerPanel open={subjectPanelOpen} onClose={() => setSubjectPanelOpen(false)} selectedIds={selectedSubjectIds} onToggle={toggleSubject} />
                  <TimeframePickerPanel open={timeframePanelOpen} onClose={() => setTimeframePanelOpen(false)} selectedId={selectedTimeframeId} onSelect={setSelectedTimeframeId} />
                  <OutputModePickerPanel open={modePanelOpen} onClose={() => setModePanelOpen(false)} selectedId={selectedModeId} onSelect={setSelectedModeId} />
                  <AddContextMenu open={addContextMenuOpen} onClose={() => setAddContextMenuOpen(false)}
                    onPick={(type) => {
                      if (type === 'subjects')  { setSubjectPanelOpen(true);   }
                      if (type === 'timeframe') { setTimeframePanelOpen(true); }
                      if (type === 'mode')      { setModePanelOpen(true);      }
                    }}
                  />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                    {activeSkill ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-50 border border-violet-200 rounded-lg text-xs text-violet-700 font-semibold">
                        <Zap className="w-3 h-3" />{activeSkill.name}
                        <button onClick={() => setActiveSkill(null)} className="ml-0.5 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setDrawerOpen(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                        <Zap className="w-3 h-3 text-violet-500" />Skills<ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                    {selectedSources.length === 0 ? (
                      <button onClick={() => setSourcePanelOpen((v) => !v)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-colors">
                        <Database className="w-3 h-3 text-blue-500" />Sources<ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>
                    ) : selectedSources.map((src) => {
                      const Icon = src.icon;
                      const s = FILE_TYPE_STYLE[src.fileType] ?? { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
                      return (
                        <div key={src.id} className={`flex items-center gap-1.5 pl-2 pr-1.5 py-1.5 rounded-lg border text-xs font-medium ${s.bg} ${s.text} ${s.border}`}>
                          <Icon className="w-3 h-3 flex-shrink-0" />
                          <span className="max-w-[90px] truncate">{src.filename}</span>
                          <button onClick={() => toggleSource(src.id)} className="ml-0.5 opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
                        </div>
                      );
                    })}
                    <button onClick={() => setAddContextMenuOpen((v) => !v)}
                      className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded-lg text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-white/20 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach file"
                      className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => sendMessage()}
                      disabled={!inputValue.trim() && pendingFiles.length === 0}
                      className="w-7 h-7 bg-gray-900 dark:bg-white/10 rounded-xl flex items-center justify-center hover:bg-gray-700 dark:hover:bg-white/15 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-center text-[10px] text-gray-300 mt-2">
                AI-generated results may contain inaccuracies — human review required
              </p>
            </div>
          </div>
        )}
      </div>

      </div>{/* end main workspace */}
      </div>{/* end floating body wrapper */}

      {/* Create project dialog */}
      {createProjectOpen && (
        <CreateProjectDialog
          onSave={handleCreateProject}
          onCancel={() => setCreateProjectOpen(false)}
        />
      )}

      {/* Skills drawer */}
      <SkillsLibraryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUseSkill={handleUseSkill}
      />

      <ToastStack toasts={toasts} />
    </div>
  );
}
