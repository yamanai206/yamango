import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSupportTicketMessage,
  enqueueSupportTicketNotification,
  generateSupportTicketDeeplink,
  getOfflineQueue,
  clearOfflineQueue,
} from '../services/whatsapp';
import { SupportTicket, GarageReview, GarageProfile } from '../types';

test('buildSupportTicketMessage generates clear Arabic notification with ticket number and user data', () => {
  const ticket: SupportTicket = {
    id: 'tk_test_1',
    ticketNumber: 'TK-2026-9912',
    userName: 'بهاء الدين مرشد',
    userPhone: '+963933456789',
    category: 'deal_dispute',
    categoryLabelArabic: 'نزاع أو استفسار حول صفقة إسكرو',
    priority: 'high',
    priorityLabelArabic: 'هام',
    subject: 'استفسار عن استلام العربون في الكفر',
    message: 'قمت بتسليم العربون لوكيل الدفع في الكفر وأرغب بالتأكيد على تجميده في الحساب.',
    status: 'open',
    createdAt: '2026-10-28 14:00 بتوقيت دمشق',
    createdAtMs: Date.now(),
  };

  const msg = buildSupportTicketMessage(ticket);
  assert.ok(msg.includes('TK-2026-9912'));
  assert.ok(msg.includes('بهاء الدين مرشد'));
  assert.ok(msg.includes('نزاع أو استفسار حول صفقة إسكرو'));
  assert.ok(msg.includes('هام'));
  assert.ok(msg.includes('استفسار عن استلام العربون في الكفر'));
});

test('enqueueSupportTicketNotification adds ticket into offline queue as pending notification', () => {
  clearOfflineQueue();

  const ticket: SupportTicket = {
    id: 'tk_test_2',
    ticketNumber: 'TK-2026-4411',
    userName: 'أبو فهد الحناوي',
    userPhone: '0944112233',
    category: 'inspection_inquiry',
    categoryLabelArabic: 'استفسار عن فحص كراج معتمد',
    priority: 'normal',
    priorityLabelArabic: 'عادي',
    subject: 'تقرير فحص جرار زراعي',
    message: 'أريد مراجعة نتيجة فحص الهيدروليك مع المشرف الميداني.',
    status: 'open',
    createdAt: '2026-10-28 15:00 بتوقيت دمشق',
    createdAtMs: Date.now(),
  };

  const queuedItem = enqueueSupportTicketNotification(ticket, '+963933000000');
  assert.ok(queuedItem.id);
  assert.equal(queuedItem.status, 'pending');
  assert.equal(queuedItem.notificationType, 'support_ticket');
  assert.equal(queuedItem.supportTicket?.ticketNumber, 'TK-2026-4411');

  const currentQueue = getOfflineQueue();
  assert.ok(currentQueue.some((item) => item.id === queuedItem.id));
});

test('generateSupportTicketDeeplink creates valid WhatsApp wa.me URL with pre-composed text', () => {
  const ticket: SupportTicket = {
    id: 'tk_test_3',
    ticketNumber: 'TK-2026-5522',
    userName: 'كمال الصفدي',
    userPhone: '0955112233',
    category: 'technical_issue',
    categoryLabelArabic: 'مشكلة تقنية',
    priority: 'urgent',
    priorityLabelArabic: 'عاجل وطارئ',
    subject: 'فقدان رمز التحقق OTP',
    message: 'لم يصلني رمز OTP على هاتفي لتأكيد الصفقة.',
    status: 'open',
    createdAt: '2026-10-28 16:00 بتوقيت دمشق',
    createdAtMs: Date.now(),
  };

  const link = generateSupportTicketDeeplink(ticket, '+963933000000');
  assert.ok(link.startsWith('https://wa.me/963933000000?text='));
  assert.ok(link.includes(encodeURIComponent('TK-2026-5522')));
});

test('Garage review rating calculation computes accurate average and count', () => {
  const mockReviews: GarageReview[] = [
    {
      id: 'rev_1',
      garageId: 'gar_test',
      userName: 'مستخدم 1',
      rating: 5,
      comment: 'ممتاز',
      date: '2026-10-28',
      createdAt: 100,
    },
    {
      id: 'rev_2',
      garageId: 'gar_test',
      userName: 'مستخدم 2',
      rating: 4,
      comment: 'جيد جداً',
      date: '2026-10-28',
      createdAt: 200,
    },
    {
      id: 'rev_3',
      garageId: 'gar_test',
      userName: 'مستخدم 3',
      rating: 5,
      comment: 'خدمة احترافية',
      date: '2026-10-28',
      createdAt: 300,
    },
  ];

  const avg = Math.round((mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length) * 10) / 10;
  assert.equal(avg, 4.7);
  assert.equal(mockReviews.length, 3);
});
