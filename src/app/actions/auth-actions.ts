'use server';

import { prisma } from '@/lib/prisma';
import { createSession, clearSession, hashPassword, verifyPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function loginAction(emailInput: string, password: string) {
  try {
    const email = emailInput.trim().toLowerCase();
    if (!email || !password) {
      return { success: false, error: 'Vui lòng nhập đầy đủ Email và Mật khẩu' };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { success: false, error: 'Email hoặc mật khẩu không chính xác' };
    }

    await createSession(user.id);
    revalidatePath('/');
    return {
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    };
  } catch (error: any) {
    console.error('Lỗi đăng nhập:', error);
    return { success: false, error: 'Không thể đăng nhập lúc này' };
  }
}

export async function registerAction(fullNameInput: string, emailInput: string, password: string) {
  try {
    const fullName = fullNameInput.trim();
    const email = emailInput.trim().toLowerCase();

    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'Họ tên phải có ít nhất 2 ký tự' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Email không hợp lệ' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Mật khẩu phải từ 6 ký tự trở lên' };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: 'Email này đã được đăng ký' };
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: hashPassword(password),
        emailVerified: true,
      },
    });

    await createSession(user.id);
    revalidatePath('/');
    return {
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    };
  } catch (error: any) {
    console.error('Lỗi đăng ký:', error);
    return { success: false, error: 'Không thể đăng ký tài khoản' };
  }
}

const DEMO_EMAIL_WHITELIST = [
  'quanghuy.do@taskmg.vn',
  'minhquan.tran@taskmg.vn',
  'hoangnam.nguyen@taskmg.vn',
  'thuha.le@taskmg.vn',
];

export async function quickLoginDemoAction(emailInput: string) {
  try {
    const email = emailInput.trim().toLowerCase();
    if (!DEMO_EMAIL_WHITELIST.includes(email)) {
      return {
        success: false,
        error: 'Tài khoản này yêu cầu đăng nhập bằng mật khẩu!',
      };
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: 'Tài khoản nhân sự không tồn tại' };
    }
    await createSession(user.id);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Lỗi chuyển đổi tài khoản:', error);
    return { success: false, error: 'Không thể chuyển đổi tài khoản' };
  }
}

export async function logoutAction() {
  await clearSession();
  revalidatePath('/');
  return { success: true };
}

export async function getDemoAccounts() {
  try {
    const users = await prisma.user.findMany({
      where: {
        email: { in: DEMO_EMAIL_WHITELIST },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        memberships: {
          take: 1,
          select: { role: true },
        },
      },
    });
    return { success: true, users };
  } catch {
    return { success: false, users: [] };
  }
}

export async function getInviteDetailsAction(token: string) {
  try {
    if (!token || token.length < 16) {
      return { success: false, error: 'Đường dẫn lời mời không hợp lệ' };
    }

    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        email: true,
        fullName: true,
        inviteTokenExp: true,
        memberships: {
          take: 1,
          orderBy: { joinedAt: 'desc' },
          include: {
            project: {
              select: { id: true, name: true, projectKey: true },
            },
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: 'Lời mời không tồn tại hoặc đã được sử dụng' };
    }

    if (user.inviteTokenExp && Date.now() > new Date(user.inviteTokenExp).getTime()) {
      return { success: false, error: 'Lời mời đã hết hạn (quá 24 giờ). Hãy liên hệ chủ dự án gửi lại!' };
    }

    const membership = user.memberships[0];
    return {
      success: true,
      invite: {
        email: user.email,
        fullName: user.fullName,
        role: membership?.role || 'MEMBER',
        project: membership?.project || null,
      },
    };
  } catch {
    return { success: false, error: 'Không thể kiểm tra đường dẫn lời mời' };
  }
}

export async function completeInviteSetupAction(
  token: string,
  fullNameInput: string,
  password: string
) {
  try {
    const fullName = fullNameInput.trim();
    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'Họ tên phải có ít nhất 2 ký tự' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Mật khẩu mới phải từ 6 ký tự trở lên' };
    }

    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      include: {
        memberships: {
          take: 1,
          orderBy: { joinedAt: 'desc' },
          select: { projectId: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: 'Lời mời không tồn tại hoặc đã được kích hoạt trước đó' };
    }

    if (user.inviteTokenExp && Date.now() > new Date(user.inviteTokenExp).getTime()) {
      return { success: false, error: 'Lời mời đã hết hạn (quá 24 giờ)' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName,
        passwordHash: hashPassword(password),
        emailVerified: true,
        inviteToken: null,
        inviteTokenExp: null,
      },
    });

    await createSession(user.id);
    revalidatePath('/');
    return {
      success: true,
      projectId: user.memberships[0]?.projectId || null,
    };
  } catch (error) {
    console.error('Lỗi hoàn tất đặt mật khẩu lời mời:', error);
    return { success: false, error: 'Không thể hoàn tất thiết lập mật khẩu' };
  }
}
