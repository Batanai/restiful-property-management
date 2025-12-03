import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { LeaseController } from './lease.controller';
import { LeaseService } from './lease.service';
import { authMiddleware } from '../common/middleware/authMiddleware';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [LeaseController],
  providers: [LeaseService, PrismaService],
})
export class LeaseModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authMiddleware(['tenant', 'manager']))
      .forRoutes(LeaseController);
  }
}
