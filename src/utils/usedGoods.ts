import { UsedItem, UsedItemCategory, UsedItemCondition, UsedItemOrder, UsedItemPaymentMethod, CurrencyCode, ZoneLocation } from '../types';

/**
 * Standard platform commission rate for used items: 3.5% (0.035)
 */
export const DEFAULT_USED_GOODS_COMMISSION_RATE = 0.035;

/**
 * Category Arabic Labels & Badges
 */
export const USED_CATEGORY_LABELS: Record<UsedItemCategory, { label: string; iconName: string; description: string }> = {
  home_appliances: {
    label: 'أدوات وأجهزة منزلية',
    iconName: 'Refrigerator',
    description: 'غسالات، برادات، أفران، ماكينات وأجهزة مطبخ',
  },
  furniture: {
    label: 'أثاث ومفروشات',
    iconName: 'Armchair',
    description: 'كنبايات، طاولات سفرة، غرف نوم، ومفروشات صالون',
  },
  electronics: {
    label: 'إلكترونيات وهواتف',
    iconName: 'Tv',
    description: 'شاشات تلفزيون، لابتوبات، هواتف، وأجهزة ذكية',
  },
  solar_power: {
    label: 'طاقة شمسية وبطاريات',
    iconName: 'SunMedium',
    description: 'إنفرترات، ألواح شمسية، بطاريات تيوبلر وليثيوم',
  },
  tools: {
    label: 'عِدَد ومعدات ورشات',
    iconName: 'Wrench',
    description: 'هيلتي، شنيور، دريل، بوكسات ومعدات ميكانيك يدوية',
  },
  other: {
    label: 'أغراض ومقتنيات متنوعة',
    iconName: 'Package',
    description: 'دراجات هوائية، كتب، مقتنيات وتجهيزات عامة',
  },
};

/**
 * Condition Arabic Labels & Color Schemes
 */
export const USED_CONDITION_CONFIG: Record<UsedItemCondition, { label: string; bgClass: string; textClass: string; borderClass: string; badge: string }> = {
  like_new: {
    label: 'كالجديد (استخدام نادر)',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-300',
    badge: 'كالجديد',
  },
  excellent: {
    label: 'ممتاز (نظيف جداً بدون عيوب)',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-300',
    badge: 'ممتاز',
  },
  very_good: {
    label: 'جيد جداً (آثار استخدام طفيفة)',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-300',
    badge: 'جيد جداً',
  },
  good: {
    label: 'جيد (يعمل بكفاءة كاملة)',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-800',
    borderClass: 'border-slate-300',
    badge: 'جيد',
  },
  needs_repair: {
    label: 'بحاجة صيانة / فحص بسيط',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-300',
    badge: 'يحتاج صيانة',
  },
};

/**
 * Payment Methods Arabic Details
 */
export const USED_PAYMENT_METHODS: Record<UsedItemPaymentMethod, {
  label: string;
  subLabel: string;
  badge: string;
  requiresAgent: boolean;
}> = {
  agent_cash: {
    label: 'دفع كاش عبر وكيل معتمد',
    subLabel: 'تسليم المبلغ نقداً لوكيل يامانغو المعتمد في منطقتك مع إيصال رسمي ورمز OTP',
    badge: 'كاش معتمد',
    requiresAgent: true,
  },
  syriatel_cash: {
    label: 'سيرياتيل كاش / MTN كاش',
    subLabel: 'تحويل فوري إلى محفظة يامانغو المعتمدة لضمان حق المشتري والبائع',
    badge: 'دفع إلكتروني',
    requiresAgent: false,
  },
  al_haram: {
    label: 'حوالة الهرم / الفؤاد الداخلية',
    subLabel: 'إيداع عبر مكاتب الهرم أو الفؤاد لحساب الضمان المعتمد',
    badge: 'حوالة داخلية',
    requiresAgent: false,
  },
  hand_to_hand_escrow: {
    label: 'استلام يدوي مع فحص مباشر وإسكرو',
    subLabel: 'معاينة الغرض على أرض الواقع وتسليم المبلغ للبائع فور تأكيد السلامة برمز التحقق',
    badge: 'معاينة يدوية',
    requiresAgent: false,
  },
};

/**
 * Calculate transparent platform commission and seller payout
 */
export function calculateUsedItemCommission(
  price: number,
  currency: CurrencyCode,
  rate: number = DEFAULT_USED_GOODS_COMMISSION_RATE
) {
  const commissionRate = rate;
  const commissionAmount = Math.round(price * commissionRate);
  const sellerNetPayout = Math.max(0, price - commissionAmount);

  return {
    price,
    currency,
    commissionRate,
    commissionAmount,
    platformCommissionRate: commissionRate,
    platformCommissionAmount: commissionAmount,
    sellerNetPayout,
  };
}

