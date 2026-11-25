'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { ChatChannelView } from '@/components/chat/ChatChannelView';
import { MilestonesView } from '@/components/milestones/MilestonesView';
import { useSocket } from '@/hooks/useSocket';

interface WorkspaceViewProps {
  initialProject: any;
}

export function WorkspaceView({ initialProject }: WorkspaceViewProps) {
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState<NavTab>('kanban');

  // Khởi tạo WebSocket kết nối tới Render
  const { socket, isConnected } = useSocket(project?.id);

  // Lắng nghe sự kiện kéo thả task thời gian thực từ đồng đội
  useEffect(() => {
    if (!socket) return;

    const handleRemoteTaskMoved = (data: { taskId: string; targetColumnId: string; orderIndex: number }) => {
      console.log('⚡ Nhận sự kiện Realtime TASK_MOVED:', data);
      
      setProject((prev: any) => {
        let movedTask: any = null;
        
        // Tìm task
        prev.columns.forEach((col: any) => {
          const t = col.tasks.find((item: any) => item.id === data.taskId);
          if (t) movedTask = { ...t, columnId: data.targetColumnId, orderIndex: data.orderIndex };
        });

        if (!movedTask) return prev;

        // Cập nhật lại cột
        const newCols = prev.columns.map((col: any) => {
          if (col.id === movedTask.columnId && col.id !== data.targetColumnId) {
            return {
              ...col,
              tasks: col.tasks.filter((t: any) => t.id !== data.taskId),
            };
          }
          if (col.id === data.targetColumnId) {
            return {
              ...col,
              tasks: [...col.tasks.filter((t: any) => t.id !== data.taskId), movedTask],
            };
          }
          return col;
        });

        return { ...prev, columns: newCols };
      });
    };

    socket.on('task_moved', handleRemoteTaskMoved);

    return () => {
      socket.off('task_moved', handleRemoteTaskMoved);
    };
  }, [socket]);

  // Gom toàn bộ tasks của tất cả các cột
  const allTasks = project.columns.flatMap((c: any) => c.tasks);
  const defaultChannel = project.channels?.[0] || {
    id: 'default-channel',
    name: '💬 Kênh Thảo Luận Chung Dự Án',
    messages: [],
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F5F7] text-gray-900 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR TRÁI ĐIỀU PHỐI (CHUYỂN TAB) */}
      <Sidebar
        projectKey={project.projectKey}
        projectName={project.name}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        memberCount={project.members?.length || 3}
        currentUser={project.owner}
        isSocketConnected={isConnected}
      />

      {/* 2. NỘI DUNG CHÍNH THAY ĐỔI THEO TAB */}
      <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
        {activeTab === 'kanban' && (
          <KanbanBoard 
            initialProject={project} 
            socket={socket}
            isSocketConnected={isConnected}
            hideSidebar={true}
          />
        )}

        {activeTab === 'chat' && (
          <ChatChannelView
            projectId={project.id}
            channelId={defaultChannel.id}
            channelName={defaultChannel.name}
            initialMessages={defaultChannel.messages || []}
            currentUser={{
              id: project.owner?.id || 'admin',
              fullName: project.owner?.fullName || 'Sếp / Product Owner',
            }}
            socket={socket}
            isSocketConnected={isConnected}
          />
        )}

        {activeTab === 'milestones' && (
          <MilestonesView
            milestones={project.milestones || []}
            tasks={allTasks}
            onSelectMilestoneForBoard={(mId) => {
              setActiveTab('kanban');
            }}
          />
        )}

        {activeTab === 'members' && (
          <div className="flex-1 p-8 bg-[#F4F5F7] overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Danh Sách Thành Viên Dự Án ({project.members?.length || 3})</h2>
              <div className="grid gap-3">
                {project.members?.map((m: any) => (
                  <div key={m.id} className="p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                        {m.user?.fullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{m.user?.fullName}</div>
                        <div className="text-xs text-gray-500">{m.user?.email}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Vai trò: {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
