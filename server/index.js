import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Health check endpoint for Render
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Task Management Realtime Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Create HTTP and Socket.io server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Socket.io Realtime Event Handlers
io.on('connection', (socket) => {
  console.log(`⚡ Client kết nối: ${socket.id}`);

  // 1. Tham gia phòng dự án (Project Room)
  socket.on('join_project', (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`👤 Client ${socket.id} đã tham gia phòng: project_${projectId}`);
  });

  // 2. Sự kiện Kéo Thả Task (TASK_MOVED)
  socket.on('task_moved', (data) => {
    console.log(`📌 Task di chuyển: ${data.issueKey} ➔ Cột: ${data.targetColumnId}`);
    // Broadcast cho toàn bộ thành viên khác trong phòng dự án
    socket.to(`project_${data.projectId}`).emit('task_moved', data);
  });

  // 3. Sự kiện Chat Kênh Dự Án (NEW_MESSAGE)
  socket.on('send_message', (messageData) => {
    console.log(`💬 Tin nhắn mới từ ${messageData.senderName}: "${messageData.content}"`);
    io.to(`project_${messageData.projectId}`).emit('new_message', messageData);
  });

  // 4. Báo trạng thái đang soạn tin (TYPING)
  socket.on('typing', ({ projectId, userName, isTyping }) => {
    socket.to(`project_${projectId}`).emit('user_typing', { userName, isTyping });
  });

  // 5. Ngắt kết nối
  socket.on('disconnect', () => {
    console.log(`❌ Client ngắt kết nối: ${socket.id}`);
  });
});

// Khởi động máy chủ
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Taskmg Realtime Server đang chạy trên cổng ${PORT}`);
  console.log(`🔗 Health check sẵn sàng tại http://0.0.0.0:${PORT}/`);
});
