import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AgreementsService } from './agreements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('agreements')
export class AgreementsController {
  constructor(private readonly s: AgreementsService) {}

  /** Landlord creates a draft agreement */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Request() req: any,
    @Body() body: { propertyId: string; tenantId: string; rentAmount: number; duration: string; terms: string },
  ) {
    return this.s.create(req.user.id, body);
  }

  /** Tenant: list my agreements */
  @Get('tenant/me')
  @UseGuards(JwtAuthGuard)
  tenantAgreements(@Request() req: any) {
    return this.s.getForTenant(req.user.id);
  }

  /** Landlord: list my agreements */
  @Get('landlord/me')
  @UseGuards(JwtAuthGuard)
  landlordAgreements(@Request() req: any) {
    return this.s.getForLandlord(req.user.id);
  }

  /** Admin: all agreements */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  adminAll(@Request() req: any) {
    if (req.user.role !== 'ADMIN') return { error: 'Forbidden' };
    return this.s.getAllForAdmin();
  }

  /** Get single agreement */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id') id: string, @Request() req: any) {
    return this.s.getById(id, req.user.id);
  }

  /** Landlord sends agreement to tenant for signing */
  @Patch(':id/send')
  @UseGuards(JwtAuthGuard)
  send(@Param('id') id: string, @Request() req: any) {
    return this.s.sendToTenant(id, req.user.id);
  }

  /** Tenant signs agreement */
  @Patch(':id/sign')
  @UseGuards(JwtAuthGuard)
  sign(@Param('id') id: string, @Request() req: any) {
    return this.s.sign(id, req.user.id);
  }

  /** Cancel agreement */
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.s.cancel(id, req.user.id);
  }
}
