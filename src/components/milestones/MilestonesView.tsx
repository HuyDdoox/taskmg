'use client';

import React from 'react';
import { Layers, Calendar, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';

interface MilestonesViewProps {
  milestones: any[];
  tasks: any[];
  onSelectMilestoneForBoard?: (milestoneId: string) => void;
}

export function MilestonesView({ milestones, tasks, onSelectMilestoneForBoard }: MilestonesViewProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã Hoàn Thành
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Đang Tiến Hành
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400" /> Sắp Tới (Upcoming)
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F5F7] overflow-hidden">
      
      {/* Header */}
      <div className="h-14 px-6 border-b border-gray-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Quản Lý Giai Đoạn Dự Án (Project Milestones)</h2>
            <p className="text-[11px] text-gray-500">Phân chia lộ trình công việc theo các cột mốc để tránh quá tải thông tin</p>
          </div>
        </div>
      </div>

      {/* Content Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="grid gap-4">
          {milestones.map((m: any, idx: number) => {
            const milestoneTasks = tasks.filter((t: any) => t.milestoneId === m.id);
            const completedTasks = milestoneTasks.filter((t: any) => t.column?.title?.toLowerCase().includes('hoàn thành') || t.column?.title?.toLowerCase().includes('done')).length;
            const progress = milestoneTasks.length > 0 ? Math.round((completedTasks / milestoneTasks.length) * 100) : 0;

            return (
              <div 
                key={m.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4 hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-700 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{m.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {m.startDate ? new Date(m.startDate).toLocaleDateString('vi-VN') : '---'} ➔ {m.endDate ? new Date(m.endDate).toLocaleDateString('vi-VN') : '---'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>{getStatusBadge(m.status)}</div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                    <span>Tiến độ hoàn thành</span>
                    <span>{completedTasks}/{milestoneTasks.length} task ({progress}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Task list preview in milestone */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Các công việc trực thuộc ({milestoneTasks.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {milestoneTasks.map((t: any) => (
                      <span 
                        key={t.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-gray-50 border border-gray-200 text-gray-800"
                      >
                        <span className="font-mono font-bold text-blue-700">{t.issueKey}</span>
                        <span className="truncate max-w-[200px]">{t.title}</span>
                      </span>
                    ))}
                    {milestoneTasks.length === 0 && (
                      <span className="text-xs text-gray-400 italic">Chưa có task gắn vào giai đoạn này.</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
