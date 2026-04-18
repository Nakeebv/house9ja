import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) { }

  async search(params: {
    query?: string; location?: string; type?: string;
    minPrice?: number; maxPrice?: number; bedrooms?: number;
    latitude?: number; longitude?: number; radiusKm?: number;
    state?: string; city?: string;
    page?: number; limit?: number;
  }) {
    const { query, location, type, minPrice, maxPrice, bedrooms, state, city, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      isAvailable: true,
      isFlagged: false,
      isVerified: true,
      ...(type ? { propertyType: type.toUpperCase() as any } : {}),
      ...(minPrice || maxPrice ? { monthlyRent: { gte: minPrice, lte: maxPrice } } : {}),
      ...(bedrooms ? { bedrooms: { gte: bedrooms } } : {}),
      ...(state ? { state: { contains: state, mode: Prisma.QueryMode.insensitive } } : {}),
      ...(city ? { city: { contains: city, mode: Prisma.QueryMode.insensitive } } : {}),

      ...(query || location ? {
        OR: [
          query ? { title: { contains: query, mode: Prisma.QueryMode.insensitive } } : null,
          query ? { description: { contains: query, mode: Prisma.QueryMode.insensitive } } : null,
          location ? { city: { contains: location, mode: Prisma.QueryMode.insensitive } } : null,
          location ? { state: { contains: location, mode: Prisma.QueryMode.insensitive } } : null,
          location ? { area: { contains: location, mode: Prisma.QueryMode.insensitive } } : null,
          location ? { address: { contains: location, mode: Prisma.QueryMode.insensitive } } : null,
        ].filter(Boolean) as Prisma.PropertyWhereInput[],
      } : {}),
    };

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          landlord: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              isVerified: true,
              isVerifiedLandlord: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      properties,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, isAuthenticated = false) {
    const property = await this.prisma.property.findUnique({
      where: { id, deletedAt: null },
      include: {
        landlord: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: isAuthenticated,
            email: isAuthenticated,
            isVerified: true,
            isVerifiedLandlord: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!property) throw new NotFoundException('Property not found');

    await this.prisma.property.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return property;
  }

  async findByLandlord(landlordId: string) {
    return this.prisma.property.findMany({
      where: { landlordId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(landlordId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: landlordId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.isVerified) {
      throw new ForbiddenException('Your account must be verified before you can post listings. Please submit your verification documents.');
    }

    return this.prisma.property.create({
      data: {
        ...data,
        landlordId,
        propertyType: data.propertyType?.toUpperCase(),
        furnishing: data.furnishing?.toUpperCase() ?? 'UNFURNISHED',
      },
    });
  }

  async update(id: string, userId: string, data: any) {
    const prop = await this.prisma.property.findUnique({ where: { id } });
    if (!prop) throw new NotFoundException('Property not found');
    if (prop.landlordId !== userId) throw new ForbiddenException('Not your listing');

    return this.prisma.property.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    const prop = await this.prisma.property.findUnique({ where: { id } });
    if (!prop) throw new NotFoundException('Property not found');
    if (prop.landlordId !== userId && prop.agentId !== userId) throw new ForbiddenException('Not your listing');

    return this.prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async markRented(id: string, userId: string, userRole: string) {
    if (userRole !== 'LANDLORD' && userRole !== 'AGENT') {
      throw new ForbiddenException('Only landlords and agents can mark a property as rented');
    }
    const prop = await this.prisma.property.findUnique({ where: { id } });
    if (!prop) throw new NotFoundException('Property not found');
    if (prop.landlordId !== userId && prop.agentId !== userId) {
      throw new ForbiddenException('Not your listing');
    }
    return this.prisma.property.update({ where: { id }, data: { isAvailable: false } });
  }

  async markAvailable(id: string, userId: string, userRole: string) {
    if (userRole !== 'LANDLORD' && userRole !== 'AGENT') {
      throw new ForbiddenException('Only landlords and agents can update availability');
    }
    const prop = await this.prisma.property.findUnique({ where: { id } });
    if (!prop) throw new NotFoundException('Property not found');
    if (prop.landlordId !== userId && prop.agentId !== userId) {
      throw new ForbiddenException('Not your listing');
    }
    return this.prisma.property.update({ where: { id }, data: { isAvailable: true } });
  }
}