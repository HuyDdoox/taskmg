import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const RENDER_BACKEND_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'https://taskmg-backend.onrender.com';

/**
 * Khởi tạo Socket.io Client kết nối tới Render Backend ở chế độ Non-Blocking.
 * Dùng timeout ngắn và kết nối ngầm để không bao giờ làm chậm tốc độ tải trang Vercel
 * ngay cả khi Render Free Tier đang trong trạng thái cold-start (ngủ đông).
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(RENDER_BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      timeout: 8000,
    });
  }
  return socket;
};

/**
 * Gửi sự kiện Realtime lên Render một cách an toàn (fire-and-forget).
 */
export function emitRealtimeEvent(event: string, payload: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try {
    const s = getSocket();
    if (!s.connected) {
      s.connect();
    }
    s.emit(event, payload);
  } catch {
    // Bỏ qua lỗi mạng ngầm để không ảnh hưởng luồng thao tác chính
  }
}
