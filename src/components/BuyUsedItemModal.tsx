import React, { useState } from 'react';
import { 
  UsedItem, 
  UsedItemOrder, 
  UsedItemPaymentMethod, 
  PaymentAgent, 
  User 
} from '../types';
import { 
  USED_PAYMENT_METHODS, 
  formatUsedItemPrice, 
  calculateUsedItemCommission,
  buildUsedOrderWhatsAppMessage 
} from '../utils/usedGoods';
import { 
  X, 
  Building, 
  ShieldCheck, 
  Check, 
  Copy, 
  MapPin, 
  Phone, 
  MessageCircle, 
  AlertCircle, 
  QrCode, 
  KeyRound, 
  Package, 
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { copyToClipboard } from '../utils/shareListing';

interface BuyUsedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: UsedItem | null;
  agents: PaymentAgent[];
  currentUser: User;
  onConfirmPurchase: (orderData: Omit<UsedItemOrder, 'id' | 'createdAt' | 'secretOtp' | 'status'>) => UsedItemOrder;
}

export const BuyUsedItemModal: React.FC<BuyUsedItemModalProps> = ({
  isOpen,
  onClose,
  item,
  agents,
  currentUser,
  onConfirmPurchase,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<UsedItemPaymentMethod>('agent_cash');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    agents.find((a) => a.zone === (item?.zone || 'al_kafr'))?.id || agents[0]?.id || ''
  );
  const [buyerName, setBuyerName] = useState(currentUser.fullName);
  const [buyerPhone, setBuyerPhone] = useState(currentUser.phone);
  const [deliveryOption, setDeliveryOption] = useState<'pickup_in_person' | 'local_delivery'>('pickup_in_person');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Completed Order State for Receipt Display
  const [completedOrder, setCompletedOrder] = useState<UsedItemOrder | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  if (!isOpen || !item) return null;

  const commissionCalc = calculateUsedItemCommission(item.price, item.currency, item.platformCommissionRate);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!buyerName.trim()) {
      setErrorMsg('يرجى إدخال اسم المشتري.');
      return;
    }
    if (!buyerPhone.trim()) {
      setErrorMsg('يرجى إدخال رقم هاتف المشتري للتواصل.');
      return;
    }
    if (paymentMethod === 'agent_cash' && !selectedAgent) {
      setErrorMsg('يرجى اختيار وكيل دفع كاش معتمد.');
      return;
    }

    const order = onConfirmPurchase({
      itemId: item.id,
      itemTitle: item.title,
      itemCategory: item.category,
      itemCondition: item.condition,
      itemPrice: item.price,
      currency: item.currency,
      commissionRate: commissionCalc.commissionRate,
      commissionAmount: commissionCalc.commissionAmount,
      sellerNetPayout: commissionCalc.sellerNetPayout,
      buyerId: currentUser.id,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      sellerPhone: item.sellerPhone,
      paymentMethod,
      agentId: paymentMethod === 'agent_cash' ? selectedAgent?.id : undefined,
      agentName: paymentMethod === 'agent_cash' ? selectedAgent?.name : undefined,
      agentAddress: paymentMethod === 'agent_cash' ? selectedAgent?.address : undefined,
      agentPhone: paymentMethod === 'agent_cash' ? selectedAgent?.phone : undefined,
      deliveryOption,
      deliveryAddress: deliveryAddress.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setCompletedOrder(order);
  };

  const handleCopyOtp = async () => {
    if (!completedOrder) return;
    const ok = await copyToClipboard(completedOrder.secretOtp);
    if (ok) {
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2500);
    }
  };

  const handleSendWhatsAppReceipt = () => {
    if (!completedOrder) return;
    const msg = encodeURIComponent(buildUsedOrderWhatsAppMessage(completedOrder));
    const targetPhone = completedOrder.agentPhone || completedOrder.sellerPhone;
    const cleanPhone = targetPhone.replace(/[^\d+]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? `+963${cleanPhone.substring(1)}` : cleanPhone;
    window.open(`https://api.whatsapp.com/send?phone=${intlPhone}&text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-200" />
              <span>{completedOrder ? 'إيصال حجز وضمان الغرض المستعمل' : 'شراء غرض مستعمل عبر وكيل معتمد بالضمان'}</span>
            </h2>
            <p className="text-xs text-amber-100 mt-0.5">
              صفقة محمية برمز أمان OTP وحجز المبلغ لدى الوكيل حتى إتمام المعاينة والتسليم
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {completedOrder ? (
          /* SUCCESS ESCROW RECEIPT SCREEN */
          <div className="p-6 overflow-y-auto space-y-5">
            <div className="text-center p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                <Check className="w-6 h-6 stroke-3" />
              </div>
              <h3 className="text-base font-extrabold text-emerald-950">
                تم تثبيت طلب الشراء وحجز الإسكرو بنجاح!
              </h3>
              <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto">
                الغرض أصبح محجوزاً لك رسمياً. تم توليد رمز التحقق السري (OTP) لتسليمه للوكيل أو البائع عند المعاينة والاستلام.
              </p>
            </div>

            {/* Secret OTP Highlight Box */}
            <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/70 border-2 border-amber-400 rounded-2xl text-center relative">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>رمز التحقق السري الخاص بك (OTP)</span>
              </div>
              <div className="text-3xl font-mono font-black tracking-widest text-slate-900 my-1">
                {completedOrder.secretOtp}
              </div>
              <p className="text-[11px] text-amber-800">
                احتفظ بهذا الرمز وقدمه للوكيل المعتمد عند إيداع المبلغ، أو للبائع بعد معاينة الغرض واستلامه سالماً.
              </p>
              <button
                type="button"
                onClick={handleCopyOtp}
                className="mt-3 px-3.5 py-1.5 text-xs font-bold bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-lg inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {copiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                <span>{copiedOtp ? 'تم نسخ الرمز!' : 'نسخ رمز الـ OTP'}</span>
              </button>
            </div>

            {/* Order Details Breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">رقم الطلب في المنصة:</span>
                <span className="font-mono font-bold text-slate-800">{completedOrder.id}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">الغرض المطلوب:</span>
                <span className="font-bold text-slate-900">{completedOrder.itemTitle}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">السعر الإجمالي:</span>
                <span className="font-extrabold text-slate-900">
                  {formatUsedItemPrice(completedOrder.itemPrice, completedOrder.currency)}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">عمولة المنصة والضمان (3.5%):</span>
                <span className="font-bold text-amber-700">
                  {formatUsedItemPrice(completedOrder.commissionAmount, completedOrder.currency)}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">صافي البائع بعد التسليم:</span>
                <span className="font-bold text-emerald-700">
                  {formatUsedItemPrice(completedOrder.sellerNetPayout, completedOrder.currency)}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">طريقة الدفع المحددة:</span>
                <span className="font-bold text-slate-800">
                  {USED_PAYMENT_METHODS[completedOrder.paymentMethod].label}
                </span>
              </div>

              {completedOrder.agentName && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs">
                  <span className="font-bold text-amber-950 block mb-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-700" />
                    <span>عنوان الوكيل المعتمد لتسليم الكاش:</span>
                  </span>
                  <p className="text-slate-800 font-semibold">{completedOrder.agentName}</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">{completedOrder.agentAddress}</p>
                  <p className="text-slate-600 text-[11px] mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{completedOrder.agentPhone}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Actions: Send WhatsApp & Finish */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsAppReceipt}
                className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال تفاصيل الإيصال عبر واتساب للوكيل والبائع</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer text-xs"
              >
                تم، إغلاق
              </button>
            </div>
          </div>
        ) : (
          /* PURCHASE FORM & AGENT SELECTOR */
          <form onSubmit={handleConfirm} className="p-6 overflow-y-auto space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Item Card Summary */}
            <div className="flex items-center gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <img
                src={item.images[0] || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=400&q=80'}
                alt={item.title}
                className="w-20 h-20 object-cover rounded-xl border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0 text-xs">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  {item.category}
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">
                  {item.title}
                </h4>
                <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{item.locationDetails}</span>
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatUsedItemPrice(item.price, item.currency)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    (عمولة الضمان: {formatUsedItemPrice(commissionCalc.commissionAmount, item.currency)})
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                طريقة الدفع المعتمدة <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.entries(USED_PAYMENT_METHODS) as [UsedItemPaymentMethod, typeof USED_PAYMENT_METHODS[UsedItemPaymentMethod]][]).map(
                  ([methodKey, config]) => {
                    const isSelected = paymentMethod === methodKey;
                    return (
                      <div
                        key={methodKey}
                        onClick={() => setPaymentMethod(methodKey)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/60 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-900">{config.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {config.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {config.subLabel}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Certified Agent Selection (If agent_cash is selected) */}
            {paymentMethod === 'agent_cash' && (
              <div className="p-4 bg-gradient-to-br from-amber-50/80 to-white border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-700" />
                    <span>اختر وكيل الدفع المعتمد في بلدتك/منطقتك</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                    استلام وإيداع كاش فوري
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {agents.map((agent) => {
                    const isAgentSelected = selectedAgentId === agent.id;
                    return (
                      <div
                        key={agent.id}
                        onClick={() => setSelectedAgentId(agent.id)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-xs ${
                          isAgentSelected
                            ? 'border-amber-600 bg-white ring-2 ring-amber-200 shadow-xs'
                            : 'border-slate-200 bg-white/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <strong className="font-bold text-slate-900">{agent.name}</strong>
                          {isAgentSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{agent.agencyName}</p>
                        <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{agent.address}</span>
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{agent.phone}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Electronic / Remittance Details If Other Payment Method */}
            {paymentMethod === 'syriatel_cash' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>محفظة يامانغو الرسمية (سيرياتيل كاش / MTN كاش)</span>
                </p>
                <p className="text-slate-700 text-[11px]">
                  رقم المحفظة المعتمد: <strong className="font-mono font-bold text-slate-900">0933-456-789</strong> (حساب الضمان المالي الرسمي).
                </p>
                <p className="text-slate-500 text-[11px]">
                  بعد الضغط على تأكيد، يتم حجز الغرض فورياً ويظهر لك كود العملية ورمز التحقق (OTP).
                </p>
              </div>
            )}

            {paymentMethod === 'al_haram' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-amber-700" />
                  <span>حوالة الهرم أو الفؤاد - حساب أمانات يامانغو</span>
                </p>
                <p className="text-slate-700 text-[11px]">
                  اسم المستلم المعتمد لدى الهرم: <strong className="font-bold text-slate-900">شركة يامانغو للوساطة والتسويق</strong> - فرع السويداء الرئيسي.
                </p>
              </div>
            )}

            {paymentMethod === 'hand_to_hand_escrow' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>استلام ومعاينة ميدانية مباشرة</span>
                </p>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  يقوم المشتري بمعاينة الغرض في موقع البائع بالسويداء أو الكفر، ولا يتم تسليم الكاش إلا بعد فحص الغرض ومطابقته للصور والمواصفات.
                </p>
              </div>
            )}

            {/* Buyer Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  اسم المشتري بالكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  رقم الهاتف للتواصل وتأكيد الإسكرو <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="0933XXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-sm"
                />
              </div>
            </div>

            {/* Delivery / Handover Preference */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                خيار الاستلام
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryOption('pickup_in_person')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                    deliveryOption === 'pickup_in_person'
                      ? 'bg-amber-50 text-amber-900 border-amber-400 font-bold'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  استلام يدوي ومعاينة بالموقع
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryOption('local_delivery')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                    deliveryOption === 'local_delivery'
                      ? 'bg-amber-50 text-amber-900 border-amber-400 font-bold'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  توصيل محلي عبر سائق معتمد
                </button>
              </div>

              {deliveryOption === 'local_delivery' && (
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="اكتب عنوان التوصيل بالتفصيل (البلدة، الحي، نقطة علام)..."
                  className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-xs"
                />
              )}
            </div>

            {/* Financial Summary Breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>سعر الغرض المستعمل:</span>
                <span className="font-bold text-slate-900">
                  {formatUsedItemPrice(item.price, item.currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>عمولة المنصة والضمان المقتطعة (3.5%):</span>
                <span className="font-bold text-amber-700">
                  {formatUsedItemPrice(commissionCalc.commissionAmount, item.currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>صافي المستحق للبائع:</span>
                <span className="font-bold text-emerald-700">
                  {formatUsedItemPrice(commissionCalc.sellerNetPayout, item.currency)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                <span>المبلغ المطلوب إيداعه لدى الوكيل:</span>
                <span className="text-amber-700">
                  {formatUsedItemPrice(item.price, item.currency)}
                </span>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>تأكيد الحجز وتوليد رمز الضمان (OTP)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
