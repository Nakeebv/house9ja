import { Controller, Get, Post, Param, Request, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@Controller('favorites')
export class FavoritesController {
  constructor(private s: FavoritesService) {}
  @Post(':propertyId') @UseGuards(JwtAuthGuard) toggle(@Param('propertyId') pid: string, @Request() req: any) { return this.s.toggle(req.user.id, pid); }
  @Get('me') @UseGuards(JwtAuthGuard) mine(@Request() req: any) { return this.s.getUserFavorites(req.user.id); }
  @Get(':propertyId/check') @UseGuards(JwtAuthGuard) check(@Param('propertyId') pid: string, @Request() req: any) { return this.s.check(req.user.id, pid); }
}