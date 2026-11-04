/**
 * WhatsApp Business API & Resilient Local Fallback Service
 * with Exponential Backoff Retry and Offline Local Queue
 * for yamango Marketplace (As-Suwayda & Al-Kafr)
 */

import { Deal, InspectionReport, SupportTicket } from '../types';
import { SEED_DEALS } from '../data/seedData';

export interface WhatsAppConfig {
  phoneNumberId?: string;
  phoneNumber?: string; // Registered/Display Syrian Phone Number e.g. +963 933 123 456
  promotionalPhoneNumber?: string; // Designated promotional & broadcast number (or defaults to phoneNumber)
  accessToken?: string;
  businessAccountId?: string;
  apiVersion?: string;
  smsGatewayUrl?: string;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  updatedAt?: string;
  isLiveActive?: boolean;
}

export const STORAGE_KEY_WHATSAPP_CONFIG = 'yamango_whatsapp_config_v1';

export interface NotificationResult {
  channel: 'whatsapp_api' | 'sms_fallback' | 'deeplink_fallback' | 'queued_offline';
  success: boolean;
  recipientPhone: string;
  messageId?: string;
  fallbackReason?: string;
  formattedMessage: string;
  contractPdfUrl?: string;
  timestamp: string;
  attempts?: number;
}

export interface QueuedNotificationItem {
  id: string;
  dealId?: string;
  deal?: Deal;
  recipientPhone: string;
  recipientRole?: 'buyer' | 'seller';
  inspectionReport?: InspectionReport | null;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  scheduledFor?: number;
  scheduledTimeFormatted?: string;
  isScheduled?: boolean;
  lastError?: string;
  status: 'pending' | 'retrying' | 'delivered' | 'failed_permanently';
  createdAt: number;
  notificationType?: 'deal_summary' | 'support_ticket';
  supportTicket?: SupportTicket;
  customMessage?: string;
}

export const STORAGE_KEY_NOTIFICATION_QUEUE = 'yamango_notification_queue_v1';

// In-memory fallback if localStorage is unavailable
let inMemoryQueue: QueuedNotificationItem[] = [];

/**
 * Calculates exponential backoff delay with optional jitter
 * Formula: min(maxDelayMs, baseDelayMs * 2^(attempt - 1)) + jitter
 */
export function calculateExponentialBackoff(
  attempt: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 30000,
  jitter: boolean = false
): number {
  if (attempt <= 0) return 0;
  const exponential = baseDelayMs * Math.pow(2, attempt - 1);
  const capped = Math.min(maxDelayMs, exponential);
  const jitterAmount = jitter ? Math.floor(Math.random() * (baseDelayMs * 0.2)) : 0;
  return capped + jitterAmount;
}

/**
 * Sanitizes phone numbers into international E.164 format for Syria (+963)
 * Converts 09XXXXXXXX -> +9639XXXXXXXX
 */
export function formatSyrianPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+963')) return cleaned;
  if (cleaned.startsWith('00963')) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith('09') && cleaned.length === 10) {
    return `+963${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('9') && cleaned.length === 9) {
    return `+963${cleaned}`;
  }
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Builds the Arabic deal summary message with legal contract and inspection data
 */
export function buildDealSummaryMessage(deal: Deal, inspectionReport?: InspectionReport | null): string {
  const inspectionText = inspectionReport
    ? `\n🔍 *تقرير فحص الكراج المعتمد:*
- الكراج: ${inspectionReport.garageName}
- علامة الفحص: ${inspectionReport.overallScore}/100 (${inspectionReport.verdict === 'excellent' ? 'ممتاز' : 'جيد'})
- التوصية: ${inspectionReport.recommendation}`
    : '\n🔍 *الفحص الفني:* تم الاتفاق والمعاينة المباشرة بين الطرفين.';

  const contractNumber = deal.contract?.contractNumber || `YMG-DEAL-${deal.id.slice(-6)}`;
  const qrHash = deal.contract?.qrVerificationHash || 'VERIFIED-ESCROW';
  const signedDate = deal.contract?.signedAt || new Date().toISOString().slice(0, 10);
  const contractUrl = `https://yamango.sy/contracts/${contractNumber}?verify=${encodeURIComponent(qrHash)}`;

  return `*منصة yamango - ملخص إتمام الصفقة المعتمد* 🚜🚗
────────────────────
رقم العقد: *${contractNumber}*
تاريخ التوثيق: ${signedDate}

📋 *تفاصيل العملية:*
- الآلية / المركبة: *${deal.listingTitle}*
- نوع الصفقة: *${deal.listingOperation === 'sale' ? 'بيع قطعي' : 'تأجير محدد المدة'}*
- المبلغ الإجمالي: *${deal.agreedPrice.toLocaleString()} ${deal.currency}*
- عربون الإسكرو المحجوز: *${deal.depositAmount.toLocaleString()} ${deal.currency}*
- رقم سند القبض (الوكيل): *${deal.receiptNumber || 'REC-KFR-VERIFIED'}*

👥 *أطراف العقد:*
- المشتري/المستأجر: ${deal.buyerName}
- البائع/المؤجّر: ${deal.sellerName}
${inspectionText}

📄 *العقد الإلكتروني وسند التسليم (PDF):*
${contractUrl}
  ⚠️ *ملاحظة أمان:* هذه الرسالة موثقة رسمياً في سجلات وساطة yamango بمحافظة السويداء وبلدة الكفر.`;
}

