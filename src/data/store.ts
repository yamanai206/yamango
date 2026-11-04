import { useState, useEffect } from 'react';
import { 
  Listing, 
  GarageProfile, 
  PaymentAgent, 
  Deal, 
  InspectionRequest, 
  InspectionReport,
  User, 
  UserRole, 
  ZoneLocation, 
  ListingCategory, 
  ListingOperation,
  PromotionPackage,
  CurrencyRateConfig,
  FieldInspectionAppointment,
  CommissionRatesConfig,
  AdminSecurityProfile,
  AuditLogEntry,
  GarageReview,
  UsedItem,
  UsedItemOrder,
} from '../types';
import { 
  SEED_AGENTS, 
  SEED_PROMOTION_PACKAGES,
  SEED_APPOINTMENTS,
  DEFAULT_CURRENCY_CONFIG,
  DEFAULT_COMMISSION_RATES,
  SEED_ADMINS,
  SEED_AUDIT_LOGS,
  SEED_GARAGE_REVIEWS,
} from './seedData';
import { SEED_USED_ITEMS, SEED_USED_ORDERS } from './seedUsedItems';
import { rankListings, ListingFilter } from '../utils/ranking';
import { calculateEscrowCommission, generateAgentVerificationOtp } from '../utils/escrow';
import { calculateUsedItemCommission, generateUsedItemOtp, generateUsedOrderId } from '../utils/usedGoods';
import { supabase } from '../lib/supabase';

const STORAGE_KEY_USED_ITEMS = 'yamango_used_items_v1';
const STORAGE_KEY_USED_ORDERS = 'yamango_used_orders_v1';
const STORAGE_KEY_AGENTS = 'yamango_agents_v1';
const STORAGE_KEY_CURRENCY = 'yamango_currency_v1';
const STORAGE_KEY_APPOINTMENTS = 'yamango_appointments_v1';
const STORAGE_KEY_COMMISSION = 'yamango_commission_rates_v1';
const STORAGE_KEY_ADMINS = 'yamango_admins_v1';
const STORAGE_KEY_AUDIT_LOGS = 'yamango_audit_logs_v1';
const STORAGE_KEY_REVIEWS = 'yamango_garage_reviews_v1';
const STORAGE_KEY_LANGUAGE = 'yamango_language_v1';

