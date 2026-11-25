'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getProjectPermissions, ProjectRole } from '@/lib/rbac';
import { revalidatePath } from 'next/cache';

const DEFAULT_COLUMNS = [
  { title: 'To Do', position: 0, colorHex: '#6B7280' },
  { title: 'In Progress', position: 1, colorHex: '#3B82F6' },
  { title: 'In Review', position: 2, colorHex: '#8B5CF6' },
  { title: 'Done', position: 3, colorHex: '#10B981' },
];

export async function resolveUserProjectRole(
  projectId: string,
  userId: string
): Promise<ProjectRole | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return null;
  if (project.ownerId === userId) return 'ADMIN';

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  if (!member) return null;
  return member.role as ProjectRole;
}

export async function getAllProjects() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, projects: [], error: 'Vui lòng đăng nhập' };
    }

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: true,
        members: {
          include: { user: true },
        },
        columns: {
          orderBy: { position: 'asc' },
          include: {
            _count: { select: { tasks: true } },
          },
        },
        _count: {
          select: {
            tasks: true,
            milestones: true,
            members: true,
          },
        },
      },
    });

    const enriched = projects.map((p) => {
      const myMember = p.members.find((m) => m.userId === user.id);
      const myRole = p.ownerId === user.id ? 'ADMIN' : myMember?.role || 'VIEWER';
      return { ...p, myRole };
    });

    return { success: true, projects: enriched };
  } catch (error: any) {
    console.error('Lỗi lấy danh sách dự án:', error);
    return {
      success: false,
      projects: [],
      error: `${error?.name || 'Error'}: ${error?.message || String(error)}`,
    };
  }
}

export async function getProjectById(projectId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Chưa đăng nhập' };
    }

    const userRole = await resolveUserProjectRole(projectId, user.id);
    if (!userRole) {
      return {
        success: false,
        error: 'Bạn không có quyền truy cập dự án này (Chưa được mời tham gia).',
      };
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: true,
        milestones: {
          orderBy: { createdAt: 'asc' },
        },
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { orderIndex: 'asc' },
              include: {
                assignee: true,
                reporter: true,
                milestone: true,
                column: true,
                checklists: {
                  orderBy: { position: 'asc' },
                },
                activityLogs: {
                  orderBy: { createdAt: 'desc' },
                  include: { user: true },
                },
              },
            },
          },
        },
        members: {
          orderBy: { joinedAt: 'asc' },
          include: { user: true },
        },
      },
    });

    if (!project) {
      return { success: false, error: 'Không tìm thấy dự án' };
    }

    return { success: true, project, userRole };
  } catch (error: any) {
    console.error('Lỗi lấy chi tiết dự án:', error);
    return {
      success: false,
      error: `${error?.name || 'Error'}: ${error?.message || String(error)}`,
    };
  }
}

export async function createProject(data: {
  name: string;
  projectKey: string;
  description?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Vui lòng đăng nhập để tạo dự án' };
    }

    const name = data.name.trim();
    const rawKey = data.projectKey
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    if (!name || name.length < 2) {
      return { success: false, error: 'Tên dự án phải có ít nhất 2 ký tự' };
    }

    if (!rawKey || rawKey.length < 2 || rawKey.length > 10) {
      return { success: false, error: 'Mã Key dự án phải từ 2-10 ký tự chữ/số (VD: GYM, TASK)' };
    }

    const existing = await prisma.project.findUnique({
      where: { projectKey: rawKey },
    });

    if (existing) {
      return { success: false, error: `Mã dự án "${rawKey}" đã tồn tại, hãy chọn mã khác` };
    }

    const project = await prisma.project.create({
      data: {
        name,
        projectKey: rawKey,
        description: data.description?.trim() || '',
        ownerId: user.id,
        columns: {
          create: DEFAULT_COLUMNS,
        },
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN',
          },
        },
        milestones: {
          create: {
            title: 'Sprint 1 - Khởi động',
            status: 'IN_PROGRESS',
            startDate: new Date(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        },
      },
      include: {
        owner: true,
        members: { include: { user: true } },
        columns: {
          orderBy: { position: 'asc' },
          include: { _count: { select: { tasks: true } } },
        },
        _count: { select: { tasks: true, milestones: true, members: true } },
      },
    });

    revalidatePath('/');
    return { success: true, project: { ...project, myRole: 'ADMIN' } };
  } catch (error: any) {
    console.error('Lỗi tạo dự án:', error);
    return { success: false, error: error?.message || 'Không thể tạo dự án mới' };
  }
}

export async function deleteProject(projectId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Vui lòng đăng nhập' };

    const role = await resolveUserProjectRole(projectId, user.id);
    if (!getProjectPermissions(role).canDeleteProject) {
      return { success: false, error: 'Chỉ ADMIN (Chủ dự án) mới có quyền xóa dự án!' };
    }

    await prisma.project.delete({ where: { id: projectId } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Lỗi xóa dự án:', error);
    return { success: false, error: 'Không thể xóa dự án' };
  }
}

export async function createMilestone(data: {
  projectId: string;
  title: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Vui lòng đăng nhập' };

    const role = await resolveUserProjectRole(data.projectId, user.id);
    if (!getProjectPermissions(role).canManageMilestones) {
      return { success: false, error: 'Chỉ ADMIN hoặc PM mới có quyền tạo Giai đoạn (Milestone)!' };
    }

    if (!data.title.trim()) {
      return { success: false, error: 'Tên giai đoạn không được để trống' };
    }

    const milestone = await prisma.milestone.create({
      data: {
        projectId: data.projectId,
        title: data.title.trim(),
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'UPCOMING',
      },
    });

    revalidatePath(`/projects/${data.projectId}`);
    return { success: true, milestone };
  } catch (error: any) {
    console.error('Lỗi tạo giai đoạn:', error);
    return { success: false, error: 'Không thể tạo giai đoạn mới' };
  }
}
