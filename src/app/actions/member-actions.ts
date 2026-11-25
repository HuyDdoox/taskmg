'use server';

import { prisma } from '@/lib/prisma';
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

export async function addProjectMember(data: {
  projectId: string;
  userId?: string;
  fullName?: string;
  email?: string;
  role: string;
}) {
  try {
    let targetUserId = data.userId;

    if (!targetUserId) {
      const email = data.email?.trim().toLowerCase();
      const fullName = data.fullName?.trim();

      if (!email || !fullName) {
        return { success: false, error: 'Vui lòng nhập đầy đủ Tên và Email thành viên' };
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        const createdUser = await prisma.user.create({
          data: {
            email,
            fullName,
            passwordHash: 'member-invited',
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
        role: data.role || 'MEMBER',
      },
      include: { user: true },
    });

    revalidatePath(`/projects/${data.projectId}`);
    revalidatePath('/');
    return { success: true, member };
  } catch (error: any) {
    console.error('Lỗi thêm thành viên:', error);
    return { success: false, error: error?.message || 'Không thể thêm thành viên vào dự án' };
  }
}

export async function updateProjectMemberRole(memberId: string, role: string, projectId: string) {
  try {
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
    await prisma.projectMember.delete({ where: { id: memberId } });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Lỗi xóa thành viên:', error);
    return { success: false, error: 'Không thể xóa thành viên khỏi dự án' };
  }
}
