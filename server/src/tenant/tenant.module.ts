import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { authMiddleware } from '../common/middleware/authMiddleware';

@Module({
  controllers: [TenantController],
  providers: [TenantService]
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authMiddleware(['tenant']))
      .forRoutes(TenantController);
  }
}
