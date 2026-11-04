import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateUsedItemCommission, 
  generateUsedItemOtp, 
  generateUsedOrderId, 
  filterUsedItems, 
  formatUsedItemPrice,
  buildUsedOrderWhatsAppMessage,
  computeUsedGoodsSalesStats
} from './usedGoods.ts';
import { UsedItem, UsedItemOrder } from '../types/index.ts';

const mockUsedItem1: UsedItem = {
  id: 'item_1',
  sellerId: 's_1',
  sellerName: 'منير رضوان',
  sellerPhone: '0933221144',
  sellerRating: 4.9,
  title: 'غسالة LG أوتوماتيك 9 كغ إنفرتر',
  category: 'home_appliances',
  condition: 'excellent',
  price: 4800000,
  currency: 'SYP',
  zone: 'suwayda',
  locationDetails: 'السويداء - طريق قنوات',
  description: 'غسالة بحالة ممتازة وموفرة للطاقة',
  images: ['https://example.com/wash.jpg'],
  platformCommissionRate: 0.035,
  platformCommissionAmount: 168000,
  sellerNetPayout: 4632000,
  status: 'available',
  deliveryOption: 'both',
  createdAt: 1700000000000,
};

const mockUsedItem2: UsedItem = {
  id: 'item_2',
  sellerId: 's_2',
  sellerName: 'أبو فهد الحناوي',
  sellerPhone: '0944112233',
  sellerRating: 4.95,
  title: 'منظومة طاقة شمسية إنفرتر 3.5 كيلو',
  category: 'solar_power',
  condition: 'like_new',
  price: 650,
  currency: 'USD',
  zone: 'al_kafr',
  locationDetails: 'بلدة الكفر',
  description: 'إنفرتر مع بطاريات تيوبلر ممتازة',
  images: ['https://example.com/solar.jpg'],
  platformCommissionRate: 0.035,
  platformCommissionAmount: 23,
  sellerNetPayout: 627,
  status: 'available',
  deliveryOption: 'pickup_in_person',
  createdAt: 1700000050000,
};

test('calculateUsedItemCommission computes exact 3.5% commission and seller net payout', () => {
  const resultSYP = calculateUsedItemCommission(1000000, 'SYP');
  assert.equal(resultSYP.platformCommissionRate, 0.035);
  assert.equal(resultSYP.platformCommissionAmount, 35000);
  assert.equal(resultSYP.sellerNetPayout, 965000);

  const resultUSD = calculateUsedItemCommission(200, 'USD');
  assert.equal(resultUSD.platformCommissionRate, 0.035);
  assert.equal(resultUSD.platformCommissionAmount, 7);
  assert.equal(resultUSD.sellerNetPayout, 193);
});

test('calculateUsedItemCommission supports custom commission rates', () => {
  const result = calculateUsedItemCommission(500, 'USD', 0.05);
  assert.equal(result.platformCommissionRate, 0.05);
  assert.equal(result.platformCommissionAmount, 25);
  assert.equal(result.sellerNetPayout, 475);
});

test('generateUsedItemOtp produces valid UG-XXXX code format', () => {
  const otp = generateUsedItemOtp();
  assert.match(otp, /^UG-\d{4}$/);
});

test('generateUsedOrderId produces valid UGD-XXXX code format', () => {
  const id = generateUsedOrderId();
  assert.match(id, /^UGD-\d{4}$/);
});

test('formatUsedItemPrice formats currencies in Arabic properly', () => {
  const formattedSYP = formatUsedItemPrice(1500000, 'SYP');
  assert.equal(formattedSYP.includes('ل.س'), true);

  const formattedUSD = formatUsedItemPrice(120, 'USD');
  assert.equal(formattedUSD.includes('دولار') || formattedUSD.includes('$'), true);
});

test('filterUsedItems filters accurately by category, zone, and search keyword', () => {
  const items = [mockUsedItem1, mockUsedItem2];

  // Category filter
  const solarOnly = filterUsedItems(items, { category: 'solar_power' });
  assert.equal(solarOnly.length, 1);
  assert.equal(solarOnly[0].id, 'item_2');

  // Zone filter
  const kafrOnly = filterUsedItems(items, { zone: 'al_kafr' });
  assert.equal(kafrOnly.length, 1);
  assert.equal(kafrOnly[0].id, 'item_2');

  // Search keyword filter
  const searchWash = filterUsedItems(items, { search: 'غسالة' });
  assert.equal(searchWash.length, 1);
  assert.equal(searchWash[0].id, 'item_1');

  // Search seller name
  const searchSeller = filterUsedItems(items, { search: 'أبو فهد' });
  assert.equal(searchSeller.length, 1);
  assert.equal(searchSeller[0].id, 'item_2');
});

