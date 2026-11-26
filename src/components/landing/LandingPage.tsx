'use client';

import React, { useState } from 'react';
import Link from 'next/link';
interface LandingPageProps {
  currentUser: { id: string; fullName: string; email: string } | null;
}

const PREVIEW_TASKS = [
  {
    key: 'GYM-12',
    title: 'Thiết kế hệ thống phân quyền RBAC 4 vai trò',
    assignee: 'Huy',
    color: 'bg-amber-500 text-slate-950',
    priority: 'Highest',
    status: 'Done',
    statusClass: 'bg-[#1C3329] text-[#7EE2B8] border-[#216E4E]',
  },
  {
    key: 'GYM-14',
    title: 'Xây dựng bảng List Sort 7 cột chuẩn Jira',
    assignee: 'Dev A',
    color: 'bg-sky-500 text-slate-950',
    priority: 'High',
    status: 'In Progress',
    statusClass: 'bg-[#1C2B41] text-[#85B8FF] border-[#0055CC]',
  },
  {
    key: 'GYM-15',
    title: 'Tích hợp Chuông thông báo & Gmail OTP 6 số',
    assignee: 'QA',
    color: 'bg-purple-500 text-white',
    priority: 'Highest',
    status: 'In Review',
    statusClass: 'bg-[#2B2443] text-[#B8ACF6] border-[#5E4DB2]',
  },
  {
    key: 'GYM-16',
    title: 'Mời thành viên mới tự đặt mật khẩu qua Gmail',
    assignee: 'Huy',
    color: 'bg-emerald-500 text-slate-950',
    priority: 'High',
    status: 'To Do',
    statusClass: 'bg-[#2C333A] text-[#B6C2CF] border-[#454F59]',
  },
];

