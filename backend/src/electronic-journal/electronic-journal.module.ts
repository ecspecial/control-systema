import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElectronicJournal } from './entities/electronic-journal.entity';
import { Violation } from './entities/violation.entity';
import { ViolationResponse } from './entities/violation-response.entity';
import { ElectronicJournalController } from './controllers/electronic-journal.controller';
import { ElectronicJournalService } from './services/electronic-journal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ElectronicJournal,
      Violation,
      ViolationResponse
    ]),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [ElectronicJournalController],
  providers: [ElectronicJournalService],
  exports: [ElectronicJournalService]
})
export class ElectronicJournalModule {}
