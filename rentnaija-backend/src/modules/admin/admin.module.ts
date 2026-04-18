import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminRequestController } from './admin-request.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { InquiriesModule } from '../inquiries/inquiries.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, InquiriesModule, NotificationsModule],
  controllers: [AdminController, AdminRequestController],
  providers: [AdminService],
})
export class AdminModule {}
