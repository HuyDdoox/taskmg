'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';

export function useSocket(projectId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    const onConnect = () => {
      console.log('⚡ WebSocket đã kết nối thành công!');
      setIsConnected(true);
      if (projectId) {
        s.emit('join_project', projectId);
      }
    };

    const onDisconnect = () => {
      console.log('❌ WebSocket đã ngắt kết nối');
      setIsConnected(false);
    };

    if (s.connected) {
      setIsConnected(true);
      if (projectId) {
        s.emit('join_project', projectId);
      }
    }

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [projectId]);

  return { socket, isConnected };
}
