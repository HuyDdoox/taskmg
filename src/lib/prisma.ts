import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Tự động chuyển đổi sang Supabase IPv4 Pooler nếu URL đang trỏ vào host direct IPv6.
 * Điều này giúp Vercel Serverless (chạy trên AWS Lambda - chỉ hỗ trợ IPv4)
 * kết nối thành công 100% đến CSDL mà không phụ thuộc vào cấu hình biến môi trường thủ công.
 */
function getDatabaseUrl(): string | undefined {
  const directHost = 'db.jjzgilgwtwhbedpyokme.supabase.co';
  const poolerUrl = 'postgresql://postgres.jjzgilgwtwhbedpyokme:gMosoJ9WLT9NKGGA@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

  const envUrl = process.env.DATABASE_URL;
  if (!envUrl) return poolerUrl;

  if (envUrl.includes(directHost)) {
    return poolerUrl;
  }

  return envUrl;
}

const activeUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: activeUrl
      ? {
          db: {
            url: activeUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