test('filterUsedItems sorts accurately by price ascending and descending', () => {
  const itemA: UsedItem = { ...mockUsedItem1, id: 'a', price: 100 };
  const itemB: UsedItem = { ...mockUsedItem1, id: 'b', price: 500 };
  const itemC: UsedItem = { ...mockUsedItem1, id: 'c', price: 250 };

  const asc = filterUsedItems([itemA, itemB, itemC], { sortBy: 'price_asc' });
  assert.deepEqual(asc.map(i => i.price), [100, 250, 500]);

  const desc = filterUsedItems([itemA, itemB, itemC], { sortBy: 'price_desc' });
  assert.deepEqual(desc.map(i => i.price), [500, 250, 100]);
});

test('buildUsedOrderWhatsAppMessage includes order id, OTP, and agent details', () => {
  const order: UsedItemOrder = {
    id: 'UGD-9988',
    itemId: 'item_1',
    itemTitle: 'غسالة LG أوتوماتيك',
    itemCategory: 'home_appliances',
    itemCondition: 'excellent',
    itemPrice: 4800000,
    currency: 'SYP',
    commissionRate: 0.035,
    commissionAmount: 168000,
    sellerNetPayout: 4632000,
    buyerId: 'b_1',
    buyerName: 'سعيد مرشد',
    buyerPhone: '0933112233',
    sellerId: 's_1',
    sellerName: 'منير رضوان',
    sellerPhone: '0933221144',
    paymentMethod: 'agent_cash',
    agentId: 'ag_1',
    agentName: 'وليد العبدالله',
    agentAddress: 'بلدة الكفر',
    agentPhone: '0966334455',
    status: 'escrow_secured',
    secretOtp: 'UG-1234',
    deliveryOption: 'pickup_in_person',
    createdAt: Date.now(),
  };

  const msg = buildUsedOrderWhatsAppMessage(order);
  assert.equal(msg.includes('UGD-9988'), true);
  assert.equal(msg.includes('UG-1234'), true);
  assert.equal(msg.includes('غسالة LG'), true);
  assert.equal(msg.includes('وليد العبدالله'), true);
  assert.equal(msg.includes('سعيد مرشد'), true);
  assert.equal(msg.includes('إسكرو'), true);
});

