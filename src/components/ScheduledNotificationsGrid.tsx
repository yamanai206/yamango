import React, { useState, useEffect, useMemo } from 'react';
import {
  QueuedNotificationItem,
  getOfflineQueue,
  updateScheduledNotificationTime,
  cancelScheduledNotification,
  manualRetrySingleItem,
  seedSampleScheduledNotificationsIfEmpty,
  formatSyrianPhoneNumber,
  generateWhatsAppDeeplink,
} from '../services/whatsapp';
import { Deal } from '../types';
import {
  Calendar,
  Clock,
  Clock3,
  Edit3,
  Trash2,
  Send,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Eye,
  User,
  Phone,
  FileText,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check,
  Filter,
} from 'lucide-react';

interface ScheduledNotificationsGridProps {
  deals?: Deal[];
  onOpenScheduleModal?: () => void;
}

export const ScheduledNotificationsGrid: React.FC<ScheduledNotificationsGridProps> = ({
  deals = [],
  onOpenScheduleModal,
}) => {
  const [scheduledItems, setScheduledItems] = useState<QueuedNotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'next_48h' | 'later'>('all');

  // Feedback notifications
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Reschedule Modal State
  const [editingItem, setEditingItem] = useState<QueuedNotificationItem | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Cancellation Confirmation Modal State
  const [itemToCancel, setItemToCancel] = useState<QueuedNotificationItem | null>(null);

  // Preview Message Modal State
  const [previewItem, setPreviewItem] = useState<QueuedNotificationItem | null>(null);

  // Sending state for instant override
  const [isSendingImmediateId, setIsSendingImmediateId] = useState<string | null>(null);

  // Load scheduled notifications
  const refreshScheduledList = () => {
    seedSampleScheduledNotificationsIfEmpty();
    const queue = getOfflineQueue();
    const scheduled = queue.filter(
      (item) => item.isScheduled || (item.scheduledFor && item.scheduledFor > 0)
    );
    // Sort by scheduled time ascending (earliest first)
    scheduled.sort((a, b) => (a.scheduledFor || 0) - (b.scheduledFor || 0));
    setScheduledItems(scheduled);
  };

  useEffect(() => {
    refreshScheduledList();

    const handleQueueUpdate = () => {
      refreshScheduledList();
    };

    window.addEventListener('yamango_notification_queue_updated', handleQueueUpdate);
    return () => {
      window.removeEventListener('yamango_notification_queue_updated', handleQueueUpdate);
    };
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const fortyEightHoursAhead = now + 48 * 3600 * 1000;

    return scheduledItems.filter((item) => {
      // Role filter
      if (roleFilter !== 'all' && item.recipientRole !== roleFilter) {
        return false;
      }

      // Time filter
      const targetTime = item.scheduledFor || item.nextRetryAt || 0;
      if (timeFilter === 'today') {
        if (targetTime < startOfToday.getTime() || targetTime > endOfToday.getTime()) {
          return false;
        }
      } else if (timeFilter === 'next_48h') {
        if (targetTime > fortyEightHoursAhead) {
          return false;
        }
      } else if (timeFilter === 'later') {
        if (targetTime <= fortyEightHoursAhead) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const titleMatch = item.deal?.listingTitle?.toLowerCase().includes(query) || false;
        const phoneMatch = item.recipientPhone.includes(query);
        const dealIdMatch = Boolean(item.dealId && item.dealId.toLowerCase().includes(query));
        const customNoteMatch = item.customMessage?.toLowerCase().includes(query) || false;
        return titleMatch || phoneMatch || dealIdMatch || customNoteMatch;
      }

      return true;
    });
  }, [scheduledItems, roleFilter, timeFilter, searchQuery]);

  // Open Reschedule Modal
  const handleOpenReschedule = (item: QueuedNotificationItem) => {
    setEditingItem(item);
    setRescheduleError(null);
    const targetDate = item.scheduledFor ? new Date(item.scheduledFor) : new Date(Date.now() + 3600 * 1000 * 24);
    
    // Format YYYY-MM-DD
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    setNewDate(`${yyyy}-${mm}-${dd}`);

    // Format HH:MM
    const hh = String(targetDate.getHours()).padStart(2, '0');
    const min = String(targetDate.getMinutes()).padStart(2, '0');
    setNewTime(`${hh}:${min}`);

    setNewNote(item.customMessage || '');
    setNewPhone(item.recipientPhone || '');
  };

  // Submit Reschedule
  const handleSaveReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!newDate || !newTime) {
      setRescheduleError('يرجى تحديد التاريخ والوقت بدقة.');
      return;
    }

    const targetTimeMs = new Date(`${newDate}T${newTime}:00`).getTime();
    if (isNaN(targetTimeMs)) {
      setRescheduleError('صيغة التاريخ أو الوقت غير صحيحة.');
      return;
    }

    if (targetTimeMs <= Date.now()) {
      setRescheduleError('يجب أن يكون الموعد المجدول في المستقبل.');
      return;
    }

    const result = updateScheduledNotificationTime(
      editingItem.id,
      targetTimeMs,
      newNote.trim() || undefined,
      newPhone.trim() || undefined
    );

    if (result.success) {
      setFeedbackNotice({
        type: 'success',
        message: `تمت إعادة جدولة الإشعار بنجاح إلى: ${result.updatedItem?.scheduledTimeFormatted}`,
      });
      setEditingItem(null);
      refreshScheduledList();
      setTimeout(() => setFeedbackNotice(null), 5000);
    } else {
      setRescheduleError(result.message);
    }
  };

  // Quick preset button for Reschedule Modal
  const setQuickPreset = (type: 'plus_1h' | 'plus_6h' | 'tomorrow_09am' | 'plus_48h') => {
    const d = new Date();
    if (type === 'plus_1h') {
      d.setHours(d.getHours() + 1);
    } else if (type === 'plus_6h') {
      d.setHours(d.getHours() + 6);
    } else if (type === 'tomorrow_09am') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (type === 'plus_48h') {
      d.setDate(d.getDate() + 2);
      d.setHours(10, 0, 0, 0);
    }

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setNewDate(`${yyyy}-${mm}-${dd}`);

    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    setNewTime(`${hh}:${min}`);
    setRescheduleError(null);
  };

  // Cancel Confirmation
  const handleConfirmCancel = () => {
    if (!itemToCancel) return;

    const result = cancelScheduledNotification(itemToCancel.id);
    if (result.success) {
      setFeedbackNotice({
        type: 'info',
        message: 'تم إلغاء الإشعار المجدول وحذفه من جدول الإرسال بنجاح.',
      });
      setItemToCancel(null);
      refreshScheduledList();
      setTimeout(() => setFeedbackNotice(null), 4000);
    } else {
      setFeedbackNotice({
        type: 'warning',
        message: result.message,
      });
    }
  };

  // Immediate send override
  const handleSendImmediately = async (item: QueuedNotificationItem) => {
    setIsSendingImmediateId(item.id);
    try {
      const res = await manualRetrySingleItem(item.id);
      if (res.success) {
        setFeedbackNotice({
          type: 'success',
          message: `تم إرسال الإشعار فورياً بنجاح للرقم ${item.recipientPhone}!`,
        });
      } else {
        setFeedbackNotice({
          type: 'warning',
          message: `تمت محاولة الإرسال: ${res.message}`,
        });
      }
      refreshScheduledList();
      setTimeout(() => setFeedbackNotice(null), 5000);
    } catch (err: any) {
      setFeedbackNotice({
        type: 'warning',
        message: `تعذر الإرسال الفوري: ${err?.message || 'خطأ غير معروف'}`,
      });
    } finally {
      setIsSendingImmediateId(null);
    }
  };

  // Format remaining time in Arabic
  const formatRemainingTime = (targetTimeMs?: number) => {
    if (!targetTimeMs) return 'غير محدد';
    const diffMs = targetTimeMs - Date.now();
    if (diffMs <= 0) {
      return 'حان موعد الإرسال الآن';
    }
    const diffHours = Math.floor(diffMs / (3600 * 1000));
    const diffMinutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `متبقي ${diffDays} يوم و ${diffHours % 24} ساعة`;
    }
    if (diffHours > 0) {
      return `متبقي ${diffHours} ساعة و ${diffMinutes} دقيقة`;
    }
    return `متبقي ${diffMinutes} دقيقة`;
  };

  // Calculate high-level breakdown
  const stats = useMemo(() => {
    const total = scheduledItems.length;
    const now = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999).valueOf();
    const todayCount = scheduledItems.filter(
      (i) => (i.scheduledFor || 0) <= endOfToday.getTime()
    ).length;
    const futureCount = total - todayCount;
    return { total, todayCount, futureCount };
  }, [scheduledItems]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 text-xs">
      {/* Component Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                جدول الإشعارات المجدولة (Scheduled Notifications Grid)
              </h3>
              <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {scheduledItems.length} إشعار مجدول
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              مراقبة وإدارة الإشعارات المستقبلية المبرمجة للمشترين والبائعين بالسويداء والكفر مع إمكانية إعادة الجدولة أو الإلغاء.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onOpenScheduleModal && (
            <button
              type="button"
              onClick={onOpenScheduleModal}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>جدولة إشعار جديد</span>
            </button>
          )}

          <button
            type="button"
            onClick={refreshScheduledList}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="تحديث القائمة"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackNotice && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 animate-in fade-in ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : feedbackNotice.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          {feedbackNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {feedbackNotice.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
          {feedbackNotice.type === 'info' && <Clock className="w-4 h-4 text-blue-600 shrink-0" />}
          <span className="font-bold text-xs">{feedbackNotice.message}</span>
        </div>
      )}

      {/* Mini Stats Ribbon */}
      <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
        <div className="text-center">
          <span className="text-[10px] text-slate-500 block">إجمالي الإشعارات المجدولة</span>
          <span className="text-base font-black text-indigo-700 font-mono">{stats.total}</span>
        </div>
        <div className="text-center border-r border-slate-200">
          <span className="text-[10px] text-slate-500 block">مجدول للإرسال اليوم</span>
          <span className="text-base font-black text-amber-700 font-mono">{stats.todayCount}</span>
        </div>
        <div className="text-center border-r border-slate-200">
          <span className="text-[10px] text-slate-500 block">مجدول للأيام القادمة</span>
          <span className="text-base font-black text-emerald-700 font-mono">{stats.futureCount}</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الهاتف، عنوان الآلية، أو رقم الصفقة..."
            className="w-full pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-400"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">كافة المستلمين</option>
            <option value="buyer">المشتري فقط</option>
            <option value="seller">البائع فقط</option>
          </select>

          {/* Time Filter */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">كافة المواعيد</option>
            <option value="today">مواعيد اليوم</option>
            <option value="next_48h">خلال 48 ساعة</option>
            <option value="later">المواعيد البعيدة</option>
          </select>
        </div>
      </div>

      {/* Grid of Scheduled Notifications */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-10 px-4 bg-slate-50/70 rounded-2xl border-2 border-dashed border-slate-200">
          <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="font-extrabold text-slate-800 text-xs mb-1">
            لا توجد إشعارات مجدولة تطابق معايير البحث
          </h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto mb-3">
            يمكنك جدولة إرسال رسائل ملخص الصفقات للمشترين والبائعين في الوقت المناسب مع تتبع وصولها بدقة.
          </p>
          {onOpenScheduleModal && (
            <button
              type="button"
              onClick={onOpenScheduleModal}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>جدولة إشعار صفقة جديد</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const remainingLabel = formatRemainingTime(item.scheduledFor || item.nextRetryAt);
            const isDueSoon = (item.scheduledFor || 0) - Date.now() < 3600 * 1000 * 24;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 relative overflow-hidden group"
              >
                {/* Top strip banner */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        #{item.dealId ? item.dealId.slice(-6) : 'عام'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.recipientRole === 'buyer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.recipientRole === 'buyer' ? 'إلى المشتري' : 'إلى البائع'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-600" />
                        <span>مجدول</span>
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1">
                      {item.deal?.listingTitle || 'صفقة وساطة آليات - السويداء'}
                    </h4>
                  </div>

                  {/* Countdown pill */}
                  <div
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 flex items-center gap-1 ${
                      isDueSoon
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Clock3 className="w-3 h-3" />
                    <span>{remainingLabel}</span>
                  </div>
                </div>

                {/* Recipient Phone & Scheduled Datetime */}
                <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/70 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>رقم المستلم:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 dir-ltr" dir="ltr">
                      {item.recipientPhone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>موعد الإرسال:</span>
                    </span>
                    <span className="font-bold text-indigo-900">
                      {item.scheduledTimeFormatted || 'بانتظار الموعد المبرمج'}
                    </span>
                  </div>

                  {item.customMessage && (
                    <div className="pt-1 border-t border-slate-200/60 text-slate-500 line-clamp-2 italic text-[10px]">
                      "{item.customMessage}"
                    </div>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {/* Reschedule Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenReschedule(item)}
                      className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="تعديل موعد الإرسال المجدول"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>إعادة جدولة</span>
                    </button>

                    {/* Cancel / Delete Button */}
                    <button
                      type="button"
                      onClick={() => setItemToCancel(item)}
                      className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="إلغاء جدولة الإشعار وحذفه من الطابور"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>إلغاء</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                      title="معاينة نص الإشعار الكامل"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Send Now Shortcut */}
                    <button
                      type="button"
                      onClick={() => handleSendImmediately(item)}
                      disabled={isSendingImmediateId === item.id}
                      className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="تجاوز الجدولة والإرسال فوراً الآن"
                    >
                      <Send className={`w-3 h-3 ${isSendingImmediateId === item.id ? 'animate-spin' : ''}`} />
                      <span>إرسال الآن</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. RESCHEDULE MODAL */}
      {/* ========================================================================= */}
      {editingItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    إعادة جدولة الإشعار (تعديل موعد الإرسال)
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    #{editingItem.id} · صفقة #{editingItem.dealId ? editingItem.dealId.slice(-6) : 'عام'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="space-y-3.5 text-xs">
              {rescheduleError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{rescheduleError}</span>
                </div>
              )}

              {/* Quick Presets */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                  اختصارات التوقيت السريعة:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickPreset('plus_1h')}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-800 hover:text-indigo-900 rounded-lg font-bold text-[10px] transition-colors"
                  >
                    + 1 ساعة
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPreset('plus_6h')}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-800 hover:text-indigo-900 rounded-lg font-bold text-[10px] transition-colors"
                  >
                    + 6 ساعات
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPreset('tomorrow_09am')}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-800 hover:text-indigo-900 rounded-lg font-bold text-[10px] transition-colors"
                  >
                    غداً 09:00 ص
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPreset('plus_48h')}
                    className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-800 hover:text-indigo-900 rounded-lg font-bold text-[10px] transition-colors"
                  >
                    بعد 48 ساعة
                  </button>
                </div>
              </div>

              {/* Date & Time Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                    تاريخ الإرسال الجديد:
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                    توقيت الإرسال (بتوقيت دمشق):
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Recipient Phone */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                  رقم هاتف المستلم (سيريتل / MTN):
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="09XXXXXXXX"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:border-indigo-500 text-left"
                />
              </div>

              {/* Custom Note */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                  تعديل ملاحظة الإشعار (اختياري):
                </label>
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="أضف أي تنبيه إضافي للمشتري أو البائع..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                >
                  حفظ وتأكيد الموعد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CANCELLATION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {itemToCancel && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                تأكيد إلغاء الإشعار المجدول
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                هل أنت متأكد من رغبتك في إلغاء جدولة الإشعار الموجه إلى{' '}
                <strong className="text-slate-800">{itemToCancel.recipientPhone}</strong>؟ سيتم حذفه نهائياً من طابور الإرسال المجدول ولن يتم إرساله.
              </p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-right font-medium text-slate-700 space-y-1">
              <div>الصفقة: {itemToCancel.deal?.listingTitle}</div>
              <div>الموعد المجدول: {itemToCancel.scheduledTimeFormatted}</div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToCancel(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                نعم، إلغاء الجدولة نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MESSAGE PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    معاينة نص الرسالة المجدولة (WhatsApp Preview)
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    المستلم: {previewItem.recipientPhone} ({previewItem.recipientRole === 'buyer' ? 'مشتري' : 'بائع'})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* WhatsApp Chat Bubble */}
            <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-slate-300 space-y-2">
              <div className="bg-white p-3.5 rounded-xl rounded-tr-none shadow-xs text-xs text-slate-900 whitespace-pre-wrap leading-relaxed">
                {previewItem.customMessage || previewItem.lastError || 'لا يوجد نص رسالة مخصص'}
              </div>
              <div className="text-[10px] text-slate-500 text-left font-mono">
                الموعد المجدول: {previewItem.scheduledTimeFormatted}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <a
                href={generateWhatsAppDeeplink(
                  previewItem.recipientPhone,
                  previewItem.customMessage || ''
                )}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>فتح مباشرة في واتساب</span>
              </a>

              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
