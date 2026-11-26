'use client';

import React, { useState, useEffect } from 'react';
import { createQuickTask } from '@/app/actions/task-actions';
import { ProjectPermissions } from '@/lib/rbac';
interface CreateTaskModalProps {
  projectId: string;
  columns: any[];
  milestones: any[];
  members?: any[];
  currentUserId?: string;
  permissions?: ProjectPermissions;
  defaultColumnId?: string;
  isDark?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: any) => void;
}

export function CreateTaskModal({
  projectId,
  columns,
  milestones,
  members = [],
  currentUserId,
  permissions,
  defaultColumnId,
  isDark = true,
  isOpen,
  onClose,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId || columns[0]?.id || '');
  const [priority, setPriority] = useState('MEDIUM');
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [issueType, setIssueType] = useState('TASK');
  const [milestoneId, setMilestoneId] = useState('');
  const [assigneeId, setAssigneeId] = useState(currentUserId || '');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultColumnId) {
      setColumnId(defaultColumnId);
    } else if (columns[0]?.id) {
      setColumnId(columns[0].id);
    }
  }, [defaultColumnId, columns, isOpen]);

  useEffect(() => {
    if (currentUserId && !assigneeId) {
      setAssigneeId(currentUserId);
    }
  }, [currentUserId, assigneeId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const res = await createQuickTask({
      projectId,
      title: title.trim(),
      description: description.trim(),
      columnId: columnId || columns[0]?.id,
      priority,
      riskLevel,
      issueType,
      milestoneId: milestoneId || undefined,
      assigneeId: assigneeId || undefined,
      reporterId: currentUserId || undefined,
      dueDate: dueDate || undefined,
    });

    setIsSubmitting(false);
    if (res.success && res.task) {
      setTitle('');
      setDescription('');
      setDueDate('');
      onTaskCreated(res.task);
      onClose();
    } else {
      alert(res.error || 'Có lỗi xảy ra khi tạo Task');
    }
  };

  const inputClass = isDark
    ? 'w-full text-xs p-2 rounded-lg border border-[#38414A] bg-[#1D2125] text-white focus:outline-none focus:ring-2 focus:ring-[#579DFF]'
    : 'w-full text-xs p-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

  const labelClass = isDark
    ? 'block text-xs font-semibold text-[#B6C2CF] mb-1'
    : 'block text-xs font-semibold text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className={`rounded-xl shadow-2xl border w-full max-w-lg overflow-hidden ${
          isDark ? 'bg-[#22272B] border-[#38414A] text-[#B6C2CF]' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'border-[#2C333A] bg-[#1D2125]' : 'border-gray-200 bg-gray-50/70'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0C66E4]"></span>
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Tạo Công Việc Mới (Create Issue)
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded cursor-pointer ${
              isDark ? 'text-[#8C9BAB] hover:text-white' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Loại Công Việc:</label>
              <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className={inputClass}>
                <option value="TASK">🟢 Task (Công việc)</option>
                <option value="STORY">🔵 Story (Tính năng)</option>
                <option value="BUG">🔴 Bug (Lỗi)</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Trạng Thái (Status):</label>
              <select value={columnId} onChange={(e) => setColumnId(e.target.value)} className={inputClass}>
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Tiêu Đề Công Việc <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              required
              placeholder="VD: Thiết kế API đăng nhập..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Mô Tả Công Việc:</label>
            <textarea
              rows={3}
              placeholder="Nêu rõ mục tiêu công việc, yêu cầu kỹ thuật..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Người thực hiện (Assignee):</label>
              <select
                value={assigneeId}
                disabled={permissions && !permissions.canAssignOthers}
                onChange={(e) => setAssigneeId(e.target.value)}
                className={`${inputClass} disabled:opacity-60`}
              >
                <option value="">-- Chưa gán --</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.fullName} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Độ Ưu Tiên (Priority):</label>
              <select
                value={priority}
                disabled={permissions && !permissions.canEditTaskMeta}
                onChange={(e) => setPriority(e.target.value)}
                className={`${inputClass} disabled:opacity-60`}
              >
                <option value="LOW">Low (Thấp)</option>
                <option value="MEDIUM">Medium (Vừa)</option>
                <option value="HIGH">High (Cao)</option>
                <option value="BLOCKER">🔥 Highest / Blocker</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Mức Rủi Ro:</label>
              <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className={inputClass}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Giai Đoạn:</label>
              <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} className={inputClass}>
                <option value="">-- Không gắn --</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Hạn Chót:</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div
            className={`pt-3 border-t flex justify-end gap-2 ${
              isDark ? 'border-[#2C333A]' : 'border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                isDark
                  ? 'border-[#38414A] text-[#B6C2CF] hover:bg-[#2C333A]'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Đang tạo...' : '+ Tạo Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
