import { ServiceMode } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BusinessHourPeriodDto {
  @IsString()
  day!: string;

  @IsString()
  from!: string;

  @IsString()
  to!: string;
}

/**
 * US07 — todos os campos são opcionais no DTO (autosave grava parcial a
 * cada campo alterado); a obrigatoriedade real é avaliada por
 * `PreparationReadinessService`, nunca aqui.
 */
export class UpdateCompanyProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  attendanceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  about?: string;

  @IsOptional()
  @IsEnum(ServiceMode)
  serviceMode?: ServiceMode;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessHourPeriodDto)
  businessHours?: BusinessHourPeriodDto[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsUrl({ require_protocol: false })
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  socialHandle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  generalNotes?: string;
}
