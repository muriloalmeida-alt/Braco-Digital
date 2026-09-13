import {
  CommunicationAddressing,
  CommunicationEmojis,
  CommunicationLength,
  CommunicationTone,
} from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCommunicationDto {
  @IsOptional()
  @IsEnum(CommunicationTone)
  tone?: CommunicationTone;

  @IsOptional()
  @IsEnum(CommunicationAddressing)
  addressing?: CommunicationAddressing;

  @IsOptional()
  @IsEnum(CommunicationLength)
  length?: CommunicationLength;

  @IsOptional()
  @IsEnum(CommunicationEmojis)
  emojis?: CommunicationEmojis;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  preferredTerms?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  avoidTerms?: string[];
}
