'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  loginAction,
  registerAction,
  quickLoginDemoAction,
} from '@/app/actions/auth-actions';
import { getRoleBadgeStyle } from '@/lib/rbac';

interface LoginFormProps {
  demoAccounts: any[];
  defaultMode?: 'LOGIN' | 'REGISTER';
}

export function LoginForm({ demoAccounts, defaultMode = 'LOGIN' }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(defaultMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res =
      mode === 'LOGIN'
        ? await loginAction(email, password)
        : await registerAction(fullName, email, password);

    setLoading(false);

    if (res.success) {
      router.push('/spaces');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Có lỗi xảy ra');
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setErrorMsg('');
    setLoading(true);
    const res = await quickLoginDemoAction(demoEmail);
    setLoading(false);
    if (res.success) {
      router.push('/spaces');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Không thể đăng nhập demo');
    }
  };

  return (
    <div className="min-h-screen bg-[#1D2125] text-[#B6C2CF] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branding (Click to go Home) */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0C66E4] to-sky-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-900/30 group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-layer-group text-xl" />
            </div>
            <h1 className="text-xl font-bold text-white mt-2 group-hover:text-[#579DFF] transition-colors">
              TaskMG Workspace
            </h1>
          </Link>
          <p className="text-xs text-[#8C9BAB]">
            Hệ thống quản lý Dự án & Công việc chuẩn Jira với Phân quyền RBAC
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#22272B] border border-[#2C333A] rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="grid grid-cols-2 p-1 rounded-lg bg-[#1D2125] border border-[#2C333A]">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMsg('');
              }}
              className={`py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'LOGIN'
                  ? 'bg-[#0C66E4] text-white'
                  : 'text-[#8C9BAB] hover:text-white'
              }`}
            >
              <i className="fa-solid fa-right-to-bracket text-xs" /> Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setErrorMsg('');
              }}
              className={`py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                mode === 'REGISTER'
                  ? 'bg-[#0C66E4] text-white'
                  : 'text-[#8C9BAB] hover:text-white'
              }`}
            >
              <i className="fa-solid fa-user-plus text-xs" /> Đăng ký
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'REGISTER' && (
              <div>
                <label className="block font-semibold text-[#B6C2CF] mb-1">Họ và Tên</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn Huy"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#1D2125] border border-[#38414A] text-white placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#579DFF]"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#B6C2CF] mb-1">Email</label>
              <input
                type="email"
                required
                placeholder="tenban@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#1D2125] border border-[#38414A] text-white placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#579DFF]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#B6C2CF] mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#1D2125] border border-[#38414A] text-white placeholder-[#6B778C] focus:outline-none focus:ring-2 focus:ring-[#579DFF]"
              />
              {mode === 'LOGIN' && (
                <p className="text-[11px] text-[#6B778C] mt-1">
                  Mật khẩu mặc định tài khoản mẫu: <code className="text-[#579DFF]">123456</code>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? 'Đang xử lý...'
                : mode === 'LOGIN'
                ? 'Đăng nhập vào Workspace'
                : 'Tạo tài khoản & Vào Workspace'}
            </button>
          </form>
        </div>

        {/* Quick 1-click Demo Accounts for Testing RBAC */}
        {demoAccounts.length > 0 && (
          <div className="bg-[#22272B] border border-[#2C333A] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <i className="fa-solid fa-shield-halved text-sm text-[#579DFF]" />
              Đăng nhập nhanh tài khoản Demo (Test 4 Role)
            </div>
            <div className="space-y-2">
              {demoAccounts.map((acc) => {
                const role = acc.memberships?.[0]?.role || 'MEMBER';
                return (
                  <button
                    key={acc.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickDemo(acc.email)}
                    className="w-full p-2.5 rounded-lg bg-[#1D2125] hover:bg-[#2C333A] border border-[#2C333A] flex items-center justify-between text-left transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {acc.fullName}
                      </div>
                      <div className="text-[11px] text-[#8C9BAB] truncate">{acc.email}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadgeStyle(
                          role,
                          true
                        )}`}
                      >
                        {role}
                      </span>
                      <i className="fa-solid fa-arrow-right text-xs text-[#579DFF]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
