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
  AuditLogEntry
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
  Calendar
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
import { AdminInspectionRequestsTable } from './AdminInspectionRequestsTable'; // 🔥 استيراد جدول طلبات الفحص
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
}

export type AdminSubTab = 'overview' | 'commissions' | 'agents' | 'contracts' | 'garages_calendar' | 'currency' | 'notifications' | 'security';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  listings,
  deals,
  garages,
  agents,
  onOpenSqlModal,
  currencyConfig,
  onUpdateExchangeRate,
  appointments,
  onBookAppointment,
  onUpdateAppointmentStatus,
  inspectionRequests,
  commissionRates,
  onUpdateCommissionRates,
  onAddAgent,
  onRemoveAgent,
  onToggleAgentStatus,
  onRegenerateOtp,
  admins,
  auditLogs,
  onToggle2fa,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('overview');
  const [promotedCap, setPromotedCap] = useState(5);

  // Deferred dispatch state
  const [isProcessingDeferred, setIsProcessingDeferred] = useState(false);
  const [deferredNotice, setDeferredNotice] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const totalTradingVolumeUSD = deals.reduce((acc, d) => (d.currency === 'USD' ? acc + d.agreedPrice : acc), 0);
  const totalCommissionUSD = deals.reduce((acc, d) => (d.currency === 'USD' ? acc + d.platformCommissionAmount : acc), 0);
  const promotedListingsCount = listings.filter((l) => l.isPromoted).length;

  // Top Live Widgets Statistics Calculations
  const completedDealsCount = useMemo(() => deals.filter((d) => d.status === 'completed').length, [deals]);
  const activeListingsCount = useMemo(() => listings.filter((l) => l.status === 'active').length, [listings]);
  const certifiedGaragesCount = useMemo(() => garages.filter((g) => g.isVerified).length, [garages]);
  const completionRatePercent = deals.length > 0 ? Math.round((completedDealsCount / deals.length) * 100) : 0;

  const handleProcessDeferred = async () => {
    if (isProcessingDeferred) return;
    setIsProcessingDeferred(true);
    setDeferredNotice(null);
    try {
      const config = getStoredWhatsAppConfig();
      const res = await processOfflineNotificationQueue(config);
      if (res.deliveredCount > 0) {
        setDeferredNotice({
          type: 'success',
          message: `تم تفعيل الإرسال المؤجل بنجاح! تم تسليم ${res.deliveredCount} إشعار تراكم أثناء انقطاع الشبكة، وما زال ${res.stillPendingCount} في الانتظار.`,
        });
      } else if (res.processedCount === 0) {
        setDeferredNotice({
          type: 'info',
          message: 'لا توجد إشعارات متراكمة في طابور الإرسال المؤجل حالياً.',
        });
      } else {
        setDeferredNotice({
          type: 'info',
          message: `تم فحص طابور الإرسال المؤجل (${res.processedCount} إشعار): بانتظار توفر استجابة بوابة الـ API الخارجية (${res.stillPendingCount} قيد الانتظار).`,
        });
      }
    } catch (e: any) {
      setDeferredNotice({
        type: 'error',
        message: `تعذر تفعيل الإرسال المؤجل: ${e?.message || 'خطأ غير معروف'}`,
      });
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
            المنصة المركزية لإدارة وساطة الآليات، التواقيع الرقمية، إشغال الكراجات، صرف العملات، وطابور إشعارات الواتساب في السويداء والكفر.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Deferred Dispatch Trigger Button */}
          <button
            type="button"
            onClick={handleProcessDeferred}
            disabled={isProcessingDeferred}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="معالجة الإشعارات المؤجلة المتراكمة أثناء انقطاع الإنترنت فوراً"
          >
            <Send className={`w-3.5 h-3.5 ${isProcessingDeferred ? 'animate-bounce' : ''}`} />
            <span>تفعيل الإرسال المؤجل</span>
          </button>

          <button
            onClick={onOpenSqlModal}
            className="px-3.5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shrink-0 shadow-xs"
          >
            مخطط DDL
          </button>
        </div>
      </div>

      {/* Deferred Action Notice Alert */}
      {deferredNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 animate-in fade-in ${
            deferredNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : deferredNotice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {deferredNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {deferredNotice.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {deferredNotice.type === 'info' && <Clock className="w-4 h-4 text-blue-600 shrink-0" />}
            <span className="font-bold">{deferredNotice.message}</span>
          </div>
        </div>
      )}

      {/* Top Live Statistics Widgets (Summary Overview Bar) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Widget 1: Completed Deals */}
        <div 
          onClick={() => setActiveSubTab('contracts')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden text-right"
          title="انقر للانتقال إلى إدارة العقود وتفاصيل الصفقات"
        >
          <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500 rounded-r-2xl" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">إجمالي الصفقات المكتملة</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {completedDealsCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">صفقة مبرمة</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">معدل الإنجاز العام:</span>
            <span className="font-bold text-emerald-700 font-mono">
              {completionRatePercent}% ({completedDealsCount} من {deals.length})
            </span>
          </div>
        </div>

        {/* Widget 2: Active Listings */}
        <div 
          onClick={() => setActiveSubTab('overview')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden text-right"
          title="انقر لمشاهدة نظرة عامة على الإعلانات والتداول"
        >
          <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500 rounded-r-2xl" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">الإعلانات النشطة المعروضة</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {activeListingsCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">إعلان متاح</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">منها مثبت في الصدارة:</span>
            <span className="font-bold text-blue-700 font-mono">
              {promotedListingsCount} إعلانات مروجة
            </span>
          </div>
        </div>

        {/* Widget 3: Certified Garages */}
        <div 
          onClick={() => setActiveSubTab('garages_calendar')}
          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden text-right"
          title="انقر للانتقال إلى جدول مواعيد وإشغال الكراجات المعتمدة"
        >
          <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-500 rounded-r-2xl" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">الكراجات الفنية المعتمدة</span>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-105 transition-transform">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {certifiedGaragesCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">كراج معتمد</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">التغطية الميدانية:</span>
            <span className="font-bold text-orange-700">
              الكفر، السويداء، وصلخد ({garages.length} إجمالي الورش)
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
          <span>نظرة عامة وكفاءة المنصة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('commissions')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'commissions'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>التحكم بالعمولات والأرباح المتوقعة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('agents')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'agents'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5 text-emerald-400" />
          <span>وكلاء الدفع ورموز التحقق ({agents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('contracts')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'contracts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>إدارة العقود الموقعة و QR ({deals.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('garages_calendar')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'garages_calendar'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>إشغال الكراجات والمواعيد الميدانية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('currency')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'currency'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Coins className="w-3.5 h-3.5 text-orange-400" />
          <span>أسعار الصرف والعملات (USD / SYP)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('notifications')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'notifications'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>طابور إشعارات الواتساب</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('security')}
          className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'security'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-rose-300" />
          <span>الأمان وسجل التدقيق ({auditLogs.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: OVERVIEW & PLATFORM EFFICIENCY */}
      {activeSubTab === 'overview' && (
        <div className="space-y-5">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="font-semibold">حجم التداول بالدولار</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-slate-900 tabular-nums">
                ${totalTradingVolumeUSD.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                من {deals.length} صفقات مسجلة
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="font-semibold">إجمالي عمولات المنصة</span>
                <Receipt className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-xl font-black text-orange-700 tabular-nums">
                ${totalCommissionUSD.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                محتسبة ومقتطعة تلقائياً
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="font-semibold">الكراجات المعتمدة النشطة</span>
                <Wrench className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-black text-slate-900 tabular-nums">
                {garages.length} كراجات
              </div>
              <span className="text-[10px] text-blue-700 font-semibold mt-1 block">
                تغطي الكفر، السويداء، وصلخد
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="font-semibold">الإعلانات المروجة النشطة</span>
                <Sparkles className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-xl font-black text-slate-900 tabular-nums">
                {promotedListingsCount} إعلانات
              </div>
              <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                سقف التثبيت في الصدارة: {promotedCap}
              </span>
            </div>
          </div>

          {/* Platform Efficiency KPIs: Average Closing Time & Repeat Customer Rate */}
          <PlatformEfficiencyPanel deals={deals} />

          {/* 6-Month Deal Growth Line Chart with Sub-District Filter */}
          <DealGrowthLineChart deals={deals} />

          {/* Deal Status Distribution Pie Chart (Recharts) */}
          <DealStatusPieChart deals={deals} />

          {/* Deal Statistics Section: Completed vs Cancelled Charts using Recharts */}
          <DealStatisticsPanel deals={deals} />

          {/* Commission & Settings Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-orange-600" />
                  <span>نسب عمولة المنصة وحساب الأرباح</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('commissions')}
                  className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-lg text-[10px] font-black transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>لوحة التحكم الكاملة</span>
                  <TrendingUp className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>نسبة عمولة صفقات البيع:</span>
                    <span className="font-bold text-emerald-700 font-mono">{commissionRates.saleRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="0.5"
                    value={commissionRates.saleRate}
                    onChange={(e) => onUpdateCommissionRates({ saleRate: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>نسبة عمولة صفقات التأجير:</span>
                    <span className="font-bold text-blue-700 font-mono">{commissionRates.rentRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="0.5"
                    value={commissionRates.rentRate}
                    onChange={(e) => onUpdateCommissionRates({ rentRate: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>حصة المنصة من رسوم الفحص الفني:</span>
                    <span className="font-bold text-purple-700 font-mono">{commissionRates.inspectionRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="1"
                    value={commissionRates.inspectionRate}
                    onChange={(e) => onUpdateCommissionRates({ inspectionRate: Number(e.target.value) })}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between font-medium text-slate-700 mb-1">
                    <span>سقف الإعلانات المروجة في الصدارة:</span>
                    <span className="font-bold text-slate-900 font-mono">{promotedCap} إعلانات</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="1"
                    value={promotedCap}
                    onChange={(e) => setPromotedCap(Number(e.target.value))}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Fraud Prevention & Anti-Disintermediation Audit Log */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>نظام الحماية من الالتفاف والاحتيال</span>
              </h3>

              <div className="space-y-2.5">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900 block">رصد أرقام الهواتف داخل الشات: نشط</span>
                    <p className="text-[10px] text-emerald-800 leading-snug">
                      تم حجب ومراقبة 12 محاولة لمشاركة أرقام تواصل خارجية وتوجيه الأطراف لدفع العربون لضمان حقهم.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
                  <Building className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block">مراكز التسليم المعتمدة بالكفر:</span>
                    <p className="text-[10px] text-slate-600 leading-snug">
                      ميدان الكفر ومدخل البلدة الصناعي معتمدان لنقاط تسليم الآليات بحضور المشتري والوكيل.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
                  <Users className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block">التتبع الجغرافي للآليات المستأجرة:</span>
                    <p className="text-[10px] text-slate-600 leading-snug">
                      ربط مباشر لأجهزة GPS المعتمدة مع شروط العقد الإلكتروني لحماية الملاك والمستأجرين.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: COMMISSION CONTROL PANEL */}
      {activeSubTab === 'commissions' && (
        <CommissionControlPanel
          deals={deals}
          inspectionRequests={inspectionRequests}
          currencyConfig={currencyConfig}
          commissionRates={commissionRates}
          onUpdateRates={onUpdateCommissionRates}
        />
      )}

      {/* SUB-TAB: AGENT & OTP MANAGER */}
      {activeSubTab === 'agents' && (
        <AgentManager
          agents={agents}
          deals={deals}
          onAddAgent={onAddAgent}
          onRemoveAgent={onRemoveAgent}
          onToggleAgentStatus={onToggleAgentStatus}
          onRegenerateOtp={onRegenerateOtp}
        />
      )}

      {/* SUB-TAB 2: CONTRACT MANAGER */}
      {activeSubTab === 'contracts' && (
        <ContractManager deals={deals} currencyConfig={currencyConfig} />
      )}

      {/* SUB-TAB 3: GARAGE OCCUPANCY & CALENDAR SCHEDULER */}
      {activeSubTab === 'garages_calendar' && (
        <div className="space-y-5">
          
          {/* 🔥 جدول طلبات الفحص الفني الجديد */}
          <AdminInspectionRequestsTable requests={inspectionRequests} />

          {/* Garage Occupancy Chart (Recharts) */}
          <GarageOccupancyChart
            garages={garages}
            inspectionRequests={inspectionRequests}
          />

          {/* Calendar Scheduler */}
          <CalendarScheduler
            appointments={appointments}
            onBookAppointment={onBookAppointment}
            onUpdateStatus={onUpdateAppointmentStatus}
            allListings={listings}
          />
        </div>
      )}

      {/* SUB-TAB 4: CURRENCY SETTINGS */}
      {activeSubTab === 'currency' && (
        <CurrencySettings
          currencyConfig={currencyConfig}
          onUpdateRate={onUpdateExchangeRate}
          listingsCount={listings.length}
          dealsCount={deals.length}
        />
      )}

      {/* SUB-TAB 5: WHATSAPP NOTIFICATION QUEUE */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-5">
          {/* Deferred Dispatch Action Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-200" />
                <h3 className="text-sm sm:text-base font-black">
                  نظام الإرسال وطابور الواتساب (WhatsApp Queue Engine)
                </h3>
              </div>
              <p className="text-emerald-100 text-xs max-w-xl">
                عند انقطاع التغطية أو شبكة الهاتف بالسويداء، تتراكم الإشعارات بأمان في طابور محلي. كما يمكنك جدولة إرسال ملخصات الصفقات لموعد مستقبلي محدد للمشترين والبائعين.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                data-testid="admin-schedule-dispatch-btn"
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-colors shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>جدولة إرسال صفقة</span>
              </button>

              <button
                type="button"
                onClick={handleProcessDeferred}
                disabled={isProcessingDeferred}
                className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl font-black text-xs transition-colors shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessingDeferred ? 'animate-spin' : ''}`} />
                <span>تفعيل الإرسال المؤجل الآن</span>
              </button>
            </div>
          </div>

          {/* Dedicated Scheduled Notifications Grid Component */}
          <ScheduledNotificationsGrid
            deals={deals}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
          />

          {/* Full Queue Viewer with manualRetrySingleItem, scheduling, and item deletion */}
          <NotificationMonitoringPanel
            deals={deals}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
          />

          {/* Schedule Deal Summary Notification Modal */}
          <ScheduleNotificationModal
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            deals={deals}
            onScheduled={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('yamango_notification_queue_updated'));
              }
            }}
          />

          {/* Web Push Notification Broadcast Card */}
          <AdminPushBroadcastCard deals={deals} />

          {/* WhatsApp API Configuration Form */}
          <WhatsAppSettingsCard promotedListings={listings.filter((l) => l.isPromoted)} />
        </div>
      )}

      {/* SUB-TAB 6: SECURITY & AUDIT LOG */}
      {activeSubTab === 'security' && (
        <AdminSecuritySettings
          admins={admins}
          auditLogs={auditLogs}
          onToggle2fa={onToggle2fa}
        />
      )}
    </div>
  );
};