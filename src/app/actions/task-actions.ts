'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  getProjectPermissions,
  canUserModifyTaskStatus,
  canUserToggleChecklist,
  isDoneColumnTitle,
} from '@/lib/rbac';
import { resolveUserProjectRole } from './project-actions';
import { createAndDispatchNotifications } from './notification-actions';
import { revalidatePath } from 'next/cache';

export async function updateTaskColumn(taskId: string, targetColumnId: string, newOrderIndex: number) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Vui lòng đăng nhập' };

    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!currentTask) {
      return { success: false, error: 'Task không tồn tại' };
    }

    const role = await resolveUserProjectRole(currentTask.projectId, user.id);
    if (!role) return { success: false, error: 'Bạn không thuộc dự án này' };

    if (!canUserModifyTaskStatus(role, currentTask.assigneeId, user.id)) {
      return {
        success: false,
        error:
          role === 'VIEWER'
            ? 'Tài khoản VIEWER chỉ có quyền xem!'
            : 'MEMBER chỉ được đổi trạng thái công việc được giao cho mình!',
      };
    }

    const targetCol = await prisma.kanbanColumn.findUnique({
      where: { id: targetColumnId },
    });
    if (!targetCol) return { success: false, error: 'Cột trạng thái không tồn tại' };

    if (isDoneColumnTitle(targetCol.title) && !getProjectPermissions(role).canMoveToDone) {
      return {
        success: false,
        error: 'Chỉ PM hoặc ADMIN mới được chốt duyệt chuyển sang Done! Hãy chuyển sang In Review.',
      };
    }

    const isColumnChanged = currentTask.columnId !== targetColumnId;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: targetColumnId,
        orderIndex: newOrderIndex,
      },
      include: {
        column: true,
        assignee: true,
        reporter: true,
        milestone: true,
        checklists: { orderBy: { position: 'asc' } },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
      },
    });

    if (isColumnChanged) {
      await prisma.activityLog.create({
        data: {
          taskId,
          userId: user.id,
          action: 'STATUS_CHANGED',
          detailsJson: JSON.stringify({
            from: currentTask.column.title,
            to: updatedTask.column.title,
          }),
        },
      });

      // Tự động bắn thông báo 🔔 + Email khi đổi trạng thái
      const lowerTitle = updatedTask.column.title.toLowerCase();
      if (lowerTitle.includes('review') || lowerTitle.includes('duyệt')) {
        const managers = await prisma.projectMember.findMany({
          where: { projectId: currentTask.projectId, role: { in: ['ADMIN', 'PM'] } },
          select: { userId: true },
        });
        await createAndDispatchNotifications({
          userIds: managers.map((m) => m.userId),
          excludeUserId: user.id,
          projectId: currentTask.projectId,
          taskId,
          type: 'STATUS_CHANGED',
          title: `[${updatedTask.issueKey}] Chờ duyệt (In Review)`,
          message: `${user.fullName} đã chuyển công việc "${updatedTask.title}" sang "${updatedTask.column.title}" để chờ bạn kiểm tra.`,
        });
      } else if (updatedTask.assigneeId) {
        await createAndDispatchNotifications({
          userIds: [updatedTask.assigneeId],
          excludeUserId: user.id,
          projectId: currentTask.projectId,
          taskId,
          type: 'STATUS_CHANGED',
          title: `[${updatedTask.issueKey}] Đổi trạng thái -> ${updatedTask.column.title}`,
          message: `${user.fullName} đã chuyển công việc "${updatedTask.title}" từ "${currentTask.column.title}" sang "${updatedTask.column.title}".`,
        });
      }
    }

    revalidatePath(`/projects/${currentTask.projectId}`);
    revalidatePath('/');
    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Lỗi cập nhật Task:', error);
    return { success: false, error: 'Cập nhật vị trí task thất bại' };
  }
}

