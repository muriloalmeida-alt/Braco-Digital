import { IsString, MaxLength, MinLength } from 'class-validator';

export class SelectCalendarDto {
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  calendarId!: string;
}
