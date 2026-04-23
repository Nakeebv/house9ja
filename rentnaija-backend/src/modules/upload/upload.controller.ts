import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

@UseGuards(ThrottlerGuard, JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('sign')
  sign(@Body() body: { folder?: string }) {
    return this.uploadService.sign(body.folder ?? 'properties');
  }
}
