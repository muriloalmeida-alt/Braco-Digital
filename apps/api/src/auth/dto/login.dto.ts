import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;

  /**
   * Necessário apenas se o usuário pertencer a mais de uma empresa
   * (ex.: consultor). Se o usuário tiver só uma empresa, é resolvido
   * automaticamente.
   */
  @IsOptional()
  @IsString()
  companyId?: string;
}
