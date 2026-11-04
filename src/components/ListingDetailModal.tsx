import React, { useState, useEffect } from 'react';
import { Listing, User } from '../types';
import { VehicleImage } from './VehicleImage';
import { 
  X, 
  MapPin, 
  ShieldCheck, 
  Gauge, 
  Calendar, 
  Phone, 
  Sparkles, 
  Send, 
  Lock,
  Wrench,
  CheckCircle2, 
  FileText,
  Radio,
  Battery,
  Navigation,
  CalendarDays,
  Activity,
  ClipboardList,
  Edit3,
  Save,
  Check,
  Plus,
  Share2
} from 'lucide-react';
import { ShareListingModal } from './ShareListingModal';
import { filterContactDetails } from '../utils/escrow';

interface ListingDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
  currentUser: User;
  onRequestInspection: (listing: Listing) => void;
  onStartDeal: (listing: Listing) => void;
  onPromoteListing: (listing: Listing) => void;
  onViewReport: (reportId: string) => void;
  onBookAppointment?: (listing: Listing) => void;
  onUpdateServiceNotes?: (listingId: string, notes: string) => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  onClose,
  currentUser,
  onRequestInspection,
  onStartDeal,
  onPromoteListing,
  onViewReport,
  onBookAppointment,
  onUpdateServiceNotes,
}) => {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: string; text: string; time: string; wasRedacted: boolean }>>([
    {
      sender: 'النظام الآلي لمنصة yamango',
      text: 'أهلاً بك. محادثاتك محمية داخل التطبيق. تُحجب أرقام الهواتف تلقائياً حتى دفع العربون لدى الوكيل لضمان حقوق الطرفين وسلامة التعامل.',
      time: 'الآن',
      wasRedacted: false,
    },
  ]);

  // Service & Maintenance Notes state
  const [serviceNotesText, setServiceNotesText] = useState(listing?.serviceNotes || '');
  const [isEditingServiceNotes, setIsEditingServiceNotes] = useState(false);
  const [serviceNotesSavedNotice, setServiceNotesSavedNotice] = useState(false);

  useEffect(() => {
    if (listing) {
      setServiceNotesText(listing.serviceNotes || '');
      setIsEditingServiceNotes(false);
      setServiceNotesSavedNotice(false);
    }
  }, [listing?.id, listing?.serviceNotes]);

  // Gallery active photo index
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [listing?.id]);

  // Share modal state
  const [isShareOpen, setIsShareOpen] = useState(false);

  if (!listing) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    // Run phone detection and redacting
    const { filteredText, hadRestrictedInfo } = filterContactDetails(chatMessage, false);

    setChatHistory((prev) => [
      ...prev,
      {
        sender: currentUser.fullName,
        text: filteredText,
        time: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
        wasRedacted: hadRestrictedInfo,
      },
    ]);

    setChatMessage('');
  };

  const isOwner = listing.userId === currentUser.id || currentUser.roles.includes('seller') || currentUser.roles.includes('admin');

  const handleSaveServiceNotes = () => {
    if (!listing) return;
    const trimmed = serviceNotesText.trim();
    if (onUpdateServiceNotes) {
      onUpdateServiceNotes(listing.id, trimmed);
    }
    listing.serviceNotes = trimmed;
    setIsEditingServiceNotes(false);
    setServiceNotesSavedNotice(true);
    setTimeout(() => setServiceNotesSavedNotice(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-100 text-amber-800">
              {listing.operation === 'sale' ? 'إعلان بيع قطعي' : 'إعلان تأجير'}
            </span>
            {listing.subCategory && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                {listing.subCategory}
              </span>
            )}
            <span className="text-xs text-slate-500 font-medium">
              كود الإعلان: #{listing.id.slice(-6)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="مشاركة رابط الإعلان عبر واتساب أو نسخ الرابط"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-600" />
              <span>مشاركة</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Main Visual & Key Specs Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Image Gallery */}
            <div className="space-y-2">
              <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                <VehicleImage
                  src={listing.images && listing.images.length > 0 ? (listing.images[activeImageIndex] || listing.images[0]) : undefined}
                  alt={listing.title}
                  category={listing.category}
                  showVerifiedBadge={true}
                  className="w-full h-full object-cover"
                />
                {listing.isPromoted && (
                  <div className="absolute top-3 right-3 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>إعلان مروّج</span>
                  </div>
                )}
                {listing.images && listing.images.length > 1 && (
                  <div className="absolute bottom-3 left-3 bg-slate-950/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                    {activeImageIndex + 1} / {listing.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails row if multiple images exist */}
              {listing.images && listing.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {listing.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-amber-500 ring-2 ring-amber-500/30'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <VehicleImage
                        src={img}
                        alt={`معاينة ${idx + 1}`}
                        category={listing.category}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Specs */}
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2 leading-snug">
                  {listing.title}
                </h2>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">{listing.locationDetails}</span>
                </div>

                {/* Price Display */}
                <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 mb-4">
                  <span className="text-xs text-amber-800 font-medium block mb-1">
                    {listing.operation === 'sale' ? 'السعر المطلوب:' : 'بدل الإيجار:'}
                  </span>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    {listing.priceAmount.toLocaleString()}{' '}
                    <span className="text-sm font-bold text-amber-700">
                      {listing.currency === 'USD' ? 'دولار أمريكي ($)' : 'ليرة سورية (SYP)'}
                    </span>
                  </div>
                  {listing.operation === 'rent' && listing.rentRateUnit && (
                    <span className="text-xs text-slate-500 mt-1 block">
                      لكل {listing.rentRateUnit === 'hour' ? 'ساعة عمل' : 'يوم'} · وديعة التأمين المستردة:{' '}
                      {listing.securityDeposit?.toLocaleString() || 'محددة بالاتفاق'}
                    </span>
                  )}
                </div>
              </div>

              {/* Chassis & Ownership Verification Status */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <span className="font-semibold text-slate-800">رقم الهيكل (الشاسيه): </span>
                  <span className="font-mono text-slate-600">{listing.chassisNumber || 'موثق لدى المنصة'}</span>
                  <span className="text-emerald-700 font-medium mr-2">✓ تم التحقق من الملكية</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specifications Grid */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">المواصفات الفنية للآلية / المركبة</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
              {listing.subCategory && (
                <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/80">
                  <span className="text-amber-800 font-semibold block mb-1">النوع الفرعي</span>
                  <span className="font-bold text-slate-900 text-xs truncate block">{listing.subCategory}</span>
                </div>
              )}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="text-slate-400 block mb-1">سنة الصنع</span>
                <span className="font-bold text-slate-800 text-sm">{listing.year}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="text-slate-400 block mb-1">
                  {listing.metricType === 'work_hours' ? 'ساعات العمل' : 'المسافة المقطوعة'}
                </span>
                <span className="font-bold text-slate-800 text-sm font-mono tabular-nums">
                  {listing.metricValue.toLocaleString()}{' '}
                  {listing.metricType === 'work_hours' ? 'ساعة' : 'كم'}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="text-slate-400 block mb-1">الماركة والموديل</span>
                <span className="font-bold text-slate-800 text-sm truncate block">
                  {listing.make} {listing.model}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="text-slate-400 block mb-1">خيار السائق</span>
                <span className="font-bold text-slate-800 text-sm">
                  {listing.hasDriverOption ? 'متاح مع سائق' : 'بدون سائق'}
                </span>
              </div>
            </div>
          </div>

          {/* Service & Periodic Maintenance Notes Card (ملاحظات الخدمة والصيانة الدورية) */}
          <div className="rounded-2xl p-4 border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      ملاحظات الخدمة والصيانة الدورية للآلية
                    </h4>
                    {serviceNotesText.trim() ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        سجل صيانة متوفر
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        سجل المالك
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    تفاصيل الصيانة وتغيير الزيوت وقطع الغيار الأصلية المسجلة من قبل البائع.
                  </p>
                </div>
              </div>

              {/* Edit button for Owner / Seller */}
              {isOwner && !isEditingServiceNotes && (
                <button
                  type="button"
                  onClick={() => setIsEditingServiceNotes(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{serviceNotesText.trim() ? 'تعديل ملاحظات الخدمة' : 'إضافة ملاحظات الخدمة'}</span>
                </button>
              )}
            </div>

            {/* Saved Notice */}
            {serviceNotesSavedNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>تم حفظ وتحديث ملاحظات الصيانة الدورية بنجاح في سجل الإعلان!</span>
              </div>
            )}

            {/* Interactive Editor (When editing by seller) */}
            {isEditingServiceNotes ? (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-amber-200 animate-in fade-in">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    أدخل تفاصيل الصيانة الدورية وقطع الغيار المستبدلة:
                  </label>
                  <textarea
                    rows={3}
                    value={serviceNotesText}
                    onChange={(e) => setServiceNotesText(e.target.value)}
                    placeholder="اكتب تفاصيل الصيانة الدورية، مثل: تاريخ آخر تبديل زيت وفلاتر، فحص الهيدروليك، حالة الإطارات أو الجنزير، فحص الفرامل..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-900 leading-relaxed"
                  />
                </div>

                {/* Quick Presets for Rapid Entry */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-bold ml-1">إضافة سريعة:</span>
                  {[
                    'تبديل زيت المحرك وفلاتر الديزل الأصلية حديثاً',
                    'صيانة شاملة لمضخة الهيدروليك والوصلات',
                    'فحص دوزان ومكابح الآلية في كراج معتمد',
                    'إطارات/جنزير جديد بحالة المصنع',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setServiceNotesText((prev) =>
                          prev.trim() ? `${prev.trim()} · ${preset}` : preset
                        );
                      }}
                      className="text-[10px] bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                {/* Editor Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceNotesText(listing.serviceNotes || '');
                      setIsEditingServiceNotes(false);
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveServiceNotes}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ الملاحظات في الإعلان</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <div>
                {serviceNotesText.trim() ? (
                  <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-3.5 space-y-2">
                    <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                      {serviceNotesText}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/40 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                        <Check className="w-3 h-3 text-emerald-600" />
                        سجل صيانة موثق ومقدم من المالك مباشرة
                      </span>
                      <span className="font-medium text-slate-400">سجل الصيانة الدورية</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400 space-y-1.5">
                    <p className="text-xs font-medium text-slate-600">
                      لم يتم تدوين ملاحظات صيانة دورية خاصة بهذه الآلية بعد.
                    </p>
                    {isOwner ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => setIsEditingServiceNotes(true)}
                          className="mt-1 px-3.5 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>أضف تفاصيل الصيانة وتغيير الزيوت الآن</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 block">
                        يمكنك الاستفسار من البائع عبر الشات المحمي، أو طلب فحص الكراج المعتمد قبل الشراء.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Inspection Section Banner */}
          <div className="rounded-2xl p-4 border transition-colors bg-gradient-to-r from-emerald-50/70 to-slate-50 border-emerald-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>فحص الكراجات المعتمدة</span>
                    {listing.inspectionStatus === 'inspected' && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">
                        مفحوصة ومعتمدة
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {listing.inspectionStatus === 'inspected' && listing.inspectionBadge
                      ? `تم الفحص في "${listing.inspectionBadge.garageName}" بتاريخ ${listing.inspectionBadge.inspectionDate} بنتيجة (${listing.inspectionBadge.score}/100)`
                      : 'احمِ نفسك واطلب فحص الآلية ميكانيكياً وهيدروليكياً في كراج معتمد بالسويداء أو الكفر قبل إتمام الشراء.'}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {listing.inspectionStatus === 'inspected' && listing.inspectionBadge ? (
                  <button
                    onClick={() => onViewReport(listing.inspectionBadge!.reportId)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>عرض التقرير الرقمي المقفل</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onRequestInspection(listing)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>افحص قبل الشراء</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Field Inspection Appointment Scheduling Banner */}
          <div className="rounded-2xl p-3.5 border border-amber-200 bg-amber-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  حجز موعد معاينة ميدانية للآلية
                </h4>
                <p className="text-[11px] text-slate-600">
                  نسّق موعداً ميدانياً لمعاينة المعدة وتشغيلها على أرض الواقع في السويداء أو الكفر بحضور خبير.
                </p>
              </div>
            </div>

            {onBookAppointment && (
              <button
                type="button"
                onClick={() => onBookAppointment(listing)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>حجز موعد معاينة</span>
              </button>
            )}
          </div>

          {/* GPS Tracking Live Status Card (for heavy machinery / rentals / enabled listings) */}
          {(listing.gpsTrackingEnabled || listing.category === 'heavy_machinery' || listing.category === 'excavators' || listing.operation === 'rent') && (
            <div className="rounded-2xl p-4 border border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        حالة جهاز التتبع المباشر (GPS Telematics)
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        بث حي متصل
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      مراقبة موقع وساعات تشغيل الآلية لحماية المالك والمستأجر وضمان شروط العقد في السويداء والكفر.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">رقم الجهاز المعتمد:</span>
                  <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded-md border border-blue-200">
                    {listing.gpsDeviceId || 'GPS-SWD-8821-KOM'}
                  </span>
                </div>
              </div>

              {/* Telemetry Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-2 border-t border-blue-100">
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100/80">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span>مستوى البطارية</span>
                    <Battery className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="font-bold text-slate-900 font-mono text-xs">
                    {listing.gpsBatteryLevel || 94}% (مشحون)
                  </span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100/80">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span>آخر إشارة بث</span>
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="font-bold text-slate-900 text-xs">
                    {listing.gpsLastPing || 'منذ دقيقتين'}
                  </span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100/80">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span>الإحداثيات الحالية</span>
                    <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="font-bold text-slate-900 font-mono text-[11px]" dir="ltr">
                    {listing.gpsCoordinates ? `${listing.gpsCoordinates.lat.toFixed(3)}, ${listing.gpsCoordinates.lng.toFixed(3)}` : '32.709° N, 36.566° E'}
                  </span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100/80">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                    <span>النطاق الجغرافي</span>
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="font-bold text-slate-900 text-xs truncate block">
                    {listing.locationDetails || 'الكفر - السهل الغربي'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Seller / Lessor Contact & Escrow Protection Notice */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                  {listing.sellerName.slice(0, 1)}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{listing.sellerName}</span>
                  <span className="text-[11px] text-slate-500">تقييم البائع: {listing.sellerRating} ★</span>
                </div>
              </div>

              {/* Phone Protected Badge */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>رقم الهاتف: 09••••••••</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed bg-amber-50/50 border border-amber-200/50 rounded-xl p-3">
              🔒 <strong>ضمان حقك وحمايتك:</strong> يُحجب رقم هاتف البائع لمنع الاحتيال وضمان إسكرو المنصة. بعد توقيع العقد الإلكتروني ودفع العربون لدى أقرب وكيل دفع معتمد في الكفر أو السويداء، يُكشف رقم الهاتف فورياً وتُسلَّم الآلية رسمياً.
            </p>
          </div>

          {/* In-App Protected Chat Simulation */}
          <div className="border border-slate-200 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>المحادثة الآمنة مع صاحب الإعلان</span>
              <span className="text-[10px] text-slate-400">تصفية وحماية الأرقام مفعلة تلقائياً</span>
            </h4>

            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl text-xs">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`p-2.5 rounded-lg ${msg.sender.includes('النظام') ? 'bg-amber-50/80 border border-amber-200/60 text-slate-700' : 'bg-white border border-slate-200'}`}>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold text-slate-700">{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{msg.text}</p>
                  {msg.wasRedacted && (
                    <span className="text-[10px] text-amber-700 font-medium block mt-1">
                      ⚠️ تم حجب رقم الهاتف تلقائياً لحماية الطرفين
                    </span>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="اكتب استفسارك للبائع (جرب كتابة رقم هاتف لرؤية التصفية التلقائية)..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Sticky Bottom Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => onPromoteListing(listing)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>ترويج الإعلان في الصدارة</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              إغلاق
            </button>

            <button
              onClick={() => onStartDeal(listing)}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>بدء الصفقة وحجز العربون (إسكرو)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareListingModal
        listing={listing}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};
