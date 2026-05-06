import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUrl,
  IsEmail,
  IsIn,
} from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug: string;

  @IsOptional()
  @IsUrl()
  iconUrl?: string;
}

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUrl()
  iconUrl?: string;
}

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsIn(['admin', 'member'])
  role?: 'admin' | 'member';
}

export class UpdateMemberRoleDto {
  @IsIn(['admin', 'member'])
  role: 'admin' | 'member';
}