export async function updateTaskFields(
  taskId: string,
  projectId: string,
  data: {
    title?: string;
    description?: string;
    columnId?: string;
    priority?: string;
    riskLevel?: string;
    issueType?: string;
    assigneeId?: string | null;
    milestoneId?: string | null;
    dueDate?: string | null;
  }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Vui lòng đăng nhập' };

    const role = await resolveUserProjectRole(projectId, user.id);
    if (!role) return { success: false, error: 'Bạn không thuộc dự án này' };
    const perms = getProjectPermissions(role);

    if (perms.isReadOnly) {
      return { success: false, error: 'Tài khoản VIEWER chỉ có quyền xem!' };
    }

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask) return { success: false, error: 'Task không tồn tại' };

    // Kiểm tra quyền sửa Priority / Risk / DueDate
    if (
      (data.priority !== undefined || data.riskLevel !== undefined || data.dueDate !== undefined) &&
      !perms.canEditTaskMeta
    ) {
      return {
        success: false,
        error: 'Chỉ ADMIN hoặc PM mới có quyền thay đổi Priority, Risk hoặc Hạn chót!',
      };
    }

    // Kiểm tra quyền đổi Assignee
    if (data.assigneeId !== undefined && !perms.canAssignOthers) {
      if (data.assigneeId && data.assigneeId !== user.id) {
        return {
          success: false,
          error: 'MEMBER chỉ có thể tự nhận việc cho bản thân, không thể giao cho người khác!',
        };
      }
    }

    // Kiểm tra quyền đổi Status / Done
    if (data.columnId !== undefined) {
      if (!canUserModifyTaskStatus(role, existingTask.assigneeId, user.id)) {
        return {
          success: false,
          error: 'MEMBER chỉ được đổi trạng thái công việc được giao cho mình!',
        };
      }
      const targetCol = await prisma.kanbanColumn.findUnique({ where: { id: data.columnId } });
      if (targetCol && isDoneColumnTitle(targetCol.title) && !perms.canMoveToDone) {
        return {
          success: false,
          error: 'Chỉ PM hoặc ADMIN mới được chốt duyệt chuyển sang Done! Hãy chuyển sang In Review.',
        };
      }
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.columnId !== undefined) updateData.columnId = data.columnId;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.riskLevel !== undefined) updateData.riskLevel = data.riskLevel;
    if (data.issueType !== undefined) updateData.issueType = data.issueType;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId || null;
    if (data.milestoneId !== undefined) updateData.milestoneId = data.milestoneId || null;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        column: true,
        assignee: true,
        reporter: true,
        milestone: true,
        checklists: { orderBy: { position: 'asc' } },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
      },
    });

    // Bắn thông báo 🔔 + Email khi giao việc / đổi trạng thái / đổi hạn chót
    if (data.assigneeId && data.assigneeId !== existingTask.assigneeId) {
      await createAndDispatchNotifications({
        userIds: [data.assigneeId],
        excludeUserId: user.id,
        projectId,
        taskId,
        type: 'TASK_ASSIGNED',
        title: `[${updatedTask.issueKey}] Bạn được giao công việc mới`,
        message: `${user.fullName} đã giao công việc "${updatedTask.title}" cho bạn.`,
      });
    } else if (data.columnId && data.columnId !== existingTask.columnId) {
      const lowerTitle = updatedTask.column.title.toLowerCase();
      if (lowerTitle.includes('review') || lowerTitle.includes('duyệt')) {
        const managers = await prisma.projectMember.findMany({
          where: { projectId, role: { in: ['ADMIN', 'PM'] } },
          select: { userId: true },
        });
        await createAndDispatchNotifications({
          userIds: managers.map((m) => m.userId),
          excludeUserId: user.id,
          projectId,
          taskId,
          type: 'STATUS_CHANGED',
          title: `[${updatedTask.issueKey}] Chờ duyệt (In Review)`,
          message: `${user.fullName} đã chuyển "${updatedTask.title}" sang "${updatedTask.column.title}".`,
        });
      } else if (updatedTask.assigneeId) {
        await createAndDispatchNotifications({
          userIds: [updatedTask.assigneeId],
          excludeUserId: user.id,
          projectId,
          taskId,
          type: 'STATUS_CHANGED',
          title: `[${updatedTask.issueKey}] Cập nhật trạng thái -> ${updatedTask.column.title}`,
          message: `${user.fullName} đã chuyển "${updatedTask.title}" sang "${updatedTask.column.title}".`,
        });
      }
    } else if (data.dueDate !== undefined && updatedTask.assigneeId) {
      await createAndDispatchNotifications({
        userIds: [updatedTask.assigneeId],
        excludeUserId: user.id,
        projectId,
        taskId,
        type: 'DEADLINE_CHANGED',
        title: `[${updatedTask.issueKey}] Thay đổi hạn chót`,
        message: `${user.fullName} đã cập nhật hạn chót công việc "${updatedTask.title}" thành ${
          updatedTask.dueDate
            ? new Date(updatedTask.dueDate).toLocaleDateString('vi-VN')
            : 'Không có hạn'
        }.`,
      });
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Lỗi cập nhật thông tin Task:', error);
    return { success: false, error: 'Không thể cập nhật task' };
  }
}

