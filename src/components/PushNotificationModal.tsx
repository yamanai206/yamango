import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Send, 
  Smartphone, 
  ShieldCheck, 
  Wrench, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Trash2, 
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  MapPin,
  RefreshCw
} from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  requestPushPermission,
  getStoredPushPreferences,
  savePushPreferences,
  sendTestPushNotification,
  getPushHistory,
  clearPushHistory,
  markAllPushAsRead,
  PushPermissionState,
  PushNotificationPreferences,
  PushNotificationRecord,
} from '../services/pushNotificationService';
import { ZoneLocation } from '../types';

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeal?: (dealId: string) => void;
}

const ALL_ZONES: { id: ZoneLocation; name: string }[] = [
  { id: 'al_kafr', name: 'بلدة الكفر' },
  { id: 'suwayda', name: 'مدينة السويداء' },
  { id: 'salkhad', name: 'مدينة صلخد' },
  { id: 'shahba', name: 'مدينة شهبا' },
  { id: 'al_qurayya', name: 'بلدة القريّا' },
  { id: 'ariqa', name: 'ناحية عريقة' },
  { id: 'mazraa', name: 'المزرعة' },
];

export const PushNotificationModal: React.FC<PushNotificationModalProps> = ({
  isOpen,
  onClose,
  onOpenDeal,
}) => {
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [preferences, setPreferences] = useState<PushNotificationPreferences>(getStoredPushPreferences());
  const [history, setHistory] = useState<PushNotificationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testNotice, setTestNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Refresh status & history on open
  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
      setPreferences(getStoredPushPreferences());
      setHistory(getPushHistory());
    }
  }, [isOpen]);

  // Listen to external history updates
  useEffect(() => {
    const handleHistoryUpdate = (e: CustomEvent) => {
      setHistory(e.detail || []);
    };
    window.addEventListener('yamango_push_history_updated' as any, handleHistoryUpdate);
    return () => {
      window.removeEventListener('yamango_push_history_updated' as any, handleHistoryUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const supported = isPushSupported();

  const handleRequestPermission = async () => {
    const res = await requestPushPermission();
    setPermission(res);
    setPreferences(getStoredPushPreferences());
  };

  const handleTogglePref = (key: keyof PushNotificationPreferences) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(updated);
    savePushPreferences(updated);
  };

  const handleToggleZone = (zoneId: ZoneLocation) => {
    const current = preferences.zones || [];
    const exists = current.includes(zoneId);
    const updatedZones = exists
      ? current.filter((z) => z !== zoneId)
      : [...current, zoneId];
    
    const updated = { ...preferences, zones: updatedZones };
    setPreferences(updated);
    savePushPreferences(updated);
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestNotice(null);
    try {
      const res = await sendTestPushNotification();
      setTestNotice({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
      setPermission(getNotificationPermission());
      setHistory(getPushHistory());
    } catch (err: any) {
      setTestNotice({
        type: 'error',
        message: `حدث خطأ أثناء إرسال الإشعار التجريبي: ${err?.message || 'تعذر الإرسال'}`,
      });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestNotice(null), 6000);
    }
  };

  const unreadCount = history.filter((h) => !h.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-amber-600 via-amber-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <BellRing className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">دفع الإشعارات الفورية (Push Notifications)</h3>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black">
                  Service Worker
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-0.5">
                تنبيهات فورية بصفقات السويداء والكفر تصل إلى جهازك حتى في حال إغلاق التطبيق
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>إعدادات الدفع والتفضيلات</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors relative ${
              activeTab === 'history'
                ? 'border-amber-600 text-amber-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>سجل الإشعارات المستلمة</span>
            {unreadCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-700 text-xs">
          {testNotice && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
                testNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium leading-relaxed">{testNotice.message}</span>
            </div>
          )}

          {activeTab === 'settings' ? (
            <div className="space-y-4">
              {/* Permission & Status Card */}
              <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      permission === 'granted'
                        ? 'bg-emerald-100 text-emerald-700'
                        : permission === 'denied'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">حالة التنبيهات بالمتصفح:</span>
                      {permission === 'granted' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          مفعّلة ونشطة (Service Worker)
                        </span>
                      ) : permission === 'denied' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/70 px-2.5 py-0.5 rounded-full border border-rose-200">
                          محظورة من إعدادات المتصفح
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200">
                          بانتظار منح الإذن
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                      {permission === 'granted'
                        ? 'خدمة Service Worker مسجلة وجاهزة لدفع الإشعارات المباشرة لسطح المكتب وشاشة القفل فور تسجيل صفقة جديدة.'
                        : permission === 'denied'
                        ? 'لقد قمت بحظر الإشعارات مسبقاً. لتمكينها، اضغط على أيقونة القفل أو الإعدادات بجانب شريط العنوان في متصفحك وفعّل الإشعارات.'
                        : 'اضغط على زر التفعيل أدناه لمنح المتصفح الإذن بإرسال إشعارات الصفقات المكتملة.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {permission !== 'granted' && supported && (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>تفعيل الإشعارات الآن</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={isSendingTest}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-spin' : ''}`} />
                    <span>{isSendingTest ? 'جارٍ الإرسال...' : 'تجربة إشعار فوري'}</span>
                  </button>
                </div>
              </div>

              {/* Preferences Toggles */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>أنواع الإشعارات المرغوبة:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Deal Alerts */}
                  <label className="p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 transition-colors cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">إشعارات الصفقات الجديدة</span>
                        <span className="text-[10px] text-slate-500">بيع أو تأجير السيارات والآليات</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.dealAlerts}
                      onChange={() => handleTogglePref('dealAlerts')}
                      className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500 cursor-pointer"
                    />
                  </label>

                  {/* Escrow Alerts */}
                  <label className="p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 transition-colors cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">وساطة الضمان المالي (الإسكرو)</span>
                        <span className="text-[10px] text-slate-500">حجز العربون وتحديثات العقود</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.escrowAlerts}
                      onChange={() => handleTogglePref('escrowAlerts')}
                      className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  {/* Inspection Alerts */}
                  <label className="p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 transition-colors cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">تقارير الفحص الفني</span>
                        <span className="text-[10px] text-slate-500">جاهزية شهادات فحص الكراجات</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.garageInspectionAlerts}
                      onChange={() => handleTogglePref('garageInspectionAlerts')}
                      className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                    />
                  </label>

                  {/* Sound & Vibrate */}
                  <label className="p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 transition-colors cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
                        {preferences.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">الصوت والاهتزاز</span>
                        <span className="text-[10px] text-slate-500">نغمة التنبيه عند وصول الصفقة</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.soundEnabled}
                      onChange={() => handleTogglePref('soundEnabled')}
                      className="w-4 h-4 text-purple-600 rounded-sm focus:ring-purple-500 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Geographic Zones Preference */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>النواحي والمناطق المفضلة في محافظة السويداء:</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ALL_ZONES.map((zone) => {
                    const isSelected = preferences.zones?.includes(zone.id);
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => handleToggleZone(zone.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-600' : 'bg-slate-300'}`} />
                        <span>{zone.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanatory note */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">كيف تصل الإشعارات والتطبيق مغلق؟</span>
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    تقوم تقنية <strong>Service Workers</strong> بتشغيل عملية خفيفة في خلفية المتصفح دون استهلاك البطارية. بمجرد توثيق صفقة جديدة في الكفر أو السويداء، يُظهر نظام التشغيل التنبيه في شريط الإشعارات فوراً مع زر للاطلاع على تفاصيل الصفقة بضغطة واحدة.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-700 text-xs">
                  إجمالي الإشعارات المسجلة: {history.length}
                </span>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={markAllPushAsRead}
                        className="text-[11px] text-amber-700 hover:underline font-bold"
                      >
                        تحديد الكل كمقروء
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={clearPushHistory}
                        className="text-[11px] text-rose-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>مسح السجل</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {history.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">لا توجد إشعارات مسجلة بعد</p>
                  <p className="text-[11px] text-slate-400">
                    ستظهر هنا كافة إشعارات الصفقات وعقود الإسكرو التي تم دفعها لمتصفحك
                  </p>
                  <button
                    type="button"
                    onClick={handleSendTest}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>إرسال إشعار تجريبي لاختبار السجل</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        item.read
                          ? 'bg-slate-50 border-slate-200 text-slate-600'
                          : 'bg-amber-50/40 border-amber-200 text-slate-800 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded-md text-[10px] font-bold ${
                              item.category === 'deal'
                                ? 'bg-amber-100 text-amber-800'
                                : item.category === 'escrow'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.category === 'deal'
                              ? 'صفقة جديدة'
                              : item.category === 'escrow'
                              ? 'إسكرو وعقد'
                              : 'فحص فني'}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{item.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString('ar-SY', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-[11px] mt-1.5 leading-relaxed text-slate-600">
                        {item.body}
                      </p>

                      {item.dealId && onOpenDeal && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              onOpenDeal(item.dealId!);
                              onClose();
                            }}
                            className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                          >
                            <span>فتح تفاصيل الصفقة</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px]">yamango Web Push Engine v1.0</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
