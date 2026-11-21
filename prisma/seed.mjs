import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu vào dự án...');

  // 1. Xóa dữ liệu cũ (nếu có)
  await prisma.activityLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatChannel.deleteMany();
  await prisma.taskChecklist.deleteMany();
  await prisma.task.deleteMany();
  await prisma.kanbanColumn.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // 2. Tạo Người dùng (Users)
  const sep = await prisma.user.create({
    data: {
      email: 'sep@company.com',
      fullName: 'Sếp / Product Owner',
      passwordHash: 'hashed_password_123',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sep',
    },
  });

  const devA = await prisma.user.create({
    data: {
      email: 'deva@company.com',
      fullName: 'Nguyễn Văn Dev (Fullstack)',
      passwordHash: 'hashed_password_123',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DevA',
    },
  });

  const testerB = await prisma.user.create({
    data: {
      email: 'tester@company.com',
      fullName: 'Trần Thị QA (Tester)',
      passwordHash: 'hashed_password_123',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TesterB',
    },
  });

  console.log('✅ Đã tạo 3 người dùng mẫu.');

  // 3. Tạo Dự án (Project)
  const project = await prisma.project.create({
    data: {
      name: 'Website Quản lý Công việc & Dự án',
      projectKey: 'TASK',
      description: 'Hệ thống quản lý công việc và dự án chuẩn Jira thu nhỏ với bảng Kanban kéo thả, chat nhóm thời gian thực và thông báo email tự động.',
      ownerId: sep.id,
      members: {
        create: [
          { userId: sep.id, role: 'ADMIN' },
          { userId: devA.id, role: 'MEMBER' },
          { userId: testerB.id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log(`✅ Đã tạo dự án [${project.projectKey}] ${project.name}`);

  // 4. Tạo Giai đoạn (Milestones)
  const m1 = await prisma.milestone.create({
    data: {
      projectId: project.id,
      title: 'Giai đoạn 1: Khung xương MVP & Phân tích',
      status: 'COMPLETED',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-15'),
    },
  });

  const m2 = await prisma.milestone.create({
    data: {
      projectId: project.id,
      title: 'Giai đoạn 2: Bảng Kanban Kéo Thả & Realtime',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-11-16'),
      endDate: new Date('2026-11-30'),
    },
  });

  const m3 = await prisma.milestone.create({
    data: {
      projectId: project.id,
      title: 'Giai đoạn 3: Chat Trao Đổi & Mail Tự Động',
      status: 'UPCOMING',
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-15'),
    },
  });

  console.log('✅ Đã tạo 3 giai đoạn (Milestones).');

  // 5. Tạo các Cột Kanban (Kanban Columns)
  const colTodo = await prisma.kanbanColumn.create({
    data: { projectId: project.id, title: 'Cần làm (To Do)', position: 1000, colorHex: '#6B7280' },
  });

  const colInProgress = await prisma.kanbanColumn.create({
    data: { projectId: project.id, title: 'Đang làm (In Progress)', position: 2000, colorHex: '#3B82F6' },
  });

  const colReview = await prisma.kanbanColumn.create({
    data: { projectId: project.id, title: 'Xét duyệt (In Review)', position: 3000, colorHex: '#8B5CF6' },
  });

  const colDone = await prisma.kanbanColumn.create({
    data: { projectId: project.id, title: 'Hoàn thành (Done)', position: 4000, colorHex: '#10B981' },
  });

  console.log('✅ Đã tạo 4 cột Kanban chuẩn.');

  // 6. Tạo các Task Chuẩn Jira (Tasks with Priority, Risk, Checklists)
  const task1 = await prisma.task.create({
    data: {
      projectId: project.id,
      taskNumber: 1,
      issueKey: 'TASK-1',
      title: 'Thiết kế Lược đồ CSDL 10 bảng chuẩn hóa (ERD)',
      description: 'Mô tả công việc: Phân tích và thiết kế mô hình dữ liệu quan hệ cho toàn bộ hệ thống gồm Users, Projects, Milestones, Tasks, Checklists, Chat, Messages, Logs.',
      issueType: 'TASK',
      priority: 'BLOCKER',
      riskLevel: 'CRITICAL',
      columnId: colDone.id,
      milestoneId: m1.id,
      assigneeId: devA.id,
      reporterId: sep.id,
      orderIndex: 1000,
      dueDate: new Date('2026-11-10'),
      checklists: {
        create: [
          { title: 'Liệt kê 10 bảng dữ liệu cần thiết', isCompleted: true, position: 1 },
          { title: 'Chuẩn hóa quan hệ 1-N và N-N', isCompleted: true, position: 2 },
          { title: 'Tạo file prisma/schema.prisma và migration', isCompleted: true, position: 3 },
        ],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project.id,
      taskNumber: 2,
      issueKey: 'TASK-2',
      title: 'Khởi tạo dự án Next.js 15 & Prisma ORM',
      description: 'Mô tả công việc: Thiết lập khung ứng dụng Fullstack Next.js 15 App Router với TypeScript, Tailwind CSS và kết nối Prisma ORM tới database SQLite.',
      issueType: 'STORY',
      priority: 'HIGH',
      riskLevel: 'MEDIUM',
      columnId: colDone.id,
      milestoneId: m1.id,
      assigneeId: devA.id,
      reporterId: sep.id,
      orderIndex: 2000,
      dueDate: new Date('2026-11-12'),
      checklists: {
        create: [
          { title: 'Cài đặt Next.js 15 với App Router', isCompleted: true, position: 1 },
          { title: 'Cài đặt Prisma 6.4.1 và sinh Prisma Client', isCompleted: true, position: 2 },
          { title: 'Nạp dữ liệu mẫu seed.mjs vào CSDL', isCompleted: true, position: 3 },
        ],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: project.id,
      taskNumber: 3,
      issueKey: 'TASK-3',
      title: 'Xây dựng Giao diện Bảng Kanban kéo thả ná ná Jira',
      description: 'Mô tả công việc: Xây dựng giao diện bảng Kanban với 4 cột trạng thái, cho phép kéo thả thẻ công việc mượt mà và cập nhật trạng thái tức thì.',
      issueType: 'STORY',
      priority: 'HIGH',
      riskLevel: 'HIGH',
      columnId: colInProgress.id,
      milestoneId: m2.id,
      assigneeId: devA.id,
      reporterId: sep.id,
      orderIndex: 1000,
      dueDate: new Date('2026-11-25'),
      checklists: {
        create: [
          { title: 'Dựng khung 4 cột Kanban theo phong cách Jira', isCompleted: true, position: 1 },
          { title: 'Tích hợp thư viện kéo thả @dnd-kit', isCompleted: false, position: 2 },
          { title: 'Viết API Server Action cập nhật vị trí thẻ order_index', isCompleted: false, position: 3 },
        ],
      },
    },
  });

  const task4 = await prisma.task.create({
    data: {
      projectId: project.id,
      taskNumber: 4,
      issueKey: 'TASK-4',
      title: 'Tích hợp Drawer trượt phải xem chi tiết Task & Checklist',
      description: 'Mô tả công việc: Khi người dùng bấm vào một Task trên Kanban, một bảng Drawer trượt từ cạnh phải màn hình hiển thị: Mô tả tổng quan, Action checklist tích chọn % tiến độ, ngày tạo, ngày sửa và độ ưu tiên rủi ro.',
      issueType: 'TASK',
      priority: 'MEDIUM',
      riskLevel: 'LOW',
      columnId: colInProgress.id,
      milestoneId: m2.id,
      assigneeId: devA.id,
      reporterId: sep.id,
      orderIndex: 2000,
      dueDate: new Date('2026-11-27'),
      checklists: {
        create: [
          { title: 'Thiết kế Slide-over Drawer bên phải', isCompleted: true, position: 1 },
          { title: 'Hiển thị danh sách checklist và thanh % hoàn thành', isCompleted: false, position: 2 },
          { title: 'Cho phép chỉnh sửa inline tiêu đề và mô tả', isCompleted: false, position: 3 },
        ],
      },
    },
  });

  const task5 = await prisma.task.create({
    data: {
      projectId: project.id,
      taskNumber: 5,
      issueKey: 'TASK-5',
      title: 'Cấu hình Socket.io đồng bộ realtime Bảng Kanban',
      description: 'Mô tả công việc: Kết nối WebSocket server. Khi người dùng A kéo thẻ sang cột khác, toàn bộ các thành viên khác đang mở trang sẽ thấy thẻ tự động di chuyển theo thời gian thực.',
      issueType: 'TASK',
      priority: 'HIGH',
      riskLevel: 'HIGH',
      columnId: colTodo.id,
      milestoneId: m2.id,
      assigneeId: devA.id,
      reporterId: sep.id,
      orderIndex: 1000,
      dueDate: new Date('2026-11-30'),
      checklists: {
        create: [
          { title: 'Cấu hình Socket.io server', isCompleted: false, position: 1 },
          { title: 'Bắn sự kiện TASK_MOVED khi thả thẻ', isCompleted: false, position: 2 },
        ],
      },
    },
  });

  const task6 = await prisma.task.create({
    data: {
      projectId: project.id,
      taskNumber: 6,
      issueKey: 'TASK-6',
      title: 'Xây dựng Kênh Chat dự án thời gian thực',
      description: 'Mô tả công việc: Kênh chat thảo luận dành riêng cho thành viên dự án, gửi nhận tin nhắn tức thì qua WebSocket.',
      issueType: 'STORY',
      priority: 'MEDIUM',
      riskLevel: 'MEDIUM',
      columnId: colTodo.id,
      milestoneId: m3.id,
      assigneeId: devA.id,
      reporterId: sep.id,
      orderIndex: 1000,
      dueDate: new Date('2026-12-05'),
      checklists: {
        create: [
          { title: 'Tạo giao diện khung chat sidebar', isCompleted: false, position: 1 },
          { title: 'Lưu tin nhắn vào bảng MESSAGES', isCompleted: false, position: 2 },
        ],
      },
    },
  });

  const task7 = await prisma.task.create({
    data: {
      projectId: project.id,
      taskNumber: 7,
      issueKey: 'TASK-7',
      title: 'Thiết lập Hàng đợi gửi Email khi thay đổi deadline hoặc giao task',
      description: 'Mô tả công việc: Dựng Background Queue (Redis / BullMQ hoặc Nodemailer worker) tự động gửi email cho Assignee khi được giao việc hoặc có thay đổi deadline quan trọng.',
      issueType: 'TASK',
      priority: 'MEDIUM',
      riskLevel: 'MEDIUM',
      columnId: colTodo.id,
      milestoneId: m3.id,
      assigneeId: devA.id,
      reporterId: sep.id,
      orderIndex: 2000,
      dueDate: new Date('2026-12-10'),
      checklists: {
        create: [
          { title: 'Soạn template email HTML thông báo đẹp mắt', isCompleted: false, position: 1 },
          { title: 'Tích hợp dịch vụ gửi mail qua Background Queue', isCompleted: false, position: 2 },
        ],
      },
    },
  });

  console.log('✅ Đã tạo 7 Tasks chuẩn Jira kèm Action Checklists & Risk Level.');

  // 7. Tạo Kênh Chat & Tin nhắn mẫu (Chat Channels & Messages)
  const generalChannel = await prisma.chatChannel.create({
    data: {
      projectId: project.id,
      name: '💬 Thảo Luận Chung Dự Án',
      type: 'PUBLIC',
      messages: {
        create: [
          {
            senderId: sep.id,
            content: 'Chào cả team! Dự án Website Quản lý Công việc chính thức khởi động nhé. Anh em bám sát bảng Kanban để cập nhật tiến độ.',
          },
          {
            senderId: devA.id,
            content: 'Dạ Sếp! Em vừa hoàn thành thiết kế CSDL 10 bảng và nạp dữ liệu mẫu xong. Đang tiến hành làm giao diện Kanban chuẩn Jira ạ.',
          },
          {
            senderId: testerB.id,
            content: 'Em đã chuẩn bị sẵn danh sách kịch bản test kéo thả và kiểm thử biên rồi ạ!',
          },
        ],
      },
    },
  });

  console.log('✅ Đã tạo Kênh chat và tin nhắn trao đổi mẫu.');

  // 8. Tạo Nhật ký hoạt động mẫu (Activity Logs)
  await prisma.activityLog.createMany({
    data: [
      {
        taskId: task1.id,
        userId: sep.id,
        action: 'CREATED',
        detailsJson: JSON.stringify({ message: 'Sếp đã tạo task TASK-1' }),
      },
      {
        taskId: task1.id,
        userId: devA.id,
        action: 'STATUS_CHANGED',
        detailsJson: JSON.stringify({ from: 'IN_PROGRESS', to: 'DONE' }),
      },
      {
        taskId: task3.id,
        userId: devA.id,
        action: 'STATUS_CHANGED',
        detailsJson: JSON.stringify({ from: 'TO_DO', to: 'IN_PROGRESS' }),
      },
    ],
  });

  console.log('✅ Đã tạo Activity Logs lưu vết lịch sử.');
  console.log('🎉 NẠP TOÀN BỘ DỮ LIỆU MẪU THÀNH CÔNG 100%!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi nạp dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
