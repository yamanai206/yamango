import React, { useState, useMemo } from 'react';
import { Deal, ListingCategory } from '../types';
import { computeMonthlyDealStats } from '../utils/dealStatistics';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  PieChart as PieIcon,
  LineChart,
  Calendar,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface DealStatisticsPanelProps {
  deals: Deal[];
}

export const DealStatisticsPanel: React.FC<DealStatisticsPanelProps> = ({ deals }) => {
  const [activeChartTab, setActiveChartTab] = useState<'bar' | 'donut' | 'area'>('bar');
  const [categoryFilter, setCategoryFilter] = useState<ListingCategory | 'all'>('all');
  const [dealStatusFilter, setDealStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  // Filter deals by category if selected
  const filteredDeals = useMemo(() => {
    if (categoryFilter === 'all') return deals;
    return deals.filter((d) => d.listingCategory === categoryFilter);
  }, [deals, categoryFilter]);

  // Compute statistics for current month (October 2026)
  const stats = useMemo(() => {
    return computeMonthlyDealStats(filteredDeals, new Date('2026-10-25'));
  }, [filteredDeals]);

  // Data for Donut Chart
  const pieData = useMemo(() => {
    const list = [
      { name: 'صفقات مكتملة', value: stats.completedCount, color: '#059669' },
      { name: 'صفقات ملغاة', value: stats.cancelledCount, color: '#e11d48' },
    ];
    if (stats.inProgressCount > 0) {
      list.push({ name: 'قيد التنفيذ والإسكرو', value: stats.inProgressCount, color: '#f59e0b' });
    }
    return list;
  }, [stats]);

  // Filtered deals for the quick audit list
  const recentMonthlyDeals = useMemo(() => {
    return stats.monthlyDeals.filter((d) => {
      if (dealStatusFilter === 'completed') return d.status === 'completed';
      if (dealStatusFilter === 'cancelled') return d.status === 'cancelled';
      return d.status === 'completed' || d.status === 'cancelled';
    });
  }, [stats.monthlyDeals, dealStatusFilter]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-l from-slate-50 via-white to-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                إحصائيات الصفقات: المكتملة مقابل الملغاة
              </h3>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{stats.targetMonthName} {stats.targetYear} (الشهر الحالي)</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              تحليل بياني شامل للصفقات المعتمدة والمبرمة عبر المنصة، مع مراقبة أسباب الإلغاء وحماية أموال المشترين والبائعين عبر حسابات الإسكرو.
            </p>
          </div>

          {/* View Toggles & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Type Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveChartTab('bar')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeChartTab === 'bar'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="أعمدة بيانية مقارنة لكل أسبوع"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>أعمدة أسبوعية</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChartTab('donut')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeChartTab === 'donut'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="مخطط دائري لنسب الإتمام والإلغاء"
              >
                <PieIcon className="w-3.5 h-3.5" />
                <span>المخطط الدائري</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveChartTab('area')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeChartTab === 'area'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="منحنى المساحة التراكمي"
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>منحنى التداول</span>
              </button>
            </div>

            {/* Category Select Filter */}
            <div className="relative">
              <select
                aria-label="تصفية حسب التصنيف"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as ListingCategory | 'all')}
                className="pr-7 pl-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="all">كافة أنواع الآليات</option>
                <option value="tractors">جرارات زراعية</option>
                <option value="excavators">حفارات ومعدات</option>
                <option value="cars">سيارات وبيك آب</option>
                <option value="trucks">شاحنات وقلابات</option>
                <option value="heavy_machinery">آليات ثقيلة</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards for the Month */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Completed Deals */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="font-bold text-xs text-emerald-800">الصفقات المكتملة</span>
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {stats.completedCount} <span className="text-xs font-normal text-slate-500">صفقة</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex flex-col gap-0.5">
              <span>إجمالي: <strong className="font-mono text-slate-700">${stats.completedVolumeUSD.toLocaleString()}</strong></span>
              {stats.completedVolumeSYP > 0 && (
                <span>+ <strong className="font-mono text-slate-700">{stats.completedVolumeSYP.toLocaleString()}</strong> ل.س</span>
              )}
            </div>
          </div>

          {/* Card 2: Cancelled Deals */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="font-bold text-xs text-rose-800">الصفقات الملغاة</span>
              <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <XCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-rose-700 font-mono">
              {stats.cancelledCount} <span className="text-xs font-normal text-slate-500">صفقة</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex flex-col gap-0.5">
              <span className="text-rose-700 font-semibold">معدل الإلغاء: {stats.cancellationRate}%</span>
              <span>عربون تم استرداده بالكامل</span>
            </div>
          </div>

          {/* Card 3: Success Rate */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="font-bold text-xs text-blue-800">معدل نجاح الصفقات</span>
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-700 font-mono">
              {stats.successRate}%
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.successRate}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              من أصل {stats.totalClosedCount} صفقة حُسمت هذا الشهر
            </span>
          </div>

          {/* Card 4: In Progress Deals */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="font-bold text-xs text-amber-800">صفقات قيد التنفيذ</span>
              <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono">
              {stats.inProgressCount} <span className="text-xs font-normal text-slate-500">صفقة</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              عربون إسكرو محجوز بانتظار الاستلام
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="p-5 border-b border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Chart (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                {activeChartTab === 'bar' && <span>توزيع الصفقات المكتملة مقابل الملغاة حسب أسابيع الشهر:</span>}
                {activeChartTab === 'donut' && <span>النسبة المئوية للصفقات المكتملة مقابل الملغاة والقائمة:</span>}
                {activeChartTab === 'area' && <span>منحنى نمو الصفقات المكتملة والملغاة خلال أسابيع الشهر:</span>}
              </h4>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                  مكتملة ({stats.completedCount})
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 inline-block" />
                  ملغاة ({stats.cancelledCount})
                </span>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-64 sm:h-72 w-full pt-2">
              {activeChartTab === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="shortLabel"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        direction: 'rtl',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                      formatter={(val: any, name: any) => [
                        `${val} صفقة`,
                        name === 'completed' ? 'الصفقات المكتملة' : 'الصفقات الملغاة',
                      ]}
                      labelFormatter={(label) => `الفترة: ${label}`}
                    />
                    <Legend
                      verticalAlign="top"
                      height={32}
                      formatter={(val) => (val === 'completed' ? 'الصفقات المكتملة' : 'الصفقات الملغاة')}
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                    />
                    <Bar
                      dataKey="completed"
                      name="completed"
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={45}
                    />
                    <Bar
                      dataKey="cancelled"
                      name="cancelled"
                      fill="#e11d48"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={45}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeChartTab === 'donut' && (
                <div className="h-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.75rem',
                          direction: 'rtl',
                          fontSize: '11px',
                          fontWeight: 'bold',
                        }}
                        formatter={(val: any) => [`${val} صفقات`, 'العدد']}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeChartTab === 'area' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.weeklyBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="shortLabel"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        direction: 'rtl',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                      formatter={(val: any, name: any) => [
                        `${val} صفقة`,
                        name === 'completed' ? 'الصفقات المكتملة' : 'الصفقات الملغاة',
                      ]}
                    />
                    <Legend
                      verticalAlign="top"
                      height={32}
                      formatter={(val) => (val === 'completed' ? 'الصفقات المكتملة' : 'الصفقات الملغاة')}
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#059669"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                    />
                    <Area
                      type="monotone"
                      dataKey="cancelled"
                      stroke="#e11d48"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCancelled)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Side Insight Card: Reasons for Cancellation (Why Escrow & Garages Protect Users) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  أسباب إلغاء الصفقات هذا الشهر
                </span>
                <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 font-bold px-1.5 py-0.5 rounded">
                  {stats.cancelledCount} حالات
                </span>
              </div>

              <p className="text-[11px] text-slate-500 mb-3 leading-snug">
                يوضح سجل الإلغاء فاعلية فحص الكراجات المعتمدة والتحقق الصارم من الملكية قبل تسليم العربون النهائي.
              </p>

              {stats.cancellationReasons.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <span>لا توجد صفقات ملغاة مسجلة في هذا الشهر!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.cancellationReasons.map((item, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-start justify-between gap-1 text-[11px]">
                        <span className="font-medium text-slate-800 line-clamp-2">{item.reason}</span>
                        <span className="font-mono font-bold text-rose-700 shrink-0 bg-rose-50 px-1.5 py-0.5 rounded">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>ضمان الإسكرو:</strong> في جميع الحالات الملغاة، تم تحرير واسترداد العربون بالكامل للمشتري دون أي اقتطاع.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filterable Monthly Deals Breakdown Table */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              سجل صفقات الشهر ({stats.targetMonthName} {stats.targetYear}):
            </h4>
            <span className="text-[11px] text-slate-500">
              قائمة الصفقات التي تم إبرامها أو إلغاؤها خلال الفترة المحددة
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setDealStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                dealStatusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل ({stats.totalClosedCount})
            </button>
            <button
              type="button"
              onClick={() => setDealStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                dealStatusFilter === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>المكتملة ({stats.completedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setDealStatusFilter('cancelled')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                dealStatusFilter === 'cancelled'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>الملغاة ({stats.cancelledCount})</span>
            </button>
          </div>
        </div>

        {/* Table of Monthly Deals */}
        <div className="overflow-x-auto">
          {recentMonthlyDeals.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              لا توجد صفقات مطابقة للتصفية في هذا الشهر.
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-3">الآلية والصفقة</th>
                  <th className="py-2.5 px-3">رقم العقد</th>
                  <th className="py-2.5 px-3">المبلغ الإجمالي</th>
                  <th className="py-2.5 px-3">تاريخ التنفيذ</th>
                  <th className="py-2.5 px-3">الحالة والنتيجة</th>
                  <th className="py-2.5 px-3">الملاحظات / سبب الإلغاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentMonthlyDeals.map((deal) => {
                  const isCompleted = deal.status === 'completed';
                  return (
                    <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{deal.listingTitle}</span>
                        <span className="text-[10px] text-slate-500">
                          بين {deal.buyerName} و {deal.sellerName}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        {deal.contract?.contractNumber || 'YAM-CONTR'}
                      </td>

                      <td className="py-2.5 px-3 font-bold font-mono text-slate-900">
                        {deal.agreedPrice.toLocaleString()} {deal.currency}
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {deal.completedAt || deal.cancelledAt || new Date(deal.createdAt).toLocaleDateString('ar-SY')}
                      </td>

                      <td className="py-2.5 px-3">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            مكتملة ومحررة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            ملغاة ومستردة
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 max-w-xs text-[11px]">
                        {isCompleted ? (
                          <span className="text-emerald-700">تم الفحص واستلام الآلية وفراغ الملكية بنجاح</span>
                        ) : (
                          <span className="text-rose-700 line-clamp-1" title={deal.cancellationReason}>
                            {deal.cancellationReason || 'إلغاء باتفاق الطرفين'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
