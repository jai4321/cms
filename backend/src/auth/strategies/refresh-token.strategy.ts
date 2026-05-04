import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import * as bcrypt from 'bcrypt';

export interface RefreshPayload {
  sub: string;
  email: string;
  refresh: true;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: RefreshPayload) {
    if (!payload.refresh) throw new UnauthorizedException();
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiry) {
      throw new UnauthorizedException();
    }
    if (new Date() > user.refreshTokenExpiry) throw new UnauthorizedException('Refresh token expired');

    const token: string = req.body?.refreshToken;
    const valid = await bcrypt.compare(token, user.refreshTokenHash);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');
    return user;
  }
}
