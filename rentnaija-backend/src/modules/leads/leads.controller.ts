import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /** POST /leads — tenant creates a lead */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Request() req: any,
    @Body() body: { propertyId: string; message?: string },
  ) {
    return this.leadsService.create(req.user.id, body);
  }

  /** GET /leads/agent/me — agent/landlord fetches their pipeline */
  @Get('agent/me')
  @UseGuards(JwtAuthGuard)
  agentLeads(@Request() req: any) {
    return this.leadsService.getAgentLeads(req.user.id);
  }

  /** GET /leads/tenant/me — tenant checks their submitted leads */
  @Get('tenant/me')
  @UseGuards(JwtAuthGuard)
  tenantLeads(@Request() req: any) {
    return this.leadsService.getTenantLeads(req.user.id);
  }

  /** GET /leads/stats — dashboard metric counts */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  stats(@Request() req: any) {
    return this.leadsService.getAgentStats(req.user.id);
  }

  /** PATCH /leads/:id/status — accept or decline */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { status: 'ACCEPTED' | 'DECLINED' },
  ) {
    return this.leadsService.updateStatus(id, req.user.id, body.status);
  }
}
