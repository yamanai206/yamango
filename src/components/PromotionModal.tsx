import React, { useState } from 'react';
import { Listing, PromotionPackage } from '../types';
import { SEED_PROMOTION_PACKAGES } from '../data/seedData';
import { X, Sparkles, Check, TrendingUp, ShieldAlert, Clock, Eye } from 'lucide-react';

interface PromotionModalProps {
  listing: Listing | null;
  onClose: () => void;
  onPromote: (listingId: string, packageId: string) => boolean;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  listing,
  onClose,
  onPromote,
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState(SEED_PROMOTION_PACKAGES[1].id); // 7 days default
  const [isSuccess, setIsSuccess] = useState(false);

  if (!listing) return null;

  const handlePromote = () => {
    const success = onPromote(listing.id, selectedPkgId);
    if (success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    }
  };

  const selectedPkg = SEED_PROMOTION_PACKAGES.find((p) => p.id === selectedPkgId)!;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">ترويج الإعلان في الصدارة</h3>
              <span className="text-xs text-slate-500">
                {listing.title}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Value Prop Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-4 text-xs">
          <span className="font-bold text-amber-900 block mb-1">
            لماذا تروّج إعلانك على yamango؟
          </span>
          <p className="text-slate-700 leading-relaxed">
            الإعلانات المروجة تحظى بأول 5 مواقع ثابتة في أعلى نتائج البحث والتصفية، بإطار عنبري مميز وشارة إعلان مروّج، مع مضاعفة المشاهدات 4 مرات وزيادة عروض البيع والإيجار الجادة.
          </p>
        </div>

        {/* Packages Selector */}
        <div className="space-y-2.5 mb-5">
          <span className="text-xs font-bold text-slate-800 block">اختر باقة الترويج المناسبة:</span>
          {SEED_PROMOTION_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPkgId(pkg.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                selectedPkgId === pkg.id
                  ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <span className="font-bold text-slate-900 text-sm block">{pkg.title}</span>
                <span className="text-slate-500">{pkg.description}</span>
              </div>

              <div className="text-left shrink-0">
                <span className="font-extrabold text-slate-900 text-sm tabular-nums block">
                  {pkg.priceSYP.toLocaleString()} ل.س
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block">
                  أو ${pkg.priceUSD} فقط
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Seller Analytics Preview */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-5 text-xs">
          <span className="font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>إحصاءات الإعلان الحالية:</span>
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block">المشاهدات</span>
              <span className="font-bold text-slate-800 text-sm">{listing.viewsCount}</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block">النقرات</span>
              <span className="font-bold text-slate-800 text-sm">{listing.clicksCount}</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block">الاستفسارات</span>
              <span className="font-bold text-slate-800 text-sm">{listing.inquiriesCount}</span>
            </div>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-center text-xs font-bold">
            ✓ تم تفعيل الترويج بنجاح! إعلانك يتصدر الآن نتائج البحث في {selectedPkg.zoneScope === 'al_kafr_only' ? 'الكفر' : 'السويداء'}.
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              onClick={handlePromote}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>تفعيل الترويج وتصدر القائمة الآن</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
