import { User, Car, MapPin, FileText, Clock } from 'lucide-react';

interface Activity {
  id: number;
  type: 'person' | 'vehicle' | 'location' | 'evidence';
  subject: string;
  description: string;
  sourceCaseId: string;
  targetCaseId: string;
  timeAgo: string;
}

export function MutualActivitiesWidget() {
  const activities: Activity[] = [
    {
      id: 1,
      type: 'person',
      subject: 'John Miller',
      description: 'added to',
      sourceCaseId: '05-CV-00123',
      targetCaseId: '05-CV-00234',
      timeAgo: '10 min ago',
    },
    {
      id: 2,
      type: 'vehicle',
      subject: 'Vehicle',
      description: 'from case spotted in',
      sourceCaseId: '05-CV-00456',
      targetCaseId: '05-CV-00678',
      timeAgo: '25 min ago',
    },
    {
      id: 3,
      type: 'location',
      subject: 'Same location',
      description: 'linked to',
      sourceCaseId: '05-CV-00189',
      targetCaseId: '05-CV-00234',
      timeAgo: '1 hour ago',
    },
    {
      id: 4,
      type: 'evidence',
      subject: 'Similar evidence',
      description: 'found in',
      sourceCaseId: '05-CV-00145',
      targetCaseId: '05-CV-00201',
      timeAgo: '2 hours ago',
    },
    {
      id: 5,
      type: 'person',
      subject: 'Sarah Chen',
      description: 'mentioned in',
      sourceCaseId: '05-CV-00156',
      targetCaseId: '05-CV-00178',
      timeAgo: '3 hours ago',
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'person':
        return <User className="w-5 h-5 text-blue-600" />;
      case 'vehicle':
        return <Car className="w-5 h-5 text-purple-600" />;
      case 'location':
        return <MapPin className="w-5 h-5 text-green-600" />;
      case 'evidence':
        return <FileText className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-gray-900 dark:text-white font-semibold">Case Connections</h3>
      </div>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex-shrink-0">{getIcon(activity.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white">
                {activity.subject} <span className="text-gray-500 dark:text-gray-400">(Subject)</span> {activity.description}{' '}
                <span className="text-blue-600 font-medium">{activity.targetCaseId}</span>
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mt-1">
                <span>From {activity.sourceCaseId}</span>
                <span>•</span>
                <span>{activity.timeAgo}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
