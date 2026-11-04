import React, { useState } from 'react';
import { 
  UsedItem, 
  UsedItemCategory, 
  UsedItemCondition, 
  UsedItemOrder, 
  PaymentAgent, 
  User, 
  ZoneLocation 
} from '../types';
import { 
  USED_CATEGORY_LABELS, 
  USED_CONDITION_CONFIG, 
  filterUsedItems, 
  formatUsedItemPrice,
  USED_PAYMENT_METHODS 
} from '../utils/usedGoods';
import { UsedItemCard } from './UsedItemCard';
import { NewUsedItemModal } from './NewUsedItemModal';
import { BuyUsedItemModal } from './BuyUsedItemModal';
import { UsedGoodsSalesSummary } from './UsedGoodsSalesSummary';
import { classifyUsedItemCategoryNLP, NLPCategoryResult } from '../utils/usedGoodsNLP';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck, 
  Building, 
  Coins, 
  Sparkles, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  KeyRound, 
  Tv, 
  Refrigerator, 
  Armchair, 
  SunMedium, 
  Wrench, 
  Boxes, 
  ArrowUpDown,
  RotateCcw,
  Check,
  AlertCircle,
  Wand2,
  Cpu,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';

interface UsedGoodsMarketplaceViewProps {
  usedItems: UsedItem[];
  usedItemOrders: UsedItemOrder[];
  agents: PaymentAgent[];
  currentUser: User;
  usdToSypRate?: number;
  onAddUsedItem: (item: Omit<UsedItem, 'id' | 'createdAt' | 'platformCommissionRate' | 'platformCommissionAmount' | 'sellerNetPayout'>) => void;
  onPurchaseUsedItem: (orderData: Omit<UsedItemOrder, 'id' | 'createdAt' | 'secretOtp' | 'status'>) => UsedItemOrder;
  onUpdateOrderStatus: (orderId: string, status: UsedItemOrder['status']) => void;
  onDeleteUsedItem: (itemId: string) => void;
}

