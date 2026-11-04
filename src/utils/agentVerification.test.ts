import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateAgentVerificationOtp,
  normalizeOtp,
  isValidOtpFormat,
  findDealByVerificationCode,
  extractVerificationCodes,
  calculateAgentMetrics,
} from './agentVerification';
import { Deal, PaymentAgent } from '../types';

test('generateAgentVerificationOtp generates valid YM-XXXX code format', () => {
  const code = generateAgentVerificationOtp();
  assert.match(code, /^YM-[0-9]{4}$/);
});

test('normalizeOtp cleans up spaces, lowercase, and converts Arabic digits', () => {
  assert.equal(normalizeOtp('  ym-4921  '), 'YM-4921');
  assert.equal(normalizeOtp('ym-٤٩٢١'), 'YM-4921');
});

test('isValidOtpFormat validates correct vs invalid formats', () => {
  assert.equal(isValidOtpFormat('YM-8492'), true);
  assert.equal(isValidOtpFormat('ym-12345'), true);
  assert.equal(isValidOtpFormat('1234'), false);
  assert.equal(isValidOtpFormat('INVALID-CODE'), false);
});

test('findDealByVerificationCode finds deal accurately regardless of case and whitespace', () => {
  const mockDeals: Partial<Deal>[] = [
    { id: 'deal_1', secretOtp: 'YM-9912', listingTitle: 'تويوتا هايلوكس' },
    { id: 'deal_2', secretOtp: 'YM-3190', listingTitle: 'حفارة كوماتسو' },
  ];

  const found1 = findDealByVerificationCode(mockDeals as Deal[], 'ym-9912');
  assert.ok(found1);
  assert.equal(found1?.id, 'deal_1');

  const found2 = findDealByVerificationCode(mockDeals as Deal[], '  YM-3190 ');
  assert.ok(found2);
  assert.equal(found2?.id, 'deal_2');

  const notFound = findDealByVerificationCode(mockDeals as Deal[], 'YM-0000');
  assert.equal(notFound, undefined);
});

test('extractVerificationCodes filters by search query and escrow status', () => {
  const mockDeals: Partial<Deal>[] = [
    {
      id: 'deal_101',
      secretOtp: 'YM-8492',
      listingTitle: 'جرار بيلاروس',
      buyerName: 'بهاء الدين مرشد',
      sellerName: 'أبو فهد الحناوي',
      agreedPrice: 9000,
      depositAmount: 900,
      currency: 'USD',
      status: 'escrow_pending',
      createdAt: 1000,
    },
    {
      id: 'deal_102',
      secretOtp: 'YM-3190',
      listingTitle: 'حفارة كوماتسو',
      buyerName: 'بهاء الدين مرشد',
      sellerName: 'مكتب الجبل',
      agreedPrice: 1950000,
      depositAmount: 500000,
      currency: 'SYP',
      status: 'escrow_secured',
      escrowAgentName: 'نقطة الأمانة - الكفر',
      createdAt: 2000,
    },
  ];

  const allCodes = extractVerificationCodes(mockDeals as Deal[], '', 'all');
  assert.equal(allCodes.length, 2);

  const pendingOnly = extractVerificationCodes(mockDeals as Deal[], '', 'pending');
  assert.equal(pendingOnly.length, 1);
  assert.equal(pendingOnly[0].dealId, 'deal_101');

  const searchHit = extractVerificationCodes(mockDeals as Deal[], '8492', 'all');
  assert.equal(searchHit.length, 1);
  assert.equal(searchHit[0].code, 'YM-8492');
});

test('calculateAgentMetrics computes totals and active counts accurately', () => {
  const mockAgents: PaymentAgent[] = [
    {
      id: 'ag_1',
      name: 'وليد العبدالله',
      agencyName: 'نقطة الكفر',
      zone: 'al_kafr',
      address: 'الكفر',
      phone: '0966334455',
      balanceSYP: 500000,
      balanceUSD: 200,
      isActive: true,
    },
    {
      id: 'ag_2',
      name: 'معن قطيش',
      agencyName: 'نقطة السويداء',
      zone: 'suwayda',
      address: 'السويداء',
      phone: '0933112233',
      balanceSYP: 300000,
      balanceUSD: 100,
      isActive: false,
    },
  ];

  const mockDeals: Partial<Deal>[] = [
    { id: 'd1', status: 'escrow_secured' },
    { id: 'd2', status: 'completed' },
    { id: 'd3', status: 'escrow_pending' },
  ];

  const metrics = calculateAgentMetrics(mockAgents, mockDeals as Deal[]);
  assert.equal(metrics.totalAgents, 2);
  assert.equal(metrics.activeAgents, 1);
  assert.equal(metrics.inactiveAgents, 1);
  assert.equal(metrics.totalFloatUSD, 300);
  assert.equal(metrics.totalFloatSYP, 800000);
  assert.equal(metrics.dealsSecuredCount, 2);
});
