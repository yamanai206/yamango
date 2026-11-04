import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapDealStatusToGroup,
  computeDealStatusDistribution,
  DEAL_STATUS_GROUP_CONFIG,
} from './dealStatusDistribution.ts';
import { Deal } from '../types/index.ts';

const testDeals: Deal[] = [
  {
    id: 'd_1',
    listingId: 'l_1',
    listingTitle: 'جرار بيلاروس 820',
    listingCategory: 'tractors',
    listingOperation: 'sale',
    buyerId: 'b_1',
    buyerName: 'مشتري 1',
    sellerId: 's_1',
    sellerName: 'بائع 1',
    agreedPrice: 9000,
    currency: 'USD',
    depositAmount: 900,
    platformCommissionRate: 0.025,
    platformCommissionAmount: 225,
    status: 'completed',
    zone: 'al_kafr',
    completedAt: '2026-10-10 12:00',
    secretOtp: 'YM-1001',
    contract: { contractNumber: 'C1', termsSummaryArabic: 'عقد', qrVerificationHash: 'H1' },
    createdAt: Date.now() - 100000,
  },
  {
    id: 'd_2',
    listingId: 'l_2',
    listingTitle: 'حفارة كوماتسو PC210',
    listingCategory: 'excavators',
    listingOperation: 'rent',
    buyerId: 'b_2',
    buyerName: 'مشتري 2',
    sellerId: 's_2',
    sellerName: 'بائع 2',
    agreedPrice: 2000000,
    currency: 'SYP',
    depositAmount: 500000,
    platformCommissionRate: 0.05,
    platformCommissionAmount: 100000,
    status: 'escrow_secured', // maps to 'waiting'
    zone: 'suwayda',
    secretOtp: 'YM-1002',
    contract: { contractNumber: 'C2', termsSummaryArabic: 'عقد', qrVerificationHash: 'H2' },
    createdAt: Date.now() - 90000,
  },
  {
    id: 'd_3',
    listingId: 'l_3',
    listingTitle: 'شاحنة مرسيدس قلاب',
    listingCategory: 'trucks',
    listingOperation: 'sale',
    buyerId: 'b_3',
    buyerName: 'مشتري 3',
    sellerId: 's_3',
    sellerName: 'بائع 3',
    agreedPrice: 12000,
    currency: 'USD',
    depositAmount: 1200,
    platformCommissionRate: 0.025,
    platformCommissionAmount: 300,
    status: 'cancelled', // maps to 'cancelled'
    zone: 'shahba',
    cancelledAt: '2026-10-14 10:00',
    cancellationReason: 'رسوب في فحص الكراج',
    secretOtp: 'YM-1003',
    contract: { contractNumber: 'C3', termsSummaryArabic: 'عقد', qrVerificationHash: 'H3' },
    createdAt: Date.now() - 80000,
  },
  {
    id: 'd_4',
    listingId: 'l_4',
    listingTitle: 'سيارة تويوتا هايلوكس',
    listingCategory: 'cars',
    listingOperation: 'sale',
    buyerId: 'b_4',
    buyerName: 'مشتري 4',
    sellerId: 's_4',
    sellerName: 'بائع 4',
    agreedPrice: 15000,
    currency: 'USD',
    depositAmount: 1500,
    platformCommissionRate: 0.025,
    platformCommissionAmount: 375,
    status: 'escrow_pending', // maps to 'pending'
    zone: 'al_kafr',
    secretOtp: 'YM-1004',
    contract: { contractNumber: 'C4', termsSummaryArabic: 'عقد', qrVerificationHash: 'H4' },
    createdAt: Date.now() - 70000,
  },
  {
    id: 'd_5',
    listingId: 'l_5',
    listingTitle: 'جرار فيات 110-90',
    listingCategory: 'tractors',
    listingOperation: 'sale',
    buyerId: 'b_5',
    buyerName: 'مشتري 5',
    sellerId: 's_5',
    sellerName: 'بائع 5',
    agreedPrice: 8000,
    currency: 'USD',
    depositAmount: 800,
    platformCommissionRate: 0.025,
    platformCommissionAmount: 200,
    status: 'contract_signed', // maps to 'pending'
    zone: 'salkhad',
    secretOtp: 'YM-1005',
    contract: { contractNumber: 'C5', termsSummaryArabic: 'عقد', qrVerificationHash: 'H5' },
    createdAt: Date.now() - 60000,
  },
  {
    id: 'd_6',
    listingId: 'l_6',
    listingTitle: 'بلدوزر كوماتسو D65',
    listingCategory: 'heavy_machinery',
    listingOperation: 'rent',
    buyerId: 'b_6',
    buyerName: 'مشتري 6',
    sellerId: 's_6',
    sellerName: 'بائع 6',
    agreedPrice: 3000000,
    currency: 'SYP',
    depositAmount: 600000,
    platformCommissionRate: 0.05,
    platformCommissionAmount: 150000,
    status: 'delivery_pending', // maps to 'waiting'
    zone: 'al_kafr',
    secretOtp: 'YM-1006',
    contract: { contractNumber: 'C6', termsSummaryArabic: 'عقد', qrVerificationHash: 'H6' },
    createdAt: Date.now() - 50000,
  },
];

