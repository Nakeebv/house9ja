import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Neon serverless databases pause after inactivity and need a few seconds
    // to wake up. Retry the initial connection up to 5 times with backoff.
    const maxAttempts = 5;
    let delay = 2000;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connection established');
        return;
      } catch (err: any) {
        if (attempt === maxAttempts) throw err;
        this.logger.warn(
          `Database not ready (attempt ${attempt}/${maxAttempts}). Retrying in ${delay / 1000}s… (Neon cold start)`,
        );
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2, 10000);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
