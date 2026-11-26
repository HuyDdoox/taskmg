import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
  })
);
app.use(express.json());

// Create HTTP and Socket.io server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 25000,
});

// Track active rooms & connections for diagnostics
let totalEventsProcessed = 0;

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'TaskMG Workspace Realtime Backend',
    version: '2.0.0',
    features: [
      'kanban_drag_drop_sync',
      'single_and_bulk_task_sync',
      'inline_list_and_drawer_sync',
      'checklist_progress_sync',
      'member_and_milestone_sync',
      'in_app_notification_bell_push',
    ],
    connectedClients: io.engine.clientsCount,
    totalEventsProcessed,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    version: '2.0.0',
    connectedClients: io.engine.clientsCount,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.get('/api/stats', (req, res) => {
  const rooms = [];
  for (const [roomName, members] of io.sockets.adapter.rooms.entries()) {
    if (roomName.startsWith('project_') || roomName.startsWith('user_')) {
      rooms.push({ room: roomName, clients: members.size });
    }
  }
  res.json({
    status: 'online',
    version: '2.0.0',
    connectedClients: io.engine.clientsCount,
    totalEventsProcessed,
    activeRooms: rooms,
  });
});

// Optional REST webhook bridge so Server Actions or external services can push events
app.post('/api/broadcast', (req, res) => {
  const { room, event, payload } = req.body || {};
  if (!room || !event) {
    return res.status(400).json({ ok: false, error: 'Missing room or event' });
  }
  totalEventsProcessed += 1;
  io.to(room).emit(event, payload);
  return res.json({ ok: true, room, event });
});

// Socket.io Realtime Event Handlers (v2.0)
io.on('connection', (socket) => {
  console.log(`⚡ [Connect] Client: ${socket.id}`);

  // 1. Tham gia phòng dự án (Project Workspace Room)
  socket.on('join_project', (projectId) => {
    if (!projectId) return;
    socket.join(`project_${projectId}`);
    console.log(`📂 [Room] Client ${socket.id} joined project_${projectId}`);
  });

  // 2. Tham gia phòng cá nhân để nhận Chuông thông báo In-App 🔔 (User Notification Room)
  socket.on('join_user', (userId) => {
    if (!userId) return;
    socket.join(`user_${userId}`);
    console.log(`🔔 [Room] Client ${socket.id} joined user_${userId}`);
  });

  // 3. Sự kiện Kéo Thả Task trên Kanban Board (TASK_MOVED)
  socket.on('task_moved', (data) => {
    if (!data?.projectId) return;
    totalEventsProcessed += 1;
    socket.to(`project_${data.projectId}`).emit('task_moved', data);
  });

  // 4. Sự kiện Tạo Task lẻ (TASK_CREATED)
  socket.on('task_created', (data) => {
    if (!data?.projectId) return;
    totalEventsProcessed += 1;
    socket.to(`project_${data.projectId}`).emit('task_created', data);
  });

  // 5. Sự kiện Tạo Danh Sách Task Hàng Loạt — Paste / CSV (BULK_TASKS_CREATED)
  socket.on('bulk_tasks_created', (data) => {
    if (!data?.projectId) return;
    totalEventsProcessed += 1;
    socket.to(`project_${data.projectId}`).emit('bulk_tasks_created', data);
  });

  // 6. Sự kiện Cập nhật thông tin Task / Tích Checklist (TASK_UPDATED)
  socket.on('task_updated', (data) => {
    if (!data?.projectId) return;
    totalEventsProcessed += 1;
    socket.to(`project_${data.projectId}`).emit('task_updated', data);
  });

  // 7. Sự kiện Xóa Task (TASK_DELETED)
  socket.on('task_deleted', (data) => {
    if (!data?.projectId) return;
    totalEventsProcessed += 1;
    socket.to(`project_${data.projectId}`).emit('task_deleted', data);
  });

  // 8. Sự kiện Thay đổi Thành viên / Vai trò RBAC (MEMBER_CHANGED)
  socket.on('member_changed', (data) => {
    if (!data?.projectId) return;
    totalEventsProcessed += 1;
    socket.to(`project_${data.projectId}`).emit('member_changed', data);
  });

  // 9. Sự kiện Tạo Giai đoạn / Sprint mới (MILESTONE_CREATED)
  socket.on('milestone_created', (data) => {
    if (!data?.projectId) return;
    totalEventsProcessed += 1;
    socket.to(`project_${data.projectId}`).emit('milestone_created', data);
  });

  // 10. Sự kiện Bắn Chuông Thông Báo In-App 🔔 cho thành viên (NOTIFICATION_DISPATCH)
  socket.on('notification_dispatch', (data) => {
    totalEventsProcessed += 1;
    const targetIds = Array.isArray(data?.userIds)
      ? data.userIds
      : data?.userId
      ? [data.userId]
      : [];
    targetIds.forEach((uid) => {
      io.to(`user_${uid}`).emit('notification_received', data);
    });
    if (data?.projectId) {
      socket.to(`project_${data.projectId}`).emit('notification_received', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ [Disconnect] Client: ${socket.id}`);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TaskMG Realtime Server v2.0 đang chạy trên cổng ${PORT}`);
  console.log(`🔗 Health check sẵn sàng tại http://0.0.0.0:${PORT}/health`);
});
