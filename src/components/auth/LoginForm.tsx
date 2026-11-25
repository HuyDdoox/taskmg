'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  loginAction,
  registerAction,
  verifyOtpAction,
  resendOtpAction,
  quickLoginDemoAction,
} from '@/app/actions/auth-actions';
import { getRoleBadgeStyle } from '@/lib/rbac';
import {
  FolderKanban,
  LogIn,
  UserPlus,
  ShieldCheck,
  ArrowRight,
  MailCheck,
  RefreshCw,
} from 'lucide-react';

interface LoginFormProps {
  demoAccounts: any[];
  defaultMode?: 'LOGIN' | 'REGISTER';
}

export function LoginForm({ demoAccounts, defaultMode = 'LOGIN' }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'VERIFY_OTP'>(defaultMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | undefined>(undefined);
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    if (mode === 'LOGIN') {
      const res: any = await loginAction(email, password);
      setLoading(false);
      if (res.success) {
        router.push('/spaces');
        router.refresh();
      } else if (res.requiresOtp) {
        setMode('VERIFY_OTP');
        setDevOtpHint(res.devOtp);
        setInfoMsg(res.error || 'Vui lòng nhập mã OTP 6 số gửi tới Gmail của bạn.');
      } else {
        setErrorMsg(res.error || 'Có lỗi xảy ra');
      }
      return;
    }

    if (mode === 'REGISTER') {
      const res: any = await registerAction(fullName, email, password);
      setLoading(false);
      if (res.success && res.requiresOtp) {
        setMode('VERIFY_OTP');
        setDevOtpHint(res.devOtp);
        setInfoMsg(
          res.emailSent
            ? `Đã gửi mã OTP 6 số đến ${res.email}. Vui lòng kiểm tra hộp thư Gmail!`
            : `Đã tạo tài khoản! (Chưa cấu hình SMTP Gmail trên server nên hiển thị mã OTP dự phòng bên dưới).`
        );
      } else {
        setErrorMsg(res.error || 'Không thể đăng ký');
      }
      return;
    }

    if (mode === 'VERIFY_OTP') {
      const res = await verifyOtpAction(email, otp);
      setLoading(false);
      if (res.success) {
        router.push('/spaces');
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Mã OTP không đúng');
      }
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg('');
    setLoading(true);
    const res: any = await resendOtpAction(email);
    setLoading(false);
    if (res.success) {
      setDevOtpHint(res.devOtp);
      setInfoMsg(
        res.emailSent
          ? `Đã gửi lại mã OTP mới tới ${email}!`
          : 'Đã tạo mã OTP mới (dùng mã dự phòng bên dưới).'
      );
    } else {
      setErrorMsg(res.error || 'Không thể gửi lại mã');
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
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0C66E4] to-sky-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-900/30">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">TaskMG Workspace</h1>
          <p className="text-xs text-[#8C9BAB]">
            Hệ thống quản lý Dự án & Công việc chuẩn Jira với Phân quyền RBAC
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#22272B] border border-[#2C333A] rounded-2xl p-6 shadow-2xl space-y-5">
          {mode !== 'VERIFY_OTP' ? (
            <div className="grid grid-cols-2 p-1 rounded-lg bg-[#1D2125] border border-[#2C333A]">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className={`py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  mode === 'LOGIN'
                    ? 'bg-[#0C66E4] text-white'
                    : 'text-[#8C9BAB] hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className={`py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  mode === 'REGISTER'
                    ? 'bg-[#0C66E4] text-white'
                    : 'text-[#8C9BAB] hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Đăng ký
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <MailCheck className="w-5 h-5 text-emerald-400" />
              Xác nhận Gmail (Mã OTP 6 số)
            </div>
          )}

          {infoMsg && (
            <div className="p-3 rounded-lg bg-[#0C66E4]/15 border border-[#579DFF]/30 text-[#85B8FF] text-xs leading-relaxed">
              {infoMsg}
              {devOtpHint && (
                <div className="mt-2 p-2 rounded bg-[#1D2125] border border-dashed border-[#579DFF]/50 text-center">
                  Mã OTP của bạn:{' '}
                  <strong className="font-mono text-sm tracking-widest text-white">
                    {devOtpHint}
                  </strong>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'VERIFY_OTP' ? (
              <>
                <div>
                  <label className="block font-semibold text-[#B6C2CF] mb-1">
                    Nhập mã OTP 6 số đã gửi tới <span className="text-white">{email}</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-3 rounded-lg bg-[#1D2125] border border-[#38414A] text-white text-center font-mono text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#579DFF]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Đang xác nhận...' : 'Xác nhận & Vào Workspace'}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('LOGIN');
                      setOtp('');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                    className="text-[#8C9BAB] hover:text-white cursor-pointer"
                  >
                    ← Quay lại đăng nhập
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleResendOtp}
                    className="inline-flex items-center gap-1 text-[#579DFF] hover:underline font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Gửi lại mã OTP
                  </button>
                </div>
              </>
            ) : (
              <>
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
                  <label className="block font-semibold text-[#B6C2CF] mb-1">Email / Gmail</label>
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
                    : 'Đăng ký & Nhận mã xác nhận Gmail'}
                </button>
              </>
            )}
          </form>
        </div>

        {/* Quick 1-click Demo Accounts for Testing RBAC */}
        {demoAccounts.length > 0 && mode !== 'VERIFY_OTP' && (
          <div className="bg-[#22272B] border border-[#2C333A] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <ShieldCheck className="w-4 h-4 text-[#579DFF]" />
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
                      <ArrowRight className="w-3.5 h-3.5 text-[#579DFF]" />
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
