import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CompanyProfileService } from './company-profile.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';

/** US07 — Informar dados da empresa. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies/current/profile')
export class CompanyProfileController {
  constructor(private readonly service: CompanyProfileService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload) {
    return this.service.get(user.companyId);
  }

  @Patch()
  @Roles(Role.OWNER, Role.ADMIN)
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateCompanyProfileDto) {
    return this.service.update(user.companyId, dto);
  }
}
