import React, { useState, useMemo } from 'react';
import { PaymentAgent, Deal, ZoneLocation } from '../types';
import { 
  extractVerificationCodes, 
  calculateAgentMetrics, 
  generateAgentVerificationOtp,
  normalizeOtp,
  isValidOtpFormat,
  VerificationCodeItem
} from '../utils/agentVerification';
import { 
  Building, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Power, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  KeyRound, 
  Copy, 
  Check, 
  Filter, 
  Banknote,
  Coins,
  QrCode,
  Users,
  Store,
  X
} from 'lucide-react';

interface AgentManagerProps {
  agents: PaymentAgent[];
  deals: Deal[];
  onAddAgent: (agentData: Omit<PaymentAgent, 'id'>) => PaymentAgent;
  onRemoveAgent: (agentId: string) => boolean;
  onToggleAgentStatus: (agentId: string) => void;
  onRegenerateOtp: (dealId: string, customCode?: string) => string;
}

const ZONE_LABELS: Record<ZoneLocation, string> = {
  al_kafr: 'الكفر',
  suwayda: 'السويداء (المركز)',
  shahba: 'شهبا',
  salkhad: 'صلخد',
  al_qurayya: 'القريا',
  ariqa: 'عريقة',
  mazraa: 'المزرعة',
};

