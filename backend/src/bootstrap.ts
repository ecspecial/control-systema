import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { cfg } from '@infra/config';

export async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: cfg.app.nodeEnv === 'development' }),
  );

  app.setGlobalPrefix('api')
    .useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    )
    .enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    });

  const documentationConfig = new DocumentBuilder()
    .setTitle('City Service API')
    .setDescription('API Documentation')
    .setVersion('1.0.0')
    .build();

  const documentation = SwaggerModule.createDocument(app, documentationConfig);
  SwaggerModule.setup('/api/docs', app, documentation);

  await app.listen(cfg.app.port, '0.0.0.0');
}
