import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VerificationsService {
  constructor(private prisma: PrismaService) {}

  async submit(userId: string, data: {
    governmentIdUrl: string;
    backOfIdUrl?: string;
    selfieWithIdUrl?: string;
    proofOfOwnershipUrl?: string;
    utilityBillUrl?: string;
  }) {
    const existing = await this.prisma.verificationDocument.findUnique({ where: { landlordId: userId } });
    if (existing && existing.status === 'APPROVED') {
      throw new ConflictException('Verification already approved');
    }

    const payload = {
      governmentIdUrl: data.governmentIdUrl,
      backOfIdUrl: data.backOfIdUrl ?? null,
      selfieWithIdUrl: data.selfieWithIdUrl ?? null,
      proofOfOwnershipUrl: data.proofOfOwnershipUrl ?? null,
      utilityBillUrl: data.utilityBillUrl ?? null,
      status: 'PENDING' as const,
      rejectionReason: null,
      requiresMoreDocs: false,
    };

    if (existing) {
      return this.prisma.verificationDocument.update({ where: { landlordId: userId }, data: payload });
    }

    return this.prisma.verificationDocument.create({ data: { landlordId: userId, ...payload } });
  }

  async getMyStatus(userId: string) {
    const doc = await this.prisma.verificationDocument.findUnique({ where: { landlordId: userId } });
    if (!doc) return { submitted: false, status: null, doc: null };
    return { submitted: true, status: doc.status, rejectionReason: doc.rejectionReason, doc };
  }
}
