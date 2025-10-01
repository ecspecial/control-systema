import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectsController } from './controllers/objects.controller';
import { ObjectsService } from './services/objects.service';
import { ObjectsRepository } from './repositories/objects.repository';
import { CityObject } from './entities/city-object.entity';
import { ElectronicJournalModule } from '../electronic-journal/electronic-journal.module';
import { ElectronicJournalService } from '@modules/electronic-journal/services/electronic-journal.service';
import { CreateViolationDto } from '@modules/electronic-journal/dto/create-violation.dto';
import { TTNEntry } from './entities/ttn-entry.entity';
import { TTNService } from './services/ttn.service';
import { TTNController } from './controllers/ttn.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CityObject, TTNEntry]),
    ElectronicJournalModule
  ],
  controllers: [ObjectsController, TTNController],
  providers: [ObjectsService, ObjectsRepository, TTNService],
  exports: [ObjectsService, TTNService]
})
export class ObjectsModule {}