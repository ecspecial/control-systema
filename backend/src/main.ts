import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  app.enableCors();
  
  await app.listen(4000, '0.0.0.0');
}
bootstrap();
