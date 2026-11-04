import { Deal, DealStatus, ZoneLocation, ListingCategory, ListingOperation } from '../types';

export type DealStatusGroup = 'pending' | 'completed' | 'cancelled' | 'waiting';

export interface DealStatusSliceData {
  id: DealStatusGroup;
  name: string;
  shortLabel: string;
  count: number;
  percentage: number; // 0 - 100
  color: string;
  lightBg: string;
  borderColor: string;
  volumeUSD: number;
  volumeSYP: number;
  description: string;
  associatedRawStatuses: DealStatus[];
  dealIds: string[];
}

export interface DetailedStatusSliceData {
  status: DealStatus;
  name: string;
  count: number;
  percentage: number;
  color: string;
  volumeUSD: number;
  volumeSYP: number;
}

export interface DealStatusDistributionFilter {
  zone?: ZoneLocation | 'all';
  category?: ListingCategory | 'all';
  operation?: ListingOperation | 'all';
}

export interface DealStatusDistributionSummary {
  slices: DealStatusSliceData[];
  detailedSlices: DetailedStatusSliceData[];
  totalDeals: number;
  activePipelineDeals: number; // pending + waiting
  completedDeals: number;
  cancelledDeals: number;
  pendingDeals: number;
  waitingDeals: number;
  completionRate: number; // percentage
  cancellationRate: number; // percentage
  pipelineRate: number; // percentage
  totalVolumeUSD: number;
  totalVolumeSYP: number;
  filteredDeals: Deal[];
  selectedZoneLabel: string;
  dominantStatus: DealStatusGroup;
}

export const DEAL_STATUS_GROUP_CONFIG: Record<
  DealStatusGroup,
  {
    name: string;
    shortLabel: string;
    color: string;
    lightBg: string;
    borderColor: string;
    description: string;
    rawStatuses: DealStatus[];
  }
> = {
  pending: {
    name: 'صفقات معلقة',
    shortLabel: 'معلقة',
    color: '#f59e0b', // Amber-500
    lightBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'بانتظار إيداع العربون النقدي لدى الوكيل المعتمد أو توقيع العقد الرقمي',
    rawStatuses: ['escrow_pending', 'contract_signed'],
  },
  completed: {
    name: 'صفقات مكتملة',
    shortLabel: 'مكتملة',
    color: '#059669', // Emerald-600
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'تمت المعاينة وتسليم الآلية وفراغ الملكية والإفراج عن أموال البائع',
    rawStatuses: ['completed'],
  },
  cancelled: {
    name: 'صفقات ملغاة',
    shortLabel: 'ملغاة',
    color: '#e11d48', // Rose-600
    lightBg: 'bg-rose-50',
    borderColor: 'border-rose-200',
    description: 'ألغيت لعدم اجتياز الفحص الفني أو اختلاف الهيكل أو تراضي الطرفين مع استرداد العربون',
    rawStatuses: ['cancelled', 'disputed'],
  },
  waiting: {
    name: 'قيد الانتظار والتنفيذ',
    shortLabel: 'قيد الانتظار',
    color: '#2563eb', // Blue-600
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'العربون مؤمن في الإسكرو بانتظار الفحص الفني، فحص العداد، أو الاستلام الميداني',
    rawStatuses: ['escrow_secured', 'delivery_pending', 'agreement', 'offer'],
  },
};

export const RAW_STATUS_NAMES_ARABIC: Record<DealStatus, { name: string; color: string }> = {
  offer: { name: 'تقديم عرض', color: '#94a3b8' },
  agreement: { name: 'اتفاق مبدئي', color: '#64748b' },
  contract_signed: { name: 'عقد موقع (بانتظار الدفع)', color: '#d97706' },
  escrow_pending: { name: 'معلقة (بانتظار إيداع العربون)', color: '#f59e0b' },
  escrow_secured: { name: 'العربون محجوز ومؤمن بالكامل', color: '#3b82f6' },
  delivery_pending: { name: 'بانتظار التسليم والمعاينة', color: '#6366f1' },
  completed: { name: 'مكتملة ومحررة الأموال', color: '#059669' },
  disputed: { name: 'نزاع مفتوح للتحكيم', color: '#dc2626' },
  cancelled: { name: 'ملغاة ومستردة الأموال', color: '#e11d48' },
};

export const ZONE_NAMES_MAP: Record<ZoneLocation, string> = {
  al_kafr: 'بلدة الكفر',
  suwayda: 'مدينة السويداء',
  salkhad: 'ناحية صلخد',
  shahba: 'ناحية شهبا',
  al_qurayya: 'ناحية القريّا',
  mazraa: 'ناحية المزرعة',
  ariqa: 'ناحية عريقة',
};

/**
 * Maps any granular DealStatus to one of the 4 primary platform management buckets.
 */
export function mapDealStatusToGroup(status: DealStatus): DealStatusGroup {
  switch (status) {
    case 'escrow_pending':
    case 'contract_signed':
      return 'pending';
    case 'completed':
      return 'completed';
    case 'cancelled':
    case 'disputed':
      return 'cancelled';
    case 'escrow_secured':
    case 'delivery_pending':
    case 'agreement':
    case 'offer':
    default:
      return 'waiting';
  }
}

/**
 * Computes deal status distribution with filtering by sub-district / zone, machinery category, and operation.
 */
