import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}
  async create(userId: string, data: { title: string; message: string; type: string; linkUrl?: string }) { return this.prisma.notification.create({ data: { userId, ...data } }); }
  async getForUser(userId: string) { return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }); }
  async markRead(id: string, userId: string) { return this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } }); }
  async markAllRead(userId: string) { return this.prisma.notification.updateMany({ where: { userId }, data: { isRead: true } }); }
}