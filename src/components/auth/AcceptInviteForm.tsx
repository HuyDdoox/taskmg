'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeInviteSetupAction } from '@/app/actions/auth-actions';
import { getRoleBadgeStyle } from '@/lib/rbac';
import { FolderKanban, KeyRound, CheckCircle2 } from 'lucide-react';

interface AcceptInviteFormProps {
  token: string;
  invite: {
    email: string;
    fullName: string;
    role: string;
    project: { id: string; name: string; projectKey: string } | null;
  };
}

export function AcceptInviteForm({ token, invite }: AcceptInviteFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(invite.fullName);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    const res = await completeInviteSetupAction(token, fullName, password);
    setLoading(false);

    if (res.success) {
      router.push(res.projectId ? `/projects/${res.projectId}` : '/spaces');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Không thể đặt mật khẩu');
    }
  };

  return (
    <div className="min-h-screen bg-[#1D2125] text-[#B6C2CF] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0C66E4] to-emerald-400 text-white flex items-center justify-center mx-auto shadow-lg">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Chào mừng tới TaskMG!</h1>
          <p className="text-xs text-[#8C9BAB]">
            Đặt mật khẩu riêng của bạn để kích hoạt tài khoản và tham gia dự án
          </p>
        </div>

        <div className="bg-[#22272B] border border-[#2C333A] rounded-2xl p-6 shadow-2xl space-y-5">
          {/* Invite summary */}
          {invite.project && (
            <div className="p-3.5 rounded-xl bg-[#1D2125] border border-[#2C333A] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] text-[#8C9BAB]">Bạn được mời vào dự án:</div>
                <div className="text-sm font-bold text-white truncate">
                  [{invite.project.projectKey}] {invite.project.name}
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${getRoleBadgeStyle(
                  invite.role,
                  true
                )}`}
              >
                {invite.role}
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#B6C2CF] mb-1">Email được mời</label>
              <input
                type="email"
                value={invite.email}
                disabled
                className="w-full px-3 py-2.5 rounded-lg bg-[#161A1D] border border-[#2C333A] text-[#8C9BAB] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#B6C2CF] mb-1">Họ và Tên hiển thị</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#1D2125] border border-[#38414A] text-white focus:outline-none focus:ring-2 focus:ring-[#579DFF]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#B6C2CF] mb-1 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-[#579DFF]" /> Mật khẩu mới (tối thiểu 6 ký tự)
              </label>
              <input
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#1D2125] border border-[#38414A] text-white focus:outline-none focus:ring-2 focus:ring-[#579DFF]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#B6C2CF] mb-1">Xác nhận mật khẩu</label>
              <input
                type="password"
                required
                placeholder="••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#1D2125] border border-[#38414A] text-white focus:outline-none focus:ring-2 focus:ring-[#579DFF]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Đang kích hoạt...' : 'Hoàn tất & Vào Dự Án ngay'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
