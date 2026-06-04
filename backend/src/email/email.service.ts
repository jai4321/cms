import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT', 587),
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const appUrl = this.config.getOrThrow<string>('APP_URL');
    const link = `${appUrl}/verify-email?token=${token}`;
    await this.send(
      email,
      'Verify your email',
      `Click to verify: ${link}`,
      `<p>Click <a href="${link}">here</a> to verify your email address. This link expires in 24 hours.</p>`,
    );
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const appUrl = this.config.getOrThrow<string>('APP_URL');
    const link = `${appUrl}/reset-password?token=${token}`;
    await this.send(
      email,
      'Reset your password',
      `Click to reset: ${link}`,
      `<p>Click <a href="${link}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    );
  }

  async sendWorkspaceInviteEmail(
    email: string,
    inviterName: string,
    workspaceName: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const link = `${appUrl}/workspaces`;
    await this.send(
      email,
      `You've been invited to ${workspaceName}`,
      `${inviterName} has invited you to join ${workspaceName}. Visit ${link} to get started.`,
      `<p><strong>${inviterName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong>.</p>
<p><a href="${link}">Click here to open your workspaces</a></p>`,
    );
  }

  async sendBackupCodesEmail(email: string, codes: string[]): Promise<void> {
    const codeList = codes.map((c) => `<li><code>${c}</code></li>`).join('');
    await this.send(
      email,
      'Your 2FA Backup Codes',
      `Your 2FA backup codes:\n${codes.join('\n')}\nEach code can only be used once. Store them somewhere safe.`,
      `<p>Two-factor authentication has been enabled on your account.</p>
<p>Here are your <strong>backup codes</strong>. Each can be used only once if you lose access to your authenticator app:</p>
<ul>${codeList}</ul>
<p>Store these somewhere safe. If you lose both your authenticator and these codes, you will be locked out.</p>`,
    );
  }

  private async send(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<void> {
    const from = this.config.get<string>('SMTP_FROM', 'noreply@example.com');
    try {
      await this.transporter.sendMail({ from, to, subject, text, html });
    } catch (err) {
      this.logger.warn(
        `Failed to send email to ${to}: ${(err as Error).message}`,
      );
    }
  }
}