/**
 * Generates an OTP verification code for the buyer to show agent or seller
 * e.g. "UG-7419"
 */
export function generateUsedItemOtp(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `UG-${num}`;
}

/**
 * Generates a unique order ID
 * e.g. "UGD-5821"
 */
export function generateUsedOrderId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `UGD-${num}`;
}

/**
 * Formats price in Arabic with currency symbol
 */
export function formatUsedItemPrice(amount: number, currency: CurrencyCode): string {
  const formatted = amount.toLocaleString('ar-SY');
  return currency === 'USD' ? `${formatted} دولار ($)` : `${formatted} ل.س`;
}

/**
 * Builds WhatsApp message for sharing an order receipt
 */
export function buildUsedOrderWhatsAppMessage(order: UsedItemOrder): string {
  const priceFormatted = formatUsedItemPrice(order.itemPrice, order.currency);
  const commissionFormatted = formatUsedItemPrice(order.commissionAmount, order.currency);
  const netFormatted = formatUsedItemPrice(order.sellerNetPayout, order.currency);
  const methodLabel = USED_PAYMENT_METHODS[order.paymentMethod].label;

  return [
    `📦 *طلب شراء وضمان غرض مستعمل - منصة yamango*`,
    `🔢 *رقم الطلب:* ${order.id}`,
    `🔑 *رمز التحقق السري (OTP):* ${order.secretOtp}`,
    `🏷️ *الغرض:* ${order.itemTitle}`,
    `💰 *السعر المطلوب:* ${priceFormatted}`,
    `💼 *عمولة المنصة والضمان (3.5%):* ${commissionFormatted}`,
    `💵 *صافي المستحق للبائع:* ${netFormatted}`,
    `💳 *طريقة الدفع:* ${methodLabel}`,
    order.agentName ? `🏢 *الوكيل المعتمد:* ${order.agentName} (${order.agentAddress || ''})` : '',
    `👤 *المشتري:* ${order.buyerName} (${order.buyerPhone})`,
    `🏪 *البائع:* ${order.sellerName} (${order.sellerPhone})`,
    '',
    `🛡️ *المبلغ محجوز بأمان تحت وصاية إسكرو يامانغو حتى المعاينة والاستلام.*`,
  ].filter(Boolean).join('\n');
}

/**
 * Filter used items by search query, category, zone, and condition
 */
export function filterUsedItems(
  items: UsedItem[],
  filters: {
    category?: UsedItemCategory | 'all';
    zone?: ZoneLocation | 'all';
    condition?: UsedItemCondition | 'all';
    search?: string;
    sortBy?: 'newest' | 'price_asc' | 'price_desc';
  }
): UsedItem[] {
  let result = items.filter((item) => {
    if (filters.category && filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }
    if (filters.zone && filters.zone !== 'all' && item.zone !== filters.zone) {
      return false;
    }
    if (filters.condition && filters.condition !== 'all' && item.condition !== filters.condition) {
      return false;
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchLoc = item.locationDetails.toLowerCase().includes(q);
      const matchSeller = item.sellerName.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchSeller) {
        return false;
      }
    }
    return true;
  });

  if (filters.sortBy === 'price_asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (filters.sortBy === 'price_desc') {
    result.sort((a, b) => b.price - a.price);
  } else {
    // newest first
    result.sort((a, b) => b.createdAt - a.createdAt);
  }

  return result;
}

/**
 * Chart display configuration & styling per category
 */
export const USED_CATEGORY_CHART_CONFIG: Record<
  UsedItemCategory,
  {
    label: string;
    shortLabel: string;
    fillColor: string;
    badgeBg: string;
  }
