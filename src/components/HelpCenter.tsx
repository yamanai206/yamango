import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Search,
  BookOpen,
  ShieldCheck,
  CreditCard,
  Wrench,
  MessageSquare,
  LifeBuoy,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  Lock,
  Calendar,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContactSupport: () => void;
}

type HelpTab = 'guide' | 'kyc_security' | 'escrow_deals' | 'inspections' | 'faq';

export const HelpCenter: React.FC<HelpCenterProps> = ({
  isOpen,
  onClose,
  onOpenContactSupport,
}) => {
  const [activeTab, setActiveTab] = useState<HelpTab>('guide');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  if (!isOpen) return null;

  const faqs = [
    {
      q: 'كيف يضمن نظام الوساطة (الإسكرو) حقي كمشتري لآلية أو جرار زراعي؟',
      a: 'عند بدء الصفقة، يُودع العربون النقدي لدى أحد وكلاء الدفع المعتمدين في الكفر أو السويداء، ويتم تجميده بالكامل مع توليد رمز تحقق مشفر (OTP). لا يتسلم البائع المبلغ ولا يُحرر العقد النهائي إلا بعد قيامك بمعاينة الآلية وفحصها في كراج معتمد والموافقة على استلامها.',
    },
    {
      q: 'ماذا يحدث إذا أظهر فحص الكراج عيوباً خفية في المحرك أو الشاسيه؟',
      a: 'يحق للمشتري إلغاء الصفقة فوراً واسترداد عربونه كاملاً من وكيل الدفع دون أي اقتطاع تعسفي، وذلك بالاستناد إلى تقرير الفحص الرقمي الصادر عن الكراج المعتمد.',
    },
    {
      q: 'كيف يتم توثيق حسابات البائعين والمشترين (KYC)؟',
      a: 'يتم رفع صورة البطاقة الشخصية أو السجل التجاري ورقم الهاتف السوري النشط. يقوم المشرف الميداني بالتحقق وتفعيل شارة الحساب الموثوق لضمان الجدية ومنع الوسطاء الوهميين.',
    },
    {
      q: 'أين ينتشر وكلاء الدفع المعتمدون في محافظة السويداء؟',
      a: 'تغطي شبكتنا المعتمدة بلدة الكفر (قرب البلدية والمدخل الشمالي)، مدينة السويداء (طريق قنوات، دوار الجرة، ساحة المشنقة)، ناحية صلخد، وناحية شهبا لتسهيل تسليم واستلام الدفعات النقدية محلياً.',
    },
    {
      q: 'هل يمكن حجز موعد لمعاينة الجرار أو الحفارة في الحقل أو الكرم مباشرة؟',
      a: 'نعم، عبر خاصية "جدولة معاينة ميدانية" المتوفرة في صفحة كل إعلان والتقويم المعتمد، حيث يمكنك تحديد التاريخ والتوقيت والمنطقة بدقة.',
    },
  ];

  const filteredFaqs = searchQuery.trim()
    ? faqs.filter(
        (f) =>
          f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-center-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </span>
            <div>
              <h3 id="help-center-title" className="text-base sm:text-lg font-black text-slate-900">
                مركز المساعدة ودليل المستخدم
              </h3>
              <p className="text-xs text-slate-500">
                منصة yamango للمركبات والآليات الزراعية في السويداء والكفر
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

        {/* Action Callouts Banner: Contact Support & WhatsApp */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border border-amber-200/80 rounded-2xl my-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-800">
            <span className="font-bold block text-slate-900">هل تحتاج مساعدة فورية أو لديك شكوى؟</span>
            <span className="text-slate-500 text-[11px]">فريق المشرفين الميدانيين جاهز لمساعدتك وحل أي استفسار</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Button to open ContactSupportModal */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenContactSupport();
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>إرسال تذكرة دعم</span>
            </button>

            {/* Direct WhatsApp link */}
            <a
              href="https://wa.me/963933000000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%A9%20%D9%81%D9%8A%20%D9%85%D9%86%D8%B5%D8%A9%20yamango"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>تواصل عبر واتساب</span>
            </a>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في دليل المستخدم والأسئلة الشائعة..."
            className="w-full pr-10 pl-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Navigation Subtabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-4 overflow-x-auto text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-amber-100 text-amber-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            دليل استخدام المنصة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kyc_security')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'kyc_security'
                ? 'bg-amber-100 text-amber-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            التوثيق والأمان (2FA)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('escrow_deals')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'escrow_deals'
                ? 'bg-amber-100 text-amber-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            الصفقات والوساطة (الإسكرو)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inspections')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'inspections'
                ? 'bg-amber-100 text-amber-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            الكراجات والمعاينة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-amber-100 text-amber-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            الأسئلة الشائعة
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4 text-xs text-slate-700 leading-relaxed">
          {/* TAB 1: Platform Overview */}
          {activeTab === 'guide' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <h4>كيفية البحث وشراء أو استئجار آلية في السويداء والكفر</h4>
                </div>
                <p>
                  منصة <strong className="text-amber-800">yamango</strong> هي السوق الرقمي المخصص للمركبات والآليات الزراعية والثقيلة في محافظة السويداء وبلدة الكفر. يمكنك:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 mr-1">
                  <li><strong>البحث المخصص:</strong> كتابة اسم الآلية (جرار، حفارة، تويوتا، كيا) مع إمكانية استخدام سجل البحث السريع للنقر على أحدث عمليات البحث.</li>
                  <li><strong>فلترة النواحي:</strong> تحديد الناحية (بلدة الكفر، مدينة السويداء، صلخد، شهبا، القريّا، المزرعة، عريقة).</li>
                  <li><strong>اختيار نوع العملية:</strong> التبديل بسهولة بين عروض البيع النهائي أو الإيجار بالساعة واليوم والشهر.</li>
                  <li><strong>مراجعة الأسعار المزدوجة:</strong> مشاهدة السعر بالليرة السورية وبالدولار الأمريكي مع تحديث فوري لأسعار الصرف المحلية.</li>
                  <li><strong>إضافة إعلان جديد:</strong> النقر على زر "أضف إعلانك" في الشريط العلوي وتعبئة تفاصيل الآلية وساعات العمل ورقم الهاتف.</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>الآليات المفحوصة والموثقة</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-normal">
                    تحمل شارة خضراء تفيد بأنها فُحصت في كراج معتمد ولها تقرير فني رقمي مقفل يحمي المشتري من المفاجآت.
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>الإعلانات المميزة والترويج</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-normal">
                    تظهر في صدارة نتائج البحث في السويداء والكفر مع إرسال تنبيهات تلقائية للمهتمين عبر واتساب.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KYC & 2FA */}
          {activeTab === 'kyc_security' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4>نظام توثيق الهوية (KYC) والمصادقة الثنائية (2FA)</h4>
                </div>
                <p>
                  للحد من عمليات الاحتيال وضمان أمان الصفقات المالية الكبيرة في المنطقة، تعتمد المنصة معايير أمان صارمة:
                </p>
                <div className="space-y-2 mt-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">1. توثيق الهوية (KYC للمستخدمين):</span>
                    <p className="text-[11px] text-slate-600">
                      يُطلب من البائعين والوكلاء رفع بطاقة شخصية صادرة عن الجهات الرسمية والتأكد من مطابقة رقم الهاتف. تحصل الحسابات الموثقة على علامة التوثيق الخضراء وتزيد نسبة الثقة والبيع بنسبة 85%.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">2. المصادقة الثنائية للمشرفين والوكلاء (2FA):</span>
                    <p className="text-[11px] text-slate-600">
                      تتطلب لوحة الإدارة وإدارة وكلاء الدفع تفعيل المصادقة الثنائية عبر الرسائل القصيرة SMS أو تطبيقات المصادقة (Google Authenticator) لمنع أي وصول غير مصرح به.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block">3. سجل التدقيق الرقمي (Audit Log):</span>
                    <p className="text-[11px] text-slate-600">
                      يتم تسجيل كل تعديل في أسعار الصرف، نسب العمولات، إصدار رموز الـ OTP، وتوثيق الكراجات في سجل غير قابل للحذف يمكن تصديره كملف CSV أو JSON للتدقيق.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Escrow Deals */}
          {activeTab === 'escrow_deals' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <h4>دليل إتمام صفقات الإسكرو ووكلاء الدفع المعتمدين</h4>
                </div>
                <p>
                  يحل نظام الوساطة المالية معضلة الثقة النقدية بين البائع والمشتري في السويداء والكفر عبر 4 مراحل واضحة:
                </p>

                <div className="space-y-2 mt-2">
                  <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                    <div>
                      <span className="font-bold text-slate-900 block">بدء الصفقة وتحديد الشروط:</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        يتفق المشتري والبائع على السعر النهائي وقيمة العربون النقدي، ويتم إنشاء عقد رقمي موحد.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                    <div>
                      <span className="font-bold text-slate-900 block">إيداع العربون لدى وكيل معتمد:</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        يقوم المشتري بتسليم العربون نقداً لأقرب وكيل دفع معتمد (مثلاً في بلدية الكفر أو ساحة المشنقة بالسويداء)، ويصدر الوكيل إيصالاً رقمياً مع رمز تأكيد OTP.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                    <div>
                      <span className="font-bold text-slate-900 block">فحص ومعاينة الآلية:</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        يتم فحص الآلية في كراج معتمد أو عبر موعد معاينة ميدانية للتحقق من سلامة المحرك وساعات التشغيل.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">4</span>
                    <div>
                      <span className="font-bold text-slate-900 block">الاستلام النهائي وتحرير الأموال:</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        بعد توقيع استلام الآلية، يقوم المشتري بإدخال رمز الـ OTP لتحرير العربون للبائع وإغلاق الصفقة رسمياً.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Inspections */}
          {activeTab === 'inspections' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  <h4>الكراجات المعتمدة والتقارير الفنية المقفلة</h4>
                </div>
                <p>
                  لضمان الحيادية والنزاهة، تم اعتماد مراكز فحص متخصصة في المحافظة (مثل كراج الكفر الفني ومركز السويداء الدولي).
                </p>

                <div className="space-y-2.5 mt-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">التقرير الفني الرقمي المقفل:</span>
                    <p className="text-[11px] text-slate-600">
                      يحتوي على فحص تفصيلي للمحرك، القير، ضغط الهيدروليك، الشاسيه، وساعات التشغيل، مع منح علامة من 100 وتوقيع رقمي غير قابل للتلاعب (Tamper-proof hash).
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">تقييمات ومراجعات الكراجات:</span>
                    <p className="text-[11px] text-slate-600">
                      يمكن للمستخدمين كتابة تقييمات من 1 إلى 5 نجوم ومشاركة تجاربهم الحقيقية مع الكراجات لمساعدة الآخرين في اختيار المركز الأفضل.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FAQs */}
          {activeTab === 'faq' && (
            <div className="space-y-2.5 animate-in fade-in">
              {filteredFaqs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                  لم يتم العثور على نتائج تطابق بحثك. يمكنك التواصل مع الدعم الفني مباشرة.
                </div>
              ) : (
                filteredFaqs.map((faq, index) => {
                  const isExpanded = expandedFaq === index;
                  return (
                    <div
                      key={index}
                      className="border border-slate-200 rounded-2xl overflow-hidden bg-white transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isExpanded ? null : index)}
                        className="w-full p-3.5 text-right font-bold text-slate-900 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <span className="text-xs">{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                            isExpanded ? 'rotate-180 text-amber-600' : ''
                          }`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-1 text-slate-600 text-xs border-t border-slate-100 bg-slate-50/40 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 mt-2 text-xs">
          <div className="text-slate-400 text-[11px] hidden sm:block">
            دعم فني مباشر · هاتف: 0933000000 · السويداء وبلدة الكفر
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenContactSupport();
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
            >
              فتح تذكرة دعم جديدة
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-colors cursor-pointer"
            >
              تم، إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
