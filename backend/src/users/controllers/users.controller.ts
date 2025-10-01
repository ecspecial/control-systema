import { Controller, Post, Body, Get } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { LoginDto } from '../dto/login.dto';
import { UserRole } from '../entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @Get('contractors')
  async getContractors() {
    return this.usersService.findByRole(UserRole.CONTRACTOR);
  }
}
