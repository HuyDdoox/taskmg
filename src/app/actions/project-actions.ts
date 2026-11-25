'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const DEFAULT_COLUMNS = [
  { title: 'To Do', position: 0, colorHex: '#6B7280' },
  { title: 'In Progress', position: 1, colorHex: '#3B82F6' },
  { title: 'In Review', position: 2, colorHex: '#8B5CF6' },
  { title: 'Done', position: 3, colorHex: '#10B981' },
];

export async function getAllProjects() {
  try {
    const projects = await prisma.project.findMany({
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

    return { success: true, projects };
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

    return { success: true, project };
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
  ownerId?: string;
}) {
  try {
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

    // Tìm owner mặc định nếu không truyền vào
    let ownerId = data.ownerId;
    if (!ownerId) {
      const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
      if (firstUser) {
        ownerId = firstUser.id;
      } else {
        const defaultUser = await prisma.user.create({
          data: {
            email: 'admin@taskmg.com',
            fullName: 'Quản Trị Viên',
            passwordHash: 'default-admin',
          },
        });
        ownerId = defaultUser.id;
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        projectKey: rawKey,
        description: data.description?.trim() || '',
        ownerId,
        columns: {
          create: DEFAULT_COLUMNS,
        },
        members: {
          create: {
            userId: ownerId,
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
    return { success: true, project };
  } catch (error: any) {
    console.error('Lỗi tạo dự án:', error);
    return { success: false, error: error?.message || 'Không thể tạo dự án mới' };
  }
}

export async function deleteProject(projectId: string) {
  try {
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
