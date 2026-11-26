'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth-actions';
import { getProjectPermissions, getRoleBadgeStyle, ProjectRole } from '@/lib/rbac';
import { getProjectVisual } from '@/lib/project-icons';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useSocket } from '@/hooks/useSocket';
import { emitRealtimeEvent } from '@/lib/socket';
import { SummaryView } from './SummaryView';
import { ListView } from './ListView';
import { TimelineView } from './TimelineView';
import { MembersView } from './MembersView';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TaskDrawer } from '@/components/kanban/TaskDrawer';
import { CreateTaskModal } from '@/components/kanban/CreateTaskModal';
import { BulkCreateTaskModal } from '@/components/kanban/BulkCreateTaskModal';
export type WorkspaceTab = 'summary' | 'list' | 'board' | 'timeline' | 'members';

interface ProjectWorkspaceProps {
  initialProject: any;
  allProjects: any[];
  allUsers: any[];
  currentUser: { id: string; fullName: string; email: string };
  userRole: ProjectRole | string;
}

export function ProjectWorkspace({
  initialProject,
  allProjects,
  allUsers,
  currentUser,
  userRole,
}: ProjectWorkspaceProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('list');
  const [isDark, setIsDark] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState<string>('');

  const permissions = useMemo(() => getProjectPermissions(userRole), [userRole]);
  const { socket } = useSocket({ projectId: project.id, userId: currentUser.id });

  useEffect(() => {
    const saved = localStorage.getItem('taskmg-theme');
    if (saved === 'light') setIsDark(false);
  }, []);

  const applyTaskMovedLocal = (
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

  // Lắng nghe sự kiện Realtime từ Render Server v2.0
  useEffect(() => {
    if (!socket) return;

    const onRemoteTaskMoved = (data: any) => {
      if (data?.taskId && data?.targetColumnId) {
        applyTaskMovedLocal(data.taskId, data.targetColumnId, data.orderIndex || 1000);
      }
    };

    const onRemoteTaskCreated = (data: any) => {
      if (!data?.task) return;
      const newTask = data.task;
      setProject((prev: any) => ({
        ...prev,
        columns: prev.columns.map((col: any) => {
          if (col.id !== newTask.columnId) return col;
          const exists = (col.tasks || []).some((t: any) => t.id === newTask.id);
          return exists ? col : { ...col, tasks: [...(col.tasks || []), newTask] };
        }),
      }));
    };

    const onRemoteBulkCreated = (data: any) => {
      if (!Array.isArray(data?.tasks)) return;
      const incoming = data.tasks;
      setProject((prev: any) => ({
        ...prev,
        columns: prev.columns.map((col: any) => {
          const existingIds = new Set((col.tasks || []).map((t: any) => t.id));
          const added = incoming.filter(
            (t: any) => t.columnId === col.id && !existingIds.has(t.id)
          );
          return added.length > 0
            ? { ...col, tasks: [...(col.tasks || []), ...added] }
            : col;
        }),
      }));
    };

    const onRemoteTaskUpdated = (data: any) => {
      if (!data?.task) return;
      const updatedTask = data.task;
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
      setSelectedTask((curr: any) => (curr?.id === updatedTask.id ? updatedTask : curr));
    };

    const onRemoteTaskDeleted = (data: any) => {
      if (!data?.taskId) return;
      setProject((prev: any) => ({
        ...prev,
        columns: prev.columns.map((col: any) => ({
          ...col,
          tasks: (col.tasks || []).filter((t: any) => t.id !== data.taskId),
        })),
      }));
      setSelectedTask((curr: any) => (curr?.id === data.taskId ? null : curr));
    };

    const onRemoteMilestoneCreated = (data: any) => {
      if (!data?.milestone) return;
      setProject((prev: any) => {
        const exists = (prev.milestones || []).some((m: any) => m.id === data.milestone.id);
        return exists
          ? prev
          : { ...prev, milestones: [...(prev.milestones || []), data.milestone] };
      });
    };

    socket.on('task_moved', onRemoteTaskMoved);
    socket.on('task_created', onRemoteTaskCreated);
    socket.on('bulk_tasks_created', onRemoteBulkCreated);
    socket.on('task_updated', onRemoteTaskUpdated);
    socket.on('task_deleted', onRemoteTaskDeleted);
    socket.on('milestone_created', onRemoteMilestoneCreated);

    return () => {
      socket.off('task_moved', onRemoteTaskMoved);
      socket.off('task_created', onRemoteTaskCreated);
      socket.off('bulk_tasks_created', onRemoteBulkCreated);
      socket.off('task_updated', onRemoteTaskUpdated);
      socket.off('task_deleted', onRemoteTaskDeleted);
      socket.off('milestone_created', onRemoteMilestoneCreated);
    };
  }, [socket]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('taskmg-theme', next ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  const allTasks = useMemo(
    () => (project.columns || []).flatMap((c: any) => c.tasks || []),
    [project.columns]
  );

  const handleTaskMovedState = (
    taskId: string,
    targetColumnId: string,
    orderIndex: number
  ) => {
    applyTaskMovedLocal(taskId, targetColumnId, orderIndex);
    emitRealtimeEvent('task_moved', {
      projectId: project.id,
      taskId,
      targetColumnId,
      orderIndex,
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
    emitRealtimeEvent('task_created', { projectId: project.id, task: newTask });
    if (newTask?.assigneeId) {
      emitRealtimeEvent('notification_dispatch', {
        projectId: project.id,
        userIds: [newTask.assigneeId],
      });
    }
  };

  const handleBulkTasksCreated = (newTasks: any[]) => {
    setProject((prev: any) => ({
      ...prev,
      columns: prev.columns.map((col: any) => {
        const addedForCol = newTasks.filter((t) => t.columnId === col.id);
        return addedForCol.length > 0
          ? { ...col, tasks: [...(col.tasks || []), ...addedForCol] }
          : col;
      }),
    }));
    emitRealtimeEvent('bulk_tasks_created', { projectId: project.id, tasks: newTasks });
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
    emitRealtimeEvent('task_updated', { projectId: project.id, task: updatedTask });
  };

  const handleTaskDeleted = (taskId: string) => {
    setProject((prev: any) => ({
      ...prev,
      columns: prev.columns.map((col: any) => ({
        ...col,
        tasks: (col.tasks || []).filter((t: any) => t.id !== taskId),
      })),
    }));
    emitRealtimeEvent('task_deleted', { projectId: project.id, taskId });
  };

  const handleMilestoneCreated = (milestone: any) => {
    setProject((prev: any) => ({
      ...prev,
      milestones: [...(prev.milestones || []), milestone],
    }));
    emitRealtimeEvent('milestone_created', { projectId: project.id, milestone });
  };

  const handleMemberAdded = (member: any) => {
    setProject((prev: any) => ({
      ...prev,
      members: [...(prev.members || []), member],
    }));
    emitRealtimeEvent('member_changed', { projectId: project.id, member });
    if (member?.userId) {
      emitRealtimeEvent('notification_dispatch', {
        projectId: project.id,
        userIds: [member.userId],
      });
    }
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
    { id: 'summary', label: 'Summary', icon: <i className="fa-solid fa-globe" /> },
    { id: 'list', label: 'List', icon: <i className="fa-solid fa-list" /> },
    { id: 'board', label: 'Board', icon: <i className="fa-solid fa-table-columns" /> },
    { id: 'timeline', label: 'Timeline', icon: <i className="fa-solid fa-calendar-days" /> },
    {
      id: 'members',
      label: `Members (${project.members?.length || 0})`,
      icon: <i className="fa-solid fa-users" />,
    },
  ];

  return (
    <div
      className={`flex flex-col h-screen w-full overflow-hidden transition-colors ${
        isDark ? 'bg-[#1D2125] text-[#B6C2CF]' : 'bg-[#F4F5F7] text-gray-900'
      }`}
    >
      {/* 1. TOP JIRA HEADER */}
      <header
        className={`px-6 pt-3 pb-0 border-b shrink-0 ${
          isDark ? 'bg-[#1D2125] border-[#2C333A]' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs">
              <Link
                href="/spaces"
                className={`hover:underline ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}
              >
                Spaces
              </Link>
              <i className="fa-solid fa-chevron-right opacity-50" />
              <CustomSelect
                value={project.id}
                isDark={isDark}
                minMenuWidth="min-w-[220px]"
                onChange={(val) => router.push(`/projects/${val}`)}
                buttonClassName={`px-1.5 py-0.5 border-transparent hover:border-[#38414A] bg-transparent font-semibold ${
                  isDark ? 'text-[#B6C2CF]' : 'text-gray-700'
                }`}
                options={allProjects.map((p) => ({
                  value: p.id,
                  label: p.name,
                  subLabel: `Key: ${p.projectKey}`,
                }))}
              />
            </div>

            <div className="flex items-center gap-2.5">
              {(() => {
                const vis = getProjectVisual(project.projectKey || project.id);
                return (
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-br ${vis.gradient} text-white flex items-center justify-center shadow-xs shrink-0`}
                  >
                    <i className={`${vis.icon} text-xs`} />
                  </div>
                );
              })()}
              <h1 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {project.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadgeStyle(
                  permissions.role,
                  isDark
                )}`}
                title="Vai trò của bạn trong dự án này"
              >
                <i className="fa-solid fa-shield-halved" /> {permissions.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Logged-in User Info */}
            <div
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                isDark
                  ? 'bg-[#22272B] border-[#38414A] text-[#B6C2CF]'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#0C66E4] text-white text-[10px] font-bold flex items-center justify-center">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium max-w-[130px] truncate">{currentUser.fullName}</span>
            </div>

            {/* Create Task Buttons (Hidden for VIEWER) */}
            {permissions.canCreateTask && (
              <>
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#22272B] border-[#38414A] text-[#DEE4EA] hover:border-[#579DFF] hover:text-white'
                      : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100'
                  }`}
                  title="Thêm nhiều công việc cùng lúc (Dán danh sách / CSV)"
                >
                  <i className="fa-solid fa-list-check text-[#579DFF]" /> Thêm hàng loạt
                </button>
                <button
                  onClick={() => {
                    setCreateColumnId(project.columns?.[0]?.id || '');
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-plus" /> Tạo Task
                </button>
              </>
            )}

            {/* Notification Bell */}
            <NotificationBell isDark={isDark} />

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
              {isDark ? <i className="fa-solid fa-sun" /> : <i className="fa-solid fa-moon" />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#22272B] border-[#38414A] text-[#9FADBC] hover:text-red-400 hover:border-red-500/40'
                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-red-600'
              }`}
              title="Đăng xuất / Đổi tài khoản"
            >
              <i className="fa-solid fa-right-from-bracket" />
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
            permissions={permissions}
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
            permissions={permissions}
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
            permissions={permissions}
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
            permissions={permissions}
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
          currentUser={currentUser}
          permissions={permissions}
          isDark={isDark}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}

      {/* 5. CREATE TASK MODAL & BULK CREATE MODAL */}
      {permissions.canCreateTask && (
        <>
          <CreateTaskModal
            isOpen={isCreateModalOpen}
            projectId={project.id}
            columns={project.columns || []}
            milestones={project.milestones || []}
            members={project.members || []}
            currentUserId={currentUser?.id}
            permissions={permissions}
            defaultColumnId={createColumnId}
            isDark={isDark}
            onClose={() => setIsCreateModalOpen(false)}
            onTaskCreated={handleTaskCreated}
          />
          <BulkCreateTaskModal
            isOpen={isBulkModalOpen}
            projectId={project.id}
            columns={project.columns || []}
            milestones={project.milestones || []}
            members={project.members || []}
            currentUserId={currentUser?.id}
            permissions={permissions}
            isDark={isDark}
            onClose={() => setIsBulkModalOpen(false)}
            onTasksCreated={handleBulkTasksCreated}
          />
        </>
      )}
    </div>
  );
}
