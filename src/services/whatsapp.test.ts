import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  formatSyrianPhoneNumber, 
  buildDealSummaryMessage, 
  createWhatsAppPayload, 
  generateWhatsAppDeeplink,
  sendDealSummaryNotification,
  calculateExponentialBackoff,
  getOfflineQueue,
  saveOfflineQueue,
  enqueueFailedNotification,
  clearOfflineQueue,
  processOfflineNotificationQueue,
  getStoredWhatsAppConfig,
  saveStoredWhatsAppConfig,
  maskAccessToken,
  testWhatsAppApiConnection,
  buildPromotionalBroadcastMessage,
  getNotificationStats,
  seedSampleNotificationsIfEmpty,
  manualRetryAllPending,
  manualRetrySingleItem,
  addTestNotificationToQueue,
  scheduleDealSummaryNotification,
  updateScheduledNotificationTime,
} from './whatsapp.ts';
import { Deal, InspectionReport } from '../types/index.ts';

const mockDeal: Deal = {
  id: 'deal_test_1',
  listingId: 'list_1',
  listingTitle: 'جرار زراعي بيلاروس Belarus 820',
  listingCategory: 'tractors',
  listingOperation: 'sale',
  buyerId: 'u1',
  buyerName: 'بهاء الدين مرشد',
  sellerId: 'u2',
  sellerName: 'أبو فهد الحناوي',
  agreedPrice: 9000,
  currency: 'USD',
  depositAmount: 900,
  platformCommissionRate: 0.025,
  platformCommissionAmount: 225,
  status: 'completed',
  secretOtp: 'YM-8492',
  receiptNumber: 'REC-KFR-99120',
  contract: {
    contractNumber: 'YMG-2026-0819',
    termsSummaryArabic: 'اتفاق بيع جرار زراعي في الكفر',
    qrVerificationHash: 'HASH_QR_VERIFIED',
    signedAt: '2026-10-25 12:00',
    buyerSignature: 'بهاء الدين مرشد (رقمي)',
    sellerSignature: 'أبو فهد الحناوي (رقمي)',
  },
  createdAt: 1000,
};

const mockReport: InspectionReport = {
  id: 'rep_test_1',
  requestId: 'req_1',
  listingId: 'list_1',
  garageId: 'gar_1',
  garageName: 'كراج الكفر الفني المعتمد',
  inspectorName: 'م. وسيم الصحناوي',
  date: '2026-10-24',
  overallScore: 94,
  verdict: 'excellent',
  recommendation: 'الجرار بحالة ممتازة ومطابق للمواصفات',
  isLocked: true,
  tamperProofHash: 'TAMPER_PROOF_HASH',
  photos: [],
  checklist: {
    engine: { status: 'pass', notes: 'سليم' },
    transmission: { status: 'pass', notes: 'سليم' },
    chassisAndBody: { status: 'pass', notes: 'سليم' },
    electrical: { status: 'pass', notes: 'سليم' },
    brakesAndTires: { status: 'pass', notes: 'سليم' },
    hydraulicsOrHours: { status: 'pass', notes: 'سليم' },
    previousAccidents: { found: false, notes: 'لا يوجد' },
  },
};

test('formatSyrianPhoneNumber sanitizes local Syrian numbers to E.164 +963', () => {
  assert.equal(formatSyrianPhoneNumber('0933456789'), '+963933456789');
  assert.equal(formatSyrianPhoneNumber('+963 944 112 233'), '+963944112233');
  assert.equal(formatSyrianPhoneNumber('00963955998877'), '+963955998877');
});

test('buildDealSummaryMessage includes key deal, contract, and inspection parameters', () => {
  const message = buildDealSummaryMessage(mockDeal, mockReport);
  assert.match(message, /منصة yamango/);
  assert.match(message, /YMG-2026-0819/);
  assert.match(message, /جرار زراعي بيلاروس Belarus 820/);
  assert.match(message, /9,000 USD/);
  assert.match(message, /كراج الكفر الفني المعتمد/);
  assert.match(message, /94\/100/);
  assert.match(message, /REC-KFR-99120/);
});

