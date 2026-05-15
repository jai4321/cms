import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PostReplyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;
}

export class AddReactionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  emoji: string;
}

export class GetRepliesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  before?: string;
}
