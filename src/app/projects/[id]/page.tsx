import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getProjectById, getProjectSwitcherList } from '@/app/actions/project-actions';
import { getAllUsers } from '@/app/actions/member-actions';
import { ProjectWorkspace } from '@/components/workspace/ProjectWorkspace';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function ProjectLoader({ projectId }: { projectId: string }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const [projectRes, switcherRes, usersRes] = await Promise.all([
    getProjectById(projectId, currentUser.id),
    getProjectSwitcherList(currentUser.id),
    getAllUsers(),
  ]);

  if (!projectRes.success || !projectRes.project) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#1D2125] p-6 text-[#B6C2CF]">
        <div className="max-w-md w-full bg-[#22272B] p-6 rounded-xl border border-[#38414A] text-center space-y-4">
          <div className="text-3xl">🔒</div>
          <h2 className="text-base font-bold text-white">Không thể truy cập Dự án</h2>
          <p className="text-xs text-[#8C9BAB]">
            {projectRes.error || 'Dự án này không tồn tại hoặc bạn chưa được mời tham gia.'}
          </p>
          <Link
            href="/spaces"
            className="inline-block px-4 py-2 rounded-lg bg-[#0C66E4] hover:bg-[#0055CC] text-white text-xs font-semibold"
          >
            ← Quay lại Danh sách Dự án
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProjectWorkspace
      initialProject={projectRes.project}
      allProjects={switcherRes.projects || []}
      allUsers={usersRes.users || []}
      currentUser={currentUser}
      userRole={projectRes.userRole || 'VIEWER'}
    />
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#1D2125]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#B6C2CF] bg-[#22272B] px-4 py-2.5 rounded-xl border border-[#38414A]">
            <span className="w-3 h-3 rounded-full border-2 border-[#579DFF] border-t-transparent animate-spin"></span>
            Đang mở không gian Dự án...
          </div>
        </div>
      }
    >
      <ProjectLoader projectId={id} />
    </Suspense>
  );
}
