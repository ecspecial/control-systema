import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { JwtModuleCustom } from '@shared/modules/jwt/jwt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModuleCustom,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
