import React from 'react';
import { InspectionRequest } from '../types';
import { Wrench, User, Calendar, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdminInspectionRequestsTableProps {
  requests: InspectionRequest[];
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending_seller':
      return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-[10px] font-bold border border-orange-200">بانتظار موافقة البائع</span>;
    case 'approved_by_seller':
      return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-[10px] font-bold border border-blue-200">بانتظار الفحص</span>;
    case 'in_inspection':
      return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-[10px] font-bold border border-purple-200">قيد الفحص</span>;
    case 'completed':
      return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-200">مكتمل</span>;
    case 'declined':
      return <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded-md text-[10px] font-bold border border-rose-200">مرفوض</span>;
    default:
      return <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200">{status}</span>;
  }
};

export const AdminInspectionRequestsTable: React.FC<AdminInspectionRequestsTableProps> = ({ requests }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-600" />
            <span>طلبات الفحص الفني للكراجات</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            مراقبة ومتابعة جميع طلبات فحص المركبات والآليات المحجوزة من قبل المشترين.
          </p>
        </div>
        <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-lg">
          {requests.length} طلب
        </span>
      </div>

      <div className="overflow-x-auto">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-xs">لا توجد طلبات فحص مسجلة حالياً.</p>
          </div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">الآلية / المركبة</th>
                <th className="py-3 px-4">المشتري</th>
                <th className="py-3 px-4">الكراج المعتمد</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">الرسوم</th>
                <th className="py-3 px-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 max-w-[200px] truncate" title={req.listingTitle || req.listingId}>
                      {req.listingTitle || `إعلان رقم ${req.listingId?.slice(-6)}`}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{req.id.slice(-6)}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {req.buyerName}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-orange-800 bg-orange-50 px-2 py-0.5 rounded-md inline-block">
                      {req.garageName}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {req.requestedDate}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900">
                      {req.feeAmount.toLocaleString()} {req.currency}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    {getStatusBadge(req.status)}
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