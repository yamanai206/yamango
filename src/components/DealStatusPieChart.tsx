import React, { useState, useMemo } from 'react';
import { Deal, ZoneLocation, ListingCategory } from '../types';
import {
  computeDealStatusDistribution,
  DealStatusGroup,
  ZONE_NAMES_MAP,
  DEAL_STATUS_GROUP_CONFIG,
  DealStatusSliceData,
} from '../utils/dealStatusDistribution';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Sector,
} from 'recharts';
import {
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Filter,
  MapPin,
  TrendingUp,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  ChevronDown,
  ListFilter,
  Eye,
  RotateCcw,
} from 'lucide-react';

interface DealStatusPieChartProps {
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

const CATEGORY_OPTIONS: { id: ListingCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'كافة تصنيفات الآليات' },
  { id: 'tractors', label: 'جرارات زراعية' },
  { id: 'excavators', label: 'حفارات ومعدات ثقيلة' },
  { id: 'trucks', label: 'شاحنات وقلابات' },
  { id: 'cars', label: 'سيارات وبيك آب' },
  { id: 'heavy_machinery', label: 'آليات تسوية وطرق' },
  { id: 'agricultural', label: 'حصادات ومعدات زراعية' },
];

/**
 * Custom Active Shape renderer to highlight hovered slice with a smooth outer ring
 */
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;

  return (
    <g>
      {/* Expanded inner glow & slice */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 11}
        outerRadius={outerRadius + 14}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
};

