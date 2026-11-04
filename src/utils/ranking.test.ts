import test from 'node:test';
import assert from 'node:assert/strict';
import { rankListings, matchesFilter } from './ranking.ts';
import { Listing } from '../types/index.ts';

const dummyListings: Listing[] = [
  {
    id: 'l1',
    userId: 'u1',
    sellerName: 'أبو فراس',
    sellerPhone: '0933111222',
    sellerRating: 4.8,
    title: 'جرار بيلاروس 820 زراعي بحالة ممتازة',
    category: 'tractors',
    operation: 'sale',
    make: 'Belarus',
    model: '820',
    year: 2019,
    metricType: 'work_hours',
    metricValue: 1250,
    priceAmount: 8500,
    currency: 'USD',
    zone: 'al_kafr',
    locationDetails: 'الكفر - طريق المزرعة',
    images: [],
    ownershipVerified: true,
    inspectionStatus: 'inspected',
    isPromoted: true,
    promotionScope: 'al_kafr_only',
    promotionActivatedAt: 1000,
    viewsCount: 120,
    clicksCount: 34,
    inquiriesCount: 5,
    status: 'active',
    createdAt: 500,
  },
  {
    id: 'l2',
    userId: 'u2',
    sellerName: 'خالد السويداء',
    sellerPhone: '0944222333',
    sellerRating: 4.9,
    title: 'كيا سيراتو 2020 بحالة الوكالة',
    category: 'cars',
    operation: 'sale',
    make: 'Kia',
    model: 'Cerato',
    year: 2020,
    metricType: 'mileage_km',
    metricValue: 48000,
    priceAmount: 11000,
    currency: 'USD',
    zone: 'suwayda',
    locationDetails: 'السويداء - طريق قنوات',
    images: [],
    ownershipVerified: true,
    inspectionStatus: 'none',
    isPromoted: true,
    promotionScope: 'all_suwayda',
    promotionActivatedAt: 2000, // Newer promotion activation
    viewsCount: 310,
    clicksCount: 88,
    inquiriesCount: 12,
    status: 'active',
    createdAt: 700,
  },
  {
    id: 'l3',
    userId: 'u3',
    sellerName: 'أبو ماهر للآليات',
    sellerPhone: '0955333444',
    sellerRating: 4.7,
    title: 'حفارة كوماتسو 200 للإيجار بالساعة أو اليوم',
    category: 'excavators',
    operation: 'rent',
    make: 'Komatsu',
    model: 'PC200',
    year: 2018,
    metricType: 'work_hours',
    metricValue: 3400,
    priceAmount: 400000,
    currency: 'SYP',
    zone: 'al_kafr',
    locationDetails: 'الكفر - السهل الغربي',
    images: [],
    ownershipVerified: true,
    inspectionStatus: 'inspected',
    isPromoted: false,
    viewsCount: 85,
    clicksCount: 20,
    inquiriesCount: 2,
    status: 'active',
    createdAt: 900, // Newest regular listing
  },
  {
    id: 'l4',
    userId: 'u4',
    sellerName: 'رامي الحمد',
    sellerPhone: '0966444555',
    sellerRating: 4.5,
    title: 'تويوتا هايلوكس دبل كابين 2017',
    category: 'cars',
    operation: 'sale',
    make: 'Toyota',
    model: 'Hilux',
    year: 2017,
    metricType: 'mileage_km',
    metricValue: 120000,
    priceAmount: 14000,
    currency: 'USD',
    zone: 'al_kafr',
    locationDetails: 'الكفر - الحي الشرقي',
    images: [],
    ownershipVerified: false,
    inspectionStatus: 'none',
    isPromoted: false,
    viewsCount: 40,
    clicksCount: 10,
    inquiriesCount: 1,
    status: 'active',
    createdAt: 300,
  },
];

test('matchesFilter accurately filters by zone and category', () => {
  assert.equal(matchesFilter(dummyListings[0], { zone: 'al_kafr', category: 'tractors' }), true);
  assert.equal(matchesFilter(dummyListings[1], { zone: 'al_kafr' }), false);
  assert.equal(matchesFilter(dummyListings[0], { operation: 'rent' }), false);
  assert.equal(matchesFilter(dummyListings[2], { operation: 'rent' }), true);
});

test('rankListings prioritizes active promoted listings with newest promotion first', () => {
  const result = rankListings(dummyListings, { zone: 'all', category: 'all' }, 5);
  // Both l2 and l1 are promoted. l2 has promotionActivatedAt: 2000 > l1: 1000
  assert.equal(result.promotedCount, 2);
  assert.equal(result.ranked[0].id, 'l2');
  assert.equal(result.ranked[1].id, 'l1');
  // Regular items follow by createdAt DESC (l3: 900, then l4: 300)
  assert.equal(result.ranked[2].id, 'l3');
  assert.equal(result.ranked[3].id, 'l4');
});

test('rankListings respects filter and does not show non-matching promoted items', () => {
  // If user filters for 'al_kafr', l2 (which is in 'suwayda') must NOT appear
  const result = rankListings(dummyListings, { zone: 'al_kafr' }, 5);
  assert.equal(result.promotedCount, 1);
  assert.equal(result.ranked[0].id, 'l1');
  const ids = result.ranked.map((x) => x.id);
  assert.equal(ids.includes('l2'), false);
});

test('matchesFilter and rankListings filter real-time by Salkhad and other sub-districts', () => {
  const salkhadListing: Listing = {
    ...dummyListings[0],
    id: 'l_skd_1',
    zone: 'salkhad',
    title: 'جرار نيوهولند TD90 صلخد',
  };

  const all = [...dummyListings, salkhadListing];
  const salkhadResult = rankListings(all, { zone: 'salkhad' }, 5);
  assert.equal(salkhadResult.ranked.length, 1);
  assert.equal(salkhadResult.ranked[0].id, 'l_skd_1');

  const suwaydaResult = rankListings(all, { zone: 'suwayda' }, 5);
  assert.equal(suwaydaResult.ranked.length, 1);
  assert.equal(suwaydaResult.ranked[0].id, 'l2');
});

test('inspectedOnly toggle filters strictly to inspected vehicles', () => {
  // In dummyListings: l1 is inspected, l2 is none, l3 is inspected, l4 is none
  const inspectedResult = rankListings(dummyListings, { inspectedOnly: true }, 5);
  
  assert.equal(inspectedResult.ranked.length, 2);
  const ids = inspectedResult.ranked.map((item) => item.id);
  assert.equal(ids.includes('l1'), true);
  assert.equal(ids.includes('l3'), true);
  assert.equal(ids.includes('l2'), false);
  assert.equal(ids.includes('l4'), false);

  // Every single item must have inspectionStatus === 'inspected'
  for (const item of inspectedResult.ranked) {
    assert.equal(item.inspectionStatus, 'inspected');
  }

  // When inspectedOnly is false or undefined, non-inspected vehicles are included
  const allResult = rankListings(dummyListings, { inspectedOnly: false }, 5);
  assert.equal(allResult.ranked.length, 4);

  // Combined filter: inspectedOnly + category 'tractors'
  const tractorResult = rankListings(dummyListings, { category: 'tractors', inspectedOnly: true }, 5);
  assert.equal(tractorResult.ranked.length, 1);
  assert.equal(tractorResult.ranked[0].id, 'l1');
});


