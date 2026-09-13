import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';

class ResponsibilityToggleDto {
  @IsString()
  key!: string;

  @IsBoolean()
  enabled!: boolean;
}

export class UpdateResponsibilitiesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResponsibilityToggleDto)
  responsibilities!: ResponsibilityToggleDto[];
}
