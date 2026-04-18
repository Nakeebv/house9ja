import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  /** Tenant submits a lead for a property */
  async create(tenantId: string, data: { propertyId: string; message?: string }) {
    const property = await this.prisma.property.findUnique({
      where: { id: data.propertyId, deletedAt: null },
    });
    if (!property) throw new NotFoundException('Property not found');

    const existing = await this.prisma.lead.findUnique({
      where: { propertyId_tenantId: { propertyId: data.propertyId, tenantId } },
    });
    if (existing) throw new ConflictException('You already submitted a lead for this property');

    const lead = await this.prisma.lead.create({
      data: {
        propertyId: data.propertyId,
        tenantId,
        agentId: property.landlordId,
        message: data.message,
      },
      include: {
        property: { select: { id: true, title: true, city: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, avatarUrl: true } },
      },
    });

    // Notify agent
    await this.prisma.notification.create({
      data: {
        userId: property.landlordId,
        title: 'New Lead',
        message: `A tenant is interested in "${property.title}".`,
        type: 'LEAD',
        linkUrl: `/landlord/leads`,
      },
    });

    return lead;
  }

  /** Agent/Landlord fetches all leads for their properties */
  async getAgentLeads(agentId: string) {
    return this.prisma.lead.findMany({
      where: { agentId },
      include: {
        property: { select: { id: true, title: true, city: true, images: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Tenant fetches their own leads */
  async getTenantLeads(tenantId: string) {
    return this.prisma.lead.findMany({
      where: { tenantId },
      include: {
        property: { select: { id: true, title: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Agent accepts or declines a lead. On accept, auto-creates a chat thread. */
  async updateStatus(id: string, agentId: string, status: 'ACCEPTED' | 'DECLINED') {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { property: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.agentId !== agentId) throw new ForbiddenException('Not your lead');

    let chatId = lead.chatId;

    if (status === 'ACCEPTED') {
      // Create or retrieve the chat thread
      const chat = await this.prisma.chat.upsert({
        where: {
          propertyId_tenantId_landlordId: {
            propertyId: lead.propertyId,
            tenantId: lead.tenantId,
            landlordId: agentId,
          },
        },
        create: {
          propertyId: lead.propertyId,
          tenantId: lead.tenantId,
          landlordId: agentId,
        },
        update: {},
      });
      chatId = chat.id;

      // Notify tenant
      await this.prisma.notification.create({
        data: {
          userId: lead.tenantId,
          title: 'Lead Accepted',
          message: `Your enquiry for "${lead.property.title}" was accepted. You can now chat directly.`,
          type: 'LEAD_ACCEPTED',
          linkUrl: `/chat`,
        },
      });
    }

    return this.prisma.lead.update({
      where: { id },
      data: { status, chatId },
      include: {
        property: { select: { id: true, title: true, city: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, avatarUrl: true } },
      },
    });
  }

  /** Summary counts for the dashboard */
  async getAgentStats(agentId: string) {
    const [totalListings, pendingLeads, acceptedLeads, pendingTours, approvedTours] = await Promise.all([
      this.prisma.property.count({ where: { landlordId: agentId, deletedAt: null } }),
      this.prisma.lead.count({ where: { agentId, status: 'PENDING' } }),
      this.prisma.lead.count({ where: { agentId, status: 'ACCEPTED' } }),
      this.prisma.booking.count({ where: { landlordId: agentId, status: 'PENDING' } }),
      this.prisma.booking.count({ where: { landlordId: agentId, status: 'APPROVED' } }),
    ]);

    return {
      totalListings,
      pendingLeads,
      acceptedLeads,
      activeLeads: pendingLeads + acceptedLeads,
      pendingTours,
      approvedTours,
    };
  }
}