export async function deleteTask(taskId: string, projectId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Vui lòng đăng nhập' };

    const role = await resolveUserProjectRole(projectId, user.id);
    if (!getProjectPermissions(role).canDeleteTask) {
      return { success: false, error: 'Chỉ ADMIN hoặc PM mới có quyền xóa Task!' };
    }

    await prisma.task.delete({ where: { id: taskId } });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Lỗi xóa Task:', error);
    return { success: false, error: 'Không thể xóa task' };
  }
}

export async function toggleChecklistItem(checklistId: string, isCompleted: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Vui lòng đăng nhập' };

    const item = await prisma.taskChecklist.findUnique({
      where: { id: checklistId },
      include: { task: true },
    });
    if (!item) return { success: false, error: 'Checklist không tồn tại' };

    const role = await resolveUserProjectRole(item.task.projectId, user.id);
    if (!canUserToggleChecklist(role, item.task.assigneeId, user.id)) {
      return {
        success: false,
        error: 'Bạn không có quyền tick Checklist của công việc này!',
      };
    }

    const updated = await prisma.taskChecklist.update({
      where: { id: checklistId },
      data: { isCompleted },
    });

    revalidatePath(`/projects/${item.task.projectId}`);
    return { success: true, checklist: updated };
  } catch (error) {
    console.error('Lỗi cập nhật Checklist:', error);
    return { success: false, error: 'Không thể cập nhật checklist' };
  }
}

export async function addChecklistItem(taskId: string, title: string, projectId?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Vui lòng đăng nhập' };

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { success: false, error: 'Task không tồn tại' };

    const role = await resolveUserProjectRole(task.projectId, user.id);
    if (!canUserToggleChecklist(role, task.assigneeId, user.id)) {
      return { success: false, error: 'Bạn không có quyền thêm Checklist cho công việc này!' };
    }

    if (!title.trim()) return { success: false, error: 'Nội dung không được để trống' };
    const count = await prisma.taskChecklist.count({ where: { taskId } });
    const item = await prisma.taskChecklist.create({
      data: {
        taskId,
        title: title.trim(),
        position: count,
      },
    });
    if (projectId) revalidatePath(`/projects/${projectId}`);
    return { success: true, checklist: item };
  } catch (error) {
    console.error('Lỗi thêm Checklist:', error);
    return { success: false, error: 'Không thể thêm mục checklist' };
  }
}

export async function createQuickTask(data: {
  projectId: string;
  title: string;
  description?: string;
  columnId: string;
  priority?: string;
  riskLevel?: string;
  issueType?: string;
  milestoneId?: string;
  assigneeId?: string;
  reporterId?: string;
  dueDate?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Vui lòng đăng nhập' };

    const role = await resolveUserProjectRole(data.projectId, user.id);
    const perms = getProjectPermissions(role);
    if (!perms.canCreateTask) {
      return { success: false, error: 'Tài khoản VIEWER không có quyền tạo Task mới!' };
    }

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: { owner: true },
    });

    if (!project) return { success: false, error: 'Dự án không tồn tại' };

    const maxTask = await prisma.task.findFirst({
      where: { projectId: project.id },
      orderBy: { taskNumber: 'desc' },
    });

    const nextNumber = (maxTask?.taskNumber || 0) + 1;
    const issueKey = `${project.projectKey}-${nextNumber}`;

    // MEMBER chỉ được gán cho chính mình khi tạo task
    const safeAssigneeId = perms.canAssignOthers
      ? data.assigneeId || user.id
      : user.id;

    const newTask = await prisma.task.create({
      data: {
        projectId: project.id,
        taskNumber: nextNumber,
        issueKey,
        title: data.title.trim(),
        description: data.description?.trim() || '',
        columnId: data.columnId,
        priority: perms.canEditTaskMeta ? data.priority || 'MEDIUM' : 'MEDIUM',
        riskLevel: perms.canEditTaskMeta ? data.riskLevel || 'LOW' : 'LOW',
        issueType: data.issueType || 'TASK',
        milestoneId: data.milestoneId || null,
        reporterId: user.id,
        assigneeId: safeAssigneeId,
        orderIndex: Date.now() % 100000,
        dueDate: perms.canEditTaskMeta && data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        column: true,
        assignee: true,
        reporter: true,
        milestone: true,
        checklists: { orderBy: { position: 'asc' } },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        taskId: newTask.id,
        userId: user.id,
        action: 'CREATED',
        detailsJson: JSON.stringify({ message: `Đã tạo task mới ${issueKey}` }),
      },
    });

    if (newTask.assigneeId && newTask.assigneeId !== user.id) {
      await createAndDispatchNotifications({
        userIds: [newTask.assigneeId],
        excludeUserId: user.id,
        projectId: project.id,
        taskId: newTask.id,
        type: 'TASK_ASSIGNED',
        title: `[${issueKey}] Bạn được giao công việc mới`,
        message: `${user.fullName} đã tạo và giao công việc "${newTask.title}" cho bạn trong dự án "${project.name}".`,
      });
    }

    revalidatePath(`/projects/${project.id}`);
    revalidatePath('/');
    return { success: true, task: newTask };
  } catch (error: any) {
    console.error('Lỗi tạo Task:', error);
    return { success: false, error: error?.message || 'Không thể tạo task mới' };
  }
}

