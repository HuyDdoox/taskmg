import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu nạp bộ dữ liệu thử nghiệm phong phú vào Supabase...');

  // 1. Dọn sạch dữ liệu cũ
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

  // 2. Tạo 4 Thành viên (Users)
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

  const designerC = await prisma.user.create({
    data: {
      email: 'designer@company.com',
      fullName: 'Lê Hoàng Designer (UI/UX)',
      passwordHash: 'hashed_password_123',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DesignerC',
    },
  });

  console.log('✅ Đã tạo 4 thành viên mẫu.');

  // 3. Tạo Dự án (Project)
  const project = await prisma.project.create({
    data: {
      name: 'Website Quản lý Công việc & Dự án',
      projectKey: 'TASK',
      description: 'Hệ thống quản lý công việc và dự án chuẩn Jira thu nhỏ với bảng Kanban kéo thả thời gian thực, chat nhóm nội bộ và thông báo email tự động.',
      ownerId: sep.id,
      members: {
        create: [
          { userId: sep.id, role: 'ADMIN' },
          { userId: devA.id, role: 'MEMBER' },
          { userId: testerB.id, role: 'MEMBER' },
          { userId: designerC.id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log(`✅ Đã tạo dự án [${project.projectKey}] ${project.name}`);

  // 4. Tạo 4 Giai đoạn (Milestones)
  const m1 = await prisma.milestone.create({
    data: {
      projectId: project.id,
      title: 'Giai đoạn 1: Khung xương MVP & CSDL',
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
      title: 'Giai đoạn 3: Chat Kênh & Quản lý Thành viên',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-15'),
    },
  });

  const m4 = await prisma.milestone.create({
    data: {
      projectId: project.id,
      title: 'Giai đoạn 4: Tối ưu Bảo Mật & Thông Báo Tự Động',
      status: 'UPCOMING',
      startDate: new Date('2026-12-16'),
      endDate: new Date('2026-12-31'),
    },
  });

  console.log('✅ Đã tạo 4 giai đoạn (Milestones).');

  // 5. Tạo 4 Cột Kanban
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

  // 6. Danh sách 16 Tasks phong phú đầy đủ các ca thử nghiệm
  const tasksData = [
    // --- CỘT 1: CẦN LÀM (TO DO) ---
    {
      taskNumber: 1,
      issueKey: 'TASK-1',
      title: 'Xây dựng bộ lọc công việc theo Tag và Nhãn dán màu',
      description: 'Mô tả: Cho phép người dùng gắn nhãn dán (Backend, Frontend, Bug, Design) và lọc nhanh trên đỉnh bảng Kanban.',
      issueType: 'STORY',
      priority: 'MEDIUM',
      riskLevel: 'LOW',
      columnId: colTodo.id,
      milestoneId: m2.id,
      assigneeId: devA.id,
      orderIndex: 1000,
      dueDate: new Date('2026-12-05'),
      checklists: [
        { title: 'Tạo bảng TAGS trong schema', isCompleted: false, position: 1 },
        { title: 'Gắn badge tag lên Kanban Card', isCompleted: false, position: 2 },
      ],
    },
    {
      taskNumber: 2,
      issueKey: 'TASK-2',
      title: 'Tối ưu hiệu năng khi bảng Kanban có trên 500 thẻ',
      description: 'Mô tả: Sử dụng kỹ thuật Virtual List hoặc phân trang ngầm để kéo thả không bị giật lag khi số lượng task quá lớn.',
      issueType: 'TASK',
      priority: 'HIGH',
      riskLevel: 'CRITICAL',
      columnId: colTodo.id,
      milestoneId: m4.id,
      assigneeId: devA.id,
      orderIndex: 2000,
      dueDate: new Date('2026-12-18'),
      checklists: [
        { title: 'Benchmark thời gian render 500 tasks', isCompleted: false, position: 1 },
        { title: 'Áp dụng useMemo và React.memo vào TaskCard', isCompleted: false, position: 2 },
      ],
    },
    {
      taskNumber: 3,
      issueKey: 'TASK-3',
      title: 'Khắc phục lỗi nhảy font chữ trên trình duyệt Safari',
      description: 'Mô tả: Safari trên iOS gặp hiện tượng font Geist Sans bị lệch baseline ở các badge Priority.',
      issueType: 'BUG',
      priority: 'LOW',
      riskLevel: 'LOW',
      columnId: colTodo.id,
      milestoneId: m2.id,
      assigneeId: designerC.id,
      orderIndex: 3000,
      dueDate: new Date('2026-12-08'),
      checklists: [
        { title: 'Kiểm tra trên iPhone 15 Safari', isCompleted: false, position: 1 },
        { title: 'Thêm font fallback sans-serif', isCompleted: false, position: 2 },
      ],
    },
    {
      taskNumber: 4,
      issueKey: 'TASK-4',
      title: 'Thiết lập Hàng đợi gửi Email khi dời deadline (BullMQ / Nodemailer)',
      description: 'Mô tả: Khi Sếp hoặc PM dời deadline của một task, hệ thống tự động bắn một email cảnh báo đến hộp thư của Assignee.',
      issueType: 'TASK',
      priority: 'HIGH',
      riskLevel: 'HIGH',
      columnId: colTodo.id,
      milestoneId: m4.id,
      assigneeId: devA.id,
      orderIndex: 4000,
      dueDate: new Date('2026-12-20'),
      checklists: [
        { title: 'Cấu hình SMTP Resend / Gmail', isCompleted: false, position: 1 },
        { title: 'Tạo HTML template thông báo dời hạn', isCompleted: false, position: 2 },
        { title: 'Viết background queue listener', isCompleted: false, position: 3 },
      ],
    },

    // --- CỘT 2: ĐANG LÀM (IN PROGRESS) ---
    {
      taskNumber: 5,
      issueKey: 'TASK-5',
      title: 'Cắt giao diện Bảng Kanban kéo thả ná ná Jira',
      description: 'Mô tả: Dựng khung 4 cột trạng thái, tích hợp kéo thả mượt mà với hiệu ứng viền sáng khi rê thẻ vào cột mới.',
      issueType: 'STORY',
      priority: 'BLOCKER',
      riskLevel: 'HIGH',
      columnId: colInProgress.id,
      milestoneId: m2.id,
      assigneeId: devA.id,
      orderIndex: 1000,
      dueDate: new Date('2026-11-28'),
      checklists: [
        { title: 'Dựng khung 4 cột Kanban Jira layout', isCompleted: true, position: 1 },
        { title: 'Tích hợp drag-and-drop mượt mà', isCompleted: true, position: 2 },
        { title: 'Lưu vị trí order_index lên Supabase', isCompleted: true, position: 3 },
      ],
    },
    {
      taskNumber: 6,
      issueKey: 'TASK-6',
      title: 'Tích hợp Drawer trượt phải xem chi tiết Task & Action Checklist',
      description: 'Mô tả: Khi click vào một thẻ, bảng chi tiết trượt ra từ bên phải, cho phép tích chọn checklist để tăng % tiến độ tự động.',
      issueType: 'TASK',
      priority: 'HIGH',
      riskLevel: 'MEDIUM',
      columnId: colInProgress.id,
      milestoneId: m2.id,
      assigneeId: devA.id,
      orderIndex: 2000,
      dueDate: new Date('2026-11-29'),
      checklists: [
        { title: 'Dựng component TaskDrawer.tsx', isCompleted: true, position: 1 },
        { title: 'Kết nối Server Action toggle checklist', isCompleted: true, position: 2 },
        { title: 'Thêm thanh tiến độ phần trăm %', isCompleted: true, position: 3 },
      ],
    },
    {
      taskNumber: 7,
      issueKey: 'TASK-7',
      title: 'Xây dựng Kênh Chat Dự Án Thời Gian Thực qua WebSocket',
      description: 'Mô tả: Phòng chat thảo luận nội bộ gắn liền với dự án, gửi nhận tin tức thì không cần F5 trình duyệt.',
      issueType: 'STORY',
      priority: 'HIGH',
      riskLevel: 'HIGH',
      columnId: colInProgress.id,
      milestoneId: m3.id,
      assigneeId: devA.id,
      orderIndex: 3000,
      dueDate: new Date('2026-12-02'),
      checklists: [
        { title: 'Khởi tạo backend socket.io trên Render', isCompleted: true, position: 1 },
        { title: 'Viết hook useSocket.ts ở client', isCompleted: true, position: 2 },
        { title: 'Dựng UI ChatChannelView.tsx', isCompleted: true, position: 3 },
      ],
    },
    {
      taskNumber: 8,
      issueKey: 'TASK-8',
      title: 'Thiết kế icon và bộ huy hiệu rủi ro (Risk Badge System)',
      description: 'Mô tả: Vẽ bộ icon màu cảnh báo: Đỏ cho Critical, Cam cho High, Vàng cho Medium và Xám cho Low.',
      issueType: 'TASK',
      priority: 'MEDIUM',
      riskLevel: 'LOW',
      columnId: colInProgress.id,
      milestoneId: m2.id,
      assigneeId: designerC.id,
      orderIndex: 4000,
      dueDate: new Date('2026-11-30'),
      checklists: [
        { title: 'Thiết kế icon trên Figma', isCompleted: true, position: 1 },
        { title: 'Export sang định dạng SVG', isCompleted: true, position: 2 },
        { title: 'Gắn vào Kanban Card', isCompleted: false, position: 3 },
      ],
    },

    // --- CỘT 3: XÉT DUYỆT (IN REVIEW) ---
    {
      taskNumber: 9,
      issueKey: 'TASK-9',
      title: 'Kiểm thử khả năng kéo thả đồng thời (Race Condition Testing)',
      description: 'Mô tả: Mở 2 tab trình duyệt khác nhau và kéo cùng một thẻ task để kiểm tra cơ chế giải quyết xung đột.',
      issueType: 'TASK',
      priority: 'HIGH',
      riskLevel: 'CRITICAL',
      columnId: colReview.id,
      milestoneId: m2.id,
      assigneeId: testerB.id,
      orderIndex: 1000,
      dueDate: new Date('2026-11-27'),
      checklists: [
        { title: 'Viết test scenario 2 người kéo cùng lúc', isCompleted: true, position: 1 },
        { title: 'Xác thực WebSocket emit task_moved', isCompleted: true, position: 2 },
        { title: 'Ký biên bản nghiệm thu test case', isCompleted: false, position: 3 },
      ],
    },
    {
      taskNumber: 10,
      issueKey: 'TASK-10',
      title: 'Rà soát lỗ hổng phân quyền chéo dữ liệu (IDOR Security Audit)',
      description: 'Mô tả: Đảm bảo thành viên dự án A không thể dùng API để đọc hoặc sửa task của dự án B.',
      issueType: 'TASK',
      priority: 'BLOCKER',
      riskLevel: 'CRITICAL',
      columnId: colReview.id,
      milestoneId: m4.id,
      assigneeId: testerB.id,
      orderIndex: 2000,
      dueDate: new Date('2026-11-28'),
      checklists: [
        { title: 'Test gửi request với projectId giả mạo', isCompleted: true, position: 1 },
        { title: 'Kiểm tra middleware xác thực JWT/Session', isCompleted: true, position: 2 },
      ],
    },
    {
      taskNumber: 11,
      issueKey: 'TASK-11',
      title: 'Đánh giá giao diện Responsive trên màn hình iPad và Tablet',
      description: 'Mô tả: Kiểm tra thanh Sidebar thu gọn mượt mà trên kích thước màn hình 768px - 1024px.',
      issueType: 'STORY',
      priority: 'MEDIUM',
      riskLevel: 'LOW',
      columnId: colReview.id,
      milestoneId: m2.id,
      assigneeId: designerC.id,
      orderIndex: 3000,
      dueDate: new Date('2026-11-29'),
      checklists: [
        { title: 'Test trên iPad Mini & iPad Pro', isCompleted: true, position: 1 },
        { title: 'Tối ưu độ rộng cột Kanban 280px', isCompleted: true, position: 2 },
      ],
    },

    // --- CỘT 4: HOÀN THÀNH (DONE) ---
    {
      taskNumber: 12,
      issueKey: 'TASK-12',
      title: 'Thiết kế Lược đồ CSDL 10 bảng quan hệ (ERD Schema)',
      description: 'Mô tả: Phân tích và thiết kế mô hình dữ liệu chuẩn hóa 3NF gồm Users, Projects, Milestones, Columns, Tasks, Checklists, Chat, Messages, ActivityLogs.',
      issueType: 'TASK',
      priority: 'BLOCKER',
      riskLevel: 'CRITICAL',
      columnId: colDone.id,
      milestoneId: m1.id,
      assigneeId: devA.id,
      orderIndex: 1000,
      dueDate: new Date('2026-11-10'),
      checklists: [
        { title: 'Liệt kê 10 bảng dữ liệu cần thiết', isCompleted: true, position: 1 },
        { title: 'Chuẩn hóa quan hệ 1-N và N-N', isCompleted: true, position: 2 },
        { title: 'Tạo file prisma/schema.prisma và migration', isCompleted: true, position: 3 },
      ],
    },
    {
      taskNumber: 13,
      issueKey: 'TASK-13',
      title: 'Khởi tạo dự án Next.js 15 & Cấu hình Prisma ORM',
      description: 'Mô tả: Thiết lập khung ứng dụng Fullstack Next.js 15 App Router với TypeScript, Tailwind CSS v4 và kết nối Prisma ORM.',
      issueType: 'STORY',
      priority: 'HIGH',
      riskLevel: 'MEDIUM',
      columnId: colDone.id,
      milestoneId: m1.id,
      assigneeId: devA.id,
      orderIndex: 2000,
      dueDate: new Date('2026-11-12'),
      checklists: [
        { title: 'Cài đặt Next.js 15 với App Router', isCompleted: true, position: 1 },
        { title: 'Cài đặt Prisma 6.4.1 và sinh Prisma Client', isCompleted: true, position: 2 },
        { title: 'Nạp dữ liệu mẫu ban đầu vào CSDL', isCompleted: true, position: 3 },
      ],
    },
    {
      taskNumber: 14,
      issueKey: 'TASK-14',
      title: 'Kết nối Cơ sở dữ liệu Đám mây Supabase PostgreSQL',
      description: 'Mô tả: Chuyển đổi từ SQLite cục bộ lên Cloud Supabase PostgreSQL (Project Ref: jjzgilgwtwhbedpyokme) an toàn và ổn định.',
      issueType: 'TASK',
      priority: 'BLOCKER',
      riskLevel: 'CRITICAL',
      columnId: colDone.id,
      milestoneId: m1.id,
      assigneeId: devA.id,
      orderIndex: 3000,
      dueDate: new Date('2026-11-15'),
      checklists: [
        { title: 'Đổi datasource sang postgresql', isCompleted: true, position: 1 },
        { title: 'Chạy prisma db push tạo 10 bảng trên Cloud', isCompleted: true, position: 2 },
        { title: 'Nạp seed data lên Supabase thành công 100%', isCompleted: true, position: 3 },
      ],
    },
    {
      taskNumber: 15,
      issueKey: 'TASK-15',
      title: 'Triển khai dự án lên Vercel và Render (Go-Live 24/7)',
      description: 'Mô tả: Đẩy toàn bộ mã nguồn lên GitHub HuyDdoox/taskmg, liên kết tự động triển khai Vercel và Render.',
      issueType: 'STORY',
      priority: 'HIGH',
      riskLevel: 'HIGH',
      columnId: colDone.id,
      milestoneId: m1.id,
      assigneeId: devA.id,
      orderIndex: 4000,
      dueDate: new Date('2026-11-20'),
      checklists: [
        { title: 'Đẩy code lên GitHub repository', isCompleted: true, position: 1 },
        { title: 'Cấu hình biến môi trường DATABASE_URL trên Vercel', isCompleted: true, position: 2 },
        { title: 'Cấu hình Web Service trên Render', isCompleted: true, position: 3 },
      ],
    },
  ];

  // Lưu các task và checklists
  for (const t of tasksData) {
    const { checklists, ...taskFields } = t;
    await prisma.task.create({
      data: {
        ...taskFields,
        projectId: project.id,
        reporterId: sep.id,
        checklists: {
          create: checklists,
        },
      },
    });
  }

  console.log(`✅ Đã nạp thành công ${tasksData.length} Tasks chuẩn Jira kèm Action Checklists phong phú.`);

  // 7. Tạo Kênh Chat & Tin nhắn trao đổi sống động
  const generalChannel = await prisma.chatChannel.create({
    data: {
      projectId: project.id,
      name: '💬 Kênh Thảo Luận Chung Dự Án',
      type: 'PUBLIC',
      messages: {
        create: [
          {
            senderId: sep.id,
            content: 'Chào cả team! Dự án Website Quản lý Công việc chính thức khởi động và đã Go-Live nhé. Mọi người theo dõi Bảng Kanban để nhận việc.',
          },
          {
            senderId: devA.id,
            content: 'Dạ Sếp! Em vừa hoàn thành kết nối Supabase Cloud và dựng xong giao diện Kanban kéo thả chuẩn Jira rồi ạ.',
          },
          {
            senderId: designerC.id,
            content: 'Em đã chuẩn bị xong bộ Risk Badge System (đỏ, cam, vàng, xám) nhìn cực kỳ chuyên nghiệp trên các thẻ task!',
          },
          {
            senderId: testerB.id,
            content: 'Em đang kiểm thử các ca kéo thả đồng thời và test lỗ hổng bảo mật IDOR. Mọi thứ hiện tại chạy rất mượt mà.',
          },
          {
            senderId: sep.id,
            content: 'Tuyệt vời! Anh em tiếp tục bám sát tiến độ theo từng Milestone nhé.',
          },
        ],
      },
    },
  });

  console.log('✅ Đã tạo Kênh chat với 5 tin nhắn trao đổi thực tế.');

  // 8. Tạo Activity Logs
  const firstTask = await prisma.task.findFirst({ where: { issueKey: 'TASK-5' } });
  if (firstTask) {
    await prisma.activityLog.createMany({
      data: [
        {
          taskId: firstTask.id,
          userId: sep.id,
          action: 'CREATED',
          detailsJson: JSON.stringify({ message: 'Sếp đã tạo task TASK-5' }),
        },
        {
          taskId: firstTask.id,
          userId: devA.id,
          action: 'STATUS_CHANGED',
          detailsJson: JSON.stringify({ from: 'TO_DO', to: 'IN_PROGRESS' }),
        },
      ],
    });
  }

  console.log('✅ Đã tạo Activity Logs lưu vết lịch sử.');
  console.log('🎉 NẠP TOÀN BỘ 16 TASKS VÀ DỮ LIỆU THỬ NGHIỆM VÀO SUPABASE THÀNH CÔNG 100%!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi nạp dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