test('calculateExponentialBackoff calculates correct doubling and enforces ceiling', () => {
  // Attempt 1: 1000 * 2^0 = 1000
  assert.equal(calculateExponentialBackoff(1, 1000, 10000, false), 1000);
  // Attempt 2: 1000 * 2^1 = 2000
  assert.equal(calculateExponentialBackoff(2, 1000, 10000, false), 2000);
  // Attempt 3: 1000 * 2^2 = 4000
  assert.equal(calculateExponentialBackoff(3, 1000, 10000, false), 4000);
  // Attempt 4: 1000 * 2^3 = 8000
  assert.equal(calculateExponentialBackoff(4, 1000, 10000, false), 8000);
  // Attempt 5: 1000 * 2^4 = 16000 -> capped at 10000
  assert.equal(calculateExponentialBackoff(5, 1000, 10000, false), 10000);
});

test('enqueueFailedNotification stores notification in offline queue and calculate nextRetryAt', () => {
  clearOfflineQueue();
  const queued = enqueueFailedNotification(mockDeal, '0933456789', 'buyer', mockReport, 1, 'Network dropped');
  
  assert.equal(queued.dealId, 'deal_test_1');
  assert.equal(queued.attempts, 1);
  assert.equal(queued.status, 'pending');
  assert.ok(queued.nextRetryAt > Date.now());

  const queue = getOfflineQueue();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].dealId, 'deal_test_1');
  clearOfflineQueue();
});

test('processOfflineNotificationQueue handles pending items and advances retry attempts', async () => {
  clearOfflineQueue();
  // Enqueue an item whose retry is already due (now - 1000)
  const item = enqueueFailedNotification(mockDeal, '0933456789', 'buyer', mockReport, 1);
  item.nextRetryAt = Date.now() - 100;
  saveOfflineQueue([item]);

  // Process queue without live credentials -> should register retry attempt and schedule next backoff
  const stats = await processOfflineNotificationQueue(undefined);
  assert.equal(stats.processedCount, 1);
  
  const updatedQueue = getOfflineQueue();
  assert.equal(updatedQueue.length, 1);
  assert.equal(updatedQueue[0].attempts, 2);
  assert.equal(updatedQueue[0].status, 'retrying');
  assert.ok(updatedQueue[0].nextRetryAt > Date.now());
  clearOfflineQueue();
});

test('sendDealSummaryNotification falls back reliably without crashing on unconfigured API', async () => {
  const result = await sendDealSummaryNotification(
    mockDeal,
    '0933456789',
    'buyer',
    mockReport,
    undefined
  );

  assert.equal(result.success, true);
  assert.equal(result.channel, 'deeplink_fallback');
  assert.equal(result.recipientPhone, '+963933456789');
  assert.match(result.formattedMessage, /YMG-2026-0819/);
});

test('saveStoredWhatsAppConfig and getStoredWhatsAppConfig persist and retrieve admin keys', () => {
  const testCfg = {
    phoneNumberId: '109988776655',
    phoneNumber: '+963 933 111 222',
    accessToken: 'EAAGm0PX4ZB9wBO7ZCQw3ZC9YZB4ZA8vL928kd9283jkdf9823hdkf238910kdjsf8923',
    businessAccountId: '202030304040',
    apiVersion: 'v19.0',
    smsGatewayUrl: 'https://sms.syriatel.sy/api/gateway/v1/dispatch',
    maxRetries: 4,
    baseDelayMs: 600,
    maxDelayMs: 9000,
  };

  saveStoredWhatsAppConfig(testCfg);
  const loaded = getStoredWhatsAppConfig();

  assert.equal(loaded.phoneNumberId, '109988776655');
  assert.equal(loaded.phoneNumber, '+963 933 111 222');
  assert.equal(loaded.businessAccountId, '202030304040');
  assert.equal(loaded.isLiveActive, true);
  assert.equal(loaded.maxRetries, 4);
});

