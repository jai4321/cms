import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username may only contain letters, numbers, underscores, and hyphens',
  })
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class VerifyEmailDto {
  @IsString()
  @MinLength(1)
  token: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class Verify2FADto {
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

export class UseBackupCodeDto {
  @IsString()
  @MinLength(1)
  code: string;
}

export class Enable2FADto {
  @IsString()
  @MinLength(1)
  secret: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}

export class Disable2FADto {
  @IsString()
  @MinLength(1)
  password: string;
}