test('mapDealStatusToGroup maps deal statuses correctly to 4 main groups', () => {
  assert.equal(mapDealStatusToGroup('escrow_pending'), 'pending');
  assert.equal(mapDealStatusToGroup('contract_signed'), 'pending');
  assert.equal(mapDealStatusToGroup('completed'), 'completed');
  assert.equal(mapDealStatusToGroup('cancelled'), 'cancelled');
  assert.equal(mapDealStatusToGroup('disputed'), 'cancelled');
  assert.equal(mapDealStatusToGroup('escrow_secured'), 'waiting');
  assert.equal(mapDealStatusToGroup('delivery_pending'), 'waiting');
  assert.equal(mapDealStatusToGroup('agreement'), 'waiting');
  assert.equal(mapDealStatusToGroup('offer'), 'waiting');
});

test('computeDealStatusDistribution computes exact counts and rates across all 6 test deals', () => {
  const summary = computeDealStatusDistribution(testDeals);

  assert.equal(summary.totalDeals, 6);
  assert.equal(summary.completedDeals, 1);
  assert.equal(summary.cancelledDeals, 1);
  assert.equal(summary.pendingDeals, 2); // d_4, d_5
  assert.equal(summary.waitingDeals, 2); // d_2, d_6
  assert.equal(summary.activePipelineDeals, 4); // 2 pending + 2 waiting

  // Percentages: 1/6 = 16.7%, 2/6 = 33.3%
  assert.equal(summary.completionRate, 16.7);
  assert.equal(summary.cancellationRate, 16.7);
  assert.equal(summary.pipelineRate, 66.7);

  // Volumes
  assert.equal(summary.totalVolumeUSD, 9000 + 12000 + 15000 + 8000); // 44000
  assert.equal(summary.totalVolumeSYP, 2000000 + 3000000); // 5000000
});

test('computeDealStatusDistribution slices contain all 4 groups with correct colors and metadata', () => {
  const summary = computeDealStatusDistribution(testDeals);

  assert.equal(summary.slices.length, 4);
  const completedSlice = summary.slices.find((s) => s.id === 'completed');
  const pendingSlice = summary.slices.find((s) => s.id === 'pending');
  const cancelledSlice = summary.slices.find((s) => s.id === 'cancelled');
  const waitingSlice = summary.slices.find((s) => s.id === 'waiting');

  assert.ok(completedSlice && pendingSlice && cancelledSlice && waitingSlice);
  assert.equal(completedSlice?.count, 1);
  assert.equal(completedSlice?.color, DEAL_STATUS_GROUP_CONFIG.completed.color);
  assert.equal(pendingSlice?.count, 2);
  assert.equal(cancelledSlice?.count, 1);
  assert.equal(waitingSlice?.count, 2);
});

test('computeDealStatusDistribution filters accurately by zone', () => {
  const alKafrSummary = computeDealStatusDistribution(testDeals, { zone: 'al_kafr' });
  // d_1 (completed), d_4 (pending), d_6 (waiting)
  assert.equal(alKafrSummary.totalDeals, 3);
  assert.equal(alKafrSummary.completedDeals, 1);
  assert.equal(alKafrSummary.pendingDeals, 1);
  assert.equal(alKafrSummary.waitingDeals, 1);
  assert.equal(alKafrSummary.cancelledDeals, 0);
  assert.equal(alKafrSummary.selectedZoneLabel, 'بلدة الكفر');
});

test('computeDealStatusDistribution filters accurately by category and operation', () => {
  const tractorsSummary = computeDealStatusDistribution(testDeals, { category: 'tractors' });
  // d_1 (completed, USD 9000), d_5 (pending, USD 8000)
  assert.equal(tractorsSummary.totalDeals, 2);
  assert.equal(tractorsSummary.completedDeals, 1);
  assert.equal(tractorsSummary.pendingDeals, 1);
  assert.equal(tractorsSummary.totalVolumeUSD, 17000);

  const rentSummary = computeDealStatusDistribution(testDeals, { operation: 'rent' });
  // d_2 (waiting), d_6 (waiting)
  assert.equal(rentSummary.totalDeals, 2);
  assert.equal(rentSummary.waitingDeals, 2);
  assert.equal(rentSummary.activePipelineDeals, 2);
});

test('computeDealStatusDistribution handles empty deals gracefully without NaN', () => {
  const emptySummary = computeDealStatusDistribution([]);
  assert.equal(emptySummary.totalDeals, 0);
  assert.equal(emptySummary.completionRate, 0);
  assert.equal(emptySummary.cancellationRate, 0);
  assert.equal(emptySummary.totalVolumeUSD, 0);
  assert.equal(emptySummary.totalVolumeSYP, 0);
  assert.equal(emptySummary.slices.length, 4);
  assert.equal(emptySummary.slices[0].percentage, 0);
});
