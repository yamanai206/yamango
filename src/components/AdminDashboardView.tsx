import React, { useState, useMemo } from 'react';
import { 
  Listing, 
  Deal, 
  GarageProfile, 
  PaymentAgent, 
  CurrencyRateConfig, 
  FieldInspectionAppointment,
  InspectionRequest,
  CommissionRatesConfig,
  AdminSecurityProfile,
  AuditLogEntry,
  UserRole
} from '../types';
import { 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Wrench, 
  Building, 
  Sliders, 
  Receipt,
  FileCheck,
  Send,
  Coins,
  CalendarDays,
  Activity,
  FileText,
  Clock,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Percent,
  Lock,
  Calendar,
  Eye
} from 'lucide-react';
import { WhatsAppSettingsCard } from './WhatsAppSettingsCard';
import { NotificationMonitoringPanel } from './NotificationMonitoringPanel';
import { AdminPushBroadcastCard } from './AdminPushBroadcastCard';
import { ScheduleNotificationModal } from './ScheduleNotificationModal';
import { ScheduledNotificationsGrid } from './ScheduledNotificationsGrid';
import { DealStatisticsPanel } from './DealStatisticsPanel';
import { DealGrowthLineChart } from './DealGrowthLineChart';
import { DealStatusPieChart } from './DealStatusPieChart';
import { CurrencySettings } from './CurrencySettings';
import { ContractManager } from './ContractManager';
import { GarageOccupancyChart } from './GarageOccupancyChart';
import { PlatformEfficiencyPanel } from './PlatformEfficiencyPanel';
import { CalendarScheduler } from './CalendarScheduler';
import { CommissionControlPanel } from './CommissionControlPanel';
import { AgentManager } from './AgentManager';
import { AdminSecuritySettings } from './AdminSecuritySettings';
import { AdminInspectionRequestsTable } from './AdminInspectionRequestsTable';
import { AdminListingsModeration } from './AdminListingsModeration';
import { AdminUserManager } from './AdminUserManager'; // 🔥 استيراد إدارة المستخدمين
import { processOfflineNotificationQueue, getStoredWhatsAppConfig } from '../services/whatsapp';

interface AdminDashboardViewProps {
  listings: Listing[];
  deals: Deal[];
  garages: GarageProfile[];
  agents: PaymentAgent[];
  onOpenSqlModal: () => void;
  currencyConfig: CurrencyRateConfig;
  onUpdateExchangeRate: (newRate: number, autoRecalculate: boolean) => any;
  appointments: FieldInspectionAppointment[];
  onBookAppointment: (data: Omit<FieldInspectionAppointment, 'id' | 'createdAt'>) => void;
  onUpdateAppointmentStatus: (id: string, status: FieldInspectionAppointment['status'], assignedInspector?: string) => void;
  inspectionRequests: InspectionRequest[];
  commissionRates: CommissionRatesConfig;
  onUpdateCommissionRates: (rates: Partial<CommissionRatesConfig>) => void;
  onAddAgent: (agentData: Omit<PaymentAgent, 'id'>) => PaymentAgent;
  onRemoveAgent: (agentId: string) => boolean;
  onToggleAgentStatus: (agentId: string) => void;
  onRegenerateOtp: (dealId: string, customCode?: string) => string;
  admins: AdminSecurityProfile[];
  auditLogs: AuditLogEntry[];
  onToggle2fa: (adminId: string) => boolean;
  onUpdateListingStatus: (listingId: string, status: Listing['status']) => Promise<boolean>;
  onDeleteListing: (listingId: string) => Promise<boolean>;
  onViewListing: (listing: Listing) => void;
  onUpdateUserRole: (userId: string, role: UserRole) => Promise<boolean>; // 🔥 خاصية إدارة المستخدمين
}

