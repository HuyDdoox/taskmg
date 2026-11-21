'use client';

import React, { useState } from 'react';
import { createQuickTask } from '@/app/actions/task-actions';
import { X, Plus, AlertTriangle, Flag, Calendar } from 'lucide-react';

interface CreateTaskModalProps {
  columns: any[];
  milestones: any[];
  defaultColumnId?: string;
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

export function CreateTaskModal({
  columns,
  milestones,
  defaultColumnId,
  isOpen,
  onClose,
  onTaskCreated,
}: CreateTaskModalProps) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId || columns[0]?.id || '');
  const [priority, setPriority] = useState('MEDIUM');
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [issueType, setIssueType] = useState('TASK');
  const [milestoneId, setMilestoneId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const res = await createQuickTask({
      title: title.trim(),
      description: description.trim(),
      columnId,
      priority,
      riskLevel,
      issueType,
      milestoneId: milestoneId || undefined,
      dueDate: dueDate || undefined,
    });

    setIsSubmitting(false);
    if (res.success) {
      setTitle('');
      setDescription('');
      onTaskCreated();
      onClose();
    } else {
      alert(res.error || 'Có lỗi xảy ra khi tạo Task');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-scale-in">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h3 className="font-bold text-gray-900 text-base">Tạo Công Việc Mới (Jira Issue)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Loại công việc (Issue Type) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Loại Công Việc:</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="TASK">🟢 Task (Công việc thường)</option>
                <option value="STORY">🔵 Story (Tính năng mới)</option>
                <option value="BUG">🔴 Bug (Lỗi phần mềm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cột Trạng Thái:</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tiêu đề */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tiêu Đề Công Việc <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              required
              placeholder="VD: Cắt giao diện Bảng Kanban kéo thả..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm p-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mô Tả Công Việc (Job Overview & Goal):
            </label>
            <textarea
              rows={3}
              placeholder="Nêu rõ mục tiêu công việc, yêu cầu kỹ thuật..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Độ ưu tiên & Mức rủi ro */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Độ Ưu Tiên (Priority):
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low (Thấp)</option>
                <option value="MEDIUM">Medium (Vừa)</option>
                <option value="HIGH">High (Cao)</option>
                <option value="BLOCKER">🔥 Blocker (Khẩn cấp)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mức Độ Rủi Ro (Risk Level):
              </label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">🛡️ Rủi ro Thấp (Low)</option>
                <option value="MEDIUM">⚡ Rủi ro Vừa (Medium)</option>
                <option value="HIGH">⚠️ Rủi ro Cao (High)</option>
                <option value="CRITICAL">🔥 Rủi ro Nghiêm Trọng (Critical)</option>
              </select>
            </div>
          </div>

          {/* Giai đoạn & Hạn chót */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Giai Đoạn (Milestone):
              </label>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Không gắn --</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>🎯 {m.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Hạn Chót (Deadline):
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Đang tạo...' : '+ Tạo Task'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
