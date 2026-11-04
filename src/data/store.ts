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
  SEED_USERS, 
  SEED_GARAGES, 
  SEED_AGENTS, 
  SEED_LISTINGS, 
  SEED_DEALS, 
  SEED_INSPECTION_REQUESTS, 
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

const STORAGE_KEY_LISTINGS = 'yamango_listings_v1';
const STORAGE_KEY_USED_ITEMS = 'yamango_used_items_v1';
const STORAGE_KEY_USED_ORDERS = 'yamango_used_orders_v1';
const STORAGE_KEY_DEALS = 'yamango_deals_v1';
const STORAGE_KEY_REQUESTS = 'yamango_requests_v1';
const STORAGE_KEY_GARAGES = 'yamango_garages_v1';
const STORAGE_KEY_AGENTS = 'yamango_agents_v1';
const STORAGE_KEY_CURRENCY = 'yamango_currency_v1';
const STORAGE_KEY_APPOINTMENTS = 'yamango_appointments_v1';
const STORAGE_KEY_COMMISSION = 'yamango_commission_rates_v1';
const STORAGE_KEY_ADMINS = 'yamango_admins_v1';
const STORAGE_KEY_AUDIT_LOGS = 'yamango_audit_logs_v1';
const STORAGE_KEY_REVIEWS = 'yamango_garage_reviews_v1';
const STORAGE_KEY_LANGUAGE = 'yamango_language_v1';

