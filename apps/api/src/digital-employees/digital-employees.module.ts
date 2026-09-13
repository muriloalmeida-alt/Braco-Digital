import { Module } from '@nestjs/common';
import { DigitalEmployeesController } from './digital-employees.controller';
import { DigitalEmployeesService } from './digital-employees.service';

@Module({
  controllers: [DigitalEmployeesController],
  providers: [DigitalEmployeesService],
})
export class DigitalEmployeesModule {}
