'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getKanbanData() {
  try {
    const project = await prisma.project.findFirst({
      where: { projectKey: 'TASK' },
      include: {
        owner: true,
        milestones: true,
        channels: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              include: { sender: true },
            },
          },
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
          include: { user: true },
        },
      },
    });

    return { success: true, project };
  } catch (error) {
    console.error('Lỗi lấy dữ liệu Kanban:', error);
    return { success: false, error: 'Không thể tải dữ liệu Kanban' };
  }
}

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
      include: { column: true },
    });

    // Ghi nhận Activity Log
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

    revalidatePath('/');
    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Lỗi cập nhật Task:', error);
    return { success: false, error: 'Cập nhật vị trí task thất bại' };
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

export async function createQuickTask(data: {
  title: string;
  description?: string;
  columnId: string;
  priority?: string;
  riskLevel?: string;
  issueType?: string;
  milestoneId?: string;
  dueDate?: string;
}) {
  try {
    const project = await prisma.project.findFirst({
      where: { projectKey: 'TASK' },
      include: {
        owner: true,
      },
    });

    if (!project) throw new Error('Dự án không tồn tại');

    // Tìm số task_number lớn nhất hiện tại
    const maxTask = await prisma.task.findFirst({
      where: { projectId: project.id },
      orderBy: { taskNumber: 'desc' },
    });

    const nextNumber = (maxTask?.taskNumber || 0) + 1;
    const issueKey = `${project.projectKey}-${nextNumber}`;

    const newTask = await prisma.task.create({
      data: {
        projectId: project.id,
        taskNumber: nextNumber,
        issueKey,
        title: data.title,
        description: data.description || 'Chưa có mô tả chi tiết.',
        columnId: data.columnId,
        priority: data.priority || 'MEDIUM',
        riskLevel: data.riskLevel || 'LOW',
        issueType: data.issueType || 'TASK',
        milestoneId: data.milestoneId || null,
        reporterId: project.ownerId,
        assigneeId: project.ownerId,
        orderIndex: Date.now() % 100000,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        taskId: newTask.id,
        userId: project.ownerId,
        action: 'CREATED',
        detailsJson: JSON.stringify({ message: `Đã tạo task mới ${issueKey}` }),
      },
    });

    revalidatePath('/');
    return { success: true, task: newTask };
  } catch (error) {
    console.error('Lỗi tạo Task:', error);
    return { success: false, error: 'Không thể tạo task mới' };
  }
}