export function useYamangoStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('buyer');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [listings, setListings] = useState<Listing[]>([]);
  const [isListingsLoading, setIsListingsLoading] = useState<boolean>(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isDealsLoading, setIsDealsLoading] = useState<boolean>(true);
  
  const [garages, setGarages] = useState<GarageProfile[]>([]);
  const [inspectionRequests, setInspectionRequests] = useState<InspectionRequest[]>([]);

  const [agents, setAgents] = useState<PaymentAgent[]>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_AGENTS); return saved ? JSON.parse(saved) : SEED_AGENTS; } catch { return SEED_AGENTS; }
  });
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyRateConfig>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_CURRENCY); return saved ? JSON.parse(saved) : DEFAULT_CURRENCY_CONFIG; } catch { return DEFAULT_CURRENCY_CONFIG; }
  });
  const [appointments, setAppointments] = useState<FieldInspectionAppointment[]>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_APPOINTMENTS); return saved ? JSON.parse(saved) : SEED_APPOINTMENTS; } catch { return SEED_APPOINTMENTS; }
  });
  const [commissionRates, setCommissionRates] = useState<CommissionRatesConfig>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_COMMISSION); return saved ? JSON.parse(saved) : DEFAULT_COMMISSION_RATES; } catch { return DEFAULT_COMMISSION_RATES; }
  });
  const [admins, setAdmins] = useState<AdminSecurityProfile[]>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_ADMINS); return saved ? JSON.parse(saved) : SEED_ADMINS; } catch { return SEED_ADMINS; }
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS); return saved ? JSON.parse(saved) : SEED_AUDIT_LOGS; } catch { return SEED_AUDIT_LOGS; }
  });
  const [reviews, setReviews] = useState<GarageReview[]>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_REVIEWS); return saved ? JSON.parse(saved) : SEED_GARAGE_REVIEWS; } catch { return SEED_GARAGE_REVIEWS; }
  });
  const [usedItems, setUsedItems] = useState<UsedItem[]>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_USED_ITEMS); return saved ? JSON.parse(saved) : SEED_USED_ITEMS; } catch { return SEED_USED_ITEMS; }
  });
  const [usedItemOrders, setUsedItemOrders] = useState<UsedItemOrder[]>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_USED_ORDERS); return saved ? JSON.parse(saved) : SEED_USED_ORDERS; } catch { return SEED_USED_ORDERS; }
  });
  const [language, setLanguageState] = useState<'ar' | 'en'>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_LANGUAGE); return saved === 'en' ? 'en' : 'ar'; } catch { return 'ar'; }
  });

  const setLanguage = (lang: 'ar' | 'en') => {
    setLanguageState(lang);
    try { localStorage.setItem(STORAGE_KEY_LANGUAGE, lang); } catch (e) {}
    if (typeof document !== 'undefined') { document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = lang; }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') { document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = language; }
  }, [language]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) { setCurrentUser(null); setIsAuthenticated(false); return; }
      if (data) {
        const userRole = data.role as UserRole;
        setCurrentUser({ id: data.id, fullName: data.full_name, phone: data.phone || '', roles: [userRole], zone: data.zone || 'al_kafr', kycStatus: data.kyc_status || 'pending', ratingAvg: 5.0, dealsCompletedCount: 0 });
        setActiveRole(userRole);
        setIsAuthenticated(true);
      }
    } catch (err) { console.error("Auth error:", err); } finally { setIsAuthLoading(false); }
  };

  const fetchListings = async () => {
    setIsListingsLoading(true);
    try {
      const { data, error } = await supabase.from('listings').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setListings(data.map((item) => ({
          id: item.id, userId: item.user_id, sellerName: item.seller_name, sellerPhone: item.seller_phone, sellerRating: item.seller_rating,
          title: item.title, category: item.category as ListingCategory, subCategory: item.sub_category, operation: item.operation as ListingOperation,
          make: item.make, model: item.model, year: item.year, metricType: item.metric_type as 'mileage_km' | 'work_hours', metricValue: item.metric_value,
          priceAmount: item.price_amount, currency: item.currency as 'USD' | 'SYP', rentRateUnit: item.rent_rate_unit, rentRateAmount: item.rent_rate_amount,
          hasDriverOption: item.has_driver_option, driverFeePerDay: item.driver_fee_per_day, securityDeposit: item.security_deposit, zone: item.zone as ZoneLocation,
          locationDetails: item.location_details, images: item.images || [], chassisNumber: item.chassis_number, ownershipVerified: item.ownership_verified,
          inspectionStatus: item.inspection_status as 'none' | 'pending' | 'inspected', inspectionBadge: item.inspection_badge, isPromoted: item.is_promoted,
          promotionScope: item.promotion_scope, promotionActivatedAt: item.promotion_activated_at, promotionExpiresAt: item.promotion_expires_at,
          gpsTrackingEnabled: item.gps_tracking_enabled, gpsDeviceId: item.gps_device_id, gpsLastPing: item.gps_last_ping, gpsBatteryLevel: item.gps_battery_level,
          gpsCoordinates: item.gps_coordinates, serviceNotes: item.service_notes, status: item.status as 'active' | 'in_deal' | 'sold' | 'rented' | 'paused',
          viewsCount: item.views_count, clicksCount: item.clicks_count, inquiriesCount: item.inquiries_count, createdAt: item.created_at,
        })));
      }
    } catch (error) { console.error("Error fetching listings:", error); } finally { setIsListingsLoading(false); }
  };

  const fetchDeals = async () => {
    setIsDealsLoading(true);
    try {
      const { data, error } = await supabase.from('deals').select(`*, listings (title, category, operation)`).order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setDeals(data.map((item: any) => ({
          id: item.id, listingId: item.listing_id, listingTitle: item.listings?.title || 'إعلان محذوف', listingCategory: item.listings?.category || 'cars', listingOperation: item.listings?.operation || 'sale',
          buyerId: item.buyer_id, buyerName: item.buyer_name, sellerId: item.seller_id, sellerName: item.seller_name, agreedPrice: item.agreed_price,
          currency: item.currency, depositAmount: item.deposit_amount, platformCommissionRate: item.platform_commission_rate, platformCommissionAmount: item.platform_commission_amount,
          status: item.status, secretOtp: item.secret_otp, escrowConfirmedAt: item.escrow_confirmed_at, escrowAgentName: item.escrow_agent_name,
          receiptNumber: item.receipt_number, contract: item.contract, deliveryProof: item.delivery_proof, createdAt: item.created_at,
        })));
      }
    } catch (error) { console.error("Error fetching deals:", error); } finally { setIsDealsLoading(false); }
  };

  const fetchGarages = async () => {
    try {
      const { data, error } = await supabase.from('garages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setGarages(data.map((item) => ({
          id: item.id, userId: item.user_id || '', businessName: item.business_name, zone: item.zone as ZoneLocation,
          address: item.address, phone: item.phone, specialties: item.specialties || [], inspectionFeeSYP: item.inspection_fee_syp,
          inspectionFeeUSD: item.inspection_fee_usd, ratingAvg: item.rating_avg, reviewsCount: item.reviews_count,
          subscriptionPlan: item.subscription_plan as 'basic' | 'premium', subscriptionActive: item.subscription_active,
          subscriptionExpiresAt: item.subscription_expires_at, completedInspectionsCount: item.completed_inspections_count,
          isVerified: item.is_verified, notes: item.notes,
        })));
      }
    } catch (error) { console.error("Error fetching garages:", error); }
  };

  const fetchInspectionRequests = async () => {
    try {
      const { data, error } = await supabase.from('inspection_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setInspectionRequests(data.map((item) => ({
          id: item.id, listingId: item.listing_id, listingTitle: '', 
          buyerId: item.buyer_id, buyerName: item.buyer_name, sellerId: item.seller_id, sellerName: item.seller_name,
          garageId: item.garage_id, garageName: item.garage_name, status: item.status, requestedDate: item.requested_date,
          feeAmount: item.fee_amount, currency: item.currency as 'USD' | 'SYP', report: item.report, createdAt: item.created_at,
        })));
      }
    } catch (error) { console.error("Error fetching inspections:", error); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id); else setIsAuthLoading(false);
    });
    fetchListings();
    fetchDeals();
    fetchGarages();
    fetchInspectionRequests();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { fetchProfile(session.user.id); fetchDeals(); fetchInspectionRequests(); } 
      else { setCurrentUser(null); setIsAuthenticated(false); setIsAuthLoading(false); }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(agents));
      localStorage.setItem(STORAGE_KEY_CURRENCY, JSON.stringify(currencyConfig));
      localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
      localStorage.setItem(STORAGE_KEY_COMMISSION, JSON.stringify(commissionRates));
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(admins));
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
      localStorage.setItem(STORAGE_KEY_USED_ITEMS, JSON.stringify(usedItems));
      localStorage.setItem(STORAGE_KEY_USED_ORDERS, JSON.stringify(usedItemOrders));
    } catch (e) {}
  }, [agents, currencyConfig, appointments, commissionRates, admins, auditLogs, reviews, usedItems, usedItemOrders]);

  const logout = async () => { await supabase.auth.signOut(); };
  const switchRole = (role: UserRole) => { if (currentUser?.roles.includes(role) || currentUser?.roles.includes('admin')) setActiveRole(role); };

  const [filter, setFilter] = useState<ListingFilter>({ zone: 'all', category: 'all', operation: 'all', searchQuery: '', inspectedOnly: false });
  const rankedData = rankListings(listings, filter, 5);

  const promoteListing = async (listingId: string, packageId: string) => {
    const pkg = SEED_PROMOTION_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return false;
    try {
      const now = Date.now(); const expiryDate = new Date(now + pkg.durationDays * 24 * 3600 * 1000).toISOString().split('T')[0];
      const { error } = await supabase.from('listings').update({ is_promoted: true, promotion_scope: pkg.zoneScope, promotion_activated_at: now, promotion_expires_at: expiryDate }).eq('id', listingId);
      if (error) throw error;
      await fetchListings(); return true;
    } catch (error) { return false; }
  };

  const addListing = async (newListing: Omit<Listing, 'id' | 'createdAt' | 'viewsCount' | 'clicksCount' | 'inquiriesCount'>) => {
    if (!currentUser) return null;
    try {
      const { error } = await supabase.from('listings').insert([{
        user_id: currentUser.id, seller_name: currentUser.fullName, seller_phone: currentUser.phone, seller_rating: 5.0,
        title: newListing.title, category: newListing.category, sub_category: newListing.subCategory, operation: newListing.operation,
        make: newListing.make, model: newListing.model, year: newListing.year, metric_type: newListing.metricType, metric_value: newListing.metricValue,
        price_amount: newListing.priceAmount, currency: newListing.currency, rent_rate_unit: newListing.rentRateUnit, rent_rate_amount: newListing.rentRateAmount,
        has_driver_option: newListing.hasDriverOption, driver_fee_per_day: newListing.driverFeePerDay, security_deposit: newListing.securityDeposit,
        zone: newListing.zone, location_details: newListing.locationDetails, images: newListing.images, chassis_number: newListing.chassisNumber,
        ownership_verified: true, gps_tracking_enabled: newListing.gpsTrackingEnabled, gps_device_id: newListing.gpsDeviceId,
        service_notes: newListing.serviceNotes, status: 'active',
      }]);
      if (error) throw error;
      await fetchListings();
      return { ...newListing, id: 'temp', createdAt: Date.now(), viewsCount: 0, clicksCount: 0, inquiriesCount: 0 } as Listing;
    } catch (error: any) { alert("حدث خطأ: " + error.message); return null; }
  };

  const updateListingServiceNotes = async (listingId: string, serviceNotes: string) => {
    try { const { error } = await supabase.from('listings').update({ service_notes: serviceNotes.trim() }).eq('id', listingId); if (error) throw error; await fetchListings(); } catch (error) {}
  };

  const createDeal = async (listingId: string, offerPrice: number) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing || !currentUser) return null;

    const calc = calculateEscrowCommission(offerPrice, listing.currency, listing.operation, currentUser.dealsCompletedCount);
    const secretOtp = generateAgentVerificationOtp();

    const contractData = {
      contractNumber: `YMG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      termsSummaryArabic: `عقد ${listing.operation === 'sale' ? 'بيع قطعي' : 'إيجار محدد المدة'} للمركبة ${listing.make} ${listing.model} موديل ${listing.year}. تم حفظ العربون عبر وساطة yamango.`,
      qrVerificationHash: `SHA256:YMG-CONTRACT-${Date.now()}`,
      signedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      buyerSignature: `${currentUser.fullName} (توقيع إلكتروني)`,
      sellerSignature: `${listing.sellerName} (توقيع إلكتروني)`,
    };

    const newDealData = {
      listing_id: listing.id, buyer_id: currentUser.id, buyer_name: currentUser.fullName, seller_id: listing.userId, seller_name: listing.sellerName,
      agreed_price: offerPrice, currency: listing.currency, deposit_amount: calc.depositRequired, platform_commission_rate: calc.commissionRate,
      platform_commission_amount: calc.commissionAmount, status: 'escrow_pending', secret_otp: secretOtp, contract: contractData,
    };

    try {
      const { data, error } = await supabase.from('deals').insert([newDealData]).select().single();
      if (error) throw error;
      await fetchDeals();
      return {
        id: data.id, listingId: listing.id, listingTitle: listing.title, listingCategory: listing.category, listingOperation: listing.operation,
        buyerId: currentUser.id, buyerName: currentUser.fullName, sellerId: listing.userId, sellerName: listing.sellerName,
        agreedPrice: offerPrice, currency: listing.currency, depositAmount: calc.depositRequired, platformCommissionRate: calc.commissionRate,
        platformCommissionAmount: calc.commissionAmount, status: 'escrow_pending', secretOtp: secretOtp, contract: contractData, createdAt: data.created_at,
      } as Deal;
    } catch (error: any) { alert("حدث خطأ أثناء إنشاء الصفقة: " + error.message); return null; }
  };

  const confirmEscrowByAgent = async (dealId: string, enteredOtp: string, agentId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    const agent = agents.find((a) => a.id === agentId);
    if (!deal || !agent) return { success: false, message: 'الصفقة أو الوكيل غير موجود' };
    if (deal.secretOtp.trim().toUpperCase() !== enteredOtp.trim().toUpperCase()) return { success: false, message: 'رمز التحقق (OTP) غير مطابق.' };

    const receiptNum = `REC-KFR-${Math.floor(10000 + Math.random() * 90000)}`;
    const confirmTime = new Date().toISOString().replace('T', ' ').slice(0, 16);

    try {
      const { error } = await supabase.from('deals').update({ status: 'escrow_secured', escrow_confirmed_at: confirmTime, escrow_agent_name: agent.agencyName, receipt_number: receiptNum }).eq('id', dealId);
      if (error) throw error;
      await fetchDeals();
      setAgents((prev) => prev.map((a) => { if (a.id === agentId) { return deal.currency === 'SYP' ? { ...a, balanceSYP: a.balanceSYP + deal.depositAmount } : { ...a, balanceUSD: a.balanceUSD + deal.depositAmount }; } return a; }));
      return { success: true, receiptNumber: receiptNum };
    } catch (error: any) { return { success: false, message: error.message }; }
  };

  const confirmDeliveryAndClose = async (dealId: string, hoursOrKm: number) => {
    const deliveryTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    try {
      const { error } = await supabase.from('deals').update({ status: 'completed', delivery_proof: { pickupKmOrHours: hoursOrKm, pickupDate: deliveryTime, conditionVerified: true } }).eq('id', dealId);
      if (error) throw error;
      await fetchDeals();
    } catch (error) { alert("تعذر إغلاق الصفقة."); }
  };

  const requestInspection = async (listingId: string, garageId: string, requestedDate: string) => {
    const listing = listings.find((l) => l.id === listingId);
    const garage = garages.find((g) => g.id === garageId);
    if (!listing || !garage || !currentUser) return null;

    const newRequestData = {
      listing_id: listing.id, buyer_id: currentUser.id, buyer_name: currentUser.fullName, seller_id: listing.userId, seller_name: listing.sellerName,
      garage_id: garage.id, garage_name: garage.businessName, status: 'approved_by_seller', requested_date: requestedDate,
      fee_amount: listing.currency === 'USD' ? garage.inspectionFeeUSD : garage.inspectionFeeSYP, currency: listing.currency,
    };

    try {
      const { error } = await supabase.from('inspection_requests').insert([newRequestData]);
      if (error) throw error;
      await fetchInspectionRequests();
      return { ...newRequestData, id: 'temp', createdAt: Date.now() } as any;
    } catch (error: any) { alert("حدث خطأ أثناء حجز الفحص: " + error.message); return null; }
  };

  const submitInspectionReport = async (requestId: string, reportData: Omit<InspectionReport, 'id' | 'requestId' | 'isLocked' | 'tamperProofHash'>) => {
    const request = inspectionRequests.find((r) => r.id === requestId); 
    if (!request) return false;
    
    const report: InspectionReport = { ...reportData, id: `rep_${Date.now()}`, requestId, isLocked: true, tamperProofHash: `SHA256:VERIFIED_INSPECTION_${Date.now()}` };

    try {
      const { error } = await supabase.from('inspection_requests').update({ status: 'completed', report: report }).eq('id', requestId);
      if (error) throw error;
      await fetchInspectionRequests();
      
      if (request.listingId) {
        await supabase.from('listings').update({
          inspection_status: 'inspected',
          inspection_badge: {
            reportId: report.id, garageName: report.garageName, garageId: report.garageId,
            inspectionDate: report.date, score: report.overallScore, verdict: report.verdict === 'poor' ? 'fair' : report.verdict
          }
        }).eq('id', request.listingId);
        await fetchListings();
      }
      return true;
    } catch (error) { console.error("Error submitting inspection report:", error); return false; }
  };

  const updateExchangeRate = (newRate: number, autoRecalculate: boolean = true) => {
    if (newRate <= 0) return { success: false, message: 'سعر الصرف يجب أن يكون أكبر من الصفر' };
    setCurrencyConfig({ usdToSypRate: newRate, lastUpdated: new Date().toISOString().slice(0, 10), autoUpdateListings: autoRecalculate, sourceNote: `سعر محدث يدوياً` });
    return { success: true, newRate, listingsUpdated: 0, dealsUpdated: 0, message: `تم التحديث إلى ${newRate} ل.س` };
  };

  const bookAppointment = (data: Omit<FieldInspectionAppointment, 'id' | 'createdAt'>) => {
    const newAppointment: FieldInspectionAppointment = { ...data, id: `app_${Date.now()}`, createdAt: Date.now() };
    setAppointments((prev) => [newAppointment, ...prev]); return newAppointment;
  };
  
  const updateAppointmentStatus = (id: string, status: FieldInspectionAppointment['status'], assignedInspector?: string) => {
    setAppointments((prev) => prev.map((app) => app.id === id ? { ...app, status, ...(assignedInspector ? { assignedInspector } : {}) } : app));
  };
  
  const updateCommissionRates = (newRates: Partial<CommissionRatesConfig>) => { 
    setCommissionRates((prev) => ({ ...prev, ...newRates, lastUpdated: new Date().toISOString().slice(0, 10) })); 
  };
  
  const addPaymentAgent = (agentData: Omit<PaymentAgent, 'id'>) => { 
    const newAgent: PaymentAgent = { ...agentData, id: `ag_${Date.now()}` }; 
    setAgents((prev) => [newAgent, ...prev]); 
    return newAgent; 
  };
  
  const removePaymentAgent = (agentId: string) => { 
    setAgents((prev) => prev.filter((a) => a.id !== agentId)); 
    return true; 
  };
  
  const toggleAgentStatus = (agentId: string) => { 
    setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, isActive: !a.isActive } : a))); 
  };
  
  const regenerateDealOtp = (dealId: string, customCode?: string) => { 
    const freshCode = customCode ? customCode.trim().toUpperCase() : generateAgentVerificationOtp(); 
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, secretOtp: freshCode } : d))); 
    return freshCode; 
  };
  
  const toggleAdmin2fa = (adminId: string) => {
    let toggledName = ''; let newStatus = false;
    setAdmins((prev) => prev.map((adm) => { if (adm.id === adminId) { newStatus = !adm.twoFactorEnabled; toggledName = adm.fullName; return { ...adm, twoFactorEnabled: newStatus }; } return adm; }));
    const now = new Date(); const timeStr = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('ar-SY')}`;
    setAuditLogs((prev) => [{ id: `aud_${Date.now()}`, timestamp: `${timeStr} بتوقيت دمشق`, timestampMs: Date.now(), actorId: currentUser?.id || 'sys', actorName: currentUser?.fullName || 'System', actorRole: 'المشرف العام', category: 'security_auth', categoryLabelArabic: 'أمان الحسابات', action: newStatus ? '2fa_enabled' : '2fa_disabled', actionTitleArabic: newStatus ? 'تفعيل 2FA' : 'تعطيل 2FA', details: `تم التحديث للحساب ${toggledName}`, severity: 'high', status: 'success', location: 'السويداء', ipAddress: '185.12.84.19' }, ...prev]);
    return newStatus;
  };
  
  const addAuditLogEntry = (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'timestampMs'>) => {
    const now = new Date(); const timeStr = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('ar-SY')}`;
    const newEntry: AuditLogEntry = { ...entry, id: `aud_${Date.now()}`, timestamp: `${timeStr} بتوقيت دمشق`, timestampMs: Date.now() };
    setAuditLogs((prev) => [newEntry, ...prev]); return newEntry;
  };
  
  const addGarageReview = (reviewData: Omit<GarageReview, 'id' | 'createdAt'>) => {
    const newReview: GarageReview = { ...reviewData, id: `rev_${Date.now()}`, createdAt: Date.now() };
    const updatedReviews = [newReview, ...reviews]; setReviews(updatedReviews);
    const targetGarageReviews = updatedReviews.filter((r) => r.garageId === reviewData.garageId);
    const avg = targetGarageReviews.length > 0 ? Math.round((targetGarageReviews.reduce((acc, r) => acc + r.rating, 0) / targetGarageReviews.length) * 10) / 10 : 5.0;
    setGarages((prev) => prev.map((g) => (g.id === reviewData.garageId ? { ...g, ratingAvg: avg, reviewsCount: targetGarageReviews.length } : g)));
    return newReview;
  };
  
  const addUsedItem = (itemData: Omit<UsedItem, 'id' | 'createdAt' | 'platformCommissionRate' | 'platformCommissionAmount' | 'sellerNetPayout'> & { customCommissionRate?: number }): UsedItem => {
    const calc = calculateUsedItemCommission(itemData.price, itemData.currency, itemData.customCommissionRate);
    const newItem: UsedItem = { ...itemData, id: `used_item_${Date.now()}`, platformCommissionRate: calc.commissionRate, platformCommissionAmount: calc.commissionAmount, sellerNetPayout: calc.sellerNetPayout, createdAt: Date.now() };
    setUsedItems((prev) => [newItem, ...prev]); return newItem;
  };
  
  const purchaseUsedItem = (orderData: Omit<UsedItemOrder, 'id' | 'createdAt' | 'secretOtp' | 'status'>): UsedItemOrder => {
    const newOrder: UsedItemOrder = { ...orderData, id: generateUsedOrderId(), secretOtp: generateUsedItemOtp(), status: 'escrow_secured', createdAt: Date.now() };
    setUsedItemOrders((prev) => [newOrder, ...prev]); setUsedItems((prev) => prev.map((item) => (item.id === orderData.itemId ? { ...item, status: 'reserved' } : item))); return newOrder;
  };
  
  const updateUsedOrderStatus = (orderId: string, newStatus: UsedItemOrder['status']) => {
    let targetItemId: string | undefined;
    setUsedItemOrders((prev) => prev.map((order) => { if (order.id === orderId) { targetItemId = order.itemId; return { ...order, status: newStatus }; } return order; }));
    if (targetItemId) {
      if (newStatus === 'completed') setUsedItems((prev) => prev.map((item) => (item.id === targetItemId ? { ...item, status: 'sold' } : item)));
      else if (newStatus === 'cancelled') setUsedItems((prev) => prev.map((item) => (item.id === targetItemId ? { ...item, status: 'available' } : item)));
    }
  };
  
  const deleteUsedItem = (itemId: string) => { setUsedItems((prev) => prev.filter((item) => item.id !== itemId)); };
  
  const resetToSeedData = () => { 
    fetchListings(); fetchDeals(); fetchGarages(); fetchInspectionRequests(); 
    localStorage.clear(); 
    window.location.reload(); 
  };

  return {
    isAuthLoading, isAuthenticated, currentUser, activeRole, login: async () => {}, logout, switchRole,
    listings: rankedData.ranked, isListingsLoading, rawListings: listings, promotedCount: rankedData.promotedCount, standardCount: rankedData.standardCount,
    deals, isDealsLoading, inspectionRequests, garages, agents, addPaymentAgent, removePaymentAgent, toggleAgentStatus, regenerateDealOtp,
    currencyConfig, appointments, commissionRates, updateCommissionRates, admins, auditLogs, toggleAdmin2fa, addAuditLogEntry, reviews, addGarageReview,
    language, setLanguage, filter, setFilter, promoteListing, addListing, requestInspection, submitInspectionReport, createDeal, confirmEscrowByAgent,
    confirmDeliveryAndClose, updateExchangeRate, bookAppointment, updateAppointmentStatus, updateListingServiceNotes,
    usedItems, usedItemOrders, addUsedItem, purchaseUsedItem, updateUsedOrderStatus, deleteUsedItem, resetToSeedData,
  };
}