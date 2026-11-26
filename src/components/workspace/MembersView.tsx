'use client';

import React, { useState, useMemo } from 'react';
import {
  addProjectMember,
  checkUserByEmail,
  updateProjectMemberRole,
  removeProjectMember,
} from '@/app/actions/member-actions';
import { ProjectPermissions, getRoleBadgeStyle } from '@/lib/rbac';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface MembersViewProps {
  project: any;
  allUsers: any[];
  tasks: any[];
  permissions: ProjectPermissions;
  isDark: boolean;
  onMemberAdded: (member: any) => void;
  onMemberUpdated: (member: any) => void;
  onMemberRemoved: (memberId: string) => void;
}

function getInitials(name?: string) {
  if (!name) return 'U';
  const cleaned = name.replace(/\([^)]*\)/g, '').trim();
  const parts = (cleaned || name.trim()).split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function MembersView({
  project,
  allUsers,
  tasks,
  permissions,
  isDark,
  onMemberAdded,
  onMemberUpdated,
  onMemberRemoved,
}: MembersViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [mode, setMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<{
    checkedEmail: string;
    exists: boolean;
    alreadyMember: boolean;
    isPendingInvite?: boolean;
    user?: { id: string; fullName: string; email: string };
    message: string;
  } | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [inviteBanner, setInviteBanner] = useState<{
    name: string;
    email: string;
    link: string;
    emailSent: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const members = project.members || [];
  const memberUserIds = useMemo(
    () => new Set(members.map((m: any) => m.userId)),
    [members]
  );
  const availableUsers = useMemo(
    () => allUsers.filter((u) => !memberUserIds.has(u.id)),
    [allUsers, memberUserIds]
  );

  // Instant check in NEW mode so user sees if email already has an account
  const matchedExistingInNewMode = useMemo(() => {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@')) return null;
    const found = allUsers.find((u) => u.email?.toLowerCase() === clean);
    if (!found) return null;
    return {
      ...found,
      alreadyMember: memberUserIds.has(found.id),
    };
  }, [email, allUsers, memberUserIds]);

  const handleCheckEmail = async (rawToCheck?: string) => {
    const targetEmail = (rawToCheck ?? lookupEmail).trim().toLowerCase();
    setErrorMsg('');
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMsg('Vui lòng nhập đúng định dạng Email để kiểm tra tài khoản');
      return;
    }

    setCheckingEmail(true);
    const res = await checkUserByEmail(project.id, targetEmail);
    setCheckingEmail(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Không thể kiểm tra tài khoản');
      return;
    }

    setEmailCheckResult({
      checkedEmail: targetEmail,
      exists: Boolean(res.exists),
      alreadyMember: Boolean(res.alreadyMember),
      isPendingInvite: Boolean(res.isPendingInvite),
      user: res.user,
      message: res.message || '',
    });

    if (res.exists && res.user && !res.alreadyMember) {
      setSelectedUserId(res.user.id);
    } else if (!res.exists) {
      setSelectedUserId('');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'EXISTING') {
      if (!selectedUserId && lookupEmail.trim()) {
        setSubmitting(true);
        const checkRes = await checkUserByEmail(project.id, lookupEmail.trim());
        if (!checkRes.success) {
          setSubmitting(false);
          setErrorMsg(checkRes.error || 'Không thể kiểm tra tài khoản');
          return;
        }
        setEmailCheckResult({
          checkedEmail: lookupEmail.trim().toLowerCase(),
          exists: Boolean(checkRes.exists),
          alreadyMember: Boolean(checkRes.alreadyMember),
          isPendingInvite: Boolean(checkRes.isPendingInvite),
          user: checkRes.user,
          message: checkRes.message || '',
        });
        if (!checkRes.exists || !checkRes.user) {
          setSubmitting(false);
          setErrorMsg(
            `Email "${lookupEmail.trim()}" chưa tạo tài khoản trên hệ thống! Hãy bấm "Chuyển sang Tạo & Mời người mới" bên dưới nếu muốn tạo tài khoản mời.`
          );
          return;
        }
        if (checkRes.alreadyMember) {
          setSubmitting(false);
          setErrorMsg(checkRes.message || 'Thành viên này đã ở trong dự án');
          return;
        }
        const addRes: any = await addProjectMember({
          projectId: project.id,
          userId: checkRes.user.id,
          role,
          allowCreateNew: false,
        });
        setSubmitting(false);
        if (addRes.success && addRes.member) {
          onMemberAdded(addRes.member);
          setSelectedUserId('');
          setLookupEmail('');
          setEmailCheckResult(null);
          setIsAddOpen(false);
        } else {
          setErrorMsg(addRes.error || 'Không thể thêm thành viên');
        }
        return;
      }

      if (!selectedUserId) {
        setErrorMsg('Vui lòng kiểm tra Email hoặc chọn một tài khoản đã tạo để thêm vào dự án');
        return;
      }
    }

    setSubmitting(true);

    const res: any = await addProjectMember(
      mode === 'EXISTING'
        ? { projectId: project.id, userId: selectedUserId, role, allowCreateNew: false }
        : { projectId: project.id, fullName, email, role, allowCreateNew: true }
    );

    setSubmitting(false);

    if (res.success && res.member) {
      onMemberAdded(res.member);
      if (res.isBrandNewUser && res.invitePath) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        setInviteBanner({
          name: res.member.user.fullName,
          email: res.member.user.email,
          link: `${origin}${res.invitePath}`,
          emailSent: Boolean(res.emailSent),
        });
        setCopied(false);
      }
      setSelectedUserId('');
      setLookupEmail('');
      setEmailCheckResult(null);
      setFullName('');
      setEmail('');
      setRole('MEMBER');
      setIsAddOpen(false);
    } else {
      setErrorMsg(res.error || 'Không thể thêm thành viên');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const res = await updateProjectMemberRole(memberId, newRole, project.id);
    if (res.success && res.member) {
      onMemberUpdated(res.member);
    }
  };

  const handleRemove = async (member: any) => {
    if (member.userId === project.ownerId) {
      alert('Không thể xóa chủ sở hữu dự án');
      return;
    }
    if (!confirm(`Xóa "${member.user?.fullName}" khỏi dự án này?`)) return;
    const res = await removeProjectMember(member.id, project.id);
    if (res.success) {
      onMemberRemoved(member.id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <i className="fa-solid fa-users text-[#579DFF]" />
              Thành viên Dự án ({members.length})
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
              Thêm thành viên tham gia dự án để giao việc (Assignee) và phân quyền quản lý.
            </p>
          </div>
          {permissions.canAddMember && (
            <button
              onClick={() => {
                setMode('EXISTING');
                setErrorMsg('');
                setEmailCheckResult(null);
                setLookupEmail('');
                setSelectedUserId('');
                setIsAddOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              <i className="fa-solid fa-user-plus" /> Thêm Thành Viên
            </button>
          )}
        </div>

        {/* Invite Link Banner for newly created member */}
        {inviteBanner && (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="font-bold">
                ✅ Đã mời {inviteBanner.name} ({inviteBanner.email})!
              </div>
              <div className="opacity-85">
                Copy đường dẫn bên dưới gửi cho thành viên để họ tự đặt mật khẩu và vào thẳng dự án:
              </div>
              <div className="font-mono text-[11px] truncate opacity-80">{inviteBanner.link}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(inviteBanner.link);
                  setCopied(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white font-semibold cursor-pointer"
              >
                {copied ? <i className="fa-solid fa-check" /> : <i className="fa-regular fa-copy" />}
                {copied ? 'Đã copy!' : 'Copy Link Mời'}
              </button>
              <button
                type="button"
                onClick={() => setInviteBanner(null)}
                className="p-1.5 rounded hover:bg-black/10 cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
        )}

        {/* Members List */}
        <div
          className={`rounded-xl border divide-y overflow-hidden ${
            isDark
              ? 'bg-[#22272B] border-[#2C333A] divide-[#2C333A]'
              : 'bg-white border-gray-200 divide-gray-100'
          }`}
        >
          {members.map((m: any) => {
            const assignedCount = tasks.filter((t) => t.assigneeId === m.userId).length;
            const isOwner = m.userId === project.ownerId;

            return (
              <div
                key={m.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0C66E4] to-sky-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(m.user?.fullName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {m.user?.fullName}
                      </span>
                      {isOwner && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                          Owner
                        </span>
                      )}
                    </div>
                    <div className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
                      <i className="fa-solid fa-envelope" /> {m.user?.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded-md ${
                      isDark ? 'bg-[#1D2125] text-[#9FADBC]' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {assignedCount} tasks
                  </span>

                  <div className="flex items-center gap-1.5">
                    <i className="fa-solid fa-shield-halved text-[#579DFF]" />
                    <CustomSelect
                      value={m.role}
                      disabled={isOwner || !permissions.canManageMemberRoles}
                      isDark={isDark}
                      menuAlign="right"
                      minMenuWidth="min-w-[140px]"
                      onChange={(val) => handleRoleChange(m.id, val)}
                      buttonClassName={`px-2.5 py-1 rounded-lg border text-xs font-bold ${getRoleBadgeStyle(
                        m.role,
                        isDark
                      )}`}
                      options={[
                        { value: 'ADMIN', label: 'ADMIN', badgeClass: getRoleBadgeStyle('ADMIN', isDark) },
                        { value: 'PM', label: 'PM', badgeClass: getRoleBadgeStyle('PM', isDark) },
                        { value: 'MEMBER', label: 'MEMBER', badgeClass: getRoleBadgeStyle('MEMBER', isDark) },
                        { value: 'VIEWER', label: 'VIEWER', badgeClass: getRoleBadgeStyle('VIEWER', isDark) },
                      ]}
                    />
                  </div>

                  {!isOwner && permissions.canManageMemberRoles && (
                    <button
                      onClick={() => handleRemove(m)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark
                          ? 'text-[#8C9BAB] hover:text-red-400 hover:bg-red-500/10'
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title="Gỡ khỏi dự án (Chỉ ADMIN)"
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddOpen && (
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
                <i className="fa-solid fa-user-plus text-[#579DFF]" />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Thêm Thành Viên Vào Dự Án
                </h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="p-1 opacity-70 hover:opacity-100 cursor-pointer">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-5 space-y-4 text-xs">
              {/* Mode switcher */}
              <div
                className={`grid grid-cols-2 p-1 rounded-lg ${
                  isDark ? 'bg-[#1D2125]' : 'bg-gray-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode('EXISTING');
                    setErrorMsg('');
                  }}
                  className={`py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    mode === 'EXISTING'
                      ? 'bg-[#0C66E4] text-white'
                      : isDark
                      ? 'text-[#9FADBC]'
                      : 'text-gray-600'
                  }`}
                >
                  Kiểm tra / Chọn có sẵn ({availableUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('NEW');
                    setErrorMsg('');
                  }}
                  className={`py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    mode === 'NEW'
                      ? 'bg-[#0C66E4] text-white'
                      : isDark
                      ? 'text-[#9FADBC]'
                      : 'text-gray-600'
                  }`}
                >
                  + Tạo & Mời người mới
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400">
                  {errorMsg}
                </div>
              )}

              {mode === 'EXISTING' ? (
                <div className="space-y-3.5">
                  {/* 1. Check account existence by email */}
                  <div>
                    <label className="block font-semibold mb-1.5">
                      Kiểm tra tài khoản đã tạo theo Email
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Nhập email để check tài khoản (VD: deva@company.com)..."
                        value={lookupEmail}
                        onChange={(e) => {
                          setLookupEmail(e.target.value);
                          if (emailCheckResult) setEmailCheckResult(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCheckEmail();
                          }
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-[#1D2125] border-[#38414A] text-white placeholder-[#8C9BAB]'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleCheckEmail()}
                        disabled={checkingEmail || !lookupEmail.trim()}
                        className={`px-3 py-2 rounded-lg border font-semibold shrink-0 transition-colors cursor-pointer disabled:opacity-50 ${
                          isDark
                            ? 'bg-[#2C333A] border-[#454F59] text-white hover:bg-[#38414A]'
                            : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {checkingEmail ? (
                          <i className="fa-solid fa-spinner fa-spin" />
                        ) : (
                          <>
                            <i className="fa-solid fa-magnifying-glass mr-1" /> Kiểm tra
                          </>
                        )}
                      </button>
                    </div>

                    {/* Email Check Status Banner */}
                    {emailCheckResult && (
                      <div
                        className={`mt-2 p-2.5 rounded-lg border text-[11px] space-y-1.5 ${
                          emailCheckResult.exists && !emailCheckResult.alreadyMember
                            ? isDark
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : emailCheckResult.alreadyMember
                            ? isDark
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                            : isDark
                            ? 'bg-red-500/15 border-red-500/40 text-red-300'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        <div className="font-semibold flex items-center gap-1.5">
                          {emailCheckResult.exists && !emailCheckResult.alreadyMember ? (
                            <i className="fa-solid fa-circle-check text-emerald-400" />
                          ) : emailCheckResult.alreadyMember ? (
                            <i className="fa-solid fa-triangle-exclamation text-amber-400" />
                          ) : (
                            <i className="fa-solid fa-circle-xmark text-red-400" />
                          )}
                          <span>{emailCheckResult.message}</span>
                        </div>

                        {!emailCheckResult.exists && (
                          <button
                            type="button"
                            onClick={() => {
                              setEmail(emailCheckResult.checkedEmail);
                              setMode('NEW');
                              setErrorMsg('');
                            }}
                            className="inline-flex items-center gap-1 font-bold underline hover:opacity-90 cursor-pointer"
                          >
                            👉 Chuyển sang Tạo tài khoản mới & Lấy link mời cho {emailCheckResult.checkedEmail}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Quick Dropdown of available existing users */}
                  <div>
                    <label className="block font-semibold mb-1.5">
                      Hoặc chọn nhanh thành viên đã có tài khoản ({availableUsers.length})
                    </label>
                    {availableUsers.length === 0 ? (
                      <div className="p-3 rounded-lg border border-dashed border-[#38414A] text-center opacity-80">
                        Tất cả tài khoản hiện có trên hệ thống đã tham gia dự án này. Hãy chuyển sang tab{' '}
                        <strong>+ Tạo & Mời người mới</strong> để mời thêm!
                      </div>
                    ) : (
                      <select
                        value={selectedUserId}
                        onChange={(e) => {
                          setSelectedUserId(e.target.value);
                          const picked = availableUsers.find((u) => u.id === e.target.value);
                          if (picked) {
                            setLookupEmail(picked.email);
                            setEmailCheckResult({
                              checkedEmail: picked.email,
                              exists: true,
                              alreadyMember: false,
                              user: picked,
                              message: `Đã chọn tài khoản "${picked.fullName}" (${picked.email}).`,
                            });
                          }
                        }}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="">-- Chọn một tài khoản đã tạo --</option>
                        {availableUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName} ({u.email})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="VD: huy@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                    {email.trim().includes('@') && (
                      <div
                        className={`mt-1.5 p-2 rounded-lg border text-[11px] ${
                          matchedExistingInNewMode
                            ? matchedExistingInNewMode.alreadyMember
                              ? isDark
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                              : isDark
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : isDark
                            ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                            : 'bg-sky-50 border-sky-200 text-sky-800'
                        }`}
                      >
                        {matchedExistingInNewMode ? (
                          matchedExistingInNewMode.alreadyMember ? (
                            <span>
                              ⚠️ Email này <strong>đã có tài khoản</strong> ({matchedExistingInNewMode.fullName}) và{' '}
                              <strong>đã ở trong dự án</strong>!
                            </span>
                          ) : (
                            <span>
                              ✅ Phát hiện Email này <strong>đã tạo tài khoản</strong> ({matchedExistingInNewMode.fullName}). Hệ thống sẽ thêm trực tiếp tài khoản này vào dự án!
                            </span>
                          )
                        ) : (
                          <span>
                            🆕 Email này <strong>chưa tạo tài khoản</strong> — Hệ thống sẽ tạo tài khoản chờ kích hoạt và cấp Link mời (<code>/accept-invite</code>).
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Họ và Tên *</label>
                    <input
                      type="text"
                      required={!matchedExistingInNewMode}
                      placeholder={
                        matchedExistingInNewMode
                          ? matchedExistingInNewMode.fullName
                          : 'VD: Nguyễn Văn Huy'
                      }
                      value={matchedExistingInNewMode ? matchedExistingInNewMode.fullName : fullName}
                      disabled={Boolean(matchedExistingInNewMode)}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border disabled:opacity-70 ${
                        isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Vai trò trong dự án</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="ADMIN">ADMIN (Toàn quyền)</option>
                  <option value="PM">PM (Quản lý dự án)</option>
                  <option value="MEMBER">MEMBER (Thành viên thực hiện)</option>
                  <option value="VIEWER">VIEWER (Chỉ xem)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className={`px-3.5 py-2 rounded-lg border cursor-pointer ${
                    isDark ? 'border-[#38414A]' : 'border-gray-300'
                  }`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    (mode === 'EXISTING' &&
                      !selectedUserId &&
                      !lookupEmail.trim()) ||
                    Boolean(
                      mode === 'NEW' &&
                        matchedExistingInNewMode &&
                        matchedExistingInNewMode.alreadyMember
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Đang thêm...' : '+ Thêm vào Dự án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
