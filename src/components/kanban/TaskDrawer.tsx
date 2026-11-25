'use client';

import React, { useState, useEffect } from 'react';
import {
  toggleChecklistItem,
  addChecklistItem,
  updateTaskFields,
  deleteTask,
} from '@/app/actions/task-actions';
import {
  ProjectPermissions,
  canUserModifyTaskStatus,
  canUserToggleChecklist,
  isDoneColumnTitle,
} from '@/lib/rbac';
import {
  X,
  Calendar,
  Clock,
  CheckSquare,
  Tag,
  Plus,
  Trash2,
} from 'lucide-react';

interface TaskDrawerProps {
  task: any | null;
  project?: any;
  currentUser?: any;
  permissions?: ProjectPermissions;
  isDark?: boolean;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: any) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function TaskDrawer({
  task,
  project,
  currentUser,
  permissions,
  isDark = true,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDrawerProps) {
  const [checklists, setChecklists] = useState<any[]>(task?.checklists || []);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [addingChecklist, setAddingChecklist] = useState(false);

  useEffect(() => {
    setChecklists(task?.checklists || []);
  }, [task]);

  if (!task) return null;

  const completedCount = checklists.filter((c: any) => c.isCompleted).length;
  const progressPercent =
    checklists.length > 0 ? Math.round((completedCount / checklists.length) * 100) : 0;

  const canEditStatus = permissions
    ? canUserModifyTaskStatus(permissions.role, task.assigneeId, currentUser?.id)
    : true;
  const canEditChecklist = permissions
    ? canUserToggleChecklist(permissions.role, task.assigneeId, currentUser?.id)
    : true;
  const canDelete = permissions ? permissions.canDeleteTask : true;
  const canEditMeta = permissions ? permissions.canEditTaskMeta : true;
  const canAssign = permissions ? permissions.canAssignOthers : true;
  const canMoveDone = permissions ? permissions.canMoveToDone : true;

  const handleToggleChecklist = async (id: string, currentStatus: boolean) => {
    if (!canEditChecklist) return;
    setUpdatingId(id);
    const newStatus = !currentStatus;

    const updatedList = checklists.map((c) =>
      c.id === id ? { ...c, isCompleted: newStatus } : c
    );
    setChecklists(updatedList);

    const res = await toggleChecklistItem(id, newStatus);
    setUpdatingId(null);
    if (res.success && onTaskUpdated) {
      onTaskUpdated({ ...task, checklists: updatedList });
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditChecklist || !newChecklistTitle.trim()) return;
    setAddingChecklist(true);
    const res = await addChecklistItem(task.id, newChecklistTitle.trim(), project?.id);
    setAddingChecklist(false);

    if (res.success && res.checklist) {
      const updatedList = [...checklists, res.checklist];
      setChecklists(updatedList);
      setNewChecklistTitle('');
      if (onTaskUpdated) {
        onTaskUpdated({ ...task, checklists: updatedList });
      }
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleFieldUpdate = async (patch: any) => {
    if (!project?.id) return;
    const res = await updateTaskFields(task.id, project.id, patch);
    if (res.success && res.task && onTaskUpdated) {
      onTaskUpdated(res.task);
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleDelete = async () => {
    if (!project?.id || !canDelete) return;
    if (!confirm(`Xóa công việc ${task.issueKey} - "${task.title}"?`)) return;
    const res = await deleteTask(task.id, project.id);
    if (res.success) {
      if (onTaskDeleted) onTaskDeleted(task.id);
      onClose();
    } else if (res.error) {
      alert(res.error);
    }
  };

  const selectClass = isDark
    ? 'w-full px-2.5 py-1.5 rounded-lg border border-[#38414A] bg-[#1D2125] text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#579DFF]'
    : 'w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="flex-1" onClick={onClose}></div>

      <div
        className={`w-full max-w-2xl shadow-2xl h-full flex flex-col border-l overflow-hidden ${
          isDark
            ? 'bg-[#22272B] border-[#38414A] text-[#B6C2CF]'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Drawer Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'border-[#2C333A] bg-[#1D2125]' : 'border-gray-200 bg-gray-50/70'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#0C66E4]/20 text-[#579DFF] border border-[#0C66E4]/40">
              {task.issueKey}
            </span>
            {task.milestone && (
              <span
                className={`text-xs px-2 py-0.5 rounded border ${
                  isDark
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}
              >
                🎯 {task.milestone.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {project?.id && canDelete && (
              <button
                onClick={handleDelete}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'text-[#8C9BAB] hover:text-red-400 hover:bg-red-500/10'
                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                }`}
                title="Xóa công việc (ADMIN / PM)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#8C9BAB] hover:text-white hover:bg-[#2C333A]'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <h2 className={`text-lg font-bold leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {task.title}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column (2/3) */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Mô Tả Công Việc
                </label>
                <div
                  className={`p-3.5 rounded-lg border text-sm leading-relaxed whitespace-pre-line ${
                    isDark
                      ? 'border-[#2C333A] bg-[#1D2125] text-[#DEE4EA]'
                      : 'border-gray-200 bg-gray-50/50 text-gray-800'
                  }`}
                >
                  {task.description || 'Chưa có mô tả chi tiết cho công việc này.'}
                </div>
              </div>

              {/* Action Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Action Checklist
                  </label>
                  <span className="text-xs font-mono font-semibold">
                    {completedCount}/{checklists.length} ({progressPercent}%)
                  </span>
                </div>

                <div
                  className={`w-full rounded-full h-2 overflow-hidden ${
                    isDark ? 'bg-[#1D2125]' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="space-y-2 pt-1">
                  {checklists.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(item.id, item.isCompleted)}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        item.isCompleted
                          ? isDark
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-[#8C9BAB] line-through'
                            : 'bg-emerald-50/60 border-emerald-200 text-gray-500 line-through'
                          : isDark
                          ? 'bg-[#1D2125] border-[#2C333A] hover:border-[#579DFF] text-[#DEE4EA]'
                          : 'bg-white border-gray-200 hover:border-blue-300 text-gray-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => {}}
                        disabled={updatingId === item.id}
                        className="mt-0.5 w-4 h-4 rounded accent-[#0C66E4] cursor-pointer"
                      />
                      <span className="text-xs flex-1">{item.title}</span>
                    </div>
                  ))}
                </div>

                {/* Add new checklist item */}
                {canEditChecklist && (
                  <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Thêm bước cần làm..."
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      className={`flex-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[#579DFF] ${
                        isDark
                          ? 'bg-[#1D2125] border-[#38414A] text-white placeholder-[#6B778C]'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={addingChecklist}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm
                    </button>
                  </form>
                )}
              </div>

              {/* Activity Logs */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Lịch Sử Hoạt Động
                </label>
                <div
                  className={`space-y-2 border-l-2 pl-3 ml-1 ${
                    isDark ? 'border-[#38414A]' : 'border-gray-200'
                  }`}
                >
                  {task.activityLogs && task.activityLogs.length > 0 ? (
                    task.activityLogs.map((log: any) => (
                      <div key={log.id} className="text-xs space-y-0.5">
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {log.user?.fullName || 'Hệ thống'}
                        </span>
                        <span className="ml-1.5 opacity-70">[{log.action}]</span>
                        <div className="opacity-50 text-[11px]">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs opacity-60">Chưa có lịch sử thay đổi.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column (1/3 Metadata & Inline Controls) */}
            <div
              className={`space-y-4 p-4 rounded-xl border text-xs h-fit ${
                isDark ? 'border-[#2C333A] bg-[#1D2125]' : 'border-gray-200 bg-gray-50/70'
              }`}
            >
              {/* Status */}
              {project?.columns && (
                <div className="space-y-1">
                  <span className="opacity-70 font-medium">Trạng thái (Status):</span>
                  <select
                    value={task.columnId}
                    disabled={!canEditStatus}
                    onChange={(e) => handleFieldUpdate({ columnId: e.target.value })}
                    className={`${selectClass} disabled:opacity-60`}
                  >
                    {project.columns.map((c: any) => {
                      const lockedDone = isDoneColumnTitle(c.title) && !canMoveDone;
                      return (
                        <option key={c.id} value={c.id} disabled={lockedDone}>
                          {c.title}
                          {lockedDone ? ' (Chỉ PM/Admin)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Assignee */}
              {project?.members && (
                <div className="space-y-1">
                  <span className="opacity-70 font-medium">Người làm (Assignee):</span>
                  <select
                    value={task.assigneeId || ''}
                    disabled={!canAssign}
                    onChange={(e) => handleFieldUpdate({ assigneeId: e.target.value || null })}
                    className={`${selectClass} disabled:opacity-60`}
                  >
                    <option value="">Unassigned</option>
                    {project.members.map((m: any) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority */}
              <div className="space-y-1">
                <span className="opacity-70 font-medium">Độ ưu tiên (Priority):</span>
                <select
                  value={task.priority}
                  disabled={!canEditMeta}
                  onChange={(e) => handleFieldUpdate({ priority: e.target.value })}
                  className={`${selectClass} disabled:opacity-60`}
                >
                  <option value="BLOCKER">Highest / Blocker</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Risk Level */}
              <div className="space-y-1">
                <span className="opacity-70 font-medium">Mức Rủi Ro:</span>
                <select
                  value={task.riskLevel}
                  disabled={!canEditMeta}
                  onChange={(e) => handleFieldUpdate({ riskLevel: e.target.value })}
                  className={`${selectClass} disabled:opacity-60`}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <span className="opacity-70 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Hạn chót (Due date):
                </span>
                <input
                  type="date"
                  disabled={!canEditMeta}
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFieldUpdate({ dueDate: e.target.value || null })}
                  className={`${selectClass} disabled:opacity-60`}
                />
              </div>

              <hr className={isDark ? 'border-[#2C333A]' : 'border-gray-200'} />

              <div className="space-y-1">
                <span className="opacity-70 font-medium">Người giao (Reporter):</span>
                <div className="font-semibold">{task.reporter?.fullName || 'Admin'}</div>
              </div>

              <div className="space-y-1">
                <span className="opacity-70 font-medium">Ngày tạo:</span>
                <div className="opacity-80">
                  {new Date(task.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
