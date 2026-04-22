import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { SignOptions } from 'jsonwebtoken';
import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from '../common/errors/app-errors';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.userService.findByLogin(dto.login);
    if (existing) {
      throw new ValidationError(`Login "${dto.login}" is already taken`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.createWithHash(dto.login, passwordHash);

    return { id: user.id, login: user.login, role: user.role };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByLogin(dto.login);
    if (!user) {
      throw new ForbiddenError('Invalid login or password');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new ForbiddenError('Invalid login or password');
    }

    return this.generateTokens({
      userId: user.id,
      login: user.login,
      role: user.role,
    });
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new ForbiddenError('Refresh token is invalid or expired');
    }

    return this.generateTokens({
      userId: payload.userId,
      login: payload.login,
      role: payload.role,
    });
  }

  private generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: (process.env.JWT_ACCESS_TTL ??
        '15m') as SignOptions['expiresIn'],
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: (process.env.JWT_REFRESH_TTL ??
        '7d') as SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }
}
