'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createAndDispatchNotifications(params: {
  userIds: string[];
  excludeUserId?: string;
  projectId?: string | null;
  taskId?: string | null;
  type: 'TASK_ASSIGNED' | 'STATUS_CHANGED' | 'PROJECT_INVITED' | 'DEADLINE_CHANGED' | 'SYSTEM';
  title: string;
  message: string;
}) {
  try {
    const uniqueIds = Array.from(
      new Set(params.userIds.filter((id) => id && id !== params.excludeUserId))
    );
    if (uniqueIds.length === 0) return { success: true, count: 0 };

    await prisma.notification.createMany({
      data: uniqueIds.map((uid) => ({
        userId: uid,
        projectId: params.projectId || null,
        taskId: params.taskId || null,
        type: params.type,
        title: params.title,
        message: params.message,
      })),
    });

    return { success: true, count: uniqueIds.length };
  } catch (error) {
    console.error('Lỗi tạo thông báo:', error);
    return { success: false, count: 0 };
  }
}

export async function getMyNotifications() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, notifications: [], unreadCount: 0 };
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      success: true,
      notifications,
      unreadCount,
    };
  } catch (error) {
    console.error('Lỗi tải thông báo:', error);
    return { success: false, notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false };

    await prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { isRead: true },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function markAllNotificationsRead() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false };

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
    revalidatePath('/spaces');
    return { success: true };
  } catch {
    return { success: false };
  }
}
