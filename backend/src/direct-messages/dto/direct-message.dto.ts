import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class CreateDmDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  userIds: string[];
}

export class AddParticipantDto {
  @IsUUID('4')
  userId: string;
}