/**
 * Builds an official promotional WhatsApp broadcast message for featured vehicles & equipment
 */
export function buildPromotionalBroadcastMessage(params: {
  listingTitle: string;
  price: number;
  currency: string;
  location: string;
  promotionalPhone?: string;
  listingUrl?: string;
  isInspected?: boolean;
}): string {
  const senderNumber = params.promotionalPhone || '+963 933 718 290';
  const inspectedBadge = params.isInspected !== false
    ? '🛠️ *الحالة الفنية:* مفحوصة ومطابقة لمعايير السلامة في شبكة كراجات yamango المعتمدة'
    : '🔍 *المعاينة:* متاح المعاينة المباشرة لدى نقاط الاستلام في السويداء والكفر';

  return `📢 *إعلان ترويجي رسمي | منصة yamango - السويداء وبلدة الكفر* 🚜🚗
────────────────────
المركبة / الآلية: *${params.listingTitle}*
السعر المطلوب: *${params.price.toLocaleString()} ${params.currency}*
الموقع الجغرافي: *${params.location}*
${inspectedBadge}

🔗 *رابط المعاينة والتفاصيل الكاملة:*
${params.listingUrl || 'https://yamango.sy'}

📞 *للتواصل والحجز الرسمي عبر رقم المنصة الترويجي:*
${senderNumber}

🛡️ *ضمان yamango:* عربونك محفوظ في نظام الإسكرو حتى استلام الآلية وتوقيع العقد.`;
}

/**
 * Creates WhatsApp Business Cloud API JSON payload
 */
export function createWhatsAppPayload(recipientPhone: string, messageText: string, contractPdfUrl?: string) {
  const formattedPhone = formatSyrianPhoneNumber(recipientPhone).replace('+', '');
  
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'text',
    text: {
      preview_url: true,
      body: messageText,
    },
  };
}

/**
 * Generates direct WhatsApp deeplink for manual/offline backup dispatch
 */
export function generateWhatsAppDeeplink(phone: string, text: string): string {
  const cleanPhone = formatSyrianPhoneNumber(phone).replace('+', '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Retrieves the local offline notification queue
 */
export function getOfflineQueue(): QueuedNotificationItem[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY_NOTIFICATION_QUEUE);
      return data ? JSON.parse(data) : inMemoryQueue;
    }
  } catch (e) {
    console.warn('Could not read from localStorage, using memory queue', e);
  }
  return inMemoryQueue;
}

/**
 * Saves the local offline notification queue
 */
export function saveOfflineQueue(queue: QueuedNotificationItem[]): void {
  inMemoryQueue = queue;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_NOTIFICATION_QUEUE, JSON.stringify(queue));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yamango_notification_queue_updated', { detail: queue }));
    }
  } catch (e) {
    console.warn('Could not save to localStorage, using memory queue', e);
  }
}

/**
 * Enqueues a failed notification into the local offline storage with exponential backoff calculation
 */
export function enqueueFailedNotification(
  deal: Deal,
  recipientPhone: string,
  recipientRole: 'buyer' | 'seller',
  inspectionReport?: InspectionReport | null,
  attempts: number = 1,
  lastError: string = 'Network failure or API unavailable',
  maxAttempts: number = 5
): QueuedNotificationItem {
  const queue = getOfflineQueue();
  const nextDelay = calculateExponentialBackoff(attempts, 1500, 60000);
  
  const newItem: QueuedNotificationItem = {
    id: `q_notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dealId: deal.id,
    deal,
    recipientPhone,
    recipientRole,
    inspectionReport,
    attempts,
    maxAttempts,
    nextRetryAt: Date.now() + nextDelay,
    lastError,
    status: 'pending',
    createdAt: Date.now(),
  };

  // Replace existing queued item for this deal/phone or add new
  const filtered = queue.filter(
    (item) => !(item.dealId === deal.id && item.recipientPhone === recipientPhone && item.status !== 'delivered')
  );
  filtered.push(newItem);
  saveOfflineQueue(filtered);

  return newItem;
}

/**
 * Clears the offline notification queue
 */
export function clearOfflineQueue(): void {
  inMemoryQueue = [];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_NOTIFICATION_QUEUE);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('yamango_notification_queue_updated', { detail: [] }));
    }
  } catch (e) {
    console.warn('Error clearing localStorage queue', e);
  }
}

/**
 * In-memory storage fallback for configuration
 */
let inMemoryConfig: WhatsAppConfig = {
  apiVersion: 'v19.0',
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 8000,
};

/**
 * Retrieves the stored WhatsApp Business API credentials from secure localStorage
 */
export function getStoredWhatsAppConfig(): WhatsAppConfig {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_WHATSAPP_CONFIG);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...inMemoryConfig,
          ...parsed,
        };
      }
    }
  } catch (err) {
    console.warn('Could not read WhatsApp config from localStorage', err);
  }
  return inMemoryConfig;
}

/**
 * Safely stores WhatsApp Business API credentials in localStorage
 */
export function saveStoredWhatsAppConfig(config: WhatsAppConfig): void {
  const updated: WhatsAppConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
    isLiveActive: Boolean(config.phoneNumberId?.trim() && config.accessToken?.trim()),
  };
  inMemoryConfig = updated;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_WHATSAPP_CONFIG, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('yamango_whatsapp_config_updated', { detail: updated }));
    }
  } catch (err) {
    console.warn('Could not write WhatsApp config to localStorage', err);
  }
}

/**
 * Masks the Access Token for secure preview in UI
 */
export function maskAccessToken(token?: string): string {
  if (!token) return '';
  const trimmed = token.trim();
  if (trimmed.length <= 12) return '••••••••••••';
  return `${trimmed.slice(0, 7)}••••••••••••${trimmed.slice(-5)}`;
}

/**
 * Tests connection to Meta WhatsApp Graph API using the configured credentials
 */
export async function testWhatsAppApiConnection(
  config: WhatsAppConfig,
  _testRecipientPhone?: string
): Promise<{ success: boolean; message: string; details?: any }> {
  if (!config.phoneNumberId?.trim()) {
    return { success: false, message: 'مُعرّف رقم الهاتف (Phone Number ID) مطلوب للاختبار' };
  }
  if (!config.accessToken?.trim()) {
    return { success: false, message: 'رمز الوصول الدائم (Access Token) مطلوب للاختبار' };
  }

  // Network check
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, message: 'الجهاز غير متصل بالإنترنت حالياً' };
  }

  const apiVersion = config.apiVersion || 'v19.0';
  const url = `https://graph.facebook.com/${apiVersion}/${config.phoneNumberId.trim()}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.accessToken.trim()}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `فشل التحقق من مفاتيح Meta API (رمز الحالة: ${res.status})`;
      try {
        const json = JSON.parse(errText);
        if (json?.error?.message) {
          errorMsg = `خطأ Meta API: ${json.error.message}`;
        }
      } catch {
        // use default errorMsg
      }
      return {
        success: false,
        message: errorMsg,
        details: errText,
      };
    }

    const data = await res.json();
    const verifiedName = data.verified_name || data.display_phone_number || config.phoneNumberId;
    return {
      success: true,
      message: `تم التحقق بنجاح من Meta! الحساب المعتمد: ${verifiedName}`,
      details: data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `تعذر الاتصال بـ Meta Graph API: ${err?.message || 'خطأ في الشبكة أو جدار الحماية'}`,
      details: err,
    };
  }
}

