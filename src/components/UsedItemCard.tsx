import React, { useState } from 'react';
import { UsedItem, User } from '../types';
import { 
  USED_CATEGORY_LABELS, 
  USED_CONDITION_CONFIG, 
  formatUsedItemPrice, 
  calculateUsedItemCommission 
} from '../utils/usedGoods';
import { 
  MapPin, 
  ShieldCheck, 
  Building, 
  Copy, 
  Check, 
  MessageCircle, 
  ShoppingBag, 
  Tag, 
  Layers, 
  Clock, 
  Trash2,
  Share2,
  PackageCheck
} from 'lucide-react';
import { copyToClipboard } from '../utils/shareListing';

interface UsedItemCardProps {
  item: UsedItem;
  currentUser: User;
  onBuyClick: (item: UsedItem) => void;
  onDeleteClick?: (itemId: string) => void;
}

export const UsedItemCard: React.FC<UsedItemCardProps> = ({
  item,
  currentUser,
  onBuyClick,
  onDeleteClick,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const categoryMeta = USED_CATEGORY_LABELS[item.category] || {
    label: item.category,
    description: '',
  };

  const conditionMeta = USED_CONDITION_CONFIG[item.condition] || {
    label: item.condition,
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-800',
    borderClass: 'border-slate-300',
    badge: item.condition,
  };

  const zoneArabicName = {
    al_kafr: 'بلدة الكفر',
    suwayda: 'مدينة السويداء',
    shahba: 'شهبا',
    salkhad: 'صلخد',
    al_qurayya: 'القريّا',
    ariqa: 'عريقة',
    mazraa: 'المزرعة',
  }[item.zone] || item.zone;

  const isOwner = item.sellerId === currentUser.id;
  const isAvailable = item.status === 'available';

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yamango.sy';
    const link = `${origin}/?tab=used_goods&item=${encodeURIComponent(item.id)}`;
    const success = await copyToClipboard(link);
    if (success) {
      setIsCopied(true);
      setToastMessage('تم نسخ رابط الغرض المستعمل بنجاح!');
      setTimeout(() => setIsCopied(false), 2500);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setToastMessage('تعذر نسخ الرابط');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleWhatsAppContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = item.sellerPhone.replace(/[^\d+]/g, '');
    const cleanPhone = phone.startsWith('0') ? `+963${phone.substring(1)}` : phone;
    const msg = encodeURIComponent(
      `مرحباً ${item.sellerName}، أنا مهتم بشراء الغرض المستعمل المعروض على يامانغو:\n*${item.title}*\nالسعر المطلوب: ${formatUsedItemPrice(item.price, item.currency)}\nالموقع: ${zoneArabicName}\nهل هو متاح للمعاينة؟`
    );
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`, '_blank');
  };

  return (
    <article className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Toast Notification */}
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

      {/* Image & Status Badges Header */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
        <img
          src={item.images && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80'}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />

        {/* Condition Badge (Top Right) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border backdrop-blur-md shadow-xs ${conditionMeta.bgClass} ${conditionMeta.textClass} ${conditionMeta.borderClass}`}>
            {conditionMeta.badge}
          </span>
        </div>

        {/* Availability Status Badge (Top Left) */}
        <div className="absolute top-2.5 left-2.5">
          {item.status === 'available' ? (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-800/90 text-white backdrop-blur-md shadow-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              <span>متاح للشراء</span>
            </span>
          ) : item.status === 'reserved' ? (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-600/90 text-white backdrop-blur-md shadow-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>محجوز بإسكرو</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-700/90 text-white backdrop-blur-md shadow-xs">
              تم البيع
            </span>
          )}
        </div>

        {/* Delivery Mode Badge (Bottom Right) */}
        <div className="absolute bottom-2.5 right-2.5">
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-900/80 text-white border border-white/20 backdrop-blur-xs flex items-center gap-1">
            <PackageCheck className="w-3 h-3 text-amber-400" />
            <span>
              {item.deliveryOption === 'pickup_in_person'
                ? 'استلام يدوي'
                : item.deliveryOption === 'local_delivery'
                ? 'توصيل محلي'
                : 'استلام أو توصيل'}
            </span>
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Metadata Row: Category & Zone */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
            <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
              {categoryMeta.label}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="flex items-center gap-0.5 text-slate-600">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{zoneArabicName}</span>
            </span>
          </div>

          {/* Item Title */}
          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
            {item.title}
          </h3>

          {/* Description Snippet */}
          <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Pricing & Platform Commission Breakdown Box */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="text-slate-500 font-medium">السعر المطلوب:</span>
            <span className="font-extrabold text-slate-900 text-sm">
              {formatUsedItemPrice(item.price, item.currency)}
            </span>
          </div>

          {/* Commission and Payout Transparency */}
          <div className="grid grid-cols-2 gap-2 pt-1.5 text-[11px]">
            <div>
              <span className="text-slate-400 block font-medium">عمولة المنصة (3.5%):</span>
              <span className="font-bold text-amber-700">
                {formatUsedItemPrice(item.platformCommissionAmount, item.currency)}
              </span>
            </div>
            <div className="text-left">
              <span className="text-slate-400 block font-medium">صافي البائع:</span>
              <span className="font-bold text-emerald-700">
                {formatUsedItemPrice(item.sellerNetPayout, item.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Seller Info & Action Footer */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
            <span className="flex items-center gap-1">
              <span>البائع:</span>
              <strong className="text-slate-800 font-semibold">{item.sellerName}</strong>
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>إسكرو محمي</span>
            </span>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Buy via Certified Agent / Escrow Button */}
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => onBuyClick(item)}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                isAvailable
                  ? 'bg-amber-600 hover:bg-amber-700 active:scale-98 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title="شراء الغرض المستعمل عبر وكيل معتمد أو إسكرو يامانغو"
            >
              <Building className="w-3.5 h-3.5" />
              <span>{isAvailable ? 'شراء عبر وكيل معتمد' : 'غير متاح حالياً'}</span>
            </button>

            {/* WhatsApp Seller Button */}
            <button
              type="button"
              onClick={handleWhatsAppContact}
              className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors cursor-pointer"
              title="تواصل مع البائع عبر واتساب للاستفسار"
              aria-label="تواصل مع البائع عبر واتساب"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
            </button>

            {/* Direct Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="listing-card-share-button p-2 text-slate-600 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 border border-slate-200/80 rounded-xl transition-colors cursor-pointer"
              title="نسخ الرابط المباشر للغرض المستعمل"
              aria-label="نسخ رابط الإعلان"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Delete button for Owner / Admin */}
            {(isOwner || currentUser.roles.includes('admin')) && onDeleteClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('هل أنت متأكد من حذف هذا الغرض المستعمل؟')) {
                    onDeleteClick(item.id);
                  }
                }}
                className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200/80 rounded-xl transition-colors cursor-pointer"
                title="حذف الغرض"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
