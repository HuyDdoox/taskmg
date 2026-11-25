export type ProjectRole = 'ADMIN' | 'PM' | 'MEMBER' | 'VIEWER';

export function normalizeRole(role?: string | null): ProjectRole {
  const upper = (role || 'VIEWER').toUpperCase();
  if (upper === 'ADMIN' || upper === 'PM' || upper === 'MEMBER' || upper === 'VIEWER') {
    return upper;
  }
  return 'VIEWER';
}

export function isDoneColumnTitle(title?: string | null): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  return lower.includes('done') || lower.includes('hoàn thành');
}

export interface ProjectPermissions {
  role: ProjectRole;
  canDeleteProject: boolean;
  canAddMember: boolean;
  canManageMemberRoles: boolean;
  canManageMilestones: boolean;
  canCreateTask: boolean;
  canDeleteTask: boolean;
  canAssignOthers: boolean;
  canEditTaskMeta: boolean;
  canMoveToDone: boolean;
  isReadOnly: boolean;
}

export function getProjectPermissions(roleInput?: string | null): ProjectPermissions {
  const role = normalizeRole(roleInput);
  return {
    role,
    canDeleteProject: role === 'ADMIN',
    canAddMember: role === 'ADMIN' || role === 'PM',
    canManageMemberRoles: role === 'ADMIN',
    canManageMilestones: role === 'ADMIN' || role === 'PM',
    canCreateTask: role === 'ADMIN' || role === 'PM' || role === 'MEMBER',
    canDeleteTask: role === 'ADMIN' || role === 'PM',
    canAssignOthers: role === 'ADMIN' || role === 'PM',
    canEditTaskMeta: role === 'ADMIN' || role === 'PM',
    canMoveToDone: role === 'ADMIN' || role === 'PM',
    isReadOnly: role === 'VIEWER',
  };
}

export function canUserModifyTaskStatus(
  roleInput: string | null | undefined,
  taskAssigneeId: string | null | undefined,
  currentUserId: string | null | undefined
): boolean {
  const role = normalizeRole(roleInput);
  if (role === 'ADMIN' || role === 'PM') return true;
  if (role === 'VIEWER') return false;
  // MEMBER chỉ được thao tác trên task được giao cho mình (hoặc chưa gán)
  return !taskAssigneeId || taskAssigneeId === currentUserId;
}

export function canUserToggleChecklist(
  roleInput: string | null | undefined,
  taskAssigneeId: string | null | undefined,
  currentUserId: string | null | undefined
): boolean {
  return canUserModifyTaskStatus(roleInput, taskAssigneeId, currentUserId);
}

export function getRoleBadgeStyle(roleInput?: string | null, isDark = true): string {
  const role = normalizeRole(roleInput);
  switch (role) {
    case 'ADMIN':
      return isDark
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        : 'bg-amber-100 text-amber-800 border-amber-300';
    case 'PM':
      return isDark
        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
        : 'bg-purple-100 text-purple-800 border-purple-300';
    case 'MEMBER':
      return isDark
        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
        : 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return isDark
        ? 'bg-slate-500/20 text-slate-300 border-slate-500/40'
        : 'bg-gray-100 text-gray-700 border-gray-300';
  }
}
