'use client';

import React, { useState } from 'react';
import {
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
} from '@/app/actions/member-actions';
import { ProjectPermissions, getRoleBadgeStyle } from '@/lib/rbac';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { UserPlus, Trash2, Shield, X, Mail, Users } from 'lucide-react';

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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const members = project.members || [];
  const memberUserIds = new Set(members.map((m: any) => m.userId));
  const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.id));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const res = await addProjectMember(
      mode === 'EXISTING'
        ? { projectId: project.id, userId: selectedUserId, role }
        : { projectId: project.id, fullName, email, role }
    );

    setSubmitting(false);

    if (res.success && res.member) {
      onMemberAdded(res.member);
      setSelectedUserId('');
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
              <Users className="w-4 h-4 text-[#579DFF]" />
              Thành viên Dự án ({members.length})
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8C9BAB]' : 'text-gray-500'}`}>
              Thêm thành viên tham gia dự án để giao việc (Assignee) và phân quyền quản lý.
            </p>
          </div>
          {permissions.canAddMember && (
            <button
              onClick={() => {
                setMode(availableUsers.length > 0 ? 'EXISTING' : 'NEW');
                setErrorMsg('');
                setIsAddOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Thêm Thành Viên
            </button>
          )}
        </div>

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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0C66E4] to-sky-400 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {m.user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
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
                      <Mail className="w-3 h-3" /> {m.user?.email}
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
                    <Shield className="w-3.5 h-3.5 text-[#579DFF]" />
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
                      <Trash2 className="w-4 h-4" />
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
                <UserPlus className="w-4 h-4 text-[#579DFF]" />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Thêm Thành Viên Vào Dự Án
                </h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="p-1 opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
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
                  onClick={() => setMode('EXISTING')}
                  className={`py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    mode === 'EXISTING'
                      ? 'bg-[#0C66E4] text-white'
                      : isDark
                      ? 'text-[#9FADBC]'
                      : 'text-gray-600'
                  }`}
                >
                  Chọn người có sẵn ({availableUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMode('NEW')}
                  className={`py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                    mode === 'NEW'
                      ? 'bg-[#0C66E4] text-white'
                      : isDark
                      ? 'text-[#9FADBC]'
                      : 'text-gray-600'
                  }`}
                >
                  + Tạo người mới
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400">
                  {errorMsg}
                </div>
              )}

              {mode === 'EXISTING' ? (
                <div>
                  <label className="block font-semibold mb-1.5">Chọn thành viên hệ thống</label>
                  {availableUsers.length === 0 ? (
                    <div className="p-3 rounded-lg border border-dashed border-[#38414A] text-center opacity-80">
                      Tất cả thành viên hiện có đã tham gia dự án này. Hãy chuyển sang tab{' '}
                      <strong>+ Tạo người mới</strong> để mời thêm!
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="">-- Chọn một người --</option>
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-1">Họ và Tên *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn Huy"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-[#1D2125] border-[#38414A] text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
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
                  disabled={submitting || (mode === 'EXISTING' && availableUsers.length === 0)}
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
