'use server';

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getProjectPermissions } from '@/lib/rbac';
import { resolveUserProjectRole } from './project-actions';
import { createAndDispatchNotifications } from './notification-actions';
import { revalidatePath } from 'next/cache';

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
      },
    });
    return { success: true, users };
  } catch (error) {
    console.error('Lỗi lấy danh sách người dùng:', error);
    return { success: false, users: [] };
  }
}

export async function checkUserByEmail(projectId: string, rawEmail: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, error: 'Vui lòng đăng nhập' };

    const email = rawEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Vui lòng nhập địa chỉ Email hợp lệ' };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        emailVerified: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return {
        success: true,
        exists: false,
        alreadyMember: false,
        message: `Email "${email}" chưa tạo tài khoản trên hệ thống.`,
      };
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    const isPendingInvite = user.passwordHash === 'pending-invite' && !user.emailVerified;

    return {
      success: true,
      exists: true,
      isPendingInvite,
      alreadyMember: Boolean(existingMember),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      message: existingMember
        ? `Tài khoản "${user.fullName}" (${user.email}) đã là thành viên trong dự án này.`
        : isPendingInvite
        ? `Tài khoản "${user.fullName}" đã được mời nhưng chưa đặt mật khẩu kích hoạt.`
        : `Đã tìm thấy tài khoản "${user.fullName}" (${user.email}) trên hệ thống.`,
    };
  } catch (error) {
    console.error('Lỗi kiểm tra tài khoản:', error);
    return { success: false, error: 'Không thể kiểm tra tài khoản lúc này' };
  }
}

export async function addProjectMember(data: {
  projectId: string;
  userId?: string;
  fullName?: string;
  email?: string;
  role: string;
  allowCreateNew?: boolean;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, error: 'Vui lòng đăng nhập' };

    const myRole = await resolveUserProjectRole(data.projectId, currentUser.id);
    const perms = getProjectPermissions(myRole);
    if (!perms.canAddMember) {
      return { success: false, error: 'Chỉ ADMIN hoặc PM mới có quyền thêm thành viên!' };
    }

    // PM không được phép gán quyền ADMIN
    const safeRole =
      myRole === 'PM' && data.role === 'ADMIN' ? 'MEMBER' : data.role || 'MEMBER';

    let targetUserId = data.userId;
    let isBrandNewUser = false;
    let generatedInviteToken: string | null = null;

    if (!targetUserId) {
      const email = data.email?.trim().toLowerCase();
      const fullName = data.fullName?.trim();

      if (!email) {
        return { success: false, error: 'Vui lòng nhập Email thành viên cần thêm' };
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        if (!data.allowCreateNew) {
          return {
            success: false,
            code: 'USER_NOT_FOUND',
            error: `Email "${email}" chưa tạo tài khoản trên hệ thống! Vui lòng kiểm tra lại hoặc chọn "+ Tạo & Mời người mới".`,
          };
        }

        if (!fullName) {
          return {
            success: false,
            error: 'Email này chưa có tài khoản. Vui lòng nhập thêm Họ và Tên để tạo tài khoản mời mới.',
          };
        }

        isBrandNewUser = true;
        generatedInviteToken = crypto.randomBytes(24).toString('hex');
        const createdUser = await prisma.user.create({
          data: {
            email,
            fullName,
            passwordHash: 'pending-invite',
            emailVerified: false,
            inviteToken: generatedInviteToken,
            inviteTokenExp: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        targetUserId = createdUser.id;
      }
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: data.projectId,
          userId: targetUserId,
        },
      },
    });

    if (existingMember) {
      return { success: false, error: 'Thành viên này đã tham gia dự án rồi' };
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: data.projectId,
        userId: targetUserId,
        role: safeRole,
      },
      include: { user: true, project: true },
    });

    await createAndDispatchNotifications({
      userIds: [targetUserId],
      excludeUserId: currentUser.id,
      projectId: data.projectId,
      type: 'PROJECT_INVITED',
      title: `Bạn được mời vào dự án [${member.project.projectKey}]`,
      message: `${currentUser.fullName} đã thêm bạn vào dự án "${member.project.name}" với vai trò ${safeRole}.`,
    });

    revalidatePath(`/projects/${data.projectId}`);
    revalidatePath('/spaces');
    return {
      success: true,
      member,
      isBrandNewUser,
      invitePath: generatedInviteToken ? `/accept-invite?token=${generatedInviteToken}` : undefined,
    };
  } catch (error: any) {
    console.error('Lỗi thêm thành viên:', error);
    return { success: false, error: error?.message || 'Không thể thêm thành viên vào dự án' };
  }
}

export async function updateProjectMemberRole(memberId: string, role: string, projectId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, error: 'Vui lòng đăng nhập' };

    const myRole = await resolveUserProjectRole(projectId, currentUser.id);
    if (!getProjectPermissions(myRole).canManageMemberRoles) {
      return { success: false, error: 'Chỉ ADMIN mới có quyền thay đổi vai trò thành viên!' };
    }

    const member = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: true },
    });

    revalidatePath(`/projects/${projectId}`);
    return { success: true, member };
  } catch (error) {
    console.error('Lỗi cập nhật vai trò:', error);
    return { success: false, error: 'Không thể cập nhật vai trò' };
  }
}

export async function removeProjectMember(memberId: string, projectId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, error: 'Vui lòng đăng nhập' };

    const myRole = await resolveUserProjectRole(projectId, currentUser.id);
    if (!getProjectPermissions(myRole).canManageMemberRoles) {
      return { success: false, error: 'Chỉ ADMIN mới có quyền gỡ thành viên khỏi dự án!' };
    }

    await prisma.projectMember.delete({ where: { id: memberId } });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Lỗi xóa thành viên:', error);
    return { success: false, error: 'Không thể xóa thành viên khỏi dự án' };
  }
}