export function useYamangoStore() {
  // --- Authentication State (Supabase) ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('buyer');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // --- Core Entities State (Mocked LocalStorage for now) ---
  const [listings, setListings] = useState<Listing[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LISTINGS);
      return saved ? JSON.parse(saved) : SEED_LISTINGS;
    } catch {
      return SEED_LISTINGS;
    }
  });

  const [deals, setDeals] = useState<Deal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DEALS);
      return saved ? JSON.parse(saved) : SEED_DEALS;
    } catch {
      return SEED_DEALS;
    }
  });

  const [inspectionRequests, setInspectionRequests] = useState<InspectionRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REQUESTS);
      return saved ? JSON.parse(saved) : SEED_INSPECTION_REQUESTS;
    } catch {
      return SEED_INSPECTION_REQUESTS;
    }
  });

  const [garages, setGarages] = useState<GarageProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GARAGES);
      return saved ? JSON.parse(saved) : SEED_GARAGES;
    } catch {
      return SEED_GARAGES;
    }
  });

  const [agents, setAgents] = useState<PaymentAgent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AGENTS);
      return saved ? JSON.parse(saved) : SEED_AGENTS;
    } catch {
      return SEED_AGENTS;
    }
  });

  const [currencyConfig, setCurrencyConfig] = useState<CurrencyRateConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
      return saved ? JSON.parse(saved) : DEFAULT_CURRENCY_CONFIG;
    } catch {
      return DEFAULT_CURRENCY_CONFIG;
    }
  });

  const [appointments, setAppointments] = useState<FieldInspectionAppointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_APPOINTMENTS);
      return saved ? JSON.parse(saved) : SEED_APPOINTMENTS;
    } catch {
      return SEED_APPOINTMENTS;
    }
  });

  const [commissionRates, setCommissionRates] = useState<CommissionRatesConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMMISSION);
      return saved ? JSON.parse(saved) : DEFAULT_COMMISSION_RATES;
    } catch {
      return DEFAULT_COMMISSION_RATES;
    }
  });

  const [admins, setAdmins] = useState<AdminSecurityProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMINS);
      return saved ? JSON.parse(saved) : SEED_ADMINS;
    } catch {
      return SEED_ADMINS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
      return saved ? JSON.parse(saved) : SEED_AUDIT_LOGS;
    } catch {
      return SEED_AUDIT_LOGS;
    }
  });

  const [reviews, setReviews] = useState<GarageReview[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REVIEWS);
      return saved ? JSON.parse(saved) : SEED_GARAGE_REVIEWS;
    } catch {
      return SEED_GARAGE_REVIEWS;
    }
  });

  const [usedItems, setUsedItems] = useState<UsedItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USED_ITEMS);
      return saved ? JSON.parse(saved) : SEED_USED_ITEMS;
    } catch {
      return SEED_USED_ITEMS;
    }
  });

  const [usedItemOrders, setUsedItemOrders] = useState<UsedItemOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USED_ORDERS);
      return saved ? JSON.parse(saved) : SEED_USED_ORDERS;
    } catch {
      return SEED_USED_ORDERS;
    }
  });

  const [language, setLanguageState] = useState<'ar' | 'en'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANGUAGE);
      return saved === 'en' ? 'en' : 'ar';
    } catch {
      return 'ar';
    }
  });

  const setLanguage = (lang: 'ar' | 'en') => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
    } catch (e) {
      console.warn('Could not save language', e);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  // --- Supabase Authentication Logic ---
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setCurrentUser(null);
        setIsAuthenticated(false);
        return;
      }

      if (data) {
        const userRole = data.role as UserRole;
        const user: User = {
          id: data.id,
          fullName: data.full_name,
          phone: data.phone || '',
          roles: [userRole],
          zone: data.zone || 'al_kafr',
          kycStatus: data.kyc_status || 'pending',
          ratingAvg: 5.0,
          dealsCompletedCount: 0,
        };
        setCurrentUser(user);
        setActiveRole(userRole);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error("Auth error:", err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsAuthLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setIsAuthLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const switchRole = (role: UserRole) => {
    // In a real app, you wouldn't allow switching roles manually.
    // For now, we just update the activeRole locally for demonstration purposes if needed.
    if (currentUser?.roles.includes(role) || currentUser?.roles.includes('admin')) {
      setActiveRole(role);
    }
  };

  // --- Rest of the Store Logic (Mocked) ---
  const [filter, setFilter] = useState<ListingFilter>({
    zone: 'all',
    category: 'all',
    operation: 'all',
    searchQuery: '',
    inspectedOnly: false,
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(listings));
      localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(deals));
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(inspectionRequests));
      localStorage.setItem(STORAGE_KEY_GARAGES, JSON.stringify(garages));
      localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(agents));
      localStorage.setItem(STORAGE_KEY_CURRENCY, JSON.stringify(currencyConfig));
      localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
      localStorage.setItem(STORAGE_KEY_COMMISSION, JSON.stringify(commissionRates));
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(admins));
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
      localStorage.setItem(STORAGE_KEY_USED_ITEMS, JSON.stringify(usedItems));
      localStorage.setItem(STORAGE_KEY_USED_ORDERS, JSON.stringify(usedItemOrders));
    } catch (e) {
      console.warn('Storage sync warning', e);
    }
  }, [listings, deals, inspectionRequests, garages, agents, currencyConfig, appointments, commissionRates, admins, auditLogs, reviews, usedItems, usedItemOrders]);

  const rankedData = rankListings(listings, filter, 5);

  const promoteListing = (listingId: string, packageId: string) => {
    const pkg = SEED_PROMOTION_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return false;

    setListings((prev) =>
      prev.map((item) => {
        if (item.id === listingId) {
          const now = Date.now();
          const expiryDate = new Date(now + pkg.durationDays * 24 * 3600 * 1000).toISOString().split('T')[0];
          return {
            ...item,
            isPromoted: true,
            promotionScope: pkg.zoneScope,
            promotionActivatedAt: now,
            promotionExpiresAt: expiryDate,
          };
        }
        return item;
      })
    );
    return true;
  };

  const addListing = (newListing: Omit<Listing, 'id' | 'createdAt' | 'viewsCount' | 'clicksCount' | 'inquiriesCount'>) => {
    const listing: Listing = {
      ...newListing,
      id: `list_${Date.now()}`,
      createdAt: Date.now(),
      viewsCount: 1,
      clicksCount: 0,
      inquiriesCount: 0,
    };
    setListings((prev) => [listing, ...prev]);
    return listing;
  };

  const updateListingServiceNotes = (listingId: string, serviceNotes: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, serviceNotes: serviceNotes.trim() } : l))
    );
  };

  const requestInspection = (listingId: string, garageId: string, requestedDate: string) => {
    const listing = listings.find((l) => l.id === listingId);
    const garage = garages.find((g) => g.id === garageId);
    if (!listing || !garage || !currentUser) return null;

    const request: InspectionRequest = {
      id: `req_${Date.now()}`,
      listingId: listing.id,
      listingTitle: listing.title,
      buyerId: currentUser.id,
      buyerName: currentUser.fullName,
      sellerId: listing.userId,
      sellerName: listing.sellerName,
      garageId: garage.id,
      garageName: garage.businessName,
      status: 'approved_by_seller',
      requestedDate,
      feeAmount: listing.currency === 'USD' ? garage.inspectionFeeUSD : garage.inspectionFeeSYP,
      currency: listing.currency,
      createdAt: Date.now(),
    };

    setInspectionRequests((prev) => [request, ...prev]);
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, inspectionStatus: 'pending' } : l))
    );
    return request;
  };

  const submitInspectionReport = (
    requestId: string,
    reportData: Omit<InspectionReport, 'id' | 'requestId' | 'isLocked' | 'tamperProofHash'>
  ) => {
    const request = inspectionRequests.find((r) => r.id === requestId);
    if (!request) return false;

    const report: InspectionReport = {
      ...reportData,
      id: `rep_${Date.now()}`,
      requestId,
      isLocked: true,
      tamperProofHash: `SHA256:VERIFIED_INSPECTION_${Date.now()}`,
    };

    setInspectionRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'completed', report } : r))
    );

    setListings((prev) =>
      prev.map((l) => {
        if (l.id === request.listingId) {
          return {
            ...l,
            inspectionStatus: 'inspected',
            inspectionBadge: {
              reportId: report.id,
              garageName: report.garageName,
              garageId: report.garageId,
              inspectionDate: report.date,
              score: report.overallScore,
              verdict: report.verdict === 'poor' ? 'fair' : report.verdict,
            },
          };
        }
        return l;
      })
    );

    setGarages((prev) =>
      prev.map((g) => (g.id === report.garageId ? { ...g, completedInspectionsCount: g.completedInspectionsCount + 1 } : g))
    );

    return true;
  };

  const createDeal = (listingId: string, offerPrice: number) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing || !currentUser) return null;

    const calc = calculateEscrowCommission(offerPrice, listing.currency, listing.operation, currentUser.dealsCompletedCount);
    const secretOtp = generateAgentVerificationOtp();

    const deal: Deal = {
      id: `deal_${Date.now()}`,
      listingId: listing.id,
      listingTitle: listing.title,
      listingCategory: listing.category,
      listingOperation: listing.operation,
      buyerId: currentUser.id,
      buyerName: currentUser.fullName,
      sellerId: listing.userId,
      sellerName: listing.sellerName,
      agreedPrice: offerPrice,
      currency: listing.currency,
      depositAmount: calc.depositRequired,
      platformCommissionRate: calc.commissionRate,
      platformCommissionAmount: calc.commissionAmount,
      status: 'escrow_pending',
      secretOtp,
      gpsTrackingEnabled: listing.gpsTrackingEnabled,
      gpsDeviceId: listing.gpsDeviceId,
      contract: {
        contractNumber: `YMG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        termsSummaryArabic: `عقد ${listing.operation === 'sale' ? 'بيع قطعي' : 'إيجار محدد المدة'} للمركبة/الآلية ${listing.make} ${listing.model} موديل ${listing.year} في محافظة السويداء/الكفر بقيمة ${offerPrice.toLocaleString()} ${listing.currency}${listing.gpsTrackingEnabled && listing.gpsDeviceId ? ` مع تسجيل جهاز تتبع GPS رقم (${listing.gpsDeviceId}) لمراقبة الآلية` : ''}. تم حفظ العربون عبر وساطة yamango المحمية.`,
        qrVerificationHash: `SHA256:YMG-CONTRACT-${Date.now()}`,
        signedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        buyerSignature: `${currentUser.fullName} (توقيع إلكتروني موثق)`,
        sellerSignature: `${listing.sellerName} (توقيع إلكتروني موثق)`,
      },
      createdAt: Date.now(),
    };

    setDeals((prev) => [deal, ...prev]);
    return deal;
  };

  const confirmEscrowByAgent = (dealId: string, enteredOtp: string, agentId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    const agent = agents.find((a) => a.id === agentId);
    if (!deal || !agent) return { success: false, message: 'الصفقة أو الوكيل غير موجود' };

    if (deal.secretOtp.trim().toUpperCase() !== enteredOtp.trim().toUpperCase()) {
      return { success: false, message: 'رمز التحقق (OTP) غير مطابق. يرجى التأكد من الرمز الظاهر في هاتف المشتري.' };
    }

    const receiptNum = `REC-KFR-${Math.floor(10000 + Math.random() * 90000)}`;

    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
          return {
            ...d,
            status: 'escrow_secured',
            escrowConfirmedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
            escrowAgentName: agent.agencyName,
            receiptNumber: receiptNum,
          };
        }
        return d;
      })
    );

    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          return deal.currency === 'SYP'
            ? { ...a, balanceSYP: a.balanceSYP + deal.depositAmount }
            : { ...a, balanceUSD: a.balanceUSD + deal.depositAmount };
        }
        return a;
      })
    );

    return { success: true, receiptNumber: receiptNum };
  };

  const confirmDeliveryAndClose = (dealId: string, hoursOrKm: number) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
          return {
            ...d,
            status: 'completed',
            deliveryProof: {
              pickupKmOrHours: hoursOrKm,
              pickupDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
              conditionVerified: true,
            },
          };
        }
        return d;
      })
    );
  };

  const updateExchangeRate = (newRate: number, autoRecalculate: boolean = true) => {
    if (newRate <= 0) return { success: false, message: 'سعر الصرف يجب أن يكون أكبر من الصفر' };
    const oldRate = currencyConfig.usdToSypRate;
    const ratio = newRate / oldRate;

    const newConfig: CurrencyRateConfig = {
      usdToSypRate: newRate,
      lastUpdated: new Date().toISOString().slice(0, 10),
      autoUpdateListings: autoRecalculate,
      sourceNote: `سعر محدث يدوياً (${newRate.toLocaleString()} ل.س لكل 1 دولار)`,
    };
    setCurrencyConfig(newConfig);

    let listingsUpdated = 0;
    let dealsUpdated = 0;

    if (autoRecalculate && ratio !== 1) {
      setListings((prev) =>
        prev.map((item) => {
          listingsUpdated++;
          if (item.currency === 'SYP') {
            const updatedPrice = Math.round((item.priceAmount * ratio) / 1000) * 1000;
            const updatedRent = item.rentRateAmount ? Math.round((item.rentRateAmount * ratio) / 1000) * 1000 : undefined;
            const updatedDeposit = item.securityDeposit ? Math.round((item.securityDeposit * ratio) / 1000) * 1000 : undefined;
            return {
              ...item,
              priceAmount: updatedPrice,
              rentRateAmount: updatedRent,
              securityDeposit: updatedDeposit,
            };
          }
          return item;
        })
      );

      setDeals((prev) =>
        prev.map((deal) => {
          dealsUpdated++;
          if (deal.currency === 'SYP' && deal.status !== 'completed' && deal.status !== 'cancelled') {
            const newAgreed = Math.round((deal.agreedPrice * ratio) / 1000) * 1000;
            const newDeposit = Math.round((deal.depositAmount * ratio) / 1000) * 1000;
            const newCommission = Math.round((deal.platformCommissionAmount * ratio) / 1000) * 1000;
            return {
              ...deal,
              agreedPrice: newAgreed,
              depositAmount: newDeposit,
              platformCommissionAmount: newCommission,
              contract: {
                ...deal.contract,
                termsSummaryArabic: `${deal.contract.termsSummaryArabic.replace(/بسعر صرف.*$/, '')} (سعر الصرف المحدث: 1$ = ${newRate.toLocaleString()} ل.س)`,
              },
            };
          }
          return deal;
        })
      );
    }

    return {
      success: true,
      newRate,
      listingsUpdated,
      dealsUpdated,
      message: `تم تحديث سعر الصرف بنجاح إلى 1 USD = ${newRate.toLocaleString()} ل.س`,
    };
  };

  const bookAppointment = (data: Omit<FieldInspectionAppointment, 'id' | 'createdAt'>) => {
    const newAppointment: FieldInspectionAppointment = {
      ...data,
      id: `app_${Date.now()}`,
      createdAt: Date.now(),
    };
    setAppointments((prev) => [newAppointment, ...prev]);
    return newAppointment;
  };

  const updateAppointmentStatus = (
    id: string,
    status: FieldInspectionAppointment['status'],
    assignedInspector?: string
  ) => {
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status,
              ...(assignedInspector ? { assignedInspector } : {}),
            }
          : app
      )
    );
  };

  const updateCommissionRates = (newRates: Partial<CommissionRatesConfig>) => {
    setCommissionRates((prev) => ({
      ...prev,
      ...newRates,
      lastUpdated: new Date().toISOString().slice(0, 10),
    }));
  };

  const addPaymentAgent = (agentData: Omit<PaymentAgent, 'id'>) => {
    const newAgent: PaymentAgent = {
      ...agentData,
      id: `ag_${Date.now()}`,
    };
    setAgents((prev) => [newAgent, ...prev]);
    return newAgent;
  };

  const removePaymentAgent = (agentId: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
    return true;
  };

  const toggleAgentStatus = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const regenerateDealOtp = (dealId: string, customCode?: string) => {
    const freshCode = customCode ? customCode.trim().toUpperCase() : generateAgentVerificationOtp();
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, secretOtp: freshCode } : d))
    );
    return freshCode;
  };

  const toggleAdmin2fa = (adminId: string) => {
    let toggledName = '';
    let newStatus = false;

    setAdmins((prev) =>
      prev.map((adm) => {
        if (adm.id === adminId) {
          newStatus = !adm.twoFactorEnabled;
          toggledName = adm.fullName;
          return { ...adm, twoFactorEnabled: newStatus };
        }
        return adm;
      })
    );

    const now = new Date();
    const timeStr = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('ar-SY')}`;
    const newAuditEntry: AuditLogEntry = {
      id: `aud_${Date.now()}`,
      timestamp: `${timeStr} بتوقيت دمشق`,
      timestampMs: Date.now(),
      actorId: currentUser?.id || 'sys',
      actorName: currentUser?.fullName || 'System',
      actorRole: 'المشرف العام',
      category: 'security_auth',
      categoryLabelArabic: 'أمان الحسابات',
      action: newStatus ? '2fa_enabled' : '2fa_disabled',
      actionTitleArabic: newStatus ? 'تفعيل المصادقة الثنائية 2FA لمشرف' : 'تعطيل المصادقة الثنائية 2FA لمشرف',
      details: `قام المشرف بتحديث حالة التحقق بخطوتين (2FA) إلى [${newStatus ? 'مفعلة' : 'معطلة'}] للحساب: ${toggledName || adminId}.`,
      severity: 'high',
      status: 'success',
      location: 'السويداء - الكفر',
      ipAddress: '185.12.84.19',
    };

    setAuditLogs((prev) => [newAuditEntry, ...prev]);
    return newStatus;
  };

  const addAuditLogEntry = (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'timestampMs'>) => {
    const now = new Date();
    const timeStr = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('ar-SY')}`;
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `aud_${Date.now()}`,
      timestamp: `${timeStr} بتوقيت دمشق`,
      timestampMs: Date.now(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const addGarageReview = (reviewData: Omit<GarageReview, 'id' | 'createdAt'>) => {
    const newReview: GarageReview = {
      ...reviewData,
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);

    const targetGarageReviews = updatedReviews.filter((r) => r.garageId === reviewData.garageId);
    const avg = targetGarageReviews.length > 0
      ? Math.round((targetGarageReviews.reduce((acc, r) => acc + r.rating, 0) / targetGarageReviews.length) * 10) / 10
      : 5.0;

    setGarages((prev) =>
      prev.map((g) => {
        if (g.id === reviewData.garageId) {
          return {
            ...g,
            ratingAvg: avg,
            reviewsCount: targetGarageReviews.length,
          };
        }
        return g;
      })
    );

    return newReview;
  };

  const addUsedItem = (
    itemData: Omit<UsedItem, 'id' | 'createdAt' | 'platformCommissionRate' | 'platformCommissionAmount' | 'sellerNetPayout'> & {
      customCommissionRate?: number;
    }
  ): UsedItem => {
    const commissionCalc = calculateUsedItemCommission(
      itemData.price,
      itemData.currency,
      itemData.customCommissionRate
    );

    const newItem: UsedItem = {
      ...itemData,
      id: `used_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      platformCommissionRate: commissionCalc.commissionRate,
      platformCommissionAmount: commissionCalc.commissionAmount,
      sellerNetPayout: commissionCalc.sellerNetPayout,
      createdAt: Date.now(),
    };

    setUsedItems((prev) => [newItem, ...prev]);

    addAuditLogEntry({
      actorId: currentUser?.id || 'anon',
      actorName: currentUser?.fullName || 'مستخدم',
      actorRole: activeRole,
      category: 'escrow_deals',
      categoryLabelArabic: 'سوق المستعمل والوساطة',
      action: 'add_used_item',
      actionTitleArabic: 'إضافة غرض مستعمل للبيع',
      details: `تم إضافة غرض مستعمل جديد: ${newItem.title} بسعر ${newItem.price} ${newItem.currency} وعمولة المنصة ${newItem.platformCommissionAmount}`,
      severity: 'low',
      status: 'success',
    });

    return newItem;
  };

  const purchaseUsedItem = (
    orderData: Omit<UsedItemOrder, 'id' | 'createdAt' | 'secretOtp' | 'status'>
  ): UsedItemOrder => {
    const newOrderId = generateUsedOrderId();
    const secretOtp = generateUsedItemOtp();

    const newOrder: UsedItemOrder = {
      ...orderData,
      id: newOrderId,
      secretOtp,
      status: 'escrow_secured',
      createdAt: Date.now(),
    };

    setUsedItemOrders((prev) => [newOrder, ...prev]);

    setUsedItems((prev) =>
      prev.map((item) =>
        item.id === orderData.itemId ? { ...item, status: 'reserved' } : item
      )
    );

    addAuditLogEntry({
      actorId: currentUser?.id || 'anon',
      actorName: currentUser?.fullName || 'مستخدم',
      actorRole: activeRole,
      category: 'escrow_deals',
      categoryLabelArabic: 'سوق المستعمل والوساطة',
      action: 'escrow_used_item_order',
      actionTitleArabic: 'حجز وضمان غرض مستعمل',
      details: `تم إنشاء طلب وضمان إسكرو للغرض المستعمل ${orderData.itemTitle} عبر ${orderData.agentName || orderData.paymentMethod}`,
      severity: 'medium',
      status: 'success',
    });

    return newOrder;
  };

  const updateUsedOrderStatus = (
    orderId: string,
    newStatus: UsedItemOrder['status']
  ) => {
    let targetItemId: string | undefined;

    setUsedItemOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          targetItemId = order.itemId;
          return { ...order, status: newStatus };
        }
        return order;
      })
    );

    if (targetItemId) {
      if (newStatus === 'completed') {
        setUsedItems((prev) =>
          prev.map((item) =>
            item.id === targetItemId ? { ...item, status: 'sold' } : item
          )
        );
      } else if (newStatus === 'cancelled') {
        setUsedItems((prev) =>
          prev.map((item) =>
            item.id === targetItemId ? { ...item, status: 'available' } : item
          )
        );
      }
    }
  };

  const deleteUsedItem = (itemId: string) => {
    setUsedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const resetToSeedData = () => {
    setListings(SEED_LISTINGS);
    setDeals(SEED_DEALS);
    setInspectionRequests(SEED_INSPECTION_REQUESTS);
    setGarages(SEED_GARAGES);
    setAgents(SEED_AGENTS);
    setCurrencyConfig(DEFAULT_CURRENCY_CONFIG);
    setAppointments(SEED_APPOINTMENTS);
    setCommissionRates(DEFAULT_COMMISSION_RATES);
    setAdmins(SEED_ADMINS);
    setAuditLogs(SEED_AUDIT_LOGS);
    setReviews(SEED_GARAGE_REVIEWS);
    setUsedItems(SEED_USED_ITEMS);
    setUsedItemOrders(SEED_USED_ORDERS);
    localStorage.clear();
  };

  return {
    isAuthLoading,
    isAuthenticated,
    currentUser,
    activeRole,
    login: async () => {}, // Handled by LoginScreen component now
    logout,
    switchRole,
    listings: rankedData.ranked,
    rawListings: listings,
    promotedCount: rankedData.promotedCount,
    standardCount: rankedData.standardCount,
    deals,
    inspectionRequests,
    garages,
    agents,
    addPaymentAgent,
    removePaymentAgent,
    toggleAgentStatus,
    regenerateDealOtp,
    currencyConfig,
    appointments,
    commissionRates,
    updateCommissionRates,
    admins,
    auditLogs,
    toggleAdmin2fa,
    addAuditLogEntry,
    reviews,
    addGarageReview,
    language,
    setLanguage,
    filter,
    setFilter,
    promoteListing,
    addListing,
    requestInspection,
    submitInspectionReport,
    createDeal,
    confirmEscrowByAgent,
    confirmDeliveryAndClose,
    updateExchangeRate,
    bookAppointment,
    updateAppointmentStatus,
    updateListingServiceNotes,
    usedItems,
    usedItemOrders,
    addUsedItem,
    purchaseUsedItem,
    updateUsedOrderStatus,
    deleteUsedItem,
    resetToSeedData,
  };
}