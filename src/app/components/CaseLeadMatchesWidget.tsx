import { MapPin, User, Camera, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface LeadMatch {
  id: number;
  type: 'ADDRESS' | 'IDENTITY' | 'FACE RECOGNITION' | 'IMAGE';
  matchCount: number;
  title: string;
  caseId: string;
  icon: 'location' | 'person' | 'face' | 'vehicle';
  imageUrl?: string;
}

export function CaseLeadMatchesWidget() {
  const [selectedCase, setSelectedCase] = useState<string>('all');
  const leadMatches: LeadMatch[] = [
    {
      id: 1,
      type: 'ADDRESS',
      matchCount: 3,
      title: '1234 Oak Street, Los Angeles, CA',
      caseId: '05-CV-00234',
      icon: 'location',
    },
    {
      id: 2,
      type: 'IDENTITY',
      matchCount: 2,
      title: 'John Michael Smith',
      caseId: '05-CV-00156',
      icon: 'person',
    },
    {
      id: 3,
      type: 'FACE RECOGNITION',
      matchCount: 1,
      title: 'Face Recognition Match',
      caseId: '05-CV-00189',
      icon: 'face',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100',
    },
    {
      id: 4,
      type: 'IMAGE',
      matchCount: 4,
      title: 'Vehicle Image Match',
      caseId: '05-CV-00234',
      icon: 'vehicle',
      imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100',
    },
  ];

  const uniqueCases = Array.from(new Set(leadMatches.map(m => m.caseId)));
  const filteredMatches = selectedCase === 'all'
    ? leadMatches
    : leadMatches.filter(m => m.caseId === selectedCase);

  const getIconBackground = (icon: string) => {
    switch (icon) {
      case 'location':
        return 'bg-blue-100';
      case 'person':
        return 'bg-purple-100';
      case 'face':
        return 'bg-pink-100';
      case 'vehicle':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'location':
        return <MapPin className="w-6 h-6 text-blue-600" />;
      case 'person':
        return <User className="w-6 h-6 text-purple-600" />;
      case 'face':
        return <Camera className="w-6 h-6 text-pink-600" />;
      case 'vehicle':
        return <ImageIcon className="w-6 h-6 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 dark:text-white font-semibold">New Case Lead Matches</h3>
        <select
          value={selectedCase}
          onChange={(e) => setSelectedCase(e.target.value)}
          className="text-sm border border-gray-300 dark:border-white/10 rounded px-2 py-1 text-gray-700 dark:text-gray-300 bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:[color-scheme:dark]"
        >
          <option value="all">All Cases</option>
          {uniqueCases.map((caseId) => (
            <option key={caseId} value={caseId}>
              {caseId}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-3">
        {filteredMatches.map((match) => (
          <div
            key={match.id}
            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
          >
            {/* Icon or Image */}
            <div className={`flex-shrink-0 w-12 h-12 ${getIconBackground(match.icon)} rounded-lg flex items-center justify-center overflow-hidden`}>
              {match.imageUrl ? (
                <img src={match.imageUrl} alt={match.title} className="w-full h-full object-cover" />
              ) : (
                getIcon(match.icon)
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-1">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{match.type}</span>
              </div>
              <div className="text-sm text-gray-900 dark:text-white font-medium mb-1">{match.title}</div>
              <div className="text-xs text-blue-600">Case {match.caseId}</div>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
