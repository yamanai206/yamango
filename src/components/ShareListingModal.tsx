import React, { useState, useMemo } from 'react';
import { Listing } from '../types';
import { 
  generateListingDynamicUrl, 
  buildListingShareMessage, 
  buildWhatsAppShareUrl, 
  copyToClipboard 
} from '../utils/shareListing';
import { VehicleImage } from './VehicleImage';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  MessageCircle, 
  Send, 
  ExternalLink, 
  MapPin, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface ShareListingModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareListingModal: React.FC<ShareListingModalProps> = ({
  listing,
  isOpen,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFullText, setCopiedFullText] = useState(false);

  // Generate dynamic URL & formatted message
  const shareUrl = useMemo(() => {
    if (!listing) return '';
    return generateListingDynamicUrl(listing.id);
  }, [listing]);

  const shareMessage = useMemo(() => {
    if (!listing || !shareUrl) return '';
    return buildListingShareMessage(listing, shareUrl);
  }, [listing, shareUrl]);

  if (!isOpen || !listing) return null;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleCopyFullText = async () => {
    const success = await copyToClipboard(shareMessage);
    if (success) {
      setCopiedFullText(true);
      setTimeout(() => setCopiedFullText(false), 3000);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = buildWhatsAppShareUrl(shareMessage);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `معاينة ${listing.title} على منصة yamango للوساطة والآليات في السويداء`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback silently
        console.log('Native share closed/cancelled:', err);
      }
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">مشاركة الإعلان والرابط المباشر</h3>
              <p className="text-[11px] text-slate-300">توليد ومشاركة رابط ديناميكي مباشر للآلية</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Card Preview */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-200 border border-slate-300 relative">
              <VehicleImage
                src={listing.images && listing.images.length > 0 ? listing.images[0] : undefined}
                alt={listing.title}
                category={listing.category}
                className="w-full h-full object-cover"
              />
              {listing.inspectionStatus === 'inspected' && (
                <div className="absolute bottom-1 right-1 p-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate mb-1">
                {listing.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>{listing.zone === 'al_kafr' ? 'بلدة الكفر' : 'محافظة السويداء'}</span>
                </span>
                <span>·</span>
                <span>موديل {listing.year}</span>
              </div>
              <div className="text-xs font-bold text-amber-700">
                {listing.priceAmount.toLocaleString()} {listing.currency === 'USD' ? 'دولار ($)' : 'ل.س'}
                <span className="text-[10px] font-normal text-slate-400 mr-1.5">
                  ({listing.operation === 'sale' ? 'بيع قطعي' : 'تأجير'})
                </span>
              </div>
            </div>
          </div>

          {/* Copy Feedback Alert */}
          {copiedLink && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم نسخ الرابط المباشر إلى الحافظة بنجاح! جاهز للمشاركة واللصق.</span>
            </div>
          )}

          {copiedFullText && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم نسخ النص والتفاصيل الكاملة مع الرابط بنجاح!</span>
            </div>
          )}

          {/* Dynamic Link Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الرابط المباشر للآلية (Dynamic Link):
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full text-xs font-mono text-slate-700 bg-slate-100 border border-slate-300 rounded-xl px-3 py-2.5 ltr text-left focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
                title="نسخ الرابط"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          {/* Quick Sharing Options */}
          <div className="pt-2">
            <span className="block text-xs font-bold text-slate-700 mb-2.5">
              مشاركة سريعة عبر التطبيقات:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                <span>مشاركة عبر واتساب (WhatsApp)</span>
              </button>

              {/* Native Device Share Sheet */}
              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-amber-800" />
                  <span>مشاركة عبر تطبيقات الجهاز</span>
                </button>
              )}

              {/* Telegram Share Button */}
              <button
                type="button"
                onClick={handleTelegramShare}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#229ED9] hover:bg-[#1f8ec4] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>مشاركة عبر تيليجرام</span>
              </button>

              {/* Copy Full Message Button */}
              <button
                type="button"
                onClick={handleCopyFullText}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedFullText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>نسخ نص الإعلان كاملاً مع الرابط</span>
              </button>
            </div>
          </div>

          {/* Formatted Message Preview Accordion */}
          <div className="pt-2">
            <details className="group rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <summary className="font-bold text-slate-700 cursor-pointer list-none flex items-center justify-between select-none">
                <span>معاينة نص الرسالة التلقائية:</span>
                <span className="text-amber-700 font-normal text-[11px] group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 whitespace-pre-line text-slate-600 font-sans leading-relaxed text-[11px] bg-white p-2.5 rounded-lg border border-slate-100">
                {shareMessage}
              </div>
            </details>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">yamango · منصة وساطة الآليات في السويداء والكفر</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 font-medium cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
