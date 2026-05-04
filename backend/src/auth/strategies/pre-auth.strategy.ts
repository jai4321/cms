import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface PreAuthPayload {
  sub: string;
  email: string;
  preAuth: true;
}

@Injectable()
export class PreAuthStrategy extends PassportStrategy(Strategy, 'pre-auth') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('PRE_AUTH_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: PreAuthPayload) {
    if (!payload.preAuth) throw new UnauthorizedException();
    return { id: payload.sub, email: payload.email };
  }
}
