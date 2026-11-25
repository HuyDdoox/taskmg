'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Users,
  TrendingUp,
} from 'lucide-react';

interface SummaryViewProps {
  project: any;
  tasks: any[];
  isDark: boolean;
}

export function SummaryView({ project, tasks, isDark }: SummaryViewProps) {
  const totalTasks = tasks.length;

  const doneCol = project.columns.find(
    (c: any) => c.title.toLowerCase().includes('done') || c.position === 3
  );
  const doneCount = doneCol
    ? tasks.filter((t) => t.columnId === doneCol.id).length
    : 0;

  const inProgressCount = tasks.filter((t) => {
    const col = project.columns.find((c: any) => c.id === t.columnId);
    const title = (col?.title || '').toLowerCase();
    return title.includes('progress') || title.includes('review');
  }).length;

  const highRiskCount = tasks.filter(
    (t) => t.riskLevel === 'CRITICAL' || t.riskLevel === 'HIGH' || t.priority === 'BLOCKER'
  ).length;

  const completionPct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const cardClass = isDark
    ? 'bg-[#22272B] border-[#2C333A] text-[#B6C2CF]'
    : 'bg-white border-gray-200 text-gray-800';

  const priorityGroups = [
    { key: 'BLOCKER', label: 'Highest / Blocker', color: 'bg-red-500' },
    { key: 'HIGH', label: 'High', color: 'bg-orange-500' },
    { key: 'MEDIUM', label: 'Medium', color: 'bg-amber-400' },
    { key: 'LOW', label: 'Low', color: 'bg-sky-500' },
  ];

  const teamStats = (project.members || []).map((m: any) => {
    const memberTasks = tasks.filter((t) => t.assigneeId === m.user.id);
    const memberDone = doneCol
      ? memberTasks.filter((t) => t.columnId === doneCol.id).length
      : 0;
    const pct = memberTasks.length > 0 ? Math.round((memberDone / memberTasks.length) * 100) : 0;
    return {
      ...m,
      total: memberTasks.length,
      done: memberDone,
      pct,
    };
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl border ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium opacity-75">Tổng số công việc</span>
              <ListTodo className="w-4 h-4 text-[#579DFF]" />
            </div>
            <div className={`text-2xl font-bold mt-2 font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {totalTasks}
            </div>
            <div className="text-[11px] mt-1 opacity-70">Trong {project.columns.length} trạng thái</div>
          </div>

          <div className={`p-4 rounded-xl border ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium opacity-75">Hoàn thành (Done)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono text-emerald-400">
              {doneCount} <span className="text-sm font-normal">({completionPct}%)</span>
            </div>
            <div className="text-[11px] mt-1 opacity-70">Tỷ lệ hoàn thành dự án</div>
          </div>

          <div className={`p-4 rounded-xl border ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium opacity-75">Đang thực hiện</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono text-sky-400">
              {inProgressCount}
            </div>
            <div className="text-[11px] mt-1 opacity-70">In Progress & In Review</div>
          </div>

          <div className={`p-4 rounded-xl border ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium opacity-75">Ưu tiên / Rủi ro cao</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold mt-2 font-mono text-rose-400">
              {highRiskCount}
            </div>
            <div className="text-[11px] mt-1 opacity-70">Cần chú ý xử lý sớm</div>
          </div>
        </div>

        {/* Status Overview & Priority Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Overview */}
          <div className={`p-5 rounded-xl border space-y-4 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#579DFF]" />
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Phân bổ theo Trạng thái (Status Overview)
              </h3>
            </div>
            <div className="space-y-3">
              {project.columns.map((col: any) => {
                const count = tasks.filter((t) => t.columnId === col.id).length;
                const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                return (
                  <div key={col.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-medium">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: col.colorHex }}
                        />
                        {col.title}
                      </span>
                      <span className="font-mono font-bold">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div
                      className={`w-full h-2 rounded-full overflow-hidden ${
                        isDark ? 'bg-[#1D2125]' : 'bg-gray-100'
                      }`}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: col.colorHex }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className={`p-5 rounded-xl border space-y-4 ${cardClass}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Phân bổ theo Độ ưu tiên (Priority Breakdown)
              </h3>
            </div>
            <div className="space-y-3">
              {priorityGroups.map((pg) => {
                const count = tasks.filter((t) => t.priority === pg.key).length;
                const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                return (
                  <div key={pg.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{pg.label}</span>
                      <span className="font-mono font-bold">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div
                      className={`w-full h-2 rounded-full overflow-hidden ${
                        isDark ? 'bg-[#1D2125]' : 'bg-gray-100'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${pg.color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Team Workload */}
        <div className={`p-5 rounded-xl border space-y-4 ${cardClass}`}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Khối lượng công việc Thành viên (Team Workload)
            </h3>
          </div>

          <div className="space-y-3">
            {teamStats.map((m: any) => (
              <div
                key={m.id}
                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-[#1D2125] border-[#2C333A]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="w-8 h-8 rounded-full bg-[#0C66E4] text-white text-xs font-bold flex items-center justify-center">
                    {m.user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {m.user?.fullName}
                    </div>
                    <div className="text-[11px] opacity-70">{m.role}</div>
                  </div>
                </div>

                <div className="flex-1 max-w-md space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>
                      Đã xong: <strong>{m.done}</strong> / {m.total} việc
                    </span>
                    <span className="font-mono font-bold text-emerald-400">{m.pct}%</span>
                  </div>
                  <div
                    className={`w-full h-2 rounded-full overflow-hidden ${
                      isDark ? 'bg-[#2C333A]' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
