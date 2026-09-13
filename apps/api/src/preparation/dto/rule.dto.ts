import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertRuleDto {
  @IsString()
  @MaxLength(500)
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  appliesWhen?: string;
}
