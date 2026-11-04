import React from 'react';
import { PaymentAgent } from '../types';
import { Building, MapPin, Phone, ShieldCheck, Banknote, QrCode } from 'lucide-react';

interface AgentsListViewProps {
  agents: PaymentAgent[];
  onSelectAgent?: (agent: PaymentAgent) => void;
}

export const AgentsListView: React.FC<AgentsListViewProps> = ({ agents }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Intro */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
            <Building className="w-3.5 h-3.5" />
            <span>شبكة وكلاء الدفع المعتمدين في الكفر والسويداء</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-2">
            نقاط معتمدة لاستلام وتسجيل العربون يداً بيد
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            لمن لا يملك حسابات بنكية إلكترونية، يتولى وكلاؤنا المعتمدون في بلدة الكفر ومدينة السويداء استلام مبالغ العربون نقداً (بالليرة السورية أو الدولار) وتسجيلها فورياً في نظام الإسكرو برمز سري مشفر وإيصال رقمي فوري.
          </p>
        </div>
      </div>

      {/* Agents Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {agents.map((ag) => (
          <div
            key={ag.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  نقطة معتمدة ✓
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                {ag.agencyName}
              </h3>
              <span className="text-xs text-slate-500 font-medium block mb-3">
                المسؤول: {ag.name}
              </span>

              <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{ag.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono">{ag.phone}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">طرق الاستلام المتاحة:</span>
                <span className="font-semibold text-slate-800">
                  كاش · شام كاش · سيريتل كاش
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">رصيد الإسكرو النشط:</span>
                <span className="font-bold text-slate-900 font-mono">
                  ${ag.balanceUSD.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
