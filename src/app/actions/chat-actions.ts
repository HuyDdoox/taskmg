'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Lấy kênh chat và tin nhắn của dự án
export async function getProjectChatData(projectId: string) {
  try {
    let channel = await prisma.chatChannel.findFirst({
      where: { projectId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: true,
          },
        },
      },
    });

    // Nếu chưa có kênh chat, tạo mới một kênh mặc định
    if (!channel) {
      channel = await prisma.chatChannel.create({
        data: {
          projectId,
          name: '💬 Kênh Thảo Luận Chung',
          type: 'PUBLIC',
        },
        include: {
          messages: {
            include: { sender: true },
          },
        },
      });
    }

    return { success: true, channel };
  } catch (error) {
    console.error('Lỗi lấy tin nhắn chat:', error);
    return { success: false, error: 'Không thể tải tin nhắn' };
  }
}

// Gửi tin nhắn mới vào CSDL Supabase
export async function sendChatMessage(data: {
  channelId: string;
  senderId: string;
  content: string;
}) {
  try {
    if (!data.content.trim()) {
      return { success: false, error: 'Tin nhắn không được để trống' };
    }

    const message = await prisma.message.create({
      data: {
        channelId: data.channelId,
        senderId: data.senderId,
        content: data.content.trim(),
      },
      include: {
        sender: true,
      },
    });

    revalidatePath('/');
    return { success: true, message };
  } catch (error) {
    console.error('Lỗi gửi tin nhắn:', error);
    return { success: false, error: 'Không thể gửi tin nhắn' };
  }
}
