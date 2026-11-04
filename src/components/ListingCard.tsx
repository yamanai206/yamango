import React, { useState } from 'react';
import { Listing } from '../types';
import { VehicleImage } from './VehicleImage';
import { Sparkles, MapPin, Gauge, ShieldCheck, ArrowUpRight, Camera, Share2, Copy, Check } from 'lucide-react';
import { ShareListingModal } from './ShareListingModal';
import { generateListingDynamicUrl, copyToClipboard } from '../utils/shareListing';

interface ListingCardProps {
  listing: Listing;
  onSelect: (listing: Listing) => void;
  onPromoteClick?: (listing: Listing) => void;
  isOwner?: boolean;
  distanceKm?: number;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onSelect,
  onPromoteClick,
  isOwner,
  distanceKm,
}) => {
  const isPromoted = listing.isPromoted;
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const dynamicUrl = generateListingDynamicUrl(listing.id);
    const success = await copyToClipboard(dynamicUrl);
    if (success) {
      setIsCopied(true);
      setToastMessage('تم نسخ رابط الإعلان بنجاح!');
      setTimeout(() => {
        setIsCopied(false);
      }, 2500);
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    } else {
      setToastMessage('تعذر نسخ الرابط تلقائياً');
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  };

  const zoneArabicName = {
    al_kafr: 'بلدة الكفر',
    suwayda: 'السويداء',
    shahba: 'شهبا',
    salkhad: 'صلخد',
    al_qurayya: 'القريّا',
    ariqa: 'عريقة',
    mazraa: 'المزرعة',
  }[listing.zone] || listing.zone;

  const categoryArabicName = {
    tractors: 'جرار زراعي',
    excavators: 'حفارة ومعدات',
    cars: 'سيارة سياحية',
    trucks: 'شاحنة نقل',
    agricultural: 'معدة زراعية',
    heavy_machinery: 'آلية ثقيلة',
  }[listing.category] || listing.category;

  return (
    <article
      onClick={() => onSelect(listing)}
      className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${
        isPromoted
          ? 'bg-gradient-to-b from-amber-50/60 to-white border-2 border-amber-500/30 hover:border-amber-500 hover:shadow-md'
          : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Toast Notification upon Link Copy */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-3 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 bg-slate-900/95 text-white text-xs font-semibold rounded-full shadow-lg border border-slate-700/60 backdrop-blur-md flex items-center gap-2 pointer-events-none transition-all animate-fade-in"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Promoted Top Strip if Active */}
      {isPromoted && (
        <div className="bg-amber-600 text-white text-[11px] font-semibold px-3 py-1 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>إعلان مروّج ومتصدّر في {listing.promotionScope === 'al_kafr_only' ? 'الكفر' : 'السويداء'}</span>
          </span>
          <span className="text-[10px] opacity-85">أولوية الظهور</span>
        </div>
      )}

      {/* Image Container with Fallback */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
        <VehicleImage
          src={listing.images && listing.images.length > 0 ? listing.images[0] : undefined}
          alt={listing.title}
          category={listing.category}
          showVerifiedBadge={true}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
        />

        {/* Operation Indicator (Sale vs Rent) */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md backdrop-blur-md shadow-xs ${
            listing.operation === 'sale'
              ? 'bg-slate-900/90 text-white'
              : 'bg-emerald-800/90 text-white'
          }`}>
            {listing.operation === 'sale' ? 'للبيع القطعي' : 'للإيجار'}
          </span>
        </div>

        {/* Multi-Photo Counter if multiple images uploaded */}
        {listing.images && listing.images.length > 1 && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-950/80 text-white shadow-xs border border-white/20 backdrop-blur-xs flex items-center gap-1">
              <Camera className="w-3 h-3 text-amber-400" />
              <span>{listing.images.length} صور</span>
            </span>
          </div>
        )}

        {/* Service Notes Indicator Badge */}
        {listing.serviceNotes && (
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white/90 text-slate-800 shadow-xs border border-slate-200 backdrop-blur-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              سجل صيانة
            </span>
          </div>
        )}

        {/* Inspection Badge Overlay */}
        {listing.inspectionStatus === 'inspected' && listing.inspectionBadge && (
          <div className="absolute bottom-2.5 right-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-700/90 text-white text-xs font-medium backdrop-blur-md shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>مفحوصة ({listing.inspectionBadge.score}/100)</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Metadata Row: Category & Sub-category · Model Year · Zone */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium">
            <span className="font-bold text-slate-800">{categoryArabicName}</span>
            {listing.subCategory && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80">
                {listing.subCategory}
              </span>
            )}
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>موديل {listing.year}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{zoneArabicName}</span>
            </span>
            {typeof distanceKm === 'number' && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200">
                  <span>يبعد:</span>
                  <span>{distanceKm < 1 ? `${Math.round(distanceKm * 1000)} م` : `${distanceKm.toLocaleString('ar-SY')} كم`}</span>
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug">
            {listing.title}
          </h3>
        </div>

        {/* Specs and Price Footers */}
        <div>
          {/* Metric Row (Mileage or Work Hours) */}
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2.5 bg-slate-50 rounded-lg px-2.5 py-1.5">
            <span className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {listing.metricType === 'work_hours' ? 'ساعات العمل:' : 'المسافة المقطوعة:'}
              </span>
            </span>
            <span className="font-semibold text-slate-800 tabular-nums font-mono">
              {listing.metricValue.toLocaleString()}{' '}
              {listing.metricType === 'work_hours' ? 'ساعة' : 'كم'}
            </span>
          </div>

          {/* Price and CTA */}
          <div className="flex items-end justify-between border-t border-slate-100 pt-3">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                {listing.operation === 'sale' ? 'السعر المطلوب:' : `بدل الإيجار (لكل ${listing.rentRateUnit === 'hour' ? 'ساعة' : 'يوم'}):`}
              </span>
              <div className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">
                {listing.priceAmount.toLocaleString()}{' '}
                <span className="text-xs font-semibold text-amber-700">
                  {listing.currency === 'USD' ? 'دولار ($)' : 'ل.س'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Direct Copy to Clipboard Button (CSS selector: .listing-card-share-button) */}
              <button
                type="button"
                data-testid={`share-button-${listing.id}`}
                onClick={handleCopyLink}
                className="listing-card-share-button px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200/90 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                title="نسخ الرابط المباشر للإعلان إلى الحافظة"
                aria-label={`نسخ رابط إعلان ${listing.title}`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>نسخ الرابط</span>
                  </>
                )}
              </button>

              {/* Alternative: Share via WhatsApp & Social Channels */}
              <button
                type="button"
                data-testid={`whatsapp-share-button-${listing.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareModalOpen(true);
                }}
                className="px-2 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="مشاركة الإعلان عبر واتساب أو خيارات إضافية"
                aria-label={`مشاركة إعلان ${listing.title} عبر واتساب`}
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">واتساب</span>
              </button>

              {isOwner && !isPromoted && onPromoteClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPromoteClick(listing);
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                >
                  ترويج
                </button>
              )}
              <span className="p-1.5 text-slate-400 group-hover:text-slate-900 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareListingModal
        listing={listing}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </article>
  );
};
