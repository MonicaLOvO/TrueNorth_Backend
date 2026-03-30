import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** PATCH /auth/me — all fields optional; send only what you want to change. */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  userName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string | null;
}
