import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

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
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  refresh(@CurrentUser() user: User) {
    return this.authService.refresh(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: User) {
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
  verify2FA(
    @CurrentUser() preAuthUser: { id: string; email: string },
    @Body() dto: Verify2FADto,
  ) {
    return this.twoFactorService.verify(preAuthUser.id, dto.code);
  }

  @Post('2fa/backup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PreAuthGuard)
  useBackupCode(
    @CurrentUser() preAuthUser: { id: string; email: string },
    @Body() dto: UseBackupCodeDto,
  ) {
    return this.twoFactorService.useBackupCode(preAuthUser.id, dto.code);
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
