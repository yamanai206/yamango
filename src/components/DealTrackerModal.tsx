import React, { useState } from 'react';
import { Deal, User, PaymentAgent, InspectionReport } from '../types';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Key, 
  QrCode, 
  Receipt, 
  AlertCircle, 
  FileText,
  UserCheck,
  Building,
  Check,
  ChevronRight,
  Send,
  MessageSquare,
  Copy,
  ExternalLink,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { 
  sendDealSummaryNotification, 
  generateWhatsAppDeeplink, 
  buildDealSummaryMessage,
  NotificationResult,
  getOfflineQueue,
  processOfflineNotificationQueue,
  QueuedNotificationItem
} from '../services/whatsapp';
import { EscrowJourneyVisualizer } from './EscrowJourneyVisualizer';
import { computeEscrowJourney } from '../utils/escrowJourney';

interface DealTrackerModalProps {
  deal: Deal | null;
  onClose: () => void;
  currentUser: User;
  agents: PaymentAgent[];
  onConfirmAgentEscrow: (dealId: string, enteredOtp: string, agentId: string) => { success: boolean; message?: string };
  onConfirmDelivery: (dealId: string, currentHoursOrKm: number) => void;
}

export const DealTrackerModal: React.FC<DealTrackerModalProps> = ({
  deal,
  onClose,
  currentUser,
  agents,
  onConfirmAgentEscrow,
  onConfirmDelivery,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'contract' | 'escrow_otp' | 'delivery' | 'whatsapp'>('timeline');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || '');
  const [agentFeedback, setAgentFeedback] = useState<{ success?: boolean; text?: string } | null>(null);
  const [deliveryCounter, setDeliveryCounter] = useState(deal?.deliveryProof?.pickupKmOrHours || 1200);

  // WhatsApp Notification State
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppResult, setWhatsAppResult] = useState<NotificationResult | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<QueuedNotificationItem[]>(() => getOfflineQueue());
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);

  if (!deal) return null;

  const journey = computeEscrowJourney(deal);

  const isBuyer = deal.buyerId === currentUser.id;
  const isSeller = deal.sellerId === currentUser.id;
  const isAgent = currentUser.roles.includes('agent');
  const isAdmin = currentUser.roles.includes('admin');

  const handleSendWhatsAppNotification = async () => {
    setIsSendingWhatsApp(true);
    try {
      const res = await sendDealSummaryNotification(
        deal,
        '0933456789', // Syrian recipient number
        'buyer',
        null,
        undefined
      );
      setWhatsAppResult(res);
      setOfflineQueue(getOfflineQueue());
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleSyncOfflineQueue = async () => {
    setIsSyncingQueue(true);
    try {
      await processOfflineNotificationQueue();
      setOfflineQueue(getOfflineQueue());
    } finally {
      setIsSyncingQueue(false);
    }
  };

  const handleAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp.trim()) return;

    const res = onConfirmAgentEscrow(deal.id, enteredOtp, selectedAgentId);
    if (res.success) {
      setAgentFeedback({ success: true, text: `تم تأكيد استلام العربون نقداً بنجاح! تم تجميد المبلغ في إسكرو المنصة.` });
    } else {
      setAgentFeedback({ success: false, text: res.message || 'فشل التحقق من الرمز' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                صفقة وساطة إلكترونية
              </span>
              <span className="text-xs text-slate-500 font-mono">
                رقم: {deal.contract.contractNumber}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
              {deal.listingTitle}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Persistent Compact Escrow Journey Stepper Ribbon (بدء، فحص، حجز العربون، إتمام) */}
        <div 
          data-testid="compact-escrow-journey-ribbon"
          className="px-5 py-2.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 text-xs"
        >
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto w-full justify-between">
            {journey.stages.map((stage, idx) => {
              const isDone = stage.state === 'completed';
              const isInProgress = stage.state === 'in_progress';
              const isCancelled = stage.state === 'cancelled';
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    setActiveTab('timeline');
                  }}
                  className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                  title={`${stage.fullTitle}: ${stage.stateLabel}`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    isDone
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : isInProgress
                      ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                      : isCancelled
                      ? 'bg-rose-500 text-white font-black'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <span className={`font-bold text-[11px] ${
                    isDone
                      ? 'text-emerald-300'
                      : isInProgress
                      ? 'text-amber-300 underline decoration-amber-400'
                      : isCancelled
                      ? 'text-rose-300'
                      : 'text-slate-400'
                  }`}>
                    {stage.label}
                  </span>
                  {idx < journey.stages.length - 1 && (
                    <span className="text-slate-600 mr-1 sm:mr-3 text-xs">←</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-100 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'timeline' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>مسار الإسكرو (Escrow Journey)</span>
          </button>
          <button
            onClick={() => setActiveTab('escrow_otp')}
            className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeTab === 'escrow_otp' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>رمز العربون السري (الوكيل)</span>
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeTab === 'contract' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>العقد الإلكتروني الموثق</span>
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeTab === 'delivery' ? 'border-amber-600 text-amber-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>محضر التسليم والعداد</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeTab === 'whatsapp' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>إشعار واتساب والملخص</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'timeline' && (
            <div className="space-y-6 text-xs">
              {/* Visual Escrow Journey Tracker (بدء، فحص، حجز العربون، إتمام) */}
              <EscrowJourneyVisualizer
                deal={deal}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />

              {/* Deal Financial Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block mb-1">المبلغ الإجمالي المتفق عليه</span>
                  <span className="text-base font-extrabold text-slate-900 tabular-nums">
                    {deal.agreedPrice.toLocaleString()} {deal.currency}
                  </span>
                </div>
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                  <span className="text-amber-800 font-medium block mb-1">مبلغ العربون المحجوز (إسكرو)</span>
                  <span className="text-base font-extrabold text-amber-900 tabular-nums">
                    {deal.depositAmount.toLocaleString()} {deal.currency}
                  </span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">
                    {deal.status === 'escrow_secured' || deal.status === 'completed'
                      ? '✓ محجوز ومؤكد لدى الوكيل'
                      : 'بانتظار دفع الكاش لدى الوكيل'}
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block mb-1">عمولة المنصة المقتطعة</span>
                  <span className="text-base font-extrabold text-slate-900 tabular-nums">
                    {deal.platformCommissionAmount.toLocaleString()} {deal.currency}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ({(deal.platformCommissionRate * 100).toFixed(1)}% تنازلية للتجار)
                  </span>
                </div>
              </div>

              {/* Current Status Banner */}
              <div className={`p-4 rounded-2xl border ${
                deal.status === 'escrow_secured'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">
                      {deal.status === 'escrow_secured'
                        ? 'العربون في أمان تام لدى المنصة (إسكرو مؤكد)'
                        : 'بانتظار تأكيد العربون لدى أقرب وكيل دفع'}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                      {deal.status === 'escrow_secured'
                        ? `قام الوكيل "${deal.escrowAgentName || 'الوكيل المعتمد'}" بتأكيد استلام العربون برقم إيصال ${deal.receiptNumber || 'REC-XXXX'}. يحق للمشتري الآن استلام الآلية ومعاينة عداد الساعات بكل ثقة.`
                        : `المطلوب من المشتري التوجه لأحد وكلاء الدفع في بلدة الكفر أو السويداء، وإبراز الرمز السري (${deal.secretOtp}) لتأكيد حجز الآلية.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parties info */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">المشتري / المستأجر:</span>
                  <span className="font-bold text-slate-900">{deal.buyerName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">البائع / المؤجّر:</span>
                  <span className="font-bold text-slate-900">{deal.sellerName}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Agent & Secret OTP */}
          {activeTab === 'escrow_otp' && (
            <div className="space-y-5 text-xs">
              <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-6 rounded-2xl text-center shadow-md">
                <span className="text-xs uppercase tracking-wider opacity-90 block mb-1">
                  رمز التحقق السري لدى الوكيل (Secret Verification OTP)
                </span>
                <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest my-2 py-2 px-4 bg-white/20 rounded-xl inline-block border border-white/30">
                  {deal.secretOtp}
                </div>
                <p className="text-xs opacity-90 max-w-md mx-auto mt-2 leading-relaxed">
                  يُظهر المشتري هذا الرمز للوكيل عند تسليم الكاش في بلدة الكفر أو السويداء. لا تشارك هذا الرمز مع أي شخص آخر قبل وصولك لمكتب الوكيل.
                </p>
              </div>

              {/* Agent Simulator Form */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-amber-600" />
                  <span>بوابة وكيل الدفع المعتمد (تسجيل استلام الكاش)</span>
                </h4>
                <p className="text-slate-500 mb-3 text-[11px]">
                  يقوم الوكيل بإدخال الرمز السري من هاتف العميل لتأكيد المبلغ وإصدار السند الرقمي المعتمد.
                </p>

                <form onSubmit={handleAgentSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">فرع وكيل الدفع:</label>
                      <select
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                      >
                        {agents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.agencyName} ({ag.zone === 'al_kafr' ? 'الكفر' : 'السويداء'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        أدخل الرمز السري الظاهر في هاتف المشتري:
                      </label>
                      <input
                        type="text"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        placeholder="مثال: YM-8492"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold tracking-wider uppercase text-center"
                      />
                    </div>
                  </div>

                  {agentFeedback && (
                    <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                      agentFeedback.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {agentFeedback.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Receipt className="w-4 h-4 text-amber-400" />
                    <span>تأكيد استلام الكاش وإصدار سند الإسكرو الرقمي</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Tab 3: Electronic Contract */}
          {activeTab === 'contract' && (
            <div className="space-y-4 text-xs">
              <div className="border-2 border-slate-300 rounded-2xl p-5 bg-white shadow-xs relative">
                {/* Contract Header */}
                <div className="text-center border-b border-slate-200 pb-4 mb-4">
                  <div className="text-lg font-black text-slate-900">منصة yamango للسيارات والآليات</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    عقد وساطة تجارية وإلكترونية ملزم قانوناً · محافظة السويداء وبلدة الكفر
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-800 mt-1">
                    رقم العقد: {deal.contract.contractNumber}
                  </div>
                </div>

                {/* Contract Body */}
                <div className="space-y-3 text-slate-700 leading-relaxed">
                  <p>
                    <strong>الفريق الأول (البائع/المؤجّر):</strong> {deal.sellerName}
                  </p>
                  <p>
                    <strong>الفريق الثاني (المشتري/المستأجر):</strong> {deal.buyerName}
                  </p>
                  <p>
                    <strong>موضوع العقد:</strong> بيع/تأجير {deal.listingTitle} بالمبلغ المتفق عليه وقدره ({deal.agreedPrice.toLocaleString()} {deal.currency})، مع حجز عربون مقداره ({deal.depositAmount.toLocaleString()} {deal.currency}) لدى وسيط المنصة.
                  </p>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                    <strong>الشروط والأحكام:</strong> {deal.contract.termsSummaryArabic}
                  </p>
                </div>

                {/* Signatures & QR */}
                <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-4 mt-4 items-center">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block mb-1">توقيع المشتري</span>
                    <div className="font-bold text-emerald-800 text-[11px]">
                      {deal.contract.buyerSignature || 'بانتظار التوقيع'}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center p-1">
                      <QrCode className="w-12 h-12 text-slate-800" />
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1">رمز التحقق الرقمي</span>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block mb-1">توقيع البائع</span>
                    <div className="font-bold text-emerald-800 text-[11px]">
                      {deal.contract.sellerSignature || 'بانتظار التوقيع'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Delivery & Counter */}
          {activeTab === 'delivery' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-2">
                  محضر استلام الآلية وتثبيت قراءة العداد
                </h4>
                <p className="text-slate-500 mb-3 text-[11px]">
                  لضمان العدالة في تأجير وبيع الآليات، يتم توثيق قراءة عداد ساعات العمل أو الكيلومترات عند الاستلام والتسليم لمنع الخلافات حول الاستهلاك الزائد.
                </p>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 mb-4">
                  <label className="font-semibold text-slate-700 block mb-1">
                    قراءة عداد ساعات العمل الحالية عند التسليم:
                  </label>
                  <input
                    type="number"
                    value={deliveryCounter}
                    onChange={(e) => setDeliveryCounter(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-base font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    يتم التحقق من مطابقة القراءة لحالة الآلية قبل فك حجز الإسكرو النهائي.
                  </span>
                </div>

                {deal.status !== 'completed' ? (
                  <button
                    onClick={() => onConfirmDelivery(deal.id, deliveryCounter)}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد الاستلام وإغلاق الصفقة وصرف المبلغ للبائع</span>
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-center font-bold">
                    ✓ الصفقة مكتملة ومغلقة بنجاح! تم تحرير المبلغ للبائع بعد اقتطاع العمولة.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: WhatsApp Notification & PDF Summary */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 text-xs">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    إرسال ملخص الصفقة والعقد PDF عبر واتساب (WhatsApp Business API)
                  </h4>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  تتيح هذه الخدمة إرسال ملخص رقمي رسمي معتمد موثق برقم العقد وبيانات الفحص وسند القبض إلى هاتفي المشتري والبائع تلقائياً، مع دعم التحويل الاحتياطي المباشر (Direct Fallback) في حال انقطاع الشبكة أو قيود الاتصال في سوريا.
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleSendWhatsAppNotification}
                  disabled={isSendingWhatsApp}
                  className="p-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingWhatsApp ? 'جارٍ الإرسال والمعالجة...' : 'إرسال إشعار API المعتمد'}</span>
                </button>

                <a
                  href={generateWhatsAppDeeplink('0933456789', buildDealSummaryMessage(deal, null))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-xs text-center"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>فتح محادثة واتساب المباشرة للمشتري</span>
                </a>
              </div>

              {/* Dispatch feedback */}
              {whatsAppResult && (
                <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        {whatsAppResult.channel === 'whatsapp_api'
                          ? 'تم الإرسال بنجاح عبر WhatsApp Business API'
                          : 'تم تفعيل المسار الاحتياطي المعتمد (Fallback Activated)'}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {whatsAppResult.timestamp.slice(11, 19)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {whatsAppResult.fallbackReason || 'تم تسليم الرسالة مع رابط العقد الإلكتروني PDF الموثق.'}
                  </p>
                </div>
              )}

              {/* Offline Retry Queue & Backoff Indicator */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-800">
                      ذاكرة الإشعارات المؤقتة (Offline Queue & Backoff):
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncOfflineQueue}
                    disabled={isSyncingQueue}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 font-medium transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSyncingQueue ? 'animate-spin' : ''}`} />
                    <span>{isSyncingQueue ? 'جارٍ إعادة المحاولة...' : 'مزامنة الطابور الآن'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                  <span>
                    عدد الإشعارات المحفوظة بانتظار استعادة الشبكة:{' '}
                    <strong className="text-slate-900 font-mono font-bold">
                      {offlineQueue.filter((q) => q.status !== 'delivered').length}
                    </strong>
                  </span>
                  <span className="text-slate-400">
                    استرجاع تدريجي (1.5s ← 3s ← 6s ← 12s)
                  </span>
                </div>

                {offlineQueue.filter((q) => q.status !== 'delivered').length > 0 && (
                  <div className="mt-2.5 space-y-1.5 max-h-32 overflow-y-auto">
                    {offlineQueue.filter((q) => q.status !== 'delivered').map((item) => (
                      <div key={item.id} className="p-2 bg-amber-50/60 border border-amber-200/60 rounded-lg flex items-center justify-between text-[10px]">
                        <div>
                          <span className="font-bold text-amber-950 block">{item.deal?.listingTitle || 'إشعار صفقة معلّق'}</span>
                          <span className="text-slate-500">
                            المحاولة: {item.attempts}/{item.maxAttempts} · المتبقي لإعادة المحاولة:{' '}
                            {Math.max(0, Math.round((item.nextRetryAt - Date.now()) / 1000))} ثانية
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 rounded font-bold">
                          {item.status === 'retrying' ? 'قيد الإعادة' : 'معلّق'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700">معاينة نص الرسالة المرسلة للطرفين:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(buildDealSummaryMessage(deal, null));
                      setCopiedWhatsApp(true);
                      setTimeout(() => setCopiedWhatsApp(false), 2000);
                    }}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {copiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWhatsApp ? 'تم النسخ' : 'نسخ النص'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {buildDealSummaryMessage(deal, null)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            حماية إسكرو yamango المعتمدة في الكفر والسويداء
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
