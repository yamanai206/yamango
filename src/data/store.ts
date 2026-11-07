import { useState, useEffect } from 'react';
import { 
  Listing, GarageProfile, PaymentAgent, Deal, InspectionRequest, InspectionReport,
  User, UserRole, ZoneLocation, ListingCategory, ListingOperation, PromotionPackage,
  CurrencyRateConfig, FieldInspectionAppointment, CommissionRatesConfig, AdminSecurityProfile,
  AuditLogEntry, GarageReview, UsedItem, UsedItemOrder,
} from '../types';
import { 
  SEED_PROMOTION_PACKAGES, DEFAULT_CURRENCY_CONFIG,
  DEFAULT_COMMISSION_RATES, SEED_ADMINS, SEED_AUDIT_LOGS
} from './seedData';
import { rankListings, ListingFilter } from '../utils/ranking';
import { calculateEscrowCommission, generateAgentVerificationOtp } from '../utils/escrow';
import { calculateUsedItemCommission, generateUsedItemOtp, generateUsedOrderId } from '../utils/usedGoods';
import { supabase } from '../lib/supabase';

const STORAGE_KEY_ADMINS = 'yamango_admins_v1';
const STORAGE_KEY_AUDIT_LOGS = 'yamango_audit_logs_v1';
const STORAGE_KEY_LANGUAGE = 'yamango_language_v1';

