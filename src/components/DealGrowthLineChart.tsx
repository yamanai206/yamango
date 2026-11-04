import React, { useState, useMemo } from 'react';
import { Deal, ZoneLocation } from '../types';
import {
  computeSixMonthDealGrowth,
  ZONE_NAMES_ARABIC,
  MonthlyGrowthPoint,
} from '../utils/dealGrowth';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  Calendar,
  MapPin,
  Layers,
  ArrowUpRight,
  Filter,
  BarChart3,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DealGrowthLineChartProps {
  deals: Deal[];
  className?: string;
  defaultZone?: ZoneLocation | 'all';
}

const ZONE_OPTIONS: { id: ZoneLocation | 'all'; label: string; short: string }[] = [
  { id: 'all', label: 'كافة النواحي والمناطق', short: 'الكل' },
  { id: 'al_kafr', label: 'بلدة الكفر (المركز)', short: 'الكفر' },
  { id: 'suwayda', label: 'مدينة السويداء', short: 'السويداء' },
  { id: 'salkhad', label: 'ناحية صلخد', short: 'صلخد' },
  { id: 'shahba', label: 'ناحية شهبا', short: 'شهبا' },
  { id: 'al_qurayya', label: 'ناحية القريّا', short: 'القريّا' },
  { id: 'mazraa', label: 'ناحية المزرعة', short: 'المزرعة' },
  { id: 'ariqa', label: 'ناحية عريقة', short: 'عريقة' },
];

