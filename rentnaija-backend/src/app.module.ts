import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './modules/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { ChatModule } from './modules/chat/chat.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AgreementsModule } from './modules/agreements/agreements.module';
import { VerificationsModule } from './modules/verifications/verifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { LeadsModule } from './modules/leads/leads.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    EmailModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    ChatModule,
    BookingsModule,
    FavoritesModule,
    NotificationsModule,
    AgreementsModule,
    VerificationsModule,
    AdminModule,
    HealthModule,
    InquiriesModule,
    LeadsModule,
    UploadModule,
  ],
})
export class AppModule {}
