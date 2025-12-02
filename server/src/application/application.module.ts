import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { authMiddleware } from '../common/middleware/authMiddleware';

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // POST /application - tenant only
    consumer
      .apply(authMiddleware(['tenant']))
      .forRoutes({ path: 'application', method: RequestMethod.POST });

    // PUT /application/:id/status - manager only
    consumer
      .apply(authMiddleware(['manager']))
      .forRoutes({ path: 'application/:id/status', method: RequestMethod.PUT });

    // GET /application - both tenant and manager
    consumer
      .apply(authMiddleware(['tenant', 'manager']))
      .forRoutes({ path: 'application', method: RequestMethod.GET });
  }
}
