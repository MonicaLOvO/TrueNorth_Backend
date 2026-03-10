/**
 * =============================================================================
 * GUIDED REQUEST DTO – What the frontend sends for "guided" flow
 * =============================================================================
 *
 * Purpose: When the user picks a category (e.g. Food, Movie) and answers
 * a few questions (time of day, mood, dietary preferences, etc.), the frontend
 * sends this object to POST /decisions/guided. The backend uses it to build
 * a prompt for the AI and return recommendation cards.
 *
 * Why we need it: So the API knows which category and what answers to use;
 * we validate the shape and type of the request body here.
 */
export class GuidedRequestDto {
  /** Category ID from your categories table (e.g. from GET /categories). */
  categoryId: string;

  /**
   * User's answers to the contextual questions. Keys can be anything your
   * frontend uses (e.g. "time", "mood", "diet", "occasion"). Values are strings.
   * Example: { time: "dinner", mood: "comfort", diet: "vegetarian" }
   */
  answers: Record<string, string>;
}