> = {
  home_appliances: {
    label: 'أدوات وأجهزة منزلية',
    shortLabel: 'أجهزة منزلية',
    fillColor: '#0284c7', // Sky blue
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  furniture: {
    label: 'أثاث ومفروشات',
    shortLabel: 'أثاث ومفروشات',
    fillColor: '#d97706', // Amber
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  electronics: {
    label: 'إلكترونيات وهواتف',
    shortLabel: 'إلكترونيات',
    fillColor: '#8b5cf6', // Violet
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  solar_power: {
    label: 'طاقة شمسية وبطاريات',
    shortLabel: 'طاقة شمسية',
    fillColor: '#10b981', // Emerald
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  tools: {
    label: 'عِدَد ومعدات ورشات',
    shortLabel: 'عِدَد ورشات',
    fillColor: '#f97316', // Orange
    badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  other: {
    label: 'أغراض ومقتنيات متنوعة',
    shortLabel: 'متنوعات',
    fillColor: '#64748b', // Slate
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

export interface CategoryPerformanceStat {
  category: UsedItemCategory;
  label: string;
  shortLabel: string;
  fillColor: string;
  badgeBg: string;
  // Volumes
  completedVolumeUSD: number;
  completedVolumeSYP: number;
  escrowVolumeUSD: number;
  escrowVolumeSYP: number;
  totalVolumeUSD: number;
  totalVolumeSYP: number;
  normalizedVolumeUSD: number;
  // Commissions (3.5%)
  pendingCommissionUSD: number;
  pendingCommissionSYP: number;
  realizedCommissionUSD: number;
  realizedCommissionSYP: number;
  totalCommissionUSD: number;
  totalCommissionSYP: number;
  normalizedCommissionUSD: number;
  // Counts
  totalOrdersCount: number;
  completedOrdersCount: number;
  escrowOrdersCount: number;
  availableItemsCount: number;
}

export interface UsedGoodsSalesStats {
  // Sales Volume
  completedSalesUSD: number;
  completedSalesSYP: number;
  escrowSalesUSD: number;
  escrowSalesSYP: number;
  totalSalesVolumeUSD: number;
  totalSalesVolumeSYP: number;
  normalizedTotalSalesUSD: number;

  // Platform Commissions
  pendingCommissionsUSD: number;
  pendingCommissionsSYP: number;
  realizedCommissionsUSD: number;
  realizedCommissionsSYP: number;
  totalCommissionsUSD: number;
  totalCommissionsSYP: number;
  normalizedPendingCommissionsUSD: number;
  normalizedRealizedCommissionsUSD: number;
  normalizedTotalCommissionsUSD: number;

  // Counts
  totalOrdersCount: number;
  completedOrdersCount: number;
  escrowOrdersCount: number;
  pendingPaymentOrdersCount: number;
  availableItemsCount: number;
  usdToSypRate: number;

  // Category Breakdown for Bar Chart
  categoryStats: CategoryPerformanceStat[];
  topPerformingCategory: CategoryPerformanceStat;
}

/**
 * Computes sales volume, pending commissions, and category performance breakdown
 * for the Used Goods marketplace.
 */
export function computeUsedGoodsSalesStats(
  orders: UsedItemOrder[],
  items: UsedItem[],
  usdToSypRate: number = 14850
): UsedGoodsSalesStats {
  let completedSalesUSD = 0;
  let completedSalesSYP = 0;
  let escrowSalesUSD = 0;
  let escrowSalesSYP = 0;

  let pendingCommissionsUSD = 0;
  let pendingCommissionsSYP = 0;
  let realizedCommissionsUSD = 0;
  let realizedCommissionsSYP = 0;

  let totalOrdersCount = 0;
  let completedOrdersCount = 0;
  let escrowOrdersCount = 0;
  let pendingPaymentOrdersCount = 0;

  for (const order of orders) {
    if (order.status === 'cancelled') continue;

    totalOrdersCount++;

    if (order.status === 'completed') {
      completedOrdersCount++;
      if (order.currency === 'USD') {
        completedSalesUSD += order.itemPrice;
        realizedCommissionsUSD += order.commissionAmount;
      } else {
        completedSalesSYP += order.itemPrice;
        realizedCommissionsSYP += order.commissionAmount;
      }
    } else if (order.status === 'escrow_secured' || order.status === 'delivered') {
      escrowOrdersCount++;
      if (order.currency === 'USD') {
        escrowSalesUSD += order.itemPrice;
        pendingCommissionsUSD += order.commissionAmount;
      } else {
        escrowSalesSYP += order.itemPrice;
        pendingCommissionsSYP += order.commissionAmount;
      }
    } else if (order.status === 'pending_payment') {
      pendingPaymentOrdersCount++;
      if (order.currency === 'USD') {
        pendingCommissionsUSD += order.commissionAmount;
      } else {
        pendingCommissionsSYP += order.commissionAmount;
      }
    }
  }

  const totalSalesVolumeUSD = completedSalesUSD + escrowSalesUSD;
  const totalSalesVolumeSYP = completedSalesSYP + escrowSalesSYP;
  const normalizedTotalSalesUSD = totalSalesVolumeUSD + Math.round(totalSalesVolumeSYP / usdToSypRate);

  const totalCommissionsUSD = pendingCommissionsUSD + realizedCommissionsUSD;
  const totalCommissionsSYP = pendingCommissionsSYP + realizedCommissionsSYP;
  const normalizedPendingCommissionsUSD = pendingCommissionsUSD + Math.round(pendingCommissionsSYP / usdToSypRate);
  const normalizedRealizedCommissionsUSD = realizedCommissionsUSD + Math.round(realizedCommissionsSYP / usdToSypRate);
  const normalizedTotalCommissionsUSD = normalizedPendingCommissionsUSD + normalizedRealizedCommissionsUSD;

  const availableItemsCount = items.filter((i) => i.status === 'available').length;

  // Category breakdown
  const categoryKeys: UsedItemCategory[] = [
    'home_appliances',
    'furniture',
    'electronics',
    'solar_power',
    'tools',
    'other',
  ];

  const categoryStats: CategoryPerformanceStat[] = categoryKeys.map((cat) => {
    const config = USED_CATEGORY_CHART_CONFIG[cat];
    const catOrders = orders.filter((o) => o.itemCategory === cat && o.status !== 'cancelled');
    const catItems = items.filter((i) => i.category === cat && i.status === 'available');

    let completedUSD = 0;
    let completedSYP = 0;
    let escrowUSD = 0;
    let escrowSYP = 0;
    let pendingCommUSD = 0;
    let pendingCommSYP = 0;
    let realizedCommUSD = 0;
    let realizedCommSYP = 0;
    let completedCount = 0;
    let escrowCount = 0;

    for (const o of catOrders) {
      if (o.status === 'completed') {
        completedCount++;
        if (o.currency === 'USD') {
          completedUSD += o.itemPrice;
          realizedCommUSD += o.commissionAmount;
        } else {
          completedSYP += o.itemPrice;
          realizedCommSYP += o.commissionAmount;
        }
      } else if (o.status === 'escrow_secured' || o.status === 'delivered') {
        escrowCount++;
        if (o.currency === 'USD') {
          escrowUSD += o.itemPrice;
          pendingCommUSD += o.commissionAmount;
        } else {
          escrowSYP += o.itemPrice;
          pendingCommSYP += o.commissionAmount;
        }
      } else if (o.status === 'pending_payment') {
        if (o.currency === 'USD') {
          pendingCommUSD += o.commissionAmount;
        } else {
          pendingCommSYP += o.commissionAmount;
        }
      }
    }

    const totalUSD = completedUSD + escrowUSD;
    const totalSYP = completedSYP + escrowSYP;
    const normalizedUSD = totalUSD + Math.round(totalSYP / usdToSypRate);

    const totalCommUSD = pendingCommUSD + realizedCommUSD;
    const totalCommSYP = pendingCommSYP + realizedCommSYP;
    const normalizedCommUSD = pendingCommUSD + realizedCommUSD + Math.round((pendingCommSYP + realizedCommSYP) / usdToSypRate);

    return {
      category: cat,
      label: config.label,
      shortLabel: config.shortLabel,
      fillColor: config.fillColor,
      badgeBg: config.badgeBg,
      completedVolumeUSD: completedUSD,
      completedVolumeSYP: completedSYP,
      escrowVolumeUSD: escrowUSD,
      escrowVolumeSYP: escrowSYP,
      totalVolumeUSD: totalUSD,
      totalVolumeSYP: totalSYP,
      normalizedVolumeUSD: normalizedUSD,
      pendingCommissionUSD: pendingCommUSD,
      pendingCommissionSYP: pendingCommSYP,
      realizedCommissionUSD: realizedCommUSD,
      realizedCommissionSYP: realizedCommSYP,
      totalCommissionUSD: totalCommUSD,
      totalCommissionSYP: totalCommSYP,
      normalizedCommissionUSD: normalizedCommUSD,
      totalOrdersCount: catOrders.length,
      completedOrdersCount: completedCount,
      escrowOrdersCount: escrowCount,
      availableItemsCount: catItems.length,
    };
  });

  // Top category by normalized volume (or first)
  const topPerformingCategory = [...categoryStats].sort(
    (a, b) => b.normalizedVolumeUSD - a.normalizedVolumeUSD || b.totalOrdersCount - a.totalOrdersCount
  )[0] || categoryStats[0];

  return {
    completedSalesUSD,
    completedSalesSYP,
    escrowSalesUSD,
    escrowSalesSYP,
    totalSalesVolumeUSD,
    totalSalesVolumeSYP,
    normalizedTotalSalesUSD,
    pendingCommissionsUSD,
    pendingCommissionsSYP,
    realizedCommissionsUSD,
    realizedCommissionsSYP,
    totalCommissionsUSD,
    totalCommissionsSYP,
    normalizedPendingCommissionsUSD,
    normalizedRealizedCommissionsUSD,
    normalizedTotalCommissionsUSD,
    totalOrdersCount,
    completedOrdersCount,
    escrowOrdersCount,
    pendingPaymentOrdersCount,
    availableItemsCount,
    usdToSypRate,
    categoryStats,
    topPerformingCategory,
  };
}

