'use client';

import React, { useState } from 'react';
import { updateTaskColumn } from '@/app/actions/task-actions';
import { TaskDrawer } from './TaskDrawer';
import { CreateTaskModal } from './CreateTaskModal';
import { 
  Search, Plus, Filter, Calendar, AlertTriangle, 
  Flag, CheckSquare, MessageSquare, ChevronDown, 
  Layers, Users, Settings, Bell, LayoutGrid, CheckCircle2,
  Clock, ShieldAlert, Sparkles, FolderKanban
} from 'lucide-react';

interface KanbanBoardProps {
  initialProject: any;
  socket?: any;
  isSocketConnected?: boolean;
  hideSidebar?: boolean;
}

export function KanbanBoard({ 
  initialProject,
  socket,
  isSocketConnected,
  hideSidebar = false
}: KanbanBoardProps) {
  const [project, setProject] = useState(initialProject);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState<string>('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [onlyHighRisk, setOnlyHighRisk] = useState(false);
  const [onlyDueSoon, setOnlyDueSoon] = useState(false);

  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const currentUser = project?.owner; // Sếp / Product Owner

  // Hàm lọc Tasks theo bộ lọc
  const filterTask = (task: any) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKey = task.issueKey.toLowerCase().includes(q);
      const matchTitle = task.title.toLowerCase().includes(q);
      if (!matchKey && !matchTitle) return false;
    }

    // 2. Milestone Filter
    if (selectedMilestone !== 'ALL' && task.milestoneId !== selectedMilestone) {
      return false;
    }

    // 3. Chỉ việc của tôi
    if (onlyMyTasks && task.assigneeId !== currentUser?.id) {
      return false;
    }

    // 4. Rủi ro cao
    if (onlyHighRisk && task.riskLevel !== 'CRITICAL' && task.riskLevel !== 'HIGH') {
      return false;
    }

    // 5. Sắp hết hạn
    if (onlyDueSoon && !task.dueDate) {
      return false;
    }

    return true;
  };

  // Kéo và Thả Task
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumnId(columnId);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    // Tìm task hiện tại
    let foundTask: any = null;
    project.columns.forEach((col: any) => {
      const t = col.tasks.find((item: any) => item.id === taskId);
      if (t) foundTask = t;
    });

    if (!foundTask || foundTask.columnId === targetColumnId) {
      setDraggedTaskId(null);
      return;
    }

    // Optimistic UI Update
    setProject((prev: any) => {
      const newCols = prev.columns.map((col: any) => {
        if (col.id === foundTask.columnId) {
          return {
            ...col,
            tasks: col.tasks.filter((t: any) => t.id !== taskId),
          };
        }
        if (col.id === targetColumnId) {
          const updatedTask = { ...foundTask, columnId: targetColumnId };
          return {
            ...col,
            tasks: [...col.tasks, updatedTask],
          };
        }
        return col;
      });
      return { ...prev, columns: newCols };
    });

    setDraggedTaskId(null);

    const newOrderIndex = Date.now() % 100000;
    // Call server action
    const res = await updateTaskColumn(taskId, targetColumnId, newOrderIndex);
    if (!res.success) {
      alert('Không thể lưu trạng thái kéo thả lên máy chủ');
    } else if (socket) {
      socket.emit('task_moved', {
        projectId: project.id,
        taskId,
        issueKey: foundTask.issueKey,
        targetColumnId,
        orderIndex: newOrderIndex,
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'BLOCKER':
        return <Flag className="w-3.5 h-3.5 text-red-600 fill-red-100" />;
      case 'HIGH':
        return <Flag className="w-3.5 h-3.5 text-orange-500 fill-orange-100" />;
      case 'MEDIUM':
        return <Flag className="w-3.5 h-3.5 text-yellow-500" />;
      default:
        return <Flag className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getRiskIndicator = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
            🔥 Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
            ⚠️ High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            ⚡ Medium
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F5F7] text-gray-900 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR TRÁI (JIRA-STYLE COLLAPSIBLE SIDEBAR) */}
      {!hideSidebar && (
        <aside className="w-64 bg-[#0747A6] text-white flex flex-col justify-between shrink-0 shadow-xl">
          <div>
            {/* Logo & Project Title */}
            <div className="p-4 flex items-center gap-3 border-b border-blue-800/40">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white text-sm">
                <FolderKanban className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <div className="font-bold text-sm leading-tight text-white">Task Management</div>
                <div className="text-[11px] text-blue-200 font-mono">Key: [{project.projectKey}]</div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-1">
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-700/60 text-white text-xs font-semibold">
                <LayoutGrid className="w-4 h-4 text-blue-200" /> Bảng Kanban
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-700/30 text-blue-100 text-xs font-medium transition-colors">
                <Layers className="w-4 h-4 text-blue-300" /> Giai Đoạn (Milestones)
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-700/30 text-blue-100 text-xs font-medium transition-colors">
                <MessageSquare className="w-4 h-4 text-blue-300" /> Kênh Chat Dự Án
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-700/30 text-blue-100 text-xs font-medium transition-colors">
                <Users className="w-4 h-4 text-blue-300" /> Thành Viên ({project.members?.length || 3})
              </a>
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-blue-800/40">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-blue-800/40">
              <div className="w-7 h-7 rounded-full bg-blue-400 text-blue-900 flex items-center justify-center text-xs font-bold">
                {currentUser?.fullName?.charAt(0) || 'S'}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">{currentUser?.fullName}</div>
                <div className="text-[10px] text-blue-200 truncate">Admin / PO</div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 2. KHÔNG GIAN LÀM VIỆC CHÍNH (MAIN WORKSPACE) */}
      <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-14 px-6 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Dự án</span> / <span className="font-semibold text-gray-800">{project.name}</span> / <span className="text-blue-600 font-medium">Bảng Kanban</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCreateColumnId(project.columns[0]?.id || '');
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Tạo Task Mới
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Header Board Controls & Quick Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">Bảng Quản Lý Công Việc (Kanban Board)</h1>
            <div className="text-xs text-gray-500">
              Tổng số công việc: <span className="font-bold text-gray-800 font-mono">
                {project.columns.reduce((sum: number, c: any) => sum + c.tasks.length, 0)} tasks
              </span>
            </div>
          </div>

          {/* Quick Filters Bar (Chuẩn Jira) */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            
            {/* Search Input */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Tìm task (#TASK-1, tên việc)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            {/* Milestone Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-medium">Giai đoạn:</span>
              <select
                value={selectedMilestone}
                onChange={(e) => setSelectedMilestone(e.target.value)}
                className="p-1.5 rounded-lg border border-gray-300 bg-white font-medium text-gray-800 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">🎯 Tất cả giai đoạn</option>
                {project.milestones?.map((m: any) => (
                  <option key={m.id} value={m.id}>🎯 {m.title}</option>
                ))}
              </select>
            </div>

            <div className="w-px h-5 bg-gray-300"></div>

            {/* Quick Filter Buttons */}
            <button
              onClick={() => setOnlyMyTasks(!onlyMyTasks)}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
                onlyMyTasks 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              👤 Chỉ việc của tôi
            </button>

            <button
              onClick={() => setOnlyHighRisk(!onlyHighRisk)}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
                onlyHighRisk 
                  ? 'bg-red-600 text-white border-red-600 shadow-xs' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              🔥 Rủi ro cao
            </button>

            <button
              onClick={() => setOnlyDueSoon(!onlyDueSoon)}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
                onlyDueSoon 
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              ⏰ Có hạn chót
            </button>

            {(searchQuery || selectedMilestone !== 'ALL' || onlyMyTasks || onlyHighRisk || onlyDueSoon) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedMilestone('ALL');
                  setOnlyMyTasks(false);
                  setOnlyHighRisk(false);
                  setOnlyDueSoon(false);
                }}
                className="text-xs text-blue-600 hover:underline font-medium ml-1"
              >
                Xóa bộ lọc
              </button>
            )}

          </div>
        </div>

        {/* 3. BẢNG 4 CỘT KANBAN KÉO THẢ (DRAG & DROP CANVAS) */}
        <div className="flex-1 p-6 overflow-x-auto bg-[#F4F5F7]">
          <div className="flex gap-4 h-full items-start">
            {project.columns.map((column: any) => {
              const filteredTasks = column.tasks.filter(filterTask);
              const isOver = dragOverColumnId === column.id;

              return (
                <div
                  key={column.id}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id)}
                  className={`w-72 shrink-0 max-h-full flex flex-col rounded-xl border transition-all ${
                    isOver 
                      ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-300' 
                      : 'border-gray-200 bg-[#EBECF0]'
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-3 flex items-center justify-between border-b border-gray-200/60 bg-transparent">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: column.colorHex }}
                      ></span>
                      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                        {column.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white text-gray-600 shadow-xs border border-gray-200">
                      {filteredTasks.length}
                    </span>
                  </div>

                  {/* Tasks List Container */}
                  <div className="p-2 space-y-2.5 overflow-y-auto flex-1 min-h-[120px]">
                    {filteredTasks.map((task: any) => {
                      const completedChecklists = task.checklists?.filter((c: any) => c.isCompleted).length || 0;
                      const totalChecklists = task.checklists?.length || 0;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => setSelectedTask(task)}
                          className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group space-y-2.5"
                        >
                          {/* Card Top: Issue Key & Risk / Priority */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              {task.issueKey}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {getRiskIndicator(task.riskLevel)}
                              {getPriorityIcon(task.priority)}
                            </div>
                          </div>

                          {/* Card Title */}
                          <h4 className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">
                            {task.title}
                          </h4>

                          {/* Checklist indicator */}
                          {totalChecklists > 0 && (
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <CheckSquare className="w-3.5 h-3.5 text-gray-400" />
                              <span>{completedChecklists}/{totalChecklists} việc</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-1.5 rounded-full" 
                                  style={{ width: `${(completedChecklists / totalChecklists) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Card Footer: Due Date & Assignee Avatar */}
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                            <div className="flex items-center gap-1">
                              {task.dueDate ? (
                                <>
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
                                </>
                              ) : (
                                <span className="text-gray-400">Không có hạn</span>
                              )}
                            </div>

                            <div 
                              title={`Người làm: ${task.assignee?.fullName || 'Chưa gán'}`}
                              className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold"
                            >
                              {task.assignee?.fullName?.charAt(0) || 'U'}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredTasks.length === 0 && (
                      <div className="p-4 text-center text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg">
                        Không có công việc nào
                      </div>
                    )}
                  </div>

                  {/* Add Task Button at bottom of column */}
                  <div className="p-2 pt-0">
                    <button
                      onClick={() => {
                        setCreateColumnId(column.id);
                        setIsCreateModalOpen(true);
                      }}
                      className="w-full py-1.5 rounded-lg hover:bg-gray-300/60 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm công việc
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* 4. DRAWER TRƯỢT PHẢI CHI TIẾT TASK (SLIDE-OVER) */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            // Cập nhật lại task khi có thay đổi checklist
          }}
        />
      )}

      {/* 5. MODAL TẠO TASK MỚI */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        columns={project.columns}
        milestones={project.milestones}
        defaultColumnId={createColumnId}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={() => {
          // Re-fetch hoặc reload page
          window.location.reload();
        }}
      />

    </div>
  );
}
