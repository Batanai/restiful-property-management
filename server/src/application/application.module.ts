import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { authMiddleware } from '../common/middleware/authMiddleware';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService, PrismaService],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // POST /applications - tenant only
    consumer
      .apply(authMiddleware(['tenant']))
      .forRoutes({ path: 'applications', method: RequestMethod.POST });

    // PUT /applications/:id/status - manager only
    consumer
      .apply(authMiddleware(['manager']))
      .forRoutes({ path: 'applications/:id/status', method: RequestMethod.PUT });

    // GET /applications - both tenant and manager
    consumer
      .apply(authMiddleware(['tenant', 'manager']))
      .forRoutes({ path: 'applications', method: RequestMethod.GET });
  }
}
