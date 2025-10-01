import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LaboratorySample } from './entities/laboratory-sample.entity';
import { LaboratorySamplesController } from './controllers/laboratory-samples.controller';
import { LaboratorySamplesService } from './services/laboratory-samples.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LaboratorySample])
  ],
  controllers: [LaboratorySamplesController],
  providers: [LaboratorySamplesService],
  exports: [LaboratorySamplesService]
})
export class LaboratorySamplesModule {}
