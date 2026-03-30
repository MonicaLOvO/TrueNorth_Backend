/**
 * Public user shape returned by the API. Never includes password.
 */
export class UserModel {
  Id!: string;
  UserName?: string;
  Email?: string | null;
  DisplayName?: string | null;
}
