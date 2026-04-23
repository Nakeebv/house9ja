import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService, private email: EmailService) {}
  async create(userId: string, data: { title: string; message: string; type: string; linkUrl?: string }) {
    const [notification, user] = await Promise.all([
      this.prisma.notification.create({ data: { userId, ...data } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } }),
    ]);
    if (user) {
      this.email.sendNotificationEmail(user.email, user.firstName, data.title, data.message, data.linkUrl).catch(() => {});
    }
    return notification;
  }
  async getForUser(userId: string) { return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }); }
  async markRead(id: string, userId: string) { return this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } }); }
  async markAllRead(userId: string) { return this.prisma.notification.updateMany({ where: { userId }, data: { isRead: true } }); }
}