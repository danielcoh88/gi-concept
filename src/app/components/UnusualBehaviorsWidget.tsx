import {
  TrendingUp, MessageCircle, PhoneOff, Dumbbell,
  Clock, ListPlus, User, CalendarDays, MapPin, ChevronRight,
} from 'lucide-react';

interface UnusualBehavior {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  time: string;
  severity: 'high' | 'medium';
  actionType: 'create-task' | 'create-event' | 'add-subject' | 'verify-location';
  actionLabel: string;
}

const unusualBehaviors: UnusualBehavior[] = [
  {
    id: 1,
    icon: MessageCircle,
    title: 'Spike in WhatsApp group activity',
    description: '47 messages sent in 5 minutes before incident',
    time: '23:45 - 23:50',
    severity: 'high',
    actionType: 'create-task',
    actionLabel: 'Create Task',
  },
  {
    id: 2,
    icon: PhoneOff,
    title: 'Phone powered off entire night',
    description: 'Device offline from 22:00 to 08:30 — unusual pattern',
    time: 'Jul 20, 22:00 – Jul 21, 08:30',
    severity: 'high',
    actionType: 'create-event',
    actionLabel: 'Add Event',
  },
  {
    id: 3,
    icon: Dumbbell,
    title: 'Missed regular gym visit',
    description: 'No check-in at usual Monday 18:00 gym session',
    time: 'Jul 21, 18:00',
    severity: 'medium',
    actionType: 'create-task',
    actionLabel: 'Create Task',
  },
];

function getActionIcon(actionType: string) {
  if (actionType === 'create-event') return CalendarDays;
  if (actionType === 'add-subject') return User;
  if (actionType === 'verify-location') return MapPin;
  return ListPlus;
}

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export function UnusualBehaviorsWidget({ onNavigateTab: _onNavigateTab }: Props) {
  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-bold text-[#12233A] dark:text-white">
            {unusualBehaviors.length} Unusual Behaviors
          </h2>
        </div>
        <button className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
          See all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {unusualBehaviors.map(behavior => {
          const ActionIcon = getActionIcon(behavior.actionType);
          return (
            <div
              key={behavior.id}
              className="p-4 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                {behavior.severity === 'high' ? (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[9px] font-bold leading-none">!</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex-shrink-0" />
                )}
                <p className="text-xs font-semibold text-[#12233A] dark:text-white leading-snug">
                  {behavior.title}
                </p>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 pl-6 leading-snug line-clamp-2">
                {behavior.description}
              </p>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 min-w-0">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{behavior.time}</span>
                </div>
                <button
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-400/20 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  <ActionIcon className="w-3 h-3 flex-shrink-0" />
                  {behavior.actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
