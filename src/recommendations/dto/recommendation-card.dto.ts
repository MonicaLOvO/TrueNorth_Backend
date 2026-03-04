/**
 * =============================================================================
 * RECOMMENDATION CARD DTO – Shape of one recommendation returned to the frontend
 * =============================================================================
 *
 * This is the contract for what the API returns as a "recommendation card."
 * The frontend can render title, description, optional link (e.g. Maps, website,
 * streaming), and type (food, movie, place, etc.) for "Open in Maps", "Watch on
 * Netflix", "Visit website", etc.
 *
 * No persistence yet (MVP); we build this from AI output in RecommendationsService.
 */

/**
 * One recommendation card. All fields the frontend might need to display
 * and to open external links (Maps, website, streaming, etc.).
 */
export interface RecommendationCardDto {
  /** Short title (e.g. restaurant name, movie title). */
  title: string;
  /** One or two sentences describing the recommendation. */
  description: string;
  /** Optional URL (website, Maps link, streaming page). */
  link?: string;
  /** Category hint: food | movie | place | game | travel | etc. */
  type?: string;
}
