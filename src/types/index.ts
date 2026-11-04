/**
 * Types and Data Contracts for yamango Platform
 * Automotive & Machinery Marketplace for As-Suwayda & Al-Kafr
 */

export type UserRole = 'buyer' | 'seller' | 'lessor' | 'garage' | 'agent' | 'admin';

export type ZoneLocation = 
  | 'al_kafr' 
  | 'suwayda' 
  | 'shahba' 
  | 'salkhad' 
  | 'al_qurayya' 
  | 'ariqa' 
  | 'mazraa';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  roles: UserRole[];
  zone: ZoneLocation;
  kycStatus: 'verified' | 'pending' | 'unverified';
  idCardImage?: string;
  ratingAvg: number;
  dealsCompletedCount: number;
  referralCode?: string;
}

export type ListingCategory = 
  | 'cars' 
  | 'tractors' 
  | 'excavators' 
  | 'trucks' 
  | 'agricultural' 
  | 'heavy_machinery';

export type ListingOperation = 'sale' | 'rent';
export type CurrencyCode = 'SYP' | 'USD';

export const SUB_CATEGORIES_BY_CATEGORY: Record<ListingCategory, string[]> = {
  tractors: [
    'جرار عجلات',
    'جرار مجنزر / بساتين',
    'جرار كروم صغير (مدمج)',
    'عزاقة آلية ومحراث',
  ],
  excavators: [
    'حفارة مجنزرة (سلسلة)',
    'حفارة دواليب (عجلات)',
    'بوبكات / ميني لودر',
    'باك هو (لودر حفار)',
  ],
  trucks: [
    'شاحنة قلابة (طمبر/قلاب)',
    'شاحنة شاسيه طويل',
    'صهريج مياه / محروقات',
    'شاحنة براد ونقل خضار',
    'ونش / سطحة سحب',
  ],
  heavy_machinery: [
    'بلدوزر تسوية',
    'تركس / جرافة شوكية',
    'مدحلة أسفلت وبازلت',
    'قشاطة وممهدة طرق (غريدر)',
  ],
  agricultural: [
    'حصادة قمح وحبوب',
    'بذارة وسمادة ميكانيكية',
    'مقطورة زراعية هيدروليكية',
    'مرشة مبيدات توربينية',
  ],
  cars: [
    'سيارة سياحية سيدان',
    'جيب / دفع رباعي SUV',
    'بيك أب / دبل كابين 4x4',
    'فان / سرفيس ركاب',
  ],
};

export interface Listing {
  id: string;
  userId: string;
  sellerName: string;
  sellerPhone: string;
  sellerRating: number;
  title: string;
  category: ListingCategory;
  subCategory?: string; // e.g. 'جرار عجلات', 'حفارة مجنزرة', 'شاحنة قلابة'
  operation: ListingOperation;
  make: string;
  model: string;
  year: number;
  metricType: 'mileage_km' | 'work_hours';
  metricValue: number;
  priceAmount: number;
  currency: CurrencyCode;
  
  // For Rent
  rentRateUnit?: 'hour' | 'day' | 'week' | 'month';
  rentRateAmount?: number;
  hasDriverOption?: boolean;
  driverFeePerDay?: number;
  securityDeposit?: number;

  zone: ZoneLocation;
  locationDetails: string;
  images: string[];
  chassisNumber?: string;
  ownershipVerified: boolean;
  
  // Inspection by certified garage
  inspectionStatus: 'none' | 'pending' | 'inspected';
  inspectionBadge?: {
    reportId: string;
    garageName: string;
    garageId: string;
    inspectionDate: string;
    score: number;
    verdict: 'excellent' | 'good' | 'fair';
  };

  // Promotion
  isPromoted: boolean;
  promotionScope?: 'al_kafr_only' | 'all_suwayda';
  promotionActivatedAt?: number;
  promotionExpiresAt?: string;

  // GPS Tracking for machinery & rentals
  gpsTrackingEnabled?: boolean;
  gpsDeviceId?: string;
  gpsLastPing?: string;
  gpsBatteryLevel?: number;
  gpsCoordinates?: { lat: number; lng: number };

  // Service & Maintenance History Notes
  serviceNotes?: string;

