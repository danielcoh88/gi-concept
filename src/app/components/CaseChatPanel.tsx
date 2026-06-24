import { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, Paperclip, Send, Users, FlaskConical, FileText, ImageIcon, MessageSquare } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatTab = 'team' | 'lab';

interface Segment {
  type: 'text' | 'mention';
  content: string;
}

interface Message {
  id: string;
  sender: string;
  segments: Segment[];
  time: string;
  isMe: boolean;
}

interface Thread {
  id: string;
  submissionId: string;
  title: string;
  subtitle: string;
  preview: string;
  time: string;
  unread: number;
  messages: Message[];
}

// ─── Segment helpers ──────────────────────────────────────────────────────────

function t(content: string): Segment { return { type: 'text',    content }; }
function m(content: string): Segment { return { type: 'mention', content }; }

// ─── Mock data ────────────────────────────────────────────────────────────────

const CASE_NOTES_MESSAGES: Message[] = [
  {
    id: 'cn1', sender: 'Alex Carter', isMe: false, time: '9:04 AM',
    segments: [m('@Sarah Kim'), t(' confirmed the suspect was at Harbor View Rd at 00:12. CCTV timestamp checks out.')],
  },
  {
    id: 'cn2', sender: 'Sarah Lim', isMe: false, time: '9:10 AM',
    segments: [t("Right. I've updated the crimeline entry. Can you check the gas station receipt?")],
  },
  {
    id: 'cn3', sender: 'You', isMe: true, time: '9:18 AM',
    segments: [t('On it. Also cross-referencing the DNA submission results with the suspect profile.')],
  },
  {
    id: 'cn4', sender: 'Sarah Lim', isMe: false, time: '9:27 AM',
    segments: [t('Good call. '), m('@Alex Carter'), t(' — can you pull the March financial records for the suspect?')],
  },
  {
    id: 'cn5', sender: 'Alex Carter', isMe: false, time: '9:35 AM',
    segments: [t('Already on it. Full breakdown by EOD. Should we loop in '), m('@Det-Reyes'), t(' on the financials review?')],
  },
  {
    id: 'cn6', sender: 'You', isMe: true, time: '9:41 AM',
    segments: [t('Yes — '), m('@Det-Reyes'), t(' please review the financial transaction records when you get a chance.')],
  },
];

