import { Deal, InspectionRequest, CurrencyCode, ListingOperation } from '../types';

export interface CommissionRatesConfig {
  saleRate: number; // in percentage e.g. 2.5
  rentRate: number; // in percentage e.g. 5.0
  inspectionRate: number; // in percentage e.g. 10.0
  lastUpdated?: string;
}

export const DEFAULT_COMMISSION_RATES: CommissionRatesConfig = {
  saleRate: 2.5,
  rentRate: 5.0,
  inspectionRate: 10.0,
  lastUpdated: '2026-10-26',
};

export type CommissionPipelineType = 'sale' | 'rent' | 'inspection';

export interface CommissionPipelineItem {
  id: string;
  type: CommissionPipelineType;
  title: string;
  categoryOrGarage: string;
  buyerOrRequester: string;
  sellerOrProvider: string;
  status: string;
  statusLabelArabic: string;
  baseAmount: number;
  currency: CurrencyCode;
  rateApplied: number; // percentage, e.g. 2.5
  expectedCommission: number;
  expectedCommissionUSD: number;
  expectedCommissionSYP: number;
  dateStr: string;
}

export interface CommissionCategorySummary {
  count: number;
  totalVolumeUSD: number;
  totalVolumeSYP: number;
  expectedEarningsUSD: number;
  expectedEarningsSYP: number;
  effectiveRateAvg: number;
}

export interface CommissionPipelineSummary {
  activeDealsCount: number;
  activeInspectionsCount: number;
  totalActiveItems: number;
  sales: CommissionCategorySummary;
  rentals: CommissionCategorySummary;
  inspections: CommissionCategorySummary;
  totalExpectedUSD: number;
  totalExpectedSYP: number;
  totalCombinedEquivalentUSD: number;
  totalCombinedEquivalentSYP: number;
  items: CommissionPipelineItem[];
}

/**
 * Checks if a deal is considered active (pipeline in progress, awaiting cash or delivery)
 */
export function isDealActiveForCommission(deal: Deal): boolean {
  return [
    'offer',
    'agreement',
    'contract_signed',
    'escrow_pending',
    'escrow_secured',
    'delivery_pending',
  ].includes(deal.status);
}

/**
 * Checks if an inspection request is actively in progress or pending
 */
export function isInspectionActiveForCommission(req: InspectionRequest): boolean {
  return [
    'pending_seller',
    'approved_by_seller',
    'in_inspection',
  ].includes(req.status);
}

/**
 * Translate deal status to friendly Arabic label
 */
export function getDealStatusLabelArabic(status: Deal['status']): string {
  switch (status) {
    case 'escrow_pending':
      return 'بانتظار إيداع العربون لدى الوكيل';
    case 'escrow_secured':
      return 'العربون محجوز في الأمانة (Escrow)';
    case 'contract_signed':
      return 'العقد موقع بانتظار العربون';
    case 'delivery_pending':
      return 'بانتظار فحص الاستلام والتسليم';
    case 'agreement':
      return 'تم التوافق الأولي';
    case 'offer':
      return 'عرض سعر قيد المراجعة';
    case 'completed':
      return 'مكتملة ومحررة';
    case 'cancelled':
      return 'ملغاة';
    case 'disputed':
      return 'نزاع قيد التحكيم';
    default:
      return status;
  }
}

/**
 * Translate inspection status to friendly Arabic label
 */
export function getInspectionStatusLabelArabic(status: InspectionRequest['status']): string {
  switch (status) {
    case 'in_inspection':
      return 'قيد الفحص الفني بالكراج';
    case 'approved_by_seller':
      return 'موافقة البائع - حجز موعد الكراج';
    case 'pending_seller':
      return 'بانتظار موافقة البائع';
    case 'completed':
      return 'فحص مكتمل وموثق';
    case 'declined':
      return 'مرفوض';
    default:
      return status;
  }
}

/**
 * Pure calculation function to calculate commission and expected pipeline earnings
 * from store deals and inspections with current or simulated commission rates.
 */
