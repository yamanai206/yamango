import React, { useState, useEffect } from 'react';
import { useYamangoStore } from './data/store';
import { initOfflineSyncListener, processOfflineNotificationQueue } from './services/whatsapp';
import { TopBar } from './components/TopBar';
import { FilterBar, ZONES } from './components/FilterBar';
import { matchesFilter } from './utils/ranking';
import { ListingCard } from './components/ListingCard';
import { ListingDetailModal } from './components/ListingDetailModal';
import { StartDealModal } from './components/StartDealModal';
import { DealTrackerModal } from './components/DealTrackerModal';
import { PromotionModal } from './components/PromotionModal';
import { GarageSection } from './components/GarageSection';
import { GarageInspectionModal } from './components/GarageInspectionModal';
import { InspectionReportViewModal } from './components/InspectionReportViewModal';
import { DealsListView } from './components/DealsListView';
import { AgentsListView } from './components/AgentsListView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { NewListingModal } from './components/NewListingModal';
import { SqlExportModal } from './components/SqlExportModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CalendarScheduler } from './components/CalendarScheduler';
import { HelpCenter } from './components/HelpCenter';
import { ContactSupportModal } from './components/ContactSupportModal';
import { PushNotificationModal } from './components/PushNotificationModal';
import { ListingInteractiveMap } from './components/ListingInteractiveMap';
import { UsedGoodsMarketplaceView } from './components/UsedGoodsMarketplaceView';
import { LoginScreen } from './components/LoginScreen';
import { GarageDashboardView } from './components/GarageDashboardView';
import { AgentDashboardView } from './components/AgentDashboardView';
import { 
  registerServiceWorker, 
  initServiceWorkerMessageListener, 
  sendDealPushNotification 
} from './services/pushNotificationService';
import { Listing, Deal, GarageProfile, InspectionReport } from './types';
import { 
  MapPin, 
  ShieldCheck, 
  Wrench, 
  Plus, 
  WifiOff, 
  Wifi, 
  Car,
  X,
  Map,
  LayoutGrid,
  Layers,
  Compass,
} from 'lucide-react';

