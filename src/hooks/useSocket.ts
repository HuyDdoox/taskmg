'use client';

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';

interface UseSocketOptions {
  projectId?: string;
  userId?: string;
}

/**
 * Hook kết nối bất đồng bộ (Lazy Non-Blocking) tới Render Realtime Server v2.0.
 * Chỉ kích hoạt kết nối sau khi giao diện chính đã tải xong (trì hoãn 1.2s),
 * giúp trang web trên Vercel luôn đạt tốc độ phản hồi tức thì (< 200ms).
 */
export function useSocket(options?: string | UseSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const projectId = typeof options === 'string' ? options : options?.projectId;
  const userId = typeof options === 'string' ? undefined : options?.userId;

  useEffect(() => {
    let mounted = true;
    const socketInstance = getSocket();

    const joinRooms = () => {
      if (!mounted) return;
      setIsConnected(true);
      if (projectId) {
        socketInstance.emit('join_project', projectId);
      }
      if (userId) {
        socketInstance.emit('join_user', userId);
      }
    };

    const onDisconnect = () => {
      if (mounted) setIsConnected(false);
    };

    socketInstance.on('connect', joinRooms);
    socketInstance.on('disconnect', onDisconnect);

    // Trì hoãn kết nối ngầm 1.2s sau khi UI đã hiển thị xong để không block luồng chính
    const timer = setTimeout(() => {
      if (!mounted) return;
      setSocket(socketInstance);
      if (!socketInstance.connected) {
        socketInstance.connect();
      } else {
        joinRooms();
      }
    }, 1200);

    return () => {
      mounted = false;
      clearTimeout(timer);
      socketInstance.off('connect', joinRooms);
      socketInstance.off('disconnect', onDisconnect);
    };
  }, [projectId, userId]);

  return { socket, isConnected };
}
