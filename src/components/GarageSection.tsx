import React, { useState } from 'react';
import { GarageProfile, InspectionRequest, InspectionReport, User, GarageReview } from '../types';
import { GarageReviews } from './GarageReviews';
import { 
  ShieldCheck, 
  MapPin, 
  Wrench, 
  Star, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  X,
  Lock,
  Calendar,
  MessageSquare,
} from 'lucide-react';

interface GarageSectionProps {
  garages: GarageProfile[];
  inspectionRequests: InspectionRequest[];
  currentUser: User;
  reviews?: GarageReview[];
  onAddReview?: (review: Omit<GarageReview, 'id' | 'createdAt'>) => void;
  onRequestInspectionModal: (garage: GarageProfile) => void;
  onSubmitInspectionReport: (requestId: string, report: Omit<InspectionReport, 'id' | 'requestId' | 'isLocked' | 'tamperProofHash'>) => void;
  onViewReport: (reportId: string) => void;
}

export const GarageSection: React.FC<GarageSectionProps> = ({
  garages,
  inspectionRequests,
  currentUser,
  reviews = [],
  onAddReview,
  onRequestInspectionModal,
  onSubmitInspectionReport,
  onViewReport,
}) => {
  const [selectedRequestToInspect, setSelectedRequestToInspect] = useState<InspectionRequest | null>(null);
  const [reviewingGarage, setReviewingGarage] = useState<GarageProfile | null>(null);

  // Inspector interactive checklist form state
  const [inspectorScore, setInspectorScore] = useState(90);
  const [inspectorVerdict, setInspectorVerdict] = useState<'excellent' | 'good' | 'fair'>('excellent');
  const [inspectorRecommendation, setInspectorRecommendation] = useState(
    'تم فحص الآلية بدقة على الرافعة الهيدروليكية، المحرك والتروس بحالة ممتازة وخالية من التسريبات، موصى بشرائها.'
  );

  const [checklist, setChecklist] = useState({
    engine: { status: 'pass' as const, notes: 'ضغط المحرك 94%، صوت الاحتراق منتظم' },
    transmission: { status: 'pass' as const, notes: 'التعشيق سلس في جميع الغيارات والدبل' },
    chassisAndBody: { status: 'pass' as const, notes: 'الشاسيه سليم 100% ولا توجد لحامات أو انحناءات' },
    electrical: { status: 'pass' as const, notes: 'الإنارة وشبكة الحساسات تعمل بكفاءة' },
    brakesAndTires: { status: 'pass' as const, notes: 'سماكة البيل والديسكات 80%، الإطارات جيدة' },
    hydraulicsOrHours: { status: 'pass' as const, notes: 'ضغط طلمبة الهيدروليك 190 بار ومطابقة لكتالوج المصنع' },
    previousAccidents: { found: false, notes: 'لا يوجد أي أثر لحوادث سابقة' },
  });

  const handleCompleteInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestToInspect) return;

    onSubmitInspectionReport(selectedRequestToInspect.id, {
      listingId: selectedRequestToInspect.listingId,
      garageId: selectedRequestToInspect.garageId,
      garageName: selectedRequestToInspect.garageName,
      inspectorName: currentUser.fullName,
      date: new Date().toISOString().split('T')[0],
      overallScore: inspectorScore,
      verdict: inspectorVerdict,
      recommendation: inspectorRecommendation,
      checklist,
      photos: [],
    });

    setSelectedRequestToInspect(null);
  };

  const isGarageRole = currentUser.roles.includes('garage');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Intro Hero Strip */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>شبكة كراجات الكفر والسويداء المعتمدة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-2 leading-tight">
            فحص فني مستقل وشامل قبل الشراء أو الاستئجار
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            لا تشتري أو تستأجر آلية أو سيارة في السويداء دون تقرير فني رقمي مقفل وموقع من كراج معتمد. تقييم دقيق للمحرك، الهيدروليك، ساعات العمل، ونظافة الشاسيه لحمايتك وضمان سلامة أموالك.
          </p>
        </div>
      </div>

      {/* Inspector Workspace (if garage account) */}
      {isGarageRole && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-700" />
              <h3 className="text-sm font-bold text-slate-900">
                لوحة مهندس الفحص (الكراج المعتمد)
              </h3>
            </div>
            <span className="text-xs bg-white text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-medium">
              الاشتراك الشهري: مفعل (باقة ممتازة)
            </span>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-700">طلبات الفحص الواردة للآليات:</h4>
            {inspectionRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">لا توجد طلبات فحص واردة حالياً.</p>
            ) : (
              inspectionRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{req.listingTitle}</span>
                    <span className="text-slate-500">
                      المشتري: {req.buyerName} · البائع: {req.sellerName} · الرسوم:{' '}
                      <strong className="text-slate-800">{req.feeAmount.toLocaleString()} {req.currency}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === 'completed' ? (
                      <button
                        onClick={() => onViewReport(req.report?.id || '')}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg font-semibold hover:bg-emerald-200 transition-colors"
                      >
                        عرض التقرير المقفل ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedRequestToInspect(req)}
                        className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors shadow-xs"
                      >
                        بدء الفحص وتعبئة التقرير ⚙️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Certified Garages Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">الكراجات ومراكز الفحص المعتمدة</h3>
          <span className="text-xs text-slate-500 font-medium">{garages.length} كراجات مفعلة</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {garages.map((garage) => (
            <div
              key={garage.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {garage.businessName}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{garage.address}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReviewingGarage(garage)}
                    className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100/80 px-2 py-1 rounded-md text-xs font-bold text-amber-900 shrink-0 transition-colors cursor-pointer"
                    title="عرض وكتابة المراجعات"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{garage.ratingAvg}</span>
                    <span className="text-slate-400 font-normal">({garage.reviewsCount})</span>
                  </button>
                </div>

                {/* Specialties */}
                <div className="space-y-1 mb-4">
                  <span className="text-[11px] font-semibold text-slate-400 block">التخصصات المعتمدة:</span>
                  <div className="flex flex-wrap gap-1">
                    {garage.specialties.map((spec, i) => (
                      <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price and CTA */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">رسم الفحص الشامل:</span>
                  <span className="text-xs font-bold text-slate-900">
                    {garage.inspectionFeeSYP.toLocaleString()} ل.س / ${garage.inspectionFeeUSD}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewingGarage(garage)}
                    className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    title="عرض تقييمات الزبائن وإضافة مراجعة"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>المراجعات ({garage.reviewsCount})</span>
                  </button>

                  <button
                    onClick={() => onRequestInspectionModal(garage)}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                  >
                    حجز موعد فحص
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspector Form Modal */}
      {selectedRequestToInspect && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  محرر تقرير الفحص الفني للآلية
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedRequestToInspect.listingTitle} (كود الطلب: #{selectedRequestToInspect.id})
                </span>
              </div>
              <button
                onClick={() => setSelectedRequestToInspect(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteInspection} className="space-y-4 text-xs">
              {/* Overall Score & Verdict */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">العلامة العامة (من 100):</label>
                  <input
                    type="number"
                    min="30"
                    max="100"
                    value={inspectorScore}
                    onChange={(e) => setInspectorScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">التقييم العام:</label>
                  <select
                    value={inspectorVerdict}
                    onChange={(e) => setInspectorVerdict(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="excellent">ممتاز (جاهزة تماماً للعمل)</option>
                    <option value="good">جيد (مقبولة مع صيانة خفيفة)</option>
                    <option value="fair">متوسط (تحتاج إصلاحات)</option>
                  </select>
                </div>
              </div>

              {/* Items checklist */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 max-h-56 overflow-y-auto">
                <span className="font-bold text-slate-800 block mb-2">بنود الفحص التفصيلية:</span>
                
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-800">1. المحرك وضغط البساتم:</span>
                  <input
                    type="text"
                    value={checklist.engine.notes}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, engine: { ...prev.engine, notes: e.target.value } }))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs w-2/3"
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-800">2. القير والتروس والكلتش:</span>
                  <input
                    type="text"
                    value={checklist.transmission.notes}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, transmission: { ...prev.transmission, notes: e.target.value } }))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs w-2/3"
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-800">3. الهيدروليك وساعات العمل:</span>
                  <input
                    type="text"
                    value={checklist.hydraulicsOrHours.notes}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, hydraulicsOrHours: { ...prev.hydraulicsOrHours, notes: e.target.value } }))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs w-2/3"
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-800">4. الشاسيه وسلامة الهيكل:</span>
                  <input
                    type="text"
                    value={checklist.chassisAndBody.notes}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, chassisAndBody: { ...prev.chassisAndBody, notes: e.target.value } }))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs w-2/3"
                  />
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">توصية الكراج النهائية للمشتري:</label>
                <textarea
                  rows={2}
                  value={inspectorRecommendation}
                  onChange={(e) => setInspectorRecommendation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Legal Notice */}
              <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-900 border border-amber-200/60 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>تنبيه قانوني:</strong> بعد الاعتماد، يُقفل هذا التقرير برمز تشفيري غير قابل للتعديل ويُدرج في سجل المركبة، ويتحمل الكراج مسؤوليته المهنية عن دقة الفحص.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRequestToInspect(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد وقفل التقرير رسمياً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Garage Reviews & Rating Modal */}
      {reviewingGarage && (
        <GarageReviews
          garage={reviewingGarage}
          reviews={reviews}
          currentUser={currentUser}
          isOpen={Boolean(reviewingGarage)}
          onClose={() => setReviewingGarage(null)}
          onAddReview={(newReview) => {
            if (onAddReview) {
              onAddReview(newReview);
            }
          }}
        />
      )}
    </div>
  );
};

