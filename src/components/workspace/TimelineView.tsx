'use client';

import React, { useState } from 'react';
import { createMilestone } from '@/app/actions/project-actions';
import { Calendar, Plus, Target, ChevronDown, ChevronRight, X } from 'lucide-react';

interface TimelineViewProps {
  project: any;
  tasks: any[];
  isDark: boolean;
  onSelectTask: (task: any) => void;
  onMilestoneCreated: (milestone: any) => void;
}

export function TimelineView({
  project,
  tasks,
  isDark,
  onSelectTask,
  onMilestoneCreated,
}: TimelineViewProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [submitting, setSubmitting] = useState(false);

  const milestones = project.milestones || [];
  const unassignedTasks = tasks.filter((t) => !t.milestoneId);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const res = await createMilestone({
      projectId: project.id,
      title,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status,
    });
    setSubmitting(false);

    if (res.success && res.milestone) {
      onMilestoneCreated(res.milestone);
      setTitle('');
      setStartDate('');
      setEndDate('');
      setIsAddOpen(false);
    } else {
      alert(res.error || 'Không thể tạo giai đoạn');
    }
  };

  const doneCol = project.columns.find(
    (c: any) => c.title.toLowerCase().includes('done') || c.position === 3
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Lộ trình Dự án (Timeline / Roadmap)
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
              Theo dõi tiến độ các Giai đoạn (Milestones / Sprints) và hạn chót từng công việc.
            </p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Giai Đoạn
          </button>
        </div>

        {/* Milestones Roadmap List */}
        <div className="space-y-3">
          {milestones.map((m: any) => {
            const mTasks = tasks.filter((t) => t.milestoneId === m.id);
            const doneCount = doneCol
              ? mTasks.filter((t) => t.columnId === doneCol.id).length
              : 0;
            const pct = mTasks.length > 0 ? Math.round((doneCount / mTasks.length) * 100) : 0;
            const isOpen = expanded[m.id] !== false; // default expanded

            return (
              <div
                key={m.id}
                className={`rounded-xl border overflow-hidden ${
                  isDark ? 'bg-[#22272B] border-[#2C333A]' : 'bg-white border-gray-200'
                }`}
              >
                {/* Milestone Row */}
                <div
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [m.id]: !isOpen }))
                  }
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                    isDark ? 'hover:bg-[#2C333A]/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    )}
                    <Target className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <div className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {m.title}
                      </div>
                      <div className={`text-[11px] flex items-center gap-2 mt-0.5 ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
                        <Calendar className="w-3 h-3" />
                        <span>
                          {m.startDate ? new Date(m.startDate).toLocaleDateString('vi-VN') : 'Chưa đặt'}
                          {' → '}
                          {m.endDate ? new Date(m.endDate).toLocaleDateString('vi-VN') : 'Chưa đặt'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Progress Bar */}
                  <div className="flex items-center gap-4 sm:w-80">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>
                          {doneCount}/{mTasks.length} tasks
                        </span>
                        <span className="font-mono font-bold text-emerald-400">{pct}%</span>
                      </div>
                      <div
                        className={`w-full h-2.5 rounded-full overflow-hidden ${
                          isDark ? 'bg-[#1D2125]' : 'bg-gray-200'
                        }`}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-[#0C66E4] to-emerald-400 rounded-full transition-all"
                          style={{ width: `${Math.max(pct, mTasks.length > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks inside Milestone */}
                {isOpen && (
                  <div
                    className={`border-t divide-y ${
                      isDark ? 'border-[#2C333A] divide-[#2C333A]' : 'border-gray-100 divide-gray-100'
                    }`}
                  >
                    {mTasks.length === 0 ? (
                      <div className={`px-10 py-3 text-xs italic ${isDark ? 'text-[#6B778C]' : 'text-gray-400'}`}>
                        Chưa có công việc nào gắn vào giai đoạn này.
                      </div>
                    ) : (
                      mTasks.map((t: any) => {
                        const col = project.columns.find((c: any) => c.id === t.columnId);
                        return (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            className={`px-10 py-2.5 flex items-center justify-between gap-4 text-xs cursor-pointer ${
                              isDark ? 'hover:bg-[#1D2125]' : 'hover:bg-blue-50/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono font-bold text-[#579DFF] shrink-0">
                                {t.issueKey}
                              </span>
                              <span className={`truncate ${isDark ? 'text-[#DEE4EA]' : 'text-gray-800'}`}>
                                {t.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                                style={{ backgroundColor: col?.colorHex || '#6B7280' }}
                              >
                                {col?.title || 'To Do'}
                              </span>
                              <span className={`text-[11px] font-mono w-20 text-right ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
                                {t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : '—'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned to any Milestone */}
          {unassignedTasks.length > 0 && (
            <div
              className={`rounded-xl border overflow-hidden ${
                isDark ? 'bg-[#22272B] border-[#2C333A]' : 'bg-white border-gray-200'
              }`}
            >
              <div className={`p-3.5 text-xs font-bold ${isDark ? 'text-[#9FADBC]' : 'text-gray-700'}`}>
                Công việc chưa gắn giai đoạn ({unassignedTasks.length})
              </div>
              <div
                className={`border-t divide-y ${
                  isDark ? 'border-[#2C333A] divide-[#2C333A]' : 'border-gray-100 divide-gray-100'
                }`}
              >
                {unassignedTasks.map((t: any) => {
                  const col = project.columns.find((c: any) => c.id === t.columnId);
                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className={`px-6 py-2.5 flex items-center justify-between gap-4 text-xs cursor-pointer ${
                        isDark ? 'hover:bg-[#1D2125]' : 'hover:bg-blue-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono font-bold text-[#579DFF]">{t.issueKey}</span>
                        <span className="truncate">{t.title}</span>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: col?.colorHex || '#6B7280' }}
                      >
                        {col?.title || 'To Do'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Milestone Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div
            className={`w-full max-w-md rounded-xl border shadow-2xl overflow-hidden ${
              isDark ? 'bg-[#22272B] border-[#38414A]' : 'bg-white border-gray-200'
            }`}
          >
            <div
              className={`px-5 py-3.5 border-b flex items-center justify-between ${
                isDark ? 'border-[#2C333A] bg-[#1D2125]' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Thêm Giai Đoạn (Milestone / Sprint)
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddMilestone} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Tên Giai Đoạn *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Sprint 2 - Thanh toán & Báo cáo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="UPCOMING">Sắp tới (Upcoming)</option>
                  <option value="IN_PROGRESS">Đang chạy (In Progress)</option>
                  <option value="COMPLETED">Đã xong (Completed)</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className={`px-3.5 py-2 rounded-lg border ${
                    isDark ? 'border-[#38414A]' : 'border-gray-300'
                  }`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : '+ Tạo Giai Đoạn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
