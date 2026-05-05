import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { User } from '../db/schema';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Register ────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const [byEmail, byUsername] = await Promise.all([
      this.usersService.findByEmail(dto.email),
      this.usersService.findByUsername(dto.username),
    ]);
    if (byEmail) throw new ConflictException('Email already registered');
    if (byUsername) throw new ConflictException('Username already taken');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const verificationToken = uuidv4();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await this.usersService.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: expiry,
    });

    await this.emailService.sendVerificationEmail(dto.email, verificationToken);
    return {
      message:
        'Registration successful. Check your email to verify your account.',
    };
  }

  // ─── Verify Email ─────────────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmailVerificationToken(token);

    if (
      !user ||
      !user.emailVerificationExpiry ||
      new Date() > user.emailVerificationExpiry
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersService.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpiry: undefined,
    });
    return { message: 'Email verified successfully.' };
  }

  // ─── Login ────────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<{
    requiresTwoFactor?: boolean;
    preAuthToken?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: SafeUser;
  }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    if (user.twoFactorEnabled) {
      const preAuthToken = this.signPreAuth(user);
      return { requiresTwoFactor: true, preAuthToken };
    }

    const { accessToken, refreshToken } = await this.issueTokens(user);
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);
    return { accessToken, refreshToken, user: toSafeUser(user) };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────────

  async refresh(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.issueTokens(user);
  }

  // ─── Logout ───────────────────────────────────────────────────────────────────

  async logout(userId: string): Promise<{ message: string }> {
    await this.usersService.update(userId, {
      refreshTokenHash: undefined,
      refreshTokenExpiry: undefined,
    });
    return { message: 'Logged out successfully.' };
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    // Always return success to prevent email enumeration
    if (!user)
      return {
        message: 'If that email is registered, a reset link has been sent.',
      };

    const token = uuidv4();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await this.usersService.update(user.id, {
      passwordResetToken: token,
      passwordResetExpiry: expiry,
    });
    await this.emailService.sendPasswordResetEmail(user.email, token);
    return {
      message: 'If that email is registered, a reset link has been sent.',
    };
  }

  // ─── Reset Password ───────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByPasswordResetToken(dto.token);

    if (
      !user ||
      !user.passwordResetExpiry ||
      new Date() > user.passwordResetExpiry
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    await this.usersService.update(user.id, {
      passwordHash,
      passwordResetToken: undefined,
      passwordResetExpiry: undefined,
      // Invalidate existing refresh tokens on password reset
      refreshTokenHash: undefined,
      refreshTokenExpiry: undefined,
    });
    return { message: 'Password reset successfully.' };
  }

  // ─── Token helpers ────────────────────────────────────────────────────────────

  private signPreAuth(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, preAuth: true },
      {
        secret: this.config.getOrThrow('PRE_AUTH_SECRET'),
        expiresIn: this.config.get('PRE_AUTH_EXPIRES_IN', '15m'),
      },
    );
  }

  async issueTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    const refreshExpiry = new Date(
      Date.now() +
        parseDuration(this.config.get('JWT_REFRESH_EXPIRES_IN', '7d')),
    );

    await this.usersService.update(user.id, {
      refreshTokenHash,
      refreshTokenExpiry: refreshExpiry,
    });

    return { accessToken, refreshToken };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export interface SafeUser {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null | undefined;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt,
  };
}

function parseDuration(str: string): number {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const val = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return val * multipliers[unit];
}
