import React, { useState } from 'react';
import { GarageProfile, InspectionRequest, User, InspectionReport } from '../types';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User as UserIcon, 
  AlertTriangle,
  FileText,
  Loader2,
  Lock,
  Star
} from 'lucide-react';

interface GarageDashboardViewProps {
  currentUser: User;
  garages: GarageProfile[];
  inspectionRequests: InspectionRequest[];
  onSubmitReport: (requestId: string, report: Omit<InspectionReport, 'id' | 'requestId' | 'isLocked' | 'tamperProofHash'>) => Promise<boolean>;
  onViewReport: (reportId: string) => void;
}

export const GarageDashboardView: React.FC<GarageDashboardViewProps> = ({
  currentUser,
  garages,
  inspectionRequests,
  onSubmitReport,
  onViewReport,
}) => {
  // إيجاد الكراج المرتبط بهذا المستخدم
  const myGarage = garages.find(g => g.userId === currentUser.id);
  
  const [selectedRequest, setSelectedRequest] = useState<InspectionRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // بيانات التقرير
  const [score, setScore] = useState(90);
  const [verdict, setVerdict] = useState<'excellent' | 'good' | 'fair'>('excellent');
  const [recommendation, setRecommendation] = useState('');
  const [checklist, setChecklist] = useState({
    engine: { status: 'pass', notes: '' },
    transmission: { status: 'pass', notes: '' },
    chassisAndBody: { status: 'pass', notes: '' },
    electrical: { status: 'pass', notes: '' },
    brakesAndTires: { status: 'pass', notes: '' },
    hydraulicsOrHours: { status: 'pass', notes: '' },
    previousAccidents: { found: false, notes: '' },
  });

  if (!myGarage) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">حسابك غير مرتبط بأي كراج</h2>
        <p className="text-slate-500 mt-2">يرجى مراجعة إدارة المنصة لربط حسابك بكراج معتمد.</p>
      </div>
    );
  }

  const myRequests = inspectionRequests.filter(r => r.garageId === myGarage.id);
  const pendingRequests = myRequests.filter(r => r.status !== 'completed');
  const completedRequests = myRequests.filter(r => r.status === 'completed');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmitReport(selectedRequest.id, {
        listingId: selectedRequest.listingId,
        garageId: myGarage.id,
        garageName: myGarage.businessName,
        inspectorName: currentUser.fullName,
        date: new Date().toISOString().split('T')[0],
        overallScore: score,
        verdict: verdict,
        recommendation: recommendation || 'المركبة بحالة جيدة ومطابقة للمواصفات المعلنة.',
        checklist: {
          engine: { status: 'pass', notes: checklist.engine.notes || 'سليم' },
          transmission: { status: 'pass', notes: checklist.transmission.notes || 'سليم' },
          chassisAndBody: { status: 'pass', notes: checklist.chassisAndBody.notes || 'سليم' },
          electrical: { status: 'pass', notes: checklist.electrical.notes || 'سليم' },
          brakesAndTires: { status: 'pass', notes: checklist.brakesAndTires.notes || 'سليم' },
          hydraulicsOrHours: { status: 'pass', notes: checklist.hydraulicsOrHours.notes || 'سليم' },
          previousAccidents: { found: checklist.previousAccidents.found, notes: checklist.previousAccidents.notes || 'لا يوجد' },
        },
        photos: [],
      });

      if (success) {
        setSelectedRequest(null);
        // إعادة تعيين النموذج
        setScore(90);
        setVerdict('excellent');
        setRecommendation('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-500/30">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black">{myGarage.businessName}</h1>
            <p className="text-slate-300 text-sm mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> {myGarage.zone === 'al_kafr' ? 'بلدة الكفر' : 'السويداء'}</span>
              <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400" /> {myGarage.ratingAvg} تقييم</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            طلبات الفحص الجديدة ({pendingRequests.length})
          </h2>
          
          {pendingRequests.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 border border-slate-200 border-dashed">
              لا توجد طلبات جديدة حالياً.
            </div>
          ) : (
            pendingRequests.map(req => (
              <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{req.listingTitle || `إعلان #${req.listingId?.slice(-6)}`}</h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5" /> المشتري: {req.buyerName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> الموعد المطلوب: {req.requestedDate}
                      </p>
                    </div>
                    <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-md border border-blue-200">
                      بانتظار الفحص
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Wrench className="w-4 h-4" /> بدء الفحص وتعبئة التقرير
                </button>
              </div>
            ))
          )}
        </div>

        {/* Completed Requests */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            الفحوصات المكتملة ({completedRequests.length})
          </h2>
          
          {completedRequests.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 border border-slate-200 border-dashed">
              لم تقم بإتمام أي فحص بعد.
            </div>
          ) : (
            completedRequests.map(req => (
              <div key={req.id} className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/30 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{req.listingTitle || `إعلان #${req.listingId?.slice(-6)}`}</h3>
                  <p className="text-xs text-slate-500 mt-1">تم إصدار التقرير بنجاح</p>
                </div>
                <button
                  onClick={() => req.report && onViewReport(req.report.id)}
                  className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> عرض التقرير
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Inspection Form Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900">تقرير الفحص الفني</h3>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">علامة الفحص (0-100):</label>
                  <input type="number" min="0" max="100" value={score} onChange={e => setScore(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">التقييم العام:</label>
                  <select value={verdict} onChange={e => setVerdict(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="excellent">ممتاز (جاهز للعمل)</option>
                    <option value="good">جيد (صيانة خفيفة)</option>
                    <option value="fair">متوسط (يحتاج إصلاحات)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">ملاحظات الفحص التفصيلي:</label>
                {[
                  { key: 'engine', label: 'المحرك والزيت' },
                  { key: 'transmission', label: 'القير والتروس' },
                  { key: 'chassisAndBody', label: 'الشاسيه والهيكل' },
                  { key: 'hydraulicsOrHours', label: 'الهيدروليك/ساعات العمل' },
                  { key: 'brakesAndTires', label: 'الفرامل والإطارات' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <span className="w-32 font-semibold text-slate-600">{item.label}:</span>
                    <input 
                      type="text" 
                      placeholder="سليم..." 
                      value={(checklist as any)[item.key].notes}
                      onChange={e => setChecklist({...checklist, [item.key]: { status: 'pass', notes: e.target.value }})}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg" 
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">توصية الكراج النهائية:</label>
                <textarea rows={2} value={recommendation} onChange={e => setRecommendation(e.target.value)} placeholder="اكتب توصيتك للمشتري هنا..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-amber-900 border border-amber-200 flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>بمجرد الاعتماد، سيتم قفل التقرير برمز تشفيري ولا يمكن تعديله.</span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedRequest(null)} disabled={isSubmitting} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl disabled:opacity-50">إلغاء</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isSubmitting ? 'جارٍ الحفظ...' : 'اعتماد وقفل التقرير'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// أيقونة صغيرة مساعدة
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);