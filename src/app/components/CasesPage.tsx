import { Search, Filter, ChevronRight, Clock, User, Plus } from 'lucide-react';
import { useState } from 'react';
import { CaseDetailPage } from './CaseDetailPage';

interface Case {
  id: string;
  title: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'High' | 'Medium' | 'Low';
  caseOfficer: {
    name: string;
    initials: string;
  };
  createdDate: string;
  updatesCount: number;
}

interface CasesPageProps {
  selectedCase?: string | null;
  onCaseSelect?: (caseId: string | null) => void;
  onOpenAIWorkspace?: () => void;
}

export function CasesPage({ selectedCase, onCaseSelect, onOpenAIWorkspace }: CasesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalSelectedCase, setInternalSelectedCase] = useState<string | null>(null);

  const currentCase = selectedCase !== undefined ? selectedCase : internalSelectedCase;
  const handleCaseSelect = onCaseSelect || setInternalSelectedCase;

  if (currentCase) {
    return (
      <CaseDetailPage
        caseId={currentCase}
        onBack={() => handleCaseSelect(null)}
        onOpenAIWorkspace={onOpenAIWorkspace}
      />
    );
  }

  const cases: Case[] = [
    {
      id: '05-CV-00234',
      title: 'Downtown Robbery Investigation',
      status: 'Open',
      priority: 'High',
      caseOfficer: {
        name: 'Mark Brown',
        initials: 'MB',
      },
      createdDate: '2026-04-15',
      updatesCount: 3,
    },
    {
      id: '05-CV-00189',
      title: 'Vehicle Theft Case',
      status: 'In Progress',
      priority: 'Medium',
      caseOfficer: {
        name: 'Sarah Kim',
        initials: 'SK',
      },
      createdDate: '2026-04-10',
      updatesCount: 5,
    },
    {
      id: '05-CV-00156',
      title: 'Fraud Investigation - Tech Company',
      status: 'Open',
      priority: 'High',
      caseOfficer: {
        name: 'David Lee',
        initials: 'DL',
      },
      createdDate: '2026-04-20',
      updatesCount: 2,
    },
    {
      id: '05-CV-00178',
      title: 'Missing Person Report',
      status: 'In Progress',
      priority: 'High',
      caseOfficer: {
        name: 'Jennifer Roberts',
        initials: 'JR',
      },
      createdDate: '2026-04-18',
      updatesCount: 7,
    },
    {
      id: '05-CV-00201',
      title: 'Assault Case - Night Club',
      status: 'Open',
      priority: 'Medium',
      caseOfficer: {
        name: 'Alex Martinez',
        initials: 'AM',
      },
      createdDate: '2026-04-22',
      updatesCount: 1,
    },
  ];

  const openCasesCount = cases.filter(c => c.status === 'Open').length;
  const casesWithUpdates = 3;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-orange-100 text-orange-700';
      case 'Low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-700';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'Closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Cases</h1>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              <Plus className="w-5 h-5" />
              Create Case
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{openCasesCount}</div>
              <div className="text-gray-600 dark:text-gray-400">Open Cases</div>
            </div>
            <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{casesWithUpdates}</div>
              <div className="text-gray-600 dark:text-gray-400">Cases with New Updates</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131f35] rounded-lg shadow-sm border border-gray-200 dark:border-white/10">
            <div className="p-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-lg transition-colors dark:text-gray-300">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filter</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-white/8">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  onClick={() => handleCaseSelect(caseItem.id)}
                  className="flex items-center gap-8 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <div className="flex-shrink-0 w-48">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:underline">{caseItem.id}</div>
                    <h3 className="text-sm text-gray-600 dark:text-gray-400">{caseItem.title}</h3>
                  </div>

                  <div className="flex-shrink-0 w-32">
                    <span className={`px-3 py-1.5 rounded text-xs font-semibold ${getStatusColor(caseItem.status)}`}>
                      {caseItem.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-sm text-gray-900 dark:text-white font-semibold">{caseItem.updatesCount} updates</span>
                  </div>

                  <div className="flex-1"></div>

                  <div className="flex items-center gap-2 flex-shrink-0 min-w-[180px]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                      {caseItem.caseOfficer.initials}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{caseItem.caseOfficer.name}</span>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[150px]">
                    <div className="text-sm text-gray-900 dark:text-white">{caseItem.createdDate} | 07:02</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Created 2 hours ago</div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
