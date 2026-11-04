import { Listing, ZoneLocation, ListingCategory, ListingOperation } from '../types';

export interface ListingFilter {
  searchQuery?: string;
  zone?: ZoneLocation | 'all';
  category?: ListingCategory | 'all';
  operation?: ListingOperation | 'all';
  maxPrice?: number;
  minYear?: number;
  inspectedOnly?: boolean;
}

/**
 * Checks if a listing matches the given filter criteria
 */
export function matchesFilter(item: Listing, filter: ListingFilter): boolean {
  if (filter.zone && filter.zone !== 'all') {
    if (item.zone !== filter.zone) return false;
  }

  if (filter.category && filter.category !== 'all') {
    if (item.category !== filter.category) return false;
  }

  if (filter.operation && filter.operation !== 'all') {
    if (item.operation !== filter.operation) return false;
  }

  if (filter.maxPrice !== undefined && filter.maxPrice > 0) {
    if (item.priceAmount > filter.maxPrice) return false;
  }

  if (filter.minYear !== undefined && filter.minYear > 0) {
    if (item.year < filter.minYear) return false;
  }

  if (filter.inspectedOnly) {
    if (item.inspectionStatus !== 'inspected') return false;
  }

  if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
    const q = filter.searchQuery.toLowerCase().trim();
    const haystack = `${item.title} ${item.make} ${item.model} ${item.locationDetails}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  return true;
}

/**
 * Checks if a promoted listing is eligible for the current zone scope
 */
export function matchesPromotionScope(scope?: 'al_kafr_only' | 'all_suwayda', targetZone?: ZoneLocation | 'all'): boolean {
  if (!scope || scope === 'all_suwayda') return true;
  if (scope === 'al_kafr_only') {
    return targetZone === 'al_kafr' || targetZone === 'all' || !targetZone;
  }
  return true;
}

/**
 * Rank listings: Promoted first (chronological by promotion activation date DESC, capped at maxPromoted),
 * followed by standard listings (created_at DESC).
 */
export function rankListings(
  listings: Listing[],
  filter: ListingFilter,
  maxPromoted: number = 5
): { ranked: Listing[]; promotedCount: number; standardCount: number } {
  // 1. Filter matching listings
  const filtered = listings.filter((item) => matchesFilter(item, filter));

  // 2. Separate promoted (active) vs standard
  const now = Date.now();
  const promotedList: Listing[] = [];
  const standardList: Listing[] = [];

  for (const item of filtered) {
    const isPromoActive = item.isPromoted && matchesPromotionScope(item.promotionScope, filter.zone);
    if (isPromoActive) {
      promotedList.push(item);
    } else {
      standardList.push(item);
    }
  }

  // 3. Sort promoted by promotionActivatedAt DESC (newest promotion first)
  promotedList.sort((a, b) => (b.promotionActivatedAt || 0) - (a.promotionActivatedAt || 0));

  // 4. Cap promoted items to maxPromoted to prevent feed fatigue
  const cappedPromoted = promotedList.slice(0, maxPromoted);
  const overflowPromoted = promotedList.slice(maxPromoted);

  // 5. Sort standard listings by createdAt DESC (newest first)
  // Overflow promoted listings are placed into standard list sorted by createdAt
  const combinedStandard = [...standardList, ...overflowPromoted].sort((a, b) => b.createdAt - a.createdAt);

  return {
    ranked: [...cappedPromoted, ...combinedStandard],
    promotedCount: cappedPromoted.length,
    standardCount: combinedStandard.length,
  };
}
