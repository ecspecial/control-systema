import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { JwtServiceCustom } from '@shared/modules/jwt/jwt.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtServiceCustom,
  ) {}

  async findByLogin(login: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { login } });
  }

  async login(loginDto: LoginDto) {
    const user = await this.findByLogin(loginDto.login);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.jwtService.generateTokens({
      id: user.id,
      login: user.login,
      role: user.role,
    });

    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        role: user.role,
      },
    };
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { 
        role,
        isActive: true 
      },
      select: ['id', 'firstName', 'lastName', 'middleName', 'organization']
    });
  }
}

