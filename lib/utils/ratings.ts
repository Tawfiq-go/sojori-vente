/**
 * Utilities for normalizing and combining ratings from different platforms
 */

export interface PlatformRating {
  platform: 'airbnb' | 'booking' | 'sojori';
  rating: number;
  reviewCount: number;
  maxRating?: number; // Default: 5 for airbnb/sojori, 10 for booking
}

/**
 * Normalize a rating to a 0-5 scale
 */
export function normalizeRating(platformRating: PlatformRating): number {
  const { platform, rating, maxRating } = platformRating;

  // Determine max rating based on platform
  const max = maxRating || (platform === 'booking' ? 10 : 5);

  // Normalize to 0-5 scale
  return (rating / max) * 5;
}

/**
 * Combine multiple platform ratings into a weighted average on a 5-point scale
 *
 * @param ratings - Array of platform ratings
 * @returns Combined rating (0-5) and total review count
 */
export function combineRatings(ratings: PlatformRating[]): {
  combinedRating: number;
  totalReviews: number;
} {
  if (ratings.length === 0) {
    return { combinedRating: 0, totalReviews: 0 };
  }

  // Normalize all ratings to 0-5 scale
  const normalizedRatings = ratings.map(r => ({
    ...r,
    normalizedRating: normalizeRating(r),
  }));

  // Calculate weighted average based on number of reviews
  const totalReviews = normalizedRatings.reduce((sum, r) => sum + r.reviewCount, 0);

  if (totalReviews === 0) {
    return { combinedRating: 0, totalReviews: 0 };
  }

  const weightedSum = normalizedRatings.reduce(
    (sum, r) => sum + r.normalizedRating * r.reviewCount,
    0
  );

  const combinedRating = weightedSum / totalReviews;

  return {
    combinedRating: Math.round(combinedRating * 10) / 10, // Round to 1 decimal
    totalReviews,
  };
}

/**
 * Example usage:
 *
 * const ratings: PlatformRating[] = [
 *   { platform: 'airbnb', rating: 4.8, reviewCount: 142 },
 *   { platform: 'booking', rating: 9.2, reviewCount: 87 },
 * ];
 *
 * const { combinedRating, totalReviews } = combineRatings(ratings);
 * // combinedRating = 4.9, totalReviews = 229
 */
