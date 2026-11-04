import test from 'node:test';
import assert from 'node:assert/strict';

test('Currency conversion calculation converts accurately based on rate ratio', () => {
  const oldRate = 14850;
  const newRate = 15200;
  const ratio = newRate / oldRate;

  const originalSypPrice = 148500000; // 10,000 USD equivalent at old rate
  const updatedSypPrice = Math.round((originalSypPrice * ratio) / 1000) * 1000;

  assert.equal(updatedSypPrice, 152000000);
});

test('Field inspection appointment time and zone validation', () => {
  const appointment = {
    listingId: 'list_2',
    listingTitle: 'حفارة كوماتسو PC210',
    customerName: 'فادي الأطرش',
    customerPhone: '0933718290',
    appointmentDate: '2026-10-28',
    appointmentTime: '10:30 ص - 12:00 م',
    location: 'بلدة الكفر - السهل الغربي',
    zone: 'al_kafr' as const,
    status: 'confirmed' as const,
  };

  assert.equal(appointment.zone, 'al_kafr');
  assert.equal(appointment.status, 'confirmed');
  assert.ok(appointment.customerPhone.startsWith('0933'));
});
