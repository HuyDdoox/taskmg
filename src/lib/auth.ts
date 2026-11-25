import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SESSION_COOKIE_NAME = 'taskmg_session';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'taskmg-super-secret-hmac-key-2026-jira-rbac';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  // Hỗ trợ mật khẩu mẫu cho các tài khoản seed / mới mời
  if (storedHash === 'hashed_password_123' || storedHash === 'member-invited' || storedHash === 'default-admin') {
    return password === '123456';
  }
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derivedKey, 'hex'));
  } catch {
    return false;
  }
}

function signPayload(payloadB64: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
}

export async function createSession(userId: string) {
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + SESSION_TTL_MS,
  });
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const sig = signPayload(payloadB64);
  const token = `${payloadB64}.${sig}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, sig] = parts;
    const expectedSig = signPayload(payloadB64);
    if (sig !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.userId || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}
