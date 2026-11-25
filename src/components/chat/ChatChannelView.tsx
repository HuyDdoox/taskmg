'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '@/app/actions/chat-actions';
import { Send, MessageSquare, Clock, User, Sparkles, CheckCircle2 } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface ChatMessageItem {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date | string;
  sender: {
    fullName: string;
    avatarUrl?: string | null;
  };
}

interface ChatChannelViewProps {
  projectId: string;
  channelId: string;
  channelName: string;
  initialMessages: ChatMessageItem[];
  currentUser: {
    id: string;
    fullName: string;
  };
  socket: Socket | null;
  isSocketConnected: boolean;
}

export function ChatChannelView({
  projectId,
  channelId,
  channelName,
  initialMessages,
  currentUser,
  socket,
  isSocketConnected,
}: ChatChannelViewProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages || []);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Lắng nghe sự kiện WebSocket realtime khi có tin nhắn mới từ thành viên khác
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: any) => {
      // Tránh trùng tin nhắn nếu đã có trong state
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);

  // Gửi tin nhắn
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const content = inputText.trim();
    setInputText('');
    setIsSending(true);

    // 1. Lưu vào CSDL Supabase qua Server Action
    const res = await sendChatMessage({
      channelId,
      senderId: currentUser.id,
      content,
    });

    setIsSending(false);

    if (res.success && res.message) {
      const savedMessage: ChatMessageItem = {
        id: res.message.id,
        senderId: currentUser.id,
        content: res.message.content,
        createdAt: res.message.createdAt,
        sender: {
          fullName: currentUser.fullName,
        },
      };

      // Cập nhật giao diện của người gửi
      setMessages((prev) => [...prev, savedMessage]);

      // 2. Bắn sự kiện WebSocket cho toàn bộ thành viên khác trong dự án
      if (socket) {
        socket.emit('send_message', {
          projectId,
          ...savedMessage,
        });
      }
    } else {
      alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F5F7] overflow-hidden">
      
      {/* Chat Header */}
      <div className="h-14 px-6 border-b border-gray-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">{channelName}</h2>
            <p className="text-[11px] text-gray-500">Trao đổi và thảo luận công việc trực tiếp theo thời gian thực</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isSocketConnected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            {isSocketConnected ? 'Realtime Kết Nối' : 'Chế Độ Ngoại Tuyến'}
          </span>
        </div>
      </div>

      {/* Messages Feed Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
            <MessageSquare className="w-10 h-10 text-gray-300" />
            <p className="text-sm">Chưa có tin nhắn nào trong kênh này.</p>
            <p className="text-xs text-gray-400">Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;

            return (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-xl ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs ${
                    isMe ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  {msg.sender?.fullName?.charAt(0) || 'U'}
                </div>

                {/* Message Bubble */}
                <div className={`space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 text-[11px] ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="font-semibold text-gray-800">
                      {isMe ? 'Bạn' : msg.sender?.fullName}
                    </span>
                    <span className="text-gray-400 text-[10px]">
                      {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div 
                    className={`p-3 rounded-2xl text-xs leading-relaxed shadow-2xs break-words ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            placeholder="Nhập nội dung tin nhắn trao đổi (nhấn Enter để gửi)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="flex-1 text-xs p-3 rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
