import { Deal } from '../types';

export type EscrowStageId = 'initiation' | 'inspection' | 'deposit_escrow' | 'completion';
export type EscrowStageState = 'completed' | 'in_progress' | 'pending' | 'cancelled';

export interface EscrowJourneyStage {
  id: EscrowStageId;
  label: string; // 'بدء' | 'فحص' | 'حجز العربون' | 'إتمام'
  fullTitle: string;
  subtitle: string;
  state: EscrowStageState;
  stateLabel: string;
  stepNumber: number;
  timestamp?: string;
  actingParty: string;
  detailsSummary: string;
  actionRequired?: string;
  relevantTab: 'timeline' | 'contract' | 'escrow_otp' | 'delivery' | 'whatsapp';
}

export interface EscrowJourneyProgress {
  stages: EscrowJourneyStage[];
  currentStageId: EscrowStageId;
  currentStageLabel: string;
  progressPercentage: number;
  isCompleted: boolean;
  isCancelled: boolean;
  statusBadge: {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  };
}

/**
 * Computes the 4 visual milestones of the Escrow Journey (بدء، فحص، حجز العربون، إتمام)
 * for any deal on the yamango platform.
 */
export function computeEscrowJourney(deal: Deal): EscrowJourneyProgress {
  const isCancelled = deal.status === 'cancelled';
  const isCompleted = deal.status === 'completed';
  const isEscrowSecured = deal.status === 'escrow_secured';
  const isDeliveryPending = deal.status === 'delivery_pending';

  // 1. بدء (Initiation / Initial Agreement & Contract)
  const initiationStage: EscrowJourneyStage = {
    id: 'initiation',
    label: 'بدء',
    fullTitle: 'بدء الاتفاق والعقد الإلكتروني',
    subtitle: 'تثبيت السعر والضمان ورقم العقد',
    state: 'completed',
    stateLabel: 'مكتملة ✓',
    stepNumber: 1,
    timestamp: deal.contract?.signedAt || new Date(deal.createdAt).toLocaleDateString('ar-SY'),
    actingParty: `${deal.buyerName} و ${deal.sellerName}`,
    detailsSummary: `تم توثيق العقد الإلكتروني رقم ${deal.contract?.contractNumber || 'YMG-2026'} بمبلغ ${deal.agreedPrice.toLocaleString()} ${deal.currency}.`,
    relevantTab: 'contract',
  };

  // 2. فحص (Inspection & Verification)
  let inspectionState: EscrowStageState = 'completed';
  let inspectionStateLabel = 'مكتملة ✓';
  let inspectionAction: string | undefined = undefined;

  if (isCancelled && deal.cancellationReason?.includes('الشاصي')) {
    inspectionState = 'cancelled';
    inspectionStateLabel = 'مرفوضة ✕';
  } else if (!isCompleted && !isEscrowSecured && !isDeliveryPending) {
    if (deal.deliveryProof?.conditionVerified) {
      inspectionState = 'completed';
      inspectionStateLabel = 'مكتملة ✓';
    } else {
      inspectionState = 'in_progress';
      inspectionStateLabel = 'جارية ⏳';
      inspectionAction = 'معاينة الآلية على أرض الواقع والتحقق من رقم الشاسيه والعداد قبل تسليم العربون';
    }
  }

  const inspectionStage: EscrowJourneyStage = {
    id: 'inspection',
    label: 'فحص',
    fullTitle: 'فحص ومعاينة الآلية الميدانية',
    subtitle: 'فحص كراج معتمد أو معاينة مباشرة',
    state: inspectionState,
    stateLabel: inspectionStateLabel,
    stepNumber: 2,
    timestamp: deal.deliveryProof?.pickupDate || deal.contract?.signedAt || 'معاينة معتمدة',
    actingParty: 'كراج معتمد / خبير الفحص الميداني',
    detailsSummary: deal.deliveryProof?.conditionVerified
      ? `تمت معاينة الآلية وتوثيق العداد الابتدائي (${deal.deliveryProof.pickupKmOrHours}) والتأكد من سلامة الهيكل.`
      : 'فحص الحالة الميكانيكية للآلية والتحقق من مطابقة الأوراق الثبوتية ورقم الشاسيه.',
    actionRequired: inspectionAction,
    relevantTab: 'delivery',
  };

  // 3. حجز العربون (Deposit Escrow Holding)
  let depositState: EscrowStageState = 'pending';
  let depositStateLabel = 'قادمة 🔒';
  let depositAction: string | undefined = undefined;

  if (isCancelled) {
    depositState = 'cancelled';
    depositStateLabel = 'ملغاة / مستردة';
  } else if (isCompleted || isEscrowSecured || isDeliveryPending) {
    depositState = 'completed';
    depositStateLabel = 'مكتملة ومؤكدة ✓';
  } else {
    depositState = 'in_progress';
    depositStateLabel = 'بانتظار الإيداع ⏳';
    depositAction = `المطلوب: إبراز الرمز السري (${deal.secretOtp}) للوكيل وإيداع ${deal.depositAmount.toLocaleString()} ${deal.currency}`;
  }

  const depositStage: EscrowJourneyStage = {
    id: 'deposit_escrow',
    label: 'حجز العربون',
    fullTitle: 'حجز عربون الإسكرو لدى الوكيل',
    subtitle: 'تجميد كاش في أمان المنصة برمز OTP',
    state: depositState,
    stateLabel: depositStateLabel,
    stepNumber: 3,
    timestamp: deal.escrowConfirmedAt || (depositState === 'completed' ? 'تم الحجز' : undefined),
    actingParty: deal.escrowAgentName || 'وكيل يامانغو المعتمد (الكفر / السويداء)',
    detailsSummary: deal.receiptNumber
      ? `تم إيداع العربون (${deal.depositAmount.toLocaleString()} ${deal.currency}) بإيصال رقم ${deal.receiptNumber} لدى ${deal.escrowAgentName || 'الوكيل'}.`
      : `مبلغ العربون المطلوب تجميده: ${deal.depositAmount.toLocaleString()} ${deal.currency} برمز التحقق السري ${deal.secretOtp}.`,
    actionRequired: depositAction,
    relevantTab: 'escrow_otp',
  };

  // 4. إتمام (Completion & Final Handover)
  let completionState: EscrowStageState = 'pending';
  let completionStateLabel = 'قادمة 🔒';
  let completionAction: string | undefined = undefined;

  if (isCancelled) {
    completionState = 'cancelled';
    completionStateLabel = 'صفقة ملغاة ✕';
  } else if (isCompleted) {
    completionState = 'completed';
    completionStateLabel = 'مكتملة بنجاح ✓';
  } else if (isEscrowSecured || isDeliveryPending) {
    completionState = 'in_progress';
    completionStateLabel = 'جاهزة للاستلام ⏳';
    completionAction = 'استلام الآلية وتثبيت العداد النهائي لتبرئة الذمة وتحرير المبلغ للبائع';
  }

  const completionStage: EscrowJourneyStage = {
    id: 'completion',
    label: 'إتمام',
    fullTitle: 'إتمام الصفقة وتحرير المبالغ',
    subtitle: 'تسليم الآلية، تحرير الكاش واقتطاع العمولة',
    state: completionState,
    stateLabel: completionStateLabel,
    stepNumber: 4,
    timestamp: deal.completedAt || (isCompleted ? 'صفقة مغلقة' : undefined),
    actingParty: 'إدارة المنصة وبنك إسكرو يامانغو',
    detailsSummary: isCompleted
      ? `تم استلام الآلية بنجاح، تحرير صافي المستحق للبائع (${(deal.agreedPrice - deal.platformCommissionAmount).toLocaleString()} ${deal.currency}) واقتطاع عمولة المنصة.`
      : `صافي المستحق للبائع بعد الاستلام: ${(deal.agreedPrice - deal.platformCommissionAmount).toLocaleString()} ${deal.currency} (عمولة المنصة: ${deal.platformCommissionAmount.toLocaleString()} ${deal.currency}).`,
    actionRequired: completionAction,
    relevantTab: 'timeline',
  };

  const stages = [initiationStage, inspectionStage, depositStage, completionStage];

  // Calculate overall progress percentage
  let progressPercentage = 25;
  let currentStageId: EscrowStageId = 'inspection';
  let currentStageLabel = 'المعاينة والفحص الميداني';

  if (isCompleted) {
    progressPercentage = 100;
    currentStageId = 'completion';
    currentStageLabel = 'الصفقة مكتملة ومغلقة بنجاح';
  } else if (isCancelled) {
    progressPercentage = 0;
    currentStageId = 'initiation';
    currentStageLabel = 'الصفقة ملغاة بالتراضي';
  } else if (isEscrowSecured || isDeliveryPending) {
    progressPercentage = 75;
    currentStageId = 'completion';
    currentStageLabel = 'جاهز للتسليم والمعاينة النهائية';
  } else if (inspectionStage.state === 'completed') {
    progressPercentage = 50;
    currentStageId = 'deposit_escrow';
    currentStageLabel = 'بانتظار إيداع العربون لدى الوكيل';
  } else {
    progressPercentage = 25;
    currentStageId = 'inspection';
    currentStageLabel = 'الفحص والمعاينة الميدانية';
  }

  // Visual status badge
  let statusBadge = {
    label: 'قيد التنفيذ',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
  };

  if (isCompleted) {
    statusBadge = {
      label: 'صفقة مكتملة 100%',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-800',
      borderClass: 'border-emerald-300',
    };
  } else if (isCancelled) {
    statusBadge = {
      label: 'صفقة ملغاة',
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-800',
      borderClass: 'border-rose-300',
    };
  } else if (isEscrowSecured) {
    statusBadge = {
      label: 'عربون محجوز بإسكرو الوكيل',
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-800',
      borderClass: 'border-blue-300',
    };
  }

  return {
    stages,
    currentStageId,
    currentStageLabel,
    progressPercentage,
    isCompleted,
    isCancelled,
    statusBadge,
  };
}
