import React from 'react';
import { InspectionReport } from '../types';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Lock, Award, FileText, Check } from 'lucide-react';

interface InspectionReportViewModalProps {
  report: InspectionReport | null;
  onClose: () => void;
}

export const InspectionReportViewModal: React.FC<InspectionReportViewModalProps> = ({
  report,
  onClose,
}) => {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Certificate Header */}
        <div className="text-center border-b-2 border-emerald-600/30 pb-5 mb-5 relative">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
            <Award className="w-7 h-7" />
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            تقرير الفحص الفني المعتمد للمركبة / الآلية
          </h2>
          <span className="text-xs text-slate-500 font-medium block">
            صادر عن: {report.garageName} · تاريخ الفحص: {report.date}
          </span>

          <div className="absolute top-0 right-0">
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score & Verdict Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-800 font-semibold block mb-0.5">التقييم العام للمركبة:</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-950">
              {report.verdict === 'excellent' ? 'حالة فنية ممتازة ✓' : report.verdict === 'good' ? 'حالة فنية جيدة' : 'حالة متوسطة'}
            </div>
          </div>

          <div className="text-center bg-white px-4 py-2 rounded-xl border border-emerald-200/60 shadow-xs">
            <span className="text-[10px] text-slate-400 block font-medium">علامة الفحص</span>
            <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
              {report.overallScore}<span className="text-xs font-semibold text-slate-400">/100</span>
            </span>
          </div>
        </div>

        {/* Checklist table */}
        <div className="space-y-3 mb-5 text-xs">
          <span className="font-bold text-slate-900 block">نتائج الفحص التفصيلي للمكونات:</span>
          
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <div className="p-2.5 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-800">المحرك واحتراق الوقود:</span>
              </div>
              <span className="text-slate-600">{report.checklist.engine.notes}</span>
            </div>

            <div className="p-2.5 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-800">القير والتروس والكلتش:</span>
              </div>
              <span className="text-slate-600">{report.checklist.transmission.notes}</span>
            </div>

            <div className="p-2.5 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-800">الشاسيه وهيكل الآلية:</span>
              </div>
              <span className="text-slate-600">{report.checklist.chassisAndBody.notes}</span>
            </div>

            <div className="p-2.5 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-800">ضغط الهيدروليك وساعات العمل:</span>
              </div>
              <span className="text-slate-600">{report.checklist.hydraulicsOrHours.notes}</span>
            </div>

            <div className="p-2.5 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-800">الفرامل والإطارات:</span>
              </div>
              <span className="text-slate-600">{report.checklist.brakesAndTires.notes}</span>
            </div>

            <div className="p-2.5 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-800">حوادث سابقة:</span>
              </div>
              <span className="text-slate-600">
                {report.checklist.previousAccidents.found ? 'يوجد صدمات سابقة' : 'خالية تماماً من الحوادث'}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 text-xs">
          <span className="font-bold text-slate-800 block mb-1">توصية الكراج المعتمد:</span>
          <p className="text-slate-700 leading-relaxed">{report.recommendation}</p>
        </div>

        {/* Seal & Tamper-proof hash */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-700" />
            <span className="truncate max-w-xs">{report.tamperProofHash}</span>
          </div>

          <div className="text-slate-700 font-bold">
            مهندس الفحص: {report.inspectorName}
          </div>
        </div>
      </div>
    </div>
  );
};
