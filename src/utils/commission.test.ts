import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCommissionPipelineSummary,
  isDealActiveForCommission,
  isInspectionActiveForCommission,
  DEFAULT_COMMISSION_RATES,
  CommissionRatesConfig,
} from './commission';
import { Deal, InspectionRequest } from '../types';

test('isDealActiveForCommission properly identifies pipeline deals vs concluded deals', () => {
  const pendingDeal: Partial<Deal> = { status: 'escrow_pending' };
  const securedDeal: Partial<Deal> = { status: 'escrow_secured' };
  const completedDeal: Partial<Deal> = { status: 'completed' };
  const cancelledDeal: Partial<Deal> = { status: 'cancelled' };

  assert.equal(isDealActiveForCommission(pendingDeal as Deal), true);
  assert.equal(isDealActiveForCommission(securedDeal as Deal), true);
  assert.equal(isDealActiveForCommission(completedDeal as Deal), false);
  assert.equal(isDealActiveForCommission(cancelledDeal as Deal), false);
});

test('isInspectionActiveForCommission identifies active inspections vs finished ones', () => {
  const inInspection: Partial<InspectionRequest> = { status: 'in_inspection' };
  const approvedBySeller: Partial<InspectionRequest> = { status: 'approved_by_seller' };
  const completedReq: Partial<InspectionRequest> = { status: 'completed' };
  const declinedReq: Partial<InspectionRequest> = { status: 'declined' };

  assert.equal(isInspectionActiveForCommission(inInspection as InspectionRequest), true);
  assert.equal(isInspectionActiveForCommission(approvedBySeller as InspectionRequest), true);
  assert.equal(isInspectionActiveForCommission(completedReq as InspectionRequest), false);
  assert.equal(isInspectionActiveForCommission(declinedReq as InspectionRequest), false);
});

test('calculateCommissionPipelineSummary computes exact earnings per category and converts currencies correctly', () => {
  const mockDeals: Partial<Deal>[] = [
    // Active Sale Deal in USD: $10,000 @ 2.5% = $250
    {
      id: 'd1',
      listingTitle: 'جرار بيلاروس',
      listingCategory: 'tractors',
      listingOperation: 'sale',
      buyerName: 'مشتري 1',
      sellerName: 'بائع 1',
      agreedPrice: 10000,
      currency: 'USD',
      status: 'escrow_pending',
      createdAt: Date.now(),
    },
    // Active Rent Deal in SYP: 2,000,000 SYP @ 5.0% = 100,000 SYP
    {
      id: 'd2',
      listingTitle: 'حفارة كوماتسو',
      listingCategory: 'excavators',
      listingOperation: 'rent',
      buyerName: 'مستأجر 1',
      sellerName: 'مؤجر 1',
      agreedPrice: 2000000,
      currency: 'SYP',
      status: 'escrow_secured',
      createdAt: Date.now(),
    },
    // Completed Deal - should be excluded from active pipeline
    {
      id: 'd3',
      listingTitle: 'سيارة تويوتا',
      listingCategory: 'cars',
      listingOperation: 'sale',
      buyerName: 'مشتري 2',
      sellerName: 'بائع 2',
      agreedPrice: 15000,
      currency: 'USD',
      status: 'completed',
      createdAt: Date.now(),
    },
  ];

  const mockInspections: Partial<InspectionRequest>[] = [
    // Active Inspection in SYP: 200,000 SYP @ 10% = 20,000 SYP
    {
      id: 'req1',
      listingTitle: 'شاحنة مرسيدس',
      garageName: 'كراج الكفر الفني',
      buyerName: 'طالب الفحص',
      status: 'in_inspection',
      feeAmount: 200000,
      currency: 'SYP',
      createdAt: Date.now(),
    },
    // Completed Inspection - should be excluded
    {
      id: 'req2',
      listingTitle: 'جرار نيوهولند',
      garageName: 'مركز السويداء الدولي',
      buyerName: 'طالب الفحص 2',
      status: 'completed',
      feeAmount: 180000,
      currency: 'SYP',
      createdAt: Date.now(),
    },
  ];

  const rates: CommissionRatesConfig = {
    saleRate: 2.5,
    rentRate: 5.0,
    inspectionRate: 10.0,
  };

  const exchangeRate = 15000; // 1 USD = 15,000 SYP

  const summary = calculateCommissionPipelineSummary(
    mockDeals as Deal[],
    mockInspections as InspectionRequest[],
    rates,
    exchangeRate
  );

  assert.equal(summary.activeDealsCount, 2);
  assert.equal(summary.activeInspectionsCount, 1);
  assert.equal(summary.totalActiveItems, 3);

  // Sales check
  assert.equal(summary.sales.count, 1);
  assert.equal(summary.sales.totalVolumeUSD, 10000);
  assert.equal(summary.sales.expectedEarningsUSD, 250);

  // Rentals check
  assert.equal(summary.rentals.count, 1);
  assert.equal(summary.rentals.totalVolumeSYP, 2000000);
  assert.equal(summary.rentals.expectedEarningsSYP, 100000);

  // Inspections check
  assert.equal(summary.inspections.count, 1);
  assert.equal(summary.inspections.totalVolumeSYP, 200000);
  assert.equal(summary.inspections.expectedEarningsSYP, 20000);

  // Total Expected
  assert.equal(summary.totalExpectedUSD, 250);
  assert.equal(summary.totalExpectedSYP, 120000); // 100k (rent) + 20k (inspection)

  // Equivalent checks:
  // Combined equivalent USD: 250 + (120,000 / 15,000) = 250 + 8 = 258 USD
  assert.equal(summary.totalCombinedEquivalentUSD, 258);

  // Combined equivalent SYP: 120,000 + (250 * 15,000) = 120,000 + 3,750,000 = 3,870,000 SYP
  assert.equal(summary.totalCombinedEquivalentSYP, 3870000);
});

test('Simulating higher rates increases expected earnings proportionately', () => {
  const mockDeals: Partial<Deal>[] = [
    {
      id: 'd1',
      listingTitle: 'جرار بيلاروس',
      listingOperation: 'sale',
      agreedPrice: 10000,
      currency: 'USD',
      status: 'escrow_pending',
      createdAt: Date.now(),
    },
  ];

  const defaultSummary = calculateCommissionPipelineSummary(
    mockDeals as Deal[],
    [],
    DEFAULT_COMMISSION_RATES, // 2.5%
    15000
  );
  assert.equal(defaultSummary.totalExpectedUSD, 250);

  // Simulated 4.0%
  const simulatedSummary = calculateCommissionPipelineSummary(
    mockDeals as Deal[],
    [],
    { ...DEFAULT_COMMISSION_RATES, saleRate: 4.0 },
    15000
  );
  assert.equal(simulatedSummary.totalExpectedUSD, 400);
});
