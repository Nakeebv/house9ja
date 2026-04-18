import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateConversation(propertyId: string, tenantId: string, landlordId: string) {
    const existing = await this.prisma.chat.findUnique({
      where: { propertyId_tenantId_landlordId: { propertyId, tenantId, landlordId } },
      include: { property: { select: { id: true, title: true, address: true, city: true, monthlyRent: true } }, tenant: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true } }, landlord: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true } } },
    });
    if (existing) return existing;

    return this.prisma.chat.create({
      data: { propertyId, tenantId, landlordId },
      include: { property: { select: { id: true, title: true, address: true, city: true, monthlyRent: true } }, tenant: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true } }, landlord: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true } } },
    });
  }

  async getUserConversations(userId: string) {
    return this.prisma.chat.findMany({
      where: { OR: [{ tenantId: userId }, { landlordId: userId }] },
      include: {
        property: { select: { id: true, title: true, city: true, monthlyRent: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
        landlord: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(chatId: string, userId: string, page = 1, limit = 50) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Conversation not found');
    if (chat.tenantId !== userId && chat.landlordId !== userId) throw new ForbiddenException();

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { chatId },
        include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { chatId } }),
    ]);

    // Mark messages as read
    await this.prisma.message.updateMany({
      where: { chatId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    return { messages, total, page, limit };
  }

  async sendMessage(chatId: string, senderId: string, content: string, type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'PDF' | 'VIDEO' = 'TEXT', mediaUrl?: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        tenant: { select: { id: true, isBlocked: true } },
        landlord: { select: { id: true, isBlocked: true } },
      },
    });
    if (!chat) throw new NotFoundException('Conversation not found');
    if (chat.tenantId !== senderId && chat.landlordId !== senderId) throw new ForbiddenException();

    const recipient = chat.tenantId === senderId ? chat.landlord : chat.tenant;
    if (recipient.isBlocked) {
      throw new ForbiddenException('This account is currently suspended and cannot receive messages.');
    }

    const sender = chat.tenantId === senderId ? chat.tenant : chat.landlord;
    if (sender.isBlocked) {
      throw new ForbiddenException('Your account is suspended. You cannot send messages.');
    }

    const message = await this.prisma.message.create({
      data: { chatId, senderId, content, type, mediaUrl: mediaUrl ?? null },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });

    await this.prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
    return message;
  }

  async getUnreadCount(userId: string) {
    return this.prisma.message.count({
      where: { chat: { OR: [{ tenantId: userId }, { landlordId: userId }] }, senderId: { not: userId }, isRead: false },
    });
  }
}
