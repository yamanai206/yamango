import React, { useState } from 'react';
import { Deal } from '../types';
import { 
  computeEscrowJourney, 
  EscrowJourneyStage, 
  EscrowStageId 
} from '../utils/escrowJourney';
import { 
  ShieldCheck, 
  FileText, 
  Wrench, 
  Coins, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  Key, 
  Building,
  Check,
  Lock,
  ChevronLeft,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface EscrowJourneyVisualizerProps {
  deal: Deal;
  onNavigateToTab?: (tab: 'timeline' | 'contract' | 'escrow_otp' | 'delivery' | 'whatsapp') => void;
  className?: string;
}

export const EscrowJourneyVisualizer: React.FC<EscrowJourneyVisualizerProps> = ({
  deal,
  onNavigateToTab,
  className = '',
}) => {
  const journey = computeEscrowJourney(deal);
  const [selectedStageId, setSelectedStageId] = useState<EscrowStageId>(journey.currentStageId);

  const selectedStage = journey.stages.find((s) => s.id === selectedStageId) || journey.stages[0];

  const getStageIcon = (id: EscrowStageId, state: string) => {
    switch (id) {
      case 'initiation':
        return <FileText className="w-4 h-4" />;
      case 'inspection':
        return <Wrench className="w-4 h-4" />;
      case 'deposit_escrow':
        return <Coins className="w-4 h-4" />;
      case 'completion':
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  return (
    <div
      data-testid="escrow-journey-visualizer"
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all ${className}`}
    >
      {/* Top Banner & Progress Meter */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-400/20">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-black text-white">
                مسار حالة الإسكرو والضمان المالي (Escrow Journey)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              متابعة مباشرة وموثقة للمراحل الأربعة لحماية أموال المشتري وضمان تسليم الآلية للبائع
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${journey.statusBadge.bgClass} ${journey.statusBadge.textClass} ${journey.statusBadge.borderClass}`}
            >
              {journey.statusBadge.label}
            </span>
          </div>
        </div>

        {/* Horizontal Visual Stepper Line */}
        <div className="pt-2 pb-1 relative">
          {/* Track line behind steps */}
          <div className="absolute top-7 left-8 right-8 h-1 bg-slate-700/80 -translate-y-1/2 z-0 hidden sm:block">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 transition-all duration-700"
              style={{ width: `${journey.progressPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2 relative z-10">
            {journey.stages.map((stage, idx) => {
              const isSelected = stage.id === selectedStageId;
              const isDone = stage.state === 'completed';
              const isInProgress = stage.state === 'in_progress';
              const isCancelled = stage.state === 'cancelled';

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`p-2.5 rounded-xl border transition-all text-center flex flex-col items-center cursor-pointer relative ${
                    isSelected
                      ? 'bg-white/20 border-amber-400 ring-2 ring-amber-400/30'
                      : 'bg-white/10 hover:bg-white/15 border-white/10'
                  }`}
                >
                  {/* Step Bubble Icon */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-transform ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-900/30 font-black'
                        : isInProgress
                        ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/30 font-black animate-pulse'
                        : isCancelled
                        ? 'bg-rose-500 text-white font-black'
                        : 'bg-slate-700 text-slate-400 border border-slate-600'
                    }`}
                  >
                    {isDone ? '✓' : getStageIcon(stage.id, stage.state)}
                  </div>

                  {/* Stage Label */}
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-mono text-[10px] text-slate-400">0{stage.stepNumber}</span>
                      <strong className="text-xs text-white font-black">{stage.label}</strong>
                    </div>
                    <span
                      className={`text-[10px] font-bold block mt-0.5 truncate ${
                        isDone
                          ? 'text-emerald-300'
                          : isInProgress
                          ? 'text-amber-300'
                          : isCancelled
                          ? 'text-rose-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage.stateLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Stage Detail Card */}
      <div className="p-4 sm:p-5 space-y-3.5 bg-slate-50/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                selectedStage.state === 'completed'
                  ? 'bg-emerald-600'
                  : selectedStage.state === 'in_progress'
                  ? 'bg-amber-600'
                  : selectedStage.state === 'cancelled'
                  ? 'bg-rose-600'
                  : 'bg-slate-500'
              }`}
            >
              {getStageIcon(selectedStage.id, selectedStage.state)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400">المرحلة {selectedStage.stepNumber} من 4:</span>
                <h4 className="font-black text-sm text-slate-900">{selectedStage.fullTitle}</h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    selectedStage.state === 'completed'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : selectedStage.state === 'in_progress'
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : selectedStage.state === 'cancelled'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {selectedStage.stateLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{selectedStage.subtitle}</p>
            </div>
          </div>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab(selectedStage.relevantTab)}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <span>فتح تبويب {selectedStage.label}</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Required Banner if In Progress */}
        {selectedStage.actionRequired && (
          <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-950 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">الإجراء المطلوب حالياً:</strong>
              <p className="mt-0.5 leading-relaxed">{selectedStage.actionRequired}</p>
            </div>
          </div>
        )}

        {/* Key Milestone Facts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] text-slate-400 block mb-0.5">الجهة الفاعلة / المسؤولة:</span>
            <strong className="text-slate-800 font-bold block">{selectedStage.actingParty}</strong>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] text-slate-400 block mb-0.5">التاريخ / التوقيت الموثق:</span>
            <strong className="text-slate-800 font-mono font-bold block">
              {selectedStage.timestamp || 'قيد الانتظار'}
            </strong>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] text-slate-400 block mb-0.5">المرجع المالي / الرقمي:</span>
            <strong className="text-slate-800 font-mono font-bold block truncate">
              {selectedStage.id === 'deposit_escrow'
                ? `رمز OTP: ${deal.secretOtp}`
                : selectedStage.id === 'initiation'
                ? deal.contract?.contractNumber
                : selectedStage.id === 'completion' && deal.receiptNumber
                ? deal.receiptNumber
                : 'موثق بسجلات المنصة'}
            </strong>
          </div>
        </div>

        {/* Explanation Summary Paragraph */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <span className="text-slate-400 block text-[11px] font-semibold mb-1">تفاصيل المرحلة:</span>
          <p>{selectedStage.detailsSummary}</p>
        </div>
      </div>
    </div>
  );
};
