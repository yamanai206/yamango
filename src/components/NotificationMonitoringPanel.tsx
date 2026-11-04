import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  QueuedNotificationItem,
  getOfflineQueue,
  getNotificationStats,
  seedSampleNotificationsIfEmpty,
  manualRetryAllPending,
  manualRetrySingleItem,
  addTestNotificationToQueue,
  deleteNotificationFromQueue,
  clearOfflineQueue,
  getStoredWhatsAppConfig,
  buildDealSummaryMessage,
  formatSyrianPhoneNumber,
} from '../services/whatsapp';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  Search,
  Eye,
  PlusCircle,
  FileText,
  Phone,
  ShieldCheck,
  X,
  RotateCcw,
  Layers,
  ArrowUpDown,
  Check,
  PieChart as PieChartIcon,
  Calendar,
} from 'lucide-react';
import { Deal } from '../types';
import { ScheduleNotificationModal } from './ScheduleNotificationModal';

export interface NotificationMonitoringPanelProps {
  onRefreshParent?: () => void;
  deals?: Deal[];
  onOpenScheduleModal?: () => void;
}

export const NotificationMonitoringPanel: React.FC<NotificationMonitoringPanelProps> = ({
  onRefreshParent,
  deals = [],
  onOpenScheduleModal,
}) => {
  const [queue, setQueue] = useState<QueuedNotificationItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'scheduled' | 'delivered' | 'failed'>('all');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRetryingAll, setIsRetryingAll] = useState(false);
  const [retryingItemId, setRetryingItemId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Modal details
  const [previewItem, setPreviewItem] = useState<QueuedNotificationItem | null>(null);

  // Load and subscribe to queue changes
  const reloadQueue = () => {
    // Seed sample items if completely empty on first visit
    const seeded = seedSampleNotificationsIfEmpty();
    const current = seeded.length > 0 ? seeded : getOfflineQueue();
    setQueue([...current]);
  };

  useEffect(() => {
    reloadQueue();

    const handleQueueUpdated = (e: any) => {
      if (e.detail) {
        setQueue([...e.detail]);
      } else {
        setQueue([...getOfflineQueue()]);
      }
    };

    window.addEventListener('yamango_notification_queue_updated', handleQueueUpdated);
    return () => {
      window.removeEventListener('yamango_notification_queue_updated', handleQueueUpdated);
    };
  }, []);

  const stats = getNotificationStats(queue);

  // Manual Retry All Pending Notifications
  const handleManualRetryAll = async () => {
    if (isRetryingAll) return;
    setIsRetryingAll(true);
    setActionNotice(null);

    try {
      const config = getStoredWhatsAppConfig();
      const res = await manualRetryAllPending(config);

      if (res.retriedCount === 0) {
        setActionNotice({
          type: 'info',
          message: 'لا توجد إشعارات معلّقة حالياً في طابور الانتظار لإعادة إرسالها.',
        });
      } else if (res.deliveredCount > 0) {
        setActionNotice({
          type: 'success',
          message: `تمت إعادة محاولة إرسال ${res.retriedCount} إشعار بنجاح: تم تسليم ${res.deliveredCount} إشعار، وما زال ${res.stillPendingCount} في الانتظار.`,
        });
      } else {
        setActionNotice({
          type: 'warning',
          message: `تمت محاولة إرسال ${res.retriedCount} إشعار، لكن استمر التعليق بسبب عدم توفر اتصال أو استجابة بوابة API (${res.stillPendingCount} ما زال معلقاً).`,
        });
      }

      reloadQueue();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setActionNotice({
        type: 'warning',
        message: `حدث خطأ أثناء إعادة المحاولة: ${err?.message || 'تعذر الاتصال'}`,
      });
    } finally {
      setIsRetryingAll(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  // Manual Retry for a single item
  const handleRetrySingle = async (item: QueuedNotificationItem) => {
    setRetryingItemId(item.id);
    try {
      const config = getStoredWhatsAppConfig();
      const res = await manualRetrySingleItem(item.id, config);
      setActionNotice({
        type: res.success ? 'success' : 'warning',
        message: res.message,
      });
      reloadQueue();
      if (onRefreshParent) onRefreshParent();
    } catch (e: any) {
      setActionNotice({
        type: 'warning',
        message: `تعذرت إعادة الإرسال: ${e?.message || 'خطأ'}`,
      });
    } finally {
      setRetryingItemId(null);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  // Add test notification to queue
  const handleAddTest = () => {
    const randomPhones = ['0933718290', '0944112233', '0955998877', '0966334455'];
    const selectedPhone = randomPhones[Math.floor(Math.random() * randomPhones.length)];
    const newItem = addTestNotificationToQueue(selectedPhone, Math.random() > 0.5 ? 'buyer' : 'seller');
    setActionNotice({
      type: 'info',
      message: `تمت إضافة إشعار صفقة تجريبي إلى طابور الانتظار برقم ${newItem.recipientPhone}. يمكنك الضغط على زر إعادة المحاولة لاختباره.`,
    });
    reloadQueue();
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Delete an item
  const handleDelete = (id: string) => {
    deleteNotificationFromQueue(id);
    reloadQueue();
  };

  // Re-seed demo items
  const handleResetSeed = () => {
    clearOfflineQueue();
    const seeded = seedSampleNotificationsIfEmpty();
    setQueue([...seeded]);
    setActionNotice({
      type: 'info',
      message: 'تمت استعادة 4 إشعارات تجريبية تمثل الحالات الثلاث: مُرسلة، معلّقة، وفاشلة.',
    });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Filter and search queue items
  const filteredQueue = queue.filter((item) => {
    const isItemScheduledFuture = Boolean(
      item.status !== 'delivered' && item.isScheduled && item.scheduledFor && item.scheduledFor > Date.now()
    );

    // Status filter
    if (filterStatus === 'pending') {
      if (item.status !== 'pending' && item.status !== 'retrying') return false;
      if (isItemScheduledFuture) return false;
    } else if (filterStatus === 'scheduled') {
      if (!isItemScheduledFuture) return false;
    } else if (filterStatus === 'delivered') {
      if (item.status !== 'delivered') return false;
    } else if (filterStatus === 'failed') {
      if (item.status !== 'failed_permanently') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = item.deal?.listingTitle?.toLowerCase().includes(q) || false;
      const phoneMatch = item.recipientPhone.includes(q);
      const contractMatch = item.deal?.contract?.contractNumber?.toLowerCase().includes(q) || false;
      const buyerMatch = item.deal?.buyerName?.toLowerCase().includes(q) || false;
      const sellerMatch = item.deal?.sellerName?.toLowerCase().includes(q) || false;
      return titleMatch || phoneMatch || contractMatch || buyerMatch || sellerMatch;
    }

    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
      {/* Top Banner & Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-l from-slate-50 via-white to-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Send className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                لوحة مراقبة حالة الإشعارات وطابور الانتظار
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                تحديث فوري
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              متابعة وصول ملخصات الصفقات وعقود الإسكرو المعتمدة عبر WhatsApp Business API في السويداء وبلدة الكفر، مع إدارة طابور الإرسال في حالات ضعف الشبكة وجدولة الإشعارات لمواعيد لاحقة.
            </p>
          </div>

          {/* Core Action Buttons: Schedule Notification & Manual Retry */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Schedule Notification Button */}
            <button
              type="button"
              data-testid="schedule-dispatch-btn"
              onClick={() => {
                if (onOpenScheduleModal) {
                  onOpenScheduleModal();
                } else {
                  setIsScheduleModalOpen(true);
                }
              }}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              title="جدولة إرسال ملخص صفقة لموعد محدد (تاريخ ووقت)"
            >
              <Calendar className="w-4 h-4" />
              <span>جدولة إرسال ملخص صفقة</span>
              {stats.scheduled > 0 && (
                <span className="bg-white/20 text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {stats.scheduled}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleManualRetryAll}
              disabled={isRetryingAll || stats.pending === 0}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              title="إعادة محاولة إرسال جميع الإشعارات المعلّقة في طابور الانتظار فوراً"
            >
              <RefreshCw className={`w-4 h-4 ${isRetryingAll ? 'animate-spin' : ''}`} />
              <span>إعادة محاولة الإشعارات المعلّقة</span>
              {stats.pending > 0 && (
                <span className="bg-white/20 text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {stats.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleAddTest}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title="إضافة صفقة تجريبية جديدة إلى طابور الانتظار للاختبار"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>إضافة إشعار تجريبي</span>
            </button>

            <button
              type="button"
              onClick={handleResetSeed}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="استعادة نماذج الإشعارات التجريبية (مُرسلة، معلّقة، فاشلة)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in ${
              actionNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : actionNotice.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {actionNotice.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
              {actionNotice.type === 'info' && <Clock className="w-4 h-4 text-blue-600 shrink-0" />}
              <span>{actionNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Status Metric Cards (Delivered, Scheduled, Pending, Failed, Total) */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Sent / Delivered */}
          <div
            onClick={() => setFilterStatus('delivered')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterStatus === 'delivered'
                ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="font-bold text-xs text-emerald-800">الإشعارات المُرسلة</span>
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {stats.delivered}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>تم التسليم بنجاح</span>
              <span className="font-bold text-emerald-700">{stats.successRate}% نسبة النجاح</span>
            </div>
          </div>

          {/* Card 2: Scheduled Notifications */}
          <div
            onClick={() => setFilterStatus('scheduled')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterStatus === 'scheduled'
                ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="font-bold text-xs text-indigo-900">المجدولة للإرسال</span>
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-indigo-700 font-mono">
              {stats.scheduled}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>تاريخ ووقت محدد</span>
              <span className="text-indigo-800 font-semibold">بتوقيت دمشق</span>
            </div>
          </div>

          {/* Card 3: Queued / Pending (The core subject of manual retry) */}
          <div
            onClick={() => setFilterStatus('pending')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="font-bold text-xs text-amber-800">المُعلّقة في طابور الانتظار</span>
              <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono">
              {stats.pending}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>تنتظر إعادة المحاولة</span>
              <span className="text-amber-800 font-semibold">جاهزة للإرسال اليدوي</span>
            </div>
          </div>

          {/* Card 4: Failed Permanently */}
          <div
            onClick={() => setFilterStatus('failed')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterStatus === 'failed'
                ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20'
                : 'bg-white border-slate-200 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="font-bold text-xs text-rose-800">الإشعارات الفاشلة</span>
              <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-rose-700 font-mono">
              {stats.failed}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>تجاوزت سقف المحاولات</span>
              <span className="text-rose-700 font-semibold">تتطلب فحص الرقم</span>
            </div>
          </div>

          {/* Card 5: Total Queue Volume */}
          <div
            onClick={() => setFilterStatus('all')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="font-bold text-xs text-slate-800">إجمالي سجل الإشعارات</span>
              <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {stats.total}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>جميع العمليات المسجلة</span>
              <span className="text-slate-600 font-semibold">عرض الكل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Pie Chart: WhatsApp Queued Notifications Status Distribution */}
      <div className="p-5 border-b border-slate-200 bg-white">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="w-full lg:w-7/12">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <PieChartIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-black text-slate-900">
                مخطط نسب توزيع حالات إشعارات واتساب
              </h4>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                Recharts
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              تحليل فوري لحالة طابور الإشعارات (المُسلّمة بنجاح، المجدولة، المُعلّقة قيد إعادة المحاولة، والفاشلة). يمكنك النقر على أي فئة لتصفية الجدول أدناه مباشرة.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setFilterStatus('delivered')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  filterStatus === 'delivered'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-emerald-300 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">تم التسليم</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black font-mono text-emerald-700">{stats.delivered}</span>
                  <span className="text-[10px] text-slate-500">
                    {stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0}%
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('scheduled')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  filterStatus === 'scheduled'
                    ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-indigo-300 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">مجدولة</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black font-mono text-indigo-700">{stats.scheduled}</span>
                  <span className="text-[10px] text-slate-500">
                    {stats.total > 0 ? Math.round((stats.scheduled / stats.total) * 100) : 0}%
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  filterStatus === 'pending'
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-amber-300 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-slate-700">قيد الانتظار</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black font-mono text-amber-700">{stats.pending}</span>
                  <span className="text-[10px] text-slate-500">
                    {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('failed')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                  filterStatus === 'failed'
                    ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-rose-300 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  <span className="text-xs font-bold text-slate-700">فشل الإرسال</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black font-mono text-rose-700">{stats.failed}</span>
                  <span className="text-[10px] text-slate-500">
                    {stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}%
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Recharts Pie Chart graphic container */}
          <div className="w-full lg:w-5/12 h-64 flex flex-col items-center justify-center p-2 bg-slate-50/80 rounded-2xl border border-slate-200">
            {stats.total === 0 ? (
              <div className="text-xs text-slate-400 text-center py-10">
                لا توجد بيانات إشعارات مسجلة لعرض المخطط
              </div>
            ) : (
              <div className="w-full h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'تم التسليم بنجاح', value: stats.delivered, color: '#059669', statusKey: 'delivered' },
                        { name: 'مجدولة للإرسال', value: stats.scheduled, color: '#6366f1', statusKey: 'scheduled' },
                        { name: 'قيد الانتظار', value: stats.pending, color: '#d97706', statusKey: 'pending' },
                        { name: 'فشل الإرسال', value: stats.failed, color: '#e11d48', statusKey: 'failed' },
                      ].filter((x) => x.value > 0)}
                      cx="50%"
                      cy="46%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      onClick={(data) => {
                        if (data && (data as any).statusKey) {
                          setFilterStatus((data as any).statusKey);
                        }
                      }}
                      cursor="pointer"
                    >
                      {[
                        { color: '#059669', value: stats.delivered },
                        { color: '#6366f1', value: stats.scheduled },
                        { color: '#d97706', value: stats.pending },
                        { color: '#e11d48', value: stats.failed },
                      ]
                        .filter((x) => x.value > 0)
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as any;
                          const pct = stats.total > 0 ? Math.round((data.value / stats.total) * 100) : 0;
                          return (
                            <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-800 text-right font-sans">
                              <div className="font-bold flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                <span>{data.name}</span>
                              </div>
                              <div className="mt-1 text-slate-300 font-mono text-[11px]">
                                {data.value} إشعار ({pct}% من الإجمالي)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={32}
                      formatter={(val) => <span className="text-[11px] font-bold text-slate-700 px-1">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('scheduled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filterStatus === 'scheduled'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>المجدولة ({stats.scheduled})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>المُعلّقة ({stats.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('delivered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filterStatus === 'delivered'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>المُرسلة ({stats.delivered})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('failed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filterStatus === 'failed'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>الفاشلة ({stats.failed})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الهاتف، العقد، الآلية..."
            className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Notifications Table & Detailed List */}
      <div className="overflow-x-auto">
        {filteredQueue.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">
              لا توجد إشعارات مطابقة لمعايير التصفية الحالية.
            </p>
            <p className="text-[11px] text-slate-400">
              {searchQuery ? 'جرّب تعديل نص البحث أو تصفية الحالة.' : 'طابور الانتظار فارغ تماماً.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                <th className="py-3 px-4 font-bold">الصفقة والآلية</th>
                <th className="py-3 px-4 font-bold">المستلم والصفة</th>
                <th className="py-3 px-4 font-bold">حالة الإشعار</th>
                <th className="py-3 px-4 font-bold">المحاولات</th>
                <th className="py-3 px-4 font-bold">تاريخ الإنشاء / الإعادة</th>
                <th className="py-3 px-4 font-bold">تفاصيل الحالة وملاحظات الخطأ</th>
                <th className="py-3 px-4 text-center font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.map((item) => {
                const isScheduledFuture = Boolean(
                  item.status !== 'delivered' && item.isScheduled && item.scheduledFor && item.scheduledFor > Date.now()
                );
                const isPending = (item.status === 'pending' || item.status === 'retrying') && !isScheduledFuture;
                const isDelivered = item.status === 'delivered';
                const isFailed = item.status === 'failed_permanently';
                const isProcessingThis = retryingItemId === item.id;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Deal & Vehicle or Support Ticket */}
                    <td className="py-3 px-4">
                      {item.notificationType === 'support_ticket' || item.supportTicket ? (
                        <>
                          <div className="flex items-center gap-1.5 font-black text-slate-900 line-clamp-1">
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                              تذكرة دعم
                            </span>
                            <span>{item.supportTicket?.subject || item.deal?.listingTitle || 'تذكرة دعم فني'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                            <span>تذكرة: #{item.supportTicket?.ticketNumber || 'TK'}</span>
                            <span>•</span>
                            <span className="font-bold text-purple-700">
                              {item.supportTicket?.categoryLabelArabic || 'استفسار دعم'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-black text-slate-900 line-clamp-1">
                            {item.deal?.listingTitle || 'صفقة وساطة yamango'}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                            <span>عقد: {item.deal?.contract?.contractNumber || 'YAM-CONTR'}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-700">
                              {item.deal?.agreedPrice?.toLocaleString()} {item.deal?.currency || 'USD'}
                            </span>
                          </div>
                        </>
                      )}
                    </td>

                    {/* Recipient & Role */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-900 font-bold text-xs" dir="ltr">
                        {formatSyrianPhoneNumber(item.recipientPhone)}
                      </div>
                      <div className="mt-0.5">
                        {item.supportTicket ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800">
                            مُرسل: {item.supportTicket.userName} ({item.supportTicket.userPhone})
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              item.recipientRole === 'buyer'
                                ? 'bg-blue-50 text-blue-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {item.recipientRole === 'buyer' ? 'المشتري' : 'البائع'}
                            {item.deal && (
                              <span className="mr-1 text-slate-500 font-normal">
                                ({item.recipientRole === 'buyer' ? item.deal.buyerName : item.deal.sellerName})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {isScheduledFuture && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>مجدول: {item.scheduledTimeFormatted || (item.scheduledFor ? new Date(item.scheduledFor).toLocaleDateString('ar-SY') : 'لاحقاً')}</span>
                        </span>
                      )}

                      {isDelivered && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>مُرسل (تم التسليم)</span>
                        </span>
                      )}

                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>
                            {item.status === 'retrying' ? 'قيد إعادة المحاولة' : 'مُعلّق في طابور الانتظار'}
                          </span>
                        </span>
                      )}

                      {isFailed && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>فشل الإرسال نهائياً</span>
                        </span>
                      )}
                    </td>

                    {/* Attempts Counter */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isDelivered
                              ? 'text-emerald-700'
                              : isFailed
                              ? 'text-rose-700'
                              : isScheduledFuture
                              ? 'text-indigo-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {item.attempts} / {item.maxAttempts}
                        </span>
                      </div>
                      <div className="w-16 bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isDelivered
                              ? 'bg-emerald-500'
                              : isFailed
                              ? 'bg-rose-500'
                              : isScheduledFuture
                              ? 'bg-indigo-500'
                              : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (item.attempts / item.maxAttempts) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>

                    {/* Created Date & Next Retry */}
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      <div>{new Date(item.createdAt).toLocaleDateString('ar-SY')}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleTimeString('ar-SY', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Error Cause or Confirmation */}
                    <td className="py-3 px-4 max-w-xs">
                      {isScheduledFuture && (
                        <div className="text-indigo-900 text-[11px] bg-indigo-50 p-1.5 rounded-lg border border-indigo-200">
                          <div className="flex items-center gap-1 font-bold mb-0.5">
                            <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>موعد الإرسال المجدول:</span>
                          </div>
                          <p className="line-clamp-2 text-[10px] text-indigo-800">
                            {item.scheduledTimeFormatted || (item.scheduledFor ? new Date(item.scheduledFor).toLocaleString('ar-SY') : '')}
                          </p>
                        </div>
                      )}

                      {isDelivered && (
                        <div className="text-emerald-800 text-[11px] flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="line-clamp-2">
                            تم استلام رسالة الواتساب وتأكيد إيداع العربون لدى الوكيل.
                          </span>
                        </div>
                      )}

                      {isPending && (
                        <div className="text-amber-800 text-[11px] bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                          <p className="line-clamp-2 font-medium">
                            {item.lastError || 'في طابور إعادة المحاولة عند توفر الشبكة.'}
                          </p>
                        </div>
                      )}

                      {isFailed && (
                        <div className="text-rose-800 text-[11px] bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                          <p className="line-clamp-2 font-medium">
                            {item.lastError || 'تعذر الإرسال بعد استنفاد كامل المحاولات.'}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Send Now Button (calls manualRetrySingleItem directly) */}
                        <button
                          type="button"
                          onClick={() => handleRetrySingle(item)}
                          disabled={isProcessingThis}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 ${
                            isPending || isFailed
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : isScheduledFuture
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                          title={`إرسال هذا الإشعار فوراً عبر استدعاء manualRetrySingleItem (${formatSyrianPhoneNumber(item.recipientPhone)})`}
                        >
                          {isProcessingThis ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isProcessingThis
                              ? 'جارٍ الإرسال...'
                              : isDelivered
                              ? 'إعادة إرسال'
                              : 'إرسال الآن'}
                          </span>
                        </button>

                        {/* View Full WhatsApp Text */}
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="معاينة نص الإشعار الكامل وتفاصيل العقد"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete item */}
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-400 rounded-lg transition-colors cursor-pointer"
                          title="حذف الإشعار من السجل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / Summary Action Area */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">
            إجمالي المعروض: {filteredQueue.length} من أصل {queue.length} إشعار
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] text-slate-400">
            تحديث تلقائي للمحاولات عبر التراجع الأسي (Exponential Backoff)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {stats.pending > 0 && (
            <button
              type="button"
              onClick={handleManualRetryAll}
              disabled={isRetryingAll}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3 h-3 ${isRetryingAll ? 'animate-spin' : ''}`} />
              <span>إعادة محاولة {stats.pending} إشعار معلّق الآن</span>
            </button>
          )}

          {queue.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('هل أنت متأكد من تفريغ سجل طابور الإشعارات بالكامل؟')) {
                  clearOfflineQueue();
                  reloadQueue();
                }
              }}
              className="px-2.5 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              تفريغ السجل
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal for WhatsApp Notification */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  تفاصيل إشعار الواتساب | عقد {previewItem.deal?.contract?.contractNumber}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Recipient & Deal Meta */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">رقم هاتف المستلم:</span>
                  <span className="font-mono font-bold text-slate-900 text-xs" dir="ltr">
                    {formatSyrianPhoneNumber(previewItem.recipientPhone)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">صفة المستلم:</span>
                  <span className="font-bold text-emerald-800">
                    {previewItem.recipientRole === 'buyer' ? 'المشتري' : 'البائع'} ({previewItem.recipientRole === 'buyer' ? previewItem.deal?.buyerName : previewItem.deal?.sellerName})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">حالة الإشعار:</span>
                  <span className="font-bold text-slate-800">
                    {previewItem.status === 'delivered'
                      ? 'مُرسل بنجاح'
                      : previewItem.isScheduled && previewItem.scheduledFor && previewItem.scheduledFor > Date.now()
                      ? `مجدول للإرسال (${previewItem.scheduledTimeFormatted || new Date(previewItem.scheduledFor).toLocaleString('ar-SY')})`
                      : previewItem.status === 'failed_permanently'
                      ? 'فشل الإرسال نهائياً'
                      : 'مُعلّق في طابور الانتظار'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">عدد المحاولات:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {previewItem.attempts} من أصل {previewItem.maxAttempts}
                  </span>
                </div>
              </div>

              {/* Message Bubble Preview */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  نص الرسالة المعتمدة للإرسال (WhatsApp Bubble):
                </label>
                <div className="bg-[#e7f8e8] p-4 rounded-2xl rounded-tr-xs border border-emerald-200 text-xs text-slate-900 whitespace-pre-wrap font-sans leading-relaxed shadow-xs">
                  {previewItem.customMessage || (previewItem.deal ? buildDealSummaryMessage(previewItem.deal, previewItem.inspectionReport) : 'إشعار من منصة yamango')}
                </div>
              </div>

              {/* Error Information if any */}
              {previewItem.lastError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <span className="font-bold block mb-0.5">سجل الخطأ / الملاحظة:</span>
                  <p className="text-[11px] leading-relaxed">{previewItem.lastError}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              {/* If scheduled for future, give instant dispatch option */}
              {previewItem.isScheduled && previewItem.scheduledFor && previewItem.scheduledFor > Date.now() && (
                <button
                  type="button"
                  onClick={() => {
                    handleRetrySingle(previewItem);
                    setPreviewItem(null);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال هذا الإشعار الآن فوراً</span>
                </button>
              )}

              {(previewItem.status === 'pending' || previewItem.status === 'retrying' || previewItem.status === 'failed_permanently') && !(previewItem.isScheduled && previewItem.scheduledFor && previewItem.scheduledFor > Date.now()) && (
                <button
                  type="button"
                  onClick={() => {
                    handleRetrySingle(previewItem);
                    setPreviewItem(null);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الآن</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Notification Modal */}
      <ScheduleNotificationModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        deals={deals}
        onScheduled={() => {
          reloadQueue();
          if (onRefreshParent) onRefreshParent();
        }}
      />
    </div>
  );
};
