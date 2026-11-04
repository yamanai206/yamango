import React, { useState } from 'react';
import { User, SupportTicket, SupportTicketCategory, SupportTicketPriority } from '../types';
import {
  enqueueSupportTicketNotification,
  generateSupportTicketDeeplink,
  formatSyrianPhoneNumber,
} from '../services/whatsapp';
import {
  LifeBuoy,
  X,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Phone,
  FileQuestion,
  Wrench,
  AlertTriangle,
} from 'lucide-react';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
  onTicketSubmitted?: (ticket: SupportTicket) => void;
}

const CATEGORIES: { id: SupportTicketCategory; label: string; icon: any }[] = [
  { id: 'deal_dispute', label: 'نزاع أو استفسار حول صفقة إسكرو', icon: ShieldCheck },
  { id: 'inspection_inquiry', label: 'استفسار عن فحص كراج معتمد', icon: Wrench },
  { id: 'payment_agent', label: 'وكلاء الدفع المعتمدون ورموز OTP', icon: Phone },
  { id: 'technical_issue', label: 'مشكلة تقنية أو بلاغ خطأ في الموقع', icon: AlertTriangle },
  { id: 'other', label: 'استفسار عام أو مساعدة ميدانية', icon: FileQuestion },
];

const PRIORITIES: { id: SupportTicketPriority; label: string; color: string }[] = [
  { id: 'normal', label: 'عادي (خلال 24 ساعة)', color: 'text-slate-700 bg-slate-100' },
  { id: 'high', label: 'هام (خلال ساعات قليلة)', color: 'text-amber-800 bg-amber-100' },
  { id: 'urgent', label: 'عاجل وطارئ (ميداني فوري)', color: 'text-rose-800 bg-rose-100' },
];

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onTicketSubmitted,
}) => {
  const [userName, setUserName] = useState(currentUser?.fullName || '');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '');
  const [category, setCategory] = useState<SupportTicketCategory>('deal_dispute');
  const [priority, setPriority] = useState<SupportTicketPriority>('normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);
  const [copiedTicketId, setCopiedTicketId] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!userName.trim()) {
      setValidationError('يرجى إدخال اسمك الكريم للتواصل.');
      return;
    }
    if (!userPhone.trim() || userPhone.replace(/\D/g, '').length < 9) {
      setValidationError('يرجى إدخال رقم هاتف سوري صحيح (مثال: 0933123456).');
      return;
    }
    if (!subject.trim()) {
      setValidationError('يرجى تحديد عنوان مختصر للمشكلة أو الاستفسار.');
      return;
    }
    if (!message.trim() || message.trim().length < 8) {
      setValidationError('يرجى كتابة تفاصيل الاستفسار (على الأقل 8 أحرف).');
      return;
    }

    setIsSubmitting(true);

    const ticketNumber = `TK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const categoryObj = CATEGORIES.find((c) => c.id === category);
    const priorityObj = PRIORITIES.find((p) => p.id === priority);

    const now = new Date();
    const timeFormatted = `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString('ar-SY')}`;

    const newTicket: SupportTicket = {
      id: `ticket_${Date.now()}`,
      ticketNumber,
      userName: userName.trim(),
      userPhone: formatSyrianPhoneNumber(userPhone.trim()),
      category,
      categoryLabelArabic: categoryObj?.label || 'استفسار عام',
      priority,
      priorityLabelArabic: priorityObj?.label || 'عادي',
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
      createdAt: timeFormatted,
      createdAtMs: Date.now(),
    };

    try {
      // 1. Enqueue into WhatsApp notification queue to notify supervisors immediately
      const queuedItem = enqueueSupportTicketNotification(newTicket);
      newTicket.queuedNotificationId = queuedItem.id;

      if (onTicketSubmitted) {
        onTicketSubmitted(newTicket);
      }

      setSubmittedTicket(newTicket);
    } catch (err: any) {
      setValidationError(`تعذر إرسال التذكرة: ${err?.message || 'خطأ غير معروف'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicketNumber = () => {
    if (!submittedTicket) return;
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(submittedTicket.ticketNumber).then(() => {
          setCopiedTicketId(true);
          setTimeout(() => setCopiedTicketId(false), 3000);
        }).catch(() => {
          fallbackCopyText(submittedTicket.ticketNumber);
        });
      } else {
        fallbackCopyText(submittedTicket.ticketNumber);
      }
    } catch {
      fallbackCopyText(submittedTicket.ticketNumber);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedTicketId(true);
      setTimeout(() => setCopiedTicketId(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleResetForm = () => {
    setSubmittedTicket(null);
    setSubject('');
    setMessage('');
    setValidationError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <LifeBuoy className="w-5 h-5" />
            </span>
            <div>
              <h3 id="support-modal-title" className="text-base sm:text-lg font-black text-slate-900">
                مركز الدعم الفني وتذاكر المساعدة
              </h3>
              <p className="text-xs text-slate-500">
                منصة yamango في السويداء وبلدة الكفر · استجابة سريعة عبر المشرفين الميدانيين
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Ticket has been submitted: Success Screen */}
        {submittedTicket ? (
          <div className="space-y-5 py-2 animate-in fade-in">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-emerald-900">
                تم تسجيل تذكرة الدعم الفني بنجاح!
              </h4>
              <p className="text-xs text-emerald-700 leading-relaxed max-w-md mx-auto">
                تم تخزين تذكرتك فوراً في طابور إشعارات WhatsApp لإبلاغ مشرفي المنصة المعتمدين في السويداء والكفر ومتابعة طلبك دون أي تأخير.
              </p>
            </div>

            {/* Ticket Details Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <span className="text-slate-500 font-medium">رقم التذكرة المرجعي:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {submittedTicket.ticketNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTicketNumber}
                    className="p-1 text-slate-500 hover:text-amber-700 hover:bg-white rounded-md transition-colors"
                    title="نسخ رقم التذكرة"
                  >
                    {copiedTicketId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block mb-0.5">صاحب التذكرة:</span>
                  <span className="font-bold text-slate-800">{submittedTicket.userName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">رقم الهاتف:</span>
                  <span className="font-mono font-bold text-slate-800" dir="ltr">{submittedTicket.userPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">التصنيف:</span>
                  <span className="font-medium text-slate-800">{submittedTicket.categoryLabelArabic}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">الأولوية:</span>
                  <span className="font-medium text-slate-800">{submittedTicket.priorityLabelArabic}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 block mb-1 font-semibold">الموضوع:</span>
                <p className="font-bold text-slate-900">{submittedTicket.subject}</p>
                <p className="text-slate-600 mt-1 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/60">
                  {submittedTicket.message}
                </p>
              </div>
            </div>

            {/* Direct WhatsApp Action for instant priority chat */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-amber-900">
                  هل ترغب بالتحدث مع المشرف المسؤول مباشرة عبر واتساب الآن؟
                </span>
              </div>
              <a
                href={generateSupportTicketDeeplink(submittedTicket, '+963933000000')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>فتح محادثة واتساب</span>
              </a>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                إرسال تذكرة أخرى
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          /* Ticket Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* User Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  الاسم الكامل: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="مثال: بهاء الدين مرشد"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs text-slate-900 transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  رقم الهاتف للتواصل: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="0933123456"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs text-slate-900 transition-all font-mono font-medium"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                تصنيف الاستفسار أو المشكلة:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 text-amber-950 font-bold shadow-2xs'
                          : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                مستوى الأولوية:
              </label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white font-bold shadow-xs'
                          : `${p.color} hover:opacity-80`
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                موضوع التذكرة: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: استفسار حول تسليم عربون نقدي لدى وكيل الكفر"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs text-slate-900 transition-all font-medium"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                تفاصيل الاستفسار أو المشكلة بدقة: <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="اكتب كافة التفاصيل، رقم الإعلان أو كود الصفقة، لتسهيل قيام المشرف بمساعدتك فوراً..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs text-slate-900 transition-all font-medium resize-none leading-relaxed"
                required
              />
            </div>

            {/* Queue Info Notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                عند الضغط على إرسال، يتم حفظ التذكرة وتمريرها فورياً عبر طابور إشعارات WhatsApp الداخلي للمشرف المناوب، مع إمكانية متابعتها وإعادة إرسالها حتى في ظروف انقطاع الإنترنت.
              </span>
            </div>

            {/* Form Actions */}
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
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'جاري تسجيل التذكرة...' : 'إرسال التذكرة للمشرفين'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
