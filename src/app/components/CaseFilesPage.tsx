import { useState } from 'react';
import {
  Search, ChevronDown, Plus, MoreVertical, MessageSquare, AlertTriangle, Sparkles,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type FileRow = {
  id: number;
  kind: 'folder' | 'file';
  name: string;
  ext?: string;
  size: string;
  dateCreated: string;
  createdBy: string;
  createdByInitials?: string;
  isMe?: boolean;
  linkedTo?: { label: string; icon?: 'subject' | 'evidence' | 'device'; overflow?: number }[];
  hasComment?: boolean;
  additionalInfo?: 'csam';
  action: 'open' | 'preview';
};

// ─── File type badge ──────────────────────────────────────────────────────────

const EXT_COLORS: Record<string, { bg: string; text: string }> = {
  UFDR:  { bg: 'bg-orange-500',  text: 'text-white'  },
  ZIP:   { bg: 'bg-gray-400',    text: 'text-white'  },
  PDF:   { bg: 'bg-red-600',     text: 'text-white'  },
  XLSX:  { bg: 'bg-green-600',   text: 'text-white'  },
  CSV:   { bg: 'bg-green-500',   text: 'text-white'  },
  PPTX:  { bg: 'bg-orange-600',  text: 'text-white'  },
  DOCX:  { bg: 'bg-blue-600',    text: 'text-white'  },
  XML:   { bg: 'bg-orange-400',  text: 'text-white'  },
};

function FileTypeBadge({ ext }: { ext: string }) {
  const c = EXT_COLORS[ext] ?? { bg: 'bg-gray-400', text: 'text-white' };
  return (
    <span className={`inline-flex items-center justify-center ${c.bg} ${c.text} rounded text-[9px] font-bold px-1 py-0.5 min-w-[32px] leading-none`}>
      {ext}
    </span>
  );
}

function FolderIcon() {
  return (
    <span className="inline-flex items-center justify-center w-8 h-7">
      <svg viewBox="0 0 32 28" fill="none" className="w-8 h-7">
        <rect x="0" y="6" width="32" height="22" rx="3" fill="#F59E0B" />
        <rect x="0" y="4" width="14" height="8" rx="3" fill="#FBBF24" />
      </svg>
    </span>
  );
}

// ─── Linked-to chip ───────────────────────────────────────────────────────────

function LinkedChip({ label, overflow }: { label: string; overflow?: number }) {
  return (
    <span className="inline-flex items-center gap-1 border border-blue-300 text-blue-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap bg-blue-50">
      <Sparkles className="w-2.5 h-2.5 text-blue-500 flex-shrink-0" />
      {label}
      {overflow !== undefined && (
        <span className="ml-0.5 bg-blue-200 text-blue-700 rounded-full px-1 text-[9px] font-bold">+{overflow}</span>
      )}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'from-blue-400 to-indigo-500',
  'from-purple-400 to-pink-500',
  'from-green-400 to-teal-500',
  'from-orange-400 to-red-500',
  'from-pink-400 to-rose-500',
  'from-teal-400 to-cyan-500',
];

function Avatar({ initials, index = 0 }: { initials: string; index?: number }) {
  return (
    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const FILES: FileRow[] = [
  {
    id: 1, kind: 'folder', name: 'Lab deliverables', size: '8.6 GB',
    dateCreated: '2025-11-1 9:00:41 AM', createdBy: 'System', action: 'open',
  },
  {
    id: 2, kind: 'folder', name: 'Subjects', size: '9.8 GB',
    dateCreated: '2025-11-1 9:00:01 AM', createdBy: 'System', action: 'open',
  },
  {
    id: 3, kind: 'folder', name: 'Tasks', size: '1.4 GB',
    dateCreated: '2025-11-1 9:00:01 AM', createdBy: 'System', action: 'open',
  },
  {
    id: 4, kind: 'folder', name: 'Reports', size: '45 MB',
    dateCreated: '2025-12-3 10:00:54 AM', createdBy: 'John Smith (You)', createdByInitials: 'JS', isMe: true, action: 'open',
  },
  {
    id: 5, kind: 'file', name: 'prepaid_phone_dump_tmobile.ufdr', ext: 'UFDR', size: '1.1 GB',
    dateCreated: '2025-12-1 9:00:55 AM', createdBy: 'John Smith (You)', createdByInitials: 'JS', isMe: true,
    linkedTo: [{ label: 'Lionel Messi', icon: 'subject' }], hasComment: true, action: 'preview',
  },
  {
    id: 6, kind: 'file', name: 'GooglePixel3.zip', ext: 'ZIP', size: '850 MB',
    dateCreated: '2025-12-23 5:00:45 PM', createdBy: 'Emily Johnson', createdByInitials: 'EJ',
    linkedTo: [{ label: 'Evidence Rev...', icon: 'evidence', overflow: 6 }], hasComment: true, action: 'preview',
  },
  {
    id: 7, kind: 'file', name: 'OnePlusNord_victorexploit.pdf', ext: 'PDF', size: '2.3 GB',
    dateCreated: '2022-09-21 1:12:20 AM', createdBy: 'Michael Brown', createdByInitials: 'MB',
    linkedTo: [{ label: 'Device For...', icon: 'device', overflow: 100 }], hasComment: true, action: 'preview',
  },
  {
    id: 8, kind: 'file', name: 'Nokia3310_hacker_notes.csv', ext: 'CSV', size: '500 MB',
    dateCreated: '2022-09-21 1:01:00 AM', createdBy: 'Sarah Davis', createdByInitials: 'SD',
    linkedTo: [{ label: 'Lionel Messi', icon: 'subject' }], hasComment: true, action: 'preview',
  },
  {
    id: 9, kind: 'file', name: 'XiaomiMi10_data_breach.pptx', ext: 'PPTX', size: '1.5 GB',
    dateCreated: '2022-09-21 12:50:45 AM', createdBy: 'David Wilson', createdByInitials: 'DW',
    linkedTo: [{ label: 'Lionel Messi', icon: 'subject' }], hasComment: true, action: 'preview',
  },
  {
    id: 10, kind: 'file', name: 'SonyXperia5_vulnerability.docx', ext: 'DOCX', size: '750 MB',
    dateCreated: '2022-09-21 12:40:30 AM', createdBy: 'Sophia Garcia', createdByInitials: 'SG',
    linkedTo: [{ label: 'Lionel Messi', icon: 'subject' }], hasComment: true, action: 'preview',
  },
  {
    id: 11, kind: 'file', name: 'HuaweiP30_protocols.xml', ext: 'XML', size: '640 MB',
    dateCreated: '2022-09-21 1:34:50 AM', createdBy: 'Isabella Rodriguez', createdByInitials: 'IR',
    linkedTo: [{ label: 'Lionel Messi', icon: 'subject' }], hasComment: false,
    additionalInfo: 'csam', action: 'preview',
  },
];

const FILTERS = ['Date', 'Type', 'Created by', 'Linked to'];

// ─── Main component ───────────────────────────────────────────────────────────

export function CaseFilesPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = FILES.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every(f => selected.has(f.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(f => f.id)));
  };

  const toggleRow = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0f1929]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0 bg-white dark:bg-[#131f35]">
        <h1 className="text-base font-semibold text-[#12233A] dark:text-white">Case Files</h1>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-[#0064CC] text-white rounded-lg text-sm font-semibold hover:bg-[#015297] transition-colors">
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 dark:border-white/8 flex-shrink-0 flex-wrap bg-white dark:bg-[#131f35]">
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700/50 w-52 bg-white dark:bg-white/5"
          />
        </div>
        {FILTERS.map(f => (
          <button key={f} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors bg-white dark:bg-transparent">
            {f === 'Date' && (
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            )}
            {f}
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#0f1929] border-b border-gray-200 dark:border-white/10">
              <th className="w-10 px-3 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded border-gray-300 dark:border-white/20 text-blue-600" />
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">File Size</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                <span className="flex items-center gap-1">
                  Date Created
                  <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" viewBox="0 0 12 12" fill="currentColor"><path d="M6 9L2 4h8L6 9z"/></svg>
                </span>
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Created By</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Linked To</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Comment</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">Additional Info</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/8 bg-white dark:bg-[#131f35]">
            {filtered.map((row, i) => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                {/* Checkbox */}
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                    className="rounded border-gray-300 dark:border-white/20 text-blue-600"
                  />
                </td>

                {/* Name */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    {row.kind === 'folder'
                      ? <FolderIcon />
                      : <FileTypeBadge ext={row.ext!} />
                    }
                    <span className="text-sm text-gray-900 dark:text-white font-medium truncate max-w-[260px]">{row.name}</span>
                  </div>
                </td>

                {/* File size */}
                <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.size}</td>

                {/* Date created */}
                <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.dateCreated}</td>

                {/* Created by */}
                <td className="px-3 py-3">
                  {row.createdByInitials ? (
                    <div className="flex items-center gap-2">
                      <Avatar initials={row.createdByInitials} index={i} />
                      <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.createdBy}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">{row.createdBy}</span>
                  )}
                </td>

                {/* Linked to */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {row.linkedTo?.map((link, j) => (
                      <LinkedChip key={j} label={link.label} overflow={link.overflow} />
                    ))}
                  </div>
                </td>

                {/* Comment */}
                <td className="px-3 py-3">
                  {row.hasComment && (
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                  )}
                </td>

                {/* Additional info */}
                <td className="px-3 py-3">
                  {row.additionalInfo === 'csam' && (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      Suspected CSAM
                    </span>
                  )}
                </td>

                {/* Action */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button className="text-sm font-semibold text-[#0064CC] hover:text-[#015297] transition-colors capitalize">
                      {row.action === 'open' ? 'Open' : 'Preview'}
                    </button>
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
