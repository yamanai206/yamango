/**
 * Push Notification & Service Worker Service for yamango
 * As-Suwayda & Al-Kafr, Syria
 * 
 * Provides browser Push Notifications powered by Service Workers to ensure
 * new deal alerts, escrow changes, and garage inspections reach users
 * even when the application / browser tab is closed.
 */

import { Deal, ZoneLocation } from '../types';

export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface PushNotificationPreferences {
  enabled: boolean;
  dealAlerts: boolean; // تنبيهات الصفقات الجديدة
  escrowAlerts: boolean; // تنبيهات وساطة الضمان المالي وحجز العربون
  garageInspectionAlerts: boolean; // تنبيهات تقارير الفحص الفني
  priceDropAlerts: boolean; // تنبيهات تخفيض الأسعار والعروض
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  zones: ZoneLocation[]; // تصفية حسب النواحي والمناطق
}

export interface PushNotificationRecord {
  id: string;
  title: string;
  body: string;
  category: 'deal' | 'escrow' | 'garage' | 'system' | 'broadcast';
  timestamp: number;
  read: boolean;
  dealId?: string;
  data?: Record<string, any>;
}

const PREFS_STORAGE_KEY = 'yamango_push_preferences';
const HISTORY_STORAGE_KEY = 'yamango_push_history';

export const DEFAULT_PUSH_PREFERENCES: PushNotificationPreferences = {
  enabled: true,
  dealAlerts: true,
  escrowAlerts: true,
  garageInspectionAlerts: true,
  priceDropAlerts: true,
  soundEnabled: true,
  vibrationEnabled: true,
  zones: ['al_kafr', 'suwayda', 'shahba', 'salkhad'],
};

/**
 * Check if the browser supports Service Workers & Notifications
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): PushPermissionState {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission as PushPermissionState;
}

function getSafeStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return null;
}

/**
 * Get stored preferences or default
 */
export function getStoredPushPreferences(): PushNotificationPreferences {
  const storage = getSafeStorage();
  if (!storage) return DEFAULT_PUSH_PREFERENCES;
  try {
    const raw = storage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PUSH_PREFERENCES;
    return { ...DEFAULT_PUSH_PREFERENCES, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('Failed to parse push preferences, using default:', err);
    return DEFAULT_PUSH_PREFERENCES;
  }
}

/**
 * Save push preferences
 */
export function savePushPreferences(prefs: PushNotificationPreferences): void {
  const storage = getSafeStorage();
  if (!storage) return;
  try {
    storage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('yamango_push_prefs_changed', { detail: prefs }));
    }
  } catch (err) {
    console.warn('Failed to save push preferences:', err);
  }
}

/**
 * Get push notification history
 */