  status: 'active' | 'in_deal' | 'sold' | 'rented' | 'paused';
  viewsCount?: number;
  clicksCount?: number;
  inquiriesCount?: number;
  createdAt: number;
}

export interface GarageProfile {
  id: string;
  userId: string;
  businessName: string;
  zone: ZoneLocation;
  address: string;
  phone: string;
  specialties: string[];
  inspectionFeeSYP: number;
  inspectionFeeUSD: number;
  ratingAvg: number;
  reviewsCount: number;
  subscriptionPlan: 'basic' | 'premium';
  subscriptionActive: boolean;
  subscriptionExpiresAt: string;
  completedInspectionsCount: number;
  isVerified: boolean;
  notes?: string;
}

export interface InspectionChecklist {
  engine: { status: 'pass' | 'warning' | 'fail'; notes: string };
  transmission: { status: 'pass' | 'warning' | 'fail'; notes: string };
  chassisAndBody: { status: 'pass' | 'warning' | 'fail'; notes: string };
  electrical: { status: 'pass' | 'warning' | 'fail'; notes: string };
  brakesAndTires: { status: 'pass' | 'warning' | 'fail'; notes: string };
  hydraulicsOrHours: { status: 'pass' | 'warning' | 'fail'; notes: string };
  previousAccidents: { found: boolean; notes: string };
}

export interface InspectionReport {
  id: string;
  requestId: string;
  listingId: string;
  garageId: string;
  garageName: string;
  inspectorName: string;
  date: string;
  overallScore: number; // 0-100
  verdict: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation: string;
  checklist: InspectionChecklist;
  isLocked: boolean;
  tamperProofHash: string;
  photos: string[];
}

export interface InspectionRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  garageId: string;
  garageName: string;
  status: 'pending_seller' | 'approved_by_seller' | 'in_inspection' | 'completed' | 'declined';
  requestedDate: string;
  feeAmount: number;
  currency: CurrencyCode;
  report?: InspectionReport;
  createdAt: number;
}

export type DealStatus = 
  | 'offer' 
  | 'agreement' 
  | 'contract_signed' 
  | 'escrow_pending' 
  | 'escrow_secured' 
  | 'delivery_pending' 
  | 'completed' 
  | 'disputed'
  | 'cancelled';

export interface Deal {
  id: string;
  listingId: string;
  listingTitle: string;
  listingCategory: ListingCategory;
  listingOperation: ListingOperation;
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  agreedPrice: number;
  currency: CurrencyCode;
  depositAmount: number;
  platformCommissionRate: number; // e.g. 0.02 (2%)
  platformCommissionAmount: number;
  status: DealStatus;
  zone?: ZoneLocation;
  
  // Verification OTP for physical payment agent
  secretOtp: string; // e.g. "YM-8391"
  escrowConfirmedAt?: string;
  escrowAgentName?: string;
  receiptNumber?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  contract: {
    contractNumber: string;
    signedAt?: string;
    buyerSignature?: string;
    sellerSignature?: string;
    termsSummaryArabic: string;
    qrVerificationHash: string;
  };

  deliveryProof?: {
    pickupKmOrHours: number;
    returnKmOrHours?: number;
    pickupDate: string;
    conditionVerified: boolean;
  };

  // GPS tracking integration for contracts
  gpsTrackingEnabled?: boolean;
  gpsDeviceId?: string;

  createdAt: number;
}

export interface PaymentAgent {
  id: string;
  name: string;
  agencyName: string;
  zone: ZoneLocation;
  address: string;
  phone: string;
  balanceSYP: number;
  balanceUSD: number;
  isActive: boolean;
}

export interface PromotionPackage {
  id: string;
  title: string;
  durationDays: number;
  priceSYP: number;
  priceUSD: number;
  zoneScope: 'al_kafr_only' | 'all_suwayda';
  description: string;
}

export interface ChatMessage {
  id: string;
  dealId?: string;
  listingId: string;
  senderId: string;
  senderName: string;
  text: string;
  isRedactedPhone: boolean;
  timestamp: number;
}

export interface CurrencyRateConfig {
  usdToSypRate: number; // e.g. 14,850 SYP per 1 USD
  lastUpdated: string;
  autoUpdateListings: boolean;
  sourceNote?: string;
}

