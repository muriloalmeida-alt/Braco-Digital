import { IsString, IsUUID } from 'class-validator';

export class CreateDigitalEmployeeDto {
  @IsString()
  @IsUUID()
  employeeTypeId!: string;
}