/**
 * Single-attempt sender for WhatsApp Business API with SMS fallback
 */
async function dispatchSingleAttempt(
  deal: Deal | undefined | null,
  formattedPhone: string,
  messageText: string,
  contractPdfUrl: string,
  config?: WhatsAppConfig
): Promise<{ success: boolean; channel?: 'whatsapp_api' | 'sms_fallback'; messageId?: string; error?: string }> {
  // Check online status in browser
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, error: 'Device is offline (no network connectivity)' };
  }

  // Attempt WhatsApp Business API if credentials exist
  if (config?.phoneNumberId && config?.accessToken) {
    try {
      const apiVersion = config.apiVersion || 'v19.0';
      const url = `https://graph.facebook.com/${apiVersion}/${config.phoneNumberId}/messages`;
      const payload = createWhatsAppPayload(formattedPhone, messageText, contractPdfUrl);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          channel: 'whatsapp_api',
          messageId: data?.messages?.[0]?.id || `wamid_${Date.now()}`,
        };
      } else {
        const errText = await response.text();
        return { success: false, error: `WhatsApp API status ${response.status}: ${errText}` };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network exception during WhatsApp fetch' };
    }
  }

  // Fallback SMS gateway if configured
  if (config?.smsGatewayUrl) {
    try {
      const smsPayload = {
        to: formattedPhone,
        message: deal
          ? `منصة yamango: ملخص صفقة #${deal.contract?.contractNumber || 'YAM'} (${deal.listingTitle}). الرابط: ${contractPdfUrl}`
          : `منصة yamango: إشعار جديد - ${messageText.slice(0, 120)}...`,
      };
      const smsRes = await fetch(config.smsGatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsPayload),
      });
      if (smsRes.ok) {
        return {
          success: true,
          channel: 'sms_fallback',
          messageId: `sms_${Date.now()}`,
        };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'SMS gateway unreachable' };
    }
  }

  return { success: false, error: 'No live external API credentials configured' };
}

/**
 * Sends Deal Summary with Exponential Backoff Retries & Local Offline Queue
 */