export function calculateCommissionPipelineSummary(
  deals: Deal[],
  inspections: InspectionRequest[],
  rates: CommissionRatesConfig,
  usdToSypRate: number
): CommissionPipelineSummary {
  const safeRate = usdToSypRate > 0 ? usdToSypRate : 14850;
  const items: CommissionPipelineItem[] = [];

  const salesSummary: CommissionCategorySummary = {
    count: 0,
    totalVolumeUSD: 0,
    totalVolumeSYP: 0,
    expectedEarningsUSD: 0,
    expectedEarningsSYP: 0,
    effectiveRateAvg: rates.saleRate,
  };

  const rentalsSummary: CommissionCategorySummary = {
    count: 0,
    totalVolumeUSD: 0,
    totalVolumeSYP: 0,
    expectedEarningsUSD: 0,
    expectedEarningsSYP: 0,
    effectiveRateAvg: rates.rentRate,
  };

  const inspectionsSummary: CommissionCategorySummary = {
    count: 0,
    totalVolumeUSD: 0,
    totalVolumeSYP: 0,
    expectedEarningsUSD: 0,
    expectedEarningsSYP: 0,
    effectiveRateAvg: rates.inspectionRate,
  };

  // 1. Process Active Deals
  for (const deal of deals) {
    if (!isDealActiveForCommission(deal)) continue;

    const isSale = deal.listingOperation === 'sale';
    const ratePercent = isSale ? rates.saleRate : rates.rentRate;
    const rateDecimal = Math.max(0, ratePercent) / 100;
    const commissionAmount = Math.round(deal.agreedPrice * rateDecimal * 100) / 100;

    let commissionUSD = 0;
    let commissionSYP = 0;

    if (deal.currency === 'USD') {
      commissionUSD = commissionAmount;
      commissionSYP = Math.round(commissionAmount * safeRate);

      if (isSale) {
        salesSummary.totalVolumeUSD += deal.agreedPrice;
        salesSummary.expectedEarningsUSD += commissionUSD;
      } else {
        rentalsSummary.totalVolumeUSD += deal.agreedPrice;
        rentalsSummary.expectedEarningsUSD += commissionUSD;
      }
    } else {
      commissionSYP = commissionAmount;
      commissionUSD = Math.round((commissionAmount / safeRate) * 100) / 100;

      if (isSale) {
        salesSummary.totalVolumeSYP += deal.agreedPrice;
        salesSummary.expectedEarningsSYP += commissionSYP;
      } else {
        rentalsSummary.totalVolumeSYP += deal.agreedPrice;
        rentalsSummary.expectedEarningsSYP += commissionSYP;
      }
    }

    if (isSale) {
      salesSummary.count += 1;
    } else {
      rentalsSummary.count += 1;
    }

    items.push({
      id: deal.id,
      type: isSale ? 'sale' : 'rent',
      title: deal.listingTitle,
      categoryOrGarage: deal.listingCategory,
      buyerOrRequester: deal.buyerName,
      sellerOrProvider: deal.sellerName,
      status: deal.status,
      statusLabelArabic: getDealStatusLabelArabic(deal.status),
      baseAmount: deal.agreedPrice,
      currency: deal.currency,
      rateApplied: ratePercent,
      expectedCommission: commissionAmount,
      expectedCommissionUSD: commissionUSD,
      expectedCommissionSYP: commissionSYP,
      dateStr: new Date(deal.createdAt).toLocaleDateString('ar-SY'),
    });
  }

  // 2. Process Active Inspection Requests
  for (const req of inspections) {
    if (!isInspectionActiveForCommission(req)) continue;

    const ratePercent = rates.inspectionRate;
    const rateDecimal = Math.max(0, ratePercent) / 100;
    const cutAmount = Math.round(req.feeAmount * rateDecimal * 100) / 100;

    let commissionUSD = 0;
    let commissionSYP = 0;

    if (req.currency === 'USD') {
      commissionUSD = cutAmount;
      commissionSYP = Math.round(cutAmount * safeRate);
      inspectionsSummary.totalVolumeUSD += req.feeAmount;
      inspectionsSummary.expectedEarningsUSD += commissionUSD;
    } else {
      commissionSYP = cutAmount;
      commissionUSD = Math.round((cutAmount / safeRate) * 100) / 100;
      inspectionsSummary.totalVolumeSYP += req.feeAmount;
      inspectionsSummary.expectedEarningsSYP += commissionSYP;
    }

    inspectionsSummary.count += 1;

    items.push({
      id: req.id,
      type: 'inspection',
      title: `فحص كراج: ${req.listingTitle}`,
      categoryOrGarage: req.garageName,
      buyerOrRequester: req.buyerName,
      sellerOrProvider: req.garageName,
      status: req.status,
      statusLabelArabic: getInspectionStatusLabelArabic(req.status),
      baseAmount: req.feeAmount,
      currency: req.currency,
      rateApplied: ratePercent,
      expectedCommission: cutAmount,
      expectedCommissionUSD: commissionUSD,
      expectedCommissionSYP: commissionSYP,
      dateStr: new Date(req.createdAt).toLocaleDateString('ar-SY'),
    });
  }

  const totalExpectedUSD =
    salesSummary.expectedEarningsUSD +
    rentalsSummary.expectedEarningsUSD +
    inspectionsSummary.expectedEarningsUSD;

  const totalExpectedSYP =
    salesSummary.expectedEarningsSYP +
    rentalsSummary.expectedEarningsSYP +
    inspectionsSummary.expectedEarningsSYP;

  const totalCombinedEquivalentUSD =
    Math.round((totalExpectedUSD + totalExpectedSYP / safeRate) * 100) / 100;

  const totalCombinedEquivalentSYP =
    Math.round(totalExpectedSYP + totalExpectedUSD * safeRate);

  return {
    activeDealsCount: salesSummary.count + rentalsSummary.count,
    activeInspectionsCount: inspectionsSummary.count,
    totalActiveItems: items.length,
    sales: salesSummary,
    rentals: rentalsSummary,
    inspections: inspectionsSummary,
    totalExpectedUSD,
    totalExpectedSYP,
    totalCombinedEquivalentUSD,
    totalCombinedEquivalentSYP,
    items,
  };
}
