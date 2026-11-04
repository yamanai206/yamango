import React, { useState, useEffect } from 'react';
import { Deal, InspectionReport } from '../types';
import {
  scheduleDealSummaryNotification,
  buildDealSummaryMessage,
  formatSyrianPhoneNumber,
} from '../services/whatsapp';
import {
  Calendar,
  Clock,
  Send,
  X,
  FileText,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
} from 'lucide-react';

interface ScheduleNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  deals: Deal[];
  preSelectedDealId?: string;
  onScheduled?: (item: any) => void;
}

export const ScheduleNotificationModal: React.FC<ScheduleNotificationModalProps> = ({
  isOpen,
  onClose,
  deals,
  preSelectedDealId,
  onScheduled,
}) => {
  const [selectedDealId, setSelectedDealId] = useState<string>(
    preSelectedDealId || deals[0]?.id || ''
  );
  const [recipientRole, setRecipientRole] = useState<'buyer' | 'seller' | 'both'>('buyer');
  const [recipientPhone, setRecipientPhone] = useState('');
  
  // Date and Time state (defaults to tomorrow 09:00 AM)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().slice(0, 10);
  const defaultTimeStr = '09:00';

  const [scheduledDate, setScheduledDate] = useState(defaultDateStr);
  const [scheduledTime, setScheduledTime] = useState(defaultTimeStr);
  const [customNote, setCustomNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedDeal = deals.find((d) => d.id === selectedDealId) || deals[0];

  // Update phone when deal or role changes
  useEffect(() => {
    if (selectedDeal) {
      if (recipientRole === 'buyer') {
        setRecipientPhone(selectedDeal.buyerPhone || '0933456789');
      } else if (recipientRole === 'seller') {
        setRecipientPhone(selectedDeal.sellerPhone || '0944112233');
      } else {
        setRecipientPhone(selectedDeal.buyerPhone || '0933456789');
      }
    }
  }, [selectedDealId, recipientRole, selectedDeal]);

  if (!isOpen) return null;

  // Preset quick buttons
  const setQuickPreset = (type: 'today_eve' | 'tomorrow_morn' | 'in_24h' | 'in_48h') => {
    const d = new Date();
    if (type === 'today_eve') {
      setScheduledDate(d.toISOString().slice(0, 10));
      setScheduledTime('18:00');
    } else if (type === 'tomorrow_morn') {
      d.setDate(d.getDate() + 1);
      setScheduledDate(d.toISOString().slice(0, 10));
      setScheduledTime('09:00');
    } else if (type === 'in_24h') {
      d.setHours(d.getHours() + 24);
      setScheduledDate(d.toISOString().slice(0, 10));
      setScheduledTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    } else if (type === 'in_48h') {
      d.setDate(d.getDate() + 2);
      setScheduledDate(d.toISOString().slice(0, 10));
      setScheduledTime('10:00');
    }
  };

  const handleConfirmSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedDeal) {
      setValidationError('يرجى اختيار صفقة صالحة من القائمة.');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setValidationError('يرجى تحديد التاريخ والوقت بدقة.');
      return;
    }

    // Parse chosen datetime
    const targetTimeMs = new Date(`${scheduledDate}T${scheduledTime}:00`).getTime();
    if (isNaN(targetTimeMs)) {
      setValidationError('صيغة التاريخ أو الوقت غير صحيحة.');
      return;
    }

    if (targetTimeMs <= Date.now()) {
      setValidationError('يرجى اختيار موعد مستقبلي، الوقت المحدد قد مضى.');
      return;
    }

    if (recipientRole === 'both') {
      // Schedule for buyer
      const itemBuyer = scheduleDealSummaryNotification(
        selectedDeal,
        selectedDeal.buyerPhone || recipientPhone,
        'buyer',
        targetTimeMs,
        null,
        customNote
      );
      // Schedule for seller
      const itemSeller = scheduleDealSummaryNotification(
        selectedDeal,
        selectedDeal.sellerPhone || '0944112233',
        'seller',
        targetTimeMs,
        null,
        customNote
      );
      if (onScheduled) onScheduled([itemBuyer, itemSeller]);
    } else {
      const item = scheduleDealSummaryNotification(
        selectedDeal,
        recipientPhone,
        recipientRole,
        targetTimeMs,
        null,
        customNote
      );
      if (onScheduled) onScheduled(item);
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  const previewMessage = selectedDeal ? buildDealSummaryMessage(selectedDeal, null) : '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h3 id="schedule-modal-title" className="text-base sm:text-lg font-black text-slate-900">
                جدولة إرسال إشعار صفقة عبر واتساب
              </h3>
              <p className="text-xs text-slate-500">
                اختر موعداً محدداً (تاريخ ووقت) لإرسال ملخص الصفقة تلقائياً للطرفين
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4 pt-3">
          {isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                تمت جدولة إرسال ملخص الصفقة بنجاح! سيتم الإرسال تلقائياً في الموعد المحدد أو عند تشغيل الإرسال المؤجل.
              </span>
            </div>
          )}

          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleConfirmSchedule} className="space-y-4">
            {/* Select Deal */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                اختر الصفقة المراد جدولة ملخصها: <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedDealId}
                onChange={(e) => setSelectedDealId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                required
              >
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    صفقة #{deal.contract?.contractNumber || deal.id} - {deal.listingTitle} ({deal.agreedPrice.toLocaleString()} {deal.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Role Selection */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                الطرف المستلم للإشعار:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientRole('buyer')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    recipientRole === 'buyer'
                      ? 'border-indigo-500 bg-indigo-50/80 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <User className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-600" />
                  <span>المشتري ({selectedDeal?.buyerName || 'المشتري'})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientRole('seller')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    recipientRole === 'seller'
                      ? 'border-indigo-500 bg-indigo-50/80 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <User className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-600" />
                  <span>البائع ({selectedDeal?.sellerName || 'البائع'})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientRole('both')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    recipientRole === 'both'
                      ? 'border-indigo-500 bg-indigo-50/80 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
                  <span>كلا الطرفين (المشتري والبائع)</span>
                </button>
              </div>
            </div>

            {/* Recipient Phone (if single recipient) */}
            {recipientRole !== 'both' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  رقم هاتف المستلم (واتساب):
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="0933123456"
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-slate-900 transition-all font-mono font-bold"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
            )}

            {/* Date and Time Pickers & Quick Presets */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>تحديد موعد الإرسال بدقة:</span>
                </span>
                <span className="text-[11px] text-slate-500">توقيت دمشق (GMT+3)</span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickPreset('today_eve')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  اليوم 6:00 م
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPreset('tomorrow_morn')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  غداً 9:00 ص
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPreset('in_24h')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  بعد 24 ساعة
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPreset('in_48h')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  بعد يومين
                </button>
              </div>

              {/* Date & Time Input Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    تاريخ الإرسال:
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold font-mono text-slate-900 cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    توقيت الإرسال:
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold font-mono text-slate-900 cursor-pointer"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Optional Custom Note */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                ملاحظة إضافية تظهر في بداية الرسالة (اختياري):
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                rows={2}
                placeholder="مثال: نرجو من الطرفين الحضور لكراج الكفر قبل الساعة 11:00 صباحاً لاستكمال الفحص الفني المعتمد."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-slate-900 font-medium resize-none leading-relaxed"
              />
            </div>

            {/* Live Preview Bubble */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-700">معاينة الرسالة المجدولة:</span>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                  الموعد: {scheduledDate} {scheduledTime}
                </span>
              </div>
              <div className="bg-[#e7f8e8] p-3.5 rounded-2xl rounded-tr-xs border border-emerald-200 text-[11px] text-slate-900 whitespace-pre-wrap font-sans leading-relaxed max-h-36 overflow-y-auto">
                {customNote?.trim() && (
                  <div className="font-bold text-indigo-950 mb-2 pb-1 border-b border-emerald-300/60">
                    📌 ملاحظة المشرف الميداني: {customNote.trim()}
                  </div>
                )}
                {previewMessage}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSuccess}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>حفظ وجدولة الإرسال</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
