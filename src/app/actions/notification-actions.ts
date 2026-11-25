'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isMailerConfigured, sendNotificationEmail } from '@/lib/mailer';
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

    // 1. Lưu thông báo vào Supabase (hiện ngay trên Chuông 🔔)
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

    // 2. Gửi Email chạy ngầm (non-blocking) để không làm chậm thao tác UI
    if (isMailerConfigured()) {
      prisma.user
        .findMany({
          where: {
            id: { in: uniqueIds },
            emailNotifyEnabled: true,
          },
          select: { email: true, fullName: true },
        })
        .then((recipients) =>
          Promise.allSettled(
            recipients.map((r) =>
              sendNotificationEmail({
                to: r.email,
                recipientName: r.fullName,
                title: params.title,
                message: params.message,
                projectId: params.projectId,
              })
            )
          )
        )
        .catch((err) => console.error('[Mailer background]', err));
    }

    return { success: true, count: uniqueIds.length };
  } catch (error) {
    console.error('Lỗi tạo/gửi thông báo:', error);
    return { success: false, count: 0 };
  }
}

export async function getMyNotifications() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        notifications: [],
        unreadCount: 0,
        emailNotifyEnabled: true,
        smtpConfigured: isMailerConfigured(),
      };
    }

    const [notifications, dbUser] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { emailNotifyEnabled: true },
      }),
    ]);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      success: true,
      notifications,
      unreadCount,
      emailNotifyEnabled: dbUser?.emailNotifyEnabled ?? true,
      smtpConfigured: isMailerConfigured(),
    };
  } catch (error) {
    console.error('Lỗi tải thông báo:', error);
    return {
      success: false,
      notifications: [],
      unreadCount: 0,
      emailNotifyEnabled: true,
      smtpConfigured: isMailerConfigured(),
    };
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
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function toggleEmailNotificationSetting(enabled: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Vui lòng đăng nhập' };

    await prisma.user.update({
      where: { id: user.id },
      data: { emailNotifyEnabled: enabled },
    });
    return { success: true, emailNotifyEnabled: enabled };
  } catch {
    return { success: false, error: 'Không thể cập nhật cài đặt email' };
  }
}

export async function sendTestNotificationEmail() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Vui lòng đăng nhập' };

    // Luôn tạo 1 thông báo test trong App
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        title: 'Kiểm tra hệ thống thông báo',
        message: `Hệ thống thông báo TaskMG đang hoạt động tốt cho tài khoản ${user.email}.`,
      },
    });

    const mailRes = await sendNotificationEmail({
      to: user.email,
      recipientName: user.fullName,
      title: 'Kiểm tra gửi Email từ TaskMG Workspace',
      message: `Xin chúc mừng! Kết nối Gmail SMTP của bạn đang hoạt động 100%. Mọi thay đổi dự án sẽ được gửi tự động tới ${user.email}.`,
    });

    if (!mailRes.sent) {
      return {
        success: false,
        inAppCreated: true,
        error: mailRes.reason || 'Chưa cấu hình SMTP_USER / SMTP_PASS',
      };
    }

    return {
      success: true,
      message: `Đã gửi email thử nghiệm thành công tới ${user.email}!`,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Lỗi gửi email thử nghiệm' };
  }
}
