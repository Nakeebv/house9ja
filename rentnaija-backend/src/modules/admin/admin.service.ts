import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private email: EmailService,
  ) {}

  assertAdmin(role: string) {
    if (role !== 'ADMIN') throw new ForbiddenException('Admin only');
  }

  async getOverview(role: string) {
    this.assertAdmin(role);
    const [totalUsers, activeUsers, suspendedUsers, properties, pendingVerifications, openDisputes] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isBlocked: false, deletedAt: null } }),
      this.prisma.user.count({ where: { isBlocked: true } }),
      this.prisma.property.count({ where: { deletedAt: null } }),
      this.prisma.verificationDocument.count({ where: { status: 'PENDING' } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
    ]);
    return { users: totalUsers, activeUsers, suspendedUsers, properties, pendingVerifications, openDisputes };
  }

  async getUsers(role: string, params: { roleFilter?: string; status?: string; search?: string; page?: number; limit?: number }) {
    this.assertAdmin(role);
    const { roleFilter, status, search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (roleFilter) where.role = roleFilter;
    if (status === 'suspended') where.isBlocked = true;
    else if (status === 'active') where.isBlocked = false;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, email: true, phone: true, firstName: true, lastName: true,
          role: true, isVerified: true, isVerifiedLandlord: true, isBlocked: true,
          avatarUrl: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit };
  }

  async suspendUser(adminRole: string, userId: string) {
    this.assertAdmin(adminRole);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });
    const title = 'Account Suspended';
    const message = 'Your account has been suspended. Please contact support for more information.';
    await this.notifications.create(userId, { title, message, type: 'ACCOUNT_SUSPENDED' });
    await this.email.sendNotificationEmail(user.email, user.firstName, title, message);
    return user;
  }

  async unsuspendUser(adminRole: string, userId: string) {
    this.assertAdmin(adminRole);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false },
    });
    const title = 'Account Reinstated';
    const message = 'Your account has been reinstated. You can now log in normally.';
    await this.notifications.create(userId, { title, message, type: 'ACCOUNT_REINSTATED' });
    await this.email.sendNotificationEmail(user.email, user.firstName, title, message);
    return user;
  }

  async getProperties(role: string, params: { status?: string; page?: number }) {
    this.assertAdmin(role);
    const { page = 1 } = params;
    const skip = (page - 1) * 20;
    return this.prisma.property.findMany({
      skip,
      take: 20,
      include: { landlord: { select: { id: true, firstName: true, lastName: true, email: true, isVerified: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveProperty(adminRole: string, id: string) {
    this.assertAdmin(adminRole);
    const property = await this.prisma.property.update({
      where: { id },
      data: { isVerified: true, isAvailable: true },
    });
    const ownerId = property.agentId ?? property.landlordId;
    await this.notifications.create(ownerId, {
      title: '✅ Listing Approved',
      message: `Your listing "${property.title}" has been approved and is now live.`,
      type: 'LISTING_APPROVED',
      linkUrl: `/property/${property.id}`,
    });
    return property;
  }

  async rejectProperty(adminRole: string, id: string) {
    this.assertAdmin(adminRole);
    const property = await this.prisma.property.update({
      where: { id },
      data: { isAvailable: false, isVerified: false },
    });
    const ownerId = property.agentId ?? property.landlordId;
    await this.notifications.create(ownerId, {
      title: '❌ Listing Rejected',
      message: `Your listing "${property.title}" was not approved. Please review and resubmit.`,
      type: 'LISTING_REJECTED',
      linkUrl: `/agent/properties`,
    });
    return property;
  }

  async getVerifications(adminRole: string) {
    this.assertAdmin(adminRole);
    return this.prisma.verificationDocument.findMany({
      include: { landlord: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateVerification(adminRole: string, id: string, data: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) {
    this.assertAdmin(adminRole);
    const doc = await this.prisma.verificationDocument.update({
      where: { id },
      data: { status: data.status, rejectionReason: data.rejectionReason ?? null, requiresMoreDocs: false },
      include: { landlord: { select: { email: true, firstName: true } } },
    });
    if (data.status === 'APPROVED') {
      await this.prisma.user.update({ where: { id: doc.landlordId }, data: { isVerifiedLandlord: true } });
      const title = '🏅 Landlord Verified';
      const message = 'Your landlord verification has been approved. Listings now carry a Verified badge.';
      await this.notifications.create(doc.landlordId, { title, message, type: 'VERIFICATION_APPROVED' });
      await this.email.sendNotificationEmail(doc.landlord.email, doc.landlord.firstName, title, message);
    } else {
      const rejMsg = data.rejectionReason
        ? `Verification rejected: ${data.rejectionReason}`
        : 'Your verification was rejected. Please re-submit with clearer documents.';
      await this.notifications.create(doc.landlordId, {
        title: 'Verification Rejected',
        message: rejMsg,
        type: 'VERIFICATION_REJECTED',
        linkUrl: '/verify',
      });
      await this.email.sendNotificationEmail(doc.landlord.email, doc.landlord.firstName, 'Verification Rejected', rejMsg, '/verify');
    }
    return doc;
  }

  async getReports(adminRole: string) {
    this.assertAdmin(adminRole);
    return this.prisma.report.findMany({
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        reported: { select: { id: true, firstName: true, lastName: true, email: true } },
        property: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveReport(adminRole: string, reportId: string) {
    this.assertAdmin(adminRole);
    return this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'RESOLVED' },
    });
  }

  async dismissReport(adminRole: string, reportId: string) {
    this.assertAdmin(adminRole);
    return this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'DISMISSED' },
    });
  }

  // ── Admin Requests ──────────────────────────────────────────────────────────

  async getRequests(adminRole: string) {
    this.assertAdmin(adminRole);
    return this.prisma.adminRequest.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async replyToRequest(adminRole: string, adminId: string, requestId: string, body: { message?: string; attachmentUrl?: string }) {
    this.assertAdmin(adminRole);
    const request = await this.prisma.adminRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');

    const [message] = await Promise.all([
      this.prisma.adminRequestMessage.create({
        data: { requestId, senderId: adminId, message: body.message, attachmentUrl: body.attachmentUrl },
        include: { sender: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } } },
      }),
      this.prisma.adminRequest.update({ where: { id: requestId }, data: { status: 'PENDING_USER' } }),
    ]);

    await this.notifications.create(request.userId, {
      title: 'Admin replied to your request',
      message: body.message ?? 'New message from admin.',
      type: 'ADMIN_REPLY',
    });

    return message;
  }

  async closeRequest(adminRole: string, requestId: string) {
    this.assertAdmin(adminRole);
    return this.prisma.adminRequest.update({
      where: { id: requestId },
      data: { status: 'CLOSED' },
    });
  }

  async markUserVerified(adminRole: string, userId: string) {
    this.assertAdmin(adminRole);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
    await this.notifications.create(userId, {
      title: '✅ Account Verified',
      message: 'Your account has been verified by our admin team. You now have a verified badge on your profile.',
      type: 'ACCOUNT_VERIFIED',
    });
    return user;
  }

  async requestMoreDocuments(adminRole: string, docId: string, message: string) {
    this.assertAdmin(adminRole);
    const doc = await this.prisma.verificationDocument.update({
      where: { id: docId },
      data: { status: 'PENDING', rejectionReason: message, requiresMoreDocs: true },
      include: { landlord: { select: { email: true, firstName: true } } },
    });
    await this.notifications.create(doc.landlordId, {
      title: '📋 More Documents Required',
      message,
      type: 'VERIFICATION_MORE_DOCS',
      linkUrl: '/verify',
    });
    await this.email.sendMoreDocsEmail(doc.landlord.email, doc.landlord.firstName, message);
    return doc;
  }

  async broadcast(
    adminRole: string,
    adminId: string,
    subject: string,
    message: string,
    targetType: 'ALL' | 'ROLE' | 'USERS' = 'ALL',
    targetRole?: string,
    targetUserIds?: string[],
  ) {
    this.assertAdmin(adminRole);

    // Build recipient list — only verified, active, non-admin accounts
    const where: any = {
      isBlocked: false,
      deletedAt: null,
      emailVerified: true,
      role: { not: 'ADMIN' },
    };
    if (targetType === 'ROLE' && targetRole) where.role = targetRole;
    if (targetType === 'USERS' && targetUserIds?.length) {
      where.id = { in: targetUserIds };
      delete where.role; // allow any role when targeting by ID
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true, email: true, firstName: true },
    });

    let sentCount = 0;
    let failCount = 0;

    // Send sequentially with a small gap to respect Resend rate limits
    for (const u of users) {
      await this.notifications.create(u.id, { title: subject, message, type: 'BROADCAST' });
      const result = await this.email.sendBroadcastEmail(u.email, u.firstName, subject, message);
      if (result.ok) {
        sentCount++;
      } else {
        failCount++;
        this.logger.warn(`Broadcast email failed for ${u.email}: ${result.error}`);
      }
      // 200ms gap — stays well within Resend's rate limits
      await new Promise((r) => setTimeout(r, 200));
    }

    const targetMeta = targetType === 'ROLE' ? targetRole
      : targetType === 'USERS' ? (targetUserIds ?? []).join(',')
      : undefined;

    await this.prisma.broadcastLog.create({
      data: { subject, message, sentBy: adminId, targetType, targetMeta, sentCount, failCount },
    });

    return { sent: sentCount, failed: failCount, total: users.length };
  }

  async getBroadcastHistory(adminRole: string) {
    this.assertAdmin(adminRole);
    return this.prisma.broadcastLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async pushVerificationReminder(adminRole: string, userId: string) {
    this.assertAdmin(adminRole);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.notifications.create(userId, {
      title: '⚠️ Verification Required',
      message: 'Your account needs to be verified. Please submit your documents to unlock full platform features.',
      type: 'VERIFICATION_REMINDER',
      linkUrl: '/verify',
    });
    return { success: true };
  }

  async deleteUser(adminRole: string, userId: string, reason?: string) {
    this.assertAdmin(adminRole);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') throw new ForbiddenException('Cannot delete admin accounts');

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isBlocked: true },
    });

    const title = 'Account Deleted';
    const message = reason
      ? `Your House9ja account has been permanently deleted. Reason: ${reason}`
      : 'Your House9ja account has been permanently deleted due to a violation of our Terms & Conditions. Contact support if you believe this is an error.';

    await this.email.sendNotificationEmail(user.email, user.firstName, title, message);
    return { success: true };
  }

  async sendMessageToUser(adminRole: string, adminId: string, userId: string, message: string) {
    this.assertAdmin(adminRole);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let request = await this.prisma.adminRequest.findFirst({
      where: { adminId, userId, status: { not: 'CLOSED' } },
      orderBy: { updatedAt: 'desc' },
    });

    if (!request) {
      request = await this.prisma.adminRequest.create({
        data: { adminId, userId, type: 'GENERAL', subject: 'Message from Admin', status: 'PENDING_USER' },
      });
    }

    const msg = await this.prisma.adminRequestMessage.create({
      data: { requestId: request.id, senderId: adminId, message },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } } },
    });

    await this.prisma.adminRequest.update({ where: { id: request.id }, data: { status: 'PENDING_USER', updatedAt: new Date() } });

    await this.notifications.create(userId, {
      title: 'New message from Admin',
      message,
      type: 'ADMIN_MESSAGE',
    });

    return msg;
  }
}