export function useYamangoStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('buyer');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // --- Core Entities State ---
  const [listings, setListings] = useState<Listing[]>([]);
  const [isListingsLoading, setIsListingsLoading] = useState<boolean>(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isDealsLoading, setIsDealsLoading] = useState<boolean>(true);
  const [garages, setGarages] = useState<GarageProfile[]>([]);
  const [inspectionRequests, setInspectionRequests] = useState<InspectionRequest[]>([]);
  const [usedItems, setUsedItems] = useState<UsedItem[]>([]);
  const [usedItemOrders, setUsedItemOrders] = useState<UsedItemOrder[]>([]);
  const [agents, setAgents] = useState<PaymentAgent[]>([]);
  const [reviews, setReviews] = useState<GarageReview[]>([]);
  const [appointments, setAppointments] = useState<FieldInspectionAppointment[]>([]);

  // --- Config State (Cloud Synced) ---
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyRateConfig>(DEFAULT_CURRENCY_CONFIG);
  const [commissionRates, setCommissionRates] = useState<CommissionRatesConfig>(DEFAULT_COMMISSION_RATES);
  
  const [admins, setAdmins] = useState<AdminSecurityProfile[]>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_ADMINS); return saved ? JSON.parse(saved) : SEED_ADMINS; } catch { return SEED_ADMINS; }
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS); return saved ? JSON.parse(saved) : SEED_AUDIT_LOGS; } catch { return SEED_AUDIT_LOGS; }
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

  // --- Fetch Functions ---
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

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      
      if (data) {
        const currConfig = data.find(s => s.key === 'currency_config')?.value;
        const commRates = data.find(s => s.key === 'commission_rates')?.value;
        
        if (currConfig) setCurrencyConfig(currConfig as CurrencyRateConfig);
        if (commRates) setCommissionRates(commRates as CommissionRatesConfig);
      }
    } catch (error) { console.error("Error fetching settings:", error); }
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
          gpsCoordinates: item.gps_coordinates, serviceNotes: item.service_notes, status: item.status as 'active' | 'in_deal' | 'sold' | 'rented' | 'paused' | 'pending_approval',
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

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase.from('garage_reviews').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setReviews(data.map((item) => ({
          id: item.id, garageId: item.garage_id, userName: item.user_name, rating: item.rating,
          comment: item.comment, date: new Date(item.created_at).toISOString().split('T')[0], createdAt: item.created_at, verifiedInspection: item.verified_inspection,
        })));
      }
    } catch (error) { console.error("Error fetching reviews:", error); }
  };

  const fetchInspectionRequests = async () => {
    try {
      const { data, error } = await supabase.from('inspection_requests').select('*, listings(title)').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setInspectionRequests(data.map((item: any) => ({
          id: item.id, listingId: item.listing_id, listingTitle: item.listings?.title || `إعلان #${item.listing_id?.slice(-6)}`, 
          buyerId: item.buyer_id, buyerName: item.buyer_name, sellerId: item.seller_id, sellerName: item.seller_name,
          garageId: item.garage_id, garageName: item.garage_name, status: item.status, requestedDate: item.requested_date,
          feeAmount: item.fee_amount, currency: item.currency as 'USD' | 'SYP', report: item.report, createdAt: item.created_at,
        })));
      }
    } catch (error) { console.error("Error fetching inspections:", error); }
  };

  const fetchUsedItems = async () => {
    try {
      const { data, error } = await supabase.from('used_items').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setUsedItems(data.map(item => ({
          id: item.id, sellerId: item.seller_id, sellerName: item.seller_name, sellerPhone: item.seller_phone, sellerRating: item.seller_rating,
          title: item.title, category: item.category as any, condition: item.condition as any, price: item.price, currency: item.currency as any,
          zone: item.zone as ZoneLocation, locationDetails: item.location_details, description: item.description, images: item.images || [],
          platformCommissionRate: item.platform_commission_rate, platformCommissionAmount: item.platform_commission_amount, sellerNetPayout: item.seller_net_payout,
          status: item.status as any, deliveryOption: item.delivery_option as any, createdAt: item.created_at, viewsCount: item.views_count
        })));
      }
    } catch (error) { console.error("Error fetching used items:", error); }
  };

  const fetchUsedItemOrders = async () => {
    try {
      const { data, error } = await supabase.from('used_item_orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setUsedItemOrders(data.map(item => ({
          id: item.id, itemId: item.item_id, itemTitle: item.item_title, itemCategory: item.item_category as any, itemCondition: item.item_condition as any,
          itemPrice: item.item_price, currency: item.currency as any, commissionRate: item.commission_rate, commissionAmount: item.commission_amount, sellerNetPayout: item.seller_net_payout,
          buyerId: item.buyer_id, buyerName: item.buyer_name, buyerPhone: item.buyer_phone, sellerId: item.seller_id, sellerName: item.seller_name, sellerPhone: item.seller_phone,
          paymentMethod: item.payment_method as any, agentId: item.agent_id, agentName: item.agent_name, agentAddress: item.agent_address, agentPhone: item.agent_phone,
          status: item.status as any, secretOtp: item.secret_otp, deliveryOption: item.delivery_option as any, deliveryAddress: item.delivery_address, notes: item.notes, createdAt: item.created_at
        })));
      }
    } catch (error) { console.error("Error fetching used orders:", error); }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setAgents(data.map((item) => ({
          id: item.id, name: item.name, agencyName: item.agency_name, zone: item.zone as ZoneLocation,
          address: item.address || '', phone: item.phone || '', balanceSYP: item.balance_syp, balanceUSD: item.balance_usd, isActive: item.is_active,
        })));
      }
    } catch (error) { console.error("Error fetching agents:", error); }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase.from('appointments').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setAppointments(data.map(item => ({
          id: item.id, listingId: item.listing_id, listingTitle: item.listing_title, customerName: item.customer_name,
          customerPhone: item.customer_phone, appointmentDate: item.appointment_date, appointmentTime: item.appointment_time,
          location: item.location, zone: item.zone as ZoneLocation, notes: item.notes,
          status: item.status as FieldInspectionAppointment['status'], assignedInspector: item.assigned_inspector, createdAt: item.created_at
        })));
      }
    } catch (error) { console.error("Error fetching appointments:", error); }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating role:", error);
      return false;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id); else setIsAuthLoading(false);
    });
    fetchSettings(); // 🔥 جلب الإعدادات من السحابة
    fetchListings(); fetchDeals(); fetchGarages(); fetchInspectionRequests(); fetchUsedItems(); fetchUsedItemOrders(); fetchAgents(); fetchReviews(); fetchAppointments();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { fetchProfile(session.user.id); fetchDeals(); fetchInspectionRequests(); fetchUsedItemOrders(); } 
      else { setCurrentUser(null); setIsAuthenticated(false); setIsAuthLoading(false); }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(admins));
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(auditLogs));
    } catch (e) {}
  }, [admins, auditLogs]);

  const logout = async () => { await supabase.auth.signOut(); };
  const switchRole = (role: UserRole) => { if (currentUser?.roles.includes(role) || currentUser?.roles.includes('admin')) setActiveRole(role); };

  const [filter, setFilter] = useState<ListingFilter>({ zone: 'all', category: 'all', operation: 'all', searchQuery: '', inspectedOnly: false });
  const visibleListings = listings.filter(l => l.status === 'active' || l.userId === currentUser?.id || currentUser?.roles.includes('admin'));
  const rankedData = rankListings(visibleListings, filter, 5);

  // 🔥 تحديث سعر الصرف في السحابة
  const updateExchangeRate = async (newRate: number, autoRecalculate: boolean = true) => {
    if (newRate <= 0) return { success: false, message: 'سعر الصرف يجب أن يكون أكبر من الصفر' };
    
    const newConfig: CurrencyRateConfig = { 
      usdToSypRate: newRate, 
      lastUpdated: new Date().toISOString().slice(0, 10), 
      autoUpdateListings: autoRecalculate, 
      sourceNote: `سعر محدث يدوياً (${newRate.toLocaleString()} ل.س)` 
    };

    try {
      const { error } = await supabase.from('settings').update({ value: newConfig }).eq('key', 'currency_config');
      if (error) throw error;
      
      setCurrencyConfig(newConfig); // تحديث الواجهة فوراً
      return { success: true, newRate, listingsUpdated: 0, dealsUpdated: 0, message: `تم تحديث سعر الصرف بنجاح إلى ${newRate.toLocaleString()} ل.س` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  // 🔥 تحديث العمولات في السحابة
  const updateCommissionRates = async (newRates: Partial<CommissionRatesConfig>) => {
    const updatedRates = { ...commissionRates, ...newRates, lastUpdated: new Date().toISOString().slice(0, 10) };
    try {
      const { error } = await supabase.from('settings').update({ value: updatedRates }).eq('key', 'commission_rates');
      if (error) throw error;
      setCommissionRates(updatedRates);
    } catch (error) {
      console.error("Error saving commission rates:", error);
    }
  };

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
        service_notes: newListing.serviceNotes, 
        status: currentUser.roles.includes('admin') ? 'active' : 'pending_approval',
      }]);
      if (error) throw error;
      await fetchListings();
      return { ...newListing, id: 'temp', createdAt: Date.now(), viewsCount: 0, clicksCount: 0, inquiriesCount: 0 } as Listing;
    } catch (error: any) { alert("حدث خطأ: " + error.message); return null; }
  };

  const updateListingStatus = async (listingId: string, status: 'active' | 'paused' | 'sold' | 'pending_approval') => {
    try {
      const { error } = await supabase.from('listings').update({ status }).eq('id', listingId);
      if (error) throw error;
      await fetchListings();
      return true;
    } catch (error) { return false; }
  };

  const deleteListing = async (listingId: string) => {
    try {
      const { error } = await supabase.from('listings').delete().eq('id', listingId);
      if (error) throw error;
      await fetchListings();
      return true;
    } catch (error) { return false; }
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
      termsSummaryArabic: `عقد ${listing.operation === 'sale' ? 'بيع قطعي' : 'إيجار محدد المدة'} للمركبة ${listing.make} ${listing.model} موديل ${listing.year}.`,
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
      await supabase.from('listings').update({ status: 'in_deal' }).eq('id', listing.id);
      await fetchListings();
      
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
      const deal = deals.find(d => d.id === dealId);
      if (deal) await supabase.from('listings').update({ status: 'sold' }).eq('id', deal.listingId);
      await fetchListings();
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
    } catch (error: any) { alert("حدث خطأ: " + error.message); return null; }
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
          inspection_badge: { reportId: report.id, garageName: report.garageName, garageId: report.garageId, inspectionDate: report.date, score: report.overallScore, verdict: report.verdict === 'poor' ? 'fair' : report.verdict }
        }).eq('id', request.listingId);
        await fetchListings();
      }
      return true;
    } catch (error) { return false; }
  };

  const addUsedItem = async (itemData: Omit<UsedItem, 'id' | 'createdAt' | 'platformCommissionRate' | 'platformCommissionAmount' | 'sellerNetPayout'> & { customCommissionRate?: number }) => {
    if (!currentUser) return null;
    const calc = calculateUsedItemCommission(itemData.price, itemData.currency, itemData.customCommissionRate);

    try {
      const { error } = await supabase.from('used_items').insert([{
        seller_id: currentUser.id, seller_name: currentUser.fullName, seller_phone: currentUser.phone, seller_rating: 5.0,
        title: itemData.title, category: itemData.category, condition: itemData.condition, price: itemData.price, currency: itemData.currency,
        zone: itemData.zone, location_details: itemData.locationDetails, description: itemData.description, images: itemData.images,
        platform_commission_rate: calc.commissionRate, platform_commission_amount: calc.commissionAmount, seller_net_payout: calc.sellerNetPayout,
        status: 'available', delivery_option: itemData.deliveryOption, views_count: 1
      }]);
      if (error) throw error;
      await fetchUsedItems();
      return true;
    } catch (error: any) { alert("حدث خطأ أثناء إضافة الغرض: " + error.message); return false; }
  };

  const purchaseUsedItem = async (orderData: Omit<UsedItemOrder, 'id' | 'createdAt' | 'secretOtp' | 'status'>) => {
    const secretOtp = generateUsedItemOtp();
    const newOrderId = generateUsedOrderId();

    try {
      const { error } = await supabase.from('used_item_orders').insert([{
        id: newOrderId, item_id: orderData.itemId, buyer_id: orderData.buyerId, buyer_name: orderData.buyerName, buyer_phone: orderData.buyerPhone,
        seller_id: orderData.sellerId, seller_name: orderData.sellerName, seller_phone: orderData.sellerPhone,
        item_title: orderData.itemTitle, item_category: orderData.itemCategory, item_condition: orderData.itemCondition, item_price: orderData.itemPrice, currency: orderData.currency,
        commission_rate: orderData.commissionRate, commission_amount: orderData.commissionAmount, seller_net_payout: orderData.sellerNetPayout,
        payment_method: orderData.paymentMethod, agent_id: orderData.agentId, agent_name: orderData.agentName, agent_address: orderData.agentAddress, agent_phone: orderData.agentPhone,
        status: 'escrow_secured', secret_otp: secretOtp, delivery_option: orderData.deliveryOption, delivery_address: orderData.deliveryAddress, notes: orderData.notes
      }]);

      if (error) throw error;
      await supabase.from('used_items').update({ status: 'reserved' }).eq('id', orderData.itemId);
      await fetchUsedItemOrders();
      await fetchUsedItems();
      return { ...orderData, id: newOrderId, secretOtp, status: 'escrow_secured', createdAt: Date.now() } as UsedItemOrder;
    } catch (error: any) {
      alert("حدث خطأ أثناء إتمام الطلب: " + error.message);
      return null;
    }
  };

  const updateUsedOrderStatus = async (orderId: string, newStatus: UsedItemOrder['status']) => {
    try {
      const { error } = await supabase.from('used_item_orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      const order = usedItemOrders.find(o => o.id === orderId);
      if (order) {
        const itemStatus = newStatus === 'completed' ? 'sold' : newStatus === 'cancelled' ? 'available' : 'reserved';
        await supabase.from('used_items').update({ status: itemStatus }).eq('id', order.itemId);
        await fetchUsedItems();
      }
      await fetchUsedItemOrders();
    } catch (error) { console.error("Error updating order status:", error); }
  };

  const deleteUsedItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from('used_items').delete().eq('id', itemId);
      if (error) throw error;
      await fetchUsedItems();
    } catch (error) { alert("تعذر حذف الغرض."); }
  };

  const bookAppointment = async (data: Omit<FieldInspectionAppointment, 'id' | 'createdAt'>) => {
    try {
      const { data: inserted, error } = await supabase.from('appointments').insert([{
        listing_id: data.listingId, listing_title: data.listingTitle, customer_name: data.customerName, customer_phone: data.customerPhone,
        appointment_date: data.appointmentDate, appointment_time: data.appointmentTime, location: data.location, zone: data.zone, notes: data.notes, status: data.status, assigned_inspector: data.assignedInspector
      }]).select().single();
      if (error) throw error;
      await fetchAppointments();
      return inserted;
    } catch (error: any) { alert("حدث خطأ أثناء حجز الموعد: " + error.message); return null; }
  };

  const updateAppointmentStatus = async (id: string, status: FieldInspectionAppointment['status'], assignedInspector?: string) => {
    try {
      const updateData: any = { status };
      if (assignedInspector) updateData.assigned_inspector = assignedInspector;
      const { error } = await supabase.from('appointments').update(updateData).eq('id', id);
      if (error) throw error;
      await fetchAppointments();
    } catch (error) { console.error("Error updating appointment:", error); }
  };

  const addPaymentAgent = async (agentData: Omit<PaymentAgent, 'id'>) => {
    try {
      const { data, error } = await supabase.from('agents').insert([{
        name: agentData.name, agency_name: agentData.agencyName, zone: agentData.zone, address: agentData.address, phone: agentData.phone,
        balance_syp: agentData.balanceSYP, balance_usd: agentData.balanceUSD, is_active: agentData.isActive
      }]).select().single();
      if (error) throw error;
      await fetchAgents();
      return data;
    } catch (error: any) { alert(error.message); return null; }
  };

  const removePaymentAgent = async (agentId: string) => {
    try {
      const { error } = await supabase.from('agents').delete().eq('id', agentId);
      if (error) throw error;
      await fetchAgents();
      return true;
    } catch (error) { return false; }
  };

  const toggleAgentStatus = async (agentId: string) => {
    try {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;
      const { error } = await supabase.from('agents').update({ is_active: !agent.isActive }).eq('id', agentId);
      if (error) throw error;
      await fetchAgents();
    } catch (error) { console.error(error); }
  };

  const regenerateDealOtp = (dealId: string, customCode?: string) => { const freshCode = customCode ? customCode.trim().toUpperCase() : generateAgentVerificationOtp(); setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, secretOtp: freshCode } : d))); return freshCode; };
  
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

  const addGarageReview = async (reviewData: Omit<GarageReview, 'id' | 'createdAt'>) => {
    if (!currentUser) return null;
    try {
      const { error } = await supabase.from('garage_reviews').insert([{
        garage_id: reviewData.garageId, user_id: currentUser.id, user_name: reviewData.userName,
        rating: reviewData.rating, comment: reviewData.comment, verified_inspection: reviewData.verifiedInspection,
      }]);
      if (error) throw error;
      await fetchReviews(); await fetchGarages();
      return { ...reviewData, id: 'temp', createdAt: Date.now() };
    } catch (error: any) { alert("حدث خطأ أثناء إضافة المراجعة: " + error.message); return null; }
  };

  const resetToSeedData = () => { 
    fetchSettings(); fetchListings(); fetchDeals(); fetchGarages(); fetchInspectionRequests(); fetchUsedItems(); fetchUsedItemOrders(); fetchAgents(); fetchReviews(); fetchAppointments();
    localStorage.clear(); window.location.reload(); 
  };

  return {
    isAuthLoading, isAuthenticated, currentUser, activeRole, login: async () => {}, logout, switchRole,
    listings: rankedData.ranked, isListingsLoading, rawListings: listings, promotedCount: rankedData.promotedCount, standardCount: rankedData.standardCount,
    deals, isDealsLoading, inspectionRequests, garages, agents, addPaymentAgent, removePaymentAgent, toggleAgentStatus, regenerateDealOtp,
    currencyConfig, appointments, commissionRates, updateCommissionRates, admins, auditLogs, toggleAdmin2fa, addAuditLogEntry, reviews, addGarageReview,
    language, setLanguage, filter, setFilter, promoteListing, addListing, requestInspection, submitInspectionReport, createDeal, confirmEscrowByAgent,
    confirmDeliveryAndClose, updateExchangeRate, bookAppointment, updateAppointmentStatus, updateListingServiceNotes,
    usedItems, usedItemOrders, addUsedItem, purchaseUsedItem, updateUsedOrderStatus, deleteUsedItem, resetToSeedData,
    updateListingStatus, deleteListing, fetchAllUsers, updateUserRole
  };
}