import { Bell, HelpCircle, Grid3x3, Sun, Moon } from 'lucide-react';

interface TopBarProps {
  onBellClick: () => void;
  unreadCount: number;
  isDark: boolean;
  onToggleDark: () => void;
}

export function TopBar({ onBellClick, unreadCount, isDark, onToggleDark }: TopBarProps) {
  return (
    <div className="h-12 bg-gray-900 text-white flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
          </div>
          <span className="font-semibold">Cellebrite Guardian</span>
        </div>
        <span className="text-gray-400">|</span>
        <span className="text-gray-300">Investigate</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleDark}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
        >
          {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
        <button
          onClick={onBellClick}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-semibold hover:bg-gray-600 transition-colors">
          AB
        </button>
        <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
          <Grid3x3 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
