'use client';

import React, { useState } from 'react';
import { updateTaskColumn } from '@/app/actions/task-actions';
import {
  Search,
  Plus,
  Flag,
  CheckSquare,
  Clock,
} from 'lucide-react';

interface KanbanBoardProps {
  project: any;
  currentUser?: any;
  socket?: any;
  isDark?: boolean;
  onSelectTask: (task: any) => void;
  onOpenCreateModal: (columnId?: string) => void;
  onTaskMoved: (taskId: string, targetColumnId: string, newOrderIndex: number) => void;
}

export function KanbanBoard({
  project,
  currentUser,
  socket,
  isDark = true,
  onSelectTask,
  onOpenCreateModal,
  onTaskMoved,
}: KanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [onlyHighRisk, setOnlyHighRisk] = useState(false);
  const [onlyDueSoon, setOnlyDueSoon] = useState(false);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const filterTask = (task: any) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !task.issueKey.toLowerCase().includes(q) &&
        !task.title.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (selectedMilestone !== 'ALL' && task.milestoneId !== selectedMilestone) return false;
    if (onlyMyTasks && task.assigneeId !== currentUser?.id) return false;
    if (onlyHighRisk && task.riskLevel !== 'CRITICAL' && task.riskLevel !== 'HIGH') return false;
    if (onlyDueSoon && !task.dueDate) return false;
    return true;
  };

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

    let foundTask: any = null;
    project.columns.forEach((col: any) => {
      const t = col.tasks.find((item: any) => item.id === taskId);
      if (t) foundTask = t;
    });

    if (!foundTask || foundTask.columnId === targetColumnId) {
      setDraggedTaskId(null);
      return;
    }

    const newOrderIndex = Date.now() % 100000;
    onTaskMoved(taskId, targetColumnId, newOrderIndex);
    setDraggedTaskId(null);

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
        return <Flag className="w-3.5 h-3.5 text-red-500" />;
      case 'HIGH':
        return <Flag className="w-3.5 h-3.5 text-orange-400" />;
      case 'MEDIUM':
        return <Flag className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Flag className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  const getRiskIndicator = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            🔥 Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
            ⚠️ High
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Quick Filters Bar */}
      <div
        className={`px-6 py-3 border-b flex flex-wrap items-center gap-2.5 text-xs shrink-0 ${
          isDark ? 'bg-[#1D2125] border-[#2C333A]' : 'bg-white border-gray-200'
        }`}
      >
        <div className="relative w-56">
          <Search
            className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${
              isDark ? 'text-[#8C9BAB]' : 'text-gray-400'
            }`}
          />
          <input
            type="text"
            placeholder="Tìm task trên board..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 rounded-md border text-xs focus:outline-none focus:ring-2 focus:ring-[#579DFF] ${
              isDark
                ? 'bg-[#22272B] border-[#38414A] text-white placeholder-[#8C9BAB]'
                : 'bg-gray-50 border-gray-300 text-gray-900'
            }`}
          />
        </div>

        <select
          value={selectedMilestone}
          onChange={(e) => setSelectedMilestone(e.target.value)}
          className={`p-1.5 rounded-md border text-xs font-medium focus:outline-none ${
            isDark
              ? 'bg-[#22272B] border-[#38414A] text-[#B6C2CF]'
              : 'bg-white border-gray-300 text-gray-800'
          }`}
        >
          <option value="ALL">🎯 Tất cả giai đoạn</option>
          {(project.milestones || []).map((m: any) => (
            <option key={m.id} value={m.id}>
              🎯 {m.title}
            </option>
          ))}
        </select>

        <button
          onClick={() => setOnlyMyTasks(!onlyMyTasks)}
          className={`px-2.5 py-1.5 rounded-md border font-medium transition-all cursor-pointer ${
            onlyMyTasks
              ? 'bg-[#0C66E4] text-white border-[#0C66E4]'
              : isDark
              ? 'bg-[#22272B] text-[#B6C2CF] border-[#38414A] hover:bg-[#2C333A]'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          👤 Việc của tôi
        </button>

        <button
          onClick={() => setOnlyHighRisk(!onlyHighRisk)}
          className={`px-2.5 py-1.5 rounded-md border font-medium transition-all cursor-pointer ${
            onlyHighRisk
              ? 'bg-red-600 text-white border-red-600'
              : isDark
              ? 'bg-[#22272B] text-[#B6C2CF] border-[#38414A] hover:bg-[#2C333A]'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          🔥 Rủi ro cao
        </button>

        <button
          onClick={() => setOnlyDueSoon(!onlyDueSoon)}
          className={`px-2.5 py-1.5 rounded-md border font-medium transition-all cursor-pointer ${
            onlyDueSoon
              ? 'bg-amber-600 text-white border-amber-600'
              : isDark
              ? 'bg-[#22272B] text-[#B6C2CF] border-[#38414A] hover:bg-[#2C333A]'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          ⏰ Có hạn chót
        </button>
      </div>

      {/* 4 Columns Kanban Canvas */}
      <div
        className={`flex-1 p-6 overflow-x-auto ${
          isDark ? 'bg-[#1D2125]' : 'bg-[#F4F5F7]'
        }`}
      >
        <div className="flex gap-4 h-full items-start">
          {project.columns.map((column: any) => {
            const filteredTasks = (column.tasks || []).filter(filterTask);
            const isOver = dragOverColumnId === column.id;

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`w-72 shrink-0 max-h-full flex flex-col rounded-xl border transition-all ${
                  isOver
                    ? 'border-[#579DFF] ring-2 ring-[#579DFF]/40'
                    : isDark
                    ? 'border-[#2C333A] bg-[#161A1D]'
                    : 'border-gray-200 bg-[#EBECF0]'
                }`}
              >
                {/* Column Header */}
                <div
                  className={`p-3 flex items-center justify-between border-b ${
                    isDark ? 'border-[#2C333A]' : 'border-gray-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: column.colorHex }}
                    />
                    <h3
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isDark ? 'text-[#9FADBC]' : 'text-gray-800'
                      }`}
                    >
                      {column.title}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isDark
                        ? 'bg-[#22272B] text-[#9FADBC] border-[#38414A]'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {filteredTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 min-h-[120px]">
                  {filteredTasks.map((task: any) => {
                    const completedChecklists =
                      task.checklists?.filter((c: any) => c.isCompleted).length || 0;
                    const totalChecklists = task.checklists?.length || 0;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => onSelectTask(task)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer group space-y-2.5 ${
                          isDark
                            ? 'bg-[#22272B] border-[#2C333A] hover:border-[#579DFF]'
                            : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-[#579DFF] bg-[#0C66E4]/15 px-2 py-0.5 rounded">
                            {task.issueKey}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {getRiskIndicator(task.riskLevel)}
                            {getPriorityIcon(task.priority)}
                          </div>
                        </div>

                        <h4
                          className={`text-xs font-semibold leading-snug line-clamp-2 ${
                            isDark ? 'text-[#DEE4EA]' : 'text-gray-900'
                          }`}
                        >
                          {task.title}
                        </h4>

                        {totalChecklists > 0 && (
                          <div className="flex items-center gap-2 text-[11px] opacity-75">
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>
                              {completedChecklists}/{totalChecklists}
                            </span>
                            <div
                              className={`flex-1 rounded-full h-1.5 overflow-hidden ${
                                isDark ? 'bg-[#2C333A]' : 'bg-gray-200'
                              }`}
                            >
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{
                                  width: `${(completedChecklists / totalChecklists) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div
                          className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                            isDark
                              ? 'border-[#2C333A] text-[#8C9BAB]'
                              : 'border-gray-100 text-gray-500'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {task.dueDate ? (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                                </span>
                              </>
                            ) : (
                              <span>No due date</span>
                            )}
                          </div>

                          <div
                            title={task.assignee?.fullName || 'Unassigned'}
                            className="w-5 h-5 rounded-full bg-[#0C66E4] text-white flex items-center justify-center text-[9px] font-bold"
                          >
                            {task.assignee?.fullName?.charAt(0) || '?'}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredTasks.length === 0 && (
                    <div
                      className={`p-4 text-center text-xs border border-dashed rounded-lg ${
                        isDark
                          ? 'border-[#2C333A] text-[#6B778C]'
                          : 'border-gray-300 text-gray-400'
                      }`}
                    >
                      Trống
                    </div>
                  )}
                </div>

                {/* Add Task Button */}
                <div className="p-2 pt-0">
                  <button
                    onClick={() => onOpenCreateModal(column.id)}
                    className={`w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isDark
                        ? 'text-[#9FADBC] hover:bg-[#22272B] hover:text-white'
                        : 'text-gray-600 hover:bg-gray-300/60'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm công việc
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
