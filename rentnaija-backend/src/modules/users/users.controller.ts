import { Controller, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@Controller('users')
export class UsersController {
  constructor(private s: UsersService) {}
  @Get('me') @UseGuards(JwtAuthGuard) profile(@Request() req: any) { return this.s.getProfile(req.user.id); }
  @Patch('me') @UseGuards(JwtAuthGuard) update(@Request() req: any, @Body() body: any) { return this.s.updateProfile(req.user.id, body); }
}