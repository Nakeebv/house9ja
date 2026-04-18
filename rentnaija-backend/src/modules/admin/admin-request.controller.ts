import { Controller, Get, Post, Param, Request, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('requests')
export class AdminRequestController {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @Post() @UseGuards(JwtAuthGuard)
  async createRequest(@Request() req: any, @Body() b: { type: string; subject: string; message?: string }) {
    const adminUser = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) return { error: 'No admin available' };

    const request = await this.prisma.adminRequest.create({
      data: {
        adminId: adminUser.id,
        userId: req.user.id,
        type: b.type as any,
        subject: b.subject,
        status: 'OPEN',
      },
    });

    if (b.message) {
      await this.prisma.adminRequestMessage.create({
        data: { requestId: request.id, senderId: req.user.id, message: b.message },
      });
    }

    return request;
  }

  @Get('my') @UseGuards(JwtAuthGuard)
  async getMyRequests(@Request() req: any) {
    return this.prisma.adminRequest.findMany({
      where: { userId: req.user.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Post(':id/reply') @UseGuards(JwtAuthGuard)
  async replyToRequest(@Request() req: any, @Param('id') id: string, @Body() b: { message?: string; attachmentUrl?: string }) {
    const request = await this.prisma.adminRequest.findUnique({ where: { id } });
    if (!request || request.userId !== req.user.id) return { error: 'Not found' };

    const [message] = await Promise.all([
      this.prisma.adminRequestMessage.create({
        data: { requestId: id, senderId: req.user.id, message: b.message, attachmentUrl: b.attachmentUrl },
        include: { sender: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } } },
      }),
      this.prisma.adminRequest.update({ where: { id }, data: { status: 'PENDING_ADMIN' } }),
    ]);

    await this.notifications.create(request.adminId, {
      title: 'User replied to support request',
      message: b.message ?? 'New message from user.',
      type: 'USER_REPLY',
    });

    return message;
  }
}
