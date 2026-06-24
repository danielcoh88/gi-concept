import { AlertCircle, AlertTriangle, ChevronRight } from 'lucide-react';

interface Task {
  id: number;
  name: string;
  dueDate: string;
  dueDateRaw: Date;
  caseId: string;
  assignedTo: string[];
  status: 'overdue' | 'urgent' | 'upcoming';
  daysUntilDue: number;
}

export function UrgentTasksWidget() {
  const now = new Date('2026-04-30');

  const avatarColors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-green-400 to-green-600',
    'from-orange-400 to-orange-600',
    'from-teal-400 to-teal-600',
  ];

  const tasks: Task[] = [
    {
      id: 1,
      name: 'Lab Sample Testing',
      dueDate: 'Apr 30',
      dueDateRaw: new Date('2026-04-30'),
      caseId: '05-CV-00234',
      assignedTo: ['MB', 'SK'],
      status: 'urgent',
      daysUntilDue: 0,
    },
    {
      id: 2,
      name: 'Witness Interview',
      dueDate: 'May 1',
      dueDateRaw: new Date('2026-05-01'),
      caseId: '05-CV-00156',
      assignedTo: ['DL', 'JR', 'AM'],
      status: 'upcoming',
      daysUntilDue: 1,
    },
    {
      id: 3,
      name: 'Complete Investigation Report',
      dueDate: 'Apr 29',
      dueDateRaw: new Date('2026-04-29'),
      caseId: '05-CV-00189',
      assignedTo: ['TH'],
      status: 'overdue',
      daysUntilDue: -1,
    },
  ].sort((a, b) => a.dueDateRaw.getTime() - b.dueDateRaw.getTime());

  const renderStatusIndicator = (status: string, daysUntilDue: number) => {
    if (status === 'overdue') {
      return (
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">!</span>
          </div>
        </div>
      );
    }

    const totalDays = 7;
    const percentage = Math.max(0, Math.min(100, ((totalDays - daysUntilDue) / totalDays) * 100));
    const degrees = (percentage / 100) * 360;

    return (
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="4"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke={daysUntilDue <= 1 ? '#f97316' : '#6b7280'}
            strokeWidth="4"
            strokeDasharray={`${(degrees / 360) * (2 * Math.PI * 14)} ${2 * Math.PI * 14}`}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#131f35] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <h3 className="text-gray-900 dark:text-white">Urgent Tasks</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Task</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Due Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Assigned</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Case</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b border-gray-100 dark:border-white/8 hover:bg-gray-50 dark:hover:bg-white/5 group cursor-pointer">
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{task.name}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {renderStatusIndicator(task.status, task.daysUntilDue)}
                    <span className="text-sm text-gray-900 dark:text-white">{task.dueDate}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center -space-x-2">
                    {task.assignedTo.map((initials, index) => (
                      <div
                        key={index}
                        className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[index % avatarColors.length]} flex items-center justify-center text-white text-xs font-semibold border-2 border-white dark:border-[#131f35]`}
                        title={initials}
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <a href="#" className="text-sm text-blue-600 hover:underline">
                      {task.caseId}
                    </a>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
