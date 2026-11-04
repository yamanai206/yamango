import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getOfflineQueue,
  saveOfflineQueue,
  scheduleDealSummaryNotification,
  updateScheduledNotificationTime,
  cancelScheduledNotification,
  getScheduledNotifications,
  QueuedNotificationItem,
} from '../services/whatsapp';
import { Deal } from '../types';

const testDeal: Deal = {
  id: 'deal_test_sched_99',
  listingId: 'list_1',
  listingTitle: 'جرار بيلاروس 820 مجهز لكروم الكفر',
  listingCategory: 'tractors',
  listingOperation: 'sale',
  buyerId: 'u_buyer_1',
  buyerName: 'بهاء الدين مرشد',
  buyerPhone: '0933456789',
  sellerId: 'u_seller_1',
  sellerName: 'أبو فهد الحناوي',
  sellerPhone: '0944112233',
  agreedPrice: 8500,
  currency: 'USD',
  status: 'escrow_pending',
  depositAmount: 500,
  platformCommissionRate: 0.015,
  platformCommissionAmount: 127.5,
  secretOtp: 'YM-9921',
  contract: {
    contractNumber: 'YMG-2026-0819',
    qrVerificationHash: 'mock-hash-123',
    signedAt: '2026-10-31',
    termsSummaryArabic: 'اتفاق بيع جرار زراعي',
  },
  zone: 'al_kafr',
  createdAt: Date.now(),
};

test('scheduleDealSummaryNotification schedules an item in future and marks isScheduled=true', () => {
  const futureTime = Date.now() + 3600 * 1000 * 24; // tomorrow
  const item = scheduleDealSummaryNotification(
    testDeal,
    '0933456789',
    'buyer',
    futureTime,
    null,
    'ملاحظة تجريبية للمشتري في الكفر'
  );

  assert.ok(item.id.startsWith('q_sched_'));
  assert.equal(item.isScheduled, true);
  assert.equal(item.scheduledFor, futureTime);
  assert.equal(item.recipientPhone, '+963933456789');
  assert.equal(item.status, 'pending');

  const allScheduled = getScheduledNotifications();
  const found = allScheduled.find((i) => i.id === item.id);
  assert.ok(found);
});

test('updateScheduledNotificationTime updates target time, custom note, and phone number', () => {
  const initialTime = Date.now() + 3600 * 1000 * 12;
  const item = scheduleDealSummaryNotification(
    testDeal,
    '0933456789',
    'buyer',
    initialTime
  );

  const newTargetTime = Date.now() + 3600 * 1000 * 48;
  const updateRes = updateScheduledNotificationTime(
    item.id,
    newTargetTime,
    'ملاحظة جديدة محدثة',
    '0944112233'
  );

  assert.equal(updateRes.success, true);
  assert.ok(updateRes.updatedItem);
  assert.equal(updateRes.updatedItem.scheduledFor, newTargetTime);
  assert.equal(updateRes.updatedItem.recipientPhone, '+963944112233');
  assert.equal(updateRes.updatedItem.customMessage, 'ملاحظة جديدة محدثة');

  // Verify in queue
  const queue = getOfflineQueue();
  const updatedInQueue = queue.find((i) => i.id === item.id);
  assert.equal(updatedInQueue?.scheduledFor, newTargetTime);
});

test('cancelScheduledNotification removes item from the queue and updates count', () => {
  const futureTime = Date.now() + 3600 * 1000 * 30;
  const item = scheduleDealSummaryNotification(
    testDeal,
    '0955998877',
    'seller',
    futureTime
  );

  const beforeCancel = getScheduledNotifications();
  assert.ok(beforeCancel.some((i) => i.id === item.id));

  const cancelRes = cancelScheduledNotification(item.id);
  assert.equal(cancelRes.success, true);

  const afterCancel = getScheduledNotifications();
  assert.ok(!afterCancel.some((i) => i.id === item.id));
});

test('cancelScheduledNotification returns error when given non-existent id', () => {
  const cancelRes = cancelScheduledNotification('non_existent_id_9999');
  assert.equal(cancelRes.success, false);
});
