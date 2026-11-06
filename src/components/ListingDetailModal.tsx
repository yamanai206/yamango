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
  Share2,
  Trash2,
  EyeOff,
  PlayCircle,
  AlertCircle,
  Loader2
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
  onUpdateStatus?: (listingId: string, status: Listing['status']) => Promise<boolean>;
  onDeleteListing?: (listingId: string) => Promise<boolean>;
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
  onUpdateStatus,
  onDeleteListing,
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

  // Admin/Owner Actions State
  const [isActionLoading, setIsActionLoading] = useState(false);

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

  const isOwner = listing.userId === currentUser.id || currentUser.roles.includes('admin');

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

  // إدارة حالة الإعلان (توقيف / تفعيل / حذف)
  const handleToggleStatus = async () => {
    if (!onUpdateStatus) return;
    setIsActionLoading(true);
    const newStatus = listing.status === 'active' ? 'paused' : 'active';
    const success = await onUpdateStatus(listing.id, newStatus);
    if (success) {
      listing.status = newStatus;
      onClose(); // إغلاق النافذة بعد التحديث بنجاح
    }
    setIsActionLoading(false);
  };

  const handleDelete = async () => {
    if (!onDeleteListing) return;
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setIsActionLoading(true);
      const success = await onDeleteListing(listing.id);
      if (success) {
        onClose();
      }
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-orange-100 text-orange-800">
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
            {/* شارة حالة الإعلان - تظهر فقط للمالك أو المدير */}
            {isOwner && (
              <>
                {listing.status === 'pending_approval' && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> قيد المراجعة
                  </span>
                )}
                {listing.status === 'paused' && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
                    <EyeOff className="w-3.5 h-3.5" /> موقوف / مخفي
                  </span>
                )}
                {listing.status === 'active' && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> نشط
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-900 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="مشاركة رابط الإعلان"
            >
              <Share2 className="w-3.5 h-3.5 text-orange-600" />
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
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
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
                  <div className="absolute top-3 right-3 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow-sm flex items-center gap-1">
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

              {/* Thumbnails row */}
              {listing.images && listing.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {listing.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activeImageIndex === idx ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <VehicleImage src={img} alt={`معاينة ${idx + 1}`} category={listing.category} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Specs & Price */}
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2 leading-snug">
                  {listing.title}
                </h2>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                  <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="font-medium">{listing.locationDetails}</span>
                </div>

                {/* Price Display */}
                <div className="bg-orange-50/70 border border-orange-200/60 rounded-2xl p-4 mb-4">
                  <span className="text-xs text-orange-800 font-medium block mb-1">
                    {listing.operation === 'sale' ? 'السعر المطلوب:' : 'بدل الإيجار:'}
                  </span>
                  <div className="text-2xl font-black text-slate-900 tabular-nums">
                    {listing.priceAmount.toLocaleString()}{' '}
                    <span className="text-sm font-bold text-orange-700">
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
                <div className="bg-orange-50/70 rounded-xl p-3 border border-orange-200/80">
                  <span className="text-orange-800 font-semibold block mb-1">النوع الفرعي</span>
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

          {/* Service & Periodic Maintenance Notes Card */}
          <div className="rounded-2xl p-4 border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      ملاحظات الخدمة والصيانة الدورية
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

              {isOwner && !isEditingServiceNotes && (
                <button
                  type="button"
                  onClick={() => setIsEditingServiceNotes(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{serviceNotesText.trim() ? 'تعديل' : 'إضافة'}</span>
                </button>
              )}
            </div>

            {serviceNotesSavedNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>تم حفظ وتحديث ملاحظات الصيانة بنجاح!</span>
              </div>
            )}

            {isEditingServiceNotes ? (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-orange-200 animate-in fade-in">
                <textarea
                  rows={3}
                  value={serviceNotesText}
                  onChange={(e) => setServiceNotesText(e.target.value)}
                  placeholder="اكتب تفاصيل الصيانة الدورية..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:border-orange-500 text-slate-900"
                />
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200">
                  <button type="button" onClick={() => { setServiceNotesText(listing.serviceNotes || ''); setIsEditingServiceNotes(false); }} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">إلغاء</button>
                  <button type="button" onClick={handleSaveServiceNotes} className="px-4 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> حفظ</button>
                </div>
              </div>
            ) : (
              <div>
                {serviceNotesText.trim() ? (
                  <div className="bg-orange-50/50 border border-orange-200/70 rounded-xl p-3.5 space-y-2">
                    <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">{serviceNotesText}</p>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400 space-y-1.5">
                    <p className="text-xs font-medium text-slate-600">لم يتم تدوين ملاحظات صيانة بعد.</p>
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
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">مفحوصة ومعتمدة</span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {listing.inspectionStatus === 'inspected' && listing.inspectionBadge
                      ? `تم الفحص في "${listing.inspectionBadge.garageName}" بتاريخ ${listing.inspectionBadge.inspectionDate} بنتيجة (${listing.inspectionBadge.score}/100)`
                      : 'احمِ نفسك واطلب فحص الآلية ميكانيكياً وهيدروليكياً في كراج معتمد قبل إتمام الشراء.'}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {listing.inspectionStatus === 'inspected' && listing.inspectionBadge ? (
                  <button onClick={() => onViewReport(listing.inspectionBadge!.reportId)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors">
                    <FileText className="w-4 h-4" /> عرض التقرير
                  </button>
                ) : (
                  <button onClick={() => onRequestInspection(listing)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs">
                    <Wrench className="w-4 h-4" /> افحص قبل الشراء
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* GPS Tracking Live Status Card */}
          {(listing.gpsTrackingEnabled || listing.category === 'heavy_machinery' || listing.category === 'excavators' || listing.operation === 'rent') && (
            <div className="rounded-2xl p-4 border border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">حالة جهاز التتبع المباشر (GPS)</h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> بث حي متصل
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">رقم الجهاز:</span>
                  <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded-md border border-blue-200">
                    {listing.gpsDeviceId || 'GPS-SWD-8821-KOM'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-2 border-t border-blue-100">
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100/80">
                  <span className="text-slate-400 text-[10px] block mb-1">مستوى البطارية</span>
                  <span className="font-bold text-slate-900 font-mono text-xs">{listing.gpsBatteryLevel || 94}%</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100/80">
                  <span className="text-slate-400 text-[10px] block mb-1">آخر إشارة</span>
                  <span className="font-bold text-slate-900 text-xs">{listing.gpsLastPing || 'منذ دقيقتين'}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100/80">
                  <span className="text-slate-400 text-[10px] block mb-1">الإحداثيات</span>
                  <span className="font-bold text-slate-900 font-mono text-[11px]" dir="ltr">
                    {listing.gpsCoordinates ? `${listing.gpsCoordinates.lat.toFixed(3)}, ${listing.gpsCoordinates.lng.toFixed(3)}` : '32.709° N, 36.566° E'}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100/80">
                  <span className="text-slate-400 text-[10px] block mb-1">النطاق الجغرافي</span>
                  <span className="font-bold text-slate-900 text-xs truncate block">{listing.locationDetails}</span>
                </div>
              </div>
            </div>
          )}

          {/* In-App Protected Chat Simulation */}
          <div className="border border-slate-200 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>المحادثة الآمنة مع صاحب الإعلان</span>
              <span className="text-[10px] text-slate-400">حماية الأرقام مفعلة</span>
            </h4>
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl text-xs">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`p-2.5 rounded-lg ${msg.sender.includes('النظام') ? 'bg-orange-50/80 border border-orange-200/60 text-slate-700' : 'bg-white border border-slate-200'}`}>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold text-slate-700">{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{msg.text}</p>
                  {msg.wasRedacted && (
                    <span className="text-[10px] text-orange-700 font-medium block mt-1">⚠️ تم حجب رقم الهاتف تلقائياً</span>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="اكتب استفسارك للبائع..." className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none" />
              <button type="submit" className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0">
                <Send className="w-3.5 h-3.5" /> إرسال
              </button>
            </form>
          </div>
        </div>

        {/* Modal Sticky Bottom Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          
          {/* Owner Actions (Left Side) */}
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                {listing.status === 'active' && onUpdateStatus && (
                  <button
                    onClick={handleToggleStatus}
                    disabled={isActionLoading}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                    title="إخفاء الإعلان مؤقتاً"
                  >
                    <EyeOff className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">توقيف / إخفاء</span>
                  </button>
                )}
                
                {listing.status === 'paused' && onUpdateStatus && (
                  <button
                    onClick={handleToggleStatus}
                    disabled={isActionLoading}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-xl transition-colors disabled:opacity-50"
                    title="إعادة تفعيل الإعلان"
                  >
                    <PlayCircle className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">إعادة تفعيل</span>
                  </button>
                )}

                {onDeleteListing && (
                  <button
                    onClick={handleDelete}
                    disabled={isActionLoading}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-300 hover:bg-rose-100 rounded-xl transition-colors disabled:opacity-50"
                    title="حذف الإعلان نهائياً"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span className="hidden sm:inline">حذف</span>
                  </button>
                )}

                {!listing.isPromoted && onPromoteListing && (
                  <button
                    onClick={() => onPromoteListing(listing)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-900 bg-orange-100 hover:bg-orange-200 rounded-xl transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <span className="hidden sm:inline">ترويج</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Buyer Actions (Right Side) */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              إغلاق
            </button>

            {/* زر بدء الصفقة لا يظهر لصاحب الإعلان */}
            {!isOwner && listing.status === 'active' && (
              <button
                onClick={() => onStartDeal(listing)}
                className="flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>بدء الصفقة وحجز العربون</span>
              </button>
            )}
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