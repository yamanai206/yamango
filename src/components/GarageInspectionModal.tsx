import React, { useState } from 'react';
import { GarageProfile, Listing } from '../types';
import { X, ShieldCheck, Calendar, Clock, DollarSign, CheckCircle2, Loader2 } from 'lucide-react';

interface GarageInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing?: Listing | null;
  selectedGarage?: GarageProfile | null;
  garages: GarageProfile[];
  onRequestInspection: (listingId: string, garageId: string, requestedDate: string) => Promise<any>;
}

export const GarageInspectionModal: React.FC<GarageInspectionModalProps> = ({
  isOpen,
  onClose,
  listing,
  selectedGarage,
  garages,
  onRequestInspection,
}) => {
  const [targetGarageId, setTargetGarageId] = useState(selectedGarage?.id || garages[0]?.id || '');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !listing) return null;

  const currentGarage = garages.find((g) => g.id === targetGarageId) || garages[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetGarageId) {
      alert("يرجى اختيار كراج أولاً");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onRequestInspection(listing.id, targetGarageId, appointmentDate);
      if (res) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      // الأخطاء يتم التعامل معها في المتجر (Store) عبر التنبيه
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                طلب فحص فني قبل الشراء
              </h3>
              <span className="text-slate-500">{listing.title}</span>
            </div>
          </div>

          <button onClick={onClose} disabled={isSubmitting} className="p-1 rounded-full text-slate-400 hover:text-slate-700 disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Garage selection */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">اختر الكراج المعتمد:</label>
            <select
              value={targetGarageId}
              onChange={(e) => setTargetGarageId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              disabled={isSubmitting}
            >
              {garages.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.businessName} ({g.zone === 'al_kafr' ? 'الكفر' : 'السويداء'}) - تقييم {g.ratingAvg}★
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">موعد الفحص المقترح:</label>
            <input
              type="date"
              required
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              disabled={isSubmitting}
            />
          </div>

          {/* Fee card */}
          {currentGarage && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
              <span className="text-emerald-900 font-bold block mb-1">رسم الفحص الشامل:</span>
              <div className="text-lg font-black text-slate-900 tabular-nums">
                {currentGarage.inspectionFeeSYP.toLocaleString()} ليرة سورية{' '}
                <span className="text-xs font-semibold text-emerald-800">
                  (أو ${currentGarage.inspectionFeeUSD})
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                يشمل فحص المحرك، القير، ضغط الهيدروليك، الشاسيه، وفحص الحوادث، وإصدار تقرير رقمي مقفل يُرفق بالإعلان.
              </p>
            </div>
          )}

          {isSuccess ? (
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-center font-bold">
              ✓ تم إرسال طلب الفحص بنجاح! سيتم إخطار البائع والكراج فورياً لتنسيق المعاينة.
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 min-w-[140px] justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'جارٍ الحجز...' : 'تأكيد حجز موعد الفحص'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};