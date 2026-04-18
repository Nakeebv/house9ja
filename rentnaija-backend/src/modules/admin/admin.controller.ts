import { Controller, Get, Post, Patch, Delete, Param, Query, Request, UseGuards, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { InquiriesService } from '../inquiries/inquiries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
export class AdminController {
  constructor(private s: AdminService, private inquiriesService: InquiriesService) {}

  @Get('overview')   @UseGuards(JwtAuthGuard) overview(@Request() req: any) { return this.s.getOverview(req.user.role); }

  @Get('users') @UseGuards(JwtAuthGuard)
  users(@Request() req: any, @Query() q: any) {
    return this.s.getUsers(req.user.role, {
      roleFilter: q.role,
      status: q.status,
      search: q.search,
      page: q.page ? Number(q.page) : 1,
    });
  }

  @Delete('users/:id') @UseGuards(JwtAuthGuard)
  deleteUser(@Request() req: any, @Param('id') id: string, @Body() b: { reason?: string }) {
    return this.s.deleteUser(req.user.role, id, b.reason);
  }

  @Patch('users/:id/suspend')   @UseGuards(JwtAuthGuard) suspend(@Request() req: any, @Param('id') id: string) { return this.s.suspendUser(req.user.role, id); }
  @Patch('users/:id/unsuspend') @UseGuards(JwtAuthGuard) unsuspend(@Request() req: any, @Param('id') id: string) { return this.s.unsuspendUser(req.user.role, id); }

  @Get('properties') @UseGuards(JwtAuthGuard) properties(@Request() req: any, @Query() q: any) { return this.s.getProperties(req.user.role, { page: q.page ? Number(q.page) : 1 }); }
  @Patch('properties/:id/approve') @UseGuards(JwtAuthGuard) approve(@Request() req: any, @Param('id') id: string) { return this.s.approveProperty(req.user.role, id); }
  @Patch('properties/:id/reject')  @UseGuards(JwtAuthGuard) reject(@Request() req: any, @Param('id') id: string) { return this.s.rejectProperty(req.user.role, id); }

  @Get('verifications') @UseGuards(JwtAuthGuard) verifications(@Request() req: any) { return this.s.getVerifications(req.user.role); }
  @Patch('verifications/:id/status') @UseGuards(JwtAuthGuard)
  verificationStatus(@Request() req: any, @Param('id') id: string, @Body() b: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) {
    return this.s.updateVerification(req.user.role, id, b);
  }

  @Get('reports')    @UseGuards(JwtAuthGuard) reports(@Request() req: any) { return this.s.getReports(req.user.role); }
  @Patch('reports/:id/resolve')  @UseGuards(JwtAuthGuard) resolveReport(@Request() req: any, @Param('id') id: string) { return this.s.resolveReport(req.user.role, id); }
  @Patch('reports/:id/dismiss')  @UseGuards(JwtAuthGuard) dismissReport(@Request() req: any, @Param('id') id: string) { return this.s.dismissReport(req.user.role, id); }

  @Get('requests')   @UseGuards(JwtAuthGuard) getRequests(@Request() req: any) { return this.s.getRequests(req.user.role); }
  @Post('requests/:id/reply') @UseGuards(JwtAuthGuard)
  replyToRequest(@Request() req: any, @Param('id') id: string, @Body() b: { message?: string; attachmentUrl?: string }) {
    return this.s.replyToRequest(req.user.role, req.user.id, id, b);
  }
  @Patch('requests/:id/close') @UseGuards(JwtAuthGuard) closeRequest(@Request() req: any, @Param('id') id: string) { return this.s.closeRequest(req.user.role, id); }

  @Post('users/:id/push-verification') @UseGuards(JwtAuthGuard)
  pushVerification(@Request() req: any, @Param('id') id: string) { return this.s.pushVerificationReminder(req.user.role, id); }

  @Patch('users/:id/verify') @UseGuards(JwtAuthGuard)
  markVerified(@Request() req: any, @Param('id') id: string) { return this.s.markUserVerified(req.user.role, id); }

  @Post('users/:id/message') @UseGuards(JwtAuthGuard)
  messageUser(@Request() req: any, @Param('id') id: string, @Body() b: { message: string }) {
    return this.s.sendMessageToUser(req.user.role, req.user.id, id, b.message);
  }

  @Post('verifications/:id/request-docs') @UseGuards(JwtAuthGuard)
  requestMoreDocs(@Request() req: any, @Param('id') id: string, @Body() b: { message: string }) {
    return this.s.requestMoreDocuments(req.user.role, id, b.message);
  }

  @Get('inquiries')  @UseGuards(JwtAuthGuard) inquiries(@Request() req: any) { this.s.assertAdmin(req.user.role); return this.inquiriesService.findAll(); }

  @Post('broadcast') @UseGuards(JwtAuthGuard)
  broadcast(
    @Request() req: any,
    @Body() b: { subject: string; message: string; targetType?: 'ALL' | 'ROLE' | 'USERS'; targetRole?: string; targetUserIds?: string[] },
  ) {
    return this.s.broadcast(req.user.role, req.user.id, b.subject, b.message, b.targetType, b.targetRole, b.targetUserIds);
  }

  @Get('broadcast/history') @UseGuards(JwtAuthGuard)
  broadcastHistory(@Request() req: any) {
    return this.s.getBroadcastHistory(req.user.role);
  }
}
