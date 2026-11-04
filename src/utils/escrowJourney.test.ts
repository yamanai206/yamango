import test from 'node:test';
import assert from 'node:assert/strict';
import { computeEscrowJourney } from './escrowJourney.ts';
import { Deal } from '../types/index.ts';

const baseDeal: Deal = {
  id: 'deal_test_1',
  listingId: 'list_1',
  listingTitle: 'جرار بيلاروس 820 زراعي',
  listingCategory: 'tractors',
  listingOperation: 'sale',
  buyerId: 'b_1',
  buyerName: 'سعيد الحناوي',
  sellerId: 's_1',
  sellerName: 'منير رضوان',
  agreedPrice: 12000000,
  currency: 'SYP',
  depositAmount: 1200000,
  platformCommissionRate: 0.025,
  platformCommissionAmount: 300000,
  status: 'completed',
  zone: 'al_kafr',
  secretOtp: 'YM-9912',
  escrowConfirmedAt: '2026-10-20 11:30',
  escrowAgentName: 'وكيل الكفر المعتمد (وليد العبدالله)',
  receiptNumber: 'REC-KFR-88912',
  completedAt: '2026-10-22 15:00',
  contract: {
    contractNumber: 'YMG-2026-0912',
    termsSummaryArabic: 'عقد بيع جرار زراعي',
    qrVerificationHash: 'HASH123',
    signedAt: '2026-10-18 10:00',
  },
  deliveryProof: {
    pickupKmOrHours: 2400,
    pickupDate: '2026-10-21',
    conditionVerified: true,
  },
  createdAt: Date.now() - 3600 * 1000 * 96,
};

test('computeEscrowJourney creates exactly 4 stages: بدء, فحص, حجز العربون, إتمام', () => {
  const journey = computeEscrowJourney(baseDeal);
  assert.equal(journey.stages.length, 4);
  assert.equal(journey.stages[0].label, 'بدء');
  assert.equal(journey.stages[1].label, 'فحص');
  assert.equal(journey.stages[2].label, 'حجز العربون');
  assert.equal(journey.stages[3].label, 'إتمام');
});

test('computeEscrowJourney handles completed deal with 100% progress and all completed milestones', () => {
  const journey = computeEscrowJourney(baseDeal);
  assert.equal(journey.isCompleted, true);
  assert.equal(journey.progressPercentage, 100);
  assert.equal(journey.stages.every(s => s.state === 'completed'), true);
  assert.equal(journey.statusBadge.label.includes('مكتملة'), true);
});

test('computeEscrowJourney handles escrow_secured deal with deposit completed and completion in progress', () => {
  const securedDeal: Deal = {
    ...baseDeal,
    status: 'escrow_secured',
    completedAt: undefined,
  };

  const journey = computeEscrowJourney(securedDeal);
  assert.equal(journey.isCompleted, false);
  assert.equal(journey.progressPercentage, 75);

  assert.equal(journey.stages[0].state, 'completed'); // بدء
  assert.equal(journey.stages[1].state, 'completed'); // فحص
  assert.equal(journey.stages[2].state, 'completed'); // حجز العربون
  assert.equal(journey.stages[3].state, 'in_progress'); // إتمام

  assert.ok(journey.stages[2].timestamp);
});

test('computeEscrowJourney handles contract_signed deal awaiting deposit at agent', () => {
  const pendingDeal: Deal = {
    ...baseDeal,
    status: 'contract_signed',
    escrowConfirmedAt: undefined,
    receiptNumber: undefined,
    completedAt: undefined,
    deliveryProof: undefined,
  };

  const journey = computeEscrowJourney(pendingDeal);
  assert.equal(journey.isCompleted, false);
  assert.equal(journey.stages[0].state, 'completed'); // بدء
  assert.equal(journey.stages[2].state, 'in_progress'); // حجز العربون
  assert.equal(journey.stages[3].state, 'pending'); // إتمام
  assert.ok(journey.stages[2].actionRequired?.includes(pendingDeal.secretOtp));
});

test('computeEscrowJourney handles cancelled deal properly', () => {
  const cancelledDeal: Deal = {
    ...baseDeal,
    status: 'cancelled',
    cancelledAt: '2026-10-19 14:00',
    cancellationReason: 'اختلاف رقم الشاصي عند الفحص',
  };

  const journey = computeEscrowJourney(cancelledDeal);
  assert.equal(journey.isCancelled, true);
  assert.equal(journey.statusBadge.label.includes('ملغاة'), true);
  assert.equal(journey.stages[1].state, 'cancelled');
});