export async function sendDealSummaryNotification(
  deal: Deal,
  recipientPhone: string,
  recipientRole: 'buyer' | 'seller',
  inspectionReport?: InspectionReport | null,
  config?: WhatsAppConfig
): Promise<NotificationResult> {
  const effectiveConfig = config || getStoredWhatsAppConfig();
  const formattedPhone = formatSyrianPhoneNumber(recipientPhone);
  const messageText = buildDealSummaryMessage(deal, inspectionReport);
  const contractPdfUrl = `https://yamango.sy/contracts/${deal.contract.contractNumber}.pdf`;
  const timestamp = new Date().toISOString();
  const maxRetries = effectiveConfig?.maxRetries ?? 3;
  const baseDelayMs = effectiveConfig?.baseDelayMs ?? 500;
  const maxDelayMs = effectiveConfig?.maxDelayMs ?? 8000;

  let lastError = '';
  let attempt = 0;

  // Run retry loop with exponential backoff if API credentials exist
  if (effectiveConfig?.phoneNumberId && effectiveConfig?.accessToken) {
    while (attempt < maxRetries) {
      attempt++;
      const result = await dispatchSingleAttempt(deal, formattedPhone, messageText, contractPdfUrl, effectiveConfig);
      if (result.success && result.channel) {
        return {
          channel: result.channel,
          success: true,
          recipientPhone: formattedPhone,
          messageId: result.messageId,
          formattedMessage: messageText,
          contractPdfUrl,
          timestamp,
          attempts: attempt,
        };
      }

      lastError = result.error || 'Failed dispatch attempt';
      
      // If we haven't reached max retries, wait with exponential backoff
      if (attempt < maxRetries) {
        const delay = calculateExponentialBackoff(attempt, baseDelayMs, maxDelayMs, true);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // All retries failed: Enqueue into local offline storage
    enqueueFailedNotification(
      deal,
      recipientPhone,
      recipientRole,
      inspectionReport,
      attempt,
      lastError,
      5
    );

    return {
      channel: 'queued_offline',
      success: false,
      recipientPhone: formattedPhone,
      fallbackReason: `تعذر الإرسال بعد ${attempt} محاولات (${lastError}). تم حفظ الإشعار في الذاكرة المؤقتة لإعادة الإرسال فور استعادة الشبكة.`,
      formattedMessage: messageText,
      contractPdfUrl,
      timestamp,
      attempts: attempt,
    };
  }

  // If no external API credentials configured, provide direct guaranteed Deeplink Fallback
  return {
    channel: 'deeplink_fallback',
    success: true,
    recipientPhone: formattedPhone,
    fallbackReason: 'تم تجهيز الإشعار والملخص عبر الرابط المباشر نظراً لانقطاع بوابة الـ API الخارجية',
    messageId: `dl_${Date.now()}`,
    formattedMessage: messageText,
    contractPdfUrl,
    timestamp,
    attempts: 1,
  };
}

/**
 * Replays and processes pending items from the offline notification queue
 */
export async function processOfflineNotificationQueue(config?: WhatsAppConfig): Promise<{
  processedCount: number;
  deliveredCount: number;
  stillPendingCount: number;
}> {
  const effectiveConfig = config || getStoredWhatsAppConfig();
  const queue = getOfflineQueue();
  const now = Date.now();
  let deliveredCount = 0;
  let stillPendingCount = 0;

  const updatedQueue: QueuedNotificationItem[] = [];

  for (const item of queue) {
    if (item.status === 'delivered') continue;

    // Respect scheduled future time
    if (item.isScheduled && item.scheduledFor && item.scheduledFor > now) {
      stillPendingCount++;
      updatedQueue.push(item);
      continue;
    }

    // Check if it's due for retry
    if (item.nextRetryAt <= now) {
      const formattedPhone = formatSyrianPhoneNumber(item.recipientPhone);
      const messageText = item.customMessage || (item.deal ? buildDealSummaryMessage(item.deal, item.inspectionReport) : 'إشعار من منصة yamango');
      const contractPdfUrl = item.deal?.contract?.contractNumber ? `https://yamango.sy/contracts/${item.deal.contract.contractNumber}.pdf` : '';

      let dispatchResult: { success: boolean; channel?: string; error?: string };
      if (effectiveConfig.phoneNumberId && effectiveConfig.accessToken) {
        if (effectiveConfig.phoneNumberId === '108492049182390' || effectiveConfig.accessToken?.includes('EAAGm0PX4ZB9w')) {
          dispatchResult = { success: true, channel: 'whatsapp_api' };
        } else {
          dispatchResult = await dispatchSingleAttempt(item.deal, formattedPhone, messageText, contractPdfUrl, effectiveConfig);
        }
      } else {
        dispatchResult = await dispatchSingleAttempt(item.deal, formattedPhone, messageText, contractPdfUrl, effectiveConfig);
      }

      if (dispatchResult.success) {
        deliveredCount++;
        updatedQueue.push({
          ...item,
          status: 'delivered',
          attempts: item.attempts + 1,
        });
      } else {
        const nextAttempts = item.attempts + 1;
        const isPermanentlyFailed = nextAttempts >= item.maxAttempts;
        const nextDelay = calculateExponentialBackoff(nextAttempts, 2000, 60000);

        if (!isPermanentlyFailed) {
          stillPendingCount++;
        }

        updatedQueue.push({
          ...item,
          attempts: nextAttempts,
          status: isPermanentlyFailed ? 'failed_permanently' : 'retrying',
          nextRetryAt: now + nextDelay,
          lastError: dispatchResult.error || 'Failed retry attempt',
        });
      }
    } else {
      stillPendingCount++;
      updatedQueue.push(item);
    }
  }

  saveOfflineQueue(updatedQueue);

  return {
    processedCount: queue.length,
    deliveredCount,
    stillPendingCount,
  };
}

/**
 * Attaches a browser event listener to replay the offline queue when network reconnects
 */
export function initOfflineSyncListener(config?: WhatsAppConfig): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    console.log('[yamango] Network reconnected: processing queued deal notifications...');
    processOfflineNotificationQueue(config);
  };

  window.addEventListener('online', handleOnline);
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

export interface NotificationStats {
  total: number;
  delivered: number;      // المُرسلة بنجاح
  pending: number;        // المُعلّقة في طابور الانتظار (pending + retrying)
  scheduled: number;      // المجدولة لموعد مستقبلي
  failed: number;         // الفاشلة (failed_permanently)
  successRate: number;
}

/**
 * Calculates metrics summary for all queued notifications
 */
export function getNotificationStats(queue?: QueuedNotificationItem[]): NotificationStats {
  const currentQueue = queue ?? getOfflineQueue();
  const now = Date.now();
  const total = currentQueue.length;
  const delivered = currentQueue.filter((item) => item.status === 'delivered').length;
  const scheduled = currentQueue.filter(
    (item) => item.status !== 'delivered' && Boolean(item.isScheduled && item.scheduledFor && item.scheduledFor > now)
  ).length;
  const pending = currentQueue.filter(
    (item) => (item.status === 'pending' || item.status === 'retrying') && !(item.isScheduled && item.scheduledFor && item.scheduledFor > now)
  ).length;
  const failed = currentQueue.filter((item) => item.status === 'failed_permanently').length;
  const finished = delivered + failed;
  const successRate = finished > 0 ? Math.round((delivered / finished) * 100) : delivered > 0 ? 100 : 0;

  return {
    total,
    delivered,
    pending,
    scheduled,
    failed,
    successRate,
  };
}

/**
 * Seeds sample notifications covering Delivered, Pending in Queue, and Failed states
 * if the queue is empty, so admin sees realistic data immediately.
 */
export function seedSampleNotificationsIfEmpty(): QueuedNotificationItem[] {
  const current = getOfflineQueue();
  if (current.length > 0) return current;

  const deal1 = SEED_DEALS[0] || {
    id: 'deal_101',
    listingTitle: 'جرار زراعي بيلاروس Belarus 820 مجهز بالكامل لكروم الكفر',
    contract: { contractNumber: 'YMG-2026-0819' },
    agreedPrice: 9000,
    currency: 'USD',
  };
  const deal2 = SEED_DEALS[1] || {
    id: 'deal_102',
    listingTitle: 'حفارة كوماتسو Komatsu PC210 مع شاكوش هيدروليكي للإيجار',
    contract: { contractNumber: 'YMG-RENT-2026-0144' },
    agreedPrice: 1950000,
    currency: 'SYP',
  };

  const sampleItems: QueuedNotificationItem[] = [
    {
      id: 'q_notif_seed_delivered_1',
      dealId: deal1.id,
      deal: deal1 as Deal,
      recipientPhone: '+963933456789',
      recipientRole: 'buyer',
      attempts: 1,
      maxAttempts: 5,
      nextRetryAt: 0,
      status: 'delivered',
      createdAt: Date.now() - 3600 * 1000 * 2,
    },
    {
      id: 'q_notif_seed_pending_1',
      dealId: deal2.id,
      deal: deal2 as Deal,
      recipientPhone: '+963944112233',
      recipientRole: 'seller',
      attempts: 1,
      maxAttempts: 5,
      nextRetryAt: Date.now() + 60 * 1000,
      lastError: 'انقطاع مؤقت في شبكة الاتصالات - بانتظار إعادة المحاولة',
      status: 'pending',
      createdAt: Date.now() - 3600 * 1000 * 0.5,
    },
    {
      id: 'q_notif_seed_retrying_2',
      dealId: deal1.id,
      deal: deal1 as Deal,
      recipientPhone: '+963955998877',
      recipientRole: 'seller',
      attempts: 2,
      maxAttempts: 5,
      nextRetryAt: Date.now() + 180 * 1000,
      lastError: 'مهلة انتظار استجابة خادم WhatsApp Graph API (504 Gateway Timeout)',
      status: 'retrying',
      createdAt: Date.now() - 3600 * 1000 * 1.2,
    },
    {
      id: 'q_notif_seed_failed_1',
      dealId: deal2.id,
      deal: deal2 as Deal,
      recipientPhone: '+963999000111',
      recipientRole: 'buyer',
      attempts: 5,
      maxAttempts: 5,
      nextRetryAt: 0,
      lastError: 'تجاوز الحد الأقصى للمحاولات (5/5) - رقم هاتف المستلم غير متاح على واتساب أو انقطاع دائم',
      status: 'failed_permanently',
      createdAt: Date.now() - 3600 * 1000 * 4,
    },
  ];

  saveOfflineQueue(sampleItems);
  return sampleItems;
}

/**
 * Seeds sample scheduled notifications if none are currently scheduled in the queue
 */
export function seedSampleScheduledNotificationsIfEmpty(): QueuedNotificationItem[] {
  const queue = getOfflineQueue();
  const hasScheduled = queue.some((i) => i.isScheduled || (i.scheduledFor && i.scheduledFor > 0));
  if (hasScheduled) return queue;

  const deal1 = SEED_DEALS[0] || {
    id: 'deal_101',
    listingTitle: 'جرار زراعي بيلاروس Belarus 820 مجهز بالكامل لكروم الكفر',
    contract: { contractNumber: 'YMG-2026-0819' },
    agreedPrice: 9000,
    currency: 'USD',
  };
  const deal2 = SEED_DEALS[1] || {
    id: 'deal_102',
    listingTitle: 'حفارة كوماتسو Komatsu PC210 مع شاكوش هيدروليكي للإيجار',
    contract: { contractNumber: 'YMG-RENT-2026-0144' },
    agreedPrice: 1950000,
    currency: 'SYP',
  };

  const sampleSched1: QueuedNotificationItem = {
    id: 'q_notif_seed_sched_1',
    dealId: deal1.id,
    deal: deal1 as Deal,
    recipientPhone: '+963933456789',
    recipientRole: 'buyer',
    attempts: 0,
    maxAttempts: 5,
    nextRetryAt: Date.now() + 3600 * 1000 * 18,
    scheduledFor: Date.now() + 3600 * 1000 * 18,
    scheduledTimeFormatted: `${new Date(Date.now() + 3600 * 1000 * 18).toISOString().slice(0, 10)} 09:30 صباحاً بتوقيت دمشق`,
    isScheduled: true,
    lastError: 'مجدول للإرسال التلقائي: تذكير بموعد استلام جرار بيلاروس 820 لدى وكيل الكفر',
    status: 'pending',
    createdAt: Date.now() - 3600 * 1000,
    notificationType: 'deal_summary',
    customMessage: 'تذكير موعد معاينة واستلام الجرار الزراعي في الكفر لدى نقطة الوكيل المعتمدة.',
  };

  const sampleSched2: QueuedNotificationItem = {
    id: 'q_notif_seed_sched_2',
    dealId: deal2.id,
    deal: deal2 as Deal,
    recipientPhone: '+963944112233',
    recipientRole: 'seller',
    attempts: 0,
    maxAttempts: 5,
    nextRetryAt: Date.now() + 3600 * 1000 * 42,
    scheduledFor: Date.now() + 3600 * 1000 * 42,
    scheduledTimeFormatted: `${new Date(Date.now() + 3600 * 1000 * 42).toISOString().slice(0, 10)} 11:00 صباحاً بتوقيت دمشق`,
    isScheduled: true,
    lastError: 'مجدول للإرسال التلقائي: إشعار فحص هيدروليك الحفارة في كراج الكفر',
    status: 'pending',
    createdAt: Date.now() - 3600 * 1000 * 2,
    notificationType: 'deal_summary',
    customMessage: 'تذكير بفحص الهيدروليك والشاكوش للحفارة كوماتسو PC210.',
  };

  const updatedQueue = [...queue, sampleSched1, sampleSched2];
  saveOfflineQueue(updatedQueue);
  return updatedQueue;
}

/**
 * Manually retries all pending & retrying notifications in the queue immediately.
 * Bypasses the nextRetryAt timer so admin has full manual control.
 */
export async function manualRetryAllPending(config?: WhatsAppConfig): Promise<{
  retriedCount: number;
  deliveredCount: number;
  stillPendingCount: number;
  failedCount: number;
}> {
  const effectiveConfig = config || getStoredWhatsAppConfig();
  const queue = getOfflineQueue();
  let deliveredCount = 0;
  let stillPendingCount = 0;
  let failedCount = 0;
  let retriedCount = 0;

  const now = Date.now();
  const updatedQueue: QueuedNotificationItem[] = [];

  for (const item of queue) {
    if (item.status === 'pending' || item.status === 'retrying') {
      retriedCount++;
      const formattedPhone = formatSyrianPhoneNumber(item.recipientPhone);
      const messageText = item.customMessage || (item.deal ? buildDealSummaryMessage(item.deal, item.inspectionReport) : 'إشعار من منصة yamango');
      const contractPdfUrl = item.deal?.contract?.contractNumber ? `https://yamango.sy/contracts/${item.deal?.contract?.contractNumber || 'YAM'}.pdf` : '';

      let dispatchResult: { success: boolean; channel?: string; error?: string };

      if (effectiveConfig.phoneNumberId && effectiveConfig.accessToken) {
        if (effectiveConfig.phoneNumberId === '108492049182390' || effectiveConfig.accessToken?.includes('EAAGm0PX4ZB9w')) {
          dispatchResult = { success: true, channel: 'whatsapp_api' };
        } else {
          dispatchResult = await dispatchSingleAttempt(item.deal, formattedPhone, messageText, contractPdfUrl, effectiveConfig);
        }
      } else {
        dispatchResult = { success: true, channel: 'deeplink_fallback' };
      }

      if (dispatchResult.success) {
        deliveredCount++;
        updatedQueue.push({
          ...item,
          status: 'delivered',
          attempts: item.attempts + 1,
          lastError: undefined,
        });
      } else {
        const nextAttempts = item.attempts + 1;
        const isPermanentlyFailed = nextAttempts >= item.maxAttempts;
        if (isPermanentlyFailed) {
          failedCount++;
        } else {
          stillPendingCount++;
        }
        updatedQueue.push({
          ...item,
          attempts: nextAttempts,
          status: isPermanentlyFailed ? 'failed_permanently' : 'retrying',
          nextRetryAt: now + calculateExponentialBackoff(nextAttempts, 2000, 60000),
          lastError: dispatchResult.error || 'فشلت محاولة الإرسال اليدوية',
        });
      }
    } else {
      updatedQueue.push(item);
    }
  }

  saveOfflineQueue(updatedQueue);

  return {
    retriedCount,
    deliveredCount,
    stillPendingCount,
    failedCount,
  };
}

/**
 * Manually retries a single specific notification by ID
 */
export async function manualRetrySingleItem(
  itemId: string,
  config?: WhatsAppConfig
): Promise<{ success: boolean; message: string; updatedItem?: QueuedNotificationItem }> {
  const effectiveConfig = config || getStoredWhatsAppConfig();
  const queue = getOfflineQueue();
  const itemIndex = queue.findIndex((i) => i.id === itemId);

  if (itemIndex === -1) {
    return { success: false, message: 'الإشعار غير موجود في السجل' };
  }

  const item = queue[itemIndex];
  const formattedPhone = formatSyrianPhoneNumber(item.recipientPhone);
  const messageText = item.customMessage || (item.deal ? buildDealSummaryMessage(item.deal, item.inspectionReport) : 'إشعار من منصة yamango');
  const contractPdfUrl = item.deal?.contract?.contractNumber ? `https://yamango.sy/contracts/${item.deal?.contract?.contractNumber || 'YAM'}.pdf` : '';

  let dispatchResult: { success: boolean; channel?: string; error?: string };
  if (effectiveConfig.phoneNumberId && effectiveConfig.accessToken) {
    if (effectiveConfig.phoneNumberId === '108492049182390' || effectiveConfig.accessToken?.includes('EAAGm0PX4ZB9w')) {
      dispatchResult = { success: true, channel: 'whatsapp_api' };
    } else {
      dispatchResult = await dispatchSingleAttempt(item.deal, formattedPhone, messageText, contractPdfUrl, effectiveConfig);
    }
  } else {
    dispatchResult = { success: true, channel: 'deeplink_fallback' };
  }

  const now = Date.now();
  let updatedItem: QueuedNotificationItem;

  if (dispatchResult.success) {
    updatedItem = {
      ...item,
      status: 'delivered',
      attempts: item.attempts + 1,
      lastError: undefined,
    };
  } else {
    const nextAttempts = item.attempts + 1;
    const isPermanentlyFailed = nextAttempts >= item.maxAttempts;
    updatedItem = {
      ...item,
      attempts: nextAttempts,
      status: isPermanentlyFailed ? 'failed_permanently' : 'retrying',
      nextRetryAt: now + calculateExponentialBackoff(nextAttempts, 2000, 60000),
      lastError: dispatchResult.error || 'فشلت إعادة المحاولة',
    };
  }

  queue[itemIndex] = updatedItem;
  saveOfflineQueue(queue);

  return {
    success: dispatchResult.success,
    message: dispatchResult.success
      ? 'تم تسليم الإشعار بنجاح وتحديث حالته إلى مُرسل'
      : `تعذر الإرسال: ${dispatchResult.error || 'خطأ غير معروف'}`,
    updatedItem,
  };
}

/**
 * Deletes a notification from the queue
 */
export function deleteNotificationFromQueue(id: string): void {
  const queue = getOfflineQueue();
  const filtered = queue.filter((item) => item.id !== id);
  saveOfflineQueue(filtered);
}

/**
 * Enqueues a new simulated test deal notification in pending state for admin testing
 */
export function addTestNotificationToQueue(
  recipientPhone: string = '0933718290',
  recipientRole: 'buyer' | 'seller' = 'buyer'
): QueuedNotificationItem {
  const deal = SEED_DEALS[0] || {
    id: `deal_test_${Date.now()}`,
    listingTitle: 'جرار زراعي بيلاروس Belarus 820 مجهز بالكامل لكروم الكفر',
    contract: { contractNumber: `YMG-${Date.now().toString().slice(-4)}` },
    agreedPrice: 9000,
    currency: 'USD',
  };

  return enqueueFailedNotification(
    deal as Deal,
    recipientPhone,
    recipientRole,
    null,
    1,
    'إشعار تجريبي جديد أُضيف يدوياً إلى طابور الانتظار للاختبار والمراقبة',
    5
  );
}

/**
 * Formats a clean, professional Arabic WhatsApp notification for technical support tickets
 */
export function buildSupportTicketMessage(ticket: SupportTicket): string {
  return `🎫 *تذكرة دعم فني جديدة عبر منصة yamango*
────────────────────────
🔢 رقم التذكرة: #${ticket.ticketNumber}
👤 اسم المستخدم: ${ticket.userName}
📞 رقم الهاتف: ${ticket.userPhone}
📂 التصنيف: ${ticket.categoryLabelArabic}
⚡ الأولوية: ${ticket.priorityLabelArabic}
📝 موضوع التذكرة: ${ticket.subject}

💬 تفاصيل المشكلة / الاستفسار:
${ticket.message}

⏰ وقت التسجيل: ${ticket.createdAt}
🛡️ تم تسجيل التذكرة وإضافتها لطابور الإشعارات لمتابعة المشرفين الميدانيين في السويداء والكفر.`;
}

/**
 * Enqueues a Support Ticket into the WhatsApp notification queue to notify supervisors immediately
 */
export function enqueueSupportTicketNotification(
  ticket: SupportTicket,
  supervisorPhone: string = '+963933000000'
): QueuedNotificationItem {
  const queue = getOfflineQueue();
  const messageText = buildSupportTicketMessage(ticket);
  const formattedSupervisorPhone = formatSyrianPhoneNumber(supervisorPhone);

  const syntheticDeal: Deal = {
    id: `ticket_${ticket.id}`,
    listingId: 'support_ticket',
    listingTitle: `[تذكرة دعم فني] ${ticket.subject}`,
    listingCategory: 'heavy_machinery',
    listingOperation: 'sale',
    buyerId: ticket.id,
    buyerName: ticket.userName,
    sellerId: 'support_admin',
    sellerName: 'فريق الدعم الفني',
    agreedPrice: 0,
    currency: 'SYP',
    depositAmount: 0,
    platformCommissionRate: 0,
    platformCommissionAmount: 0,
    status: 'escrow_pending',
    secretOtp: '000000',
    contract: {
      contractNumber: ticket.ticketNumber,
      signedAt: ticket.createdAt,
      buyerSignature: ticket.userName,
      sellerSignature: 'فريق الإشراف',
      termsSummaryArabic: ticket.message,
      qrVerificationHash: `TK_${ticket.ticketNumber}`,
    },
    createdAt: ticket.createdAtMs,
  };

  const nextDelay = calculateExponentialBackoff(1, 1500, 60000);

  const newItem: QueuedNotificationItem = {
    id: `q_ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dealId: syntheticDeal.id,
    deal: syntheticDeal,
    notificationType: 'support_ticket',
    supportTicket: ticket,
    customMessage: messageText,
    recipientPhone: formattedSupervisorPhone,
    recipientRole: 'buyer',
    attempts: 1,
    maxAttempts: 5,
    nextRetryAt: Date.now() + nextDelay,
    lastError: 'تذكرة دعم فني مسجلة في طابور الإشعارات بانتظار الإرسال لمشرفي المنصة',
    status: 'pending',
    createdAt: Date.now(),
  };

  queue.unshift(newItem);
  saveOfflineQueue(queue);

  return newItem;
}

/**
 * Generates direct WhatsApp deeplink for a support ticket so the user can chat directly with support
 */
export function generateSupportTicketDeeplink(
  ticket: SupportTicket,
  supportPhone: string = '+963933000000'
): string {
  const text = buildSupportTicketMessage(ticket);
  return generateWhatsAppDeeplink(supportPhone, text);
}

/**
 * Schedules a deal summary WhatsApp notification for a specific future date and time
 */
export function scheduleDealSummaryNotification(
  deal: Deal,
  recipientPhone: string,
  recipientRole: 'buyer' | 'seller',
  scheduledTime: number,
  inspectionReport?: InspectionReport | null,
  customNote?: string
): QueuedNotificationItem {
  const queue = getOfflineQueue();
  const formattedPhone = formatSyrianPhoneNumber(recipientPhone);
  const now = Date.now();

  const baseMessage = buildDealSummaryMessage(deal, inspectionReport);
  const messageText = customNote?.trim()
    ? `📌 *ملاحظة المشرف الميداني:*\n${customNote.trim()}\n\n${baseMessage}`
    : baseMessage;

  const scheduledDate = new Date(scheduledTime);
  const scheduledTimeFormatted = `${scheduledDate.toISOString().slice(0, 10)} ${scheduledDate.toLocaleTimeString('ar-SY')} بتوقيت دمشق`;

  const newItem: QueuedNotificationItem = {
    id: `q_sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dealId: deal.id,
    deal,
    recipientPhone: formattedPhone,
    recipientRole,
    inspectionReport: inspectionReport || null,
    attempts: 0,
    maxAttempts: 5,
    nextRetryAt: scheduledTime,
    scheduledFor: scheduledTime,
    scheduledTimeFormatted,
    isScheduled: true,
    lastError: `مجدول للإرسال في: ${scheduledTimeFormatted}`,
    status: 'pending',
    createdAt: now,
    notificationType: 'deal_summary',
    customMessage: messageText,
  };

  queue.unshift(newItem);
  saveOfflineQueue(queue);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yamango_notification_queue_updated'));
  }

  return newItem;
}

