import React, { useState, useMemo } from 'react';
import { Deal, InspectionRequest, CurrencyRateConfig, CommissionRatesConfig } from '../types';
import { 
  calculateCommissionPipelineSummary,
  DEFAULT_COMMISSION_RATES,
  CommissionPipelineType
} from '../utils/commission';
import { 
  Percent, 
  TrendingUp, 
  Coins, 
  Sliders, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Key, 
  ShoppingCart, 
  Calendar, 
  ArrowUpRight, 
  Sparkles,
  Info,
  Filter
} from 'lucide-react';

interface CommissionControlPanelProps {
  deals: Deal[];
  inspectionRequests: InspectionRequest[];
  currencyConfig: CurrencyRateConfig;
  commissionRates: CommissionRatesConfig;
  onUpdateRates: (rates: Partial<CommissionRatesConfig>) => void;
}

export const CommissionControlPanel: React.FC<CommissionControlPanelProps> = ({
  deals,
  inspectionRequests,
  currencyConfig,
  commissionRates,
  onUpdateRates,
}) => {
  // Local adjustable simulation state
  const [saleRate, setSaleRate] = useState<number>(commissionRates.saleRate);
  const [rentRate, setRentRate] = useState<number>(commissionRates.rentRate);
  const [inspectionRate, setInspectionRate] = useState<number>(commissionRates.inspectionRate);
  const [tableFilter, setTableFilter] = useState<'all' | CommissionPipelineType>('all');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Sync if prop changes externally
  React.useEffect(() => {
    setSaleRate(commissionRates.saleRate);
    setRentRate(commissionRates.rentRate);
    setInspectionRate(commissionRates.inspectionRate);
  }, [commissionRates]);

  // Current simulated config
  const currentSimulatedConfig: CommissionRatesConfig = useMemo(() => ({
    saleRate,
    rentRate,
    inspectionRate,
  }), [saleRate, rentRate, inspectionRate]);

  // Calculations for simulated rates
  const simulatedSummary = useMemo(() => {
    return calculateCommissionPipelineSummary(
      deals,
      inspectionRequests,
      currentSimulatedConfig,
      currencyConfig.usdToSypRate
    );
  }, [deals, inspectionRequests, currentSimulatedConfig, currencyConfig.usdToSypRate]);

  // Calculations for base saved rates (for delta comparison)
  const baseSavedSummary = useMemo(() => {
    return calculateCommissionPipelineSummary(
      deals,
      inspectionRequests,
      commissionRates,
      currencyConfig.usdToSypRate
    );
  }, [deals, inspectionRequests, commissionRates, currencyConfig.usdToSypRate]);

  // Check if simulated differs from saved
  const hasUnsavedChanges = 
    saleRate !== commissionRates.saleRate ||
    rentRate !== commissionRates.rentRate ||
    inspectionRate !== commissionRates.inspectionRate;

  // Revenue Delta
  const deltaUSD = simulatedSummary.totalCombinedEquivalentUSD - baseSavedSummary.totalCombinedEquivalentUSD;
  const deltaSYP = simulatedSummary.totalCombinedEquivalentSYP - baseSavedSummary.totalCombinedEquivalentSYP;

  const handleSaveRates = () => {
    onUpdateRates({
      saleRate,
      rentRate,
      inspectionRate,
    });
    setSaveSuccessNotice('تم حفظ وتحديث نسب العمولات بنجاح في قاعدة بيانات المنصة!');
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  const handleResetToSaved = () => {
    setSaleRate(commissionRates.saleRate);
    setRentRate(commissionRates.rentRate);
    setInspectionRate(commissionRates.inspectionRate);
  };

  const handleResetToDefault = () => {
    setSaleRate(DEFAULT_COMMISSION_RATES.saleRate);
    setRentRate(DEFAULT_COMMISSION_RATES.rentRate);
    setInspectionRate(DEFAULT_COMMISSION_RATES.inspectionRate);
  };

  // Filtered items for table
  const filteredItems = useMemo(() => {
    if (tableFilter === 'all') return simulatedSummary.items;
    return simulatedSummary.items.filter(item => item.type === tableFilter);
  }, [simulatedSummary.items, tableFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-700 rounded-xl border border-amber-200">
              <Percent className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                التحكم بنسب العمولات والأرباح المتوقعة
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                ضبط نسب الوساطة لكل فئة (بيع، تأجير، فحص فني) واحتساب العوائد والأرباح التقديرية من الصفقات والفحوصات النشطة في السويداء والكفر.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleResetToSaved}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إلغاء التعديلات</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="الافتراضيات: بيع 2.5%، تأجير 5.0%، فحص 10.0%"
          >
            <span>النسب القياسية</span>
          </button>

          <button
            type="button"
            onClick={handleSaveRates}
            disabled={!hasUnsavedChanges}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs rounded-xl font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ النسب المعتمدة</span>
          </button>
        </div>
      </div>

      {/* Save Success Notice */}
      {saveSuccessNotice && (
        <div className="p-3.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-xs">{saveSuccessNotice}</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-mono">
            بيع: {commissionRates.saleRate}% | تأجير: {commissionRates.rentRate}% | فحص: {commissionRates.inspectionRate}%
          </span>
        </div>
      )}

      {/* Unsaved Simulation Indicator */}
      {hasUnsavedChanges && (
        <div className="p-3.5 rounded-xl border bg-amber-50 border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
            <span className="font-bold text-xs">
              وضع المحاكاة الفورية نشط: الأرقام المعروضة أدناه تحتسب الأرباح بناءً على النسب المعدلة قبل تثبيتها.
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold font-mono">
            <span>فرق العائد المتوقع:</span>
            <span className={deltaUSD >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
              {deltaUSD >= 0 ? `+${deltaUSD.toLocaleString()}` : deltaUSD.toLocaleString()} USD
            </span>
            <span className="text-slate-400">|</span>
            <span className={deltaSYP >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
              {deltaSYP >= 0 ? `+${deltaSYP.toLocaleString()}` : deltaSYP.toLocaleString()} ل.س
            </span>
          </div>
        </div>
      )}

      {/* 3 Categories Rate Sliders & Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category 1: Sales Commission */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShoppingCart className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-xs">عمولة صفقات البيع</h3>
                <span className="text-[10px] text-slate-500">الجرارات، الآليات، والسيارات</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <input
                type="number"
                min="0.5"
                max="10"
                step="0.1"
                value={saleRate}
                onChange={(e) => setSaleRate(Math.max(0.1, Number(e.target.value)))}
                className="w-12 text-center font-black font-mono text-emerald-800 bg-transparent focus:outline-hidden"
              />
              <span className="font-bold text-slate-600 text-xs">%</span>
            </div>
          </div>

          <div>
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.1"
              value={saleRate}
              onChange={(e) => setSaleRate(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-medium">خيارات سريعة:</span>
            {[1.5, 2.0, 2.5, 3.0, 4.0].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setSaleRate(rate)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  saleRate === rate 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {rate}%
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
            تُطبق على القيمة الإجمالية لصفقات البيع القطعية، مع خصم تدريجي للمزارعين والتجار الموثقين.
          </p>
        </div>

        {/* Category 2: Rental Commission */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                <Key className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-xs">عمولة صفقات التأجير</h3>
                <span className="text-[10px] text-slate-500">حفارات، شاحنات، بلدوزرات</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <input
                type="number"
                min="1"
                max="15"
                step="0.5"
                value={rentRate}
                onChange={(e) => setRentRate(Math.max(0.5, Number(e.target.value)))}
                className="w-12 text-center font-black font-mono text-blue-800 bg-transparent focus:outline-hidden"
              />
              <span className="font-bold text-slate-600 text-xs">%</span>
            </div>
          </div>

          <div>
            <input
              type="range"
              min="1"
              max="12"
              step="0.5"
              value={rentRate}
              onChange={(e) => setRentRate(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-medium">خيارات سريعة:</span>
            {[3.0, 4.0, 5.0, 6.0, 8.0].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setRentRate(rate)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  rentRate === rate 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {rate}%
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
            تشمل خدمات تأمين وديعة الإيجار، وتتبع GPS للآلية، ومطابقة ساعات العمل الميدانية.
          </p>
        </div>

        {/* Category 3: Inspection Platform Cut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                <Wrench className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-xs">حصة المنصة من الفحص</h3>
                <span className="text-[10px] text-slate-500">كراجات الكفر والسويداء المعتمدة</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <input
                type="number"
                min="0"
                max="30"
                step="1"
                value={inspectionRate}
                onChange={(e) => setInspectionRate(Math.max(0, Number(e.target.value)))}
                className="w-12 text-center font-black font-mono text-purple-800 bg-transparent focus:outline-hidden"
              />
              <span className="font-bold text-slate-600 text-xs">%</span>
            </div>
          </div>

          <div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={inspectionRate}
              onChange={(e) => setInspectionRate(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-medium">خيارات سريعة:</span>
            {[5, 10, 12, 15, 20].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setInspectionRate(rate)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  inspectionRate === rate 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {rate}%
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
            تقتطع من رسوم المعاينة الفنية عند إصدار التقرير الرقمي الموثق والوسم الإلكتروني.
          </p>
        </div>
      </div>

      {/* KPI Cards: Expected Earnings Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Combined USD */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-xs border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="font-semibold text-xs">إجمالي الأرباح المتوقعة (USD)</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ${simulatedSummary.totalCombinedEquivalentUSD.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-300 mt-2 pt-2 border-t border-slate-700">
            <span>من {simulatedSummary.totalActiveItems} معاملة نشطة</span>
            <span className="font-mono text-emerald-400 font-bold">معادلة شاملة</span>
          </div>
        </div>

        {/* Total Combined SYP */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-semibold text-xs">إجمالي الأرباح المعادلة (SYP)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {simulatedSummary.totalCombinedEquivalentSYP.toLocaleString()} <span className="text-xs font-bold text-slate-500">ل.س</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>سعر الصرف: 1$ = {currencyConfig.usdToSypRate.toLocaleString()} ل.س</span>
            <span className="text-emerald-700 font-bold">محدث</span>
          </div>
        </div>

        {/* Sales Expected */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-semibold text-xs">أرباح صفقات البيع النشطة</span>
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-800 font-mono">
            {simulatedSummary.sales.expectedEarningsUSD > 0 && `$${simulatedSummary.sales.expectedEarningsUSD.toLocaleString()}`}
            {simulatedSummary.sales.expectedEarningsUSD > 0 && simulatedSummary.sales.expectedEarningsSYP > 0 && ' + '}
            {simulatedSummary.sales.expectedEarningsSYP > 0 && `${simulatedSummary.sales.expectedEarningsSYP.toLocaleString()} ل.س`}
            {simulatedSummary.sales.expectedEarningsUSD === 0 && simulatedSummary.sales.expectedEarningsSYP === 0 && '$0'}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{simulatedSummary.sales.count} صفقات بيع نشطة</span>
            <span className="font-mono font-bold text-slate-700">{saleRate}% عمولة</span>
          </div>
        </div>

        {/* Rentals & Inspections Expected */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-semibold text-xs">أرباح التأجير والفحص الفني</span>
            <Key className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-black text-blue-800 font-mono">
            {(simulatedSummary.rentals.expectedEarningsSYP + simulatedSummary.inspections.expectedEarningsSYP).toLocaleString()} <span className="text-xs font-bold text-slate-500">ل.س</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{simulatedSummary.rentals.count} تأجير + {simulatedSummary.inspections.count} فحص كراج</span>
            <span className="font-mono font-bold text-slate-700">{rentRate}% / {inspectionRate}%</span>
          </div>
        </div>
      </div>

      {/* Active Pipeline Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header and Sub-filter Tabs */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>جدول الصفقات والفحوصات النشطة المساهمة في الأرباح</span>
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              بيانات حية ومباشرة من الـ Store توضح تفاصيل كل صفقة قيد المعالجة وقيمة عمولتها المحتسبة.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setTableFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                tableFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({simulatedSummary.items.length})
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('sale')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                tableFilter === 'sale'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              بيع ({simulatedSummary.sales.count})
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('rent')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                tableFilter === 'rent'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تأجير ({simulatedSummary.rentals.count})
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('inspection')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                tableFilter === 'inspection'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              فحص ({simulatedSummary.inspections.count})
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-xs">لا توجد معاملات نشطة في هذا التصنيف حالياً</p>
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">الفئة</th>
                  <th className="py-3 px-4">المعاملة والآلية</th>
                  <th className="py-3 px-4">الأطراف المعنية</th>
                  <th className="py-3 px-4">القيمة الإجمالية</th>
                  <th className="py-3 px-4 text-center">النسبة</th>
                  <th className="py-3 px-4">العمولة المتوقعة</th>
                  <th className="py-3 px-4">حالة المعاملة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.type === 'sale' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <ShoppingCart className="w-3 h-3 text-emerald-600" />
                          <span>بيع قطعي</span>
                        </span>
                      )}
                      {item.type === 'rent' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                          <Key className="w-3 h-3 text-blue-600" />
                          <span>إيجار دوري</span>
                        </span>
                      )}
                      {item.type === 'inspection' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-purple-50 text-purple-800 border border-purple-200">
                          <Wrench className="w-3 h-3 text-purple-600" />
                          <span>فحص كراج</span>
                        </span>
                      )}
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 max-w-xs truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        معرف: <span className="font-mono">{item.id}</span> • التاريخ: {item.dateStr}
                      </div>
                    </td>

                    {/* Parties */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {item.buyerOrRequester}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        مع: {item.sellerOrProvider}
                      </div>
                    </td>

                    {/* Base Price */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                      {item.currency === 'USD' ? `$${item.baseAmount.toLocaleString()}` : `${item.baseAmount.toLocaleString()} ل.س`}
                    </td>

                    {/* Rate applied */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center font-mono font-black text-amber-700">
                      {item.rateApplied}%
                    </td>

                    {/* Expected commission */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-black text-emerald-700 text-sm">
                        {item.currency === 'USD' 
                          ? `$${item.expectedCommission.toLocaleString()}`
                          : `${item.expectedCommission.toLocaleString()} ل.س`}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ≈ {item.currency === 'USD' 
                          ? `${item.expectedCommissionSYP.toLocaleString()} ل.س`
                          : `$${item.expectedCommissionUSD.toLocaleString()}`}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        {item.statusLabelArabic}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            يتم تحديث قائمة الصفقات والفحوصات تلقائياً عند قيام المستخدمين بإجراء عمليات جديدة على المنصة.
          </span>
          <div className="font-mono font-bold text-slate-700">
            إجمالي العائد المحسوب: <span className="text-emerald-700">${simulatedSummary.totalCombinedEquivalentUSD.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
