import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateResponsiblesDto {
  @IsUUID()
  principalUserId!: string;

  @IsOptional()
  @IsString()
  backupUserId?: string | null;
}