export function getPushHistory(): PushNotificationRecord[] {
  const storage = getSafeStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Add a record to push notification history
 */
export function addPushToHistory(record: Omit<PushNotificationRecord, 'id' | 'timestamp' | 'read'>): PushNotificationRecord {
  const history = getPushHistory();
  const newRecord: PushNotificationRecord = {
    id: `push_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    read: false,
    ...record,
  };

  const updated = [newRecord, ...history].slice(0, 50); // keep last 50
  const storage = getSafeStorage();
  if (storage) {
    try {
      storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('yamango_push_history_updated', { detail: updated }));
      }
    } catch (e) {
      console.warn('Failed to save push history:', e);
    }
  }

  return newRecord;
}

/**
 * Mark a notification as read
 */
export function markPushAsRead(id: string): void {
  const history = getPushHistory();
  const updated = history.map((item) => (item.id === id ? { ...item, read: true } : item));
  const storage = getSafeStorage();
  if (storage) {
    try {
      storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('yamango_push_history_updated', { detail: updated }));
      }
    } catch (e) {
      console.warn('Failed to update push history item:', e);
    }
  }
}

/**
 * Mark all notifications as read
 */
export function markAllPushAsRead(): void {
  const history = getPushHistory();
  const updated = history.map((item) => ({ ...item, read: true }));
  const storage = getSafeStorage();
  if (storage) {
    try {
      storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('yamango_push_history_updated', { detail: updated }));
      }
    } catch (e) {
      console.warn('Failed to clear push history:', e);
    }
  }
}

/**
 * Clear push notification history
 */
export function clearPushHistory(): void {
  const storage = getSafeStorage();
  if (storage) {
    try {
      storage.removeItem(HISTORY_STORAGE_KEY);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('yamango_push_history_updated', { detail: [] }));
      }
    } catch (e) {
      console.warn('Failed to clear push history:', e);
    }
  }
}

/**
 * Register Service Worker if supported
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) {
    console.warn('Service Worker or Notification API not supported in this browser environment.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.info('yamango Service Worker successfully registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Request Notification Permission from User
 */
export async function requestPushPermission(): Promise<PushPermissionState> {
  if (!isPushSupported()) {
    return 'unsupported';
  }

  try {
    // Register SW first or in parallel
    await registerServiceWorker();
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      const prefs = getStoredPushPreferences();
      prefs.enabled = true;
      savePushPreferences(prefs);
    }
    return result as PushPermissionState;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Helper to get active SW registration
 */
async function getReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

/**
 * Core function to show notification via Service Worker
 * (Ensures system notification shows even if browser tab is in background or minimized)
 */
export async function showBrowserNotification(
  title: string,
  options: NotificationOptions & { data?: Record<string, any> }
): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('Push not supported.');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted.');
    return false;
  }

  const prefs = getStoredPushPreferences();
  if (!prefs.enabled) {
    console.info('Push notifications currently disabled by user preference.');
    return false;
  }

  try {
    const reg = await getReadyRegistration();

    const mergedOptions: any = {
      icon: '/icon.svg',
      badge: '/icon.svg',
      dir: 'rtl',
      lang: 'ar',
      vibrate: prefs.vibrationEnabled ? [200, 100, 200] : undefined,
      silent: !prefs.soundEnabled,
      ...options,
    };

    if (reg && reg.showNotification) {
      await reg.showNotification(title, mergedOptions);
      return true;
    } else {
      // Fallback to legacy window Notification if SW is still booting
      new Notification(title, mergedOptions);
      return true;
    }
  } catch (err) {
    console.error('Error showing browser push notification:', err);
    return false;
  }
}

/**
 * Zone label in Arabic
 */
export function getZoneNameAr(zone?: ZoneLocation): string {
  switch (zone) {
    case 'al_kafr':
      return 'بلدة الكفر';
    case 'suwayda':
      return 'مدينة السويداء';
    case 'shahba':
      return 'مدينة شهبا';
    case 'salkhad':
      return 'مدينة صلخد';
    case 'al_qurayya':
      return 'بلدة القريّا';
    case 'ariqa':
      return 'ناحية عريقة';
    case 'mazraa':
      return 'المزرعة';
    default:
      return 'محافظة السويداء';
  }
}

/**
 * Send a Deal Push Notification
 * Fired when a new deal is posted, signed, or agreed upon
 */
export async function sendDealPushNotification(deal: Deal, customReason?: string): Promise<boolean> {
  const prefs = getStoredPushPreferences();
  if (!prefs.enabled || !prefs.dealAlerts) return false;

  const zoneName = getZoneNameAr(deal.zone);
  const formattedPrice = deal.agreedPrice.toLocaleString('ar-SY');
  const currencySymbol = deal.currency === 'USD' ? '$' : 'ل.س';

  const title = `صفقة جديدة في ${zoneName} 🚗`;
  const body = customReason || `تم تسجيل صفقة لـ "${deal.listingTitle}" بقيمة ${formattedPrice} ${currencySymbol}. اضغط للاطلاع على تفاصيل عقد الإسكرو.`;

  // Save to history
  addPushToHistory({
    title,
    body,
    category: 'deal',
    dealId: deal.id,
    data: {
      url: `/`,
      dealId: deal.id,
      zone: deal.zone,
    },
  });

  return showBrowserNotification(title, {
    body,
    tag: `deal-${deal.id}`,
    data: {
      url: `/`,
      dealId: deal.id,
      type: 'deal',
    },
  });
}

/**
 * Send Escrow & Contract Update Push Notification
 */
export async function sendEscrowPushNotification(
  dealNumber: string,
  titleText: string,
  message: string,
  dealId?: string
): Promise<boolean> {
  const prefs = getStoredPushPreferences();
  if (!prefs.enabled || !prefs.escrowAlerts) return false;

  const title = `تحديث الإسكرو | عقد ${dealNumber} 🛡️`;

  addPushToHistory({
    title,
    body: message,
    category: 'escrow',
    dealId,
    data: { dealNumber },
  });

  return showBrowserNotification(title, {
    body: message,
    tag: `escrow-${dealNumber}`,
    data: { dealId, dealNumber, type: 'escrow' },
  });
}

/**
 * Send Garage Inspection Push Notification
 */
export async function sendGarageInspectionPushNotification(
  garageName: string,
  vehicleTitle: string,
  resultSummary: string
): Promise<boolean> {
  const prefs = getStoredPushPreferences();
  if (!prefs.enabled || !prefs.garageInspectionAlerts) return false;

  const title = `جاهزية تقرير الفحص الفني 🔧`;
  const body = `أنهى "${garageName}" تقرير فحص "${vehicleTitle}": ${resultSummary}`;

  addPushToHistory({
    title,
    body,
    category: 'garage',
    data: { garageName, vehicleTitle },
  });

  return showBrowserNotification(title, {
    body,
    tag: `inspection-${Date.now()}`,
    data: { type: 'inspection' },
  });
}

/**
 * Send an Admin Broadcast Push Notification to all subscribed users
 */
export async function sendBroadcastPushNotification(
  title: string,
  body: string,
  category: 'deal' | 'escrow' | 'garage' | 'system' | 'broadcast' = 'broadcast'
): Promise<boolean> {
  addPushToHistory({
    title,
    body,
    category,
    data: { broadcastTime: Date.now() },
  });

  return showBrowserNotification(title, {
    body,
    tag: `broadcast-${Date.now()}`,
    data: { type: 'broadcast' },
  });
}

/**
 * Send a Test Push Notification
 * Ideal for users to verify their browser notifications immediately
 */
export async function sendTestPushNotification(): Promise<{ success: boolean; message: string }> {
  if (!isPushSupported()) {
    return {
      success: false,
      message: 'متصفحك الحالي لا يدعم ميزة دفع الإشعارات الفورية أو Service Workers.',
    };
  }

  if (Notification.permission === 'denied') {
    return {
      success: false,
      message: 'تم حظر الإشعارات من إعدادات المتصفح. يرجى السماح بالإشعارات من أيقونة القفل بجانب شريط العنوان.',
    };
  }

  if (Notification.permission !== 'granted') {
    const permission = await requestPushPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        message: 'لم يتم منح الإذن بتفعيل الإشعارات بالمتصفح.',
      };
    }
  }

  const sampleDeals = [
    {
      title: 'صفقة بيع جرار زراعي في بلدة الكفر 🚜',
      body: 'تم تسجيل صفقة جديدة لـ "جرار فيات 80-66 موديل 2004" بقيمة 14,500$ مع حجز العربون في نقطة الكفر.',
    },
    {
      title: 'صفقة تويوتا هايلوكس 4x4 في السويداء 🚙',
      body: 'تم إبرام عقد بيع معتمد مع فحص ميكانيكي كامل لدى "كراج السلامة - طريق قنوات".',
    },
    {
      title: 'عرض تأجير حفارة جنزير في صلخد 🏗️',
      body: 'صفقة تشغيل شهرية جديدة بقيمة 3,200$ مع توثيق إسكرو معتمد لدى منصة yamango.',
    },
  ];

  const picked = sampleDeals[Math.floor(Math.random() * sampleDeals.length)];

  const ok = await showBrowserNotification(picked.title, {
    body: picked.body,
    tag: `test-push-${Date.now()}`,
    data: {
      url: '/',
      isTest: true,
      timestamp: Date.now(),
    },
  });

  addPushToHistory({
    title: picked.title,
    body: picked.body,
    category: 'deal',
    data: { isTest: true },
  });

  return {
    success: ok,
    message: ok
      ? 'تم إرسال إشعار الدفع التجريبي بنجاح عبر Service Worker! تحقق من مركز إشعارات نظامك أو شريط المهام.'
      : 'تعذر إرسال الإشعار، يرجى التأكد من تمكين خيارات الإشعارات.',
  };
}

/**
 * Setup listener for messages from Service Worker
 */
export function initServiceWorkerMessageListener(onNotificationClick?: (data: any) => void): () => void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
      console.info('Notification clicked payload received:', event.data.data);
      if (onNotificationClick) {
        onNotificationClick(event.data.data);
      }
    }
  };

  navigator.serviceWorker.addEventListener('message', handleMessage);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handleMessage);
  };
}
