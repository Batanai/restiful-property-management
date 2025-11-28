import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(bodyParser.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  }));
  app.use(bodyParser.urlencoded({
    extended: false,
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  }));
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true
  }));
  await app.listen(process.env.PORT ?? 3300);
}
bootstrap();