test('computeUsedGoodsSalesStats accurately calculates total sales volume, pending commissions, and category breakdown', () => {
  const testItems: UsedItem[] = [mockUsedItem1, mockUsedItem2];

  const testOrders: UsedItemOrder[] = [
    // Completed USD order in solar_power ($200 USD, $7 commission)
    {
      id: 'UGD-1',
      itemId: 'item_2',
      itemTitle: 'طاقة شمسية',
      itemCategory: 'solar_power',
      itemCondition: 'like_new',
      itemPrice: 200,
      currency: 'USD',
      commissionRate: 0.035,
      commissionAmount: 7,
      sellerNetPayout: 193,
      buyerId: 'b_1',
      buyerName: 'مشتري 1',
      buyerPhone: '0933',
      sellerId: 's_1',
      sellerName: 'بائع 1',
      sellerPhone: '0944',
      paymentMethod: 'agent_cash',
      status: 'completed',
      secretOtp: 'UG-1111',
      deliveryOption: 'pickup_in_person',
      createdAt: Date.now(),
    },
    // Escrow secured USD order in solar_power ($300 USD, $11 commission) -> Pending commission
    {
      id: 'UGD-2',
      itemId: 'item_2',
      itemTitle: 'طاقة شمسية أخرى',
      itemCategory: 'solar_power',
      itemCondition: 'like_new',
      itemPrice: 300,
      currency: 'USD',
      commissionRate: 0.035,
      commissionAmount: 11,
      sellerNetPayout: 289,
      buyerId: 'b_2',
      buyerName: 'مشتري 2',
      buyerPhone: '0933',
      sellerId: 's_1',
      sellerName: 'بائع 1',
      sellerPhone: '0944',
      paymentMethod: 'agent_cash',
      status: 'escrow_secured',
      secretOtp: 'UG-2222',
      deliveryOption: 'pickup_in_person',
      createdAt: Date.now(),
    },
    // Completed SYP order in home_appliances (1,000,000 SYP, 35,000 commission)
    {
      id: 'UGD-3',
      itemId: 'item_1',
      itemTitle: 'غسالة',
      itemCategory: 'home_appliances',
      itemCondition: 'excellent',
      itemPrice: 1000000,
      currency: 'SYP',
      commissionRate: 0.035,
      commissionAmount: 35000,
      sellerNetPayout: 965000,
      buyerId: 'b_3',
      buyerName: 'مشتري 3',
      buyerPhone: '0933',
      sellerId: 's_2',
      sellerName: 'بائع 2',
      sellerPhone: '0944',
      paymentMethod: 'syriatel_cash',
      status: 'completed',
      secretOtp: 'UG-3333',
      deliveryOption: 'local_delivery',
      createdAt: Date.now(),
    },
    // Pending payment SYP order in home_appliances (2,000,000 SYP, 70,000 commission) -> Pending commission
    {
      id: 'UGD-4',
      itemId: 'item_1',
      itemTitle: 'براد',
      itemCategory: 'home_appliances',
      itemCondition: 'good',
      itemPrice: 2000000,
      currency: 'SYP',
      commissionRate: 0.035,
      commissionAmount: 70000,
      sellerNetPayout: 1930000,
      buyerId: 'b_4',
      buyerName: 'مشتري 4',
      buyerPhone: '0933',
      sellerId: 's_2',
      sellerName: 'بائع 2',
      sellerPhone: '0944',
      paymentMethod: 'agent_cash',
      status: 'escrow_secured',
      secretOtp: 'UG-4444',
      deliveryOption: 'pickup_in_person',
      createdAt: Date.now(),
    },
    // Cancelled order (should NOT count in volume or pending commission)
    {
      id: 'UGD-5',
      itemId: 'item_1',
      itemTitle: 'فرن ملغي',
      itemCategory: 'home_appliances',
      itemCondition: 'good',
      itemPrice: 500000,
      currency: 'SYP',
      commissionRate: 0.035,
      commissionAmount: 17500,
      sellerNetPayout: 482500,
      buyerId: 'b_5',
      buyerName: 'مشتري 5',
      buyerPhone: '0933',
      sellerId: 's_2',
      sellerName: 'بائع 2',
      sellerPhone: '0944',
      paymentMethod: 'agent_cash',
      status: 'cancelled',
      secretOtp: 'UG-5555',
      deliveryOption: 'pickup_in_person',
      createdAt: Date.now(),
    },
  ];

  const stats = computeUsedGoodsSalesStats(testOrders, testItems, 10000);

  // Completed sales
  assert.equal(stats.completedSalesUSD, 200);
  assert.equal(stats.completedSalesSYP, 1000000);

  // Escrow sales
  assert.equal(stats.escrowSalesUSD, 300);
  assert.equal(stats.escrowSalesSYP, 2000000);

  // Total sales volume
  assert.equal(stats.totalSalesVolumeUSD, 500); // 200 + 300
  assert.equal(stats.totalSalesVolumeSYP, 3000000); // 1,000,000 + 2,000,000

  // Normalized USD at 10,000 SYP/USD: 500 + (3000000 / 10000) = 500 + 300 = 800
  assert.equal(stats.normalizedTotalSalesUSD, 800);

  // Pending commissions (from escrow orders)
  assert.equal(stats.pendingCommissionsUSD, 11);
  assert.equal(stats.pendingCommissionsSYP, 70000);

  // Realized commissions (from completed orders)
  assert.equal(stats.realizedCommissionsUSD, 7);
  assert.equal(stats.realizedCommissionsSYP, 35000);

  // Counts (excluding cancelled)
  assert.equal(stats.totalOrdersCount, 4);
  assert.equal(stats.completedOrdersCount, 2);
  assert.equal(stats.escrowOrdersCount, 2);

  // Category breakdown checks
  const solarStat = stats.categoryStats.find(c => c.category === 'solar_power');
  assert.ok(solarStat);
  assert.equal(solarStat.totalVolumeUSD, 500);
  assert.equal(solarStat.pendingCommissionUSD, 11);
  assert.equal(solarStat.realizedCommissionUSD, 7);
  assert.equal(solarStat.totalOrdersCount, 2);

  const homeStat = stats.categoryStats.find(c => c.category === 'home_appliances');
  assert.ok(homeStat);
  assert.equal(homeStat.totalVolumeSYP, 3000000);
  assert.equal(homeStat.pendingCommissionSYP, 70000);
  assert.equal(homeStat.realizedCommissionSYP, 35000);
  assert.equal(homeStat.totalOrdersCount, 2);

  // Top category is identified
  assert.ok(stats.topPerformingCategory);
});

