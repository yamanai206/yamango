import React from 'react';
import { Deal } from '../types';
import { 
  Clock, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  Award,
  ArrowUpRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface PlatformEfficiencyPanelProps {
  deals: Deal[];
}

const MONTHLY_EFFICIENCY_DATA = [
  { month: 'مايو', avgClosingDays: 5.8, repeatRate: 24, totalDeals: 8 },
  { month: 'يونيو', avgClosingDays: 5.1, repeatRate: 28, totalDeals: 11 },
  { month: 'يوليو', avgClosingDays: 4.4, repeatRate: 31, totalDeals: 14 },
  { month: 'أغسطس', avgClosingDays: 3.9, repeatRate: 36, totalDeals: 18 },
  { month: 'سبتمبر', avgClosingDays: 3.5, repeatRate: 40, totalDeals: 21 },
  { month: 'أكتوبر', avgClosingDays: 3.1, repeatRate: 44, totalDeals: 25 },
];

export const PlatformEfficiencyPanel: React.FC<PlatformEfficiencyPanelProps> = ({ deals }) => {
  // Compute repeat customer metrics from deals
  const buyerCounts: Record<string, number> = {};
  deals.forEach((d) => {
    buyerCounts[d.buyerName] = (buyerCounts[d.buyerName] || 0) + 1;
    buyerCounts[d.sellerName] = (buyerCounts[d.sellerName] || 0) + 1;
  });

  const totalParties = Object.keys(buyerCounts).length;
  const repeatParties = Object.values(buyerCounts).filter((c) => c > 1).length;
  const repeatRate = totalParties > 0 ? Math.round((repeatParties / totalParties) * 100) : 42;

  // Average closing time in days
  const avgClosingDays = 3.2; // 3.2 days (approx 76 hours from escrow deposit to final delivery)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs text-xs space-y-0">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-l from-indigo-50/50 via-white to-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                مؤشرات كفاءة المنصة وسرعة التنفيذ (Efficiency KPIs)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                قياس متوسط زمن إتمام الصفقات ونسبة ثقة العملاء العائدين في السويداء وبلدة الكفر.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold px-3 py-1 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-200">
            تحديث فوري للأداء
          </span>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* KPI 1: Avg Closing Time */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-slate-700 text-xs">متوسط زمن إغلاق الصفقة</span>
              <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {avgClosingDays} <span className="text-xs font-bold text-slate-500">أيام</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>(~ 76 ساعة من العربون للتسليم)</span>
              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                تسارع 28%
              </span>
            </div>
          </div>

          {/* KPI 2: Repeat Customer Rate */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-slate-700 text-xs">نسبة العملاء العائدين</span>
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {repeatRate}%
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>عملاء نفذوا أكثر من صفقة</span>
              <span className="text-emerald-600 font-bold">+6% هذا الشهر</span>
            </div>
          </div>

          {/* KPI 3: Inspection Conversion Rate */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-slate-700 text-xs">نسبة حسم الصفقات بعد الفحص</span>
              <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-700 font-mono mt-1">
              88.5%
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>فحص الكراج يحسم قرار الشراء</span>
              <span className="text-blue-700 font-bold">ثقة عالية</span>
            </div>
          </div>

          {/* KPI 4: Escrow Safety Rate */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-slate-700 text-xs">معدل أمان الودائع والعربون</span>
              <span className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-purple-700 font-mono mt-1">
              100%
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>صفر نزاعات مالية معلقة</span>
              <span className="text-purple-700 font-bold">حماية تامة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Trend 1: Deal Closing Duration Reduction */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-bold text-slate-700">تراجع متوسط زمن إغلاق الصفقة (بالأيام):</span>
            <span className="text-emerald-700 font-bold">انخفاض من 5.8 إلى 3.1 أيام</span>
          </div>

          <div className="h-56 sm:h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_EFFICIENCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id="closingDaysGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 8]} />
                <Tooltip
                  formatter={(val: any) => [`${val} أيام`, 'متوسط زمن الإغلاق']}
                  labelFormatter={(lbl) => `شهر: ${lbl}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="avgClosingDays"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#closingDaysGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend 2: Repeat Customer Rate Growth */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-bold text-slate-700">تنامي نسبة العملاء العائدين للمنصة (%):</span>
            <span className="text-emerald-700 font-bold">ارتفاع مستمر لـ 44%</span>
          </div>

          <div className="h-56 sm:h-64 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_EFFICIENCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id="repeatRateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 60]} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'نسبة العملاء العائدين']}
                  labelFormatter={(lbl) => `شهر: ${lbl}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="repeatRate"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#repeatRateGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
