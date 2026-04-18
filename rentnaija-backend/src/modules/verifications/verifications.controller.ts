import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { VerificationsService } from './verifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('verifications')
export class VerificationsController {
  constructor(private readonly s: VerificationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  submit(
    @Request() req: any,
    @Body() body: {
      governmentIdUrl: string;
      backOfIdUrl?: string;
      selfieWithIdUrl?: string;
      proofOfOwnershipUrl?: string;
      utilityBillUrl?: string;
    },
  ) {
    return this.s.submit(req.user.id, body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  myStatus(@Request() req: any) {
    return this.s.getMyStatus(req.user.id);
  }
}
