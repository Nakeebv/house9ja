import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateInquiryDto {
  fullName: string;
  phone: string;
  preferredArea: string;
  budgetRange: string;
  preferredDate: string;
  description?: string;
}

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInquiryDto) {
    return this.prisma.inquiry.create({ data });
  }

  async findAll() {
    return this.prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
