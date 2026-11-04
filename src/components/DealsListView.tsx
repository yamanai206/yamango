import React from 'react';
import { Deal } from '../types';
import { ShieldCheck, Clock, Key, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface DealsListViewProps {
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
}

export const DealsListView: React.FC<DealsListViewProps> = ({ deals, onSelectDeal }) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            سجل الصفقات والوساطة المالية (Escrow)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            كل صفقة محمية بنظام العربون المعلق، وعقد إلكتروني موثق، وتأكيد بالرمز السري لدى وكلاء الدفع في الكفر والسويداء.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
          إجمالي الصفقات الجارية: {deals.length}
        </div>
      </div>

      {/* Deals List */}
      <div className="space-y-3">
        {deals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">لا توجد صفقات حالياً</h3>
            <p className="text-xs text-slate-500">عند بدء صفقة جديدة من أي إعلان، ستظهر تفاصيلها هنا.</p>
          </div>
        ) : (
          deals.map((deal) => {
            const isSecured = deal.status === 'escrow_secured';
            const isCompleted = deal.status === 'completed';
            const isPending = deal.status === 'escrow_pending';

            return (
              <div
                key={deal.id}
                onClick={() => onSelectDeal(deal)}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-orange-400 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      isCompleted ? 'bg-emerald-100 text-emerald-800' : isSecured ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-900'
                    }`}>
                      {isCompleted ? '✓ صفقة مكتملة ومغلقة' : isSecured ? '✓ العربون محجوز ومؤمن (إسكرو)' : 'بانتظار تأكيد العربون لدى الوكيل'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {deal.contract?.contractNumber || 'YMG-XXXX'}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {deal.listingTitle}
                  </h3>

                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>المشتري: {deal.buyerName}</span>
                    <span>·</span>
                    <span>البائع: {deal.sellerName}</span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 gap-2">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">إجمالي الصفقة:</span>
                    <span className="text-base font-black text-slate-900 tabular-nums">
                      {deal.agreedPrice.toLocaleString()} {deal.currency}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                    <Key className="w-3.5 h-3.5" />
                    <span>رمز الوكيل: {deal.secretOtp}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};