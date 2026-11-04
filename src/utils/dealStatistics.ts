import { Deal, ListingCategory } from '../types';

export interface WeeklyDataPoint {
  weekKey: string;
  weekLabel: string;
  shortLabel: string;
  completed: number;
  cancelled: number;
  total: number;
}

export interface CategoryDataPoint {
  category: string;
  categoryLabel: string;
  completed: number;
  cancelled: number;
}

export interface CancellationReasonSummary {
  reason: string;
  count: number;
  percentage: number;
}

export interface MonthlyDealStats {
  targetMonthName: string;
  targetYear: number;
  completedCount: number;
  cancelledCount: number;
  totalClosedCount: number;
  inProgressCount: number;
  successRate: number; // percentage e.g. 75
  cancellationRate: number; // percentage e.g. 25
  completedVolumeUSD: number;
  completedVolumeSYP: number;
  cancelledVolumeUSD: number;
  cancelledVolumeSYP: number;
  weeklyBreakdown: WeeklyDataPoint[];
  categoryBreakdown: CategoryDataPoint[];
  cancellationReasons: CancellationReasonSummary[];
  monthlyDeals: Deal[];
}

const CATEGORY_LABELS: Record<ListingCategory, string> = {
  tractors: 'جرارات زراعية',
  excavators: 'حفارات ومعدات ثقيلة',
  cars: 'سيارات وبيك آب',
  trucks: 'شاحنات وقلابات',
  agricultural: 'معدات زراعية',
  heavy_machinery: 'آليات إنشائية ثقيلة',
};

const ARABIC_MONTH_NAMES = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
];

/**
 * Computes monthly deal statistics for completed vs cancelled deals
 */
export function computeMonthlyDealStats(
  deals: Deal[],
  referenceDate: Date = new Date('2026-10-25')
): MonthlyDealStats {
  const targetYear = referenceDate.getFullYear();
  const targetMonth = referenceDate.getMonth(); // 0-indexed, 9 for October
  const targetMonthName = ARABIC_MONTH_NAMES[targetMonth] || 'الشهر الحالي';

  // Filter deals belonging to the target month & year
  const monthlyDeals = deals.filter((deal) => {
    // If completedAt or cancelledAt date string exists, parse it; otherwise use createdAt
    const timestamp = deal.completedAt
      ? new Date(deal.completedAt.replace(' ', 'T')).getTime()
      : deal.cancelledAt
      ? new Date(deal.cancelledAt.replace(' ', 'T')).getTime()
      : deal.createdAt;

    const date = new Date(timestamp);
    return date.getFullYear() === targetYear && date.getMonth() === targetMonth;
  });

  let completedCount = 0;
  let cancelledCount = 0;
  let inProgressCount = 0;
  let completedVolumeUSD = 0;
  let completedVolumeSYP = 0;
  let cancelledVolumeUSD = 0;
  let cancelledVolumeSYP = 0;

  // Weeks breakdown (1-7, 8-14, 15-21, 22-31)
  const weeks: Record<number, { completed: number; cancelled: number }> = {
    1: { completed: 0, cancelled: 0 },
    2: { completed: 0, cancelled: 0 },
    3: { completed: 0, cancelled: 0 },
    4: { completed: 0, cancelled: 0 },
  };

  // Category breakdown
  const categoryMap: Record<string, { completed: number; cancelled: number }> = {};

  // Cancellation reasons
  const reasonMap: Record<string, number> = {};

  for (const deal of monthlyDeals) {
    const timestamp = deal.completedAt
      ? new Date(deal.completedAt.replace(' ', 'T')).getTime()
      : deal.cancelledAt
      ? new Date(deal.cancelledAt.replace(' ', 'T')).getTime()
      : deal.createdAt;

    const day = new Date(timestamp).getDate();
    const weekIndex = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : 4;

    const cat = deal.listingCategory || 'cars';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { completed: 0, cancelled: 0 };
    }

    if (deal.status === 'completed') {
      completedCount++;
      weeks[weekIndex].completed++;
      categoryMap[cat].completed++;

      if (deal.currency === 'USD') {
        completedVolumeUSD += deal.agreedPrice;
      } else {
        completedVolumeSYP += deal.agreedPrice;
      }
    } else if (deal.status === 'cancelled') {
      cancelledCount++;
      weeks[weekIndex].cancelled++;
      categoryMap[cat].cancelled++;

      if (deal.currency === 'USD') {
        cancelledVolumeUSD += deal.agreedPrice;
      } else {
        cancelledVolumeSYP += deal.agreedPrice;
      }

      const r = deal.cancellationReason || 'إلغاء باتفاق الطرفين';
      reasonMap[r] = (reasonMap[r] || 0) + 1;
    } else {
      inProgressCount++;
    }
  }

  const totalClosedCount = completedCount + cancelledCount;
  const successRate = totalClosedCount > 0 ? Math.round((completedCount / totalClosedCount) * 100) : 0;
  const cancellationRate = totalClosedCount > 0 ? Math.round((cancelledCount / totalClosedCount) * 100) : 0;

  const weeklyBreakdown: WeeklyDataPoint[] = [
    {
      weekKey: 'w1',
      weekLabel: 'الأسبوع الأول (1 - 7)',
      shortLabel: 'الأسبوع 1',
      completed: weeks[1].completed,
      cancelled: weeks[1].cancelled,
      total: weeks[1].completed + weeks[1].cancelled,
    },
    {
      weekKey: 'w2',
      weekLabel: 'الأسبوع الثاني (8 - 14)',
      shortLabel: 'الأسبوع 2',
      completed: weeks[2].completed,
      cancelled: weeks[2].cancelled,
      total: weeks[2].completed + weeks[2].cancelled,
    },
    {
      weekKey: 'w3',
      weekLabel: 'الأسبوع الثالث (15 - 21)',
      shortLabel: 'الأسبوع 3',
      completed: weeks[3].completed,
      cancelled: weeks[3].cancelled,
      total: weeks[3].completed + weeks[3].cancelled,
    },
    {
      weekKey: 'w4',
      weekLabel: 'الأسبوع الرابع (22 - 31)',
      shortLabel: 'الأسبوع 4',
      completed: weeks[4].completed,
      cancelled: weeks[4].cancelled,
      total: weeks[4].completed + weeks[4].cancelled,
    },
  ];

  const categoryBreakdown: CategoryDataPoint[] = Object.keys(categoryMap).map((catKey) => ({
    category: catKey,
    categoryLabel: CATEGORY_LABELS[catKey as ListingCategory] || catKey,
    completed: categoryMap[catKey].completed,
    cancelled: categoryMap[catKey].cancelled,
  }));

  const cancellationReasons: CancellationReasonSummary[] = Object.entries(reasonMap).map(
    ([reason, count]) => ({
      reason,
      count,
      percentage: cancelledCount > 0 ? Math.round((count / cancelledCount) * 100) : 0,
    })
  );

  return {
    targetMonthName,
    targetYear,
    completedCount,
    cancelledCount,
    totalClosedCount,
    inProgressCount,
    successRate,
    cancellationRate,
    completedVolumeUSD,
    completedVolumeSYP,
    cancelledVolumeUSD,
    cancelledVolumeSYP,
    weeklyBreakdown,
    categoryBreakdown,
    cancellationReasons,
    monthlyDeals,
  };
}
