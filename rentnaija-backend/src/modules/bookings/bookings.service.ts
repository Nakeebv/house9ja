import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}
  async create(tenantId: string, data: { propertyId: string; date: string; time: string }) {
    const property = await this.prisma.property.findUnique({ where: { id: data.propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    return this.prisma.booking.create({
      data: { ...data, tenantId, landlordId: property.landlordId },
      include: { property: { select: { id: true, title: true, city: true } } },
    });
  }
  async getTenantBookings(tenantId: string) {
    return this.prisma.booking.findMany({
      where: { tenantId },
      include: { property: { select: { id: true, title: true, city: true, address: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async getLandlordBookings(landlordId: string) {
    return this.prisma.booking.findMany({
      where: { landlordId },
      include: { property: { select: { id: true, title: true } }, tenant: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async updateStatus(id: string, userId: string, status: 'APPROVED' | 'REJECTED' | 'RESCHEDULED', newDate?: string, newTime?: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.landlordId !== userId) throw new ForbiddenException('Only landlord can update');
    return this.prisma.booking.update({ where: { id }, data: { status, ...(newDate ? { date: newDate } : {}), ...(newTime ? { time: newTime } : {}) } });
  }
}