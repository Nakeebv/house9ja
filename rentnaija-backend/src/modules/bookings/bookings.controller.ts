import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@Controller('bookings')
export class BookingsController {
  constructor(private s: BookingsService) {}
  @Post() @UseGuards(JwtAuthGuard) create(@Request() req: any, @Body() body: { propertyId: string; date: string; time: string }) { return this.s.create(req.user.id, body); }
  @Get('tenant/me') @UseGuards(JwtAuthGuard) tenantBookings(@Request() req: any) { return this.s.getTenantBookings(req.user.id); }
  @Get('landlord/me') @UseGuards(JwtAuthGuard) landlordBookings(@Request() req: any) { return this.s.getLandlordBookings(req.user.id); }
  /** Alias so agents use the same endpoint (they are the landlordId on their properties) */
  @Get('agent/me') @UseGuards(JwtAuthGuard) agentBookings(@Request() req: any) { return this.s.getLandlordBookings(req.user.id); }
  @Patch(':id/status') @UseGuards(JwtAuthGuard) status(@Param('id') id: string, @Request() req: any, @Body() b: { status: any; date?: string; time?: string }) { return this.s.updateStatus(id, req.user.id, b.status, b.date, b.time); }
}