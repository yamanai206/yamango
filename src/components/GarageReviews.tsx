import React, { useState } from 'react';
import { GarageProfile, GarageReview, User } from '../types';
import {
  Star,
  X,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  Send,
  Sparkles,
  MapPin,
  Wrench,
} from 'lucide-react';

interface GarageReviewsProps {
  garage: GarageProfile | null;
  reviews: GarageReview[];
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onAddReview: (review: Omit<GarageReview, 'id' | 'createdAt'>) => void;
}

const RATING_LABELS: Record<number, string> = {
  5: 'ممتاز جداً (فحص شامل ودقيق 100%)',
  4: 'جيد جداً (تعامل موثوق وفحص سليم)',
  3: 'متوسط (فحص مقبول مع بعض الملاحظات)',
  2: 'أقل من المتوقع (تأخير أو فحص سطحي)',
  1: 'غير راضٍ إطلاقاً',
};

export const GarageReviews: React.FC<GarageReviewsProps> = ({
  garage,
  reviews,
  currentUser,
  isOpen,
  onClose,
  onAddReview,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userName, setUserName] = useState(currentUser?.fullName || '');
  const [comment, setComment] = useState('');
  const [verifiedInspection, setVerifiedInspection] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !garage) return null;

  // Filter reviews for this garage
  const garageReviews = reviews
    .filter((r) => r.garageId === garage.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  const totalReviews = garageReviews.length;
  const currentAvg = totalReviews > 0
    ? (garageReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : garage.ratingAvg.toFixed(1);

  // Star breakdown calculation
  const countsByStar = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: garageReviews.filter((r) => r.rating === star).length,
    percentage:
      totalReviews > 0
        ? Math.round((garageReviews.filter((r) => r.rating === star).length / totalReviews) * 100)
        : 0,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!userName.trim()) {
      setErrorMsg('يرجى إدخال اسمك.');
      return;
    }
    if (!comment.trim() || comment.trim().length < 8) {
      setErrorMsg('يرجى كتابة تعليق لا يقل عن 8 أحرف يشرح تجربتك مع فحص الكراج.');
      return;
    }

    setIsSubmitting(true);

    const now = new Date().toISOString().split('T')[0];
    onAddReview({
      garageId: garage.id,
      userName: userName.trim(),
      userPhone: currentUser?.phone,
      rating,
      comment: comment.trim(),
      date: now,
      verifiedInspection,
    });

    setIsSubmitting(false);
    setSuccessToast(true);
    setComment('');
    setTimeout(() => setSuccessToast(false), 4000);
  };

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="garage-reviews-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <Wrench className="w-4 h-4" />
              </span>
              <h3 id="garage-reviews-title" className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {garage.businessName}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>{garage.address}</span>
              </span>
              <span>·</span>
              <span className="text-emerald-700 font-bold">كراج معتمد رسمياً</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-6 pt-4 text-xs">
          {/* Average Rating & Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* Avg score circle */}
            <div className="flex flex-col items-center justify-center text-center sm:border-l sm:border-slate-200 pl-0 sm:pl-4">
              <span className="text-3xl font-black text-slate-900 font-mono">{currentAvg}</span>
              <div className="flex items-center gap-1 my-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(Number(currentAvg))
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-slate-500 text-[11px] font-medium">
                بناءً على {totalReviews} تقييماً معتمداً
              </span>
            </div>

            {/* Breakdown bars */}
            <div className="col-span-2 space-y-1.5 justify-center flex flex-col">
              {countsByStar.map((item) => (
                <div key={item.star} className="flex items-center gap-2 text-[11px]">
                  <span className="w-12 text-slate-600 font-medium flex items-center gap-1">
                    <span>{item.star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                  </span>
                  <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-left font-mono text-slate-500 font-bold">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Add Review Form */}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4>أضف مراجعتك وتقييمك لخدمة الفحص</h4>
              </div>
              <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-md">
                مراجعة موثوقة
              </span>
            </div>

            {successToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>شكراً لمشاركتك! تمت إضافة تقييمك وتحديث متوسط تقييم الكراج فوراً.</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Star Rating Picker */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  تقييمك للكراج (اختر عدد النجوم):
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                    {[1, 2, 3, 4, 5].map((starNum) => (
                      <button
                        key={starNum}
                        type="button"
                        onClick={() => setRating(starNum)}
                        onMouseEnter={() => setHoverRating(starNum)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 focus:outline-none cursor-pointer transition-transform hover:scale-110"
                        title={`${starNum} من 5 نجوم`}
                      >
                        <Star
                          className={`w-5 h-5 ${
                            starNum <= activeRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-amber-900 bg-amber-100/70 px-2.5 py-1.5 rounded-xl border border-amber-200/50">
                    {RATING_LABELS[activeRating] || ''}
                  </span>
                </div>
              </div>

              {/* User Name & Inspection Check */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسمك الكريم:</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="مثال: بهاء الدين مرشد"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs text-slate-900 font-medium"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-xl w-full cursor-pointer hover:border-amber-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={verifiedInspection}
                      onChange={(e) => setVerifiedInspection(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-slate-700 text-[11px] font-bold">
                      أؤكد أنني قمت بفحص آلية حقيقية في هذا الكراج
                    </span>
                  </label>
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  تفاصيل تجربتك مع الكراج ورأيك بالفحص الفني:
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="كيف كانت دقة فحص المحرك والشاسيه؟ هل كشفوا أي عيوب أو قدموا نصائح مفيدة؟"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs text-slate-900 resize-none font-medium leading-relaxed"
                  required
                />
              </div>

              {/* Submit CTA */}
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>نشر المراجعة الآن</span>
                </button>
              </div>
            </form>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                آراء ومراجعات الزبائن ({garageReviews.length})
              </h4>
              <span className="text-[11px] text-slate-500">الأحدث أولاً</span>
            </div>

            {garageReviews.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                لا توجد مراجعات مسجلة حتى الآن لهذا الكراج. كن أول من يكتب تقييماً!
              </div>
            ) : (
              <div className="space-y-2.5">
                {garageReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {rev.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{rev.userName}</span>
                            {rev.verifiedInspection && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>فحص موثّق</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{rev.date}</span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                        <span className="font-mono font-bold text-amber-900 text-[11px] mr-1">
                          {rev.rating}.0
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-700 text-xs leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 mt-3 text-xs">
          <span className="text-slate-400 text-[11px]">
            تقييمات حقيقية من مشتري وبائعي الآليات في السويداء والكفر
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
