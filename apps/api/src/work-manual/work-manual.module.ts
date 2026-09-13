import { Module } from '@nestjs/common';
import { WorkManualController } from './work-manual.controller';
import { WorkManualService } from './work-manual.service';

@Module({
  controllers: [WorkManualController],
  providers: [WorkManualService],
})
export class WorkManualModule {}
