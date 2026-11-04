import { UsedItemCategory } from '../types';
import { USED_CATEGORY_LABELS } from './usedGoods';

export interface NLPCategoryResult {
  suggestedCategory: UsedItemCategory;
  categoryLabel: string;
  confidence: number; // 0 to 100 percentage
  matchedKeywords: string[];
  explanation: string;
  scores: Record<UsedItemCategory, number>;
  isConfident: boolean; // true if confidence >= 45 and matched keywords exist
}

/**
 * Normalizes Arabic text for robust NLP matching:
 * - Unifies Hamza shapes (أ, إ, آ, ٱ -> ا)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Normalizes Alif Maqsura (ى -> ي)
 * - Strips Harakat / Tashkeel & Tatweel
 * - Converts Latin characters to lowercase
 */
export function normalizeArabicNLPText(text: string): string {
  if (!text) return '';

  return text
    .toLowerCase()
    // Remove Arabic diacritics (Tashkeel, Tanween, Shaddah, Sukun)
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    // Remove Tatweel / Kashida
    .replace(/\u0640/g, '')
    // Normalize Alif forms
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbuta
    .replace(/ة/g, 'ه')
    // Normalize Alif Maqsura
    .replace(/ى/g, 'ي')
    // Remove Arabic and standard punctuation
    .replace(/[،؛؟.,!?:;'"()[\]{}\-_/\\`~@#$%^&*+=|<>]/g, ' ')
    .replace(/[^\w\s\u0621-\u064A]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits text into tokens and stemmed word representations
 */
export function tokenizeArabicWords(text: string): string[] {
  const normalized = normalizeArabicNLPText(text);
  if (!normalized) return [];

  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const stemmedTokens: string[] = [];

  for (const token of rawTokens) {
    stemmedTokens.push(token);

    // Strip Arabic 'لل' (lil-) prefix
    if (token.startsWith('لل') && token.length > 3) {
      const strippedLil = token.slice(2);
      stemmedTokens.push(strippedLil);
      if (strippedLil.endsWith('ات') && strippedLil.length > 3) {
        stemmedTokens.push(strippedLil.slice(0, -2));
        stemmedTokens.push(strippedLil.slice(0, -2) + 'ه');
      }
    }

    // Strip common Arabic prefixes: ال (al-), و (wa-), ف (fa-), ب (bi-), ك (ka-), ل (li-)
    if (token.startsWith('ال') && token.length > 3) {
      stemmedTokens.push(token.slice(2));
    } else if (token.length > 3 && (token.startsWith('و') || token.startsWith('ف') || token.startsWith('ب') || token.startsWith('ك') || token.startsWith('ل'))) {
      const stripped = token.slice(1);
      stemmedTokens.push(stripped);
      if (stripped.startsWith('ال') && stripped.length > 3) {
        stemmedTokens.push(stripped.slice(2));
      }
    }

    // Stem common plural endings: ات (aat), ين (een), ون (oon)
    if (token.endsWith('ات') && token.length > 4) {
      stemmedTokens.push(token.slice(0, -2));
      stemmedTokens.push(token.slice(0, -2) + 'ه');
    }
  }

  return Array.from(new Set(stemmedTokens));
}

interface CategorySemanticDefinition {
  phrases: { phrase: string; weight: number }[];
  strongKeywords: { word: string; weight: number }[];
  contextKeywords: { word: string; weight: number }[];
}

const CATEGORY_LEXICON: Record<UsedItemCategory, CategorySemanticDefinition> = {
  home_appliances: {
    phrases: [
      { phrase: 'ادوات منزليه', weight: 8 },
      { phrase: 'اجهزه منزليه', weight: 8 },
      { phrase: 'ادوات مطبخ', weight: 7 },
      { phrase: 'غساله اوتوماتيك', weight: 9 },
      { phrase: 'غساله ال جي', weight: 9 },
      { phrase: 'براد هيتاشي', weight: 9 },
      { phrase: 'براد بابين', weight: 8 },
      { phrase: 'فرن غاز', weight: 8 },
      { phrase: 'فرن كهربائي', weight: 8 },
      { phrase: 'ماكينه قهوه', weight: 7 },
      { phrase: 'طباخ ليزري', weight: 7 },
      { phrase: 'سخان ماء', weight: 8 },
      { phrase: 'مكيف هواء', weight: 8 },
      { phrase: 'جلايه صحون', weight: 9 },
      { phrase: 'مكنسه كهربائيه', weight: 8 },
      { phrase: 'نو فروست', weight: 6 },
      { phrase: 'direct drive', weight: 7 },
    ],
    strongKeywords: [
      { word: 'غساله', weight: 6 },
      { word: 'براد', weight: 6 },
      { word: 'ثلاجه', weight: 6 },
      { word: 'فريزر', weight: 6 },
      { word: 'فرن', weight: 6 },
      { word: 'ميكروويف', weight: 6 },
      { word: 'ماكرويف', weight: 6 },
      { word: 'جلايه', weight: 6 },
      { word: 'مكنسه', weight: 5 },
      { word: 'مكواه', weight: 5 },
      { word: 'كيزر', weight: 6 },
      { word: 'سخان', weight: 5 },
      { word: 'طباخ', weight: 5 },
      { word: 'خلاط', weight: 5 },
      { word: 'عجانه', weight: 5 },
      { word: 'عصاره', weight: 5 },
      { word: 'قلايه', weight: 5 },
      { word: 'مروحه', weight: 4 },
      { word: 'مكيف', weight: 5 },
      { word: 'شفاط', weight: 4 },
      { word: 'دفايه', weight: 5 },
      { word: 'صوبه', weight: 5 },
    ],
    contextKeywords: [
      { word: 'مطبخ', weight: 2 },
      { word: 'طبخ', weight: 2 },
      { word: 'تبريد', weight: 3 },
      { word: 'تجميد', weight: 3 },
      { word: 'تسخين', weight: 2 },
      { word: 'غسيل', weight: 3 },
      { word: 'صحون', weight: 2 },
      { word: 'ملابس', weight: 1 },
      { word: 'حراره', weight: 1 },
      { word: 'بخار', weight: 2 },
      { word: 'ستانلس', weight: 2 },
      { word: 'hitachi', weight: 4 },
      { word: 'beko', weight: 4 },
      { word: 'arcelik', weight: 4 },
      { word: 'braun', weight: 3 },
      { word: 'philips', weight: 3 },
      { word: 'kenwood', weight: 3 },
    ],
  },
  furniture: {
    phrases: [
      { phrase: 'طقم صالون', weight: 9 },
      { phrase: 'طقم كنبايات', weight: 9 },
      { phrase: 'طقم كنب', weight: 9 },
      { phrase: 'طقم جلوس', weight: 8 },
      { phrase: 'غرفه نوم', weight: 9 },
      { phrase: 'غرف نوم', weight: 9 },
      { phrase: 'طاوله طعام', weight: 8 },
      { phrase: 'طاوله سفره', weight: 8 },
      { phrase: 'كراسي سفره', weight: 7 },
      { phrase: 'خشب زان', weight: 7 },
      { phrase: 'خشب سويد', weight: 6 },
      { phrase: 'خشب بلوط', weight: 7 },
      { phrase: 'رخام طبيعي', weight: 5 },
      { phrase: 'خزانه ملابس', weight: 8 },
      { phrase: 'طاوله ضيافه', weight: 7 },
      { phrase: 'طاوله وسط', weight: 6 },
    ],
    strongKeywords: [
      { word: 'كنب', weight: 6 },
      { word: 'كنبايه', weight: 6 },
      { word: 'صالون', weight: 6 },
      { word: 'طاوله', weight: 5 },
      { word: 'سفره', weight: 6 },
      { word: 'كرسي', weight: 5 },
      { word: 'تخت', weight: 6 },
      { word: 'سرير', weight: 6 },
      { word: 'خزانه', weight: 6 },
      { word: 'بوفيه', weight: 6 },
      { word: 'سريحه', weight: 5 },
      { word: 'كومودينه', weight: 5 },
      { word: 'سجاد', weight: 5 },
      { word: 'موكيت', weight: 5 },
      { word: 'برادي', weight: 4 },
      { word: 'ستائر', weight: 4 },
      { word: 'مكتب', weight: 4 },
      { word: 'رفوف', weight: 3 },
      { word: 'مكتبه', weight: 4 },
    ],
    contextKeywords: [
      { word: 'مفروشات', weight: 4 },
      { word: 'اثاث', weight: 4 },
      { word: 'خشب', weight: 3 },
      { word: 'مخمل', weight: 3 },
      { word: 'قماش', weight: 2 },
      { word: 'جلد', weight: 2 },
      { word: 'اسفنج', weight: 3 },
      { word: 'تنجيد', weight: 3 },
      { word: 'مقاعد', weight: 3 },
      { word: 'مقعد', weight: 3 },
      { word: 'ضيافه', weight: 2 },
      { word: 'درفه', weight: 3 },
      { word: 'درف', weight: 3 },
      { word: 'زان', weight: 3 },
      { word: 'بلوط', weight: 3 },
    ],
  },
  electronics: {
    phrases: [
      { phrase: 'شاشه سمارت', weight: 8 },
      { phrase: 'تلفزيون سمارت', weight: 8 },
      { phrase: 'جهاز لابتوب', weight: 8 },
      { phrase: 'حاسوب محمول', weight: 8 },
      { phrase: 'كمبيوتر مكتبي', weight: 8 },
      { phrase: 'هاتف ذكي', weight: 7 },
      { phrase: 'جوال ذكي', weight: 7 },
      { phrase: 'بلايستيشن 4', weight: 8 },
      { phrase: 'بلايستيشن 5', weight: 8 },
      { phrase: 'اكس بوكس', weight: 8 },
      { phrase: 'سماعات بلوتوث', weight: 7 },
      { phrase: 'راوتر انترنت', weight: 7 },
      { phrase: 'شاشه سامسونج', weight: 8 },
      { phrase: 'شاشه ال جي', weight: 8 },
      { phrase: 'dell latitude', weight: 8 },
      { phrase: 'core i7', weight: 7 },
      { phrase: 'core i5', weight: 7 },
      { phrase: '4k uhd', weight: 7 },
      { phrase: 'smart tv', weight: 8 },
    ],
    strongKeywords: [
      { word: 'شاشه', weight: 5 },
      { word: 'تلفزيون', weight: 6 },
      { word: 'تلفاز', weight: 6 },
      { word: 'لابتوب', weight: 6 },
      { word: 'حاسوب', weight: 6 },
      { word: 'كمبيوتر', weight: 6 },
      { word: 'هاتف', weight: 5 },
      { word: 'جوال', weight: 5 },
      { word: 'موبايل', weight: 5 },
      { word: 'ايفون', weight: 6 },
      { word: 'شاومي', weight: 6 },
      { word: 'ريدمي', weight: 6 },
      { word: 'تابلت', weight: 6 },
      { word: 'ايباد', weight: 6 },
      { word: 'كيبورد', weight: 5 },
      { word: 'ماوس', weight: 4 },
      { word: 'سماعات', weight: 5 },
      { word: 'سماعه', weight: 5 },
      { word: 'راوتر', weight: 6 },
      { word: 'مودم', weight: 5 },
      { word: 'ريسيفر', weight: 5 },
      { word: 'بلايستيشن', weight: 6 },
      { word: 'كاميرا', weight: 5 },
    ],
    contextKeywords: [
      { word: 'الكترونيات', weight: 4 },
      { word: 'الكتروني', weight: 3 },
      { word: 'بوصه', weight: 3 },
      { word: 'انش', weight: 3 },
      { word: 'رام', weight: 4 },
      { word: 'ssd', weight: 4 },
      { word: 'nvme', weight: 4 },
      { word: 'intel', weight: 4 },
      { word: 'dell', weight: 5 },
      { word: 'hp', weight: 4 },
      { word: 'lenovo', weight: 4 },
      { word: 'apple', weight: 4 },
      { word: 'iphone', weight: 5 },
      { word: 'samsung', weight: 3 },
      { word: 'android', weight: 3 },
      { word: 'ios', weight: 3 },
      { word: 'hdmi', weight: 3 },
      { word: 'usb', weight: 2 },
      { word: '4k', weight: 4 },
      { word: 'fhd', weight: 3 },
      { word: 'بلوتوث', weight: 3 },
      { word: 'واي فاي', weight: 3 },
      { word: 'كرتونه', weight: 2 },
    ],
  },
  solar_power: {
    phrases: [
      { phrase: 'طاقه شمسيه', weight: 10 },
      { phrase: 'منظومه طاقه', weight: 9 },
      { phrase: 'الواح شمسيه', weight: 9 },
      { phrase: 'لوح شمسي', weight: 9 },
      { phrase: 'شاحن شمسي', weight: 8 },
      { phrase: 'بطاريات تيوبلر', weight: 9 },
      { phrase: 'بطاريات جل', weight: 8 },
      { phrase: 'بطاريات ليثيوم', weight: 9 },
      { phrase: 'انفرتر هجين', weight: 9 },
      { phrase: 'انفرتر شمسي', weight: 9 },
      { phrase: 'طاقه بديله', weight: 8 },
      { phrase: 'منظم شحن', weight: 8 },
      { phrase: 'طاقه كهربائيه', weight: 6 },
    ],
    strongKeywords: [
      { word: 'انفرتر', weight: 7 },
      { word: 'بطاريه', weight: 6 },
      { word: 'تيوبلر', weight: 7 },
      { word: 'ليثيوم', weight: 7 },
      { word: 'الواح', weight: 6 },
      { word: 'شمسيه', weight: 6 },
      { word: 'شمسي', weight: 6 },
      { word: 'mppt', weight: 7 },
      { word: 'pwm', weight: 6 },
      { word: 'kva', weight: 5 },
      { word: 'felicity', weight: 6 },
      { word: 'tubular', weight: 6 },
    ],
    contextKeywords: [
      { word: 'طاقه', weight: 4 },
      { word: 'شحن', weight: 3 },
      { word: 'تفريغ', weight: 3 },
      { word: 'هجين', weight: 4 },
      { word: 'فولت', weight: 3 },
      { word: 'امبير', weight: 3 },
      { word: 'واط', weight: 3 },
      { word: 'قواطع', weight: 2 },
      { word: 'منظومه', weight: 3 },
      { word: 'محول', weight: 3 },
      { word: 'كابلات', weight: 2 },
      { word: 'longi', weight: 5 },
      { word: 'trina', weight: 5 },
      { word: 'must', weight: 4 },
      { word: 'voltronic', weight: 4 },
    ],
  },
  tools: {
    phrases: [
      { phrase: 'عده ورشه', weight: 9 },
      { phrase: 'عده ميكانيك', weight: 9 },
      { phrase: 'عده نجاره', weight: 9 },
      { phrase: 'طقم لقم', weight: 8 },
      { phrase: 'طقم بوكسات', weight: 8 },
      { phrase: 'ماكينه لحام', weight: 9 },
      { phrase: 'صاروخ قص', weight: 8 },
      { phrase: 'صاروخ جخ', weight: 8 },
      { phrase: 'فرد دهان', weight: 7 },
      { phrase: 'مقص حديد', weight: 7 },
      { phrase: 'ميزان ماء', weight: 6 },
      { phrase: 'شنطه عده', weight: 7 },
      { phrase: 'كروم فاناديوم', weight: 7 },
      { phrase: 'دريل شاكوش', weight: 8 },
    ],
    strongKeywords: [
      { word: 'هيلتي', weight: 7 },
      { word: 'شنيور', weight: 7 },
      { word: 'دريل', weight: 7 },
      { word: 'شاكوش', weight: 6 },
      { word: 'مطرقه', weight: 6 },
      { word: 'منشار', weight: 6 },
      { word: 'لحام', weight: 6 },
      { word: 'كمبريسور', weight: 6 },
      { word: 'كمبروسر', weight: 6 },
      { word: 'بوكسات', weight: 6 },
      { word: 'لقم', weight: 6 },
      { word: 'بنسه', weight: 5 },
      { word: 'زراديه', weight: 5 },
      { word: 'مفك', weight: 5 },
      { word: 'مفتاح', weight: 5 },
      { word: 'صاروخ', weight: 5 },
      { word: 'makita', weight: 6 },
      { word: 'dewalt', weight: 6 },
      { word: 'crown', weight: 5 },
      { word: 'ingco', weight: 5 },
      { word: 'total', weight: 4 },
    ],
    contextKeywords: [
      { word: 'عده', weight: 4 },
      { word: 'معدات', weight: 3 },
      { word: 'ادوات', weight: 2 },
      { word: 'ورشه', weight: 4 },
      { word: 'ورشات', weight: 4 },
      { word: 'ميكانيك', weight: 3 },
      { word: 'نجاره', weight: 3 },
      { word: 'ثقب', weight: 3 },
      { word: 'باطون', weight: 3 },
      { word: 'حديد', weight: 2 },
      { word: 'براغي', weight: 2 },
      { word: 'صواميل', weight: 2 },
      { word: 'فاناديوم', weight: 3 },
    ],
  },
  other: {
    phrases: [
      { phrase: 'دراجه هوائيه', weight: 8 },
      { phrase: 'العاب اطفال', weight: 7 },
      { phrase: 'ادوات رياضيه', weight: 7 },
      { phrase: 'كتب وروايات', weight: 7 },
    ],
    strongKeywords: [
      { word: 'دراجه', weight: 6 },
      { word: 'بسكليت', weight: 6 },
      { word: 'سيكل', weight: 6 },
      { word: 'كتب', weight: 5 },
      { word: 'كتاب', weight: 5 },
      { word: 'روايه', weight: 5 },
      { word: 'شنطه', weight: 4 },
      { word: 'حقيبه', weight: 4 },
      { word: 'ساعه', weight: 4 },
      { word: 'نظارات', weight: 4 },
      { word: 'خيمه', weight: 5 },
      { word: 'العاب', weight: 4 },
    ],
    contextKeywords: [
      { word: 'مقتنيات', weight: 3 },
      { word: 'اكسسوارات', weight: 3 },
      { word: 'متنوع', weight: 2 },
      { word: 'اغراض', weight: 1 },
      { word: 'رياضه', weight: 3 },
      { word: 'هوايه', weight: 2 },
      { word: 'انتيك', weight: 3 },
      { word: 'تحف', weight: 3 },
    ],
  },
};

/**
 * Classifies used item category using Natural Language Processing (NLP)
 * analyzing both description and title.
 */
export function classifyUsedItemCategoryNLP(
  description: string,
  title: string = ''
): NLPCategoryResult {
  const combinedText = `${title} ${description}`.trim();
  const normalizedCombined = normalizeArabicNLPText(combinedText);
  const normalizedTitle = normalizeArabicNLPText(title);
  const tokens = tokenizeArabicWords(combinedText);

  const scores: Record<UsedItemCategory, number> = {
    home_appliances: 0,
    furniture: 0,
    electronics: 0,
    solar_power: 0,
    tools: 0,
    other: 0,
  };

  const matchedKeywordsByCategory: Record<UsedItemCategory, string[]> = {
    home_appliances: [],
    furniture: [],
    electronics: [],
    solar_power: [],
    tools: [],
    other: [],
  };

  // If input is practically empty, return default fallback
  if (!normalizedCombined || tokens.length === 0) {
    return {
      suggestedCategory: 'home_appliances',
      categoryLabel: USED_CATEGORY_LABELS.home_appliances.label,
      confidence: 0,
      matchedKeywords: [],
      explanation: 'لم يتم إدخال وصف كافٍ بعد لتحديد التصنيف التلقائي.',
      scores,
      isConfident: false,
    };
  }

  // Iterate over each category definition and compute matching score
  for (const [catKey, lexicon] of Object.entries(CATEGORY_LEXICON) as [UsedItemCategory, CategorySemanticDefinition][]) {
    let catScore = 0;

    // 1. Phrase matching (highest weight)
    for (const item of lexicon.phrases) {
      if (normalizedCombined.includes(item.phrase)) {
        // Title occurrences get double weight
        const isTitleMatch = normalizedTitle.includes(item.phrase);
        const weightMultiplier = isTitleMatch ? 2.2 : 1.0;
        catScore += item.weight * weightMultiplier;
        matchedKeywordsByCategory[catKey].push(item.phrase);
      }
    }

    // 2. Strong keyword matching
    for (const item of lexicon.strongKeywords) {
      if (tokens.includes(item.word) || normalizedCombined.includes(item.word)) {
        const isTitleMatch = normalizedTitle.includes(item.word);
        const weightMultiplier = isTitleMatch ? 2.0 : 1.0;
        catScore += item.weight * weightMultiplier;
        matchedKeywordsByCategory[catKey].push(item.word);
      }
    }

    // 3. Context keywords matching
    for (const item of lexicon.contextKeywords) {
      if (tokens.includes(item.word)) {
        catScore += item.weight;
        // Only include in matched list if we don't have too many
        if (matchedKeywordsByCategory[catKey].length < 4) {
          matchedKeywordsByCategory[catKey].push(item.word);
        }
      }
    }

    scores[catKey] = Math.round(catScore * 10) / 10;
  }

  // Find top scoring category
  const sortedCategories = (Object.keys(scores) as UsedItemCategory[]).sort(
    (a, b) => scores[b] - scores[a]
  );

  const bestCategory = sortedCategories[0];
  const bestScore = scores[bestCategory];
  const secondCategory = sortedCategories[1];
  const secondScore = scores[secondCategory];

  // Calculate confidence percentage
  let confidence = 0;
  if (bestScore > 0) {
    if (secondScore === 0) {
      confidence = Math.min(98, Math.round(75 + Math.min(23, bestScore * 2.5)));
    } else {
      const ratio = bestScore / (bestScore + secondScore);
      confidence = Math.min(99, Math.max(50, Math.round(ratio * 100)));
    }
  }

  const rawMatched = matchedKeywordsByCategory[bestCategory];
  const uniqueMatched = Array.from(new Set(rawMatched)).slice(0, 5);

  const isConfident = bestScore >= 5 && confidence >= 50 && uniqueMatched.length > 0;

  // Build Arabic explanation
  let explanation = '';
  const label = USED_CATEGORY_LABELS[bestCategory].label;

  if (isConfident) {
    const formattedKeywords = uniqueMatched.map((k) => `"${k}"`).join('، ');
    explanation = `تم التعرف تلقائياً على تصنيف (${label}) بنسبة دقة ${confidence}% بناءً على الكلمات المفتاحية في الوصف: ${formattedKeywords}.`;
  } else if (bestScore > 0) {
    explanation = `اقتراح تقريبي: (${label}) بناءً على بعض الدلالات، يمكنك تأكيد التصنيف أو تعديله.`;
  } else {
    explanation = 'اكتب المزيد من تفاصيل الغرض لنقترح عليك التصنيف بدقة تلقائية.';
  }

  return {
    suggestedCategory: bestCategory,
    categoryLabel: label,
    confidence,
    matchedKeywords: uniqueMatched,
    explanation,
    scores,
    isConfident,
  };
}