export type AdminSubTab = 'overview' | 'commissions' | 'agents' | 'contracts' | 'garages_calendar' | 'currency' | 'notifications' | 'security' | 'moderation' | 'users';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  listings, deals, garages, agents, onOpenSqlModal, currencyConfig, onUpdateExchangeRate,
  appointments, onBookAppointment, onUpdateAppointmentStatus, inspectionRequests,
  commissionRates, onUpdateCommissionRates, onAddAgent, onRemoveAgent, onToggleAgentStatus,
  onRegenerateOtp, admins, auditLogs, onToggle2fa,
  onUpdateListingStatus, onDeleteListing, onViewListing, onUpdateUserRole
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('overview');
  const [promotedCap, setPromotedCap] = useState(5);

  const [isProcessingDeferred, setIsProcessingDeferred] = useState(false);
  const [deferredNotice, setDeferredNotice] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const pendingListingsCount = listings.filter(l => l.status === 'pending_approval').length;

  const totalTradingVolumeUSD = deals.reduce((acc, d) => (d.currency === 'USD' ? acc + d.agreedPrice : acc), 0);
  const totalCommissionUSD = deals.reduce((acc, d) => (d.currency === 'USD' ? acc + d.platformCommissionAmount : acc), 0);
  const promotedListingsCount = listings.filter((l) => l.isPromoted).length;

  const completedDealsCount = useMemo(() => deals.filter((d) => d.status === 'completed').length, [deals]);
  const activeListingsCount = useMemo(() => listings.filter((l) => l.status === 'active').length, [listings]);
  const certifiedGaragesCount = useMemo(() => garages.filter((g) => g.isVerified).length, [garages]);

  const handleProcessDeferred = async () => {
    if (isProcessingDeferred) return;
    setIsProcessingDeferred(true);
    setDeferredNotice(null);
    try {
      const config = getStoredWhatsAppConfig();
      const res = await processOfflineNotificationQueue(config);
      if (res.deliveredCount > 0) {
        setDeferredNotice({ type: 'success', message: `تم تفعيل الإرسال المؤجل بنجاح! تم تسليم ${res.deliveredCount} إشعار.` });
      } else if (res.processedCount === 0) {
        setDeferredNotice({ type: 'info', message: 'لا توجد إشعارات متراكمة في طابور الإرسال المؤجل حالياً.' });
      } else {
        setDeferredNotice({ type: 'info', message: `تم فحص طابور الإرسال المؤجل (${res.processedCount} إشعار): بانتظار استجابة بوابة API.` });
      }
    } catch (e: any) {
      setDeferredNotice({ type: 'error', message: `تعذر تفعيل الإرسال المؤجل: ${e?.message || 'خطأ غير معروف'}` });
    } finally {
      setIsProcessingDeferred(false);
      setTimeout(() => setDeferredNotice(null), 6000);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 text-xs">
      {/* Admin Top Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              لوحة تحكم المشرف العام (إدارة منصة yamango)
            </h2>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            المنصة المركزية لإدارة وساطة الآليات، التواقيع الرقمية، إشغال الكراجات، صرف العملات، ومراجعة الإعلانات.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleProcessDeferred} disabled={isProcessingDeferred} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
            <Send className={`w-3.5 h-3.5 ${isProcessingDeferred ? 'animate-bounce' : ''}`} />
            <span>تفعيل الإرسال المؤجل</span>
          </button>
          <button onClick={onOpenSqlModal} className="px-3.5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shrink-0 shadow-xs">
            مخطط DDL
          </button>
        </div>
      </div>

      {deferredNotice && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 animate-in fade-in ${deferredNotice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : deferredNotice.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>
          <div className="flex items-center gap-2">
            {deferredNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {deferredNotice.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {deferredNotice.type === 'info' && <Clock className="w-4 h-4 text-blue-600 shrink-0" />}
            <span className="font-bold">{deferredNotice.message}</span>
          </div>
        </div>
      )}

      {/* Top Live Statistics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div onClick={() => setActiveSubTab('contracts')} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden text-right">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500 rounded-r-2xl" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">إجمالي الصفقات المكتملة</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform"><CheckCircle2 className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{completedDealsCount}</span>
            <span className="text-xs font-semibold text-slate-500">صفقة مبرمة</span>
          </div>
        </div>

        <div onClick={() => setActiveSubTab('overview')} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden text-right">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500 rounded-r-2xl" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">الإعلانات النشطة المعروضة</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform"><Sparkles className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{activeListingsCount}</span>
            <span className="text-xs font-semibold text-slate-500">إعلان متاح</span>
          </div>
        </div>

        <div onClick={() => setActiveSubTab('moderation')} className="bg-white rounded-2xl border border-amber-200/90 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden text-right">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500 rounded-r-2xl" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800">إعلانات بانتظار المراجعة</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform"><AlertTriangle className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 tabular-nums">{pendingListingsCount}</span>
            <span className="text-xs font-semibold text-amber-700">تحتاج موافقة</span>
          </div>
        </div>

        <div onClick={() => setActiveSubTab('garages_calendar')} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden text-right">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-500 rounded-r-2xl" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">الكراجات الفنية المعتمدة</span>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-105 transition-transform"><Wrench className="w-4 h-4" /></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{certifiedGaragesCount}</span>
            <span className="text-xs font-semibold text-slate-500">كراج معتمد</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <button onClick={() => setActiveSubTab('overview')} className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeSubTab === 'overview' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <TrendingUp className="w-3.5 h-3.5 text-orange-400" /><span>نظرة عامة</span>
        </button>

        {/* 🔥 تبويب إدارة المستخدمين الجديد */}
        <button onClick={() => setActiveSubTab('users')} className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeSubTab === 'users' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span>إدارة المستخدمين</span>
        </button>

        <button onClick={() => setActiveSubTab('moderation')} className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeSubTab === 'moderation' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>مراجعة الإعلانات</span>
          {pendingListingsCount > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full ml-1">{pendingListingsCount}</span>}
        </button>

        <button onClick={() => setActiveSubTab('commissions')} className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeSubTab === 'commissions' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Percent className="w-3.5 h-3.5" /><span>العمولات والأرباح</span>
        </button>
        <button onClick={() => setActiveSubTab('agents')} className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeSubTab === 'agents' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Building className="w-3.5 h-3.5 text-emerald-400" /><span>وكلاء الدفع ({agents.length})</span>
        </button>
        <button onClick={() => setActiveSubTab('contracts')} className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeSubTab === 'contracts' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <FileCheck className="w-3.5 h-3.5 text-emerald-400" /><span>العقود ({deals.length})</span>
        </button>
        <button onClick={() => setActiveSubTab('garages_calendar')} className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeSubTab === 'garages_calendar' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Activity className="w-3.5 h-3.5 text-blue-400" /><span>إشغال الكراجات</span>
        </button>
        <button onClick={() => setActiveSubTab('currency')} className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeSubTab === 'currency' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Coins className="w-3.5 h-3.5 text-orange-400" /><span>أسعار الصرف</span>
        </button>
        <button onClick={() => setActiveSubTab('notifications')} className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeSubTab === 'notifications' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Send className="w-3.5 h-3.5" /><span>طابور الواتساب</span>
        </button>
        <button onClick={() => setActiveSubTab('security')} className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${activeSubTab === 'security' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-rose-300" /><span>الأمان وسجل التدقيق ({auditLogs.length})</span>
        </button>
      </div>

      {/* SUB-TAB: USER MANAGER */}
      {activeSubTab === 'users' && (
        <AdminUserManager onUpdateRole={onUpdateUserRole} />
      )}

      {/* SUB-TAB: MODERATION */}
      {activeSubTab === 'moderation' && (
        <AdminListingsModeration listings={listings} onUpdateStatus={onUpdateListingStatus} onDeleteListing={onDeleteListing} onViewListing={onViewListing} />
      )}

      {/* SUB-TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2"><span className="font-semibold">حجم التداول بالدولار</span><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
              <div className="text-xl font-black text-slate-900 tabular-nums">${totalTradingVolumeUSD.toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2"><span className="font-semibold">إجمالي العمولات</span><Receipt className="w-4 h-4 text-orange-600" /></div>
              <div className="text-xl font-black text-orange-700 tabular-nums">${totalCommissionUSD.toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2"><span className="font-semibold">الكراجات المعتمدة</span><Wrench className="w-4 h-4 text-blue-600" /></div>
              <div className="text-xl font-black text-slate-900 tabular-nums">{garages.length} كراجات</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2"><span className="font-semibold">الإعلانات المروجة</span><Sparkles className="w-4 h-4 text-orange-500" /></div>
              <div className="text-xl font-black text-slate-900 tabular-nums">{promotedListingsCount} إعلانات</div>
            </div>
          </div>
          <PlatformEfficiencyPanel deals={deals} />
          <DealGrowthLineChart deals={deals} />
          <DealStatusPieChart deals={deals} />
          <DealStatisticsPanel deals={deals} />
        </div>
      )}

      {activeSubTab === 'commissions' && <CommissionControlPanel deals={deals} inspectionRequests={inspectionRequests} currencyConfig={currencyConfig} commissionRates={commissionRates} onUpdateRates={onUpdateCommissionRates} />}
      {activeSubTab === 'agents' && <AgentManager agents={agents} deals={deals} onAddAgent={onAddAgent} onRemoveAgent={onRemoveAgent} onToggleAgentStatus={onToggleAgentStatus} onRegenerateOtp={onRegenerateOtp} />}
      {activeSubTab === 'contracts' && <ContractManager deals={deals} currencyConfig={currencyConfig} />}

      {activeSubTab === 'garages_calendar' && (
        <div className="space-y-5">
          <AdminInspectionRequestsTable requests={inspectionRequests} />
          <GarageOccupancyChart garages={garages} inspectionRequests={inspectionRequests} />
          <CalendarScheduler appointments={appointments} onBookAppointment={onBookAppointment} onUpdateStatus={onUpdateAppointmentStatus} allListings={listings} />
        </div>
      )}

      {activeSubTab === 'currency' && <CurrencySettings currencyConfig={currencyConfig} onUpdateRate={onUpdateExchangeRate} listingsCount={listings.length} dealsCount={deals.length} />}

      {activeSubTab === 'notifications' && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2"><Send className="w-5 h-5 text-emerald-200" /><h3 className="text-sm sm:text-base font-black">نظام الإرسال وطابور الواتساب</h3></div>
              <p className="text-emerald-100 text-xs max-w-xl">عند انقطاع التغطية، تتراكم الإشعارات بأمان في طابور محلي. يمكنك جدولة إرسال ملخصات الصفقات لموعد مستقبلي.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button onClick={() => setIsScheduleModalOpen(true)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-colors shadow-sm flex items-center gap-2 shrink-0"><Calendar className="w-4 h-4" /><span>جدولة صفقة</span></button>
              <button onClick={handleProcessDeferred} disabled={isProcessingDeferred} className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl font-black text-xs transition-colors shadow-sm flex items-center gap-2 shrink-0"><RefreshCw className={`w-4 h-4 ${isProcessingDeferred ? 'animate-spin' : ''}`} /><span>تفعيل المؤجل</span></button>
            </div>
          </div>
          <ScheduledNotificationsGrid deals={deals} onOpenScheduleModal={() => setIsScheduleModalOpen(true)} />
          <NotificationMonitoringPanel deals={deals} onOpenScheduleModal={() => setIsScheduleModalOpen(true)} />
          <ScheduleNotificationModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} deals={deals} />
          <AdminPushBroadcastCard deals={deals} />
          <WhatsAppSettingsCard promotedListings={listings.filter((l) => l.isPromoted)} />
        </div>
      )}

      {activeSubTab === 'security' && <AdminSecuritySettings admins={admins} auditLogs={auditLogs} onToggle2fa={onToggle2fa} />}
    </div>
  );
};