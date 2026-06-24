import { useState } from 'react';
import {
  LayoutDashboard, FileText, Layout, BarChart3,
  FolderOpen, Users2, PanelLeftClose, PanelLeftOpen, Sparkles,
} from 'lucide-react';

type Page = 'dashboard' | 'cases' | 'whiteboard' | 'myfiles' | 'admin' | 'collaborate' | 'ai-workspace';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems: { icon: React.ComponentType<{ className?: string }>; label: string; page: Page }[] = [
    { icon: LayoutDashboard, label: 'Dashboard',    page: 'dashboard'    },
    { icon: FileText,        label: 'Cases',        page: 'cases'        },
    { icon: Users2,          label: 'Collaborate',  page: 'collaborate'  },
    { icon: FolderOpen,      label: 'My Files',     page: 'myfiles'      },
    { icon: Layout,          label: 'Whiteboard',   page: 'whiteboard'   },
    { icon: BarChart3,       label: 'Admin',        page: 'admin'        },
  ];

  return (
    <div
      style={{ width: collapsed ? 52 : 96 }}
      className="flex-shrink-0 bg-gray-50 dark:bg-[#0f1929] border-r border-gray-200 dark:border-white/10 flex flex-col py-4 overflow-hidden transition-[width] duration-200 ease-in-out"
    >
      {/* Nav items */}
      <nav className="flex-1 px-1 space-y-0.5">
        {menuItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.page)}
              className={`
                relative group w-full flex rounded-lg transition-colors
                ${collapsed
                  ? 'flex-col items-center justify-center py-3'
                  : 'flex-col items-center gap-1.5 px-2 py-3'}
                ${isActive && item.page === 'ai-workspace'
                  ? 'bg-gradient-to-b from-blue-600 to-violet-600 text-white shadow-sm'
                  : isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />

              {/* Label — only when expanded */}
              {!collapsed && (
                <span className="text-[11px] font-medium text-center leading-tight select-none">
                  {item.label}
                </span>
              )}

              {/* Tooltip — only when collapsed */}
              {collapsed && (
                <span className="
                  pointer-events-none absolute left-full ml-2 z-50
                  px-2 py-1 rounded
                  bg-[#12233A] text-white text-[10px] font-medium whitespace-nowrap
                  opacity-0 group-hover:opacity-100 transition-opacity duration-150
                ">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse / expand toggle */}
      <div className="flex-shrink-0 px-1 pt-2 border-t border-gray-200 dark:border-white/10">
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="w-full flex items-center justify-center py-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-white transition-colors"
        >
          {collapsed
            ? <PanelLeftOpen className="w-4 h-4" />
            : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
