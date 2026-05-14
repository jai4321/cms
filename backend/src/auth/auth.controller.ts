import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PreAuthGuard } from '../common/guards/pre-auth.guard';
import { RefreshTokenGuard } from '../common/guards/refresh-token.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  Verify2FADto,
  UseBackupCodeDto,
  Enable2FADto,
  Disable2FADto,
} from './dto/auth.dto';
import type { User } from '../db/schema';
import { toSafeUser } from './auth.service';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
    private readonly config: ConfigService,
  ) {
    this.isProduction = this.config.get<string>('NODE_ENV') === 'production';
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      path: '/',
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
    });
  }

  // ─── Registration & email verification ───────────────────────────────────────

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('verify-email')
  verifyEmail(@Query() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  // ─── Login / session ──────────────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    if (result.refreshToken) {
      this.setRefreshCookie(res, result.refreshToken);
    }
    const { refreshToken: _, ...body } = result;
    return body;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  async refresh(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refresh(user);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.clearRefreshCookie(res);
    return this.authService.logout(user.id);
  }

  // ─── Password reset ───────────────────────────────────────────────────────────

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ─── 2FA endpoints ────────────────────────────────────────────────────────────

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  setup2FA(@CurrentUser() user: User) {
    return this.twoFactorService.setup(user);
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  enable2FA(@CurrentUser() user: User, @Body() dto: Enable2FADto) {
    return this.twoFactorService.enable(user, dto.secret, dto.code);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PreAuthGuard)
  async verify2FA(
    @CurrentUser() preAuthUser: { id: string; email: string },
    @Body() dto: Verify2FADto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.twoFactorService.verify(preAuthUser.id, dto.code);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('2fa/backup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PreAuthGuard)
  async useBackupCode(
    @CurrentUser() preAuthUser: { id: string; email: string },
    @Body() dto: UseBackupCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.twoFactorService.useBackupCode(preAuthUser.id, dto.code);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  disable2FA(@CurrentUser() user: User, @Body() dto: Disable2FADto) {
    return this.twoFactorService.disable(user, dto.password);
  }

  // ─── Authenticated user info ──────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return toSafeUser(user);
  }
}
