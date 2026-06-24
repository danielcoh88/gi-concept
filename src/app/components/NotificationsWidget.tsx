import { useState } from 'react';
import { MessageSquare, FileCheck, TestTube, ChevronRight } from 'lucide-react';

interface Notification {
  id: number;
  type: 'comment' | 'match' | 'results';
  activity: 'submission sent' | 'submission received' | 'file added' | 'tagged';
  message: string;
  caseId: string;
  time: string;
  relevant: boolean;
  isNew?: boolean;
}

export function NotificationsWidget() {
  const [activeTab, setActiveTab] = useState<'relevant' | 'all'>('relevant');
  const [visibleCount, setVisibleCount] = useState(10);
  const [activityFilter, setActivityFilter] = useState<'all' | 'submission sent' | 'submission received' | 'file added' | 'tagged'>('all');

  const notifications: Notification[] = [
    {
      id: 1,
      type: 'comment',
      activity: 'tagged',
      message: 'Mark tagged you in a comment',
      caseId: '05-CV-00234',
      time: '15 minutes ago',
      relevant: true,
      isNew: true,
    },
    {
      id: 2,
      type: 'match',
      activity: 'submission received',
      message: 'New case lead match',
      caseId: '05-CV-00123',
      time: '1 hour ago',
      relevant: true,
      isNew: true,
    },
    {
      id: 3,
      type: 'results',
      activity: 'submission received',
      message: 'Lab results came back',
      caseId: '05-CV-00123',
      time: '2 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 4,
      type: 'comment',
      activity: 'file added',
      message: 'New comment added',
      caseId: '05-CV-00456',
      time: '3 hours ago',
      relevant: false,
      isNew: false,
    },
    {
      id: 5,
      type: 'results',
      activity: 'submission received',
      message: 'DNA analysis completed',
      caseId: '05-CV-00189',
      time: '4 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 6,
      type: 'match',
      activity: 'submission received',
      message: 'Suspect vehicle identified',
      caseId: '05-CV-00234',
      time: '5 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 7,
      type: 'comment',
      activity: 'file added',
      message: 'Sarah updated case notes',
      caseId: '05-CV-00178',
      time: '6 hours ago',
      relevant: false,
      isNew: false,
    },
    {
      id: 8,
      type: 'results',
      activity: 'submission received',
      message: 'Fingerprint match found',
      caseId: '05-CV-00156',
      time: '7 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 9,
      type: 'match',
      activity: 'submission received',
      message: 'Phone records analyzed',
      caseId: '05-CV-00201',
      time: '8 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 10,
      type: 'comment',
      activity: 'tagged',
      message: 'David assigned new task',
      caseId: '05-CV-00234',
      time: '9 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 11,
      type: 'results',
      activity: 'submission received',
      message: 'Ballistics report ready',
      caseId: '05-CV-00145',
      time: '10 hours ago',
      relevant: false,
      isNew: false,
    },
    {
      id: 12,
      type: 'match',
      activity: 'submission received',
      message: 'Witness statement verified',
      caseId: '05-CV-00123',
      time: '11 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 13,
      type: 'comment',
      activity: 'tagged',
      message: 'Alex requested document review',
      caseId: '05-CV-00189',
      time: '12 hours ago',
      relevant: false,
      isNew: false,
    },
    {
      id: 14,
      type: 'results',
      activity: 'submission received',
      message: 'Surveillance footage processed',
      caseId: '05-CV-00234',
      time: '13 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 15,
      type: 'match',
      activity: 'submission received',
      message: 'Credit card transaction traced',
      caseId: '05-CV-00156',
      time: '14 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 16,
      type: 'comment',
      activity: 'file added',
      message: 'Jennifer added new evidence photo',
      caseId: '05-CV-00178',
      time: '15 hours ago',
      relevant: false,
      isNew: false,
    },
    {
      id: 17,
      type: 'results',
      activity: 'submission received',
      message: 'Autopsy report finalized',
      caseId: '05-CV-00201',
      time: '16 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 18,
      type: 'match',
      activity: 'submission received',
      message: 'Social media activity analyzed',
      caseId: '05-CV-00234',
      time: '17 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 19,
      type: 'comment',
      activity: 'tagged',
      message: 'Tom requested backup on investigation',
      caseId: '05-CV-00145',
      time: '18 hours ago',
      relevant: false,
      isNew: false,
    },
    {
      id: 20,
      type: 'results',
      activity: 'submission received',
      message: 'Handwriting analysis completed',
      caseId: '05-CV-00189',
      time: '19 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 21,
      type: 'match',
      activity: 'submission received',
      message: 'License plate reader hit',
      caseId: '05-CV-00123',
      time: '20 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 22,
      type: 'comment',
      activity: 'file added',
      message: 'Maria shared case timeline',
      caseId: '05-CV-00156',
      time: '21 hours ago',
      relevant: false,
      isNew: false,
    },
    {
      id: 23,
      type: 'results',
      activity: 'submission received',
      message: 'Blood spatter analysis ready',
      caseId: '05-CV-00234',
      time: '22 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 24,
      type: 'match',
      activity: 'submission received',
      message: 'Cell tower data triangulated',
      caseId: '05-CV-00178',
      time: '23 hours ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 25,
      type: 'comment',
      activity: 'file added',
      message: 'Robert updated witness list',
      caseId: '05-CV-00201',
      time: '1 day ago',
      relevant: false,
      isNew: false,
    },
    {
      id: 26,
      type: 'results',
      activity: 'submission sent',
      message: 'Toxicology screen completed',
      caseId: '05-CV-00145',
      time: '1 day ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 27,
      type: 'match',
      activity: 'submission received',
      message: 'GPS data correlation found',
      caseId: '05-CV-00234',
      time: '1 day ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 28,
      type: 'comment',
      activity: 'tagged',
      message: 'Lisa flagged inconsistency in statement',
      caseId: '05-CV-00189',
      time: '1 day ago',
      relevant: false,
      isNew: false,
    },
    {
      id: 29,
      type: 'results',
      activity: 'submission received',
      message: 'Fiber analysis report available',
      caseId: '05-CV-00123',
      time: '1 day ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 30,
      type: 'match',
      activity: 'submission sent',
      message: 'Bank records cross-referenced',
      caseId: '05-CV-00156',
      time: '2 days ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 31,
      type: 'comment',
      activity: 'file added',
      message: 'Chris updated case priority',
      caseId: '05-CV-00178',
      time: '2 days ago',
      relevant: false,
      isNew: false,
    },
    {
      id: 32,
      type: 'results',
      activity: 'submission received',
      message: 'Dental records matched',
      caseId: '05-CV-00234',
      time: '2 days ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 33,
      type: 'match',
      activity: 'submission sent',
      message: 'Fingerprint database match',
      caseId: '05-CV-00201',
      time: '2 days ago',
      relevant: true,
      isNew: false,
    },
    {
      id: 34,
      type: 'comment',
      activity: 'tagged',
      message: 'Emily requested case review meeting',
      caseId: '05-CV-00145',
      time: '2 days ago',
      relevant: false,
      isNew: false,
    },
    {
      id: 35,
      type: 'results',
      activity: 'submission sent',
      message: 'Shoe print analysis finalized',
      caseId: '05-CV-00189',
      time: '3 days ago',
      relevant: true,
      isNew: false,
    },
  ];

  let filteredNotifications =
    activeTab === 'relevant'
      ? notifications.filter((n) => n.relevant)
      : notifications;

  if (activityFilter !== 'all') {
    filteredNotifications = filteredNotifications.filter((n) => n.activity === activityFilter);
  }

  const visibleNotifications = filteredNotifications.slice(0, visibleCount);
  const hasMore = visibleCount < filteredNotifications.length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'match':
        return <FileCheck className="w-5 h-5 text-green-600" />;
      case 'results':
        return <TestTube className="w-5 h-5 text-purple-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10">
      <h3 className="text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        Update Feed
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">2 new</span>
      </h3>
      <div className="mb-4">
        <select
          value={activityFilter}
          onChange={(e) => setActivityFilter(e.target.value as typeof activityFilter)}
          className="w-full text-sm border border-gray-300 dark:border-white/10 rounded px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:[color-scheme:dark]"
        >
          <option value="all">All Activities</option>
          <option value="submission sent">Submission Sent</option>
          <option value="submission received">Submission Received</option>
          <option value="file added">File Added</option>
          <option value="tagged">Tagged</option>
        </select>
      </div>
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('relevant')}
          className={`pb-2 px-3 border-b-2 transition-colors ${
            activeTab === 'relevant'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Relevant to You
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-3 border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          All
        </button>
      </div>
      <div className="space-y-3">
        {visibleNotifications.map((notification) => (
          <a
            key={notification.id}
            href="#"
            className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group relative"
          >
            {notification.isNew && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-purple-600 rounded-full"></div>
            )}
            <div className="flex-shrink-0 mt-1 ml-4">{getIcon(notification.type)}</div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-white mb-1">{notification.message}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="text-blue-600">
                  {notification.caseId}
                </span>
                <span>•</span>
                <span>{notification.time}</span>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center">
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </a>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setVisibleCount(visibleCount + 10)}
          className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
        >
          View More
        </button>
      )}
    </div>
  );
}
