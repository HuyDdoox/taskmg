'use client';

import React, { useState } from 'react';
import { toggleChecklistItem } from '@/app/actions/task-actions';
import { 
  X, Calendar, Clock, AlertTriangle, Flag, CheckSquare, 
  MessageSquare, User, Tag, Plus, CheckCircle2 
} from 'lucide-react';

interface TaskDrawerProps {
  task: any | null;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export function TaskDrawer({ task, onClose, onTaskUpdated }: TaskDrawerProps) {
  if (!task) return null;

  const [checklists, setChecklists] = useState(task.checklists || []);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const completedCount = checklists.filter((c: any) => c.isCompleted).length;
  const progressPercent = checklists.length > 0 
    ? Math.round((completedCount / checklists.length) * 100) 
    : 0;

  const handleToggleChecklist = async (id: string, currentStatus: boolean) => {
    setUpdatingId(id);
    const newStatus = !currentStatus;
    
    // Optimistic UI update
    setChecklists((prev: any[]) =>
      prev.map((c) => (c.id === id ? { ...c, isCompleted: newStatus } : c))
    );

    const res = await toggleChecklistItem(id, newStatus);
    setUpdatingId(null);
    if (res.success && onTaskUpdated) {
      onTaskUpdated();
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-red-500/10 text-red-600 border border-red-200">🔥 Rủi ro Nghiêm trọng (Critical)</span>;
      case 'HIGH':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-orange-500/10 text-orange-600 border border-orange-200">⚠️ Rủi ro Cao (High)</span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-yellow-500/10 text-yellow-700 border border-yellow-200">⚡ Rủi ro Vừa (Medium)</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">🛡️ Rủi ro Thấp (Low)</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'BLOCKER':
        return <span className="text-xs font-bold text-red-600 flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> Blocker (Khẩn cấp)</span>;
      case 'HIGH':
        return <span className="text-xs font-semibold text-orange-600 flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> High (Ưu tiên cao)</span>;
      case 'MEDIUM':
        return <span className="text-xs font-medium text-yellow-600 flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> Medium (Bình thường)</span>;
      default:
        return <span className="text-xs text-blue-600 flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> Low (Ưu tiên thấp)</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose}></div>

      {/* Slide-over Drawer Panel */}
      <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col border-l border-gray-200 overflow-hidden transform transition-transform duration-300">
        
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {task.issueKey}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-800">
              {task.column?.title || 'Trạng thái'}
            </span>
            {task.milestone && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                🎯 {task.milestone.title}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body: 2 Columns */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Tiêu đề Task */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-snug">
              {task.title}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-6">
            
            {/* Cột trái (Nội dung chính: 2/3) */}
            <div className="col-span-2 space-y-6">
              
              {/* 1. MÔ TẢ CÔNG VIỆC (JOB DESCRIPTION / OVERVIEW) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> 1. Mô Tả Công Việc (Overview & Goal)
                </label>
                <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                  {task.description || 'Chưa có mô tả chi tiết cho công việc này.'}
                </div>
              </div>

              {/* 2. CHI TIẾT VIỆC PHẢI LÀM (ACTION CHECKLIST) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> 2. Chi Tiết Việc Phải Làm (Action Checklist)
                  </label>
                  <span className="text-xs font-semibold text-gray-600">
                    {completedCount}/{checklists.length} ({progressPercent}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>

                {/* Checklist items list */}
                <div className="space-y-2 pt-1">
                  {checklists.length > 0 ? (
                    checklists.map((item: any) => (
                      <div 
                        key={item.id}
                        onClick={() => handleToggleChecklist(item.id, item.isCompleted)}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                          item.isCompleted 
                            ? 'bg-emerald-50/60 border-emerald-200 text-gray-500 line-through' 
                            : 'bg-white border-gray-200 hover:border-blue-300 text-gray-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => {}}
                          disabled={updatingId === item.id}
                          className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm flex-1">{item.title}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 italic p-3 border border-dashed rounded-lg text-center">
                      Chưa có bước checklist cụ thể.
                    </div>
                  )}
                </div>
              </div>

              {/* 3. LỊCH SỬ HOẠT ĐỘNG (ACTIVITY AUDIT LOGS) */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 3. Lịch Sử Hoạt Động (Audit Trail)
                </label>
                <div className="space-y-2 border-l-2 border-gray-200 pl-3 ml-1">
                  {task.activityLogs && task.activityLogs.length > 0 ? (
                    task.activityLogs.map((log: any) => (
                      <div key={log.id} className="text-xs text-gray-600 space-y-0.5">
                        <span className="font-semibold text-gray-900">{log.user?.fullName || 'Hệ thống'}</span>
                        <span className="ml-1.5 text-gray-500">[{log.action}]</span>
                        <div className="text-gray-400 text-[11px]">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400">Chưa có lịch sử thay đổi.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Cột phải (Thông số & Quản trị: 1/3) */}
            <div className="space-y-5 p-4 rounded-xl border border-gray-200 bg-gray-50/70 text-xs">
              
              {/* Mức độ Rủi ro (Risk Level) */}
              <div className="space-y-1.5">
                <span className="text-gray-500 font-medium">Mức độ Rủi ro (Risk Level):</span>
                <div>{getRiskBadge(task.riskLevel)}</div>
              </div>

              {/* Độ ưu tiên (Priority) */}
              <div className="space-y-1.5">
                <span className="text-gray-500 font-medium">Độ ưu tiên (Priority):</span>
                <div>{getPriorityBadge(task.priority)}</div>
              </div>

              {/* Người phụ trách (Assignee) */}
              <div className="space-y-1.5">
                <span className="text-gray-500 font-medium">Người làm (Assignee):</span>
                <div className="flex items-center gap-2 font-medium text-gray-800">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {task.assignee?.fullName?.charAt(0) || 'A'}
                  </div>
                  <span>{task.assignee?.fullName || 'Chưa gán'}</span>
                </div>
              </div>

              {/* Người giao việc (Reporter) */}
              <div className="space-y-1.5">
                <span className="text-gray-500 font-medium">Người giao (Reporter):</span>
                <div className="flex items-center gap-2 font-medium text-gray-800">
                  <div className="w-6 h-6 rounded-full bg-gray-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {task.reporter?.fullName?.charAt(0) || 'S'}
                  </div>
                  <span>{task.reporter?.fullName || 'Sếp'}</span>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Hạn chót (Due date) */}
              <div className="space-y-1">
                <span className="text-gray-500 font-medium">Hạn chót (Deadline):</span>
                <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có'}
                </div>
              </div>

              {/* Ngày tạo (Created At) */}
              <div className="space-y-1">
                <span className="text-gray-500 font-medium">Ngày tạo (Created at):</span>
                <div className="text-gray-700">
                  {new Date(task.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              {/* Ngày cập nhật (Updated At) */}
              <div className="space-y-1">
                <span className="text-gray-500 font-medium">Cập nhật lần cuối:</span>
                <div className="text-gray-700">
                  {new Date(task.updatedAt).toLocaleString('vi-VN')}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