export const AgentManager: React.FC<AgentManagerProps> = ({
  agents,
  deals,
  onAddAgent,
  onRemoveAgent,
  onToggleAgentStatus,
  onRegenerateOtp,
}) => {
  const [activeSection, setActiveSection] = useState<'agents' | 'codes'>('agents');
  
  // Agent Creation Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgencyName, setNewAgencyName] = useState('');
  const [newZone, setNewZone] = useState<ZoneLocation>('al_kafr');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBalanceSYP, setNewBalanceSYP] = useState(0);
  const [newBalanceUSD, setNewBalanceUSD] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion Confirmation Modal
  const [agentToDelete, setAgentToDelete] = useState<PaymentAgent | null>(null);

  // Verification Code Search & Filter
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [codeStatusFilter, setCodeStatusFilter] = useState<'all' | 'pending' | 'secured'>('all');
  
  // Code Quick Inspector / Validator State
  const [checkInputCode, setCheckInputCode] = useState('');
  const [checkResult, setCheckResult] = useState<{ match?: Deal; error?: string } | null>(null);

  // Copied feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Action alerts
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Edit / Custom Code Modal
  const [customOtpTargetDeal, setCustomOtpTargetDeal] = useState<{ dealId: string; currentOtp: string } | null>(null);
  const [customOtpInput, setCustomOtpInput] = useState('');

  // Metrics
  const metrics = useMemo(() => calculateAgentMetrics(agents, deals), [agents, deals]);

  // Codes
  const verificationCodes = useMemo(
    () => extractVerificationCodes(deals, codeSearchQuery, codeStatusFilter),
    [deals, codeSearchQuery, codeStatusFilter]
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newAgentName.trim() || !newAgencyName.trim() || !newAddress.trim() || !newPhone.trim()) {
      setFormError('يرجى ملء جميع الحقول المطلوبة لمعلومات الوكيل.');
      return;
    }

    onAddAgent({
      name: newAgentName.trim(),
      agencyName: newAgencyName.trim(),
      zone: newZone,
      address: newAddress.trim(),
      phone: newPhone.trim(),
      balanceSYP: Number(newBalanceSYP) || 0,
      balanceUSD: Number(newBalanceUSD) || 0,
      isActive: true,
    });

    setNotification({
      type: 'success',
      message: `تم اعتماد وإضافة الوكيل (${newAgencyName}) بنجاح في شبكة المنصة!`,
    });
    setTimeout(() => setNotification(null), 4000);

    // Reset form & close
    setNewAgentName('');
    setNewAgencyName('');
    setNewAddress('');
    setNewPhone('');
    setNewBalanceSYP(0);
    setNewBalanceUSD(0);
    setIsAddModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!agentToDelete) return;
    onRemoveAgent(agentToDelete.id);
    setNotification({
      type: 'info',
      message: `تمت إزالة نقطة الدفع (${agentToDelete.agencyName}) من قائمة الوكلاء المعتمدين.`,
    });
    setTimeout(() => setNotification(null), 4000);
    setAgentToDelete(null);
  };

  const handleRegenerateCode = (dealId: string) => {
    const freshCode = onRegenerateOtp(dealId);
    setNotification({
      type: 'success',
      message: `تم توليد رمز تحقق جديد (${freshCode}) وتحديثه للصفقة فوراً!`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCustomOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customOtpTargetDeal) return;

    const norm = normalizeOtp(customOtpInput);
    if (!isValidOtpFormat(norm)) {
      alert('صيغة الرمز غير صالحة. يجب أن يبدأ بـ YM- متبوعاً بـ 4 إلى 6 أرقام (مثال: YM-7821).');
      return;
    }

    onRegenerateOtp(customOtpTargetDeal.dealId, norm);
    setNotification({
      type: 'success',
      message: `تم تعيين الرمز المخصص (${norm}) بنجاح للصفقة.`,
    });
    setTimeout(() => setNotification(null), 4000);
    setCustomOtpTargetDeal(null);
    setCustomOtpInput('');
  };

  const handleCheckCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInputCode.trim()) {
      setCheckResult(null);
      return;
    }

    const norm = normalizeOtp(checkInputCode);
    const matchedDeal = deals.find((d) => normalizeOtp(d.secretOtp) === norm);

    if (matchedDeal) {
      setCheckResult({ match: matchedDeal });
    } else {
      setCheckResult({ error: `الرمز (${norm}) غير مقترن بأي صفقة مسجلة في النظام!` });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-700 rounded-xl border border-emerald-200">
              <Building className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                إدارة وكلاء الدفع ورموز التحقق (Agent & OTP Manager)
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                إضافة وإلغاء نقاط الدفع المعتمدة بالكفر والسويداء، مع توليد ومراقبة رموز التحقق (OTP) لتأمين استلام العربون يداً بيد.
              </p>
            </div>
          </div>
        </div>

        {/* Section Tabs & New Agent Button */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveSection('agents')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'agents'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>وكلاء الدفع ({agents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('codes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'codes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>رموز التحقق OTP ({deals.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة وكيل دفع جديد</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-xs">{notification.message}</span>
          </div>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-semibold text-xs">إجمالي وكلاء الدفع</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {metrics.totalAgents} <span className="text-xs font-bold text-slate-500">وكلاء</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>{metrics.activeAgents} نشطون معتمدون</span>
            {metrics.inactiveAgents > 0 && (
              <span className="text-amber-700 font-bold">{metrics.inactiveAgents} موقوف</span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-semibold text-xs">رصيد الأمانات الكاش (USD)</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700 font-mono">
            ${metrics.totalFloatUSD.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>محفوظ لدى الوكلاء</span>
            <span className="text-emerald-700 font-bold">موثق</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-semibold text-xs">رصيد الأمانات الكاش (SYP)</span>
            <Banknote className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-800 font-mono">
            {metrics.totalFloatSYP.toLocaleString()} <span className="text-xs font-bold text-slate-500">ل.س</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>جاهز للصرف والتسليم</span>
            <span className="text-blue-700 font-bold">شام كاش وكاش</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-semibold text-xs">الصفقات المحمية بالإسكرو</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {metrics.dealsSecuredCount} <span className="text-xs font-bold text-slate-500">صفقات</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>تم الإيداع برمز OTP المعتمد</span>
            <span className="text-emerald-700 font-bold">100% مضمونة</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: AGENTS DIRECTORY & MANAGEMENT */}
      {activeSection === 'agents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>قائمة وكلاء الدفع ونقاط استلام العربون المعتمدة</span>
            </h3>
            <span className="text-xs text-slate-500">
              يمكن للمشرف تفعيل أو إيقاف أي نقطة أو إزالتها نهائياً.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  agent.isActive 
                    ? 'border-slate-200 hover:border-slate-300' 
                    : 'border-rose-200 bg-rose-50/20 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-xs sm:text-sm leading-snug">
                          {agent.agencyName}
                        </h4>
                        <span className="text-[11px] text-slate-500 block">
                          المسؤول: {agent.name}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        agent.isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {agent.isActive ? 'نشط ومعتمد ✓' : 'موقوف مؤقتاً'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{agent.address}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        ({ZONE_LABELS[agent.zone] || agent.zone})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono text-slate-800 font-bold">{agent.phone}</span>
                    </div>
                  </div>

                  {/* Float balances */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block">رصيد الأمانات (USD):</span>
                      <span className="font-mono font-black text-amber-700">
                        ${agent.balanceUSD.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">رصيد الأمانات (SYP):</span>
                      <span className="font-mono font-black text-blue-800">
                        {agent.balanceSYP.toLocaleString()} ل.س
                      </span>
                    </div>
                  </div>
                </div>

                {/* Management Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleAgentStatus(agent.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      agent.isActive
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                    title={agent.isActive ? 'إيقاف النقطة مؤقتاً عن استقبال العرابين' : 'إعادة تفعيل النقطة'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{agent.isActive ? 'إيقاف مؤقت' : 'تفعيل النقطة'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAgentToDelete(agent)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="إزالة الوكيل من المنصة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: VERIFICATION CODES (OTP) MANAGER */}
      {activeSection === 'codes' && (
        <div className="space-y-5">
          {/* Quick Code Validator & Inspector Card */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-xs border border-emerald-900/40">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-black text-sm flex items-center gap-2 text-emerald-400">
                  <KeyRound className="w-4 h-4" />
                  <span>فاحص رمز التحقق الفوري (Instant OTP Verifier)</span>
                </h3>
                <p className="text-slate-300 text-xs mt-0.5">
                  أدخل رمز التحقق الذي استفسر عنه العميل أو أظهره للوكيل للتأكد من ربطه الصحيح بصفقته ومبلغ العربون المحدد.
                </p>
              </div>
            </div>

            <form onSubmit={handleCheckCode} className="flex flex-col sm:flex-row gap-2 max-w-xl">
              <input
                type="text"
                placeholder="أدخل الرمز مثلاً: YM-8492 أو 8492"
                value={checkInputCode}
                onChange={(e) => setCheckInputCode(e.target.value)}
                className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 font-mono font-bold"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>التحقق من الرمز</span>
              </button>
            </form>

            {/* Verification Result Output */}
            {checkResult && (
              <div className="mt-4 pt-3 border-t border-slate-800">
                {checkResult.match ? (
                  <div className="bg-emerald-900/40 border border-emerald-600/50 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-black text-emerald-200">الرمز سليم ومطابق 100%!</span>
                        <span className="bg-emerald-800 px-2 py-0.5 rounded font-mono font-black text-white">
                          {checkResult.match.secretOtp}
                        </span>
                      </div>
                      <div className="text-slate-300">
                        الصفقة: <span className="font-bold text-white">{checkResult.match.listingTitle}</span> • المشتري: {checkResult.match.buyerName}
                      </div>
                      <div className="text-slate-300 text-[11px] mt-0.5">
                        مبلغ العربون المطلوب: <span className="font-mono font-bold text-amber-300">{checkResult.match.depositAmount.toLocaleString()} {checkResult.match.currency}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${
                        checkResult.match.status === 'escrow_secured'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-amber-500 text-slate-950'
                      }`}>
                        {checkResult.match.status === 'escrow_secured' ? 'العربون مدفوع ومحجوز' : 'بانتظار الاستلام كاش'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-950/60 border border-rose-700/60 p-3 rounded-xl flex items-center gap-2 text-rose-200 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{checkResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search, Filter & Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>جدول كافة رموز التحقق المسجلة بالصفقات</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  إدارة الرموز السرية لكل صفقة، مع إمكانية إعادة التوليد أو التعديل المباشر للمشرفين.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="بحث بالرمز أو الأطراف..."
                    value={codeSearchQuery}
                    onChange={(e) => setCodeSearchQuery(e.target.value)}
                    className="pr-8 pl-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-600 w-full sm:w-48"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setCodeStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      codeStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    الكل ({deals.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeStatusFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      codeStatusFilter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    بانتظار الإيداع
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeStatusFilter('secured')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      codeStatusFilter === 'secured' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    العربون محجوز
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {verificationCodes.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-xs">لا توجد رموز تحقق تطابق معايير البحث المحددة</p>
                </div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">رمز التحقق (OTP)</th>
                      <th className="py-3 px-4">الصفقة والآلية</th>
                      <th className="py-3 px-4">أطراف الصفقة</th>
                      <th className="py-3 px-4">مبلغ العربون</th>
                      <th className="py-3 px-4">حالة الإيداع</th>
                      <th className="py-3 px-4">الوكيل المستلم والإيصال</th>
                      <th className="py-3 px-4 text-center">إجراءات الرمز</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {verificationCodes.map((item) => (
                      <tr key={item.dealId} className="hover:bg-slate-50/70 transition-colors">
                        {/* OTP code badge with copy button */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 bg-slate-900 text-amber-400 font-mono font-black px-2.5 py-1 rounded-lg border border-slate-700 shadow-2xs">
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                            <span>{item.code}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(item.code)}
                              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                              title="نسخ الرمز"
                            >
                              {copiedCode === item.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Listing Title */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 max-w-xs truncate" title={item.listingTitle}>
                            {item.listingTitle}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {item.dealId}
                          </div>
                        </td>

                        {/* Parties */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">
                            المشتري: {item.buyerName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            البائع: {item.sellerName}
                          </div>
                        </td>

                        {/* Deposit Amount */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono font-black text-slate-900">
                          {item.currency === 'USD' 
                            ? `$${item.depositAmount.toLocaleString()}` 
                            : `${item.depositAmount.toLocaleString()} ل.س`}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black ${
                              item.isSecured
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-900 border border-amber-200'
                            }`}
                          >
                            {item.statusLabelArabic}
                          </span>
                        </td>

                        {/* Escrow Agent & Receipt */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.agentName ? (
                            <div>
                              <div className="font-semibold text-slate-800 text-[11px]">
                                {item.agentName}
                              </div>
                              {item.receiptNumber && (
                                <div className="text-[10px] font-mono text-slate-500">
                                  إيصال: {item.receiptNumber}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRegenerateCode(item.dealId)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="توليد رمز عشوائي جديد بديل"
                            >
                              <RefreshCw className="w-3 h-3 text-amber-600" />
                              <span>توليد بديل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCustomOtpTargetDeal({ dealId: item.dealId, currentOtp: item.code });
                                setCustomOtpInput(item.code);
                              }}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              title="تخصيص رمز يدوي"
                            >
                              تعديل
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW AGENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Building className="w-4 h-4" />
                </span>
                <h3 className="font-black text-slate-900 text-sm">إضافة وكيل دفع معتمد جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAgentSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم الوكالة أو النقطة التجارية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: نقطة الأمانة لتحويل الأموال والشام كاش"
                  value={newAgencyName}
                  onChange={(e) => setNewAgencyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم الشخص المسؤول المعتمد *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: وليد العبدالله"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">المنطقة / الناحية *</label>
                  <select
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value as ZoneLocation)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-600 font-bold"
                  >
                    <option value="al_kafr">الكفر</option>
                    <option value="suwayda">السويداء (المركز)</option>
                    <option value="salkhad">صلخد</option>
                    <option value="shahba">شهبا</option>
                    <option value="al_qurayya">القريا</option>
                    <option value="ariqa">عريقة</option>
                    <option value="mazraa">المزرعة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">العنوان التفصيلي وموقع النقطة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: بلدة الكفر - المدخل الشمالي جانب مبنى البلدية"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رقم هاتف النقطة المعتمد *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 0966334455"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-emerald-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رصيد الافتتاح (ليرة سورية SYP)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={newBalanceSYP}
                    onChange={(e) => setNewBalanceSYP(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">رصيد الافتتاح (دولار USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={newBalanceUSD}
                    onChange={(e) => setNewBalanceUSD(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>اعتماد الوكيل الآن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM AGENT DELETION */}
      {agentToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-5 space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center gap-2.5 text-rose-600">
              <span className="p-2 bg-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </span>
              <h3 className="font-black text-slate-900 text-sm">تأكيد إزالة وكيل الدفع المعتمد</h3>
            </div>

            <p className="text-slate-600 leading-relaxed">
              هل أنت متأكد من رغبتك في إزالة الوكيل <strong className="text-slate-900">({agentToDelete.agencyName})</strong> من شبكة المنصة؟ لن يتمكن العملاء من اختيار هذه النقطة لاستلام العرابين بعد الآن.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
              <div>الرصيد المودع USD: ${agentToDelete.balanceUSD.toLocaleString()}</div>
              <div>الرصيد المودع SYP: {agentToDelete.balanceSYP.toLocaleString()} ل.س</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAgentToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                تأكيد الإزالة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CUSTOM OTP CODE EDIT */}
      {customOtpTargetDeal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl p-5 space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <h3 className="font-black text-slate-900 text-sm">تخصيص رمز تحقق يدوي</h3>
              </div>
              <button
                type="button"
                onClick={() => setCustomOtpTargetDeal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomOtpSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  أدخل رمز التحقق الجديد (صيغة YM-XXXX):
                </label>
                <input
                  type="text"
                  required
                  value={customOtpInput}
                  onChange={(e) => setCustomOtpInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-black text-center text-sm focus:outline-hidden focus:border-amber-600"
                  placeholder="YM-XXXX"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  الرمز الحالي: <span className="font-mono">{customOtpTargetDeal.currentOtp}</span>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCustomOtpTargetDeal(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  حفظ الرمز المخصص
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
