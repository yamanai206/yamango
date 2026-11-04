import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PUSH_PREFERENCES,
  getZoneNameAr,
  getStoredPushPreferences,
  savePushPreferences,
  getPushHistory,
  addPushToHistory,
  markPushAsRead,
  clearPushHistory
} from './pushNotificationService';

// Mock localStorage for Node test runner
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

(globalThis as any).localStorage = localStorageMock;

test('PushNotificationService: getZoneNameAr returns correct Arabic localization', () => {
  assert.strictEqual(getZoneNameAr('al_kafr'), 'بلدة الكفر');
  assert.strictEqual(getZoneNameAr('suwayda'), 'مدينة السويداء');
  assert.strictEqual(getZoneNameAr('shahba'), 'مدينة شهبا');
  assert.strictEqual(getZoneNameAr('salkhad'), 'مدينة صلخد');
  assert.strictEqual(getZoneNameAr('al_qurayya'), 'بلدة القريّا');
  assert.strictEqual(getZoneNameAr('ariqa'), 'ناحية عريقة');
  assert.strictEqual(getZoneNameAr('mazraa'), 'المزرعة');
});

test('PushNotificationService: preferences management persists and retrieves properly', () => {
  localStorageMock.clear();
  const defaultPrefs = getStoredPushPreferences();
  assert.strictEqual(defaultPrefs.enabled, true);
  assert.strictEqual(defaultPrefs.dealAlerts, true);

  const customPrefs = {
    ...DEFAULT_PUSH_PREFERENCES,
    enabled: false,
    dealAlerts: true,
    escrowAlerts: false,
    soundEnabled: false,
  };

  savePushPreferences(customPrefs);
  const loaded = getStoredPushPreferences();
  assert.strictEqual(loaded.enabled, false);
  assert.strictEqual(loaded.escrowAlerts, false);
  assert.strictEqual(loaded.soundEnabled, false);
});

test('PushNotificationService: history tracking adds, marks read, and clears records accurately', () => {
  localStorageMock.clear();
  assert.strictEqual(getPushHistory().length, 0);

  const record1 = addPushToHistory({
    title: 'تنبيه صفقة جرار زراعي',
    body: 'تم تسجيل صفقة جديدة في الكفر',
    category: 'deal',
    dealId: 'deal-101'
  });

  const record2 = addPushToHistory({
    title: 'تحديث إسكرو',
    body: 'تم استلام العربون لدى وكيل السويداء',
    category: 'escrow',
    dealId: 'deal-102'
  });

  const history = getPushHistory();
  assert.strictEqual(history.length, 2);
  assert.strictEqual(history[0].id, record2.id); // newest first
  assert.strictEqual(history[0].read, false);

  markPushAsRead(record2.id);
  const updatedHistory = getPushHistory();
  const found = updatedHistory.find(h => h.id === record2.id);
  assert.strictEqual(found?.read, true);

  clearPushHistory();
  assert.strictEqual(getPushHistory().length, 0);
});
