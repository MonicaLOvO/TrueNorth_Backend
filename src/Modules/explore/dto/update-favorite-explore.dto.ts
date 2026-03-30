import { IsString, MinLength } from 'class-validator';

export class UpdateFavoriteExploreDto {
  @IsString()
  @MinLength(1)
  exploreId: string;
}
