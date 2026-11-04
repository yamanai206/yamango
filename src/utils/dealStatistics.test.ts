import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMonthlyDealStats } from './dealStatistics.ts';
import { Deal } from '../types/index.ts';

const mockDeals: Deal[] = [
  {
    id: 'd1',
    listingId: 'l1',
    listingTitle: 'جرار بيلاروس 820',
    listingCategory: 'tractors',
    listingOperation: 'sale',
    buyerId: 'b1',
    buyerName: 'المشتري 1',
    sellerId: 's1',
    sellerName: 'البائع 1',
    agreedPrice: 9000,
    currency: 'USD',
    depositAmount: 900,
    platformCommissionRate: 0.025,
    platformCommissionAmount: 225,
    status: 'completed',
    completedAt: '2026-10-05 12:00',
    createdAt: new Date('2026-10-02T10:00:00').getTime(),
    secretOtp: 'YM-1111',
    contract: {
      contractNumber: 'YMG-TEST-1',
      termsSummaryArabic: 'عقد بيع',
      qrVerificationHash: 'HASH1',
    },
  },
  {
    id: 'd2',
    listingId: 'l2',
    listingTitle: 'حفارة كوماتسو 210',
    listingCategory: 'excavators',
    listingOperation: 'rent',
    buyerId: 'b2',
    buyerName: 'المشتري 2',
    sellerId: 's2',
    sellerName: 'البائع 2',
    agreedPrice: 500000,
    currency: 'SYP',
    depositAmount: 100000,
    platformCommissionRate: 0.05,
    platformCommissionAmount: 25000,
    status: 'cancelled',
    cancelledAt: '2026-10-06 14:00',
    cancellationReason: 'رسوب في فحص الكراج الفني',
    createdAt: new Date('2026-10-03T10:00:00').getTime(),
    secretOtp: 'YM-2222',
    contract: {
      contractNumber: 'YMG-TEST-2',
      termsSummaryArabic: 'عقد إيجار',
      qrVerificationHash: 'HASH2',
    },
  },
  {
    id: 'd3',
    listingId: 'l3',
    listingTitle: 'تويوتا هايلوكس 2018',
    listingCategory: 'cars',
    listingOperation: 'sale',
    buyerId: 'b3',
    buyerName: 'المشتري 3',
    sellerId: 's3',
    sellerName: 'البائع 3',
    agreedPrice: 15000,
    currency: 'USD',
    depositAmount: 1500,
    platformCommissionRate: 0.025,
    platformCommissionAmount: 375,
    status: 'completed',
    completedAt: '2026-10-18 16:00',
    createdAt: new Date('2026-10-15T10:00:00').getTime(),
    secretOtp: 'YM-3333',
    contract: {
      contractNumber: 'YMG-TEST-3',
      termsSummaryArabic: 'عقد بيع',
      qrVerificationHash: 'HASH3',
    },
  },
  {
    id: 'd4',
    listingId: 'l4',
    listingTitle: 'شاحنة مرسيدس 2628',
    listingCategory: 'trucks',
    listingOperation: 'rent',
    buyerId: 'b4',
    buyerName: 'المشتري 4',
    sellerId: 's4',
    sellerName: 'البائع 4',
    agreedPrice: 1000000,
    currency: 'SYP',
    depositAmount: 200000,
    platformCommissionRate: 0.05,
    platformCommissionAmount: 50000,
    status: 'escrow_pending',
    createdAt: new Date('2026-10-24T10:00:00').getTime(),
    secretOtp: 'YM-4444',
    contract: {
      contractNumber: 'YMG-TEST-4',
      termsSummaryArabic: 'عقد إيجار معلق',
      qrVerificationHash: 'HASH4',
    },
  },
  // Deal from previous month (September) that should be excluded
  {
    id: 'd_old',
    listingId: 'l5',
    listingTitle: 'جرار قديم شهر أيلول',
    listingCategory: 'tractors',
    listingOperation: 'sale',
    buyerId: 'b5',
    buyerName: 'المشتري 5',
    sellerId: 's5',
    sellerName: 'البائع 5',
    agreedPrice: 7000,
    currency: 'USD',
    depositAmount: 700,
    platformCommissionRate: 0.025,
    platformCommissionAmount: 175,
    status: 'completed',
    completedAt: '2026-09-20 12:00',
    createdAt: new Date('2026-09-15T10:00:00').getTime(),
    secretOtp: 'YM-5555',
    contract: {
      contractNumber: 'YMG-TEST-OLD',
      termsSummaryArabic: 'عقد سابق',
      qrVerificationHash: 'HASH5',
    },
  },
];

test('computeMonthlyDealStats filters by current month and accurately counts completed vs cancelled', () => {
  const stats = computeMonthlyDealStats(mockDeals, new Date('2026-10-25'));

  assert.equal(stats.targetMonthName, 'تشرين الأول');
  assert.equal(stats.targetYear, 2026);
  assert.equal(stats.completedCount, 2); // d1 and d3
  assert.equal(stats.cancelledCount, 1); // d2
  assert.equal(stats.inProgressCount, 1); // d4
  assert.equal(stats.totalClosedCount, 3);
  assert.equal(stats.successRate, 67); // 2/3 = 67%
  assert.equal(stats.cancellationRate, 33);
  assert.equal(stats.completedVolumeUSD, 24000); // 9000 + 15000
  assert.equal(stats.cancelledVolumeSYP, 500000); // 500000
});

test('computeMonthlyDealStats calculates weekly breakdown correctly', () => {
  const stats = computeMonthlyDealStats(mockDeals, new Date('2026-10-25'));
  assert.equal(stats.weeklyBreakdown.length, 4);

  // Week 1 (Oct 1 - Oct 7): d1 completed, d2 cancelled
  assert.equal(stats.weeklyBreakdown[0].completed, 1);
  assert.equal(stats.weeklyBreakdown[0].cancelled, 1);
  assert.equal(stats.weeklyBreakdown[0].total, 2);

  // Week 2 (Oct 8 - Oct 14): 0
  assert.equal(stats.weeklyBreakdown[1].total, 0);

  // Week 3 (Oct 15 - Oct 21): d3 completed
  assert.equal(stats.weeklyBreakdown[2].completed, 1);
  assert.equal(stats.weeklyBreakdown[2].cancelled, 0);
  assert.equal(stats.weeklyBreakdown[2].total, 1);
});

test('computeMonthlyDealStats captures cancellation reasons', () => {
  const stats = computeMonthlyDealStats(mockDeals, new Date('2026-10-25'));
  assert.equal(stats.cancellationReasons.length, 1);
  assert.match(stats.cancellationReasons[0].reason, /فحص الكراج الفني/);
  assert.equal(stats.cancellationReasons[0].count, 1);
});
