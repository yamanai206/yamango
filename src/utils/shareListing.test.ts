import test from 'node:test';
import assert from 'node:assert/strict';
import { generateListingDynamicUrl, buildListingShareMessage, buildWhatsAppShareUrl, copyToClipboard } from './shareListing.ts';
import { Listing } from '../types/index.ts';

const sampleListing: Listing = {
  id: 'list_kafr_tractor_99',
  userId: 'usr_seller_1',
  sellerName: 'أبو فهد',
  sellerPhone: '0933112233',
  sellerRating: 4.9,
  title: 'جرار بيلاروس MTZ 82 بحالة ممتازة',
  category: 'tractors',
  operation: 'sale',
  make: 'Belarus',
  model: '82',
  year: 2021,
  metricType: 'work_hours',
  metricValue: 1400,
  priceAmount: 9500,
  currency: 'USD',
  zone: 'al_kafr',
  locationDetails: 'بلدة الكفر - الحي الجنوبي',
  images: [],
  ownershipVerified: true,
  inspectionStatus: 'inspected',
  isPromoted: true,
  promotionScope: 'al_kafr_only',
  viewsCount: 150,
  clicksCount: 45,
  inquiriesCount: 8,
  status: 'active',
  createdAt: 1700000000000,
};

test('generateListingDynamicUrl generates correct query parameter link with custom baseUrl', () => {
  const url = generateListingDynamicUrl(sampleListing.id, 'https://yamango.sy/market');
  assert.equal(url, 'https://yamango.sy/market?listing=list_kafr_tractor_99');
});

test('generateListingDynamicUrl falls back gracefully when window is undefined', () => {
  const url = generateListingDynamicUrl('test_item_123');
  assert.equal(url.includes('?listing=test_item_123'), true);
});

test('buildListingShareMessage generates informative Arabic message with title, price, zone and dynamic URL', () => {
  const shareUrl = 'https://yamango.sy/?listing=list_kafr_tractor_99';
  const msg = buildListingShareMessage(sampleListing, shareUrl);

  assert.equal(msg.includes('جرار بيلاروس MTZ 82'), true);
  assert.equal(msg.includes('بلدة الكفر'), true);
  assert.equal(msg.includes('للبيع القطعي'), true);
  assert.equal(msg.includes('9,500') || msg.includes('٩٬٥٠٠') || msg.includes('9500'), true);
  assert.equal(msg.includes('دولار أمريكي'), true);
  assert.equal(msg.includes('مفحوصة ومعتمدة فحصاً فنياً'), true);
  assert.equal(msg.includes(shareUrl), true);
});

test('buildWhatsAppShareUrl encodes text properly and creates valid WhatsApp URL', () => {
  const text = 'جرار للبيع في الكفر';
  const waUrl = buildWhatsAppShareUrl(text);
  assert.equal(waUrl.startsWith('https://api.whatsapp.com/send?text='), true);
  assert.equal(waUrl.includes(encodeURIComponent(text)), true);

  const directPhoneUrl = buildWhatsAppShareUrl(text, '+963933112233');
  assert.equal(directPhoneUrl.includes('phone=%2B963933112233') || directPhoneUrl.includes('phone=+963933112233'), true);
});

test('copyToClipboard safely executes in headless environment without crashing', async () => {
  const result = await copyToClipboard('https://yamango.sy/?listing=list_test_123');
  // In headless Node.js without DOM/clipboard API, it returns false safely without throwing errors
  assert.equal(typeof result, 'boolean');
});