export async function createBulkTasks(data: {
  projectId: string;
  columnId: string;
  milestoneId?: string;
  assigneeId?: string;
  defaultPriority?: string;
  defaultRiskLevel?: string;
  defaultIssueType?: string;
  items: {
    title: string;
    description?: string;
    issueType?: string;
    priority?: string;
    dueDate?: string;
  }[];
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Vui lòng đăng nhập' };

    const role = await resolveUserProjectRole(data.projectId, user.id);
    const perms = getProjectPermissions(role);
    if (!perms.canCreateTask) {
      return { success: false, error: 'Tài khoản VIEWER không có quyền tạo Task!' };
    }

    const cleanItems = (data.items || [])
      .map((item) => ({
        ...item,
        title: (item.title || '').trim(),
      }))
      .filter((item) => item.title.length > 0)
      .slice(0, 100);

    if (cleanItems.length === 0) {
      return { success: false, error: 'Vui lòng nhập ít nhất 1 công việc hợp lệ' };
    }

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });
    if (!project) return { success: false, error: 'Dự án không tồn tại' };

    const safeAssigneeId = perms.canAssignOthers
      ? data.assigneeId || user.id
      : user.id;

    const createdTasks = await prisma.$transaction(async (tx) => {
      const maxTask = await tx.task.findFirst({
        where: { projectId: project.id },
        orderBy: { taskNumber: 'desc' },
      });
      let currentNum = maxTask?.taskNumber || 0;
      const baseOrder = Date.now() % 100000;
      const results: any[] = [];

      for (let i = 0; i < cleanItems.length; i++) {
        const item = cleanItems[i];
        currentNum += 1;
        const issueKey = `${project.projectKey}-${currentNum}`;

        const validType = ['TASK', 'STORY', 'BUG', 'SUBTASK'].includes(
          (item.issueType || '').toUpperCase()
        )
          ? item.issueType!.toUpperCase()
          : data.defaultIssueType || 'TASK';

        const validPriority = ['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'BLOCKER'].includes(
          (item.priority || '').toUpperCase()
        )
          ? item.priority!.toUpperCase()
          : data.defaultPriority || 'MEDIUM';

        let parsedDueDate: Date | null = null;
        if (perms.canEditTaskMeta && item.dueDate) {
          const d = new Date(item.dueDate);
          if (!isNaN(d.getTime())) parsedDueDate = d;
        }

        const created = await tx.task.create({
          data: {
            projectId: project.id,
            taskNumber: currentNum,
            issueKey,
            title: item.title,
            description: item.description?.trim() || '',
            columnId: data.columnId,
            issueType: validType,
            priority: perms.canEditTaskMeta ? validPriority : 'MEDIUM',
            riskLevel: perms.canEditTaskMeta ? data.defaultRiskLevel || 'LOW' : 'LOW',
            milestoneId: data.milestoneId || null,
            reporterId: user.id,
            assigneeId: safeAssigneeId,
            orderIndex: baseOrder + i * 10,
            dueDate: parsedDueDate,
          },
          include: {
            column: true,
            assignee: true,
            reporter: true,
            milestone: true,
            checklists: { orderBy: { position: 'asc' } },
            activityLogs: {
              orderBy: { createdAt: 'desc' },
              include: { user: true },
            },
          },
        });

        results.push(created);
      }

      return results;
    });

    if (safeAssigneeId && safeAssigneeId !== user.id) {
      await createAndDispatchNotifications({
        userIds: [safeAssigneeId],
        excludeUserId: user.id,
        projectId: project.id,
        type: 'TASK_ASSIGNED',
        title: `[${project.projectKey}] Bạn được giao ${createdTasks.length} công việc mới`,
        message: `${user.fullName} vừa thêm hàng loạt ${createdTasks.length} công việc cho bạn trong dự án "${project.name}".`,
      });
    }

    revalidatePath(`/projects/${project.id}`);
    revalidatePath('/spaces');
    return { success: true, tasks: createdTasks };
  } catch (error: any) {
    console.error('Lỗi tạo Task hàng loạt:', error);
    return { success: false, error: error?.message || 'Không thể tạo danh sách task hàng loạt' };
  }
}
