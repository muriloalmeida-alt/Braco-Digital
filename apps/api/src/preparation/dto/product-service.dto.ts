import { PricingMode, ProductServiceKind } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertProductServiceDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsEnum(ProductServiceKind)
  kind!: ProductServiceKind;

  @IsString()
  @MaxLength(1000)
  clientDescription!: string;

  @IsEnum(PricingMode)
  pricingMode!: PricingMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  schedulable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
