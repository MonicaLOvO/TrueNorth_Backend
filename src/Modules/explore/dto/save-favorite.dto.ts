import { IsString, MinLength } from 'class-validator';

/** Body for POST /favorites (JWT required). userId comes from the token. */
export class SaveFavoriteDto {
  @IsString()
  @MinLength(1)
  exploreId: string;
}
