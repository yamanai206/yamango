import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEscrowCommission, generateAgentVerificationOtp, filterContactDetails } from './escrow.ts';

test('calculateEscrowCommission computes correct rates and tiered discounts', () => {
  // Standard sales (2.5%)
  const standardSale = calculateEscrowCommission(10000, 'USD', 'sale', 0);
  assert.equal(standardSale.commissionRate, 0.025);
  assert.equal(standardSale.commissionAmount, 250);
  assert.equal(standardSale.sellerNetPayout, 9750);

  // High-volume dealer sales (1.5%)
  const dealerSale = calculateEscrowCommission(10000, 'USD', 'sale', 12);
  assert.equal(dealerSale.commissionRate, 0.015);
  assert.equal(dealerSale.commissionAmount, 150);
  assert.equal(dealerSale.sellerNetPayout, 9850);
});

test('generateAgentVerificationOtp produces valid formatted code', () => {
  const otp = generateAgentVerificationOtp();
  assert.match(otp, /^YM-\d{4}$/);
});

test('filterContactDetails redacts phone numbers before escrow is secured', () => {
  const chatMsg = 'مرحباً، تفضل اتصل بي على الرقم 0933123456 لنتفق';
  const unverifiedResult = filterContactDetails(chatMsg, false);
  assert.equal(unverifiedResult.hadRestrictedInfo, true);
  assert.match(unverifiedResult.filteredText, /\[تم حجب رقم الهاتف/);

  // Once escrow is secured, phone is visible
  const verifiedResult = filterContactDetails(chatMsg, true);
  assert.equal(verifiedResult.hadRestrictedInfo, false);
  assert.equal(verifiedResult.filteredText, chatMsg);
});
