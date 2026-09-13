import { IsBoolean } from 'class-validator';

export class AcknowledgeNoAdditionalRulesDto {
  @IsBoolean()
  acknowledgedNoAdditional!: boolean;
}
