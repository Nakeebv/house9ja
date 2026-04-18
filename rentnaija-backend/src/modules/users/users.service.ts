import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, isVerified: true, isVerifiedLandlord: true, avatarUrl: true, createdAt: true } });
    if (!user) throw new NotFoundException();
    return user;
  }
  async updateProfile(id: string, data: any) {
    return this.prisma.user.update({ where: { id }, data, select: { id: true, email: true, phone: true, firstName: true, lastName: true, avatarUrl: true } });
  }
}