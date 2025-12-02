import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { authMiddleware } from '../common/middleware/authMiddleware';

@Module({
  controllers: [PropertyController],
  providers: [PropertyService],
  exports: [PropertyService],
})
export class PropertyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authMiddleware(['manager']))
      .forRoutes({ path: 'property', method: RequestMethod.POST });
  }
}