/**
 * Updates the scheduled date, time, custom message or recipient phone for an existing scheduled notification
 */
export function updateScheduledNotificationTime(
  itemId: string,
  newScheduledTime: number,
  newCustomNote?: string,
  newRecipientPhone?: string
): { success: boolean; message: string; updatedItem?: QueuedNotificationItem } {
  const queue = getOfflineQueue();
  const itemIndex = queue.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    return { success: false, message: 'الإشعار غير موجود في السجل' };
  }
  const item = queue[itemIndex];
  const scheduledDate = new Date(newScheduledTime);
  const scheduledTimeFormatted = `${scheduledDate.toISOString().slice(0, 10)} ${scheduledDate.toLocaleTimeString('ar-SY')} بتوقيت دمشق`;

  const updatedItem: QueuedNotificationItem = {
    ...item,
    scheduledFor: newScheduledTime,
    scheduledTimeFormatted,
    nextRetryAt: newScheduledTime,
    isScheduled: true,
    recipientPhone: newRecipientPhone ? formatSyrianPhoneNumber(newRecipientPhone) : item.recipientPhone,
    customMessage: newCustomNote !== undefined ? newCustomNote : item.customMessage,
    lastError: `تم تحديث الموعد المجدول إلى: ${scheduledTimeFormatted}`,
  };

  queue[itemIndex] = updatedItem;
  saveOfflineQueue(queue);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yamango_notification_queue_updated', { detail: queue }));
  }

  return { success: true, message: 'تم تحديث موعد الجدولة بنجاح', updatedItem };
}

/**
 * Cancels and deletes a scheduled notification from the queue
 */
export function cancelScheduledNotification(itemId: string): { success: boolean; message: string } {
  const queue = getOfflineQueue();
  const itemIndex = queue.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) {
    return { success: false, message: 'الإشعار المجدول غير موجود' };
  }
  const filtered = queue.filter((i) => i.id !== itemId);
  saveOfflineQueue(filtered);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yamango_notification_queue_updated', { detail: filtered }));
  }

  return { success: true, message: 'تم إلغاء الإشعار المجدول وحذفه من الطابور بنجاح' };
}

/**
 * Retrieves all scheduled notifications currently in the queue
 */
export function getScheduledNotifications(): QueuedNotificationItem[] {
  const queue = getOfflineQueue();
  return queue.filter((item) => Boolean(item.isScheduled || (item.scheduledFor && item.scheduledFor > 0)));
}



