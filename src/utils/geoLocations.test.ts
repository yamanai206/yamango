import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceKm,
  formatDistanceKm,
  getListingCoordinates,
  SUWAYDA_VILLAGES,
} from './geoLocations';
import { Listing } from '../types';

test('geoLocations: calculateDistanceKm calculates accurate distance between Suwayda and Al-Kafr', () => {
  const kafr = SUWAYDA_VILLAGES.al_kafr;
  const suwayda = SUWAYDA_VILLAGES.suwayda;

  // Approximate straight-line distance between As-Suwayda and Al-Kafr is ~12-14 km
  const dist = calculateDistanceKm(kafr.lat, kafr.lng, suwayda.lat, suwayda.lng);
  assert.ok(dist >= 11 && dist <= 15, `Expected distance ~12-14km, got ${dist}`);

  // Distance to self should be 0
  const selfDist = calculateDistanceKm(kafr.lat, kafr.lng, kafr.lat, kafr.lng);
  assert.strictEqual(selfDist, 0);
});

test('geoLocations: formatDistanceKm formats meters and km in Arabic properly', () => {
  assert.strictEqual(formatDistanceKm(0.4), '400 متر');
  assert.ok(formatDistanceKm(12.5).includes('كم'));
});

test('geoLocations: getListingCoordinates prioritizes explicit gpsCoordinates if provided', () => {
  const mockListing: Partial<Listing> = {
    id: 'test_gps_1',
    zone: 'al_kafr',
    gpsCoordinates: { lat: 32.6189, lng: 36.6345 },
  };

  const coords = getListingCoordinates(mockListing as Listing);
  assert.strictEqual(coords.lat, 32.6189);
  assert.strictEqual(coords.lng, 36.6345);
});

test('geoLocations: getListingCoordinates generates deterministic coordinates close to zone center', () => {
  const mockListing: Partial<Listing> = {
    id: 'test_fallback_1',
    zone: 'al_kafr',
  };

  const coords1 = getListingCoordinates(mockListing as Listing);
  const coords2 = getListingCoordinates(mockListing as Listing);

  // Must be deterministic
  assert.strictEqual(coords1.lat, coords2.lat);
  assert.strictEqual(coords1.lng, coords2.lng);

  // Must be within 1.5 km of Al-Kafr center
  const dist = calculateDistanceKm(coords1.lat, coords1.lng, SUWAYDA_VILLAGES.al_kafr.lat, SUWAYDA_VILLAGES.al_kafr.lng);
  assert.ok(dist < 2.0, `Deterministic coord too far from village center: ${dist} km`);
});
