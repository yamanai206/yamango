import React, { useState } from 'react';
import { Listing, User, Deal } from '../types';
import { calculateEscrowCommission } from '../utils/escrow';
import { X, ShieldCheck, CheckCircle2, Lock, FileText, Banknote, Radio, Loader2 } from 'lucide-react';

interface StartDealModalProps {
  listing: Listing | null;
  onClose: () => void;
  currentUser: User;
  onConfirmDeal: (listingId: string, offerPrice: number) => Promise<Deal | null>;
  onDealCreated: (deal: Deal) => void;
}

export const StartDealModal: React.FC<StartDealModalProps> = ({
  listing,
  onClose,
  currentUser,
  onConfirmDeal,
  onDealCreated,
}) => {
  const [offerPrice, setOfferPrice] = useState(listing?.priceAmount || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!listing) return null;

  const calc = calculateEscrowCommission(
    offerPrice,
    listing.currency,
    listing.operation,
    currentUser.dealsCompletedCount
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const deal = await onConfirmDeal(listing.id, offerPrice);
      if (deal) {
        onDealCreated(deal);
        onClose();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                بدء صفقة وساطة إلكترونية مضمونة
              </h3>
              <span className="text-slate-500">{listing.title}</span>
            </div>
          </div>

          <button onClick={onClose} disabled={isSubmitting} className="p-1 rounded-full text-slate-400 hover:text-slate-700 disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Price input */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="font-bold text-slate-800 block mb-1">
              مبلغ العرض المتفق عليه ({listing.currency}):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                required
                min="1000"
                value={offerPrice}
                onChange={(e) => setOfferPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-extrabold text-slate-900 tabular-nums"
              />
              <span className="font-bold text-orange-700 text-sm whitespace-nowrap">
                {listing.currency}
              </span>
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="space-y-2 bg-orange-50/70 border border-orange-200 rounded-2xl p-4">
            <div className="flex justify-between items-center text-slate-700">
              <span>عربون الإسكرو المطلوب إيداعه لدى الوكيل (10%):</span>
              <strong className="text-orange-900 font-mono font-bold text-sm">
                {calc.depositRequired.toLocaleString()} {listing.currency}
              </strong>
            </div>

            <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-orange-200/60">
              <span>عمولة منصة yamango ({(calc.commissionRate * 100).toFixed(1)}%):</span>
              <span className="font-mono">{calc.commissionAmount.toLocaleString()} {listing.currency}</span>
            </div>

            <div className="flex justify-between items-center text-slate-900 font-bold pt-1 border-t border-orange-200/60">
              <span>صافي المستحق للبائع عند الاستلام:</span>
              <span className="font-mono text-emerald-800 font-bold">
                {calc.sellerNetPayout.toLocaleString()} {listing.currency}
              </span>
            </div>
          </div>

          {/* GPS Tracking Contract Clause Notice */}
          {listing.gpsTrackingEnabled && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-blue-900 text-xs">
              <span className="p-1 bg-blue-200 text-blue-800 rounded-lg shrink-0 mt-0.5">
                <Radio className="w-4 h-4 animate-pulse" />
              </span>
              <div>
                <span className="font-bold block">توثيق جهاز تتبع GPS في العقد:</span>
                <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                  هذه الآلية مجهزة بجهاز تتبع رقم (<strong className="font-mono">{listing.gpsDeviceId || 'GPS-SWD-942'}</strong>). سيتم تسجيل رقم الجهاز وشروطه رسمياً في العقد الإلكتروني لحماية الطرفين أثناء فترة التشغيل أو الإيجار.
                </p>
              </div>
            </div>
          )}

          {/* Trust notice */}
          <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
            📌 <strong>ماذا يحدث بعد النقر؟</strong> سيتم إنشاء عقد إلكتروني موحد فوري، وتوليد <strong>رمز سري (Secret OTP)</strong> خاص بك تتوجه به لأي وكيل دفع معتمد في بلدة الكفر أو السويداء لتسليم العربون وبدء معاينة الآلية.
          </p>

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
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ إنشاء العقد...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد وإنشاء العقد</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};