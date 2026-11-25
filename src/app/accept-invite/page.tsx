import Link from 'next/link';
import { getInviteDetailsAction } from '@/app/actions/auth-actions';
import { AcceptInviteForm } from '@/components/auth/AcceptInviteForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen bg-[#1D2125] text-[#B6C2CF] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#22272B] border border-[#38414A] rounded-xl p-6 text-center space-y-3">
          <div className="text-3xl">⚠️</div>
          <h2 className="text-base font-bold text-white">Thiếu mã lời mời (Token)</h2>
          <p className="text-xs text-[#8C9BAB]">
            Vui lòng mở đúng đường dẫn từ hộp thư Gmail mà chủ dự án đã gửi cho bạn.
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 rounded-lg bg-[#0C66E4] text-white text-xs font-semibold"
          >
            Về trang Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const res = await getInviteDetailsAction(token);
  if (!res.success || !res.invite) {
    return (
      <div className="min-h-screen bg-[#1D2125] text-[#B6C2CF] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#22272B] border border-[#38414A] rounded-xl p-6 text-center space-y-3">
          <div className="text-3xl">🔒</div>
          <h2 className="text-base font-bold text-white">Lời mời không hợp lệ hoặc đã hết hạn</h2>
          <p className="text-xs text-[#8C9BAB]">{res.error}</p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 rounded-lg bg-[#0C66E4] text-white text-xs font-semibold"
          >
            Về trang Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return <AcceptInviteForm token={token} invite={res.invite} />;
}
