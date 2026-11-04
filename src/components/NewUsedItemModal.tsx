import React, { useState, useMemo, useEffect } from 'react';
import { 
  UsedItem, 
  UsedItemCategory, 
  UsedItemCondition, 
  CurrencyCode, 
  ZoneLocation, 
  User 
} from '../types';
import { 
  USED_CATEGORY_LABELS, 
  USED_CONDITION_CONFIG, 
  calculateUsedItemCommission,
  formatUsedItemPrice 
} from '../utils/usedGoods';
import { classifyUsedItemCategoryNLP, NLPCategoryResult } from '../utils/usedGoodsNLP';
import { 
  X, 
  Plus, 
  Camera, 
  Sparkles, 
  MapPin, 
  Tag, 
  ShieldCheck, 
  AlertCircle, 
  Package, 
  Check, 
  Coins,
  Cpu,
  Wand2,
  CheckCircle2,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface NewUsedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<UsedItem, 'id' | 'createdAt' | 'platformCommissionRate' | 'platformCommissionAmount' | 'sellerNetPayout'>) => void;
  currentUser: User;
  initialTitle?: string;
  initialDescription?: string;
  initialCategory?: UsedItemCategory;
}

const PRESET_IMAGES_BY_CATEGORY: Record<UsedItemCategory, string[]> = {
  home_appliances: [
    'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
  ],
  furniture: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
  ],
  electronics: [
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  ],
  solar_power: [
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1508873696983-2df570464756?auto=format&fit=crop&w=800&q=80',
  ],
  tools: [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80',
  ],
  other: [
    'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
  ],
};

