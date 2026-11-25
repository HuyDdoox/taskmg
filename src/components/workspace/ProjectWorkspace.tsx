'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { SummaryView } from './SummaryView';
import { ListView } from './ListView';
import { TimelineView } from './TimelineView';
import { MembersView } from './MembersView';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TaskDrawer } from '@/components/kanban/TaskDrawer';
import { CreateTaskModal } from '@/components/kanban/CreateTaskModal';
import {
  Globe,
  List,
  LayoutGrid,
  CalendarRange,
  Users,
  Plus,
  Sun,
  Moon,
  FolderKanban,
  ChevronRight,
  UserCircle2,
} from 'lucide-react';

export type WorkspaceTab = 'summary' | 'list' | 'board' | 'timeline' | 'members';

interface ProjectWorkspaceProps {
  initialProject: any;
  allProjects: any[];
  allUsers: any[];
}

export function ProjectWorkspace({
  initialProject,
  allProjects,
  allUsers,
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('list');
  const [isDark, setIsDark] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>(
    initialProject.owner?.id || initialProject.members?.[0]?.user?.id || ''
  );

  // Sync theme with localStorage
  useEffect(() => {
    const saved = localStorage.getItem('taskmg-theme');
    if (saved === 'light') setIsDark(false);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('taskmg-theme', next ? 'dark' : 'light');
  };

  // Realtime sync for Kanban moves
  const { socket } = useSocket(project?.id);

  useEffect(() => {
    if (!socket) return;

    const handleRemoteTaskMoved = (data: {
      taskId: string;
      targetColumnId: string;
      orderIndex: number;
    }) => {
      handleTaskMovedState(data.taskId, data.targetColumnId, data.orderIndex);
    };

    socket.on('task_moved', handleRemoteTaskMoved);
    return () => {
      socket.off('task_moved', handleRemoteTaskMoved);
    };
  }, [socket]);

  const allTasks = useMemo(
    () => (project.columns || []).flatMap((c: any) => c.tasks || []),
    [project.columns]
  );

  const currentUser = useMemo(() => {
    const foundMember = (project.members || []).find(
      (m: any) => m.user?.id === currentUserId
    );
    return foundMember?.user || project.owner;
  }, [project.members, project.owner, currentUserId]);

  const handleTaskMovedState = (
    taskId: string,
    targetColumnId: string,
    orderIndex: number
  ) => {
    setProject((prev: any) => {
      let movedTask: any = null;
      prev.columns.forEach((col: any) => {
        const t = (col.tasks || []).find((item: any) => item.id === taskId);
        if (t) {
          movedTask = { ...t, columnId: targetColumnId, orderIndex };
        }
      });
      if (!movedTask) return prev;

      const newCols = prev.columns.map((col: any) => {
        const withoutTask = (col.tasks || []).filter((t: any) => t.id !== taskId);
        if (col.id === targetColumnId) {
          return { ...col, tasks: [...withoutTask, movedTask] };
        }
        return { ...col, tasks: withoutTask };
      });

      return { ...prev, columns: newCols };
    });
  };

  const handleTaskCreated = (newTask: any) => {
    setProject((prev: any) => ({
      ...prev,
      columns: prev.columns.map((col: any) =>
        col.id === newTask.columnId
          ? { ...col, tasks: [...(col.tasks || []), newTask] }
          : col
      ),
    }));
  };

  const handleTaskUpdated = (updatedTask: any) => {
    setProject((prev: any) => ({
      ...prev,
      columns: prev.columns.map((col: any) => {
        const filtered = (col.tasks || []).filter((t: any) => t.id !== updatedTask.id);
        if (col.id === updatedTask.columnId) {
          return { ...col, tasks: [...filtered, updatedTask] };
        }
        return { ...col, tasks: filtered };
      }),
    }));
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskDeleted = (taskId: string) => {
    setProject((prev: any) => ({
      ...prev,
      columns: prev.columns.map((col: any) => ({
        ...col,
        tasks: (col.tasks || []).filter((t: any) => t.id !== taskId),
      })),
    }));
  };

  const handleMilestoneCreated = (milestone: any) => {
    setProject((prev: any) => ({
      ...prev,
      milestones: [...(prev.milestones || []), milestone],
    }));
  };

  const handleMemberAdded = (member: any) => {
    setProject((prev: any) => ({
      ...prev,
      members: [...(prev.members || []), member],
    }));
  };

  const handleMemberUpdated = (updatedMember: any) => {
    setProject((prev: any) => ({
      ...prev,
      members: (prev.members || []).map((m: any) =>
        m.id === updatedMember.id ? updatedMember : m
      ),
    }));
  };

  const handleMemberRemoved = (memberId: string) => {
    setProject((prev: any) => ({
      ...prev,
      members: (prev.members || []).filter((m: any) => m.id !== memberId),
    }));
  };

  const tabs: { id: WorkspaceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Summary', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'list', label: 'List', icon: <List className="w-3.5 h-3.5" /> },
    { id: 'board', label: 'Board', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'timeline', label: 'Timeline', icon: <CalendarRange className="w-3.5 h-3.5" /> },
    {
      id: 'members',
      label: `Members (${project.members?.length || 0})`,
      icon: <Users className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div
      className={`flex flex-col h-screen w-full overflow-hidden transition-colors ${
        isDark ? 'bg-[#1D2125] text-[#B6C2CF]' : 'bg-[#F4F5F7] text-gray-900'
      }`}
    >
      {/* 1. TOP JIRA HEADER (Spaces / Project Name + Actions) */}
      <header
        className={`px-6 pt-3 pb-0 border-b shrink-0 ${
          isDark ? 'bg-[#1D2125] border-[#2C333A]' : 'bg-white border-gray-200'
        }`}
      >
        {/* Top Row: Breadcrumb + Project Switcher + Right Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div className="space-y-1">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs">
              <Link
                href="/"
                className={`hover:underline ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}
              >
                Spaces
              </Link>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              <select
                value={project.id}
                onChange={(e) => router.push(`/projects/${e.target.value}`)}
                className={`bg-transparent font-semibold text-xs focus:outline-none cursor-pointer ${
                  isDark ? 'text-[#B6C2CF]' : 'text-gray-700'
                }`}
              >
                {allProjects.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    className={isDark ? 'bg-[#22272B] text-white' : 'bg-white text-gray-900'}
                  >
                    {p.name} ({p.projectKey})
                  </option>
                ))}
              </select>
            </div>

            {/* Project Title */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#0C66E4] to-sky-400 text-white font-bold text-[10px] font-mono flex items-center justify-center shadow-xs">
                {project.projectKey}
              </div>
              <h1 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {project.name}
              </h1>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Switch Active User */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
                isDark
                  ? 'bg-[#22272B] border-[#38414A] text-[#B6C2CF]'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
              title="Đổi tài khoản thao tác"
            >
              <UserCircle2 className="w-3.5 h-3.5 text-[#579DFF]" />
              <select
                value={currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value)}
                className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
              >
                {(project.members || []).map((m: any) => (
                  <option
                    key={m.user.id}
                    value={m.user.id}
                    className={isDark ? 'bg-[#22272B] text-white' : 'bg-white text-gray-900'}
                  >
                    {m.user.fullName} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Create Task Button */}
            <button
              onClick={() => {
                setCreateColumnId(project.columns?.[0]?.id || '');
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tạo Task
            </button>

            {/* Dark/Light Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#22272B] border-[#38414A] text-amber-400 hover:bg-[#2C333A]'
                  : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
              }`}
              title={isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 2. HORIZONTAL JIRA MULTI-VIEW TAB BAR */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#579DFF] text-[#579DFF]'
                    : isDark
                    ? 'border-transparent text-[#9FADBC] hover:text-white hover:bg-[#22272B]'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* 3. ACTIVE VIEW CONTENT */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'summary' && (
          <SummaryView project={project} tasks={allTasks} isDark={isDark} />
        )}

        {activeTab === 'list' && (
          <ListView
            project={project}
            tasks={allTasks}
            currentUser={currentUser}
            isDark={isDark}
            onSelectTask={(task) => setSelectedTask(task)}
            onTaskUpdated={handleTaskUpdated}
            onTaskCreated={handleTaskCreated}
          />
        )}

        {activeTab === 'board' && (
          <KanbanBoard
            project={project}
            currentUser={currentUser}
            socket={socket}
            isDark={isDark}
            onSelectTask={(task) => setSelectedTask(task)}
            onOpenCreateModal={(colId) => {
              setCreateColumnId(colId || project.columns?.[0]?.id || '');
              setIsCreateModalOpen(true);
            }}
            onTaskMoved={handleTaskMovedState}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            project={project}
            tasks={allTasks}
            isDark={isDark}
            onSelectTask={(task) => setSelectedTask(task)}
            onMilestoneCreated={handleMilestoneCreated}
          />
        )}

        {activeTab === 'members' && (
          <MembersView
            project={project}
            allUsers={allUsers}
            tasks={allTasks}
            isDark={isDark}
            onMemberAdded={handleMemberAdded}
            onMemberUpdated={handleMemberUpdated}
            onMemberRemoved={handleMemberRemoved}
          />
        )}
      </main>

      {/* 4. SLIDE-OVER TASK DRAWER */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          project={project}
          isDark={isDark}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}

      {/* 5. CREATE TASK MODAL */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        projectId={project.id}
        columns={project.columns || []}
        milestones={project.milestones || []}
        members={project.members || []}
        currentUserId={currentUser?.id}
        defaultColumnId={createColumnId}
        isDark={isDark}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
