import { CurrencyCode } from '../types';

export interface CommissionCalculation {
  basePrice: number;
  currency: CurrencyCode;
  commissionRate: number;
  commissionAmount: number;
  depositRequired: number; // typically 10% or minimum fixed amount
  sellerNetPayout: number;
}

/**
 * Calculates platform commission with tiered volume discount for active merchants
 * Standard: 2.5% for general sales, 5% for rentals
 * High volume (10+ completed deals): 1.5% for sales, 3.5% for rentals
 */
export function calculateEscrowCommission(
  price: number,
  currency: CurrencyCode,
  operation: 'sale' | 'rent',
  sellerCompletedDeals: number = 0
): CommissionCalculation {
  let rate = operation === 'sale' ? 0.025 : 0.05;

  // Tiered discount for frequent trusted dealers
  if (sellerCompletedDeals >= 10) {
    rate = operation === 'sale' ? 0.015 : 0.035;
  } else if (sellerCompletedDeals >= 5) {
    rate = operation === 'sale' ? 0.02 : 0.04;
  }

  const commissionAmount = Math.round(price * rate);
  
  // Deposit required to secure deal in escrow (typically 10% of total price or 1 full day/week rent)
  const depositPercent = operation === 'sale' ? 0.10 : 0.20;
  const depositRequired = Math.max(Math.round(price * depositPercent), currency === 'SYP' ? 250000 : 50);
  const sellerNetPayout = price - commissionAmount;

  return {
    basePrice: price,
    currency,
    commissionRate: rate,
    commissionAmount,
    depositRequired,
    sellerNetPayout,
  };
}

/**
 * Generates an OTP token for the buyer to show the certified payment agent
 * Format: YM-XXXX (e.g. YM-4821)
 */
export function generateAgentVerificationOtp(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `YM-${randomNum}`;
}

/**
 * Regex to detect Syrian mobile phone numbers, international formats, and numbers with spaces/hyphens
 * to protect platform escrow and prevent disintermediation before deposit is secured.
 */
const PHONE_AND_CONTACT_REGEX = /(\+?963\s?9\d{2}[\s-]?\d{3}[\s-]?\d{3}|09\d{2}[\s-]?\d{3}[\s-]?\d{3}|09\d{8}|[٠-٩]{10}|whatsapp|واتساب|رقمي|تواصل معي على|واتس)/gi;

export function filterContactDetails(text: string, isEscrowSecured: boolean): { filteredText: string; hadRestrictedInfo: boolean } {
  if (isEscrowSecured) {
    // Escrow secured: phone sharing is fully allowed
    return { filteredText: text, hadRestrictedInfo: false };
  }

  const hadRestrictedInfo = PHONE_AND_CONTACT_REGEX.test(text);
  const filteredText = text.replace(
    PHONE_AND_CONTACT_REGEX,
    '[تم حجب رقم الهاتف/بيانات الاتصال - تظهر تلقائياً بعد دفع العربون لدى الوكيل لضمان حقك وحمايتك]'
  );

  return { filteredText, hadRestrictedInfo };
}
