import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}
  async toggle(userId: string, propertyId: string) {
    const existing = await this.prisma.favorite.findUnique({ where: { userId_propertyId: { userId, propertyId } } });
    if (existing) { await this.prisma.favorite.delete({ where: { userId_propertyId: { userId, propertyId } } }); return { action: 'removed', saved: false }; }
    await this.prisma.favorite.create({ data: { userId, propertyId } });
    return { action: 'added', saved: true };
  }
  async getUserFavorites(userId: string) {
    return this.prisma.favorite.findMany({ where: { userId }, include: { property: { include: { landlord: { select: { id: true, firstName: true, lastName: true, phone: true } } } } }, orderBy: { createdAt: 'desc' } });
  }
  async check(userId: string, propertyId: string) {
    const fav = await this.prisma.favorite.findUnique({ where: { userId_propertyId: { userId, propertyId } } });
    return { saved: !!fav };
  }
}