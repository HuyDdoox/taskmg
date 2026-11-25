'use client';

import React from 'react';
import { 
  LayoutGrid, Layers, MessageSquare, Users, 
  FolderKanban, Sparkles, ChevronRight, Circle 
} from 'lucide-react';

export type NavTab = 'kanban' | 'chat' | 'milestones' | 'members';

interface SidebarProps {
  projectKey: string;
  projectName: string;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  memberCount: number;
  currentUser?: { fullName?: string; email?: string } | null;
  isSocketConnected?: boolean;
}

export function Sidebar({
  projectKey,
  projectName,
  activeTab,
  onTabChange,
  memberCount,
  currentUser,
  isSocketConnected,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-[#0747A6] text-white flex flex-col justify-between shrink-0 shadow-xl select-none">
      <div>
        {/* Logo & Project Title */}
        <div className="p-4 flex items-center gap-3 border-b border-blue-800/40">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white shadow-xs">
            <FolderKanban className="w-5 h-5 text-blue-200" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="font-bold text-sm leading-tight text-white truncate" title={projectName}>
              {projectName}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-blue-200 font-mono bg-blue-900/50 px-1.5 py-0.2 rounded border border-blue-700/50">
                Key: [{projectKey}]
              </span>
              <span 
                className={`inline-flex items-center gap-1 text-[10px] ${
                  isSocketConnected ? 'text-emerald-300' : 'text-amber-300'
                }`}
                title={isSocketConnected ? 'WebSocket Đang kết nối' : 'WebSocket Ngoại tuyến'}
              >
                <Circle className={`w-1.5 h-1.5 fill-current ${isSocketConnected ? 'animate-pulse' : ''}`} />
                {isSocketConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-3 space-y-1.5">
          <button
            onClick={() => onTabChange('kanban')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'kanban'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-blue-100 hover:bg-blue-800/40 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-4 h-4 text-blue-200" /> Bảng Kanban
            </div>
            {activeTab === 'kanban' && <ChevronRight className="w-3.5 h-3.5 text-blue-300" />}
          </button>

          <button
            onClick={() => onTabChange('chat')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-blue-100 hover:bg-blue-800/40 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-blue-200" /> Kênh Chat Dự Án
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>

          <button
            onClick={() => onTabChange('milestones')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'milestones'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-blue-100 hover:bg-blue-800/40 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-blue-200" /> Giai Đoạn (Milestones)
            </div>
          </button>

          <button
            onClick={() => onTabChange('members')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'members'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-blue-100 hover:bg-blue-800/40 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-blue-200" /> Thành Viên ({memberCount})
            </div>
          </button>
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-blue-800/40">
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-blue-800/40">
          <div className="w-8 h-8 rounded-full bg-blue-400 text-blue-900 flex items-center justify-center text-xs font-bold shadow-xs">
            {currentUser?.fullName?.charAt(0) || 'S'}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">{currentUser?.fullName || 'Người dùng'}</div>
            <div className="text-[10px] text-blue-200 truncate">{currentUser?.email || 'admin@taskmg.com'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
