import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AgreementsService {
  constructor(private prisma: PrismaService) {}

  async create(landlordId: string, data: {
    propertyId: string;
    tenantId: string;
    rentAmount: number;
    duration: string;
    terms: string;
  }) {
    const property = await this.prisma.property.findUnique({ where: { id: data.propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.landlordId !== landlordId) throw new ForbiddenException('Not your listing');

    return this.prisma.agreement.create({
      data: {
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        landlordId,
        rentAmount: data.rentAmount,
        duration: data.duration,
        terms: data.terms,
        status: 'DRAFT',
      },
      include: {
        property: { select: { id: true, title: true, city: true, address: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        landlord: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getForTenant(tenantId: string) {
    return this.prisma.agreement.findMany({
      where: { tenantId },
      include: {
        property: { select: { id: true, title: true, city: true, address: true } },
        landlord: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getForLandlord(landlordId: string) {
    return this.prisma.agreement.findMany({
      where: { landlordId },
      include: {
        property: { select: { id: true, title: true, city: true, address: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, userId: string) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, title: true, city: true, address: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        landlord: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.tenantId !== userId && agreement.landlordId !== userId) throw new ForbiddenException();
    return agreement;
  }

  async sign(id: string, tenantId: string) {
    const agreement = await this.prisma.agreement.findUnique({ where: { id } });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.tenantId !== tenantId) throw new ForbiddenException('Only tenant can sign');
    if (agreement.status !== 'PENDING_TENANT') throw new ForbiddenException('Agreement is not awaiting tenant signature');

    return this.prisma.agreement.update({
      where: { id },
      data: { status: 'SIGNED' },
    });
  }

  async sendToTenant(id: string, landlordId: string) {
    const agreement = await this.prisma.agreement.findUnique({ where: { id } });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.landlordId !== landlordId) throw new ForbiddenException('Not your agreement');
    if (agreement.status !== 'DRAFT') throw new ForbiddenException('Agreement already sent or signed');

    return this.prisma.agreement.update({
      where: { id },
      data: { status: 'PENDING_TENANT' },
    });
  }

  async cancel(id: string, userId: string) {
    const agreement = await this.prisma.agreement.findUnique({ where: { id } });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.landlordId !== userId && agreement.tenantId !== userId) throw new ForbiddenException();

    return this.prisma.agreement.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async getAllForAdmin() {
    return this.prisma.agreement.findMany({
      include: {
        property: { select: { id: true, title: true, city: true } },
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
        landlord: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