export function LandingPage() {
  const [previewTab, setPreviewTab] = useState<'list' | 'board'>('list');

  return (
    <div className="min-h-screen bg-[#111518] text-[#DEE4EA] font-sans selection:bg-[#0C66E4] selection:text-white">
      {/* 1. STICKY JIRA-STYLE NAVBAR */}
      <header className="sticky top-0 z-40 h-16 border-b border-[#22272B] bg-[#111518]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0C66E4] to-[#579DFF] flex items-center justify-center text-white shadow-md shadow-blue-900/40">
              <i className="fa-solid fa-layer-group" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">TaskMG</span>
              <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0C66E4]/20 text-[#579DFF] border border-[#0C66E4]/30">
                Jira Edition
              </span>
            </div>
          </Link>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#9FADBC]">
            <a href="#views" className="hover:text-white transition-colors">
              5 Chế độ xem
            </a>
            <a href="#roles" className="hover:text-white transition-colors">
              Phân quyền RBAC
            </a>
            <a href="#notifications" className="hover:text-white transition-colors">
              Thông báo In-App
            </a>
          </nav>

          {/* Auth Buttons (Luôn hiển thị Đăng nhập & Bắt đầu miễn phí, mở tab mới) */}
          <div className="flex items-center gap-2.5">
            <a
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#38414A] bg-[#1D2125] hover:bg-[#282E33] text-[#DEE4EA] text-xs font-semibold transition-colors"
            >
              Đăng nhập
              <i className="fa-solid fa-arrow-up-right-from-square opacity-70" />
            </a>
            <a
              href="/login?mode=register"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs font-bold shadow-md shadow-blue-900/30 transition-all"
            >
              Bắt đầu miễn phí
              <i className="fa-solid fa-arrow-right" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6">
        {/* Subtle blue radial glow */}
        <div
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[820px] h-[420px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #0C66E4 0%, transparent 70%)' }}
        />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D2125] border border-[#2C333A] text-xs font-medium text-[#85B8FF]">
            <i className="fa-solid fa-wand-magic-sparkles" />
            Nền tảng Quản lý Dự án Đa Không Gian (Spaces) chuẩn Jira Cloud
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Lập kế hoạch, theo dõi và bàn giao{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#579DFF] to-emerald-400">
              mọi dự án trên một nền tảng
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#9FADBC] leading-relaxed">
            Tạo nhiều dự án độc lập, mời thành viên bằng đường dẫn tự đặt mật khẩu, phân quyền chặt chẽ
            4 vai trò và chuyển đổi tức thì giữa <strong>List, Kanban Board, Summary & Timeline</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="/login?mode=register"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0C66E4] hover:bg-[#0055CC] text-white text-sm font-bold shadow-lg shadow-blue-900/40 transition-all"
            >
              Tạo tài khoản miễn phí
              <i className="fa-solid fa-arrow-up-right-from-square" />
            </a>
            <a
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1D2125] hover:bg-[#282E33] border border-[#38414A] text-white text-sm font-semibold transition-all"
            >
              Đăng nhập ngay
              <i className="fa-solid fa-arrow-right" />
            </a>
          </div>
        </div>

        {/* 3. INTERACTIVE JIRA UI MOCKUP PREVIEW */}
        <div className="max-w-5xl mx-auto mt-14 relative z-10">
          <div className="rounded-2xl border border-[#2C333A] bg-[#1D2125] shadow-2xl shadow-black/60 overflow-hidden">
            {/* Mockup Window Bar */}
            <div className="px-5 py-3 border-b border-[#2C333A] bg-[#161A1D] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono text-[#8C9BAB]">
                  Spaces / <strong className="text-white">GymPilot (GYM)</strong>
                </span>
              </div>

              <div className="flex items-center gap-1 bg-[#1D2125] p-1 rounded-lg border border-[#2C333A]">
                <button
                  type="button"
                  onClick={() => setPreviewTab('list')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    previewTab === 'list'
                      ? 'bg-[#0C66E4] text-white'
                      : 'text-[#9FADBC] hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-list" /> List View
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('board')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    previewTab === 'board'
                      ? 'bg-[#0C66E4] text-white'
                      : 'text-[#9FADBC] hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-table-columns" /> Board View
                </button>
              </div>
            </div>

            {/* Mockup Body */}
            {previewTab === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[680px]">
                  <thead className="border-b border-[#2C333A] text-[#8C9BAB] bg-[#1D2125]">
                    <tr>
                      <th className="py-3 pl-5 pr-3 font-semibold">Work</th>
                      <th className="py-3 px-3 font-semibold">Assignee</th>
                      <th className="py-3 px-3 font-semibold">Priority</th>
                      <th className="py-3 pl-3 pr-5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C333A]">
                    {PREVIEW_TASKS.map((t) => (
                      <tr key={t.key} className="hover:bg-[#22272B] transition-colors">
                        <td className="py-3 pl-5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <i className="fa-solid fa-square-check text-[#579DFF]" />
                            <span className="font-mono font-bold text-[#579DFF]">{t.key}</span>
                            <span className="text-[#DEE4EA] font-medium">{t.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${t.color}`}
                            >
                              {t.assignee.charAt(0)}
                            </span>
                            <span>{t.assignee}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {t.priority === 'Highest' ? (
                            <span className="inline-flex items-center gap-1 text-red-400 font-medium">
                              <i className="fa-solid fa-fire" /> Highest
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-orange-400 font-medium">
                              <i className="fa-solid fa-arrow-up" /> High
                            </span>
                          )}
                        </td>
                        <td className="py-3 pl-3 pr-5">
                          <span
                            className={`px-2.5 py-1 rounded text-[11px] font-bold border ${t.statusClass}`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#161A1D]">
                {['To Do', 'In Progress', 'In Review', 'Done'].map((col) => {
                  const items = PREVIEW_TASKS.filter((t) => t.status === col);
                  return (
                    <div
                      key={col}
                      className="rounded-xl border border-[#2C333A] bg-[#1D2125] p-3 space-y-2.5"
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#9FADBC] flex justify-between">
                        <span>{col}</span>
                        <span className="font-mono">{items.length}</span>
                      </div>
                      {items.map((t) => (
                        <div
                          key={t.key}
                          className="p-3 rounded-lg bg-[#22272B] border border-[#2C333A] space-y-2"
                        >
                          <span className="font-mono text-[10px] font-bold text-[#579DFF]">
                            {t.key}
                          </span>
                          <div className="text-xs font-semibold text-white leading-snug">
                            {t.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. 5 MULTI-VIEW FEATURES */}
      <section id="views" className="py-16 px-6 border-t border-[#22272B] bg-[#161A1D]/60">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Một dự án, 5 góc nhìn linh hoạt
            </h2>
            <p className="text-xs sm:text-sm text-[#9FADBC]">
              Dù bạn là Sếp xem tổng quan, PM lập lộ trình hay Dev nhận task — mọi dữ liệu đồng bộ tức thì.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                icon: <i className="fa-solid fa-globe text-[#579DFF]" />,
                title: 'Summary',
                desc: 'Biểu đồ tiến độ, phân bổ trạng thái, ưu tiên và khối lượng việc từng thành viên.',
              },
              {
                icon: <i className="fa-solid fa-list text-emerald-400" />,
                title: 'List View',
                desc: 'Sort 3 trạng thái trên 7 cột, lọc nhanh theo Avatar, Group nhóm và + Create tại chỗ.',
              },
              {
                icon: <i className="fa-solid fa-table-columns text-purple-400" />,
                title: 'Kanban Board',
                desc: 'Kéo thả 4 cột mượt mà chuẩn Jira, mở Drawer chi tiết kèm Action Checklist %.',
              },
              {
                icon: <i className="fa-solid fa-calendar-days text-amber-400" />,
                title: 'Timeline',
                desc: 'Chia Giai đoạn (Milestones / Sprints) và bám sát hạn chót từng hạng mục.',
              },
              {
                icon: <i className="fa-solid fa-users text-rose-400" />,
                title: 'Members',
                desc: 'Mời thành viên qua Gmail tự đặt mật khẩu riêng, phân quyền và quản lý vai trò.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl border border-[#2C333A] bg-[#1D2125] space-y-3 hover:border-[#579DFF]/60 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#22272B] border border-[#2C333A] flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-[#9FADBC] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 4-ROLE RBAC & GMAIL NOTIFICATIONS */}
      <section id="roles" className="py-16 px-6 border-t border-[#22272B]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* RBAC Block */}
          <div className="p-6 rounded-2xl border border-[#2C333A] bg-[#1D2125] space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400">
              <i className="fa-solid fa-shield-halved" /> PHÂN QUYỀN RBAC CHẶT CHẼ
            </div>
            <h3 className="text-xl font-bold text-white">
              4 Vai trò rõ ràng từ Giao diện tới Backend
            </h3>
            <div className="space-y-2.5 text-xs">
              {[
                {
                  role: 'ADMIN',
                  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  text: 'Toàn quyền tạo/xóa dự án, thêm/đổi vai trò thành viên và phê duyệt công việc.',
                },
                {
                  role: 'PM',
                  badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                  text: 'Tạo Milestone, giao việc, đặt hạn chót, nghiệm thu từ In Review sang Done.',
                },
                {
                  role: 'MEMBER',
                  badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                  text: 'Thực hiện Task được giao, tick Checklist và đẩy sang In Review chờ PM duyệt.',
                },
                {
                  role: 'VIEWER',
                  badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
                  text: 'Chế độ chỉ đọc minh bạch cho khách hàng/stakeholder, khóa toàn bộ thao tác sửa.',
                },
              ].map((r) => (
                <div
                  key={r.role}
                  className="p-3 rounded-lg bg-[#22272B] border border-[#2C333A] flex items-start gap-3"
                >
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 mt-0.5 ${r.badge}`}
                  >
                    {r.role}
                  </span>
                  <span className="text-[#B6C2CF] leading-relaxed">{r.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications & Gmail Block */}
          <div
            id="notifications"
            className="p-6 rounded-2xl border border-[#2C333A] bg-[#1D2125] flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
                <i className="fa-solid fa-bell" /> GỌN NHẸ & THÔNG BÁO TRỰC TIẾP
              </div>
              <h3 className="text-xl font-bold text-white">
                Bắt đầu tức thì, theo dõi mọi thay đổi ngay trên Header
              </h3>
              <ul className="space-y-3 text-xs text-[#B6C2CF]">
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-circle-check text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Đăng ký nhanh không rườm rà:</strong> Tạo tài
                    khoản và vào thẳng không gian Spaces chỉ trong 5 giây.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-envelope-circle-check text-[#579DFF] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Mời thành viên bằng Link bảo mật:</strong> Copy
                    đường dẫn mời 24h gửi trực tiếp để đồng đội tự đặt mật khẩu riêng.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-bell text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Chuông thông báo 🔔 ngay trên Header:</strong>{' '}
                    Tự động báo khi có Task mới, chuyển In Review/Done hoặc thay đổi Deadline.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[#2C333A] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#8C9BAB]">Sẵn sàng trải nghiệm ngay trên Cloud?</span>
              <a
                href="/login"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs font-bold transition-colors"
              >
                Mở trang Đăng nhập
                <i className="fa-solid fa-arrow-up-right-from-square" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="py-8 px-6 border-t border-[#22272B] text-center text-xs text-[#6B778C]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold text-[#9FADBC]">
            <i className="fa-solid fa-layer-group text-[#579DFF]" />
            TaskMG Workspace — Multi-Project Jira Standard
          </div>
          <div>Next.js • Supabase PostgreSQL • Vercel Cloud</div>
        </div>
      </footer>
    </div>
  );
}