export const UsedGoodsMarketplaceView: React.FC<UsedGoodsMarketplaceViewProps> = ({
  usedItems,
  usedItemOrders,
  agents,
  currentUser,
  usdToSypRate = 14850,
  onAddUsedItem,
  onPurchaseUsedItem,
  onUpdateOrderStatus,
  onDeleteUsedItem,
}) => {
  // Tabs: 'marketplace' | 'orders'
  const [subTab, setSubTab] = useState<'marketplace' | 'orders'>('marketplace');

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<UsedItemCategory | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<ZoneLocation | 'all'>('all');
  const [selectedCondition, setSelectedCondition] = useState<UsedItemCondition | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  // NLP Auto-classification interactive assistant state
  const [nlpTestQuery, setNlpTestQuery] = useState('');
  const [isNlpAssistantOpen, setIsNlpAssistantOpen] = useState(true);
  const [prefillTitle, setPrefillTitle] = useState('');
  const [prefillDescription, setPrefillDescription] = useState('');
  const [prefillCategory, setPrefillCategory] = useState<UsedItemCategory | undefined>();

  // Modals
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [buyingItem, setBuyingItem] = useState<UsedItem | null>(null);

  // Live NLP categorization for the assistant input
  const nlpAssistantResult = React.useMemo(() => {
    return classifyUsedItemCategoryNLP(nlpTestQuery);
  }, [nlpTestQuery]);

  const handleOpenNewItemWithNLP = (customDesc?: string, customCategory?: UsedItemCategory) => {
    const desc = customDesc !== undefined ? customDesc : nlpTestQuery;
    const cat = customCategory || (nlpAssistantResult.isConfident ? nlpAssistantResult.suggestedCategory : undefined);
    setPrefillTitle(desc.slice(0, 60));
    setPrefillDescription(desc);
    setPrefillCategory(cat);
    setIsNewItemModalOpen(true);
  };

  const handleOpenStandardNewItem = () => {
    setPrefillTitle('');
    setPrefillDescription('');
    setPrefillCategory(undefined);
    setIsNewItemModalOpen(true);
  };

  // Filtered Items
  const filteredItems = filterUsedItems(usedItems, {
    category: selectedCategory,
    zone: selectedZone,
    condition: selectedCondition,
    search: searchQuery,
    sortBy,
  });

  const availableCount = usedItems.filter((i) => i.status === 'available').length;
  const activeOrdersCount = usedItemOrders.filter((o) => o.status === 'escrow_secured' || o.status === 'pending_payment').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Marketplace Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>سوق المستعمل المضمون في السويداء وبلدة الكفر</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              سوق الأغراض المستعملة، الأثاث، والكهربائيات
            </h1>
            <p className="mt-2 text-sm text-slate-200 leading-relaxed max-w-xl">
              اعرض أغراضك وحدد السعر بنفسك. نقتطع نسبة وساطة رمزية (3.5%) فقط عند اكتمال البيع، مع إمكانية الشراء والدفع كاش عبر شبكة الوكلاء المعتمدين في الكفر والسويداء وشهبا.
            </p>

            {/* Quick Guarantees Chips */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>إسكرو وضمان المعاينة</span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-300" />
                <span>عمولة رمزية 3.5% فقط</span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-300" />
                <span>دفع كاش عبر الوكلاء وOTP</span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-purple-500/20 backdrop-blur-md border border-purple-400/30 text-purple-200 flex items-center gap-1.5 font-bold">
                <Wand2 className="w-3.5 h-3.5 text-purple-300" />
                <span>تصنيف تلقائي بالـ NLP</span>
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={handleOpenStandardNewItem}
              className="py-3 px-5 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4 stroke-3" />
              <span>أضف غرض مستعمل للبيع</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab(subTab === 'marketplace' ? 'orders' : 'marketplace')}
              className="py-2.5 px-4 bg-white/15 hover:bg-white/25 active:scale-98 text-white font-bold rounded-2xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Clock className="w-4 h-4 text-amber-300" />
              <span>
                {subTab === 'marketplace' ? `طلبات وحجوزات الإسكرو (${activeOrdersCount})` : 'العودة لمعروضات السوق'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Section: Sales Volume, Pending Commissions & Category Bar Chart */}
      <UsedGoodsSalesSummary
        orders={usedItemOrders}
        items={usedItems}
        usdToSypRate={usdToSypRate}
      />

      {/* Main SubTab: Marketplace or Orders */}
      {subTab === 'orders' ? (
        /* ORDERS & ACTIVE ESCROW DEALS VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>سجل طلبات الشراء والضمان المالي (الأغراض المستعملة)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                إدارة حجوزات المستعمل، متابعة إيداع الكاش لدى الوكلاء المعتمدين، وأكواد الـ OTP
              </p>
            </div>
            <button
              onClick={() => setSubTab('marketplace')}
              className="px-3.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
            >
              عرض السوق
            </button>
          </div>

          {usedItemOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold">لا توجد طلبات إسكرو مستعمل حالياً</p>
              <p className="text-xs text-slate-400 mt-1">تصفح السوق واختر غرضاً للشراء بالضمان.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usedItemOrders.map((order) => {
                const isSecured = order.status === 'escrow_secured';
                const isCompleted = order.status === 'completed';

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          {order.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">
                          {order.itemTitle}
                        </h4>
                      </div>

                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                        isSecured
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isCompleted
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {isSecured ? 'مبلغ محجوز بإسكرو' : isCompleted ? 'صفقة مكتملة' : order.status}
                      </span>
                    </div>

                    {/* Price and Commission */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">سعر الغرض:</span>
                        <span className="font-bold text-slate-900">{formatUsedItemPrice(order.itemPrice, order.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">عمولة المنصة (3.5%):</span>
                        <span className="font-bold text-amber-700">{formatUsedItemPrice(order.commissionAmount, order.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">صافي المستحق للبائع:</span>
                        <span className="font-bold text-emerald-700">{formatUsedItemPrice(order.sellerNetPayout, order.currency)}</span>
                      </div>
                    </div>

                    {/* Secret OTP Badge */}
                    <div className="flex items-center justify-between p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl text-xs">
                      <span className="text-amber-900 font-semibold flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                        <span>رمز التحقق السري (OTP):</span>
                      </span>
                      <strong className="font-mono font-black text-slate-900 text-sm tracking-wider">
                        {order.secretOtp}
                      </strong>
                    </div>

                    {/* Parties and Agent */}
                    <div className="text-xs text-slate-600 space-y-1 pt-1">
                      <div className="flex justify-between">
                        <span>طريقة الدفع:</span>
                        <strong className="text-slate-800">{USED_PAYMENT_METHODS[order.paymentMethod].label}</strong>
                      </div>
                      {order.agentName && (
                        <div className="flex justify-between">
                          <span>الوكيل المعتمد:</span>
                          <strong className="text-slate-800">{order.agentName} ({order.agentPhone})</strong>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>المشتري:</span>
                        <span>{order.buyerName} ({order.buyerPhone})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>البائع:</span>
                        <span>{order.sellerName} ({order.sellerPhone})</span>
                      </div>
                    </div>

                    {/* Action buttons to update status */}
                    {isSecured && (
                      <div className="pt-2 flex items-center gap-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                          className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تأكيد الاستلام وإغلاق الصفقة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                          className="py-1.5 px-3 bg-slate-200 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          إلغاء الطلب
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* MARKETPLACE BROWSING VIEW */
        <div className="space-y-6">
          {/* NLP Category Auto-Classifier Assistant Bar */}
          <div 
            data-testid="nlp-marketplace-assistant-bar"
            className="rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-amber-950 text-white p-5 shadow-lg border border-purple-500/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -ml-10 -mb-10" />

            <div className="relative z-10 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-purple-500/30 text-purple-200 rounded-xl border border-purple-400/30">
                    <Wand2 className="w-4 h-4 text-purple-300" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                      <span>مساعد التصنيف التلقائي الذكي (NLP Auto-Classifier)</span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                        معالجة لغوية طبيعية
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      جرّب كتابة أو لصق وصف أي غرض مستعمل لاقتراح التصنيف المناسب واستخراج الكلمات المفتاحية فورياً
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNlpAssistantOpen(!isNlpAssistantOpen)}
                  className="text-xs text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{isNlpAssistantOpen ? 'إخفاء المساعد' : 'توسيع المساعد'}</span>
                  {isNlpAssistantOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {isNlpAssistantOpen && (
                <div className="space-y-3 pt-1">
                  {/* Input bar */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                      <input
                        type="text"
                        value={nlpTestQuery}
                        onChange={(e) => setNlpTestQuery(e.target.value)}
                        placeholder="اكتب وصف الغرض لتجربة التصنيف (مثال: غسالة LG 9 كغ إنفرتر، طقم كنبايات صالون خشب زان، إنفرتر طاقة شمسية 3.5KVA...)"
                        className="w-full pr-4 pl-10 py-2.5 rounded-xl bg-white/10 text-white placeholder:text-slate-400 border border-white/20 focus:border-purple-400 focus:bg-white/15 outline-none text-xs"
                      />
                      {nlpTestQuery && (
                        <button
                          type="button"
                          onClick={() => setNlpTestQuery('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          مسح
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenNewItemWithNLP()}
                      disabled={!nlpTestQuery.trim()}
                      className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة غرض بالتصنيف المقترح</span>
                    </button>
                  </div>

                  {/* Quick Test Presets Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <span className="text-[11px] text-purple-300 font-semibold shrink-0">نماذج سريعة للتجربة:</span>
                    {[
                      { text: 'غسالة LG 9 كغ إنفرتر محرك دفع مباشر ونظام بخار', label: 'غسالة LG' },
                      { text: 'طقم كنبايات صالون تركي خشب زان 7 مقاعد مع طاولة', label: 'كنبايات زان' },
                      { text: 'منظومة إنفرتر طاقة شمسية 3.5KVA وبطاريتين تيوبلر', label: 'طاقة شمسية' },
                      { text: 'لابتوب Dell Latitude Core i7 رام 16GB وشاشة 4K', label: 'لابتوب Dell' },
                      { text: 'طقم دريل شاكوش هيلتي ماكيتا وبوكسات ميكانيك', label: 'دريل ماكيتا' },
                      { text: 'دراجة هوائية مقاس 26 مع خوذة وشنطة رحلات', label: 'دراجة هوائية' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNlpTestQuery(preset.text)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] text-purple-200 hover:text-white transition-all shrink-0 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Live Result Feedback Box if query typed */}
                  {nlpTestQuery.trim() && (
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-amber-300 font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>التصنيف المقترح بالـ NLP:</span>
                          </span>
                          <strong className="text-white text-xs bg-purple-500/40 px-2.5 py-0.5 rounded-lg border border-purple-400/40 font-black">
                            {nlpAssistantResult.categoryLabel}
                          </strong>
                          <span className="text-emerald-300 font-bold text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">
                            نسبة الثقة: {nlpAssistantResult.confidence}%
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {nlpAssistantResult.explanation}
                        </p>

                        {nlpAssistantResult.matchedKeywords.length > 0 && (
                          <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                            <span className="text-[10px] text-purple-300">الكلمات المفتاحية:</span>
                            {nlpAssistantResult.matchedKeywords.map((k, i) => (
                              <span key={i} className="text-[10px] font-mono bg-white/15 px-1.5 py-0.2 rounded text-white">
                                {k}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenNewItemWithNLP()}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm w-full sm:w-auto"
                      >
                        <span>أضف بهذا التصنيف</span>
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            {/* Search and Secondary Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search Keyword */}
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن أجهزة منزلية، غسالة، شاشة، طاقة شمسية، أثاث..."
                  className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 -translate-y-1/2 left-3 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    مسح
                  </button>
                )}
              </div>

              {/* Zone Selector */}
              <div className="sm:col-span-3">
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value as ZoneLocation | 'all')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-amber-500 outline-none bg-white font-medium text-slate-700"
                >
                  <option value="all">كل بلدات السويداء</option>
                  <option value="al_kafr">بلدة الكفر</option>
                  <option value="suwayda">مدينة السويداء</option>
                  <option value="shahba">شهبا</option>
                  <option value="salkhad">صلخد</option>
                  <option value="al_qurayya">القريّا</option>
                  <option value="ariqa">عريقة</option>
                  <option value="mazraa">المزرعة</option>
                </select>
              </div>

              {/* Condition Selector */}
              <div className="sm:col-span-2">
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value as UsedItemCondition | 'all')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-amber-500 outline-none bg-white font-medium text-slate-700"
                >
                  <option value="all">كل الحالات</option>
                  <option value="like_new">كالجديد</option>
                  <option value="excellent">ممتاز</option>
                  <option value="very_good">جيد جداً</option>
                  <option value="good">جيد</option>
                  <option value="needs_repair">يحتاج صيانة</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="sm:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-amber-500 outline-none bg-white font-medium text-slate-700"
                >
                  <option value="newest">الأحدث أولاً</option>
                  <option value="price_asc">الأقل سعراً</option>
                  <option value="price_desc">الأعلى سعراً</option>
                </select>
              </div>
            </div>

            {/* Category Pills Slider */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                جميع الأغراض ({usedItems.length})
              </button>

              {(Object.entries(USED_CATEGORY_LABELS) as [UsedItemCategory, typeof USED_CATEGORY_LABELS[UsedItemCategory]][]).map(
                ([catKey, info]) => {
                  const isCatSelected = selectedCategory === catKey;
                  const countInCat = usedItems.filter((i) => i.category === catKey).length;

                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setSelectedCategory(catKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCatSelected
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{info.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isCatSelected ? 'bg-amber-700 text-amber-100' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {countInCat}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Results Header Info */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              عرض <strong className="text-slate-900 font-bold">{filteredItems.length}</strong> غرض مستعمل متوفر
            </span>
            {(selectedCategory !== 'all' || selectedZone !== 'all' || selectedCondition !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedZone('all');
                  setSelectedCondition('all');
                  setSearchQuery('');
                }}
                className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط الفلاتر</span>
              </button>
            )}
          </div>

          {/* Cards Grid */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">لا توجد معروضات تطابق خيارات البحث</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                جرب تغيير التصنيف أو المنطقة، أو كن أول من يضيف غرضاً جديداً في هذا القسم.
              </p>
              <button
                type="button"
                onClick={() => setIsNewItemModalOpen(true)}
                className="mt-4 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة غرض مستعمل الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredItems.map((item) => (
                <UsedItemCard
                  key={item.id}
                  item={item}
                  currentUser={currentUser}
                  onBuyClick={(it) => setBuyingItem(it)}
                  onDeleteClick={onDeleteUsedItem}
                />
              ))}
            </div>
          )}

          {/* Certified Payment Agents Bottom Ribbon */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 shadow-md border border-slate-700/60">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-amber-400 text-xs font-bold flex items-center gap-1 mb-1">
                  <Building className="w-4 h-4" />
                  <span>شبكة الوكلاء المعتمدين لضمان صفقات المستعمل</span>
                </span>
                <h3 className="text-lg font-bold">تسليم واستلام الكاش المالي بأمان في الكفر والسويداء وشهبا</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  تتيح منصة يامانغو دفع ثمن الأغراض كاش لدى أي وكيل معتمد دون الحاجة لحسابات بنكية، حيث يستلم المشتري إيصالاً رسمياً ورمز OTP ولا يسلم المبلغ للبائع إلا بعد تأكيد المعاينة.
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {agents.map((ag) => (
                  <div key={ag.id} className="p-3 rounded-xl bg-white/10 border border-white/10 text-xs shrink-0">
                    <strong className="block text-white font-bold">{ag.name}</strong>
                    <span className="text-slate-300 text-[11px] block">{ag.address}</span>
                    <span className="text-amber-300 text-[10px] block mt-0.5">{ag.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewUsedItemModal
        isOpen={isNewItemModalOpen}
        onClose={() => setIsNewItemModalOpen(false)}
        onSubmit={onAddUsedItem}
        currentUser={currentUser}
        initialTitle={prefillTitle}
        initialDescription={prefillDescription}
        initialCategory={prefillCategory}
      />

      <BuyUsedItemModal
        isOpen={!!buyingItem}
        onClose={() => setBuyingItem(null)}
        item={buyingItem}
        agents={agents}
        currentUser={currentUser}
        onConfirmPurchase={onPurchaseUsedItem}
      />
    </div>
  );
};
