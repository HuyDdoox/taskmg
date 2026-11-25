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

export async function quickLoginDemoAction(emailInput: string) {
  try {
    const email = emailInput.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: 'Tài khoản demo không tồn tại' };
    }
    await createSession(user.id);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Lỗi đăng nhập nhanh:', error);
    return { success: false, error: 'Không thể đăng nhập nhanh' };
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
      take: 6,
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
