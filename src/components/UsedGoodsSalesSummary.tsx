import React, { useState, useMemo } from 'react';
import { UsedItem, UsedItemOrder } from '../types';
import { 
  computeUsedGoodsSalesStats, 
  USED_CATEGORY_CHART_CONFIG,
  formatUsedItemPrice 
} from '../utils/usedGoods';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Boxes,
  Coins,
  ChevronDown,
  ChevronUp,
  BarChart3,
  DollarSign,
  ArrowUpRight,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';

interface UsedGoodsSalesSummaryProps {
  orders: UsedItemOrder[];
  items: UsedItem[];
  usdToSypRate?: number;
  className?: string;
}

type MetricType = 'normalized_usd' | 'syp_volume' | 'commission' | 'orders_count';

export const UsedGoodsSalesSummary: React.FC<UsedGoodsSalesSummaryProps> = ({
  orders,
  items,
  usdToSypRate = 14850,
  className = '',
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('normalized_usd');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Compute stats memoized
  const stats = useMemo(() => {
    return computeUsedGoodsSalesStats(orders, items, usdToSypRate);
  }, [orders, items, usdToSypRate]);

  // Prepare chart data based on selected metric
  const chartData = useMemo(() => {
    return stats.categoryStats.map((cat) => {
      let value = 0;
      let displayValue = '';

      switch (selectedMetric) {
        case 'normalized_usd':
          value = cat.normalizedVolumeUSD;
          displayValue = `$${value.toLocaleString()}`;
          break;
        case 'syp_volume':
          value = Math.round(cat.totalVolumeSYP / 1000); // in thousands
          displayValue = `${cat.totalVolumeSYP.toLocaleString()} ل.س`;
          break;
        case 'commission':
          value = cat.normalizedCommissionUSD;
          displayValue = `$${value.toLocaleString()} (~${Math.round(cat.normalizedCommissionUSD * usdToSypRate).toLocaleString()} ل.س)`;
          break;
        case 'orders_count':
          value = cat.totalOrdersCount;
          displayValue = `${value} صفقات`;
          break;
      }

      return {
        ...cat,
        value,
        displayValue,
      };
    });
  }, [stats, selectedMetric, usdToSypRate]);

  return (
    <div
      data-testid="used-goods-sales-summary-section"
      className={`bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all ${className}`}
    >
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-900/90 via-slate-900 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-400/20">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              ملخص مبيعات المستعمل والعمولات المعلقة
            </h2>
            <span className="text-[10px] bg-amber-400/20 text-amber-200 border border-amber-300/30 px-2 py-0.5 rounded-full font-bold">
              عمولة 3.5%
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            متابعة دقيقة لحجم التداول الإجمالي في سوق المستعمل بالسويداء وبلدة الكفر، وقيمة العمولات المحجوزة تحت وصاية الإسكرو حتى الاستلام.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-amber-200 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-300" />
            <span>سعر الصرف المعتمد:</span>
            <strong className="font-mono text-white">{usdToSypRate.toLocaleString()} ل.س/$</strong>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'توسيع الملخص' : 'طي الملخص'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-6">
          {/* Top KPI Cards Ribbon */}
          <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Sales Volume */}
              <div 
                data-testid="stat-total-sales-volume"
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1.5">
                  <span className="text-xs font-black text-slate-800">إجمالي حجم المبيعات</span>
                  <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                
                {/* Large Amount Display */}
                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                    ${stats.totalSalesVolumeUSD.toLocaleString()}
                    <span className="text-xs font-bold text-slate-500 mr-2 font-sans">+ {stats.totalSalesVolumeSYP.toLocaleString()} ل.س</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <span>القيمة الموحدة التقريبية:</span>
                    <strong className="font-mono font-black">${stats.normalizedTotalSalesUSD.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Sub-breakdown */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-0.5">
                  <div className="flex justify-between">
                    <span>مبيعات مكتملة:</span>
                    <strong className="text-slate-800 font-mono">
                      ${stats.completedSalesUSD.toLocaleString()} / {stats.completedSalesSYP.toLocaleString()} ل.س
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>محجوز بإسكرو:</span>
                    <strong className="text-amber-800 font-mono">
                      ${stats.escrowSalesUSD.toLocaleString()} / {stats.escrowSalesSYP.toLocaleString()} ل.س
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Pending Commissions in Escrow */}
              <div 
                data-testid="stat-pending-commissions"
                className="bg-white p-4 rounded-2xl border border-amber-200/90 bg-amber-50/20 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-amber-800 mb-1.5">
                  <span className="text-xs font-black text-amber-950">العمولات المعلقة في الإسكرو</span>
                  <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-amber-900 font-mono tracking-tight">
                    ${stats.pendingCommissionsUSD.toLocaleString()}
                    <span className="text-xs font-bold text-amber-700 mr-2 font-sans">+ {stats.pendingCommissionsSYP.toLocaleString()} ل.س</span>
                  </div>
                  <div className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                    <span>مكافئ بالدولار:</span>
                    <strong className="font-mono font-black">${stats.normalizedPendingCommissionsUSD.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-[10px] text-amber-900/80 leading-tight">
                  تحت وصاية الإسكرو لدى وكلاء الكفر والسويداء بانتظار تأكيد استلام المشترين بالـ OTP.
                </div>
              </div>

              {/* Card 3: Realized Commissions */}
              <div 
                data-testid="stat-realized-commissions"
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1.5">
                  <span className="text-xs font-black text-slate-800">العمولات المحققة (المكتملة)</span>
                  <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-blue-900 font-mono tracking-tight">
                    ${stats.realizedCommissionsUSD.toLocaleString()}
                    <span className="text-xs font-bold text-slate-500 mr-2 font-sans">+ {stats.realizedCommissionsSYP.toLocaleString()} ل.س</span>
                  </div>
                  <div className="text-[11px] text-blue-700 font-bold flex items-center gap-1">
                    <span>إجمالي الأرباح المنفذة:</span>
                    <strong className="font-mono font-black">${stats.normalizedRealizedCommissionsUSD.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <span>تم تحصيلها واقتطاع نسبة المنصة (3.5%) وتسليم صافي المبالغ للبائعين.</span>
                </div>
              </div>

              {/* Card 4: Orders & Inventory */}
              <div 
                data-testid="stat-orders-inventory"
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1.5">
                  <span className="text-xs font-black text-slate-800">حركة الصفقات والمعروضات</span>
                  <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
                    <Boxes className="w-4 h-4" />
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-purple-950 font-mono tracking-tight">
                    {stats.totalOrdersCount}
                    <span className="text-xs font-bold text-slate-600 mr-1.5 font-sans">طلبات شراء</span>
                  </div>
                  <div className="text-[11px] text-purple-700 font-bold flex items-center gap-1.5">
                    <span>{stats.completedOrdersCount} مكتملة</span>
                    <span className="text-slate-300">•</span>
                    <span>{stats.escrowOrdersCount} محجوزة</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600 flex items-center justify-between">
                  <span>المعروض المتاح حالياً:</span>
                  <strong className="text-slate-900 font-mono">{stats.availableItemsCount} أغراض</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart Section */}
          <div className="px-5 sm:px-6 pb-6 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <span>مخطط أداء المبيعات حسب تصنيف الأغراض المستعملة</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    Bar Chart
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  مقارنة تفاعلية لحجم التداول، العمولات المستحقة، وعدد الصفقات عبر مختلف الأقسام
                </p>
              </div>

              {/* Metric Selector Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200 overflow-x-auto w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedMetric('normalized_usd')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                    selectedMetric === 'normalized_usd'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  حجم المبيعات ($)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMetric('syp_volume')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                    selectedMetric === 'syp_volume'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  المبيعات بالليرة (ل.س)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMetric('commission')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                    selectedMetric === 'commission'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  العمولات (3.5%)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMetric('orders_count')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                    selectedMetric === 'orders_count'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  عدد الصفقات
                </button>
              </div>
            </div>

            {/* Recharts BarChart */}
            <div className="h-72 w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 15, right: 15, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    unit={
                      selectedMetric === 'normalized_usd'
                        ? ' $'
                        : selectedMetric === 'syp_volume'
                        ? 'k'
                        : selectedMetric === 'commission'
                        ? ' $'
                        : ''
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as typeof chartData[0];
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-right font-sans text-xs min-w-[240px]">
                            <div className="font-black text-sm text-amber-300 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
                              <span>{data.label}</span>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                                {data.shortLabel}
                              </span>
                            </div>

                            <div className="space-y-1.5 font-medium">
                              <div className="flex items-center justify-between gap-3 text-slate-200">
                                <span className="text-slate-400">إجمالي المبيعات (USD):</span>
                                <strong className="font-mono text-white text-sm">
                                  ${data.totalVolumeUSD.toLocaleString()}
                                </strong>
                              </div>

                              <div className="flex items-center justify-between gap-3 text-slate-200">
                                <span className="text-slate-400">إجمالي المبيعات (SYP):</span>
                                <strong className="font-mono text-white text-sm">
                                  {data.totalVolumeSYP.toLocaleString()} ل.س
                                </strong>
                              </div>

                              <div className="flex items-center justify-between gap-3 text-amber-300 pt-1 border-t border-slate-800">
                                <span>عمولة المنصة المعلقة:</span>
                                <strong className="font-mono font-bold">
                                  ${data.pendingCommissionUSD} / {data.pendingCommissionSYP.toLocaleString()} ل.س
                                </strong>
                              </div>

                              <div className="flex items-center justify-between gap-3 text-blue-300">
                                <span>عمولة المنصة المحققة:</span>
                                <strong className="font-mono font-bold">
                                  ${data.realizedCommissionUSD} / {data.realizedCommissionSYP.toLocaleString()} ل.س
                                </strong>
                              </div>

                              <div className="flex items-center justify-between gap-3 text-emerald-300 pt-1 border-t border-slate-800">
                                <span>طلبات الشراء:</span>
                                <span className="font-mono">
                                  {data.completedOrdersCount} مكتملة | {data.escrowOrdersCount} محجوزة
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-3 text-slate-400">
                                <span>المعروض المتاح:</span>
                                <span className="font-mono font-bold text-slate-200">
                                  {data.availableItemsCount} أغراض
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Bar
                    dataKey="value"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fillColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Performance Quick Cards / Grid below chart */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
              {stats.categoryStats.map((cat) => (
                <div
                  key={cat.category}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 truncate" title={cat.label}>
                      {cat.shortLabel}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.fillColor }}
                    />
                  </div>

                  <div className="font-mono font-bold text-slate-900 text-sm">
                    ${cat.totalVolumeUSD.toLocaleString()}
                  </div>
                  {cat.totalVolumeSYP > 0 && (
                    <div className="font-mono text-[10px] text-slate-500 truncate">
                      {Math.round(cat.totalVolumeSYP / 1000).toLocaleString()}k ل.س
                    </div>
                  )}

                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span>الصفقات:</span>
                    <strong className="text-slate-800 font-mono">{cat.totalOrdersCount}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