const LAB_THREADS: Thread[] = [
  {
    id: 'lab-a183',
    submissionId: '#A183',
    title: 'Sub #A183 — DNA Match',
    subtitle: 'Dr. Chen · Forensic Biology',
    preview: 'Dr. Chen: Preliminary results show a strong link…',
    time: '8:55 AM',
    unread: 1,
    messages: [
      { id: 'm1', sender: 'Dr. Chen', isMe: false, time: '8:30 AM',
        segments: [t('Preliminary results in — 99.2% match to the reference sample.')] },
      { id: 'm2', sender: 'You', isMe: true, time: '8:37 AM',
        segments: [t('Significant. Can you confirm sample integrity?')] },
      { id: 'm3', sender: 'Dr. Chen', isMe: false, time: '8:44 AM',
        segments: [t('Chain of custody intact. Full report uploaded to the submission.')] },
      { id: 'm4', sender: 'You', isMe: true, time: '8:50 AM',
        segments: [t("Thanks — we'll flag this for the prosecutor.")] },
      { id: 'm5', sender: 'Dr. Chen', isMe: false, time: '8:55 AM',
        segments: [t('Preliminary results show a strong link to Suspect #1. Formal report due Friday.')] },
    ],
  },
  {
    id: 'lab-b441',
    submissionId: '#B441',
    title: 'Sub #B441 — Toxicology',
    subtitle: 'Dr. Mills · Toxicology Lab',
    preview: 'Dr. Mills: Trace amounts of diazepam detected.',
    time: 'Yesterday',
    unread: 0,
    messages: [
      { id: 'm1', sender: 'Dr. Mills', isMe: false, time: 'Yesterday 4:12 PM',
        segments: [t('Ethanol: 0.18% BAC. Consistent with heavy intoxication at time of incident.')] },
      { id: 'm2', sender: 'You', isMe: true, time: 'Yesterday 4:20 PM',
        segments: [t('Was there anything else flagged in the panel?')] },
      { id: 'm3', sender: 'Dr. Mills', isMe: false, time: 'Yesterday 4:31 PM',
        segments: [t('Trace amounts of diazepam detected — could be prescribed medication or tampering.')] },
      { id: 'm4', sender: 'You', isMe: true, time: 'Yesterday 4:35 PM',
        segments: [t('Please include that in the formal report.')] },
    ],
  },
  {
    id: 'lab-c072',
    submissionId: '#C072',
    title: 'Sub #C072 — Ballistics',
    subtitle: 'Officer Kane · Ballistics Unit',
    preview: 'Officer Kane: Expect full report by Wednesday.',
    time: 'Mon',
    unread: 2,
    messages: [
      { id: 'm1', sender: 'Officer Kane', isMe: false, time: 'Mon 2:05 PM',
        segments: [t('Striations on the recovered round match the rifling of a .45 ACP Glock 21.')] },
      { id: 'm2', sender: 'You', isMe: true, time: 'Mon 2:11 PM',
        segments: [t('Is that consistent with the weapon registered to the suspect?')] },
      { id: 'm3', sender: 'Officer Kane', isMe: false, time: 'Mon 2:18 PM',
        segments: [t('Pending final comparison, but initial results suggest yes.')] },
      { id: 'm4', sender: 'You', isMe: true, time: 'Mon 2:22 PM',
        segments: [t('Keep me updated — critical for the chain of evidence.')] },
      { id: 'm5', sender: 'Officer Kane', isMe: false, time: 'Mon 2:25 PM',
        segments: [t('Will do. Expect full report by Wednesday.')] },
    ],
  },
  {
    id: 'lab-d201', submissionId: '#D201',
    title: 'Sub #D201 — DNA Sample',
    subtitle: 'Dr. Hansen · Forensic Biology',
    preview: 'You: Following up on the blood sample submitted last week.',
    time: '12 days ago', unread: 0,
    messages: [
      { id: 'm1', sender: 'You', isMe: true, time: '12 days ago',
        segments: [t('Submitting blood sample from scene for analysis. Priority case.')] },
      { id: 'm2', sender: 'Dr. Hansen', isMe: false, time: '12 days ago',
        segments: [t('Received. Logged under case file. Analysis estimated within 10–14 business days.')] },
      { id: 'm3', sender: 'You', isMe: true, time: '5 days ago',
        segments: [t('Following up on the blood sample submitted last week. Any preliminary findings?')] },
    ],
  },
  {
    id: 'lab-e330', submissionId: '#E330',
    title: 'Sub #E330 — Fiber Analysis',
    subtitle: 'Dr. Torres · Trace Evidence',
    preview: 'You: Any update on the fiber comparison?',
    time: '8 days ago', unread: 0,
    messages: [
      { id: 'm1', sender: 'You', isMe: true, time: '8 days ago',
        segments: [t('Submitting fiber samples from suspect clothing for trace comparison.')] },
      { id: 'm2', sender: 'Dr. Torres', isMe: false, time: '8 days ago',
        segments: [t('Confirmed receipt. Will cross-reference with scene fibers. Turnaround approx. 10 days.')] },
      { id: 'm3', sender: 'You', isMe: true, time: '2 days ago',
        segments: [t('Any update on the fiber comparison? This is blocking the suspect report.')] },
    ],
  },
  {
    id: 'lab-f445', submissionId: '#F445',
    title: 'Sub #F445 — Ballistics Casing',
    subtitle: 'Officer Walsh · Ballistics Unit',
    preview: 'Officer Walsh: In queue. Estimated 3–5 more days.',
    time: '15 days ago', unread: 0,
    messages: [
      { id: 'm1', sender: 'You', isMe: true, time: '15 days ago',
        segments: [t('Recovered bullet casing submitted for firearm matching.')] },
      { id: 'm2', sender: 'Officer Walsh', isMe: false, time: '15 days ago',
        segments: [t('Logged. Comparison against registered firearms database queued.')] },
      { id: 'm3', sender: 'You', isMe: true, time: '7 days ago',
        segments: [t('Any update? This has been sitting for 2 weeks.')] },
      { id: 'm4', sender: 'Officer Walsh', isMe: false, time: '6 days ago',
        segments: [t('In queue. Estimated 3–5 more days.')] },
    ],
  },
  {
    id: 'lab-g112', submissionId: '#G112',
    title: 'Sub #G112 — Latent Prints',
    subtitle: 'Agent Park · Fingerprint ID',
    preview: 'Agent Park: Lift quality is being assessed.',
    time: '6 days ago', unread: 0,
    messages: [
      { id: 'm1', sender: 'You', isMe: true, time: '6 days ago',
        segments: [t('Latent print lifts from door handle submitted. Please compare against AFIS.')] },
      { id: 'm2', sender: 'Agent Park', isMe: false, time: '6 days ago',
        segments: [t('Received. Lift quality is being assessed before AFIS submission.')] },
    ],
  },
  {
    id: 'lab-h774', submissionId: '#H774',
    title: 'Sub #H774 — Digital Device',
    subtitle: 'Tech Analyst Vega · Digital Forensics',
    preview: 'Tech Analyst Vega: Extraction in progress.',
    time: '20 days ago', unread: 0,
    messages: [
      { id: 'm1', sender: 'You', isMe: true, time: '20 days ago',
        segments: [t("Suspect's mobile phone submitted for data extraction and analysis.")] },
      { id: 'm2', sender: 'Tech Analyst Vega', isMe: false, time: '20 days ago',
        segments: [t('Device received. Encryption bypass is in progress.')] },
      { id: 'm3', sender: 'You', isMe: true, time: '10 days ago',
        segments: [t('Any progress on the phone extraction?')] },
      { id: 'm4', sender: 'Tech Analyst Vega', isMe: false, time: '9 days ago',
        segments: [t('Extraction in progress. Encrypted partition is slowing things down.')] },
    ],
  },
  {
    id: 'lab-i903', submissionId: '#I903',
    title: 'Sub #I903 — Shoe Print',
    subtitle: 'Dr. Reyes · Physical Evidence',
    preview: 'You: Submitted cast from crime scene entry point.',
    time: '5 days ago', unread: 0,
    messages: [
      { id: 'm1', sender: 'You', isMe: true, time: '5 days ago',
        segments: [t('Shoe print cast from crime scene entry point. Please compare to suspect footwear.')] },
      { id: 'm2', sender: 'Dr. Reyes', isMe: false, time: '5 days ago',
        segments: [t('Cast received in good condition. Logged for comparison analysis.')] },
    ],
  },
  {
    id: 'lab-j256', submissionId: '#J256',
    title: 'Sub #J256 — Hair Sample',
    subtitle: 'Lab Tech Morris · Trichology',
    preview: 'Lab Tech Morris: Sample accepted for mitochondrial DNA testing.',
    time: '10 days ago', unread: 0,
    messages: [
      { id: 'm1', sender: 'You', isMe: true, time: '10 days ago',
        segments: [t('Hair sample from victim clothing submitted for mitochondrial DNA testing.')] },
      { id: 'm2', sender: 'Lab Tech Morris', isMe: false, time: '10 days ago',
        segments: [t('Sample accepted for mitochondrial DNA testing. Standard turnaround is 2–3 weeks.')] },
    ],
  },
  {
    id: 'lab-k088', submissionId: '#K088',
    title: 'Sub #K088 — Glass Fragment',
    subtitle: 'Dr. Patel · Materials Analysis',
    preview: 'You: Submitted glass fragment for refractive index analysis.',
    time: '3 days ago', unread: 0,
    messages: [
      { id: 'm1', sender: 'You', isMe: true, time: '3 days ago',
        segments: [t('Glass fragment from forced entry point submitted for refractive index analysis.')] },
      { id: 'm2', sender: 'Dr. Patel', isMe: false, time: '3 days ago',
        segments: [t('Received. Will begin elemental and refractive index comparison shortly.')] },
    ],
  },
];

