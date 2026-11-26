'use client';

import React, { useState, useMemo } from 'react';
import { createQuickTask, updateTaskFields } from '@/app/actions/task-actions';
import {
  ProjectPermissions,
  canUserModifyTaskStatus,
  isDoneColumnTitle,
} from '@/lib/rbac';
import { CustomSelect } from '@/components/ui/CustomSelect';
interface ListViewProps {
  project: any;
  tasks: any[];
  currentUser: any;
  permissions: ProjectPermissions;
  isDark: boolean;
  onSelectTask: (task: any) => void;
  onTaskUpdated: (updatedTask: any) => void;
  onTaskCreated: (newTask: any) => void;
}

const AVATAR_COLORS = [
  'bg-amber-500 text-slate-950',
  'bg-sky-500 text-slate-950',
  'bg-emerald-500 text-slate-950',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
  'bg-indigo-500 text-white',
];

function getInitials(name?: string) {
  if (!name) return '?';
  const cleaned = name.replace(/\([^)]*\)/g, '').trim();
  const parts = (cleaned || name.trim()).split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getUserColor(userId?: string) {
  if (!userId) return 'bg-gray-500 text-white';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getStatusBadgeClass(title: string, isDark: boolean) {
  const lower = title.toLowerCase();
  if (lower.includes('done') || lower.includes('hoàn thành')) {
    return isDark
      ? 'bg-[#1C3329] text-[#7EE2B8] border-[#216E4E]'
      : 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }
  if (lower.includes('progress') || lower.includes('đang làm')) {
    return isDark
      ? 'bg-[#1C2B41] text-[#85B8FF] border-[#0055CC]'
      : 'bg-blue-100 text-blue-800 border-blue-300';
  }
  if (lower.includes('review') || lower.includes('duyệt')) {
    return isDark
      ? 'bg-[#2B2443] text-[#B8ACF6] border-[#5E4DB2]'
      : 'bg-purple-100 text-purple-800 border-purple-300';
  }
  return isDark
    ? 'bg-[#2C333A] text-[#B6C2CF] border-[#454F59]'
    : 'bg-gray-100 text-gray-800 border-gray-300';
}

export function ListView({
  project,
  tasks,
  currentUser,
  permissions,
  isDark,
  onSelectTask,
  onTaskUpdated,
  onTaskCreated,
}: ListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('ALL');
  const [groupBy, setGroupBy] = useState<'NONE' | 'STATUS' | 'PRIORITY' | 'ASSIGNEE'>('NONE');
  const [showFilters, setShowFilters] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Sorting state (3-state: asc -> desc -> null)
  type SortField = 'work' | 'dueDate' | 'assignee' | 'reporter' | 'priority' | 'status' | 'created';
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortField(null);
    }
  };

  // Quick inline create
  const [isQuickCreating, setIsQuickCreating] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickIssueType, setQuickIssueType] = useState('TASK');
  const [quickLoading, setQuickLoading] = useState(false);

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !t.issueKey.toLowerCase().includes(q) &&
          !t.title.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (selectedAssigneeId !== 'ALL' && t.assigneeId !== selectedAssigneeId) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (milestoneFilter !== 'ALL' && t.milestoneId !== milestoneFilter) return false;
      return true;
    });

    if (!sortField) return filtered;

    const priorityWeight: Record<string, number> = {
      BLOCKER: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
      LOWEST: 0,
    };

    const colPositionMap = new Map<string, number>();
    (project.columns || []).forEach((c: any, idx: number) => {
      colPositionMap.set(c.id, c.position ?? idx);
    });

    const dir = sortDir === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case 'work': {
          const numA = a.taskNumber ?? 0;
          const numB = b.taskNumber ?? 0;
          if (numA !== numB) return (numA - numB) * dir;
          return (a.title || '').localeCompare(b.title || '') * dir;
        }
        case 'dueDate': {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * dir;
        }
        case 'assignee': {
          const nameA = a.assignee?.fullName || 'zzzz';
          const nameB = b.assignee?.fullName || 'zzzz';
          return nameA.localeCompare(nameB, 'vi') * dir;
        }
        case 'reporter': {
          const nameA = a.reporter?.fullName || 'zzzz';
          const nameB = b.reporter?.fullName || 'zzzz';
          return nameA.localeCompare(nameB, 'vi') * dir;
        }
        case 'priority': {
          const wA = priorityWeight[a.priority] ?? 2;
          const wB = priorityWeight[b.priority] ?? 2;
          return (wA - wB) * dir;
        }
        case 'status': {
          const pA = colPositionMap.get(a.columnId) ?? 99;
          const pB = colPositionMap.get(b.columnId) ?? 99;
          return (pA - pB) * dir;
        }
        case 'created': {
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        }
        default:
          return 0;
      }
    });
  }, [tasks, searchQuery, selectedAssigneeId, priorityFilter, milestoneFilter, sortField, sortDir, project.columns]);

  const groupedTasks = useMemo(() => {
    if (groupBy === 'NONE') {
      return [{ key: 'ALL', label: '', items: filteredTasks }];
    }

    const map = new Map<string, { key: string; label: string; items: any[] }>();
    filteredTasks.forEach((task) => {
      let key = 'OTHER';
      let label = 'Khác';
      if (groupBy === 'STATUS') {
        const col = project.columns.find((c: any) => c.id === task.columnId);
        key = col?.id || 'UNKNOWN';
        label = col?.title || 'Chưa phân loại';
      } else if (groupBy === 'PRIORITY') {
        key = task.priority || 'MEDIUM';
        label = `Độ ưu tiên: ${key}`;
      } else if (groupBy === 'ASSIGNEE') {
        key = task.assigneeId || 'UNASSIGNED';
        label = task.assignee?.fullName || 'Chưa giao (Unassigned)';
      }

      if (!map.has(key)) {
        map.set(key, { key, label, items: [] });
      }
      map.get(key)!.items.push(task);
    });

    return Array.from(map.values());
  }, [filteredTasks, groupBy, project.columns]);

  const handleInlineFieldUpdate = async (task: any, patch: any) => {
    // Optimistic UI: cập nhật ngay 0ms trên màn hình
    const optimisticTask = { ...task, ...patch };
    if (patch.assigneeId !== undefined) {
      const foundMember = (project.members || []).find(
        (m: any) => m.user.id === patch.assigneeId
      );
      optimisticTask.assignee = foundMember ? foundMember.user : null;
    }
    if (patch.columnId !== undefined) {
      const foundCol = (project.columns || []).find((c: any) => c.id === patch.columnId);
      if (foundCol) optimisticTask.column = foundCol;
    }
    onTaskUpdated(optimisticTask);

    const res = await updateTaskFields(task.id, project.id, patch);
    if (res.success && res.task) {
      onTaskUpdated(res.task);
    } else if (res.error) {
      // Rollback nếu bị chặn quyền / lỗi
      onTaskUpdated(task);
      alert(res.error);
    }
  };

  const handleQuickCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !project.columns?.[0]?.id) return;

    setQuickLoading(true);
    const res = await createQuickTask({
      projectId: project.id,
      title: quickTitle.trim(),
      columnId: project.columns[0].id,
      issueType: quickIssueType,
      priority: 'MEDIUM',
      riskLevel: 'LOW',
      assigneeId: selectedAssigneeId !== 'ALL' ? selectedAssigneeId : currentUser?.id,
      reporterId: currentUser?.id,
    });
    setQuickLoading(false);

    if (res.success && res.task) {
      onTaskCreated(res.task);
      setQuickTitle('');
      setIsQuickCreating(false);
    } else {
      alert(res.error || 'Không thể tạo task');
    }
  };

  const renderIssueIcon = (type: string) => {
    switch (type) {
      case 'BUG':
        return <i className="fa-solid fa-bug text-red-400 shrink-0" />;
      case 'STORY':
        return <i className="fa-solid fa-bookmark text-emerald-400 shrink-0" />;
      default:
        return <i className="fa-solid fa-square-check text-[#579DFF] shrink-0" />;
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'BLOCKER':
        return (
          <span className="inline-flex items-center gap-1 text-red-400 font-medium">
            <i className="fa-solid fa-fire" /> Highest
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-orange-400 font-medium">
            <i className="fa-solid fa-arrow-up" /> High
          </span>
        );
      case 'LOW':
      case 'LOWEST':
        return (
          <span className="inline-flex items-center gap-1 text-sky-400 font-medium">
            <i className="fa-solid fa-arrow-down" /> Low
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
            <i className="fa-solid fa-minus" /> Medium
          </span>
        );
    }
  };

  const activeFilterCount =
    (selectedAssigneeId !== 'ALL' ? 1 : 0) +
    (priorityFilter !== 'ALL' ? 1 : 0) +
    (milestoneFilter !== 'ALL' ? 1 : 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Filter Toolbar (Jira Cloud Style) */}
      <div
        className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#1D2125] border-[#2C333A]' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search input */}
          <div className="relative w-56">
            <i className={`fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 ${ isDark ? 'text-[#8C9BAB]' : 'text-gray-400' }`} />
            <input
              type="text"
              placeholder="Search work..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-md border text-xs focus:outline-none focus:ring-2 focus:ring-[#579DFF] ${
                isDark
                  ? 'bg-[#22272B] border-[#38414A] text-white placeholder-[#8C9BAB]'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          {/* Member Avatars Quick Filter */}
          <div className="flex items-center -space-x-1.5 pl-1">
            {(project.members || []).map((m: any) => {
              const isSelected = selectedAssigneeId === m.user.id;
              return (
                <button
                  key={m.id}
                  onClick={() =>
                    setSelectedAssigneeId(isSelected ? 'ALL' : m.user.id)
                  }
                  title={`Lọc theo: ${m.user.fullName}`}
                  className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${getUserColor(
                    m.user.id
                  )} ${
                    isSelected
                      ? 'ring-2 ring-[#579DFF] scale-110 z-10'
                      : isDark
                      ? 'ring-2 ring-[#1D2125] opacity-85 hover:opacity-100'
                      : 'ring-2 ring-white opacity-85 hover:opacity-100'
                  }`}
                >
                  {getInitials(m.user.fullName)}
                </button>
              );
            })}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
              showFilters || activeFilterCount > 0
                ? 'bg-[#0C66E4]/20 border-[#579DFF] text-[#579DFF]'
                : isDark
                ? 'bg-[#22272B] border-[#38414A] text-[#B6C2CF] hover:bg-[#2C333A]'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <i className="fa-solid fa-filter" />
            Filter
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-[#579DFF] text-slate-950 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Group By Dropdown */}
          <div className="inline-flex items-center gap-1.5">
            <i className={`fa-solid fa-layer-group ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`} />
            <CustomSelect
              value={groupBy}
              isDark={isDark}
              onChange={(val) => setGroupBy(val as any)}
              minMenuWidth="min-w-[165px]"
              options={[
                { value: 'NONE', label: 'Group: None' },
                { value: 'STATUS', label: 'Group: Status' },
                { value: 'PRIORITY', label: 'Group: Priority' },
                { value: 'ASSIGNEE', label: 'Group: Assignee' },
              ]}
            />
          </div>
        </div>

        <div className={`text-xs font-mono ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
          {filteredTasks.length} of {tasks.length} items
        </div>
      </div>

      {/* Extra Filter Row */}
      {showFilters && (
        <div
          className={`px-6 py-2.5 border-b flex flex-wrap items-center gap-3 text-xs ${
            isDark ? 'bg-[#161A1D] border-[#2C333A]' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className={isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={`px-2 py-1 rounded border text-xs ${
                isDark
                  ? 'bg-[#22272B] border-[#38414A] text-white'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              <option value="ALL">Tất cả</option>
              <option value="BLOCKER">Highest / Blocker</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}>Giai đoạn:</span>
            <select
              value={milestoneFilter}
              onChange={(e) => setMilestoneFilter(e.target.value)}
              className={`px-2 py-1 rounded border text-xs ${
                isDark
                  ? 'bg-[#22272B] border-[#38414A] text-white'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              <option value="ALL">Tất cả giai đoạn</option>
              {(project.milestones || []).map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setSelectedAssigneeId('ALL');
                setPriorityFilter('ALL');
                setMilestoneFilter('ALL');
              }}
              className="text-[#579DFF] hover:underline font-medium cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Main Jira Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs min-w-[900px]">
          <thead
            className={`sticky top-0 z-10 border-b ${
              isDark
                ? 'bg-[#1D2125] border-[#2C333A] text-[#9FADBC]'
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
          >
            <tr>
              {[
                { key: 'work' as const, label: 'Work', className: 'py-2.5 pl-6 pr-3 w-[36%]' },
                { key: 'dueDate' as const, label: 'Due date', className: 'py-2.5 px-3 w-[11%]' },
                { key: 'assignee' as const, label: 'Assignee', className: 'py-2.5 px-3 w-[14%]' },
                { key: 'reporter' as const, label: 'Reporter', className: 'py-2.5 px-3 w-[13%]' },
                { key: 'priority' as const, label: 'Priority', className: 'py-2.5 px-3 w-[10%]' },
                { key: 'status' as const, label: 'Status', className: 'py-2.5 px-3 w-[10%]' },
                { key: 'created' as const, label: 'Created', className: 'py-2.5 pl-3 pr-6 w-[11%]' },
              ].map((col) => {
                const isActive = sortField === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`${col.className} font-semibold select-none cursor-pointer transition-colors ${
                      isDark ? 'hover:text-white hover:bg-[#22272B]' : 'hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span className={isActive ? 'text-[#579DFF]' : ''}>{col.label}</span>
                      {isActive ? (
                        sortDir === 'asc' ? (
                          <i className="fa-solid fa-arrow-up text-[#579DFF]" />
                        ) : (
                          <i className="fa-solid fa-arrow-down text-[#579DFF]" />
                        )
                      ) : (
                        <i className="fa-solid fa-sort opacity-35" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className={isDark ? 'divide-y divide-[#2C333A]' : 'divide-y divide-gray-200'}>
            {groupedTasks.map((group) => {
              const isCollapsed = collapsedGroups[group.key];
              return (
                <React.Fragment key={group.key}>
                  {groupBy !== 'NONE' && (
                    <tr
                      onClick={() =>
                        setCollapsedGroups((prev) => ({
                          ...prev,
                          [group.key]: !prev[group.key],
                        }))
                      }
                      className={`cursor-pointer font-semibold ${
                        isDark ? 'bg-[#22272B] text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <td colSpan={7} className="py-2 px-6">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <i className="fa-solid fa-chevron-right" />
                          ) : (
                            <i className="fa-solid fa-chevron-down" />
                          )}
                          <span>{group.label}</span>
                          <span
                            className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                              isDark ? 'bg-[#2C333A] text-[#9FADBC]' : 'bg-white text-gray-600'
                            }`}
                          >
                            {group.items.length}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isCollapsed &&
                    group.items.map((task: any) => {
                      const col = project.columns.find((c: any) => c.id === task.columnId);
                      const statusTitle = col?.title || 'To Do';
                      const isDone = statusTitle.toLowerCase().includes('done');

                      return (
                        <tr
                          key={task.id}
                          className={`group transition-colors ${
                            isDark
                              ? 'hover:bg-[#22272B] text-[#B6C2CF]'
                              : 'hover:bg-blue-50/40 text-gray-800'
                          }`}
                        >
                          {/* Work: Icon + Issue Key + Title */}
                          <td
                            onClick={() => onSelectTask(task)}
                            className="py-2.5 pl-6 pr-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {renderIssueIcon(task.issueType)}
                              <span
                                className={`font-mono font-semibold shrink-0 hover:underline ${
                                  isDone
                                    ? 'line-through text-[#579DFF]/70'
                                    : 'text-[#579DFF]'
                                }`}
                              >
                                {task.issueKey}
                              </span>
                              <span
                                className={`truncate font-medium ${
                                  isDark ? 'text-[#DEE4EA]' : 'text-gray-900'
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>
                          </td>

                          {/* Due date */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {task.dueDate ? (
                              <span className="inline-flex items-center gap-1 text-[11px]">
                                <i className="fa-regular fa-calendar opacity-60" />
                                {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                              </span>
                            ) : (
                              <span className={isDark ? 'text-[#6B778C]' : 'text-gray-400'}>
                                None
                              </span>
                            )}
                          </td>

                          {/* Assignee (CustomSelect) */}
                          <td className="py-2 px-3">
                            <CustomSelect
                              value={task.assigneeId || ''}
                              disabled={!permissions.canAssignOthers}
                              isDark={isDark}
                              minMenuWidth="min-w-[190px]"
                              onChange={(val) =>
                                handleInlineFieldUpdate(task, { assigneeId: val || null })
                              }
                              buttonClassName={`px-2 py-1 border-transparent hover:border-[#38414A] bg-transparent ${
                                isDark ? 'text-[#B6C2CF]' : 'text-gray-800'
                              }`}
                              renderValue={() => (
                                <span className="flex items-center gap-2">
                                  <span
                                    className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${getUserColor(
                                      task.assignee?.id
                                    )}`}
                                  >
                                    {getInitials(task.assignee?.fullName)}
                                  </span>
                                  <span className="truncate max-w-[105px]">
                                    {task.assignee?.fullName || 'Unassigned'}
                                  </span>
                                </span>
                              )}
                              options={[
                                { value: '', label: 'Unassigned' },
                                ...(project.members || []).map((m: any) => ({
                                  value: m.user.id,
                                  label: m.user.fullName,
                                  subLabel: m.role,
                                  icon: (
                                    <span
                                      className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${getUserColor(
                                        m.user.id
                                      )}`}
                                    >
                                      {getInitials(m.user.fullName)}
                                    </span>
                                  ),
                                })),
                              ]}
                            />
                          </td>

                          {/* Reporter */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${getUserColor(
                                  task.reporter?.id
                                )}`}
                              >
                                {getInitials(task.reporter?.fullName)}
                              </div>
                              <span className="truncate max-w-[110px]">
                                {task.reporter?.fullName || 'Admin'}
                              </span>
                            </div>
                          </td>

                          {/* Priority (CustomSelect) */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <CustomSelect
                              value={task.priority}
                              disabled={!permissions.canEditTaskMeta}
                              isDark={isDark}
                              minMenuWidth="min-w-[155px]"
                              onChange={(val) =>
                                handleInlineFieldUpdate(task, { priority: val })
                              }
                              buttonClassName="px-2 py-1 border-transparent hover:border-[#38414A] bg-transparent"
                              renderValue={() => renderPriorityBadge(task.priority)}
                              options={[
                                {
                                  value: 'BLOCKER',
                                  label: 'Highest',
                                  icon: <i className="fa-solid fa-fire text-red-400" />,
                                },
                                {
                                  value: 'HIGH',
                                  label: 'High',
                                  icon: <i className="fa-solid fa-arrow-up text-orange-400" />,
                                },
                                {
                                  value: 'MEDIUM',
                                  label: 'Medium',
                                  icon: <i className="fa-solid fa-minus text-amber-400" />,
                                },
                                {
                                  value: 'LOW',
                                  label: 'Low',
                                  icon: <i className="fa-solid fa-arrow-down text-sky-400" />,
                                },
                              ]}
                            />
                          </td>

                          {/* Status (CustomSelect pill chuẩn Jira!) */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            {(() => {
                              const canChangeStatus = canUserModifyTaskStatus(
                                permissions.role,
                                task.assigneeId,
                                currentUser?.id
                              );
                              return (
                                <CustomSelect
                                  value={task.columnId}
                                  disabled={!canChangeStatus}
                                  isDark={isDark}
                                  menuAlign="right"
                                  minMenuWidth="min-w-[200px]"
                                  onChange={(val) =>
                                    handleInlineFieldUpdate(task, { columnId: val })
                                  }
                                  buttonClassName={`px-2.5 py-1 rounded text-[11px] font-bold border ${getStatusBadgeClass(
                                    statusTitle,
                                    isDark
                                  )}`}
                                  options={project.columns.map((c: any) => {
                                    const lockedDone =
                                      isDoneColumnTitle(c.title) && !permissions.canMoveToDone;
                                    return {
                                      value: c.id,
                                      label: c.title,
                                      disabled: lockedDone,
                                      dotColor: c.colorHex,
                                      badgeClass: getStatusBadgeClass(c.title, isDark),
                                    };
                                  })}
                                />
                              );
                            })()}
                          </td>

                          {/* Created */}
                          <td
                            className={`py-2.5 pl-3 pr-6 whitespace-nowrap text-[11px] ${
                              isDark ? 'text-[#8C9BAB]' : 'text-gray-500'
                            }`}
                          >
                            {new Date(task.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })}

            {filteredTasks.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className={`py-10 text-center text-xs ${
                    isDark ? 'text-[#8C9BAB]' : 'text-gray-400'
                  }`}
                >
                  Chưa có công việc nào khớp bộ lọc. Bấm <strong>+ Create</strong> bên dưới để tạo nhanh!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Quick Create Bar (Hidden for VIEWER) */}
      <div
        className={`px-6 py-2.5 border-t shrink-0 ${
          isDark ? 'bg-[#1D2125] border-[#2C333A]' : 'bg-gray-50 border-gray-200'
        }`}
      >
        {!permissions.canCreateTask ? (
          <div className="flex items-center justify-between text-[11px] opacity-70">
            <span>👁️ Chế độ chỉ xem (VIEWER)</span>
            <span className="font-mono">
              {filteredTasks.length} of {tasks.length}
            </span>
          </div>
        ) : !isQuickCreating ? (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsQuickCreating(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#9FADBC] hover:bg-[#2C333A] hover:text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="fa-solid fa-plus" /> Create
            </button>
            <span className={`text-[11px] font-mono ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
              {filteredTasks.length} of {tasks.length}
            </span>
          </div>
        ) : (
          <form onSubmit={handleQuickCreateSubmit} className="flex items-center gap-2">
            <select
              value={quickIssueType}
              onChange={(e) => setQuickIssueType(e.target.value)}
              className={`px-2 py-1.5 rounded-md border text-xs ${
                isDark
                  ? 'bg-[#22272B] border-[#38414A] text-white'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              <option value="TASK">Task</option>
              <option value="STORY">Story</option>
              <option value="BUG">Bug</option>
            </select>
            <input
              type="text"
              autoFocus
              required
              placeholder="Nhập tên công việc cần làm rồi nhấn Enter..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className={`flex-1 px-3 py-1.5 rounded-md border text-xs focus:outline-none focus:ring-2 focus:ring-[#579DFF] ${
                isDark
                  ? 'bg-[#22272B] border-[#38414A] text-white placeholder-[#8C9BAB]'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <button
              type="submit"
              disabled={quickLoading}
              className="px-3.5 py-1.5 rounded-md bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              {quickLoading ? 'Đang tạo...' : 'Tạo'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsQuickCreating(false);
                setQuickTitle('');
              }}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                isDark ? 'text-[#9FADBC] hover:bg-[#2C333A]' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Hủy
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
