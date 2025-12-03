import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { authMiddleware } from '../common/middleware/authMiddleware';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [TenantController],
  providers: [TenantService, PrismaService]
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply auth middleware only to protected routes
    // GET /:cognitoId and POST / are public for user creation/fetching
    consumer
      .apply(authMiddleware(['tenant']))
      .exclude(
        { path: 'tenants/:cognitoId', method: RequestMethod.GET },
        { path: 'tenants', method: RequestMethod.POST },
      )
      .forRoutes(TenantController);
  }
}