// ─── Segment renderer ─────────────────────────────────────────────────────────

function RichText({ segments, isMe }: { segments: Segment[]; isMe: boolean }) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'mention') {
          return (
            <span key={i} className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold mx-0.5 ${
              isMe ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              {seg.content}
            </span>
          );
        }
        return <span key={i}>{seg.content}</span>;
      })}
    </>
  );
}

// ─── Shared message list + input ──────────────────────────────────────────────

interface ChatBodyProps {
  messages: Message[];
  onSend: (text: string) => void;
  placeholder: string;
}

function FileChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/');
  const Icon = isImage ? ImageIcon : FileText;
  const sizeLabel = file.size < 1024
    ? `${file.size} B`
    : file.size < 1024 * 1024
    ? `${(file.size / 1024).toFixed(0)} KB`
    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="flex items-center gap-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 max-w-[160px] group">
      <Icon className="w-3 h-3 text-blue-500 flex-shrink-0" />
      <span className="text-[11px] text-gray-700 dark:text-gray-300 truncate flex-1">{file.name}</span>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">{sizeLabel}</span>
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-0.5 rounded text-gray-300 hover:text-gray-600 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function ChatBody({ messages, onSend, placeholder }: ChatBodyProps) {
  const [input, setInput]       = useState('');
  const [files, setFiles]       = useState<File[]>([]);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const fileRef                 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text && files.length === 0) return;
    onSend(text || (files.length > 0 ? `[${files.map(f => f.name).join(', ')}]` : ''));
    setInput('');
    setFiles([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...selected.filter(f => !existing.has(f.name + f.size))];
    });
    e.target.value = '';
  };

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  const canSend = input.trim().length > 0 || files.length > 0;

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] flex flex-col gap-0.5 ${msg.isMe ? 'items-end' : 'items-start'}`}>
              {!msg.isMe && (
                <span className="text-[10px] font-medium text-gray-400 px-1">{msg.sender}</span>
              )}
              <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.isMe
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-bl-sm'
              }`}>
                <RichText segments={msg.segments} isMe={msg.isMe} />
              </div>
              <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 dark:border-white/10 px-3 py-3">
        <div className="flex flex-col gap-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {files.map((file, i) => (
                <FileChip key={`${file.name}-${i}`} file={file} onRemove={() => removeFile(i)} />
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <input type="file" multiple ref={fileRef} className="hidden" onChange={handleFilesChange} />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={placeholder}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none min-h-[24px] max-h-24"
            />
            <button
              onClick={send}
              disabled={!canSend}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 bg-blue-600 hover:bg-blue-700 disabled:hover:bg-blue-600"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Case Notes (team log) — no thread navigation ─────────────────────────────

