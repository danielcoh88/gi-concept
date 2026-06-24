import { useState } from 'react';
import { MapPin, User, Camera, Image as ImageIcon, AlertCircle, ChevronRight } from 'lucide-react';

interface CaseLeadMatch {
  id: number;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
  matchCount: number;
  title: string;
  category: 'locations' | 'events' | 'identifiers' | 'faces' | 'images';
  isNew: boolean;
  imageUrl?: string;
}

const caseLeadMatches: CaseLeadMatch[] = [
  { id: 1, type: 'LOCATION',         icon: MapPin,      iconBgColor: 'bg-blue-100',   iconColor: 'text-blue-600',   matchCount: 3, title: '1234 Oak Street, Los Angeles, CA', category: 'locations',   isNew: true  },
  { id: 2, type: 'LOCATION',         icon: MapPin,      iconBgColor: 'bg-blue-100',   iconColor: 'text-blue-600',   matchCount: 2, title: 'Central Park West, New York, NY',  category: 'locations',   isNew: true  },
  { id: 3, type: 'FACE RECOGNITION', icon: Camera,      iconBgColor: 'bg-pink-100',   iconColor: 'text-pink-600',   matchCount: 1, title: 'John Doe',                         category: 'faces',       isNew: true,  imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100' },
  { id: 4, type: 'LOCATION',         icon: MapPin,      iconBgColor: 'bg-blue-100',   iconColor: 'text-blue-600',   matchCount: 2, title: 'Downtown Mall, Seattle, WA',       category: 'locations',   isNew: false },
  { id: 5, type: 'FACE RECOGNITION', icon: Camera,      iconBgColor: 'bg-pink-100',   iconColor: 'text-pink-600',   matchCount: 2, title: 'Jane Smith',                       category: 'faces',       isNew: false, imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100' },
  { id: 6, type: 'EVENT',            icon: AlertCircle, iconBgColor: 'bg-orange-100', iconColor: 'text-orange-600', matchCount: 3, title: 'Crime scene timestamp',             category: 'events',      isNew: false },
  { id: 7, type: 'IDENTIFIER',       icon: User,        iconBgColor: 'bg-purple-100', iconColor: 'text-purple-600', matchCount: 1, title: 'SSN: ***-**-5678',                 category: 'identifiers', isNew: false },
  { id: 8, type: 'IMAGE',            icon: ImageIcon,   iconBgColor: 'bg-green-100',  iconColor: 'text-green-600',  matchCount: 4, title: 'Vehicle Image Match',              category: 'images',      isNew: false },
  { id: 9, type: 'IDENTIFIER',       icon: User,        iconBgColor: 'bg-purple-100', iconColor: 'text-purple-600', matchCount: 1, title: 'Phone: +1 (555) 0147',             category: 'identifiers', isNew: true  },
];

type TabId = CaseLeadMatch['category'] | 'new';

const leadMatchesTabs: { id: TabId; label: string }[] = [
  { id: 'new',         label: 'New'         },
  { id: 'locations',   label: 'Locations'   },
  { id: 'events',      label: 'Events'      },
  { id: 'identifiers', label: 'Identifiers' },
  { id: 'faces',       label: 'Faces'       },
  { id: 'images',      label: 'Images'      },
];

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export function BriefCaseLeadMatchesWidget({ onNavigateTab }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('new');
  const [expanded, setExpanded] = useState(false);

  const newCount = caseLeadMatches.filter(m => m.isNew).length;

  const allMatches = caseLeadMatches.filter(m =>
    activeTab === 'new' ? m.isNew : m.category === activeTab
  );
  const visibleMatches = expanded ? allMatches : allMatches.slice(0, 3);
  const hidden = allMatches.length - 3;

  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          <h2 className="text-sm font-bold text-[#12233A] dark:text-white">
            {caseLeadMatches.length} Case Lead Matches
          </h2>
        </div>
        <button
          onClick={() => onNavigateTab?.('subjects')}
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs — matching Submission Updates style */}
      <div className="flex border-b border-gray-200 dark:border-white/10 mb-3 overflow-x-auto">
        {leadMatchesTabs.map(tab => {
          const count = tab.id === 'new'
            ? newCount
            : caseLeadMatches.filter(m => m.category === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setExpanded(false); }}
              className={`pb-2.5 px-3 text-xs border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-500 font-semibold'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  activeTab === tab.id
                    ? 'bg-blue-500/15 text-blue-500'
                    : 'bg-gray-100 dark:bg-white/8 text-gray-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {visibleMatches.map(match => (
          <div
            key={match.id}
            onClick={() => onNavigateTab?.(match.category === 'locations' ? 'locations' : match.category === 'events' ? 'events' : 'subjects')}
            className="p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-start gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${match.imageUrl ? '' : match.iconBgColor}`}>
                {match.imageUrl
                  ? <img src={match.imageUrl} alt={match.title} className="w-full h-full object-cover" />
                  : <match.icon className={`w-4 h-4 ${match.iconColor}`} />
                }
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                  {match.type}
                </p>
                <p className="text-xs font-semibold text-[#12233A] dark:text-white leading-snug truncate">
                  {match.title}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-semibold">
                {match.matchCount} {match.matchCount === 1 ? 'match' : 'matches'}
              </span>
              {match.isNew && (
                <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 rounded text-[10px] font-semibold">
                  New
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {!expanded && hidden > 0 && (
        <button onClick={() => setExpanded(true)} className="w-full mt-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-dashed border-blue-200 dark:border-blue-400/20 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
          Show {hidden} more
        </button>
      )}
      {expanded && hidden > 0 && (
        <button onClick={() => setExpanded(false)} className="w-full mt-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          Show less
        </button>
      )}
    </div>
  );
}
