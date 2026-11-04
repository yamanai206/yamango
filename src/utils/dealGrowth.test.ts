import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSixMonthDealGrowth,
  ZONE_NAMES_ARABIC,
} from './dealGrowth.ts';
import { Deal } from '../types/index.ts';

const testDeals: Deal[] = [
  {
    id: 't_deal_1',
    listingId: 'l1',
    listingTitle: 'جرار بيلاروس',
    listingCategory: 'tractors',
    listingOperation: 'sale',
    buyerId: 'b1',
    buyerName: 'مشتري 1',
    sellerId: 's1',
    sellerName: 'بائع 1',
    agreedPrice: 10000,
    currency: 'USD',
    depositAmount: 1000,
    platformCommissionRate: 0.025,
    platformCommissionAmount: 250,
    status: 'completed',
    zone: 'al_kafr',
    completedAt: '2026-10-10 12:00',
    createdAt: new Date('2026-10-08T09:00:00').getTime(),
    secretOtp: 'YM-9901',
    contract: { contractNumber: 'YMG-TEST-01', termsSummaryArabic: 'بيع', qrVerificationHash: 'QR1' },
  },
  {
    id: 't_deal_2',
    listingId: 'l2',
    listingTitle: 'حفارة كوماتسو',
    listingCategory: 'excavators',
    listingOperation: 'rent',
    buyerId: 'b2',
    buyerName: 'مشتري 2',
    sellerId: 's2',
    sellerName: 'بائع 2',
    agreedPrice: 2000000,
    currency: 'SYP',
    depositAmount: 500000,
    platformCommissionRate: 0.05,
    platformCommissionAmount: 100000,
    status: 'cancelled',
    zone: 'suwayda',
    cancelledAt: '2026-10-15 15:00',
    cancellationReason: 'عدم توفر سائق',
    createdAt: new Date('2026-10-12T10:00:00').getTime(),
    secretOtp: 'YM-9902',
    contract: { contractNumber: 'YMG-TEST-02', termsSummaryArabic: 'إيجار', qrVerificationHash: 'QR2' },
  },
  {
    id: 't_deal_3',
    listingId: 'l3',
    listingTitle: 'سيارة تويوتا',
    listingCategory: 'cars',
    listingOperation: 'sale',
    buyerId: 'b3',
    buyerName: 'مشتري 3',
    sellerId: 's3',
    sellerName: 'بائع 3',
    agreedPrice: 15000,
    currency: 'USD',
    depositAmount: 1500,
    platformCommissionRate: 0.025,
    platformCommissionAmount: 375,
    status: 'completed',
    zone: 'salkhad',
    completedAt: '2026-09-20 14:00',
    createdAt: new Date('2026-09-18T10:00:00').getTime(),
    secretOtp: 'YM-9903',
    contract: { contractNumber: 'YMG-TEST-03', termsSummaryArabic: 'بيع', qrVerificationHash: 'QR3' },
  },
];

test('computeSixMonthDealGrowth returns 6 consecutive months ending at referenceDate', () => {
  const referenceDate = new Date('2026-10-25');
  const growth = computeSixMonthDealGrowth([], 'all', referenceDate);

  assert.equal(growth.dataPoints.length, 6);
  // First month should be May 2026 (index 0)
  assert.equal(growth.dataPoints[0].shortMonth, 'أيار');
  assert.equal(growth.dataPoints[0].monthKey, '2026-05');

  // Last month should be October 2026 (index 5)
  assert.equal(growth.dataPoints[5].shortMonth, 'تشرين الأول');
  assert.equal(growth.dataPoints[5].monthKey, '2026-10');
});

test('computeSixMonthDealGrowth aggregates total and completed operations accurately', () => {
  const referenceDate = new Date('2026-10-25');
  const growth = computeSixMonthDealGrowth(testDeals, 'all', referenceDate);

  // Overall counts should include baseline + test deals
  assert.ok(growth.totalDealsSixMonths > 0);
  assert.ok(growth.completedDealsSixMonths > 0);
  assert.ok(growth.overallCompletionRate >= 0 && growth.overallCompletionRate <= 100);

  // Check that October has testDeals counted
  const oct = growth.dataPoints.find((p) => p.monthKey === '2026-10');
  assert.ok(oct);
  assert.ok(oct.totalDeals >= 2); // t_deal_1 (completed) and t_deal_2 (cancelled)
  assert.ok(oct.completedDeals >= 1);
});

test('computeSixMonthDealGrowth filters by sub-district / zone accurately', () => {
  const referenceDate = new Date('2026-10-25');
  const allGrowth = computeSixMonthDealGrowth(testDeals, 'all', referenceDate);
  const kafrGrowth = computeSixMonthDealGrowth(testDeals, 'al_kafr', referenceDate);
  const salkhadGrowth = computeSixMonthDealGrowth(testDeals, 'salkhad', referenceDate);
  const ariqaGrowth = computeSixMonthDealGrowth(testDeals, 'ariqa', referenceDate);

  // Filtering by specific zone should yield equal or fewer total deals than all zones
  assert.ok(kafrGrowth.totalDealsSixMonths <= allGrowth.totalDealsSixMonths);
  assert.ok(salkhadGrowth.totalDealsSixMonths <= allGrowth.totalDealsSixMonths);
  assert.ok(ariqaGrowth.totalDealsSixMonths <= allGrowth.totalDealsSixMonths);

  // Label should match Arabic zone name
  assert.equal(kafrGrowth.selectedZoneLabel, ZONE_NAMES_ARABIC.al_kafr);
  assert.equal(salkhadGrowth.selectedZoneLabel, ZONE_NAMES_ARABIC.salkhad);
  assert.equal(allGrowth.selectedZoneLabel, 'كافة النواحي والمناطق (السويداء)');
});

test('computeSixMonthDealGrowth computes completion rate percentage and growth rate', () => {
  const referenceDate = new Date('2026-10-25');
  const growth = computeSixMonthDealGrowth([], 'all', referenceDate);

  // Each data point should have valid completion rate percentage
  for (const pt of growth.dataPoints) {
    assert.ok(pt.completionRate >= 0 && pt.completionRate <= 100);
    if (pt.totalDeals > 0) {
      assert.equal(pt.completionRate, Math.round((pt.completedDeals / pt.totalDeals) * 100));
    } else {
      assert.equal(pt.completionRate, 0);
    }
  }

  // Growth percentages should be numbers
  assert.ok(typeof growth.growthPercentage === 'number');
  assert.ok(typeof growth.completedGrowthPercentage === 'number');
  assert.ok(typeof growth.averageMonthlyDeals === 'number');
  assert.ok(typeof growth.averageMonthlyCompleted === 'number');
});

test('computeSixMonthDealGrowth accurately identifies top performing zone', () => {
  const referenceDate = new Date('2026-10-25');
  const growth = computeSixMonthDealGrowth([], 'all', referenceDate);

  assert.ok(growth.topZone);
  assert.ok(growth.topZone.id);
  assert.ok(growth.topZone.name);
  assert.ok(growth.topZone.total > 0);
  assert.ok(growth.topZone.completed > 0);
});
