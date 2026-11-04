import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeArabicNLPText,
  tokenizeArabicWords,
  classifyUsedItemCategoryNLP,
} from './usedGoodsNLP.ts';

test('normalizeArabicNLPText correctly cleans diacritics and unifies Arabic letter variants', () => {
  const input = 'غَسّالَةُ إل جي أوتوماتيك ومِكْرُوويف مَمْتَازَةٌ؛ خَشَبٌ زَانٌ!';
  const normalized = normalizeArabicNLPText(input);

  // Checks that tashkeel is removed and letters are unified
  assert.equal(normalized.includes('َ'), false);
  assert.equal(normalized.includes('ُ'), false);
  assert.equal(normalized.includes('ِ'), false);
  assert.equal(normalized.includes('إ'), false);
  assert.equal(normalized.includes('أ'), false);
  assert.equal(normalized.includes('؛'), false);
  assert.equal(normalized.includes('!'), false);

  assert.ok(normalized.includes('غساله'));
  assert.ok(normalized.includes('اوتوماتيك'));
  assert.ok(normalized.includes('خشب'));
  assert.ok(normalized.includes('زان'));
});

test('tokenizeArabicWords strips common Arabic prefixes and stems plurals', () => {
  const text = 'والغسالات بالثلاجة كالطاولات للبطاريات';
  const tokens = tokenizeArabicWords(text);

  assert.ok(tokens.includes('غساله') || tokens.includes('غسالات'));
  assert.ok(tokens.includes('ثلاجه'));
  assert.ok(tokens.includes('طاولات') || tokens.includes('طاوله'));
  assert.ok(tokens.includes('بطاريات') || tokens.includes('بطاريه'));
});

test('classifyUsedItemCategoryNLP identifies home_appliances from description', () => {
  const desc = 'غسالة ال جي أوتوماتيك 9 كغ إنفرتر محرك دفع مباشر ونظام بخار ساخن مع برامج غسيل متعددة ونظيفة جداً';
  const result = classifyUsedItemCategoryNLP(desc, 'غسالة LG');

  assert.equal(result.suggestedCategory, 'home_appliances');
  assert.ok(result.confidence >= 70);
  assert.ok(result.isConfident);
  assert.ok(result.matchedKeywords.length > 0);
  assert.ok(result.explanation.includes('أدوات وأجهزة منزلية') || result.explanation.includes('منزلية'));
});

test('classifyUsedItemCategoryNLP identifies furniture from description', () => {
  const desc = 'طقم صالون كنبايات تركي خشب زان يتسع 7 أشخاص مع طاولة سفرة و6 كراسي رخام مبطنة بقماش مخمل';
  const result = classifyUsedItemCategoryNLP(desc, 'طقم كنب صالون');

  assert.equal(result.suggestedCategory, 'furniture');
  assert.ok(result.confidence >= 70);
  assert.ok(result.isConfident);
  assert.ok(result.matchedKeywords.length > 0);
  assert.ok(result.explanation.includes('أثاث ومفروشات'));
});

test('classifyUsedItemCategoryNLP identifies electronics from description', () => {
  const desc = 'لابتوب Dell Latitude Core i7 الجيل الحادي عشر رام 16 جيجا بايت مع شاحن تايب سي وشاشة 14 بوصة FHD كرتونة';
  const result = classifyUsedItemCategoryNLP(desc, 'لابتوب ديل للبيع');

  assert.equal(result.suggestedCategory, 'electronics');
  assert.ok(result.confidence >= 70);
  assert.ok(result.isConfident);
  assert.ok(result.matchedKeywords.some(k => k.includes('لابتوب') || k.includes('dell') || k.includes('core')));
});

test('classifyUsedItemCategoryNLP identifies solar_power from description', () => {
  const desc = 'منظومة طاقة شمسية كاملة: إنفرتر هجين 3.5KVA مع بطاريتين تيوبلر جل إكسايد 220Ah وألواح طاقة شمسية لونجي';
  const result = classifyUsedItemCategoryNLP(desc, 'طاقة شمسية إنفرتر');

  assert.equal(result.suggestedCategory, 'solar_power');
  assert.ok(result.confidence >= 75);
  assert.ok(result.isConfident);
  assert.ok(result.matchedKeywords.some(k => k.includes('طاقه') || k.includes('انفرتر') || k.includes('تيوبلر') || k.includes('شمسيه')));
});

test('classifyUsedItemCategoryNLP identifies tools from description', () => {
  const desc = 'دريل شاكوش شحن هيلتي ماكيتا ياباني أصلي 18V مع بطاريتين وشاحن سريع وطقم بوكسات ولقم ميكانيك 108 قطع';
  const result = classifyUsedItemCategoryNLP(desc, 'هيلتي ماكيتا عدة ورشة');

  assert.equal(result.suggestedCategory, 'tools');
  assert.ok(result.confidence >= 75);
  assert.ok(result.isConfident);
  assert.ok(result.matchedKeywords.some(k => k.includes('دريل') || k.includes('هيلتي') || k.includes('شاكوش') || k.includes('بوكسات') || k.includes('makita')));
});

test('classifyUsedItemCategoryNLP identifies other for general belongings', () => {
  const desc = 'دراجة هوائية جبلية مقاس 26 مع خوذة حماية وشنطة رحلات خلفية خفيفة الوزن';
  const result = classifyUsedItemCategoryNLP(desc, 'بسكليت دراجة هوائية');

  assert.equal(result.suggestedCategory, 'other');
  assert.ok(result.confidence >= 60);
  assert.ok(result.matchedKeywords.some(k => k.includes('دراجه') || k.includes('بسكليت') || k.includes('شنطه')));
});

test('classifyUsedItemCategoryNLP gracefully handles empty or non-specific text', () => {
  const result = classifyUsedItemCategoryNLP('', '');
  assert.equal(result.confidence, 0);
  assert.equal(result.isConfident, false);
  assert.equal(result.matchedKeywords.length, 0);
});
