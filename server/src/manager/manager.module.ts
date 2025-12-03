import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { authMiddleware } from '../common/middleware/authMiddleware';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [ManagerController],
  providers: [ManagerService, PrismaService]
})
export class ManagerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply auth middleware only to protected routes
    // GET /:cognitoId and POST / are public for user creation/fetching
    consumer
      .apply(authMiddleware(['manager']))
      .exclude(
        { path: 'managers/:cognitoId', method: RequestMethod.GET },
        { path: 'managers', method: RequestMethod.POST },
      )
      .forRoutes(ManagerController);
  }
}