test('maskAccessToken properly obscures sensitive tokens for safe admin preview', () => {
  assert.equal(maskAccessToken(''), '');
  assert.equal(maskAccessToken('shortToken'), '••••••••••••');
  
  const longToken = 'EAAGm0PX4ZB9wBO7ZCQw3ZC9YZB4ZA8vL928kd9283jkdf9823hdkf238910kdjsf8923';
  const masked = maskAccessToken(longToken);
  assert.ok(masked.startsWith('EAAGm0P'));
  assert.ok(masked.endsWith('8923'));
  assert.ok(masked.includes('••••••••••••'));
});

test('testWhatsAppApiConnection validates missing credentials before making network calls', async () => {
  const emptyRes = await testWhatsAppApiConnection({});
  assert.equal(emptyRes.success, false);
  assert.match(emptyRes.message, /Phone Number ID/);

  const missingTokenRes = await testWhatsAppApiConnection({ phoneNumberId: '12345' });
  assert.equal(missingTokenRes.success, false);
  assert.match(missingTokenRes.message, /Access Token/);
});

test('buildPromotionalBroadcastMessage generates rich formatted promotional text with official contact', () => {
  const broadcast = buildPromotionalBroadcastMessage({
    listingTitle: 'تويوتا لاندكروزر 2021',
    price: 24500,
    currency: 'USD',
    location: 'بلدة الكفر - الحي الشرقي',
    promotionalPhone: '+963 933 718 290',
    listingUrl: 'https://yamango.sy/listings/lc2021',
    isInspected: true,
  });

  assert.match(broadcast, /إعلان ترويجي رسمي | منصة yamango/);
  assert.match(broadcast, /تويوتا لاندكروزر 2021/);
  assert.match(broadcast, /24,500 USD/);
  assert.match(broadcast, /بلدة الكفر - الحي الشرقي/);
  assert.match(broadcast, /\+963 933 718 290/);
  assert.match(broadcast, /كراجات yamango المعتمدة/);
});

test('saveStoredWhatsAppConfig preserves promotionalPhoneNumber and businessAccountId', () => {
  saveStoredWhatsAppConfig({
    phoneNumberId: '108492049182390',
    phoneNumber: '+963 933 718 290',
    promotionalPhoneNumber: '+963 933 718 290',
    accessToken: 'EAAGm0P_TEST_TOKEN_1234567890',
    businessAccountId: '192837465019283',
  });

  const config = getStoredWhatsAppConfig();
  assert.equal(config.promotionalPhoneNumber, '+963 933 718 290');
  assert.equal(config.businessAccountId, '192837465019283');
  assert.equal(config.isLiveActive, true);
});

test('seedSampleNotificationsIfEmpty seeds 4 representative items across Delivered, Pending, and Failed', () => {
  clearOfflineQueue();
  const seeded = seedSampleNotificationsIfEmpty();
  assert.equal(seeded.length, 4);

  const stats = getNotificationStats(seeded);
  assert.equal(stats.total, 4);
  assert.equal(stats.delivered, 1);
  assert.equal(stats.pending, 2);
  assert.equal(stats.failed, 1);
  assert.equal(stats.successRate, 50); // 1 delivered out of 2 finished (1 delivered + 1 failed)
});

test('manualRetryAllPending retries pending items in queue and marks them delivered on demo/fallback mode', async () => {
  clearOfflineQueue();
  seedSampleNotificationsIfEmpty();

  const beforeStats = getNotificationStats();
  assert.equal(beforeStats.pending, 2);

  const result = await manualRetryAllPending({
    phoneNumberId: '108492049182390',
    accessToken: 'EAAGm0PX4ZB9wBO7ZCQw3ZC9YZB4ZA8vL928kd9283jkdf9823hdkf238910kdjsf8923',
  });

  assert.equal(result.retriedCount, 2);
  assert.equal(result.deliveredCount, 2);

  const afterStats = getNotificationStats();
  assert.equal(afterStats.pending, 0);
  assert.equal(afterStats.delivered, 3);
  assert.equal(afterStats.failed, 1);
});

