'use client';

import React, { useState, useMemo } from 'react';
import { createBulkTasks } from '@/app/actions/task-actions';
import { ProjectPermissions } from '@/lib/rbac';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface BulkCreateTaskModalProps {
  projectId: string;
  columns: any[];
  milestones: any[];
  members?: any[];
  currentUserId?: string;
  permissions?: ProjectPermissions;
  isDark?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated: (tasks: any[]) => void;
}

interface ParsedRow {
  title: string;
  issueType?: string;
  priority?: string;
  dueDate?: string;
  description?: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function BulkCreateTaskModal({
  projectId,
  columns,
  milestones,
  members = [],
  currentUserId,
  permissions,
  isDark = true,
  isOpen,
  onClose,
  onTasksCreated,
}: BulkCreateTaskModalProps) {
  const [mode, setMode] = useState<'PASTE' | 'CSV'>('PASTE');
  const [rawText, setRawText] = useState('');
  const [csvRows, setCsvRows] = useState<ParsedRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');

  const [columnId, setColumnId] = useState(columns[0]?.id || '');
  const [priority, setPriority] = useState('MEDIUM');
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [issueType, setIssueType] = useState('TASK');
  const [milestoneId, setMilestoneId] = useState('');
  const [assigneeId, setAssigneeId] = useState(currentUserId || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const pastedRows: ParsedRow[] = useMemo(() => {
    return rawText
      .split(/\r?\n/)
      .map((line) => line.replace(/^(\s*[-*•]|\s*\d+[.)])\s+/, '').trim())
      .filter((line) => line.length > 0)
      .map((rawLine) => {
        let working = rawLine;
        let extractedType: string | undefined;
        let extractedPriority: string | undefined;

        // 1. Tách tiền tố [TASK] / [BUG] / [STORY] / [SUBTASK] ở đầu dòng
        const prefixMatch = working.match(/^\[(TASK|BUG|STORY|SUBTASK)\]\s*/i);
        if (prefixMatch) {
          extractedType = prefixMatch[1].toUpperCase();
          working = working.slice(prefixMatch[0].length).trim();
        }

        // 2. Tách hậu tố | [HIGH] hoặc | HIGH ở cuối dòng
        const suffixMatch = working.match(/\s*\|\s*\[?(BLOCKER|HIGHEST|HIGH|MEDIUM|LOW|LOWEST)\]?\s*$/i);
        if (suffixMatch) {
          const rawPrio = suffixMatch[1].toUpperCase();
          extractedPriority = rawPrio === 'HIGHEST' ? 'BLOCKER' : rawPrio;
          working = working.slice(0, working.length - suffixMatch[0].length).trim();
        }

        return {
          title: working || rawLine,
          issueType: extractedType,
          priority: extractedPriority,
        };
      });
  }, [rawText]);

  const activeItems = mode === 'PASTE' ? pastedRows : csvRows;

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent =
      '\uFEFFTitle,IssueType,Priority,DueDate,Description\n' +
      '"Thiết kế giao diện trang chủ",STORY,HIGH,2026-12-05,"Hoàn thiện responsive desktop & mobile"\n' +
      '"Viết API đăng nhập & phân quyền",TASK,BLOCKER,2026-12-08,"Bảo mật cookie HttpOnly"\n' +
      '"Sửa lỗi căn lề trên Safari",BUG,LOW,2026-12-10,"Kiểm tra trên iOS"\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taskmg-bulk-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '').replace(/^\uFEFF/, '');
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        setCsvRows([]);
        return;
      }

      const firstCols = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
      const hasHeader =
        firstCols[0].includes('title') ||
        firstCols[0].includes('tên') ||
        firstCols[0].includes('work');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const parsed: ParsedRow[] = dataLines
        .map((line) => {
          const cols = parseCsvLine(line);
          return {
            title: cols[0] || '',
            issueType: cols[1] || undefined,
            priority: cols[2] || undefined,
            dueDate: cols[3] || undefined,
            description: cols[4] || undefined,
          };
        })
        .filter((r) => r.title.trim().length > 0);

