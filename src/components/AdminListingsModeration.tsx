import React, { useState } from 'react';
import { Listing } from '../types';
import { CheckCircle2, XCircle, MapPin, User, Calendar, DollarSign, Eye, Loader2, AlertTriangle } from 'lucide-react';

interface AdminListingsModerationProps {
  listings: Listing[];
  onUpdateStatus: (listingId: string, status: Listing['status']) => Promise<boolean>;
  onDeleteListing: (listingId: string) => Promise<boolean>;
  onViewListing: (listing: Listing) => void;
}

export const AdminListingsModeration: React.FC<AdminListingsModerationProps> = ({
  listings,
  onUpdateStatus,
  onDeleteListing,
  onViewListing,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingListings = listings.filter(l => l.status === 'pending_approval');

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    await onUpdateStatus(id, 'active');
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    if (window.confirm('هل أنت متأكد من رفض هذا الإعلان وحذفه نهائياً؟')) {
      setProcessingId(id);
      await onDeleteListing(id);
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>مراجعة واعتماد الإعلانات الجديدة</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            الإعلانات التي يضيفها المستخدمون تظهر هنا أولاً. راجعها ثم اعتمدها لتظهر في السوق العام.
          </p>
        </div>
        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-lg border border-amber-200">
          {pendingListings.length} إعلان بانتظار المراجعة
        </span>
      </div>

      <div className="overflow-x-auto">
        {pendingListings.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400 opacity-50" />
            <p className="font-bold text-sm text-slate-700">لا توجد إعلانات جديدة بانتظار المراجعة.</p>
            <p className="text-xs mt-1">جميع الإعلانات المعروضة تمت الموافقة عليها مسبقاً.</p>
          </div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">الإعلان والآلية</th>
                <th className="py-3 px-4">البائع / المعلن</th>
                <th className="py-3 px-4">السعر</th>
                <th className="py-3 px-4">الموقع</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Listing Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                        {listing.images?.[0] && <img src={listing.images[0]} alt="img" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 line-clamp-1">{listing.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {listing.make} {listing.model} ({listing.year}) · {listing.category}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Seller Info */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {listing.sellerName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5" dir="ltr">
                      {listing.sellerPhone}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900">
                      {listing.priceAmount.toLocaleString()} {listing.currency}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      {listing.zone === 'al_kafr' ? 'الكفر' : listing.zone === 'suwayda' ? 'السويداء' : listing.zone}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onViewListing(listing)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="معاينة تفاصيل الإعلان"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleApprove(listing.id)}
                        disabled={processingId === listing.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        title="اعتماد ونشر الإعلان"
                      >
                        {processingId === listing.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>موافقة ونشر</span>
                      </button>

                      <button
                        onClick={() => handleReject(listing.id)}
                        disabled={processingId === listing.id}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        title="رفض وحذف الإعلان"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رفض</span>
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
  );
};