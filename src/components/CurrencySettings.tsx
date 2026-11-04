import React, { useState } from 'react';
import { CurrencyRateConfig, Listing, Deal } from '../types';
import { 
  DollarSign, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRightLeft, 
  TrendingUp, 
  Coins, 
  Clock, 
  ShieldAlert,
  Database
} from 'lucide-react';

interface CurrencySettingsProps {
  currencyConfig: CurrencyRateConfig;
  onUpdateRate: (newRate: number, autoRecalculate: boolean) => {
    success: boolean;
    newRate?: number;
    listingsUpdated?: number;
    dealsUpdated?: number;
    message: string;
  };
  listingsCount?: number;
  dealsCount?: number;
}

export const CurrencySettings: React.FC<CurrencySettingsProps> = ({
  currencyConfig,
  onUpdateRate,
  listingsCount = 0,
  dealsCount = 0,
}) => {
  const [rateInput, setRateInput] = useState(currencyConfig.usdToSypRate.toString());
  const [autoRecalculate, setAutoRecalculate] = useState(currencyConfig.autoUpdateListings);
  const [isUpdating, setIsUpdating] = useState(false);
  const [resultNotice, setResultNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Quick Calculator
  const [calcUsd, setCalcUsd] = useState<string>('1000');
  const [calcSyp, setCalcSyp] = useState<string>('');

  const currentRate = Number(rateInput) || currencyConfig.usdToSypRate;

  const handleRateUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = Number(rateInput);
    if (!parsedRate || parsedRate <= 0) {
      setResultNotice({ type: 'error', message: 'يرجى إدخال سعر صرف صحيح أكبر من صفر.' });
      return;
    }

    setIsUpdating(true);
    setResultNotice(null);

    setTimeout(() => {
      const res = onUpdateRate(parsedRate, autoRecalculate);
      setIsUpdating(false);
      if (res.success) {
        setResultNotice({
          type: 'success',
          message: `${res.message} - تم تحديث ${res.listingsUpdated || listingsCount} إعلان و ${res.dealsUpdated || dealsCount} عقد بنجاح.`,
        });
      } else {
        setResultNotice({
          type: 'error',
          message: res.message || 'حدث خطأ أثناء تحديث سعر الصرف.',
        });
      }
      setTimeout(() => setResultNotice(null), 7000);
    }, 400);
  };

  const handleConvertUsdToSyp = (val: string) => {
    setCalcUsd(val);
    const num = Number(val);
    if (!isNaN(num)) {
      setCalcSyp((num * currentRate).toLocaleString());
    } else {
      setCalcSyp('');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs text-xs space-y-0">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-l from-amber-50/60 via-white to-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Coins className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                نظام إدارة أسعار الصرف وتحويل العملات (ليرة سورية ودولار)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تحديث يومي لسعر صرف الدولار مقابل الليرة السورية لضبط أسعار الإعلانات، العمولات، والعقود الرسمية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-xl font-medium text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>آخر تحديث: {currencyConfig.lastUpdated}</span>
          </div>
        </div>

        {/* Notice Alert */}
        {resultNotice && (
          <div
            className={`mt-4 p-3 rounded-xl border flex items-center gap-2 animate-in fade-in ${
              resultNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {resultNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-bold">{resultNotice.message}</span>
          </div>
        )}
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Rate Input Form */}
        <form onSubmit={handleRateUpdate} className="lg:col-span-2 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">
                سعر صرف 1 دولار أمريكي (USD) مقابل الليرة السورية (SYP):
              </label>
              <span className="text-[10px] text-amber-800 font-bold bg-amber-100/70 px-2 py-0.5 rounded-md">
                السعر اليومي الفعلي
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="50"
                  min="1000"
                  max="100000"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-full text-base sm:text-lg font-black font-mono px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 text-slate-900"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                  ليرة سورية (SYP)
                </span>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-xl font-black text-xs transition-colors shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                <span>حفظ وتحديث قاعدة البيانات</span>
              </button>
            </div>

            {/* Auto Recalculate Switcher */}
            <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRecalculate}
                onChange={(e) => setAutoRecalculate(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded-md border-slate-300 accent-amber-600"
              />
              <span className="font-bold text-slate-800 text-xs">
                إعادة احتساب وتحديث أسعار الإعلانات والعقود في قاعدة البيانات تلقائياً بناءً على هذا السعر
              </span>
            </label>
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">الإعلانات الخاضعة للتحديث:</span>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                {listingsCount} إعلان نشط
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">محدثة بالليرة والدولار</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">العقود والوساطة:</span>
              <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                {dealsCount} عقد وصفقة
              </div>
              <span className="text-[10px] text-amber-700 font-semibold">تحديث العربون والعمولة</span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium">مصدر التسعير:</span>
              <div className="text-xs font-bold text-slate-800 mt-0.5 truncate">
                {currencyConfig.sourceNote || 'سوق السويداء والكفر'}
              </div>
              <span className="text-[10px] text-blue-700 font-semibold">معتمد رسمياً بالمنصة</span>
            </div>
          </div>
        </form>

        {/* Quick Conversion Calculator Playground */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <ArrowRightLeft className="w-4 h-4 text-amber-600" />
            <span>حاسبة التحويل السريع الميدانية</span>
          </div>
          <p className="text-[11px] text-slate-500">
            اختبر قيمة أي مبلغ فوري بالسعر الحالي لتوجيه المشترين والبائعين:
          </p>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">المبلغ بالدولار ($):</label>
              <input
                type="number"
                value={calcUsd}
                onChange={(e) => handleConvertUsdToSyp(e.target.value)}
                placeholder="1000"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">المعادل بالليرة السورية (SYP):</label>
              <div className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-black text-amber-800">
                {calcSyp || (Number(calcUsd) * currentRate).toLocaleString()} ل.س
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-lg text-[10px] text-amber-900 leading-snug">
            💡 <strong>ملاحظة للمشرف:</strong> يتم تثبيت سعر الصرف في ملخص العقد الإلكتروني لحظة توقيع الطرفين لحمايتهما من تقلبات العملة اليومية.
          </div>
        </div>
      </div>
    </div>
  );
};
