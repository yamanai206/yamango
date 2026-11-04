import React, { useState, useMemo } from 'react';
import { AdminSecurityProfile, AuditLogEntry, AuditSeverity, AuditActionCategory } from '../types';
import { 
  filterAuditLogs, 
  exportAuditLogsToCsv, 
  exportAuditLogsToJson, 
  calculateSecurityOverviewMetrics 
} from '../utils/auditSecurity';
import { 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Lock, 
  FileText, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Smartphone, 
  Radio, 
  Copy, 
  Check, 
  Filter, 
  Users, 
  Activity, 
  Clock, 
  MapPin, 
  Globe, 
  RefreshCw,
  Power,
  ChevronDown
} from 'lucide-react';

interface AdminSecuritySettingsProps {
  admins: AdminSecurityProfile[];
  auditLogs: AuditLogEntry[];
  onToggle2fa: (adminId: string) => boolean;
}

export const AdminSecuritySettings: React.FC<AdminSecuritySettingsProps> = ({
  admins,
  auditLogs,
  onToggle2fa,
}) => {
  const [activeTab, setActiveTab] = useState<'two_factor' | 'audit_log'>('two_factor');
  
  // Search & Filters for Audit Log
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Copy feedback
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Action Notification
  const [notice, setNotice] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Security Overview Metrics
  const metrics = useMemo(() => calculateSecurityOverviewMetrics(admins, auditLogs), [admins, auditLogs]);

  // Filtered Audit Logs
  const filteredLogs = useMemo(
    () => filterAuditLogs(auditLogs, searchQuery, categoryFilter, severityFilter),
    [auditLogs, searchQuery, categoryFilter, severityFilter]
  );

  const handleToggle2faClick = (admin: AdminSecurityProfile) => {
    const newStatus = onToggle2fa(admin.id);
    setNotice({
      type: 'success',
      message: `تم ${newStatus ? 'تفعيل' : 'تعطيل'} المصادقة الثنائية (2FA) بنجاح للمشرف (${admin.fullName}) وتم توثيق العملية في سجل التدقيق.`,
    });
    setTimeout(() => setNotice(null), 5000);
  };

  const handleDownloadCsv = () => {
    const csvContent = exportAuditLogsToCsv(filteredLogs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `yamango_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotice({
      type: 'info',
      message: `تم تصدير سجل التدقيق (${filteredLogs.length} عملية) بصيغة CSV المتوافقة مع Excel.`,
    });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDownloadJson = () => {
    const jsonContent = exportAuditLogsToJson(filteredLogs);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `yamango_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotice({
      type: 'info',
      message: `تم تصدير سجل التدقيق بصيغة JSON المفتوحة.`,
    });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleCopyLogsSummary = () => {
    const summaryText = filteredLogs
      .slice(0, 20)
      .map((l) => `[${l.timestamp}] [${l.severity.toUpperCase()}] ${l.actorName}: ${l.actionTitleArabic} - ${l.details}`)
      .join('\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summaryText).catch(() => {
          fallbackCopyText(summaryText);
        });
      } else {
        fallbackCopyText(summaryText);
      }
    } catch {
      fallbackCopyText(summaryText);
    }
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch {
      // Ignore if document.execCommand fails in restricted environment
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-700 rounded-xl border border-indigo-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                إعدادات الأمان وسجل التدقيق (Security & Audit Log)
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                إدارة المصادقة الثنائية (2FA) لحسابات المشرفين، ومراقبة وتصدير سجل التدقيق الكامل للعمليات الحساسة في المنصة.
              </p>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('two_factor')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'two_factor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>المصادقة الثنائية 2FA ({admins.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit_log')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit_log'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>سجل التدقيق الكامل ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Action Notice Toast */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 animate-in fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-xs">{notice.message}</span>
          </div>
        </div>
      )}

      {/* Security Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-semibold text-xs">نسبة تغطية المصادقة 2FA</span>
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900 font-mono">
            {metrics.twoFactorAdoptionRate}%
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{metrics.twoFactorEnabledCount} من {metrics.totalAdmins} حسابات مفعلة</span>
            {metrics.twoFactorDisabledCount > 0 ? (
              <span className="text-amber-700 font-bold">{metrics.twoFactorDisabledCount} بحاجة لتفعيل</span>
            ) : (
              <span className="text-emerald-700 font-bold">مكتمل 100%</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-semibold text-xs">إجمالي أحداث التدقيق</span>
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {metrics.totalAuditEvents} <span className="text-xs font-bold text-slate-500">سجل</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>سجل مشفر غير قابل للتعديل</span>
            <span className="text-emerald-700 font-bold">نشط وموثق</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-semibold text-xs">العمليات الحرجة والحساسة</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700 font-mono">
            {metrics.criticalEventsCount + metrics.highEventsCount} <span className="text-xs font-bold text-slate-500">عملية</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{metrics.criticalEventsCount} حرجة · {metrics.highEventsCount} حساسة</span>
            <span className="text-amber-800 font-bold">تتطلب 2FA</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-semibold text-xs">محاولات محجوبة ومشبوهة</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700 font-mono">
            {metrics.suspiciousBlockedAttemptsCount} <span className="text-xs font-bold text-slate-500">محاولة</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>حجب مشاركة أرقام خارج الإسكرو</span>
            <span className="text-emerald-700 font-bold">تم التصدي بنجاح</span>
          </div>
        </div>
      </div>

      {/* TAB 1: 2FA MANAGEMENT FOR ADMINS */}
      {activeTab === 'two_factor' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 text-white rounded-2xl p-5 shadow-xs border border-indigo-900/40">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-400/30">
                  <Lock className="w-3.5 h-3.5" />
                  <span>سياسة الأمان الصارمة لحسابات المشرفين</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  التحقق بخطوتين عبر رسائل SMS المحلية أو تطبيقات المصادقة (TOTP)
                </h3>
                <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
                  نظراً لحساسية العمليات المالية (تحديث سعر الصرف اليومي، تحرير أموال الإسكرو، واعتماد وكلاء الدفع في الكفر والسويداء)، يُلزم المشرفون بتفعيل 2FA لحماية الحساب من أي اختراق عند تصفح المنصة.
                </p>
              </div>

              <div className="text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700 shrink-0 font-mono space-y-1">
                <div className="text-slate-400">شبكات التحقق المدعومة:</div>
                <div className="text-emerald-400 font-bold">سيريتل (Syriatel) · MTN سوريا</div>
                <div className="text-indigo-300 font-bold">Google Authenticator · Aegis</div>
              </div>
            </div>
          </div>

          {/* Admin List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm leading-snug">
                          {admin.fullName}
                        </h4>
                        <span className="text-[11px] text-slate-500 block">
                          {admin.roleTitleArabic}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-md ${
                        admin.twoFactorEnabled
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {admin.twoFactorEnabled ? '2FA مفعلة ✓' : '2FA معطلة ✕'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">البريد الإلكتروني:</span>
                      <span className="font-mono text-slate-800">{admin.email}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">رقم الهاتف المرتبط:</span>
                      <span className="font-mono font-bold text-slate-800">{admin.phone}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">طريقة المصادقة:</span>
                      <span className="font-bold text-indigo-700 flex items-center gap-1">
                        {admin.twoFactorMethod === 'authenticator_app' ? (
                          <>
                            <Radio className="w-3.5 h-3.5 text-indigo-600" />
                            <span>تطبيق المصادقة (TOTP)</span>
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>رسالة SMS سيريتل/MTN</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-400">آخر تسجيل دخول:</span>
                      <span className="text-slate-600 font-mono">{admin.lastLoginAt}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {admin.twoFactorEnabled ? 'الحساب مؤمن ضد محاولات سرقة الجلسة' : 'الحساب معرض لتهديدات كلمة المرور'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggle2faClick(admin)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      admin.twoFactorEnabled
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{admin.twoFactorEnabled ? 'تعطيل 2FA' : 'تفعيل 2FA الآن'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG VIEWER & EXPORT */}
      {activeTab === 'audit_log' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Audit Controls & Export Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>سجل التدقيق للأحداث الحساسة (Audit Log System)</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                سجل زمني مفصل لجميع التعديلات المالية والأمنية مع الموقع الجغرافي والـ IP.
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <button
                type="button"
                onClick={handleCopyLogsSummary}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="نسخ ملخص السجل إلى الحافظة"
              >
                {copiedSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{copiedSuccess ? 'تم النسخ!' : 'نسخ الملخص'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="تصدير السجل بتنسيق JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير JSON</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="تصدير السجل بتنسيق CSV المتوافق مع Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير Excel (CSV)</span>
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث في السجل بالمنفذ أو العملية أو التفاصيل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium">التصنيف:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 focus:outline-hidden font-bold"
                >
                  <option value="all">كافة التصنيفات</option>
                  <option value="security_auth">أمان الحسابات</option>
                  <option value="exchange_rates">أسعار الصرف</option>
                  <option value="commissions">العمولات</option>
                  <option value="payment_agents">وكلاء الدفع</option>
                  <option value="escrow_deals">الأمانات والوساطة</option>
                  <option value="garages_inspections">فحص الكراجات</option>
                  <option value="anti_fraud">مكافحة الاحتيال</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-medium">الخطورة:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 focus:outline-hidden font-bold"
                >
                  <option value="all">كافة المستويات</option>
                  <option value="critical">حرج (Critical)</option>
                  <option value="high">حساس (High)</option>
                  <option value="medium">متوسط (Medium)</option>
                  <option value="low">عادي (Low)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-xs">لا توجد سجلات تدقيق تطابق معايير الفرز الحالية</p>
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">الوقت والمعرف</th>
                    <th className="py-3 px-4">المنفذ والموقع</th>
                    <th className="py-3 px-4">التصنيف</th>
                    <th className="py-3 px-4">العملية والوصف</th>
                    <th className="py-3 px-4 text-center">مستوى الأهمية</th>
                    <th className="py-3 px-4 text-center">النتيجة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp & ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800 text-[11px]">
                          {log.timestamp}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {log.id}
                        </div>
                      </td>

                      {/* Actor & Location */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {log.actorName}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{log.location || 'السويداء'}</span>
                          {log.ipAddress && (
                            <span className="font-mono text-slate-400">({log.ipAddress})</span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {log.categoryLabelArabic}
                        </span>
                      </td>

                      {/* Action & Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 mb-0.5">
                          {log.actionTitleArabic}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed max-w-xl">
                          {log.details}
                        </p>
                      </td>

                      {/* Severity Badge */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        {log.severity === 'critical' && (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-200">
                            حرج (Critical)
                          </span>
                        )}
                        {log.severity === 'high' && (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                            حساس (High)
                          </span>
                        )}
                        {log.severity === 'medium' && (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                            متوسط (Medium)
                          </span>
                        )}
                        {log.severity === 'low' && (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                            عادي (Low)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        {log.status === 'success' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ناجح</span>
                          </span>
                        )}
                        {log.status === 'blocked' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>محجوب</span>
                          </span>
                        )}
                        {log.status === 'warning' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>تنبيه</span>
                          </span>
                        )}
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
              سجل التدقيق مشفر وفق معايير الحماية المركزية، ولا يمكن حذف أي بند منه إلا بقرار إداري عليا موثق.
            </span>
            <div className="font-mono text-slate-700 font-bold">
              عرض {filteredLogs.length} من أصل {auditLogs.length} حدث تدقيق
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