export default function App() {
  const store = useYamangoStore();

  const [activeTab, setActiveTab] = useState<'listings' | 'used_goods' | 'garages' | 'deals' | 'agents' | 'admin'>('listings');
  const [listingsViewMode, setListingsViewMode] = useState<'grid' | 'map' | 'split'>('grid');

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [listingToDeal, setListingToDeal] = useState<Listing | null>(null);
  const [listingToPromote, setListingToPromote] = useState<Listing | null>(null);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [isNewListingOpen, setIsNewListingOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  
  const [inspectionTargetListing, setInspectionTargetListing] = useState<Listing | null>(null);
  const [inspectionTargetGarage, setInspectionTargetGarage] = useState<GarageProfile | null>(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<InspectionReport | null>(null);

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentTargetListing, setAppointmentTargetListing] = useState<Listing | null>(null);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);

  useEffect(() => {
    const cleanup = initOfflineSyncListener();
    return cleanup;
  }, []);

  useEffect(() => {
    registerServiceWorker();
    const cleanupPush = initServiceWorkerMessageListener((data) => {
      if (data && data.dealId) {
        const found = store.deals.find((d) => d.id === data.dealId);
        if (found) setActiveDeal(found);
      }
    });
    return cleanupPush;
  }, [store.deals]);

  useEffect(() => {
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const runPeriodicNotificationSync = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try { await processOfflineNotificationQueue(); } catch (err) {}
    };
    const initialRunTimer = setTimeout(runPeriodicNotificationSync, 5000);
    const intervalTimer = setInterval(runPeriodicNotificationSync, FIVE_MINUTES_MS);
    return () => {
      clearTimeout(initialRunTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleDynamicListingUrl = () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const listingParam = searchParams.get('listing');
        const hashParam = window.location.hash.startsWith('#listing-') ? window.location.hash.replace('#listing-', '') : null;
        const tabParam = searchParams.get('tab');
        if (tabParam === 'used_goods') setActiveTab('used_goods');

        const targetId = listingParam || hashParam;
        if (targetId) {
          const matched = store.rawListings.find((l) => l.id === targetId);
          if (matched) { setSelectedListing(matched); setActiveTab('listings'); }
        }
      } catch (err) {}
    };
    handleDynamicListingUrl();
    window.addEventListener('popstate', handleDynamicListingUrl);
    window.addEventListener('hashchange', handleDynamicListingUrl);
    return () => {
      window.removeEventListener('popstate', handleDynamicListingUrl);
      window.removeEventListener('hashchange', handleDynamicListingUrl);
    };
  }, [store.rawListings]);

  useEffect(() => {
    if (activeDeal) {
      const updatedDeal = store.deals.find(d => d.id === activeDeal.id);
      if (updatedDeal && JSON.stringify(updatedDeal) !== JSON.stringify(activeDeal)) {
        setActiveDeal(updatedDeal);
      }
    }
  }, [store.deals, activeDeal]);

  const handleOpenAppointmentModal = (listing: Listing) => { setAppointmentTargetListing(listing); setIsAppointmentModalOpen(true); setSelectedListing(null); };
  const handleOpenInspection = (listing: Listing) => { setInspectionTargetListing(listing); setInspectionTargetGarage(null); setIsInspectionModalOpen(true); setSelectedListing(null); };
  const handleOpenInspectionFromGarage = (garage: GarageProfile) => { setInspectionTargetListing(store.listings[0] || null); setInspectionTargetGarage(garage); setIsInspectionModalOpen(true); };
  const handleStartDeal = (listing: Listing) => { setListingToDeal(listing); setSelectedListing(null); };
  const handleDealCreated = (deal: Deal) => { setActiveDeal(deal); sendDealPushNotification(deal).catch((err) => {}); };
  const handlePromoteClick = (listing: Listing) => { setListingToPromote(listing); setSelectedListing(null); };
  const handleViewReportById = (reportId: string) => {
    for (const req of store.inspectionRequests) {
      if (req.report && req.report.id === reportId) { setViewingReport(req.report); return; }
    }
  };

  if (store.isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <img src="/icon-192.png" alt="yamango" className="w-16 h-16 mb-4 animate-pulse object-contain" />
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!store.isAuthenticated || !store.currentUser) { return <LoginScreen />; }

  // 🔥 توجيه الكراج
  if (store.currentUser.roles.includes('garage')) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20 md:pb-10" dir="rtl">
        <TopBar currentUser={store.currentUser} activeRole={store.activeRole} onSwitchRole={store.switchRole} activeTab={activeTab} setActiveTab={setActiveTab} onOpenNewListing={() => setIsNewListingOpen(true)} onOpenSqlModal={() => setIsSqlModalOpen(true)} onResetData={store.resetToSeedData} onOpenHelpCenter={() => setIsHelpCenterOpen(true)} onOpenPushModal={() => setIsPushModalOpen(true)} language={store.language} onToggleLanguage={() => store.setLanguage(store.language === 'ar' ? 'en' : 'ar')} onLogout={store.logout} />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <GarageDashboardView currentUser={store.currentUser} garages={store.garages} inspectionRequests={store.inspectionRequests} onSubmitReport={store.submitInspectionReport} onViewReport={handleViewReportById} />
        </main>
        <InspectionReportViewModal report={viewingReport} onClose={() => setViewingReport(null)} />
        <HelpCenter isOpen={isHelpCenterOpen} onClose={() => setIsHelpCenterOpen(false)} onOpenContactSupport={() => setIsContactSupportOpen(true)} />
        <ContactSupportModal isOpen={isContactSupportOpen} onClose={() => setIsContactSupportOpen(false)} currentUser={store.currentUser} />
        <PushNotificationModal isOpen={isPushModalOpen} onClose={() => setIsPushModalOpen(false)} onOpenDeal={(dealId) => { const found = store.deals.find((d) => d.id === dealId); if (found) setActiveDeal(found); }} />
      </div>
    );
  }

  // 🔥 توجيه وكيل الدفع
  if (store.currentUser.roles.includes('agent')) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20 md:pb-10" dir="rtl">
        <TopBar currentUser={store.currentUser} activeRole={store.activeRole} onSwitchRole={store.switchRole} activeTab={activeTab} setActiveTab={setActiveTab} onOpenNewListing={() => setIsNewListingOpen(true)} onOpenSqlModal={() => setIsSqlModalOpen(true)} onResetData={store.resetToSeedData} onOpenHelpCenter={() => setIsHelpCenterOpen(true)} onOpenPushModal={() => setIsPushModalOpen(true)} language={store.language} onToggleLanguage={() => store.setLanguage(store.language === 'ar' ? 'en' : 'ar')} onLogout={store.logout} />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AgentDashboardView currentUser={store.currentUser} agents={store.agents} deals={store.deals} onConfirmEscrow={store.confirmEscrowByAgent} />
        </main>
        <HelpCenter isOpen={isHelpCenterOpen} onClose={() => setIsHelpCenterOpen(false)} onOpenContactSupport={() => setIsContactSupportOpen(true)} />
        <ContactSupportModal isOpen={isContactSupportOpen} onClose={() => setIsContactSupportOpen(false)} currentUser={store.currentUser} />
        <PushNotificationModal isOpen={isPushModalOpen} onClose={() => setIsPushModalOpen(false)} onOpenDeal={(dealId) => { const found = store.deals.find((d) => d.id === dealId); if (found) setActiveDeal(found); }} />
      </div>
    );
  }

  const matchingInspectedCount = store.rawListings.filter((l) => l.inspectionStatus === 'inspected' && matchesFilter(l, { ...store.filter, inspectedOnly: false })).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20 md:pb-10">
      <TopBar currentUser={store.currentUser} activeRole={store.activeRole} onSwitchRole={store.switchRole} activeTab={activeTab} setActiveTab={setActiveTab} onOpenNewListing={() => setIsNewListingOpen(true)} onOpenSqlModal={() => setIsSqlModalOpen(true)} onResetData={store.resetToSeedData} onOpenHelpCenter={() => setIsHelpCenterOpen(true)} onOpenPushModal={() => setIsPushModalOpen(true)} language={store.language} onToggleLanguage={() => store.setLanguage(store.language === 'ar' ? 'en' : 'ar')} onLogout={store.logout} />

      <div className="bg-slate-900 text-white text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          {isOfflineSimulated ? (<span className="flex items-center gap-1.5 text-amber-400 font-semibold"><WifiOff className="w-3.5 h-3.5" /><span>وضع انقطاع الشبكة / مسودة محلية: تُحفظ بيانات وتقارير الفحص محلياً وتُرفع تلقائياً عند عودة الكهرباء والنت.</span></span>) : (<span className="flex items-center gap-1.5 text-emerald-400 font-medium"><Wifi className="w-3.5 h-3.5" /><span>الاتصال بالشبكة نشط · مركز الانطلاق: بلدة الكفر، محافظة السويداء</span></span>)}
          <button onClick={() => setIsOfflineSimulated(!isOfflineSimulated)} className="mr-auto text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer">{isOfflineSimulated ? 'محاكاة عودة الشبكة' : 'محاكاة ضعف الشبكة'}</button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'listings' && (
          <div>
            <div className="bg-gradient-to-r from-orange-600 via-orange-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white mb-6 shadow-xs relative overflow-hidden">
              <div className="max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-3 backdrop-blur-xs"><MapPin className="w-3.5 h-3.5 text-amber-300" /><span>انطلاقة yamango الأولى من بلدة الكفر</span></div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight leading-tight">سوق السيارات والآليات الزراعية والإنشائية</h1>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed mb-4">بيع وتأجير الجرارات الزراعية، الحفارات، الشاحنات، والسيارات في محافظة السويداء ونواحيها. صفقاتك محمية بنظام إسكرو آمن وفحص فني معتمد قبل الشراء.</p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl backdrop-blur-xs"><ShieldCheck className="w-4 h-4 text-emerald-400" /><span>وساطة إسكرو مضمونة لدى الوكلاء</span></div>
                  <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl backdrop-blur-xs"><Wrench className="w-4 h-4 text-amber-300" /><span>فحص فني بكراجات معتمدة</span></div>
                </div>
              </div>
            </div>

            <FilterBar filter={store.filter} setFilter={store.setFilter} promotedCount={store.promotedCount} totalMatchesCount={store.listings.length} />

            {(store.filter.zone !== 'all' || store.filter.inspectedOnly) && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/90 border border-amber-200/80 rounded-xl px-4 py-2 mb-5 text-xs animate-in fade-in">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-600 font-medium">التصفيات النشطة:</span>
                  {store.filter.zone && store.filter.zone !== 'all' && (<span className="inline-flex items-center gap-1 font-bold text-amber-950 bg-white px-2.5 py-0.5 rounded-md border border-amber-300 shadow-2xs"><MapPin className="w-3.5 h-3.5 text-amber-600" /><span>{ZONES.find((z) => z.id === store.filter.zone)?.label || store.filter.zone}</span><button onClick={() => store.setFilter((prev) => ({ ...prev, zone: 'all' }))} className="text-slate-400 hover:text-rose-600 cursor-pointer mr-0.5"><X className="w-3 h-3" /></button></span>)}
                  {store.filter.inspectedOnly && (<span className="inline-flex items-center gap-1 font-bold text-emerald-950 bg-emerald-100/90 px-2.5 py-0.5 rounded-md border border-emerald-300 shadow-2xs"><ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /><span>المفحوصة فقط (تقارير كراج معتمد)</span><button onClick={() => store.setFilter((prev) => ({ ...prev, inspectedOnly: false }))} className="text-emerald-700 hover:text-rose-600 cursor-pointer mr-0.5"><X className="w-3 h-3" /></button></span>)}
                  <span className="text-slate-400 font-mono text-[11px]">({store.listings.length} إعلان مطابق)</span>
                </div>
                <button onClick={() => store.setFilter((prev) => ({ ...prev, zone: 'all', inspectedOnly: false }))} className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 transition-colors cursor-pointer text-xs"><X className="w-3.5 h-3.5" /><span>إعادة ضبط الفلاتر</span></button>
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5 p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <button role="switch" aria-checked={Boolean(store.filter.inspectedOnly)} onClick={() => store.setFilter((prev) => ({ ...prev, inspectedOnly: !prev.inspectedOnly }))} className={`group relative inline-flex items-center gap-3 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${store.filter.inspectedOnly ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'}`}>
                  <div className={`p-1.5 rounded-lg transition-colors ${store.filter.inspectedOnly ? 'bg-emerald-200/80 text-emerald-800' : 'bg-slate-200/80 text-slate-500'}`}><ShieldCheck className="w-4 h-4" /></div>
                  <div className="text-right"><div className="flex items-center gap-1.5"><span className="font-bold text-slate-900">المفحوصة فقط</span>{store.filter.inspectedOnly ? (<span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">مفعل ({store.listings.length})</span>) : (<span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[10px] font-medium">{matchingInspectedCount} متوفرة</span>)}</div></div>
                  <span dir="ltr" className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors mr-2 ${store.filter.inspectedOnly ? 'bg-emerald-600' : 'bg-slate-300'}`}><span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${store.filter.inspectedOnly ? 'translate-x-4' : 'translate-x-0.5'}`} /></span>
                </button>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium hidden sm:flex"><Compass className="w-3.5 h-3.5 text-amber-600" /><span>طريقة الاستعراض:</span></div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                  <button onClick={() => setListingsViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${listingsViewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}><LayoutGrid className="w-3.5 h-3.5" /><span>عرض شبكي</span></button>
                  <button onClick={() => setListingsViewMode('map')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${listingsViewMode === 'map' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}><Map className="w-3.5 h-3.5" /><span>الخريطة التفاعلية</span></button>
                  <button onClick={() => setListingsViewMode('split')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all items-center gap-1.5 cursor-pointer hidden md:flex ${listingsViewMode === 'split' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}><Layers className="w-3.5 h-3.5" /><span>عرض مدمج</span></button>
                </div>
              </div>
            </div>

            {(listingsViewMode === 'map' || listingsViewMode === 'split') && (<div className="mb-6 animate-in fade-in"><ListingInteractiveMap listings={store.listings} onSelectListing={(l) => setSelectedListing(l)} onStartDeal={handleStartDeal} selectedZone={store.filter.zone} onZoneChange={(z) => store.setFilter((prev) => ({ ...prev, zone: z }))} /></div>)}

            {(listingsViewMode === 'grid' || listingsViewMode === 'split') && (
              <>
                {store.listings.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3"><Car className="w-6 h-6" /></div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">لا توجد إعلانات مطابقة</h3>
                    <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">جرب تغيير خيارات الناحية أو التصنيف، أو أضف إعلانك الأول في الكفر.</p>
                    <div className="flex flex-wrap items-center justify-center gap-2"><button onClick={() => store.setFilter({ zone: 'all', category: 'all', operation: 'all', searchQuery: '', inspectedOnly: false })} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors cursor-pointer">إعادة ضبط الفلاتر</button></div>
                  </div>
                ) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{store.listings.map((item) => (<ListingCard key={item.id} listing={item} onSelect={(l) => setSelectedListing(l)} onPromoteClick={(l) => handlePromoteClick(l)} isOwner={item.userId === store.currentUser?.id} />))}</div>)}
              </>
            )}
          </div>
        )}

        {activeTab === 'used_goods' && (<UsedGoodsMarketplaceView usedItems={store.usedItems} usedItemOrders={store.usedItemOrders} agents={store.agents} currentUser={store.currentUser} usdToSypRate={store.currencyConfig.usdToSypRate} onAddUsedItem={store.addUsedItem} onPurchaseUsedItem={store.purchaseUsedItem} onUpdateOrderStatus={store.updateUsedOrderStatus} onDeleteUsedItem={store.deleteUsedItem} />)}
        {activeTab === 'garages' && (<GarageSection garages={store.garages} inspectionRequests={store.inspectionRequests} currentUser={store.currentUser} reviews={store.reviews} onAddReview={store.addGarageReview} onRequestInspectionModal={handleOpenInspectionFromGarage} onSubmitInspectionReport={store.submitInspectionReport} onViewReport={handleViewReportById} />)}
        {activeTab === 'deals' && (<DealsListView deals={store.deals} onSelectDeal={(d) => setActiveDeal(d)} />)}
        {activeTab === 'agents' && (<AgentsListView agents={store.agents} />)}

        {activeTab === 'admin' && store.currentUser.roles.includes('admin') && (
          <AdminDashboardView
            listings={store.rawListings} 
            deals={store.deals} 
            garages={store.garages} 
            agents={store.agents} 
            onOpenSqlModal={() => setIsSqlModalOpen(true)} 
            currencyConfig={store.currencyConfig} 
            onUpdateExchangeRate={store.updateExchangeRate} 
            appointments={store.appointments} 
            onBookAppointment={store.bookAppointment} 
            onUpdateAppointmentStatus={store.updateAppointmentStatus} 
            inspectionRequests={store.inspectionRequests} 
            commissionRates={store.commissionRates} 
            onUpdateCommissionRates={store.updateCommissionRates} 
            onAddAgent={store.addPaymentAgent} 
            onRemoveAgent={store.removePaymentAgent} 
            onToggleAgentStatus={store.toggleAgentStatus} 
            onRegenerateOtp={store.regenerateDealOtp} 
            admins={store.admins} 
            auditLogs={store.auditLogs} 
            onToggle2fa={store.toggleAdmin2fa}
            onUpdateListingStatus={store.updateListingStatus}
            onDeleteListing={store.deleteListing}
            onViewListing={(listing) => setSelectedListing(listing)}
            onUpdateUserRole={store.updateUserRole}
            onRefreshGarages={store.fetchGarages} /* 🔥 تمرير الدالة الجديدة هنا */
          />
        )}
      </main>

      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} dealsCount={store.deals.length} />

      <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} currentUser={store.currentUser} onRequestInspection={handleOpenInspection} onStartDeal={handleStartDeal} onPromoteListing={handlePromoteClick} onViewReport={handleViewReportById} onBookAppointment={handleOpenAppointmentModal} onUpdateServiceNotes={store.updateListingServiceNotes} onUpdateStatus={store.updateListingStatus} onDeleteListing={store.deleteListing} />
      {isAppointmentModalOpen && (<CalendarScheduler isModal={true} onClose={() => setIsAppointmentModalOpen(false)} appointments={store.appointments} onBookAppointment={store.bookAppointment} onUpdateStatus={store.updateAppointmentStatus} preSelectedListing={appointmentTargetListing} allListings={store.rawListings} />)}
      <StartDealModal listing={listingToDeal} onClose={() => setListingToDeal(null)} currentUser={store.currentUser} onConfirmDeal={store.createDeal} onDealCreated={handleDealCreated} />
      <DealTrackerModal deal={activeDeal} onClose={() => setActiveDeal(null)} currentUser={store.currentUser} agents={store.agents} onConfirmAgentEscrow={store.confirmEscrowByAgent} onConfirmDelivery={store.confirmDeliveryAndClose} />
      <PromotionModal listing={listingToPromote} onClose={() => setListingToPromote(null)} onPromote={store.promoteListing} />
      <GarageInspectionModal isOpen={isInspectionModalOpen} onClose={() => setIsInspectionModalOpen(false)} listing={inspectionTargetListing} selectedGarage={inspectionTargetGarage} garages={store.garages} onRequestInspection={store.requestInspection} />
      <InspectionReportViewModal report={viewingReport} onClose={() => setViewingReport(null)} />
      <NewListingModal isOpen={isNewListingOpen} onClose={() => setIsNewListingOpen(false)} currentUser={store.currentUser} onAddListing={store.addListing} />
      <SqlExportModal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} />
      <HelpCenter isOpen={isHelpCenterOpen} onClose={() => setIsHelpCenterOpen(false)} onOpenContactSupport={() => setIsContactSupportOpen(true)} />
      <ContactSupportModal isOpen={isContactSupportOpen} onClose={() => setIsContactSupportOpen(false)} currentUser={store.currentUser} />
      <PushNotificationModal isOpen={isPushModalOpen} onClose={() => setIsPushModalOpen(false)} onOpenDeal={(dealId) => { const found = store.deals.find((d) => d.id === dealId); if (found) setActiveDeal(found); }} />
    </div>
  );
}