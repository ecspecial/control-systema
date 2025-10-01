import { Module } from '@nestjs/common';
import { TypeormModule } from '@infra/typeorm/typeorm.module';
import { ObjectsModule } from './objects/objects.module';
import { UsersModule } from './users/users.module';
import { JwtModuleCustom } from '@shared/modules/jwt/jwt.module';
import { FilesModule } from './files/files.module';
import { ElectronicJournalModule } from './electronic-journal/electronic-journal.module';
import { LaboratorySamplesModule } from './laboratory-samples/laboratory-samples.module';

@Module({
  imports: [
    TypeormModule,
    JwtModuleCustom,
    ObjectsModule,
    UsersModule,
    FilesModule,
    ElectronicJournalModule,
    LaboratorySamplesModule
  ],
})
export class AppModule {}
