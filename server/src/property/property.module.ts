import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { authMiddleware } from '../common/middleware/authMiddleware';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [PropertyController],
  providers: [PropertyService, PrismaService],
  exports: [PropertyService],
})
export class PropertyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authMiddleware(['manager']))
      .forRoutes({ path: 'properties', method: RequestMethod.POST });
  }
}
