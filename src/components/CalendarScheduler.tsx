import React, { useState } from 'react';
import { FieldInspectionAppointment, Listing, ZoneLocation } from '../types';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  Calendar as CalendarIcon,
  ShieldCheck,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface CalendarSchedulerProps {
  appointments: FieldInspectionAppointment[];
  onBookAppointment: (data: Omit<FieldInspectionAppointment, 'id' | 'createdAt'>) => void;
  onUpdateStatus?: (id: string, status: FieldInspectionAppointment['status'], assignedInspector?: string) => void;
  preSelectedListing?: Listing | null;
  allListings?: Listing[];
  isModal?: boolean;
  onClose?: () => void;
}

const SUWAYDA_ZONES: { id: ZoneLocation; name: string }[] = [
  { id: 'al_kafr', name: 'بلدة الكفر' },
  { id: 'suwayda', name: 'مدينة السويداء' },
  { id: 'shahba', name: 'شهبا' },
  { id: 'salkhad', name: 'صلخد' },
  { id: 'al_qurayya', name: 'القريّا' },
  { id: 'ariqa', name: 'عريقة' },
  { id: 'mazraa', name: 'المزرعة' },
];

const TIME_SLOTS = [
  '09:00 ص - 10:30 ص',
  '10:30 ص - 12:00 م',
  '12:30 م - 02:00 م',
  '02:30 م - 04:00 م',
  '04:30 م - 06:00 م',
];

export const CalendarScheduler: React.FC<CalendarSchedulerProps> = ({
  appointments,
  onBookAppointment,
  onUpdateStatus,
  preSelectedListing,
  allListings = [],
  isModal = false,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'new_booking'>('schedule');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [selectedListingId, setSelectedListingId] = useState(preSelectedListing?.id || allListings[0]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('0933');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [appointmentTime, setAppointmentTime] = useState(TIME_SLOTS[1]);
  const [locationDetails, setLocationDetails] = useState('بلدة الكفر - السهل الغربي قرب مقالع البازلت');
  const [selectedZone, setSelectedZone] = useState<ZoneLocation>('al_kafr');
  const [notes, setNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const selectedListingObj = preSelectedListing || allListings.find((l) => l.id === selectedListingId);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;

    onBookAppointment({
      listingId: selectedListingObj?.id || 'list_general',
      listingTitle: selectedListingObj?.title || 'معاينة عامة للآلية',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      appointmentDate,
      appointmentTime,
      location: locationDetails.trim(),
      zone: selectedZone,
      notes: notes.trim(),
      status: 'confirmed',
      assignedInspector: 'فريق الفحص الميداني المعتمد (السويداء والكفر)',
    });

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      if (isModal && onClose) {
        onClose();
      } else {
        setActiveTab('schedule');
      }
    }, 1800);
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((app) => {
    if (filterZone !== 'all' && app.zone !== filterZone) return false;
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        app.customerName.toLowerCase().includes(q) ||
        app.customerPhone.includes(q) ||
        app.listingTitle.toLowerCase().includes(q) ||
        app.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const content = (
    <div className="space-y-4 text-xs">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              جدولة مواعيد المعاينة الميدانية للآليات
            </h3>
            <p className="text-[11px] text-slate-500">
              حجز وتنسيق جولات فحص المعدات الثقيلة والجرارات في أراضي الكفر ومحافظة السويداء
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              activeTab === 'schedule'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جدول المواعيد ({appointments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new_booking')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1 ${
              activeTab === 'new_booking'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>حجز موعد جديد</span>
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {bookingSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold block">تم تسجيل وتأكيد موعد المعاينة الميدانية بنجاح!</span>
            <span className="text-[11px] text-emerald-700">
              تم إرسال تفاصيل الموعد واسم الفاحص المكلف للطرفين.
            </span>
          </div>
        </div>
      )}

      {/* TAB 1: SCHEDULE VIEW */}
      {activeTab === 'schedule' && (
        <div className="space-y-3">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none"
              >
                <option value="all">كل الحالات</option>
                <option value="confirmed">المؤكدة</option>
                <option value="pending">قيد الانتظار</option>
                <option value="completed">المكتملة</option>
                <option value="cancelled">الملغاة</option>
              </select>

              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none"
              >
                <option value="all">كافة المناطق</option>
                {SUWAYDA_ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم العميل، الهاتف، الآلية..."
                className="w-full pr-8 pl-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Appointments List */}
          {filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">لا توجد مواعيد معاينة مسجلة بهذه المعايير.</p>
              <button
                type="button"
                onClick={() => setActiveTab('new_booking')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>حجز موعد جديد الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAppointments.map((app) => {
                const isConfirmed = app.status === 'confirmed';
                const isPending = app.status === 'pending';
                const isCompleted = app.status === 'completed';

                return (
                  <div
                    key={app.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-amber-300 transition-all shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-black text-slate-900 text-xs block line-clamp-1">
                          {app.listingTitle}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-800">{app.customerName}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600" dir="ltr">
                            {app.customerPhone}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isCompleted
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isConfirmed && 'مؤكد'}
                        {isPending && 'قيد الانتظار'}
                        {isCompleted && 'مكتمل'}
                        {app.status === 'cancelled' && 'ملغى'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <CalendarDays className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{app.appointmentDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{app.appointmentTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{app.location}</span>
                      </div>
                    </div>

                    {app.notes && (
                      <p className="text-[11px] text-slate-500 bg-amber-50/40 p-2 rounded-lg border border-amber-100/60 leading-relaxed">
                        📝 {app.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">
                        الفاحص: <strong className="text-slate-700">{app.assignedInspector || 'لم يحدد'}</strong>
                      </span>

                      {onUpdateStatus && (
                        <div className="flex items-center gap-1">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(app.id, 'confirmed')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-bold text-[10px]"
                            >
                              تأكيد
                            </button>
                          )}
                          {isConfirmed && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(app.id, 'completed')}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-bold text-[10px]"
                            >
                              تم الفحص
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NEW BOOKING FORM */}
      {activeTab === 'new_booking' && (
        <form onSubmit={handleBookingSubmit} className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Listing Selection */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-800 block mb-1">
                الآلية أو المركبة المطلوب معاينتها ميدانياً:
              </label>
              {preSelectedListing ? (
                <div className="p-2.5 bg-white border border-amber-300 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-slate-900">{preSelectedListing.title}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                    #{preSelectedListing.id.slice(-6)}
                  </span>
                </div>
              ) : (
                <select
                  value={selectedListingId}
                  onChange={(e) => setSelectedListingId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                >
                  {allListings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} ({l.year} - {l.priceAmount.toLocaleString()} {l.currency})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                اسم طالب المعاينة / المشتري:
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="مثال: بهاء الدين مرشد"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                رقم الهاتف (سيريتل / إم تي إن):
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0933XXXXXX"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-right focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                تاريخ المعاينة المطلوب:
              </label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Time Slot */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                الفترة الزمنية المفضلة:
              </label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                المنطقة / البلدة في المحافظة:
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value as ZoneLocation)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              >
                {SUWAYDA_ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Details */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                تفاصيل موقع المعاينة الميداني:
              </label>
              <input
                type="text"
                required
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="مثال: الكفر - قرب الكرم الجنوبي أو ساحة البلدية"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-800 block mb-1">
                ملاحظات الفحص والتشغيل التجريبي:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات خاصة مثل فحص الهيدروليك، تجربة الجنزير، أو معاينة مضخة الوقود..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
              >
                إلغاء
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد حجز الموعد الميداني</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
        <div className="relative bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      {content}
    </div>
  );
};
