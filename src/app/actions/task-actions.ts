'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateTaskColumn(taskId: string, targetColumnId: string, newOrderIndex: number) {
  try {
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!currentTask) {
      return { success: false, error: 'Task không tồn tại' };
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
          userId: currentTask.reporterId,
          action: 'STATUS_CHANGED',
          detailsJson: JSON.stringify({
            from: currentTask.column.title,
            to: updatedTask.column.title,
          }),
        },
      });
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
    const updated = await prisma.taskChecklist.update({
      where: { id: checklistId },
      data: { isCompleted },
    });

    revalidatePath('/');
    return { success: true, checklist: updated };
  } catch (error) {
    console.error('Lỗi cập nhật Checklist:', error);
    return { success: false, error: 'Không thể cập nhật checklist' };
  }
}

export async function addChecklistItem(taskId: string, title: string, projectId?: string) {
  try {
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
    const reporterId = data.reporterId || project.ownerId;

    const newTask = await prisma.task.create({
      data: {
        projectId: project.id,
        taskNumber: nextNumber,
        issueKey,
        title: data.title.trim(),
        description: data.description?.trim() || '',
        columnId: data.columnId,
        priority: data.priority || 'MEDIUM',
        riskLevel: data.riskLevel || 'LOW',
        issueType: data.issueType || 'TASK',
        milestoneId: data.milestoneId || null,
        reporterId,
        assigneeId: data.assigneeId || reporterId,
        orderIndex: Date.now() % 100000,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
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
        userId: reporterId,
        action: 'CREATED',
        detailsJson: JSON.stringify({ message: `Đã tạo task mới ${issueKey}` }),
      },
    });

    revalidatePath(`/projects/${project.id}`);
    revalidatePath('/');
    return { success: true, task: newTask };
  } catch (error: any) {
    console.error('Lỗi tạo Task:', error);
    return { success: false, error: error?.message || 'Không thể tạo task mới' };
  }
}
