import { Listing, ZoneLocation } from '../types';

/**
 * Syrian Sub-District (Zone) Arabic Labels
 */
const ZONE_LABELS: Record<ZoneLocation, string> = {
  al_kafr: 'بلدة الكفر',
  suwayda: 'مدينة السويداء',
  shahba: 'شهبا',
  salkhad: 'صلخد',
  al_qurayya: 'القريّا',
  ariqa: 'عريقة',
  mazraa: 'المزرعة',
};

/**
 * Generates a dynamic direct link for a specific vehicle listing.
 * e.g. https://domain.com/?listing=list_12345
 */
export function generateListingDynamicUrl(listingId: string, customBaseUrl?: string): string {
  if (customBaseUrl) {
    const url = new URL(customBaseUrl);
    url.searchParams.set('listing', listingId);
    return url.toString();
  }

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin || '';
    const pathname = window.location.pathname || '/';
    return `${origin}${pathname}?listing=${encodeURIComponent(listingId)}`;
  }

  // Fallback for SSR or Node.js environment
  return `https://yamango.sy/?listing=${encodeURIComponent(listingId)}`;
}

/**
 * Builds a formatted Arabic message suitable for WhatsApp and messaging apps.
 */
export function buildListingShareMessage(listing: Listing, shareUrl: string): string {
  const opText = listing.operation === 'sale' ? 'للبيع القطعي' : 'للإيجار';
  const priceFormatted = `${listing.priceAmount.toLocaleString('ar-SY')} ${listing.currency === 'USD' ? 'دولار أمريكي ($)' : 'ل.س'}`;
  const zoneText = ZONE_LABELS[listing.zone] || listing.zone;
  
  const metricText = listing.metricType === 'work_hours'
    ? `${listing.metricValue.toLocaleString('ar-SY')} ساعة عمل`
    : `${listing.metricValue.toLocaleString('ar-SY')} كم`;

  const verifiedStatus = listing.inspectionStatus === 'inspected'
    ? '✅ مفحوصة ومعتمدة فحصاً فنياً لدى كراجات yamango'
    : '🛡️ صفقات محمية عبر وساطة إسكرو يامانغو المضمونة';

  return [
    `🚜 *${listing.title}* (${opText})`,
    `📍 *الموقع:* ${zoneText} - محافظة السويداء`,
    `💰 *السعر المطلوب:* ${priceFormatted}`,
    `⚙️ *المواصفات:* موديل ${listing.year} · ${metricText}`,
    `${verifiedStatus}`,
    '',
    '🔗 *رابط المعاينة والتفاصيل المباشرة على منصة yamango:*',
    shareUrl,
  ].join('\n');
}

/**
 * Builds a direct WhatsApp click-to-chat URL with pre-filled message text.
 */
export function buildWhatsAppShareUrl(text: string, phoneNumber?: string): string {
  const encodedText = encodeURIComponent(text);
  if (phoneNumber && phoneNumber.trim()) {
    const cleanedPhone = phoneNumber.replace(/[^\d+]/g, '');
    return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Copies plain text to user's clipboard with fallback support.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('Clipboard writeText failed, trying fallback', e);
    }
  }

  // Fallback for older browsers or iframe constraints
  try {
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    }
  } catch (err) {
    console.error('Copy to clipboard failed entirely', err);
  }

  return false;
}
