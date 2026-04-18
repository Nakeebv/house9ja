import { Controller, Get, Patch, Param, Request, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@Controller('notifications')
export class NotificationsController {
  constructor(private s: NotificationsService) {}
  @Get('me') @UseGuards(JwtAuthGuard) mine(@Request() req: any) { return this.s.getForUser(req.user.id); }
  @Patch(':id/read') @UseGuards(JwtAuthGuard) read(@Param('id') id: string, @Request() req: any) { return this.s.markRead(id, req.user.id); }
  @Patch('mark-all-read') @UseGuards(JwtAuthGuard) readAll(@Request() req: any) { return this.s.markAllRead(req.user.id); }
}