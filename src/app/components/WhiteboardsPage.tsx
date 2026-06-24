import { Plus, Search, Grid3x3, List, MoreHorizontal, Clock } from 'lucide-react';
import { useState } from 'react';

interface Whiteboard {
  id: string;
  name: string;
  lastEdited: string;
  created: string;
  collaborators: Array<{
    initials: string;
    name: string;
    color: string;
  }>;
  thumbnailColor: string;
}

export function WhiteboardsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<'recent' | 'shared' | 'starred'>('recent');

  const whiteboards: Whiteboard[] = [
    {
      id: '1',
      name: 'Intelligence Analysis Dashboard WI...',
      lastEdited: 'Edited 3 days ago',
      created: 'Created 1 week ago',
      collaborators: [
        { initials: 'MB', name: 'Mark Brown', color: 'from-blue-400 to-blue-600' },
        { initials: 'SK', name: 'Sarah Kim', color: 'from-purple-400 to-purple-600' },
      ],
      thumbnailColor: 'bg-gray-900',
    },
    {
      id: '2',
      name: 'Case Management Dashboard',
      lastEdited: 'Edited 5 hours ago',
      created: 'Created 3 days ago',
      collaborators: [
        { initials: 'DL', name: 'David Lee', color: 'from-green-400 to-green-600' },
        { initials: 'JR', name: 'Jennifer Rodriguez', color: 'from-pink-400 to-pink-600' },
        { initials: 'AM', name: 'Alex Martinez', color: 'from-orange-400 to-orange-600' },
      ],
      thumbnailColor: 'bg-white border border-gray-200',
    },
    {
      id: '3',
      name: 'Starlight - All Task Force',
      lastEdited: 'Edited 1 hour ago',
      created: 'Created 2 days ago',
      collaborators: [
        { initials: 'MB', name: 'Mark Brown', color: 'from-blue-400 to-blue-600' },
      ],
      thumbnailColor: 'bg-gray-900',
    },
    {
      id: '4',
      name: 'Lightmat Portal',
      lastEdited: 'Edited 2 days ago',
      created: 'Created 1 week ago',
      collaborators: [
        { initials: 'SK', name: 'Sarah Kim', color: 'from-purple-400 to-purple-600' },
        { initials: 'DL', name: 'David Lee', color: 'from-green-400 to-green-600' },
      ],
      thumbnailColor: 'bg-gradient-to-br from-red-900 to-orange-800',
    },
    {
      id: '5',
      name: 'Quotes child',
      lastEdited: 'Edited 6 days ago',
      created: 'Created 2 weeks ago',
      collaborators: [
        { initials: 'JR', name: 'Jennifer Rodriguez', color: 'from-pink-400 to-pink-600' },
      ],
      thumbnailColor: 'bg-gray-900',
    },
    {
      id: '6',
      name: 'UI | Left Shift Project',
      lastEdited: 'Edited 3 days ago',
      created: 'Created 1 week ago',
      collaborators: [
        { initials: 'MB', name: 'Mark Brown', color: 'from-blue-400 to-blue-600' },
        { initials: 'AM', name: 'Alex Martinez', color: 'from-orange-400 to-orange-600' },
      ],
      thumbnailColor: 'bg-white border border-gray-200',
    },
    {
      id: '7',
      name: 'Quotes Label autosuctions',
      lastEdited: 'Edited 1 hour ago',
      created: 'Created 4 days ago',
      collaborators: [
        { initials: 'SK', name: 'Sarah Kim', color: 'from-purple-400 to-purple-600' },
        { initials: 'DL', name: 'David Lee', color: 'from-green-400 to-green-600' },
        { initials: 'JR', name: 'Jennifer Rodriguez', color: 'from-pink-400 to-pink-600' },
      ],
      thumbnailColor: 'bg-gray-900',
    },
    {
      id: '8',
      name: 'Integration with 3d party',
      lastEdited: 'Edited 1 hour ago',
      created: 'Created 5 days ago',
      collaborators: [
        { initials: 'MB', name: 'Mark Brown', color: 'from-blue-400 to-blue-600' },
      ],
      thumbnailColor: 'bg-gradient-to-br from-green-900 to-teal-800',
    },
    {
      id: '9',
      name: 'Subscription & Quota Usage',
      lastEdited: 'Edited 4 hours ago',
      created: 'Created 3 days ago',
      collaborators: [
        { initials: 'AM', name: 'Alex Martinez', color: 'from-orange-400 to-orange-600' },
      ],
      thumbnailColor: 'bg-gray-900',
    },
    {
      id: '10',
      name: 'New Lightbox UI/UX Revamp',
      lastEdited: 'Edited 2 days ago',
      created: 'Created 1 week ago',
      collaborators: [
        { initials: 'SK', name: 'Sarah Kim', color: 'from-purple-400 to-purple-600' },
        { initials: 'JR', name: 'Jennifer Rodriguez', color: 'from-pink-400 to-pink-600' },
      ],
      thumbnailColor: 'bg-gradient-to-br from-green-900 to-emerald-800',
    },
    {
      id: '11',
      name: 'Case Files - GA',
      lastEdited: 'Edited 6 days ago',
      created: 'Created 2 weeks ago',
      collaborators: [
        { initials: 'DL', name: 'David Lee', color: 'from-green-400 to-green-600' },
      ],
      thumbnailColor: 'bg-gradient-to-br from-green-900 to-teal-800',
    },
    {
      id: '12',
      name: 'Media View',
      lastEdited: 'Edited 2 days ago',
      created: 'Created 1 week ago',
      collaborators: [
        { initials: 'MB', name: 'Mark Brown', color: 'from-blue-400 to-blue-600' },
      ],
      thumbnailColor: 'bg-gradient-to-br from-green-900 to-emerald-800',
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0f1929]">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#131f35]">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-[#12233A] dark:text-white">Whiteboard</h1>
          <div className="flex items-center gap-1 border border-gray-200 dark:border-white/10 rounded-lg p-0.5 ml-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
              <Grid3x3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-gray-100 dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
              <List className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-[#0064CC] text-white rounded-lg text-sm font-semibold hover:bg-[#015297] transition-colors">
          <Plus className="w-4 h-4" />
          New Whiteboard
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 border-b border-gray-100 dark:border-white/8 bg-white dark:bg-[#131f35] flex-wrap">
        <div className="flex items-center gap-1">
          {(['recent', 'shared', 'starred'] as const).map((f, i) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeFilter === f ? 'bg-gray-900 dark:bg-white/15 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              {['Recently viewed', 'Shared files', 'Starred projects'][i]}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search whiteboards..."
            className="pl-9 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:bg-white/5 dark:text-white dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700/50 w-48"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Whiteboards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {whiteboards.map((whiteboard) => (
            <div
              key={whiteboard.id}
              className="bg-white dark:bg-[#131f35] rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 hover:shadow-lg transition-all cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className={`w-full h-48 ${whiteboard.thumbnailColor} flex items-center justify-center relative`}>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 bg-white dark:bg-[#131f35] rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-white/10">
                    <MoreHorizontal className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 flex-1">
                    {whiteboard.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {whiteboard.lastEdited}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-2">
                    {whiteboard.collaborators.map((collab, index) => (
                      <div
                        key={index}
                        className={`w-6 h-6 rounded-full bg-gradient-to-br ${collab.color} flex items-center justify-center text-white text-xs font-semibold border-2 border-white dark:border-[#131f35]`}
                        title={collab.name}
                      >
                        {collab.initials}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* New Whiteboard Card */}
          <button className="bg-white dark:bg-[#131f35] rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-white/15 hover:border-blue-500 dark:hover:border-blue-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all h-full min-h-[320px] flex flex-col items-center justify-center gap-3 group">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 rounded-full flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              New Whiteboard
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

