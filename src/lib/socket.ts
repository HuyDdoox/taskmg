import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // Ưu tiên biến môi trường NEXT_PUBLIC_SOCKET_URL, nếu không có thì trỏ về Render backend
    const socketUrl = 
      process.env.NEXT_PUBLIC_SOCKET_URL || 
      'https://taskmg-backend.onrender.com';

    console.log(`🔌 Kết nối Socket.io tới: ${socketUrl}`);

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }

  return socket;
};
