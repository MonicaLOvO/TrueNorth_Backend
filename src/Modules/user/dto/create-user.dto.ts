export class CreateUserDto {
  userName: string;
  password: string;
  /** Optional profile fields (set at register). */
  email?: string | null;
  displayName?: string | null;
}