export const DealGrowthLineChart: React.FC<DealGrowthLineChartProps> = ({
  deals,
  className = '',
  defaultZone = 'all',
}) => {
  const [selectedZone, setSelectedZone] = useState<ZoneLocation | 'all'>(defaultZone);
  const [showCompletionRateLine, setShowCompletionRateLine] = useState(false);
  const [showTableBreakdown, setShowTableBreakdown] = useState(false);

  // Compute 6-month growth metrics based on selected zone
  const growth = useMemo(() => {
    return computeSixMonthDealGrowth(deals, selectedZone, new Date('2026-10-25'));
  }, [deals, selectedZone]);

  // Selected zone text
  const currentZoneObj = ZONE_OPTIONS.find((z) => z.id === selectedZone) || ZONE_OPTIONS[0];

  return (
    <div
      data-testid="deal-growth-line-chart-card"
      className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0 ${className}`}
    >
      {/* Card Header & Controls */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-l from-slate-50 via-white to-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                مخطط نمو الصفقات والعمليات المكتملة (آخر 6 أشهر)
              </h3>
              <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2.5 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600" />
                <span>أيار - تشرين الأول 2026</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              تحليل خطي بياني دقيق لمسار نمو الصفقات المنشأة ومعدل العمليات المكتملة في السويداء وبلدة الكفر والنواحي، مع متابعة تصاعد وتيرة المعاملات.
            </p>
          </div>

          {/* Sub-District / Zone Selector Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200 overflow-x-auto">
              <span className="text-slate-400 px-2 flex items-center gap-1 text-[11px] shrink-0">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>الناحية:</span>
              </span>
              <select
                data-testid="zone-growth-filter-select"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value as ZoneLocation | 'all')}
                className="bg-white border-0 text-slate-900 rounded-lg py-1 px-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer shadow-xs"
              >
                {ZONE_OPTIONS.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Completion Rate Toggle */}
            <button
              type="button"
              onClick={() => setShowCompletionRateLine(!showCompletionRateLine)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                showCompletionRateLine
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="إظهار أو إخفاء خط نسبة الإنجاز المئوية"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  showCompletionRateLine ? 'bg-amber-500' : 'bg-slate-300'
                }`}
              />
              <span>منحنى نسبة الإنجاز (%)</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Segmented Buttons for Top Zones */}
        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-400 font-bold shrink-0 ml-1">تصفية سريعة:</span>
          {ZONE_OPTIONS.map((zone) => {
            const isSelected = selectedZone === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZone(zone.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {zone.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Performance Summary Cards (Growth Highlights) */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/70">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Deals (6 months) */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold text-slate-600">إجمالي الصفقات (6 أشهر)</span>
              <Layers className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {growth.totalDealsSixMonths}
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                +{growth.growthPercentage}% نمو
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              معدل شهري: {growth.averageMonthlyDeals} صفقات
            </div>
          </div>

          {/* Completed Operations */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold text-emerald-800">العمليات المكتملة</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                {growth.completedDealsSixMonths}
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                +{growth.completedGrowthPercentage}% نمو
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              معدل شهري: {growth.averageMonthlyCompleted} مكتمل
            </div>
          </div>

          {/* Overall Completion Rate */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold text-slate-600">نسبة نجاح الصفقات</span>
              <Award className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {growth.overallCompletionRate}%
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                إغلاق ناجح
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {growth.cancelledDealsSixMonths} صفقات ملغاة بالتراضي
            </div>
          </div>

          {/* Top Activity Zone */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold text-slate-600">الناحية الأعلى نشاطاً</span>
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-purple-900 line-clamp-1 mt-1">
              {growth.topZone.name}
            </div>
            <div className="text-[10px] text-purple-700 font-bold mt-1">
              {growth.topZone.completed} عملية مكتملة من {growth.topZone.total}
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Line Chart Graphic Section */}
      <div className="p-5 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-xs font-bold text-slate-800">
              بيانات النمو لنطاق: {currentZoneObj.label}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-600 inline-block" />
              <span className="font-bold text-slate-700">إجمالي الصفقات</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
              <span className="font-bold text-slate-700">العمليات المكتملة</span>
            </div>
            {showCompletionRateLine && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-500 inline-block" />
                <span className="font-bold text-slate-700">نسبة الإنجاز (%)</span>
              </div>
            )}
          </div>
        </div>

        {/* The Recharts LineChart */}
        <div className="h-72 sm:h-80 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={growth.dataPoints}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="shortMonth"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              {showCompletionRateLine && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fill: '#d97706', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
              )}
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as MonthlyGrowthPoint;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-right font-sans text-xs min-w-[200px]">
                        <div className="font-black text-sm text-slate-100 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
                          <span>{data.monthName}</span>
                          <span className="text-[10px] bg-blue-900 text-blue-200 px-2 py-0.5 rounded font-mono">
                            {currentZoneObj.short}
                          </span>
                        </div>

                        <div className="space-y-1.5 font-medium">
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-blue-300">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <span>إجمالي الصفقات:</span>
                            </span>
                            <span className="font-mono font-bold text-white text-sm">
                              {data.totalDeals}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-emerald-300">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>العمليات المكتملة:</span>
                            </span>
                            <span className="font-mono font-bold text-white text-sm">
                              {data.completedDeals}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-rose-300">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              <span>صفقات ملغاة:</span>
                            </span>
                            <span className="font-mono font-bold text-white">
                              {data.cancelledDeals}
                            </span>
                          </div>

                          <div className="border-t border-slate-800 pt-1.5 mt-1.5 flex items-center justify-between text-amber-300">
                            <span>نسبة الإنجاز:</span>
                            <span className="font-mono font-black">{data.completionRate}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(val) => {
                  const arabicMap: Record<string, string> = {
                    totalDeals: 'إجمالي الصفقات المنشأة',
                    completedDeals: 'العمليات المكتملة بنجاح',
                    completionRate: 'معدل الإنجاز (%)',
                  };
                  return (
                    <span className="text-xs font-bold text-slate-700 px-2">
                      {arabicMap[val] || val}
                    </span>
                  );
                }}
              />

              {/* Line 1: Total Deals */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalDeals"
                name="totalDeals"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 7, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={900}
              />

              {/* Line 2: Completed Deals */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="completedDeals"
                name="completedDeals"
                stroke="#059669"
                strokeWidth={3}
                dot={{ fill: '#059669', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 7, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={900}
              />

              {/* Optional Line 3: Completion Rate */}
              {showCompletionRateLine && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="completionRate"
                  name="completionRate"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#f59e0b', r: 3 }}
                  animationDuration={900}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Monthly Data Table Toggle & Breakdown */}
      <div className="border-t border-slate-100 bg-slate-50/50">
        <div className="p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowTableBreakdown(!showTableBreakdown)}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>
              {showTableBreakdown
                ? 'إخفاء جدول البيانات الشهري المفصل'
                : 'عرض جدول البيانات الشهري المفصل بالأرقام'}
            </span>
          </button>

          <span className="text-[11px] text-slate-500">
            تحديث فوري مرتبط بحسابات الإسكرو وسجلات مديرية النقل بالسويداء
          </span>
        </div>

        {showTableBreakdown && (
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-4 font-bold">الشهر / الفترة</th>
                  <th className="py-2.5 px-4 font-bold">إجمالي الصفقات</th>
                  <th className="py-2.5 px-4 font-bold">العمليات المكتملة</th>
                  <th className="py-2.5 px-4 font-bold">الصفقات الملغاة</th>
                  <th className="py-2.5 px-4 font-bold">نسبة النجاح</th>
                  <th className="py-2.5 px-4 font-bold">الناحية المحددة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {growth.dataPoints.map((pt) => (
                  <tr key={pt.monthKey} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{pt.monthName}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{pt.totalDeals}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-emerald-700">{pt.completedDeals}</td>
                    <td className="py-2.5 px-4 font-mono text-rose-600">{pt.cancelledDeals}</td>
                    <td className="py-2.5 px-4 font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          pt.completionRate >= 75
                            ? 'bg-emerald-50 text-emerald-800'
                            : pt.completionRate >= 50
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {pt.completionRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{currentZoneObj.short}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
