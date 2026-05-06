import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as qrcode from 'qrcode';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { User } from '../db/schema';
import { AuthService } from './auth.service';

const SALT_ROUNDS = 12;
const BACKUP_CODE_COUNT = 8;
const ALGORITHM = 'aes-256-cbc';

@Injectable()
export class TwoFactorService {
  private readonly encKey: Buffer;

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {
    const hexKey = config
      .getOrThrow<string>('TWO_FACTOR_ENCRYPTION_KEY')
      .trim();
    if (!/^[0-9a-fA-F]{64}$/.test(hexKey)) {
      throw new Error(
        'TWO_FACTOR_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).',
      );
    }

    this.encKey = Buffer.from(hexKey, 'hex');
  }

  // ─── Setup: generate TOTP secret + QR code ───────────────────────────────────

  async setup(user: User): Promise<{ secret: string; qrCodeUrl: string }> {
    const secret = generateSecret();
    const otpAuthUrl = generateURI({
      issuer: 'TeamsApp',
      label: user.email,
      secret,
    });
    const qrCodeUrl = await qrcode.toDataURL(otpAuthUrl);
    return { secret, qrCodeUrl };
  }

  // ─── Enable: confirm code → store encrypted secret → return backup codes ──────

  async enable(
    user: User,
    plainSecret: string,
    code: string,
  ): Promise<{ backupCodes: string[] }> {
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const valid = verifySync({ token: code, secret: plainSecret });
    if (!valid.valid) throw new BadRequestException('Invalid TOTP code');

    const encryptedSecret = this.encrypt(plainSecret);
    const { plain, hashed } = await this.generateBackupCodes();

    await this.usersService.update(user.id, {
      twoFactorSecret: encryptedSecret,
      twoFactorEnabled: true,
      twoFactorBackupCodes: hashed,
    });

    return { backupCodes: plain };
  }

  // ─── Verify: exchange pre_auth_token for full JWT ─────────────────────────────

  async verify(
    userId: string,
    code: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException();
    }

    const secret = this.decrypt(user.twoFactorSecret);
    const result = verifySync({ token: code, secret });
    if (!result.valid) throw new UnauthorizedException('Invalid TOTP code');

    return this.authService.issueTokens(user);
  }

  // ─── Backup code login ────────────────────────────────────────────────────────

  async useBackupCode(
    userId: string,
    code: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorBackupCodes) {
      throw new UnauthorizedException();
    }

    const codes: string[] = user.twoFactorBackupCodes as string[];
    let matchIndex = -1;

    for (let i = 0; i < codes.length; i++) {
      const match = await bcrypt.compare(code.trim(), codes[i]);
      if (match) {
        matchIndex = i;
        break;
      }
    }

    if (matchIndex === -1)
      throw new UnauthorizedException('Invalid backup code');

    // Remove used backup code (single-use)
    const remaining = codes.filter((_, i) => i !== matchIndex);
    await this.usersService.update(user.id, {
      twoFactorBackupCodes: remaining,
    });

    return this.authService.issueTokens(user);
  }

  // ─── Disable ──────────────────────────────────────────────────────────────────

  async disable(user: User, password: string): Promise<{ message: string }> {
    if (!user.twoFactorEnabled)
      throw new BadRequestException('2FA is not enabled');

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Incorrect password');

    await this.usersService.update(user.id, {
      twoFactorSecret: undefined,
      twoFactorEnabled: false,
      twoFactorBackupCodes: undefined,
    });
    return { message: '2FA disabled successfully.' };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(data: string): string {
    const [ivHex, encHex] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, this.encKey, iv);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }

  private async generateBackupCodes(): Promise<{
    plain: string[];
    hashed: string[];
  }> {
    const plain: string[] = Array.from({ length: BACKUP_CODE_COUNT }, () =>
      crypto.randomBytes(5).toString('hex'),
    );
    const hashed = await Promise.all(
      plain.map((c) => bcrypt.hash(c, SALT_ROUNDS)),
    );
    return { plain, hashed };
  }
}