export const DealStatusPieChart: React.FC<DealStatusPieChartProps> = ({
  deals,
  className = '',
  defaultZone = 'all',
}) => {
  const [selectedZone, setSelectedZone] = useState<ZoneLocation | 'all'>(defaultZone);
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'all'>('all');
  const [isDonut, setIsDonut] = useState(true);
  const [viewMode, setViewMode] = useState<'grouped' | 'detailed'>('grouped');
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [focusedStatus, setFocusedStatus] = useState<DealStatusGroup | 'all'>('all');
  const [showDealsList, setShowDealsList] = useState(false);

  // Compute distribution
  const summary = useMemo(() => {
    return computeDealStatusDistribution(deals, {
      zone: selectedZone,
      category: selectedCategory,
    });
  }, [deals, selectedZone, selectedCategory]);

  // Data for Recharts Pie Chart
  const chartData = useMemo(() => {
    if (viewMode === 'detailed') {
      return summary.detailedSlices.map((slice) => ({
        name: slice.name,
        shortLabel: slice.name,
        count: slice.count,
        value: slice.count,
        percentage: slice.percentage,
        color: slice.color,
        volumeUSD: slice.volumeUSD,
        volumeSYP: slice.volumeSYP,
        description: `حالة الصفقات: ${slice.name}`,
        id: slice.status as string,
      }));
    }

    // Default: Grouped 4 status slices (معلقة، مكتملة، ملغاة، قيد الانتظار)
    return summary.slices
      .filter((slice) => slice.count > 0 || summary.totalDeals === 0)
      .map((slice) => ({
        name: slice.name,
        shortLabel: slice.shortLabel,
        count: slice.count,
        value: slice.count,
        percentage: slice.percentage,
        color: slice.color,
        volumeUSD: slice.volumeUSD,
        volumeSYP: slice.volumeSYP,
        description: slice.description,
        id: slice.id as string,
      }));
  }, [summary, viewMode]);

  // Current hovered or focused item
  const activeItem = useMemo(() => {
    if (activeIndex !== undefined && chartData[activeIndex]) {
      return chartData[activeIndex];
    }
    return null;
  }, [activeIndex, chartData]);

  // Filtered deals for drill-down view
  const drillDownDeals = useMemo(() => {
    if (focusedStatus === 'all') return summary.filteredDeals;
    const matchingSlice = summary.slices.find((s) => s.id === focusedStatus);
    if (!matchingSlice) return summary.filteredDeals;
    return summary.filteredDeals.filter((d) => matchingSlice.dealIds.includes(d.id));
  }, [summary, focusedStatus]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  const resetFilters = () => {
    setSelectedZone('all');
    setSelectedCategory('all');
    setFocusedStatus('all');
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs ${className}`}>
      {/* Component Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-l from-slate-50 via-white to-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <PieIcon className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                توزيع حالات الصفقات الحالية (Recharts Pie Chart)
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                {summary.selectedZoneLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              مراقبة آنية شاملة لتوزيع صفقات المنصة بين الصفقات المعلقة، المكتملة، الملغاة، وتلك التي هي قيد الانتظار والمعاينة والتسليم.
            </p>
          </div>

          {/* Controls: Chart Form & Mode Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: 4 Groups vs Detailed */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grouped'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="عرض الحالات الأربعة الرئيسية: معلقة، مكتملة، ملغاة، قيد الانتظار"
              >
                <span>الحالات الأربعة الرئيسية</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'detailed'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="عرض تفصيلي لجميع مراحل الإسكرو والتنفيذ"
              >
                <span>التوزيع التفصيلي</span>
              </button>
            </div>

            {/* Donut vs Full Pie Toggle */}
            <button
              type="button"
              onClick={() => setIsDonut(!isDonut)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="التبديل بين المخطط المفرغ والمخطط الدائري الكامل"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>{isDonut ? 'مخطط حلقي (Donut)' : 'مخطط مصمت (Pie)'}</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Zone Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <label htmlFor="pie-zone-select" className="text-[11px] font-bold text-slate-600">
                الناحية:
              </label>
              <select
                id="pie-zone-select"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value as ZoneLocation | 'all')}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
              >
                {ZONE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
              <Filter className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <label htmlFor="pie-category-select" className="text-[11px] font-bold text-slate-600">
                الآلية:
              </label>
              <select
                id="pie-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ListingCategory | 'all')}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {(selectedZone !== 'all' || selectedCategory !== 'all' || focusedStatus !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                title="إعادة ضبط الفلاتر"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إلغاء التصفية</span>
              </button>
            )}
          </div>

          {/* Quick Zone Segmented Buttons for Top Areas */}
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-semibold ml-1">وصول سريع:</span>
            {ZONE_OPTIONS.slice(0, 5).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedZone(opt.id)}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedZone === opt.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 4 KPI Cards for the 4 Deal Statuses */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/50 border-b border-slate-100">
        {summary.slices.map((slice) => {
          const isSelected = focusedStatus === slice.id;
          let IconComponent = Clock;
          if (slice.id === 'completed') IconComponent = CheckCircle2;
          else if (slice.id === 'cancelled') IconComponent = XCircle;
          else if (slice.id === 'pending') IconComponent = AlertTriangle;

          return (
            <button
              key={slice.id}
              type="button"
              onClick={() => {
                setFocusedStatus(isSelected ? 'all' : slice.id);
                setShowDealsList(true);
              }}
              className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-white shadow-md ring-2 ring-blue-500 border-transparent'
                  : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-xs font-black text-slate-900">{slice.name}</span>
                </div>
                <span
                  className="p-1 rounded-lg"
                  style={{ backgroundColor: `${slice.color}15`, color: slice.color }}
                >
                  <IconComponent className="w-4 h-4" />
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="text-xl font-black text-slate-900 tabular-nums">
                  {slice.count}{' '}
                  <span className="text-xs font-normal text-slate-500">صفقة</span>
                </div>
                <div
                  className="text-xs font-black px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `${slice.color}15`, color: slice.color }}
                >
                  {slice.percentage}%
                </div>
              </div>

              <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                <span>حجم التداول:</span>
                <span className="font-bold text-slate-700">
                  {slice.volumeUSD > 0 && `$${slice.volumeUSD.toLocaleString()}`}
                  {slice.volumeUSD > 0 && slice.volumeSYP > 0 && ' + '}
                  {slice.volumeSYP > 0 && `${(slice.volumeSYP / 1000).toLocaleString()} ألف ل.س`}
                  {slice.volumeUSD === 0 && slice.volumeSYP === 0 && '0'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side (7 cols): Recharts Pie Chart with Center Donut Details */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          <div className="w-full h-72 sm:h-80 relative">
            {summary.totalDeals === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <PieIcon className="w-12 h-12 stroke-[1.2] mb-2 opacity-50" />
                <p className="text-xs font-bold">لا توجد صفقات تطابق معايير التصفية المحددة</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  يرجى اختيار ناحية أخرى أو إعادة ضبط الفلتر
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    dataKey="count"
                    nameKey="name"
                    innerRadius={isDonut ? 65 : 0}
                    outerRadius={105}
                    paddingAngle={isDonut && chartData.length > 1 ? 3 : 0}
                    {...({
                      activeShape: renderActiveShape,
                      activeIndex: activeIndex,
                    } as any)}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    cursor="pointer"
                    animationDuration={600}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>

                  {/* High contrast Arabic Tooltip */}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs max-w-xs text-right">
                          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: data.color }}
                            />
                            <span className="font-black text-sm">{data.name}</span>
                          </div>
                          <div className="space-y-1 text-slate-300 text-[11px]">
                            <div className="flex justify-between items-center">
                              <span>عدد الصفقات:</span>
                              <span className="font-bold text-white tabular-nums">
                                {data.count} صفقة
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>النسبة المئوية:</span>
                              <span className="font-bold text-amber-400 tabular-nums">
                                {data.percentage}%
                              </span>
                            </div>
                            {(data.volumeUSD > 0 || data.volumeSYP > 0) && (
                              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                                <span>قيمة الصفقات:</span>
                                <span className="font-bold text-emerald-400">
                                  {data.volumeUSD > 0 && `$${data.volumeUSD.toLocaleString()}`}
                                  {data.volumeUSD > 0 && data.volumeSYP > 0 && ' | '}
                                  {data.volumeSYP > 0 && `${data.volumeSYP.toLocaleString()} ل.س`}
                                </span>
                              </div>
                            )}
                          </div>
                          {data.description && (
                            <p className="mt-2 text-[10px] text-slate-400 leading-normal border-t border-slate-800/80 pt-1.5">
                              {data.description}
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Center Information Badge for Donut Chart */}
            {isDonut && summary.totalDeals > 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-32">
                {activeItem ? (
                  <div className="animate-in fade-in zoom-in-95 duration-150">
                    <span
                      className="text-[10px] font-black uppercase tracking-wider block truncate px-1"
                      style={{ color: activeItem.color }}
                    >
                      {activeItem.shortLabel || activeItem.name}
                    </span>
                    <span className="text-xl font-black text-slate-900 tabular-nums block leading-tight">
                      {activeItem.count}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 block">
                      {activeItem.percentage}% من المجموع
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">
                      إجمالي الصفقات
                    </span>
                    <span className="text-2xl font-black text-slate-900 tabular-nums block leading-tight">
                      {summary.totalDeals}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 block">
                      {summary.completionRate}% نسبة الإنجاز
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>حرّك المؤشر فوق أي قطاع دائري لعرض تفاصيل المرحلة والقيم المالية المرتبطة بها.</span>
          </p>
        </div>

        {/* Right Side (5 cols): Breakdown Bar & Life-cycle Health Insights */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-black text-slate-900 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>مؤشرات صحة الوساطة والإسكرو</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {summary.filteredDeals.length} صفقة مفلترة
              </span>
            </h4>

            {/* Stacked Proportional Bar */}
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex mb-3">
              {summary.slices.map((slice) => {
                if (slice.percentage <= 0) return null;
                return (
                  <div
                    key={slice.id}
                    style={{
                      width: `${slice.percentage}%`,
                      backgroundColor: slice.color,
                    }}
                    title={`${slice.name}: ${slice.count} (${slice.percentage}%)`}
                    className="h-full transition-all hover:opacity-85"
                  />
                );
              })}
            </div>

            {/* Detailed Stage Legend Rows */}
            <div className="space-y-2 text-xs">
              {summary.slices.map((slice) => {
                const isSelected = focusedStatus === slice.id;
                return (
                  <button
                    key={slice.id}
                    type="button"
                    onClick={() => {
                      setFocusedStatus(isSelected ? 'all' : slice.id);
                      setShowDealsList(true);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer text-right ${
                      isSelected
                        ? 'bg-white shadow-xs border border-blue-300'
                        : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="font-bold text-slate-800">{slice.name}</span>
                    </div>

                    <div className="flex items-center gap-2 tabular-nums">
                      <span className="font-black text-slate-900">{slice.count}</span>
                      <span className="text-[10px] text-slate-500 w-10 text-left">
                        ({slice.percentage}%)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platform Security & Action Notice */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>جاهزية العمليات الميدانية والتحصيل</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              الصفقات في حالة <strong className="font-black">قيد الانتظار والمعلقة ({summary.activePipelineDeals} صفقة)</strong> تمثل مسار التدفق النشط (Active Pipeline) الذي يتطلب متابعة توثيق الفحص في كراجات الكفر والسويداء وتسليم الآليات.
            </p>
          </div>

          {/* Drill-down Toggle Button */}
          <button
            type="button"
            onClick={() => setShowDealsList(!showDealsList)}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>
              {showDealsList
                ? 'إخفاء قائمة الصفقات المطابقة'
                : `استعراض الصفقات المطابقة (${drillDownDeals.length})`}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showDealsList ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expandable Matching Deals Audit List */}
      {showDealsList && (
        <div className="border-t border-slate-200 bg-slate-50 p-5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-black text-slate-900">
                سجل الصفقات المحددة:{' '}
                {focusedStatus === 'all'
                  ? 'كافة الحالات'
                  : DEAL_STATUS_GROUP_CONFIG[focusedStatus].name}{' '}
                ({drillDownDeals.length} صفقة)
              </h4>
            </div>

            {focusedStatus !== 'all' && (
              <button
                type="button"
                onClick={() => setFocusedStatus('all')}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                عرض كافة الحالات
              </button>
            )}
          </div>

          {drillDownDeals.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              لا توجد صفقات في هذه الفئة بناءً على الفلاتر المطبقة حالياً.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {drillDownDeals.map((deal) => {
                const group = summary.slices.find((s) => s.dealIds.includes(deal.id));
                const groupConfig = group ? DEAL_STATUS_GROUP_CONFIG[group.id] : null;

                return (
                  <div
                    key={deal.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-500 text-[10px]">
                          {deal.id}
                        </span>
                        <span className="font-bold text-slate-900">{deal.listingTitle}</span>
                        {deal.zone && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                            {ZONE_NAMES_MAP[deal.zone] || deal.zone}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                        <span>
                          المشتري: <strong className="text-slate-700">{deal.buyerName}</strong>
                        </span>
                        <span>
                          البائع: <strong className="text-slate-700">{deal.sellerName}</strong>
                        </span>
                        <span>
                          المبلغ: <strong className="text-emerald-700 font-bold">{deal.agreedPrice.toLocaleString()} {deal.currency}</strong>
                        </span>
                        {deal.secretOtp && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold border border-amber-200">
                            رمز التحقق: {deal.secretOtp}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {groupConfig && (
                        <span
                          className="px-2.5 py-1 rounded-lg text-[11px] font-black border"
                          style={{
                            backgroundColor: `${groupConfig.color}15`,
                            color: groupConfig.color,
                            borderColor: `${groupConfig.color}40`,
                          }}
                        >
                          {groupConfig.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