test('manualRetrySingleItem retries a specific queued notification by ID', async () => {
  clearOfflineQueue();
  const testItem = addTestNotificationToQueue('0933718290', 'buyer');
  assert.equal(testItem.status, 'pending');

  const res = await manualRetrySingleItem(testItem.id, {
    phoneNumberId: '108492049182390',
    accessToken: 'EAAGm0PX4ZB9wBO7ZCQw3ZC9YZB4ZA8vL928kd9283jkdf9823hdkf238910kdjsf8923',
  });

  assert.equal(res.success, true);
  assert.equal(res.updatedItem?.status, 'delivered');
});

test('scheduleDealSummaryNotification schedules notification for future date and updates stats.scheduled', () => {
  clearOfflineQueue();
  const futureTime = Date.now() + 24 * 3600 * 1000; // Tomorrow

  const scheduledItem = scheduleDealSummaryNotification(
    mockDeal,
    '0933718290',
    'buyer',
    futureTime,
    mockReport,
    'يرجى التنسيق المسبق مع كراج الكفر'
  );

  assert.equal(scheduledItem.isScheduled, true);
  assert.equal(scheduledItem.scheduledFor, futureTime);
  assert.equal(scheduledItem.recipientPhone, '+963933718290');
  assert.match(scheduledItem.customMessage || '', /ملاحظة المشرف الميداني/);
  assert.match(scheduledItem.customMessage || '', /يرجى التنسيق المسبق مع كراج الكفر/);
  assert.match(scheduledItem.scheduledTimeFormatted || '', /بتوقيت دمشق/);

  const stats = getNotificationStats();
  assert.equal(stats.total, 1);
  assert.equal(stats.scheduled, 1);
  assert.equal(stats.pending, 0); // Future items do not count towards active pending
  assert.equal(stats.delivered, 0);
});

test('processOfflineNotificationQueue skips future scheduled items', async () => {
  clearOfflineQueue();
  const futureTime = Date.now() + 48 * 3600 * 1000; // In 2 days

  scheduleDealSummaryNotification(
    mockDeal,
    '0944112233',
    'seller',
    futureTime,
    null
  );

  // Also add one regular pending item due for immediate retry
  const regularItem = addTestNotificationToQueue('0955998877', 'buyer');
  regularItem.nextRetryAt = Date.now() - 1000;
  const currentQ = getOfflineQueue();
  const itemIdx = currentQ.findIndex(i => i.id === regularItem.id);
  if (itemIdx !== -1) {
    currentQ[itemIdx] = regularItem;
    saveOfflineQueue(currentQ);
  }

  const beforeStats = getNotificationStats();
  assert.equal(beforeStats.total, 2);
  assert.equal(beforeStats.scheduled, 1);
  assert.equal(beforeStats.pending, 1);

  // Process offline queue
  const res = await processOfflineNotificationQueue({
    phoneNumberId: '108492049182390',
    accessToken: 'EAAGm0PX4ZB9wBO7ZCQw3ZC9YZB4ZA8vL928kd9283jkdf9823hdkf238910kdjsf8923',
  });

  // Only the 1 regular pending item should be delivered, scheduled remains untouched
  assert.equal(res.processedCount, 2);
  assert.equal(res.deliveredCount, 1);

  const afterStats = getNotificationStats();
  assert.equal(afterStats.scheduled, 1);
  assert.equal(afterStats.delivered, 1);
  assert.equal(afterStats.pending, 0);
});

test('updateScheduledNotificationTime modifies scheduled timestamp and formatted time', () => {
  clearOfflineQueue();
  const initialTime = Date.now() + 12 * 3600 * 1000;
  const newTime = Date.now() + 36 * 3600 * 1000;

  const item = scheduleDealSummaryNotification(
    mockDeal,
    '0933718290',
    'buyer',
    initialTime
  );

  const updateRes = updateScheduledNotificationTime(item.id, newTime);
  assert.equal(updateRes.success, true);
  assert.equal(updateRes.updatedItem?.scheduledFor, newTime);
  assert.match(updateRes.updatedItem?.scheduledTimeFormatted || '', /بتوقيت دمشق/);

  const queue = getOfflineQueue();
  assert.equal(queue[0].scheduledFor, newTime);
});