export const NewUsedItemModal: React.FC<NewUsedItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  initialTitle = '',
  initialDescription = '',
  initialCategory,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState<UsedItemCategory>(initialCategory || 'home_appliances');
  const [condition, setCondition] = useState<UsedItemCondition>('excellent');
  const [price, setPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState<CurrencyCode>('SYP');
  const [zone, setZone] = useState<ZoneLocation>(currentUser.zone || 'al_kafr');
  const [locationDetails, setLocationDetails] = useState('');
  const [sellerName, setSellerName] = useState(currentUser.fullName);
  const [sellerPhone, setSellerPhone] = useState(currentUser.phone);
  const [imageUrl, setImageUrl] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'pickup_in_person' | 'local_delivery' | 'both'>('both');
  const [errorMsg, setErrorMsg] = useState('');

  // NLP Auto-classification states
  const [autoApplyNLP, setAutoApplyNLP] = useState(true);
  const [userManuallySelectedCategory, setUserManuallySelectedCategory] = useState(false);
  const [nlpSuccessFeedback, setNlpSuccessFeedback] = useState<string | null>(null);

  // Compute live NLP classification based on title & description
  const nlpResult = useMemo(() => {
    return classifyUsedItemCategoryNLP(description, title);
  }, [description, title]);

  // Auto-apply NLP suggestion when confident and auto-mode is enabled
  useEffect(() => {
    if (autoApplyNLP && !userManuallySelectedCategory && nlpResult.isConfident) {
      if (nlpResult.suggestedCategory !== category) {
        setCategory(nlpResult.suggestedCategory);
        setNlpSuccessFeedback(`تم تحديد التصنيف تلقائياً بواسطة معالجة اللغة الطبيعية (NLP): ${nlpResult.categoryLabel} (${nlpResult.confidence}%)`);
      }
    }
  }, [nlpResult, autoApplyNLP, userManuallySelectedCategory, category]);

  // Reset or initialize when modal opens with initial values
  useEffect(() => {
    if (initialTitle) setTitle(initialTitle);
    if (initialDescription) setDescription(initialDescription);
    if (initialCategory) {
      setCategory(initialCategory);
      setUserManuallySelectedCategory(true);
    }
  }, [initialTitle, initialDescription, initialCategory]);

  if (!isOpen) return null;

  const numericPrice = typeof price === 'number' ? price : 0;
  const commissionCalc = calculateUsedItemCommission(numericPrice, currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('يرجى كتابة عنوان واضح للغرض المستعمل.');
      return;
    }
    if (!numericPrice || numericPrice <= 0) {
      setErrorMsg('يرجى تحديد سعر بيع صحيح.');
      return;
    }
    if (!sellerPhone.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف للتواصل.');
      return;
    }

    const finalImage = imageUrl.trim() || PRESET_IMAGES_BY_CATEGORY[category][0];

    onSubmit({
      sellerId: currentUser.id,
      sellerName: sellerName.trim() || currentUser.fullName,
      sellerPhone: sellerPhone.trim(),
      sellerRating: 5.0,
      title: title.trim(),
      category,
      condition,
      price: numericPrice,
      currency,
      zone,
      locationDetails: locationDetails.trim() || (zone === 'al_kafr' ? 'بلدة الكفر' : 'محافظة السويداء'),
      description: description.trim() || 'غرض مستعمل بحالة جيدة متاح للمعاينة والتسليم.',
      images: [finalImage],
      status: 'available',
      deliveryOption,
      viewsCount: 1,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-200" />
              <span>إضافة غرض مستعمل للبيع (سوق المستعمل)</span>
            </h2>
            <p className="text-xs text-amber-100 mt-0.5">
              اعرض أغراضك المنزلية، الأثاث، أو الأجهزة وحدد السعر مع اقتطاع عمولة وساطة رمزية (3.5%) فقط بعد البيع
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              عنوان الغرض المستعمل <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: غسالة LG أوتوماتيك 9 كغ إنفرتر أو طقم صالون خشب زان"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm"
            />
          </div>

          {/* Description & Live NLP Analysis */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                الوصف والمواصفات <span className="text-slate-400 font-normal">(محرك NLP يحلل الوصف لاقتراح التصنيف)</span>
              </label>
              <button
                type="button"
                onClick={() => setAutoApplyNLP(!autoApplyNLP)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-colors cursor-pointer ${
                  autoApplyNLP
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
                title="تفعيل أو تعطيل التحديث التلقائي للتصنيف أثناء كتابة الوصف"
              >
                <Wand2 className="w-3 h-3 text-purple-600" />
                <span>{autoApplyNLP ? 'التصنيف التلقائي الفوري: مفعّل' : 'التصنيف التلقائي: يدوي'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب مواصفات الغرض بالتفصيل (مثل: غسالة 9 كغ إنفرتر، طقم كنبايات زان، منظومة إنفرتر طاقة شمسية مع بطاريات، لابتوب ديل i7، دريل شاكوش ماكيتا...)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm leading-relaxed"
            />

            {/* Smart NLP Classification Card */}
            <div 
              data-testid="nlp-category-suggestion-card"
              className={`p-3.5 rounded-2xl border transition-all ${
                nlpResult.isConfident
                  ? 'bg-gradient-to-r from-purple-50/80 via-amber-50/50 to-white border-purple-200 shadow-2xs'
                  : 'bg-slate-50 border-slate-200/80 text-slate-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <span>اقتراح التصنيف بالذكاء اللغوي (NLP):</span>
                      <strong className="text-amber-800 underline decoration-amber-400">
                        {nlpResult.categoryLabel}
                      </strong>
                    </span>
                    {nlpResult.confidence > 0 && (
                      <span className="text-[10px] text-purple-700 font-bold ml-2">
                        (نسبة الثقة: {nlpResult.confidence}%)
                      </span>
                    )}
                  </div>
                </div>

                {nlpResult.isConfident && (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {category === nlpResult.suggestedCategory ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>مطبق كالتصنيف الحالي</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCategory(nlpResult.suggestedCategory);
                          setUserManuallySelectedCategory(false);
                          setNlpSuccessFeedback(`تم تطبيق تصنيف: ${nlpResult.categoryLabel}`);
                        }}
                        className="py-1 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تطبيق هذا التصنيف</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Matched Keywords and Explanation */}
              <div className="mt-2 text-xs text-slate-600">
                <p className="leading-relaxed text-[11px] text-slate-700">
                  {nlpResult.explanation}
                </p>

                {nlpResult.matchedKeywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px]">
                    <span className="text-slate-400 text-[10px] font-semibold">الكلمات المفتاحية المكتشفة:</span>
                    {nlpResult.matchedKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-purple-100/70 border border-purple-200 text-purple-900 font-mono text-[10px] font-bold"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category & Condition Grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  تصنيف الغرض <span className="text-rose-500">*</span>
                </label>
                {category === nlpResult.suggestedCategory && nlpResult.isConfident && (
                  <span className="text-[10px] text-purple-700 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>محدد بـ NLP</span>
                  </span>
                )}
              </div>

              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as UsedItemCategory);
                  setUserManuallySelectedCategory(true);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm bg-white"
              >
                {Object.entries(USED_CATEGORY_LABELS).map(([catKey, val]) => (
                  <option key={catKey} value={catKey}>
                    {val.label} {catKey === nlpResult.suggestedCategory ? '✨ (مقترح NLP)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                حالة الغرض الواقعية <span className="text-rose-500">*</span>
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as UsedItemCondition)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm bg-white"
              >
                {Object.entries(USED_CONDITION_CONFIG).map(([condKey, val]) => (
                  <option key={condKey} value={condKey}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Live Commission Calculator */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-slate-50 to-white border border-amber-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>تحديد السعر وحساب عمولة المنصة التلقائي</span>
              </span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                عمولة المنصة: 3.5% فقط
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  السعر المطلوب للبيع <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="مثال: 150 أو 2500000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  العملة <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrency('SYP')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      currency === 'SYP'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    ليرة سورية (ل.س)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      currency === 'USD'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    دولار أمريكي ($)
                  </button>
                </div>
              </div>
            </div>

            {/* Live Financial Breakdown Summary */}
            {numericPrice > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">سعر العرض للشاري:</span>
                  <span className="font-extrabold text-slate-900">
                    {formatUsedItemPrice(commissionCalc.price, currency)}
                  </span>
                </div>
                <div className="p-2 bg-amber-100/60 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-800 block">اقتطاع المنصة (3.5%):</span>
                  <span className="font-extrabold text-amber-900">
                    {formatUsedItemPrice(commissionCalc.commissionAmount, currency)}
                  </span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block">صافي ما سيقبضه البائع:</span>
                  <span className="font-extrabold text-emerald-800">
                    {formatUsedItemPrice(commissionCalc.sellerNetPayout, currency)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Location & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                المنطقة / البلدة <span className="text-rose-500">*</span>
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as ZoneLocation)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm bg-white"
              >
                <option value="al_kafr">بلدة الكفر</option>
                <option value="suwayda">مدينة السويداء</option>
                <option value="shahba">شهبا</option>
                <option value="salkhad">صلخد</option>
                <option value="al_qurayya">القريّا</option>
                <option value="ariqa">عريقة</option>
                <option value="mazraa">المزرعة</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                الحي / العنوان الدقيق
              </label>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="مثال: قرب ساحة البلدة أو الحي الغربي"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Seller Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                اسم المعلن / البائع <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                رقم الهاتف للتواصل وتأكيد الحجز <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                placeholder="0933XXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Photo Selection / Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              صورة الغرض المستعمل
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="رابط صورة مباشر أو اختر من النماذج أدناه..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-xs"
              />
            </div>

            {/* Quick preset thumbnail chips */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">صور مقترحة:</span>
              {PRESET_IMAGES_BY_CATEGORY[category].map((presetUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(presetUrl)}
                  className={`relative w-14 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    imageUrl === presetUrl ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={presetUrl} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Handover Preference */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              طريقة تسليم الغرض للشاري
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryOption('both')}
                className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  deliveryOption === 'both'
                    ? 'bg-amber-50 text-amber-900 border-amber-400 font-bold'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                استلام أو توصيل
              </button>
              <button
                type="button"
                onClick={() => setDeliveryOption('pickup_in_person')}
                className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  deliveryOption === 'pickup_in_person'
                    ? 'bg-amber-50 text-amber-900 border-amber-400 font-bold'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                استلام يدوي فقط
              </button>
              <button
                type="button"
                onClick={() => setDeliveryOption('local_delivery')}
                className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                  deliveryOption === 'local_delivery'
                    ? 'bg-amber-50 text-amber-900 border-amber-400 font-bold'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                توصيل محلي
              </button>
            </div>
          </div>

          {/* Escrow Guarantee Notice */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/90 text-xs text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">ضمان حقوق البيع والشراء عبر يامانغو</p>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                يقوم المشتري بإيداع ثمن الغرض لدى وكيل دفع معتمد أو المحفظة المعتمدة، ولا يتم تحرير المبلغ وصافي المستحق للبائع إلا بعد معاينة الغرض واستلامه وتأكيد رمز الأمان (OTP).
              </p>
            </div>
          </div>

          {/* Footer Submit Button */}
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
              <Plus className="w-4 h-4" />
              <span>نشر الغرض في سوق المستعمل</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
