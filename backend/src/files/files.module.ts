import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FilesService } from './services/files.service';
import { FilesController } from './controllers/files.controller';
import { ConfigModule } from '@nestjs/config';
import { ObjectsModule } from '../objects/objects.module';

@Module({
  imports: [
    ConfigModule,
    ObjectsModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService]
})
export class FilesModule {}
