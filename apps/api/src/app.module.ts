import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DigitalEmployeesModule } from './digital-employees/digital-employees.module';
import { EmployeeTypesModule } from './employee-types/employee-types.module';
import { ZernioModule } from './integrations/zernio/zernio.module';
import { PreparationModule } from './preparation/preparation.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublicModule } from './public/public.module';
import { WorkManualModule } from './work-manual/work-manual.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EmployeeTypesModule,
    DigitalEmployeesModule,
    WorkManualModule,
    PreparationModule,
    PublicModule,
    ZernioModule,
  ],
})
export class AppModule {}
