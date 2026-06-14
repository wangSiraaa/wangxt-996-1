import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  ClipboardCheck,
  MessageSquareWarning,
  HardHat,
  History,
  AlertTriangle,
  Archive,
  ChevronDown,
} from 'lucide-react';
import useStore from '@/store';
import type { Role } from '@/types';

const NAV_ITEMS = [
  { path: '/street', label: '街道台账', icon: Building2 },
  { path: '/resident', label: '居民公示端', icon: Users },
  { path: '/supervisor', label: '监理验收', icon: ClipboardCheck },
  { path: '/objections', label: '异议处理', icon: MessageSquareWarning },
  { path: '/construction', label: '施工计划', icon: HardHat },
  { path: '/changes', label: '变更历史', icon: History },
  { path: '/risks', label: '红色风险清单', icon: AlertTriangle },
  { path: '/archive', label: '归档审计', icon: Archive },
];

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string }> = {
  street: { label: '街道', color: 'text-blue-700', bg: 'bg-blue-100' },
  resident: { label: '居民', color: 'text-green-700', bg: 'bg-green-100' },
  supervisor: { label: '监理', color: 'text-orange-700', bg: 'bg-orange-100' },
};

const ROLES: Role[] = ['street', 'resident', 'supervisor'];

export default function Layout() {
  const location = useLocation();
  const { role, setRole } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentRole = ROLE_CONFIG[role];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 flex-shrink-0 bg-[#1e293b] text-white flex flex-col">
        <div className="h-14 flex items-center justify-center border-b border-slate-600 font-bold text-lg tracking-wide">
          老旧小区改造
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-700 border-l-4 border-[#16a34a] text-white'
                    : 'border-l-4 border-transparent text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-14 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">当前角色：</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${currentRole.bg} ${currentRole.color}`}>
              {currentRole.label}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              切换角色
              <ChevronDown size={14} />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-28 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRole(r);
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-center px-3 py-2 text-sm hover:bg-gray-50 ${
                        role === r ? 'font-medium text-[#16a34a]' : 'text-gray-700'
                      }`}
                    >
                      {ROLE_CONFIG[r].label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
