import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { authMiddleware } from '../common/middleware/authMiddleware';

@Module({
  controllers: [ManagerController],
  providers: [ManagerService]
})
export class ManagerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authMiddleware(['manager']))
      .forRoutes(ManagerController);
  }
}
