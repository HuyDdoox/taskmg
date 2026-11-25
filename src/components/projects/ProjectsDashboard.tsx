'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createProject, deleteProject } from '@/app/actions/project-actions';
import { logoutAction } from '@/app/actions/auth-actions';
import { getRoleBadgeStyle } from '@/lib/rbac';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  ArrowRight,
  Trash2,
  X,
  Sun,
  Moon,
  Layers,
  Sparkles,
  LogOut,
} from 'lucide-react';

interface ProjectsDashboardProps {
  initialProjects: any[];
  currentUser: { id: string; fullName: string; email: string };
}

const AVATAR_COLORS = [
  'bg-amber-500 text-slate-950',
  'bg-sky-500 text-slate-950',
  'bg-emerald-500 text-slate-950',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
];

function getInitials(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProjectsDashboard({ initialProjects, currentUser }: ProjectsDashboardProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };
  const [projects, setProjects] = useState(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('taskmg-theme');
    if (saved === 'light') setIsDark(false);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('taskmg-theme', next ? 'dark' : 'light');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!projectKey || projectKey === suggestKey(name)) {
      setProjectKey(suggestKey(val));
    }
  };

  const suggestKey = (val: string) => {
    const words = val
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
    return words
      .map((w) => w[0])
      .join('')
      .slice(0, 5)
      .toUpperCase();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const res = await createProject({
      name,
      projectKey,
      description,
    });

    setIsSubmitting(false);

    if (res.success && res.project) {
      setProjects((prev) => [res.project, ...prev]);
      setIsCreateOpen(false);
      setName('');
      setProjectKey('');
      setDescription('');
      router.push(`/projects/${res.project.id}`);
    } else {
      setErrorMsg(res.error || 'Không thể tạo dự án');
    }
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xóa dự án "${projectName}" cùng toàn bộ task bên trong không?`)) {
      return;
    }
    const res = await deleteProject(projectId);
    if (res.success) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } else {
      alert(res.error || 'Không thể xóa dự án');
    }
  };

  const filtered = projects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.projectKey.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? 'bg-[#1D2125] text-[#B6C2CF]' : 'bg-[#F4F5F7] text-gray-900'
      }`}
    >
      {/* Top Navbar */}
      <header
        className={`h-14 px-6 border-b flex items-center justify-between sticky top-0 z-20 ${
          isDark ? 'bg-[#1D2125] border-[#2C333A]' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0C66E4] flex items-center justify-center text-white shadow-sm">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <div className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              TaskMG Spaces
            </div>
            <div className={`text-[11px] ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
              Quản lý Dự án & Công việc chuẩn Jira
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
              isDark
                ? 'bg-[#22272B] border-[#38414A] text-[#B6C2CF]'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-[#0C66E4] text-white text-[10px] font-bold flex items-center justify-center">
              {getInitials(currentUser.fullName)}
            </div>
            <span className="font-semibold max-w-[140px] truncate">{currentUser.fullName}</span>
          </div>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#22272B] border-[#38414A] text-amber-400 hover:bg-[#2C333A]'
                : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
            }`}
            title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tạo Dự Án Mới
          </button>

          <button
            onClick={handleLogout}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#22272B] border-[#38414A] text-[#9FADBC] hover:text-red-400 hover:border-red-500/40'
                : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-red-600'
            }`}
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Title & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Danh sách Dự án (Spaces)
            </h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
              Chọn một dự án để xem List, Board Kanban, Summary, Timeline và quản lý thành viên.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className={`w-4 h-4 absolute left-3 top-2.5 ${isDark ? 'text-[#8C9BAB]' : 'text-gray-400'}`}
            />
            <input
              type="text"
              placeholder="Tìm dự án theo tên hoặc mã Key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[#579DFF] ${
                isDark
                  ? 'bg-[#22272B] border-[#38414A] text-white placeholder-[#8C9BAB]'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Projects Grid */}
        {filtered.length === 0 ? (
          <div
            className={`rounded-2xl border border-dashed p-12 text-center space-y-3 ${
              isDark ? 'border-[#38414A] bg-[#22272B]/50' : 'border-gray-300 bg-white'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-[#0C66E4]/15 text-[#579DFF] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Chưa có dự án nào
            </h3>
            <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
              Bắt đầu bằng cách tạo dự án đầu tiên. Hệ thống sẽ tự động tạo sẵn 4 cột Kanban, Sprint 1 và cho phép thêm thành viên ngay lập tức.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tạo Dự Án Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((project: any) => {
              const totalTasks = project._count?.tasks ?? 0;
              const doneColumn = project.columns?.find(
                (c: any) => c.title.toLowerCase() === 'done' || c.position === 3
              );
              const doneTasks = doneColumn?._count?.tasks ?? 0;
              const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={`group rounded-xl border p-5 flex flex-col justify-between transition-all hover:-translate-y-0.5 ${
                    isDark
                      ? 'bg-[#22272B] border-[#2C333A] hover:border-[#579DFF] hover:shadow-lg hover:shadow-black/30'
                      : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0C66E4] to-[#579DFF] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs font-mono">
                          {project.projectKey}
                        </div>
                        <div className="min-w-0">
                          <h2
                            className={`font-bold text-sm truncate group-hover:text-[#579DFF] transition-colors ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            {project.name}
                          </h2>
                          <span
                            className={`text-[11px] font-mono ${
                              isDark ? 'text-[#8C9BAB]' : 'text-gray-500'
                            }`}
                          >
                            Key: {project.projectKey}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadgeStyle(
                            project.myRole,
                            isDark
                          )}`}
                        >
                          {project.myRole || 'MEMBER'}
                        </span>
                        {project.myRole === 'ADMIN' && (
                          <button
                            onClick={(e) => handleDelete(e, project.id, project.name)}
                            className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                              isDark
                                ? 'text-[#8C9BAB] hover:text-red-400 hover:bg-red-500/10'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Xóa dự án (Chỉ ADMIN)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p
                      className={`text-xs line-clamp-2 min-h-[32px] ${
                        isDark ? 'text-[#9FADBC]' : 'text-gray-600'
                      }`}
                    >
                      {project.description || 'Không gian quản lý công việc, tiến độ và thành viên dự án.'}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}>
                          Tiến độ hoàn thành
                        </span>
                        <span className={`font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {doneTasks}/{totalTasks} ({progress}%)
                        </span>
                      </div>
                      <div
                        className={`w-full h-1.5 rounded-full overflow-hidden ${
                          isDark ? 'bg-[#2C333A]' : 'bg-gray-200'
                        }`}
                      >
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    className={`mt-4 pt-3 border-t flex items-center justify-between ${
                      isDark ? 'border-[#2C333A]' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-center -space-x-2">
                      {(project.members || []).slice(0, 4).map((m: any, idx: number) => (
                        <div
                          key={m.id}
                          title={`${m.user?.fullName} (${m.role})`}
                          className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ${
                            isDark ? 'ring-[#22272B]' : 'ring-white'
                          } ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                        >
                          {getInitials(m.user?.fullName)}
                        </div>
                      ))}
                      {(project.members?.length || 0) > 4 && (
                        <div
                          className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ${
                            isDark
                              ? 'bg-[#2C333A] text-[#B6C2CF] ring-[#22272B]'
                              : 'bg-gray-200 text-gray-700 ring-white'
                          }`}
                        >
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className={`inline-flex items-center gap-1 ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
                        <Layers className="w-3 h-3" /> {project._count?.milestones ?? 0}
                      </span>
                      <span className={`inline-flex items-center gap-1 ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
                        <Users className="w-3 h-3" /> {project._count?.members ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#579DFF] font-semibold group-hover:translate-x-0.5 transition-transform">
                        Mở <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div
            className={`w-full max-w-md rounded-xl border shadow-2xl overflow-hidden ${
              isDark ? 'bg-[#22272B] border-[#38414A]' : 'bg-white border-gray-200'
            }`}
          >
            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                isDark ? 'border-[#2C333A] bg-[#1D2125]' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#579DFF]" />
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Tạo Dự Án Mới (New Space)
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className={`p-1 rounded ${isDark ? 'text-[#8C9BAB] hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#B6C2CF]' : 'text-gray-700'}`}>
                  Tên Dự Án <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: GymPilot, Website Bán Hàng..."
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#579DFF] ${
                    isDark
                      ? 'bg-[#1D2125] border-[#38414A] text-white placeholder-[#6B778C]'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#B6C2CF]' : 'text-gray-700'}`}>
                  Mã Key Dự Án <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="VD: GYM, TASK, WEB"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#579DFF] ${
                    isDark
                      ? 'bg-[#1D2125] border-[#38414A] text-white placeholder-[#6B778C]'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <p className={`text-[11px] mt-1 ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
                  Dùng làm tiền tố mã công việc: <span className="font-mono font-bold text-[#579DFF]">{projectKey || 'KEY'}-1</span>,{' '}
                  <span className="font-mono font-bold text-[#579DFF]">{projectKey || 'KEY'}-2</span>...
                </p>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-[#B6C2CF]' : 'text-gray-700'}`}>
                  Mô tả ngắn
                </label>
                <textarea
                  rows={3}
                  placeholder="Mục tiêu dự án, phạm vi thực hiện..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[#579DFF] ${
                    isDark
                      ? 'bg-[#1D2125] border-[#38414A] text-white placeholder-[#6B778C]'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div
                className={`pt-3 border-t flex justify-end gap-2 ${
                  isDark ? 'border-[#2C333A]' : 'border-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
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
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0C66E4] hover:bg-[#0055CC] text-white disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang tạo...' : '+ Tạo & Vào Dự Án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
