import { AutonomyLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

class AutonomyChoiceDto {
  @IsString()
  responsibilityKey!: string;

  @IsEnum(AutonomyLevel)
  level!: AutonomyLevel;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  condition?: string;
}

export class UpdateAutonomyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutonomyChoiceDto)
  choices!: AutonomyChoiceDto[];
}