      setCsvRows(parsed);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeItems.length === 0) {
      setErrorMsg('Chưa có công việc nào để tạo!');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    const res = await createBulkTasks({
      projectId,
      columnId: columnId || columns[0]?.id,
      milestoneId: milestoneId || undefined,
      assigneeId: assigneeId || undefined,
      defaultPriority: priority,
      defaultRiskLevel: riskLevel,
      defaultIssueType: issueType,
      items: activeItems,
    });

    setSubmitting(false);

    if (res.success && res.tasks) {
      onTasksCreated(res.tasks);
      setRawText('');
      setCsvRows([]);
      setCsvFileName('');
      onClose();
    } else {
      setErrorMsg(res.error || 'Không thể tạo danh sách công việc');
    }
  };

  const labelClass = isDark
    ? 'block text-[11px] font-semibold text-[#9FADBC] mb-1'
    : 'block text-[11px] font-semibold text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className={`rounded-2xl shadow-2xl border w-full max-w-2xl overflow-hidden ${
          isDark ? 'bg-[#22272B] border-[#38414A] text-[#DEE4EA]' : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'border-[#2C333A] bg-[#1D2125]' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0C66E4]/20 text-[#579DFF] flex items-center justify-center">
              <i className="fa-solid fa-list-check text-xs" />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Thêm Danh Sách Task Hàng Loạt
              </h3>
              <p className="text-[11px] opacity-65">
                Tạo nhanh tối đa 100 công việc trong 1 lần (Dán theo dòng hoặc Import CSV)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg cursor-pointer ${
              isDark ? 'text-[#8C9BAB] hover:text-white hover:bg-[#2C333A]' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <i className="fa-solid fa-xmark text-base" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mode Tabs */}
          <div
            className={`grid grid-cols-2 p-1 rounded-xl border ${
              isDark ? 'bg-[#1D2125] border-[#2C333A]' : 'bg-gray-100 border-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setMode('PASTE')}
              className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                mode === 'PASTE'
                  ? 'bg-[#0C66E4] text-white'
                  : isDark
                  ? 'text-[#9FADBC] hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="fa-solid fa-align-left" /> Dán danh sách (Mỗi dòng 1 Task)
            </button>
            <button
              type="button"
              onClick={() => setMode('CSV')}
              className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                mode === 'CSV'
                  ? 'bg-[#0C66E4] text-white'
                  : isDark
                  ? 'text-[#9FADBC] hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="fa-solid fa-file-csv" /> Import file .CSV (Excel)
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Shared Default Settings */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>Cột trạng thái:</label>
              <CustomSelect
                value={columnId}
                isDark={isDark}
                className="w-full"
                buttonClassName={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                  isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                }`}
                minMenuWidth="w-full"
                onChange={setColumnId}
                options={columns.map((c) => ({
                  value: c.id,
                  label: c.title,
                  dotColor: c.colorHex,
                }))}
              />
            </div>

            <div>
              <label className={labelClass}>Loại mặc định:</label>
              <CustomSelect
                value={issueType}
                isDark={isDark}
                className="w-full"
                buttonClassName={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                  isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                }`}
                minMenuWidth="w-full"
                onChange={setIssueType}
                options={[
                  { value: 'TASK', label: 'Task', dotColor: '#579DFF' },
                  { value: 'STORY', label: 'Story', dotColor: '#10B981' },
                  { value: 'BUG', label: 'Bug', dotColor: '#EF4444' },
                ]}
              />
            </div>

            <div>
              <label className={labelClass}>Độ ưu tiên:</label>
              <CustomSelect
                value={priority}
                disabled={permissions && !permissions.canEditTaskMeta}
                isDark={isDark}
                className="w-full"
                buttonClassName={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                  isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                }`}
                minMenuWidth="w-full"
                onChange={setPriority}
                options={[
                  { value: 'BLOCKER', label: 'Highest', dotColor: '#EF4444' },
                  { value: 'HIGH', label: 'High', dotColor: '#F97316' },
                  { value: 'MEDIUM', label: 'Medium', dotColor: '#F59E0B' },
                  { value: 'LOW', label: 'Low', dotColor: '#38BDF8' },
                ]}
              />
            </div>

            <div>
              <label className={labelClass}>Người làm:</label>
              <CustomSelect
                value={assigneeId}
                disabled={permissions && !permissions.canAssignOthers}
                isDark={isDark}
                className="w-full"
                buttonClassName={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                  isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                }`}
                minMenuWidth="min-w-[180px]"
                menuAlign="right"
                onChange={setAssigneeId}
                options={[
                  { value: '', label: 'Chưa gán' },
                  ...members.map((m) => ({
                    value: m.user.id,
                    label: m.user.fullName,
                    subLabel: m.role,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Optional Milestone */}
          {milestones.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Gắn vào Giai đoạn (Milestone):</label>
                <CustomSelect
                  value={milestoneId}
                  isDark={isDark}
                  className="w-full"
                  buttonClassName={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                    isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                  }`}
                  minMenuWidth="w-full"
                  onChange={setMilestoneId}
                  options={[
                    { value: '', label: '-- Không gắn giai đoạn --' },
                    ...milestones.map((m) => ({ value: m.id, label: m.title })),
                  ]}
                />
              </div>
              <div>
                <label className={labelClass}>Mức rủi ro mặc định:</label>
                <CustomSelect
                  value={riskLevel}
                  disabled={permissions && !permissions.canEditTaskMeta}
                  isDark={isDark}
                  className="w-full"
                  buttonClassName={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                    isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                  }`}
                  minMenuWidth="w-full"
                  onChange={setRiskLevel}
                  options={[
                    { value: 'LOW', label: 'Low', dotColor: '#94A3B8' },
                    { value: 'MEDIUM', label: 'Medium', dotColor: '#F59E0B' },
                    { value: 'HIGH', label: 'High', dotColor: '#F97316' },
                    { value: 'CRITICAL', label: 'Critical', dotColor: '#EF4444' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Input Body */}
          {mode === 'PASTE' ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>
                  Nhập hoặc dán danh sách công việc (mỗi dòng = 1 Task):
                </label>
                <span className="text-[11px] font-mono text-[#579DFF] font-bold">
                  {pastedRows.length} tasks
                </span>
              </div>
              <textarea
                rows={7}
                placeholder={
                  '- Thiết kế trang chủ Landing Page\n- Xây dựng API quản lý thành viên\n- Kiểm thử luồng phân quyền RBAC\n- Deploy sản phẩm lên Vercel'
                }
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#579DFF] ${
                  isDark
                    ? 'bg-[#1D2125] border-[#38414A] text-white placeholder-[#6B778C]'
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-dashed border-[#579DFF] bg-[#0C66E4]/10 text-[#579DFF] text-xs font-semibold cursor-pointer hover:bg-[#0C66E4]/20 transition-colors">
                  <i className="fa-solid fa-upload" />
                  <span>{csvFileName || 'Chọn file .CSV từ máy tính'}</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                    isDark
                      ? 'border-[#38414A] bg-[#1D2125] text-[#B6C2CF] hover:text-white'
                      : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <i className="fa-solid fa-download" /> Tải file CSV mẫu
                </button>
              </div>

              {csvRows.length > 0 ? (
                <div
                  className={`max-h-44 overflow-y-auto rounded-xl border text-xs ${
                    isDark ? 'border-[#2C333A] bg-[#1D2125]' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <table className="w-full text-left">
                    <thead className="border-b border-[#2C333A] text-[11px] opacity-70">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Tiêu đề</th>
                        <th className="py-2 px-3">Loại</th>
                        <th className="py-2 px-3">Ưu tiên</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2C333A]/50">
                      {csvRows.slice(0, 20).map((r, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-3 font-mono opacity-60">{idx + 1}</td>
                          <td className="py-1.5 px-3 font-medium">{r.title}</td>
                          <td className="py-1.5 px-3 font-mono text-[11px]">
                            {r.issueType || issueType}
                          </td>
                          <td className="py-1.5 px-3 font-mono text-[11px]">
                            {r.priority || priority}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  className={`p-6 rounded-xl border border-dashed text-center text-xs opacity-65 ${
                    isDark ? 'border-[#38414A]' : 'border-gray-300'
                  }`}
                >
                  Định dạng cột CSV: <code>Title, IssueType, Priority, DueDate, Description</code>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div
            className={`pt-3 border-t flex items-center justify-between ${
              isDark ? 'border-[#2C333A]' : 'border-gray-200'
            }`}
          >
            <span className="text-xs opacity-75">
              Sẵn sàng tạo: <strong className="text-[#579DFF] font-mono">{activeItems.length}</strong>{' '}
              công việc
            </span>

            <div className="flex items-center gap-2">
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
                disabled={submitting || activeItems.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white disabled:opacity-50 cursor-pointer"
              >
                <i className="fa-solid fa-bolt" />
                {submitting ? 'Đang tạo hàng loạt...' : `Tạo ${activeItems.length} Tasks`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
