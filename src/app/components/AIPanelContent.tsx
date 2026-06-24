import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { cn } from './ui/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Summarize location activity for all subjects in the 24 hours before the incident.',
  'Identify any communication overlap between Marcus Vance and Elena Rostova.',
  'Are there shared contacts or locations between the two primary subjects?',
];

const MOCK_RESPONSES: [string, string][] = [
  [
    'location',
    'Cross-referencing GPS and cell tower data across all subjects, three significant location overlaps were identified in the 24-hour window before the incident. Marcus Vance and Elena Rostova\'s devices both pinged sector A14 at 00:09 on Jul 22, placing them within 400m of 412 Harbor View Rd simultaneously. Recommend verifying against CCTV coverage of that area.',
  ],
  [
    'communication',
    'Analysis of CDR and messaging logs identified 14 direct contacts between Marcus Vance and Elena Rostova in the 72 hours prior to the incident. 9 were via encrypted Signal messages (metadata only); 5 were standard SMS. A coordinated gap in both devices\' activity occurred between 23:51 and 00:22 on the night of the incident.',
  ],
  [
    'shared\|contact\|overlap',
    'Cross-referencing subject records identified 3 mutual links: a shared address listed in 2022 records, two overlapping phone contacts in both CDR extractions, and a flagged financial transaction from March 2023. A full connection graph is available — would you like to map it to the Subjects module?',
  ],
];

function getMockResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, response] of MOCK_RESPONSES) {
    if (new RegExp(key).test(lower)) return response;
  }
  return "I've analyzed the available case data and identified several patterns worth investigating further. Could you be more specific — for example, about a subject, location, or timeline window? I can cross-reference CDR, device extractions, and location data to give you a targeted answer.";
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AIPanelContentProps {
  onClose: () => void;
  initialPrompt?: string;
  draftPrompt?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AIPanelContent({ onClose, initialPrompt, draftPrompt }: AIPanelContentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!initialPrompt) return;
    const t = setTimeout(() => handleSubmit(initialPrompt), 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  // Draft mode — pre-fills the input without submitting so the user can review and edit
  useEffect(() => {
    if (!draftPrompt) return;
    setInput(draftPrompt);
    setTimeout(() => textareaRef.current?.focus(), 80);
  }, [draftPrompt]);

  const handleSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: trimmed }]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: getMockResponse(trimmed) },
      ]);
      setIsLoading(false);
    }, 1200 + Math.random() * 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="relative w-96 flex-shrink-0 border-l border-purple-200 dark:border-purple-700/30 bg-gradient-to-b from-purple-50/70 via-blue-50/40 to-white dark:from-[#1a1033] dark:via-[#160d2e] dark:to-[#0f1929] flex flex-col overflow-hidden">
      {/* Decorative blobs — contained within panel */}
      <div className="absolute top-0 right-0 w-52 h-52 bg-gradient-to-bl from-purple-200/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-24 left-0 w-40 h-40 bg-gradient-to-tr from-cyan-200/30 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3.5 border-b border-purple-200/60 dark:border-purple-700/30 bg-white/70 dark:bg-black/20 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold bg-gradient-to-r from-purple-700 to-blue-600 bg-clip-text text-transparent">
            Cellebrite AI
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-purple-400 hover:text-purple-700 hover:bg-purple-100/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Chat area ── */}
      <ScrollArea className="relative z-10 flex-1 min-h-0">
        <div className="px-4 py-4 flex flex-col gap-3">

          {/* Empty state — suggestion pills */}
          {isEmpty && (
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-xs font-semibold text-purple-500 mb-1">
                Suggested questions
              </p>
              {SUGGESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(q)}
                  className="w-full text-left px-3.5 py-3 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-purple-100 dark:border-purple-700/30 hover:border-purple-300 dark:hover:border-purple-600/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm hover:shadow group flex items-center justify-between gap-2"
                >
                  <span>{q}</span>
                  <Send className="w-3 h-3 text-purple-300 group-hover:text-purple-500 flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) =>
            msg.role === 'user' ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-gradient-to-br from-purple-500 to-blue-500 text-white text-sm leading-relaxed shadow-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0 px-3.5 py-2.5 bg-white/85 dark:bg-white/5 border border-purple-100 dark:border-purple-700/30 rounded-2xl rounded-tl-sm text-sm text-gray-700 dark:text-gray-300 leading-relaxed shadow-sm">
                  {msg.content}
                </div>
              </div>
            )
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-3.5 py-3 bg-white/85 dark:bg-white/5 border border-purple-100 dark:border-purple-700/30 rounded-2xl rounded-tl-sm shadow-sm">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* ── Sticky input footer ── */}
      <div className="relative z-10 flex-shrink-0 px-3 pb-3 pt-2 border-t border-purple-100 dark:border-purple-700/30 bg-white/80 dark:bg-black/20 backdrop-blur-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-blue-100/50 rounded-xl blur-sm" />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What are you trying to find out?"
            rows={2}
            disabled={isLoading}
            className="relative w-full pl-3.5 pr-12 py-3 bg-white/95 dark:bg-white/5 border border-purple-200 dark:border-purple-700/40 rounded-xl text-sm text-gray-900 dark:text-white placeholder-purple-300 dark:placeholder-purple-700/70 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400/50 dark:focus:ring-purple-500/30 focus:border-purple-400 shadow-sm disabled:opacity-60"
          />
          <button
            onClick={() => handleSubmit(input)}
            disabled={!input.trim() || isLoading}
            className={cn(
              'absolute right-2.5 bottom-2.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150',
              input.trim() && !isLoading
                ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95'
                : 'bg-gray-100 dark:bg-white/10 text-gray-300 dark:text-gray-500 cursor-not-allowed'
            )}
            title="Send (Enter)"
          >
            {isLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />
            }
          </button>
        </div>
        <p className="text-[10px] text-purple-400/80 text-center mt-2 select-none">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