export function computeDealStatusDistribution(
  deals: Deal[],
  filter: DealStatusDistributionFilter = {}
): DealStatusDistributionSummary {
  const { zone = 'all', category = 'all', operation = 'all' } = filter;

  // 1. Filter deals
  const filtered = deals.filter((d) => {
    if (zone !== 'all' && d.zone !== zone) return false;
    if (category !== 'all' && d.listingCategory !== category) return false;
    if (operation !== 'all' && d.listingOperation !== operation) return false;
    return true;
  });

  const totalDeals = filtered.length;

  // 2. Initialize group buckets
  const groupStats: Record<
    DealStatusGroup,
    { count: number; volumeUSD: number; volumeSYP: number; dealIds: string[] }
  > = {
    pending: { count: 0, volumeUSD: 0, volumeSYP: 0, dealIds: [] },
    completed: { count: 0, volumeUSD: 0, volumeSYP: 0, dealIds: [] },
    cancelled: { count: 0, volumeUSD: 0, volumeSYP: 0, dealIds: [] },
    waiting: { count: 0, volumeUSD: 0, volumeSYP: 0, dealIds: [] },
  };

  // Raw status count
  const rawStatusStats: Partial<
    Record<DealStatus, { count: number; volumeUSD: number; volumeSYP: number }>
  > = {};

  let totalVolumeUSD = 0;
  let totalVolumeSYP = 0;

  for (const deal of filtered) {
    const group = mapDealStatusToGroup(deal.status);
    groupStats[group].count += 1;
    groupStats[group].dealIds.push(deal.id);

    if (deal.currency === 'USD') {
      groupStats[group].volumeUSD += deal.agreedPrice;
      totalVolumeUSD += deal.agreedPrice;
    } else {
      groupStats[group].volumeSYP += deal.agreedPrice;
      totalVolumeSYP += deal.agreedPrice;
    }

    if (!rawStatusStats[deal.status]) {
      rawStatusStats[deal.status] = { count: 0, volumeUSD: 0, volumeSYP: 0 };
    }
    rawStatusStats[deal.status]!.count += 1;
    if (deal.currency === 'USD') {
      rawStatusStats[deal.status]!.volumeUSD += deal.agreedPrice;
    } else {
      rawStatusStats[deal.status]!.volumeSYP += deal.agreedPrice;
    }
  }

  // 3. Build ordered 4-slice distribution (always includes all 4 groups so layout stays consistent)
  const orderedGroups: DealStatusGroup[] = ['completed', 'waiting', 'pending', 'cancelled'];
  const slices: DealStatusSliceData[] = orderedGroups.map((groupId) => {
    const config = DEAL_STATUS_GROUP_CONFIG[groupId];
    const data = groupStats[groupId];
    const percentage = totalDeals > 0 ? Math.round((data.count / totalDeals) * 1000) / 10 : 0;

    return {
      id: groupId,
      name: config.name,
      shortLabel: config.shortLabel,
      count: data.count,
      percentage,
      color: config.color,
      lightBg: config.lightBg,
      borderColor: config.borderColor,
      volumeUSD: data.volumeUSD,
      volumeSYP: data.volumeSYP,
      description: config.description,
      associatedRawStatuses: config.rawStatuses,
      dealIds: data.dealIds,
    };
  });

  // 4. Build detailed slices for granular view
  const detailedSlices: DetailedStatusSliceData[] = Object.entries(rawStatusStats)
    .filter(([_, stat]) => (stat?.count || 0) > 0)
    .map(([rawStatus, stat]) => {
      const statusKey = rawStatus as DealStatus;
      const meta = RAW_STATUS_NAMES_ARABIC[statusKey] || { name: statusKey, color: '#94a3b8' };
      const percentage = totalDeals > 0 ? Math.round(((stat?.count || 0) / totalDeals) * 1000) / 10 : 0;
      return {
        status: statusKey,
        name: meta.name,
        count: stat?.count || 0,
        percentage,
        color: meta.color,
        volumeUSD: stat?.volumeUSD || 0,
        volumeSYP: stat?.volumeSYP || 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  const completedDeals = groupStats.completed.count;
  const cancelledDeals = groupStats.cancelled.count;
  const pendingDeals = groupStats.pending.count;
  const waitingDeals = groupStats.waiting.count;
  const activePipelineDeals = pendingDeals + waitingDeals;

  const completionRate = totalDeals > 0 ? Math.round((completedDeals / totalDeals) * 1000) / 10 : 0;
  const cancellationRate = totalDeals > 0 ? Math.round((cancelledDeals / totalDeals) * 1000) / 10 : 0;
  const pipelineRate = totalDeals > 0 ? Math.round((activePipelineDeals / totalDeals) * 1000) / 10 : 0;

  let dominantStatus: DealStatusGroup = 'completed';
  let maxCount = -1;
  for (const group of orderedGroups) {
    if (groupStats[group].count > maxCount) {
      maxCount = groupStats[group].count;
      dominantStatus = group;
    }
  }

  const selectedZoneLabel = zone === 'all' ? 'كافة النواحي والمناطق' : ZONE_NAMES_MAP[zone] || zone;

  return {
    slices,
    detailedSlices,
    totalDeals,
    activePipelineDeals,
    completedDeals,
    cancelledDeals,
    pendingDeals,
    waitingDeals,
    completionRate,
    cancellationRate,
    pipelineRate,
    totalVolumeUSD,
    totalVolumeSYP,
    filteredDeals: filtered,
    selectedZoneLabel,
    dominantStatus,
  };
}