export interface FieldInspectionAppointment {
  id: string;
  listingId: string;
  listingTitle: string;
  customerName: string;
  customerPhone: string;
  appointmentDate: string; // e.g. "2026-10-28"
  appointmentTime: string; // e.g. "11:00 ص"
  location: string; // e.g. "الكفر - السهل الغربي"
  zone: ZoneLocation;
  notes?: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  assignedInspector?: string;
  createdAt: number;
}

export interface CommissionRatesConfig {
  saleRate: number; // percentage, e.g. 2.5
  rentRate: number; // percentage, e.g. 5.0
  inspectionRate: number; // percentage, e.g. 10.0
  lastUpdated?: string;
}

export interface AdminSecurityProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'finance_admin' | 'field_auditor' | 'support_admin';
  roleTitleArabic: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'sms_syria' | 'authenticator_app' | 'security_key';
  lastLoginAt: string;
  status: 'active' | 'suspended';
  managedBySuperAdminOnly?: boolean;
}

export type AuditActionCategory = 
  | 'security_auth' 
  | 'exchange_rates' 
  | 'commissions' 
  | 'payment_agents' 
  | 'escrow_deals' 
  | 'garages_inspections'
  | 'anti_fraud';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  timestampMs: number;
  actorId: string;
  actorName: string;
  actorRole: string;
  category: AuditActionCategory;
  categoryLabelArabic: string;
  action: string;
  actionTitleArabic: string;
  details: string;
  severity: AuditSeverity;
  status: 'success' | 'warning' | 'blocked';
  ipAddress?: string;
  location?: string;
}

export interface GarageReview {
  id: string;
  garageId: string;
  userName: string;
  userPhone?: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  createdAt: number;
  verifiedInspection?: boolean;
}

export type SupportTicketCategory = 
  | 'deal_dispute' 
  | 'inspection_inquiry' 
  | 'payment_agent' 
  | 'technical_issue' 
  | 'other';

export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userName: string;
  userPhone: string;
  category: SupportTicketCategory;
  categoryLabelArabic: string;
  priority: SupportTicketPriority;
  priorityLabelArabic: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  createdAtMs: number;
  queuedNotificationId?: string;
}

// ==========================================
// Used Goods Marketplace & Escrow Types
// ==========================================

export type UsedItemCategory = 
  | 'home_appliances' 
  | 'furniture' 
  | 'electronics' 
  | 'solar_power' 
  | 'tools' 
  | 'other';

export type UsedItemCondition = 
  | 'like_new' 
  | 'excellent' 
  | 'very_good' 
  | 'good' 
  | 'needs_repair';

export interface UsedItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerRating: number;
  title: string;
  category: UsedItemCategory;
  condition: UsedItemCondition;
  price: number;
  currency: CurrencyCode;
  zone: ZoneLocation;
  locationDetails: string;
  description: string;
  images: string[];
  platformCommissionRate: number; // e.g. 0.035 (3.5%)
  platformCommissionAmount: number;
  sellerNetPayout: number;
  status: 'available' | 'reserved' | 'sold';
  deliveryOption: 'pickup_in_person' | 'local_delivery' | 'both';
  createdAt: number;
  viewsCount?: number;
}

export type UsedItemPaymentMethod = 
  | 'agent_cash' 
  | 'syriatel_cash' 
  | 'al_haram' 
  | 'hand_to_hand_escrow';

export interface UsedItemOrder {
  id: string; // e.g. "UGD-7412"
  itemId: string;
  itemTitle: string;
  itemCategory: UsedItemCategory;
  itemCondition: UsedItemCondition;
  itemPrice: number;
  currency: CurrencyCode;
  commissionRate: number;
  commissionAmount: number;
  sellerNetPayout: number;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  paymentMethod: UsedItemPaymentMethod;
  agentId?: string;
  agentName?: string;
  agentAddress?: string;
  agentPhone?: string;
  status: 'pending_payment' | 'escrow_secured' | 'delivered' | 'completed' | 'cancelled';
  secretOtp: string; // e.g. "UG-9418"
  deliveryOption: 'pickup_in_person' | 'local_delivery';
  deliveryAddress?: string;
  createdAt: number;
  notes?: string;
}



