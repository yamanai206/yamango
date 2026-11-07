import React, { useState } from 'react';
import { Deal, User, PaymentAgent } from '../types';
import { 
  Building, 
  KeyRound, 
  CheckCircle2, 
  Clock, 
  User as UserIcon, 
  AlertTriangle,
  Loader2,
  ShieldCheck
} from 'lucide-react';

interface AgentDashboardViewProps {
  currentUser: User;
  agents: PaymentAgent[];
  deals: Deal[];
  onConfirmEscrow: (dealId: string, enteredOtp: string, agentId: string) => Promise<{ success: boolean; message?: string; receiptNumber?: string }>;
}

export const AgentDashboardView: React.FC<AgentDashboardViewProps> = ({
  currentUser,
  agents,
  deals,
  onConfirmEscrow,
}) => {
  // إيجاد الوكيل المرتبط بهذا المستخدم
  const myAgentProfile = agents.find(a => a.userId === currentUser.id);
  
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!myAgentProfile) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">حسابك غير مرتبط بأي وكيل دفع</h2>
        <p className="text-slate-500 mt-2">يرجى مراجعة إدارة المنصة لربط حسابك بنقطة دفع معتمدة.</p>
      </div>
    );
  }

  // 🔥 الفلترة الصارمة: الوكيل يرى فقط الصفقات التي هو مسؤول عنها أو المعلقة
  const mySecuredDeals = deals.filter(d => 
    d.status === 'escrow_secured' && d.escrowAgentName === myAgentProfile.agencyName
  );
  
  const pendingDeals = deals.filter(d => d.status === 'escrow_pending');

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await onConfirmEscrow(selectedDeal.id, enteredOtp, myAgentProfile.id);
    
    if (res.success) {
      setFeedback({ type: 'success', text: `تم تأكيد استلام الكاش بنجاح! رقم الإيصال: ${res.receiptNumber}` });
      setTimeout(() => {
        setSelectedDeal(null);
        setEnteredOtp('');
        setFeedback(null);
      }, 2500);
    } else {
      setFeedback({ type: 'error', text: res.message || 'فشل التحقق من الرمز' });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header - يعرض بيانات الوكيل فقط */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Building className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black">{myAgentProfile.agencyName}</h1>
            <p className="text-slate-300 text-sm mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1"><UserIcon className="w-4 h-4" /> {myAgentProfile.name}</span>
              <span className="flex items-center gap-1 text-emerald-400"><ShieldCheck className="w-4 h-4" /> وكيل معتمد</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Deals */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            عرابين بانتظار الإيداع ({pendingDeals.length})
          </h2>
          
          {pendingDeals.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 border border-slate-200 border-dashed">
              لا توجد عرابين بانتظار الاستلام حالياً.
            </div>
          ) : (
            pendingDeals.map(deal => (
              <div key={deal.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{deal.listingTitle}</h3>
                      <p className="text-xs text-slate-500 mt-1">المشتري: {deal.buyerName}</p>
                      <p className="text-xs text-slate-500 mt-1">البائع: {deal.sellerName}</p>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">مبلغ العربون</span>
                      <span className="font-bold text-orange-700 text-sm">{deal.depositAmount.toLocaleString()} {deal.currency}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedDeal(deal); setEnteredOtp(''); setFeedback(null); }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" /> إدخال رمز OTP واستلام الكاش
                </button>
              </div>
            ))
          )}
        </div>

        {/* My Secured Deals (خاصة بالوكيل فقط) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            أمانات قمت باستلامها ({mySecuredDeals.length})
          </h2>
          
          {mySecuredDeals.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 border border-slate-200 border-dashed">
              لم تقم باستلام أي أمانات بعد.
            </div>
          ) : (
            mySecuredDeals.map(deal => (
              <div key={deal.id} className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/30 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{deal.listingTitle}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">إيصال: {deal.receiptNumber}</p>
                  <p className="text-[10px] text-slate-500 mt-1">المشتري: {deal.buyerName}</p>
                </div>
                <div className="text-left">
                  <span className="font-bold text-emerald-700 text-sm">{deal.depositAmount.toLocaleString()} {deal.currency}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* OTP Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-2">تأكيد استلام العربون</h3>
            <p className="text-xs text-slate-500 mb-4">الصفقة: {selectedDeal.listingTitle}</p>

            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">رمز التحقق من المشتري (OTP):</label>
                <input
                  type="text"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.toUpperCase())}
                  placeholder="YM-XXXX"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center text-lg font-bold tracking-widest uppercase focus:border-emerald-500"
                  required
                />
              </div>

              {feedback && (
                <div className={`p-3 rounded-xl text-xs font-bold text-center ${feedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {feedback.text}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setSelectedDeal(null)} disabled={isSubmitting} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl">إلغاء</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  تأكيد الاستلام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};