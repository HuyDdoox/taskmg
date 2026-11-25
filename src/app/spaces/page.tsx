import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAllProjects } from '@/app/actions/project-actions';
import { ProjectsDashboard } from '@/components/projects/ProjectsDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function SpacesLoader() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const data = await getAllProjects();

  if (!data.success) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#1D2125] p-6 text-[#B6C2CF]">
        <div className="max-w-md w-full bg-[#22272B] p-6 rounded-xl border border-[#38414A] shadow-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h2 className="text-base font-bold text-white">Lỗi kết nối Cơ Sở Dữ Liệu</h2>
          {data.error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-300 text-left overflow-auto max-h-40 break-words">
              {data.error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <ProjectsDashboard initialProjects={data.projects} currentUser={currentUser} />;
}

export default function SpacesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#1D2125]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#B6C2CF] bg-[#22272B] px-4 py-2.5 rounded-xl border border-[#38414A] shadow-sm">
            <span className="w-3 h-3 rounded-full border-2 border-[#579DFF] border-t-transparent animate-spin"></span>
            Đang tải danh sách Dự án...
          </div>
        </div>
      }
    >
      <SpacesLoader />
    </Suspense>
  );
}