function CaseNotesChat() {
  const [messages, setMessages] = useState<Message[]>(CASE_NOTES_MESSAGES);

  const addMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      { id: `cn-${Date.now()}`, sender: 'You', isMe: true, time: 'Just now',
        segments: [{ type: 'text', content: text }] },
    ]);
  };

  return (
    <ChatBody
      messages={messages}
      onSend={addMessage}
      placeholder="Type a message, use @ to mention…"
    />
  );
}

// ─── Lab thread list ──────────────────────────────────────────────────────────

function LabThreadList({ onSelect }: { onSelect: (t: Thread) => void }) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      {LAB_THREADS.map(thread => (
        <button
          key={thread.id}
          onClick={() => onSelect(thread)}
          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border-b border-gray-100 dark:border-white/8 last:border-b-0"
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mt-0.5">
            <FlaskConical className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{thread.title}</span>
              <span className="flex-shrink-0 text-[10px] text-gray-400">{thread.time}</span>
            </div>
            <p className="text-[11px] text-gray-400 truncate mb-0.5">{thread.subtitle}</p>
            <p className="text-xs text-gray-500 truncate">{thread.preview}</p>
          </div>
          {thread.unread > 0 && (
            <div className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-1">
              <span className="text-white text-[9px] font-bold">{thread.unread}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Lab active thread ────────────────────────────────────────────────────────

function LabActiveChat({ thread, onBack }: { thread: Thread; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>(thread.messages);

  const addMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      { id: `m-${Date.now()}`, sender: 'You', isMe: true, time: 'Just now',
        segments: [{ type: 'text', content: text }] },
    ]);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
          <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{thread.title}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{thread.subtitle}</p>
        </div>
      </div>
      <ChatBody
        messages={messages}
        onSend={addMessage}
        placeholder="Type a message…"
      />
    </div>
  );
}

// ─── Root panel ───────────────────────────────────────────────────────────────

const TABS: { id: ChatTab; label: string }[] = [
  { id: 'team', label: 'Case Notes' },
  { id: 'lab',  label: 'Lab Communications' },
];

interface CaseChatPanelProps {
  onClose: () => void;
  initialTab?: ChatTab;
  initialThreadId?: string;
}

export function CaseChatPanel({ onClose, initialTab, initialThreadId }: CaseChatPanelProps) {
  const [activeTab,       setActiveTab]       = useState<ChatTab>(initialTab ?? 'team');
  const [activeLabThread, setActiveLabThread] = useState<Thread | null>(
    initialThreadId ? (LAB_THREADS.find(th => th.submissionId === initialThreadId) ?? null) : null,
  );

  const labUnread = LAB_THREADS.reduce((n, th) => n + th.unread, 0);

  // Navigate when the parent changes the target (panel already open, new submission clicked)
  useEffect(() => {
    if (initialTab)       setActiveTab(initialTab);
    if (initialThreadId)  setActiveLabThread(LAB_THREADS.find(th => th.submissionId === initialThreadId) ?? null);
  }, [initialTab, initialThreadId]);

  const handleTabChange = (tab: ChatTab) => {
    setActiveTab(tab);
    setActiveLabThread(null);
  };

  // Hide tab bar when drilling into a lab thread
  const showTabs = !(activeTab === 'lab' && activeLabThread !== null);

  return (
    <div className="flex flex-col w-80 border-l border-gray-200 dark:border-white/10 bg-white dark:bg-[#131f35] overflow-hidden flex-shrink-0">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#131f35] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-[#12233A] dark:text-white">Case Chat</span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#12233A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab bar — hidden when inside a lab thread */}
      {showTabs && (
        <div className="flex border-b border-gray-200 dark:border-white/10 flex-shrink-0">
          {TABS.map(tab => {
            const isActive = tab.id === activeTab;
            const badge    = tab.id === 'lab' ? labUnread : 0;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                  isActive
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-white/15'
                }`}
              >
                {tab.label}
                {badge > 0 && (
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Body */}
      <div className="flex flex-col flex-1 min-h-0">
        {activeTab === 'team' && <CaseNotesChat />}

        {activeTab === 'lab' && !activeLabThread && (
          <LabThreadList onSelect={setActiveLabThread} />
        )}

        {activeTab === 'lab' && activeLabThread && (
          <LabActiveChat
            thread={activeLabThread}
            onBack={() => setActiveLabThread(null)}
          />
        )}
      </div>
    </div>
  );
}
