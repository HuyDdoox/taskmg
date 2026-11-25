import { Suspense } from 'react';
import { getKanbanData } from './actions/task-actions';
import { WorkspaceView } from '@/components/layout/WorkspaceView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function KanbanLoader() {
  const data = await getKanbanData();

  if (!data.success || !data.project) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h2 className="text-base font-bold text-gray-900">Không tìm thấy dữ liệu Dự án</h2>
          <p className="text-xs text-gray-500">
            Dữ liệu dự án chưa được khởi tạo trong CSDL. Vui lòng chạy lệnh nạp dữ liệu:
          </p>
          <code className="block p-2 rounded bg-gray-100 text-xs font-mono text-gray-800">
            npm run db:seed
          </code>
        </div>
      </div>
    );
  }

  return <WorkspaceView initialProject={data.project} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#F4F5F7]">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <span className="w-3 h-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></span>
          Đang tải Bảng Kanban...
        </div>
      </div>
    }>
      <KanbanLoader />
    </Suspense>
  );
}
