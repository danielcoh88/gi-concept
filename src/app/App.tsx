import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { UrgentTasksWidget } from './components/UrgentTasksWidget';
import { MutualActivitiesWidget } from './components/MutualActivitiesWidget';
import { CaseLeadMatchesWidget } from './components/CaseLeadMatchesWidget';
import { HeatMapWidget } from './components/HeatMapWidget';
import { LabResultsWidget } from './components/LabResultsWidget';
import { CasesPage } from './components/CasesPage';
import { MyFilesPage } from './components/MyFilesPage';
import { CollaborateDashboard, CollaborateWorkspace } from './components/collaborate';
import { ActivityLogPanel, INITIAL_UNREAD_COUNT } from './components/ActivityLogPanel';
import { AIWorkspacePage } from './components/AIWorkspacePage';
import { FolderOpen, AlertCircle, TestTube, Link, Plus, Send, FileUp } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'cases' | 'whiteboard' | 'myfiles' | 'admin' | 'collaborate' | 'ai-workspace'>('cases');
  const [selectedCase, setSelectedCase] = useState<string | null>('05-CV-00234');
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [activityUnreadCount, setActivityUnreadCount] = useState(INITIAL_UNREAD_COUNT);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleActivityEntryNavigate = (caseId: string, _tab?: string) => {
    setSelectedCase(caseId);
    setCurrentPage('cases');
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      <TopBar
        onBellClick={() => setActivityLogOpen(true)}
        unreadCount={activityUnreadCount}
        isDark={isDark}
        onToggleDark={() => setIsDark(d => !d)}
      />
      <ActivityLogPanel
        open={activityLogOpen}
        onClose={() => setActivityLogOpen(false)}
        onMarkAllRead={() => setActivityUnreadCount(0)}
        currentCaseId={selectedCase}
        onEntryNavigate={handleActivityEntryNavigate}
      />
      <div className="flex flex-1 overflow-hidden">
        {!(selectedCase && currentPage === 'cases') && <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />}
        {currentPage === 'dashboard' && (
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-[1800px] mx-auto">
              {/* Action Buttons */}
              <div className="flex gap-3 mb-6 justify-end">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-semibold">
                  <Plus className="w-4 h-4" />
                  Create Case
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-semibold">
                  <Send className="w-4 h-4" />
                  Send Submission
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-semibold">
                  <FileUp className="w-4 h-4" />
                  Add Files
                </button>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                  <div className="mb-3">
                    <FolderOpen className="w-12 h-12 text-blue-600" />
                  </div>
                  <div className="text-5xl font-bold text-gray-900 mb-3">47</div>
                  <div className="text-sm text-gray-600">Open Cases Assigned to You</div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                  <div className="mb-3">
                    <AlertCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <div className="text-5xl font-bold text-gray-900 mb-3">4</div>
                  <div className="text-sm text-gray-600">Urgent Tasks (Overdue 3+ Days)</div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                  <div className="mb-3">
                    <TestTube className="w-12 h-12 text-purple-600" />
                  </div>
                  <div className="text-5xl font-bold text-gray-900 mb-3">3</div>
                  <div className="text-sm text-gray-600">New Lab Submission Results</div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                  <div className="mb-3">
                    <Link className="w-12 h-12 text-green-600" />
                  </div>
                  <div className="text-5xl font-bold text-gray-900 mb-3">12</div>
                  <div className="text-sm text-gray-600">New Case Lead Matches</div>
                </div>
              </div>

              {/* Main Content - Widgets */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <UrgentTasksWidget />
                  <LabResultsWidget />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MutualActivitiesWidget />
                  <CaseLeadMatchesWidget />
                </div>
                <HeatMapWidget />
              </div>
            </div>
          </main>
        )}
        {currentPage === 'ai-workspace' && <AIWorkspacePage />}
        {currentPage === 'cases' && (
          <CasesPage
            selectedCase={selectedCase}
            onCaseSelect={setSelectedCase}
            onOpenAIWorkspace={() => setCurrentPage('ai-workspace')}
          />
        )}
        {currentPage === 'whiteboard' && (
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Whiteboard</h1>
              <p className="text-gray-600 mt-2">Coming soon...</p>
            </div>
          </main>
        )}
        {currentPage === 'myfiles' && <MyFilesPage />}
        {currentPage === 'collaborate' && !selectedCase && (
          <CollaborateDashboard onOpenCase={(id) => { setSelectedCase(id); }} />
        )}
        {currentPage === 'collaborate' && selectedCase && (
          <CollaborateWorkspace
            caseId={selectedCase}
            caseName="Downtown Robbery Investigation"
            caseStatus="Active Investigation"
          />
        )}
        {currentPage === 'admin' && (
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Admin Stats</h1>
              <p className="text-gray-600 mt-2">Coming soon...</p>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}