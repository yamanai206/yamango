import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Users, 
  Radio, 
  Zap,
  Layers,
  Clock
} from 'lucide-react';
import { 
  isPushSupported, 
  getNotificationPermission, 
  sendBroadcastPushNotification, 
  getPushHistory,
  sendTestPushNotification,
  PushPermissionState
} from '../services/pushNotificationService';
import { Deal } from '../types';

interface AdminPushBroadcastCardProps {
  deals: Deal[];
}

export const AdminPushBroadcastCard: React.FC<AdminPushBroadcastCardProps> = ({ deals }) => {
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [broadcastTitle, setBroadcastTitle] = useState('صفقة جديدة مميزة في بلدة الكفر 🚜');
  const [broadcastMessage, setBroadcastMessage] = useState('تم توثيق صفقة جرار زراعي معتمد مع حجز العربون عبر وساطة yamango.');
  const [selectedCategory, setSelectedCategory] = useState<'deal' | 'escrow' | 'garage' | 'system'>('deal');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [recentCount, setRecentCount] = useState(0);

  useEffect(() => {
    setPermission(getNotificationPermission());
    setRecentCount(getPushHistory().length);

    const handleUpdate = () => {
      setRecentCount(getPushHistory().length);
    };
    window.addEventListener('yamango_push_history_updated' as any, handleUpdate);
    return () => {
      window.removeEventListener('yamango_push_history_updated' as any, handleUpdate);
    };
  }, []);

  const handleApplyDealTemplate = (deal: Deal) => {
    setSelectedCategory('deal');
    setBroadcastTitle(`صفقة جديدة: ${deal.listingTitle} 🚗`);
    setBroadcastMessage(
      `تم الاتفاق على صفقة بقيمة ${deal.agreedPrice.toLocaleString('ar-SY')} ${deal.currency === 'USD' ? '$' : 'ل.س'} في ${deal.zone === 'al_kafr' ? 'بلدة الكفر' : 'محافظة السويداء'} مع حماية الضمان المالي.`
    );
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsBroadcasting(true);
    setNotice(null);

    try {
      const ok = await sendBroadcastPushNotification(broadcastTitle, broadcastMessage, selectedCategory);
      if (ok) {
        setNotice({
          type: 'success',
          message: 'تم دفع الإشعار الفوري بنجاح عبر Service Worker لكافة المتصفحات النشطة والمغلقة!',
        });
      } else {
        setNotice({
          type: 'error',
          message: 'تعذر دفع الإشعار، يرجى التأكد من تفعيل إذن الإشعارات في متصفحك أولاً.',
        });
      }
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: `خطأ أثناء الإرسال: ${err?.message || 'تعذر الاتصال'}`,
      });
    } finally {
      setIsBroadcasting(false);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-l from-amber-50 via-white to-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <BellRing className="w-4 h-4 animate-pulse" />
            </span>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              مركز دفع إشعارات المتصفح الفورية (Web Push Broadcast)
            </h3>
            <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">
              Service Worker Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            بث تنبيهات الصفقات المكتملة وعقود الإسكرو مباشرة إلى هواتف وأجهزة المستخدمين عبر خدمة المتصفح حتى لو كان التطبيق مغلقاً.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>حالة المتصفح: {permission === 'granted' ? 'مصرّح بالإرسال' : 'بانتظار الإذن'}</span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {notice && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
              notice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{notice.message}</span>
          </div>
        )}

        {/* Quick Template Selector from Deals */}
        {deals.length > 0 && (
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              تعبئة سريعة من أحدث الصفقات في النظام:
            </label>
            <div className="flex flex-wrap gap-2">
              {deals.slice(0, 3).map((deal) => (
                <button
                  key={deal.id}
                  type="button"
                  onClick={() => handleApplyDealTemplate(deal)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-900 border border-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>{deal.listingTitle} ({deal.agreedPrice.toLocaleString('ar-SY')} {deal.currency})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Broadcast Form */}
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 block">عنوان الإشعار (Notification Title):</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                placeholder="مثال: صفقة جديدة معتمدة في بلدة الكفر"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">تصنيف التنبيه:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
              >
                <option value="deal">🚗 صفقة جديدة</option>
                <option value="escrow">🛡️ وساطة مالية (إسكرو)</option>
                <option value="garage">🔧 فحص فني كراجات</option>
                <option value="system">📢 تنبيه عام للمنصة</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">نص الرسالة (Push Body):</label>
            <textarea
              rows={2}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              required
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              placeholder="اكتب نص الإشعار الموجز الذي سيظهر على شاشة قفل المستخدم أو سطح المكتب..."
            />
          </div>

          {/* Live Device Preview */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">معاينة الإشعار على المتصفح وشاشة الهاتف:</label>
            <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-inner flex items-start gap-3 max-w-lg">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
                <BellRing className="w-4 h-4" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold text-amber-400">yamango • الآن</span>
                  <span>عبر Service Worker</span>
                </div>
                <h5 className="font-bold text-xs text-white leading-tight">{broadcastTitle || 'عنوان الإشعار'}</h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">{broadcastMessage || 'محتوى الرسالة...'}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-md text-amber-300 font-semibold cursor-pointer">
                    عرض الصفقة 🔍
                  </span>
                  <span className="text-[10px] text-slate-400">إغلاق ✕</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              إجمالي الإشعارات المسجلة محلياً: <strong className="text-slate-700">{recentCount}</strong>
            </span>

            <button
              type="submit"
              disabled={isBroadcasting}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Send className={`w-3.5 h-3.5 ${isBroadcasting ? 'animate-spin' : ''}`} />
              <span>{isBroadcasting ? 'جارٍ البث...' : 'إرسال الإشعار الفوري الآن'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
