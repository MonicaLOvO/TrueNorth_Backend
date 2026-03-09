export class CreateExploreDto {
  chatId: string;
  name: string;
  description?: string | null;
  url?: string | null;
  location?: string | null;
  imageUrl?: string | null;
}
