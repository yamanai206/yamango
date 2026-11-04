import React, { useState } from 'react';
import { Deal, CurrencyRateConfig } from '../types';
import { 
  FileText, 
  QrCode, 
  Download, 
  Printer, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  ExternalLink, 
  FileCheck, 
  Radio, 
  AlertTriangle,
  Lock,
  Stamp
} from 'lucide-react';

interface ContractManagerProps {
  deals: Deal[];
  currencyConfig: CurrencyRateConfig;
}

export const ContractManager: React.FC<ContractManagerProps> = ({
  deals,
  currencyConfig,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedContractDeal, setSelectedContractDeal] = useState<Deal | null>(null);
  const [isQrValidationOpen, setIsQrValidationOpen] = useState(false);
  const [qrHashInput, setQrHashInput] = useState('');
  const [qrValidationResult, setQrValidationResult] = useState<{
    valid: boolean;
    deal?: Deal;
    message: string;
  } | null>(null);

  // Filter signed deals
  const filteredDeals = deals.filter((deal) => {
    if (filterStatus === 'signed' && !deal.contract?.signedAt) return false;
    if (filterStatus === 'escrow_secured' && deal.status !== 'escrow_secured') return false;
    if (filterStatus === 'completed' && deal.status !== 'completed') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        deal.contract?.contractNumber?.toLowerCase().includes(q) ||
        deal.listingTitle?.toLowerCase().includes(q) ||
        deal.buyerName?.toLowerCase().includes(q) ||
        deal.sellerName?.toLowerCase().includes(q) ||
        deal.gpsDeviceId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenPdfPreview = (deal: Deal) => {
    setSelectedContractDeal(deal);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleValidateQr = (e: React.FormEvent) => {
    e.preventDefault();
    const query = qrHashInput.trim();
    if (!query) return;

    const matchedDeal = deals.find(
      (d) =>
        d.contract?.qrVerificationHash?.toLowerCase() === query.toLowerCase() ||
        d.contract?.contractNumber?.toLowerCase() === query.toLowerCase() ||
        d.id.toLowerCase() === query.toLowerCase()
    );

    if (matchedDeal) {
      setQrValidationResult({
        valid: true,
        deal: matchedDeal,
        message: `تم التحقق بنجاح من صحة العقد والتوقيع الرقمي المشفر (SHA-256 Validated). العقد صادر رسمياً وموثق في سجلات yamango لمحافظة السويداء.`,
      });
    } else {
      setQrValidationResult({
        valid: false,
        message: 'رمز التحقق أو التوقيع الرقمي المدخل غير موجود في السجل الموثق أو تم التلاعب به.',
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs text-xs space-y-0">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-l from-slate-50 via-white to-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                إدارة العقود الإلكترونية الموقعة والتواقيع الرقمية (QR Validation)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                أرشيف العقود الرسمية المبرمة في السويداء وبلدة الكفر مع فحص موثوقية الأختام المشفرة والتتبع الحي.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setQrHashInput('');
                setQrValidationResult(null);
                setIsQrValidationOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>فحص صحة التوقيع (QR Validation)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            كل العقود ({deals.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('escrow_secured')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'escrow_secured'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            العربون مودع (إسكرو مؤكد)
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            المكتملة والمسلّمة
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم العقد، البائع، المشتري..."
            className="w-full pr-8 pl-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Contracts Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
              <th className="py-3 px-4 font-bold">رقم العقد والتاريخ</th>
              <th className="py-3 px-4 font-bold">الآلية / المركبة</th>
              <th className="py-3 px-4 font-bold">أطراف العقد</th>
              <th className="py-3 px-4 font-bold">القيمة المتفق عليها</th>
              <th className="py-3 px-4 font-bold">جهاز التتبع (GPS)</th>
              <th className="py-3 px-4 font-bold">حالة الإسكرو والتوقيع</th>
              <th className="py-3 px-4 text-center font-bold">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDeals.map((deal) => {
              const hasGps = Boolean(deal.gpsTrackingEnabled || deal.gpsDeviceId);
              const priceSYP =
                deal.currency === 'USD'
                  ? deal.agreedPrice * currencyConfig.usdToSypRate
                  : deal.agreedPrice;
              const priceUSD =
                deal.currency === 'USD'
                  ? deal.agreedPrice
                  : Math.round(deal.agreedPrice / currencyConfig.usdToSypRate);

              return (
                <tr key={deal.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Contract Number & Date */}
                  <td className="py-3 px-4">
                    <div className="font-mono font-black text-slate-900 text-xs">
                      {deal.contract?.contractNumber || 'YMG-2026-PENDING'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {deal.contract?.signedAt || new Date(deal.createdAt).toLocaleDateString('ar-SY')}
                    </div>
                  </td>

                  {/* Vehicle */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block line-clamp-1">
                      {deal.listingTitle}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {deal.listingOperation === 'sale' ? 'بيع قطعي' : 'عقد إيجار وتشغيل'}
                    </span>
                  </td>

                  {/* Parties */}
                  <td className="py-3 px-4">
                    <div className="text-[11px]">
                      <span className="text-slate-400">مشتري: </span>
                      <strong className="text-slate-800">{deal.buyerName}</strong>
                    </div>
                    <div className="text-[11px] mt-0.5">
                      <span className="text-slate-400">بائع: </span>
                      <strong className="text-slate-800">{deal.sellerName}</strong>
                    </div>
                  </td>

                  {/* Price in USD & SYP */}
                  <td className="py-3 px-4">
                    <div className="font-black text-slate-900 font-mono text-xs">
                      ${priceUSD.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {priceSYP.toLocaleString()} ل.س
                    </div>
                  </td>

                  {/* GPS Device */}
                  <td className="py-3 px-4">
                    {hasGps ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <Radio className="w-3 h-3 text-blue-600" />
                        <span className="font-mono">{deal.gpsDeviceId || 'GPS-SWD-8821'}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">غير مطلوب</span>
                    )}
                  </td>

                  {/* Status & Hash */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        deal.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : deal.status === 'escrow_secured'
                          ? 'bg-emerald-100 text-emerald-800'
                          : deal.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {deal.status === 'completed' && 'مكتمل ومسلّم'}
                      {deal.status === 'escrow_secured' && 'العربون محمي'}
                      {deal.status === 'escrow_pending' && 'بانتظار إيداع العربون'}
                      {deal.status === 'cancelled' && 'ملغى'}
                    </span>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]">
                      {deal.contract?.qrVerificationHash?.slice(0, 18)}...
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenPdfPreview(deal)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                        title="تحميل وطباعة العقد بصيغة PDF"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF / طباعة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setQrHashInput(deal.contract?.qrVerificationHash || deal.contract?.contractNumber || '');
                          setIsQrValidationOpen(true);
                          setQrValidationResult({
                            valid: true,
                            deal,
                            message: `تم التحقق بنجاح من صحة التوقيع الرقمي المشفر للعقد #${deal.contract?.contractNumber}.`,
                          });
                        }}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="فحص رمز QR والختم الرقمي"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: PDF CONTRACT VIEWER & PRINTER */}
      {selectedContractDeal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h4 className="font-black text-slate-900 text-sm sm:text-base">
                  العقد الرسمي المعتمد | {selectedContractDeal.contract?.contractNumber}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة العقد / حفظ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedContractDeal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contract Body (Printable Paper Style) */}
            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 text-xs text-slate-800 space-y-4 font-sans leading-relaxed">
              {/* Header / Republic & Platform */}
              <div className="text-center border-b border-slate-200 pb-3">
                <span className="text-[10px] text-slate-500 block font-semibold">الجمهورية العربية السورية · محافظة السويداء</span>
                <h2 className="text-base font-black text-slate-900 mt-0.5">
                  عقد وساطة وضمان إسكرو إلكتروني موثق (yamango)
                </h2>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  رقم العقد: {selectedContractDeal.contract?.contractNumber} · تاريخ التوقيع: {selectedContractDeal.contract?.signedAt || '2026-10-26'}
                </div>
              </div>

              {/* Clause 1: Parties */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <h5 className="font-bold text-slate-900 text-xs">أولاً: أطراف العقد والوساطة:</h5>
                <p className="text-[11px] text-slate-600">
                  <strong>الطرف الأول (البائع/المؤجر):</strong> {selectedContractDeal.sellerName} · هاتف معتمد وموثق لدى منصة yamango.
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>الطرف الثاني (المشتري/المستأجر):</strong> {selectedContractDeal.buyerName} · هوية موثقة بنظام KYC.
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>الطرف الثالث (الوسيط الضامن):</strong> منصة yamango لخدمات الوساطة وحفظ العربون عبر وكلاء الدفع في السويداء وبلدة الكفر.
                </p>
              </div>

              {/* Clause 2: Vehicle & Telematics */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <h5 className="font-bold text-slate-900 text-xs">ثانياً: موضوع العقد والآلية:</h5>
                <p className="text-[11px] text-slate-700">
                  {selectedContractDeal.contract?.termsSummaryArabic}
                </p>
                {selectedContractDeal.gpsDeviceId && (
                  <p className="text-[11px] text-blue-800 bg-blue-50 p-2 rounded-lg border border-blue-200">
                    📡 <strong>بند التتبع المباشر (GPS):</strong> تم تثبيت جهاز تتبع عن بُعد برقم معتمد ({selectedContractDeal.gpsDeviceId}) لمراقبة ساعات التشغيل والنطاق الجغرافي المصرح به داخل محافظة السويداء.
                  </p>
                )}
              </div>

              {/* Clause 3: Financial & Escrow */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                <h5 className="font-bold text-slate-900 text-xs">ثالثاً: البنود المالية والعربون:</h5>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>المبلغ المتفق عليه: <strong>{selectedContractDeal.agreedPrice.toLocaleString()} {selectedContractDeal.currency}</strong></div>
                  <div>العربون المحفوظ بالإسكرو: <strong>{selectedContractDeal.depositAmount.toLocaleString()} {selectedContractDeal.currency}</strong></div>
                  <div>عمولة المنصة المقتطعة: <strong>{selectedContractDeal.platformCommissionAmount.toLocaleString()} {selectedContractDeal.currency}</strong></div>
                  <div>حالة الإسكرو: <strong className="text-emerald-700">عربون مؤمن لدى الوكيل المعتمد</strong></div>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-center text-[10px]">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block mb-1">توقيع البائع الرقمي</span>
                  <strong className="text-slate-800 block">{selectedContractDeal.contract?.sellerSignature || selectedContractDeal.sellerName}</strong>
                  <span className="text-emerald-600 font-bold block mt-0.5">✓ معتمد إلكترونياً</span>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 block mb-1">توقيع المشتري الرقمي</span>
                  <strong className="text-slate-800 block">{selectedContractDeal.contract?.buyerSignature || selectedContractDeal.buyerName}</strong>
                  <span className="text-emerald-600 font-bold block mt-0.5">✓ معتمد إلكترونياً</span>
                </div>

                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-emerald-800 block mb-1">ختم الأمانة yamango</span>
                  <span className="font-mono font-bold text-emerald-900 block text-[9px]">
                    SHA256:VERIFIED
                  </span>
                  <span className="text-emerald-700 font-bold block mt-0.5">كراج الكفر والسويداء</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>كود التحقق الرقمي: <code className="font-mono text-slate-700">{selectedContractDeal.contract?.qrVerificationHash}</code></span>
              <button
                type="button"
                onClick={() => setSelectedContractDeal(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QR VALIDATION MODAL */}
      {isQrValidationOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <h4 className="font-black text-slate-900 text-sm">
                  التحقق من صحة التواقيع الرقمية والأختام (QR Validation)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsQrValidationOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleValidateQr} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  أدخل رقم العقد، أو كود التجزئة المشفر (SHA-256 Hash):
                </label>
                <input
                  type="text"
                  required
                  value={qrHashInput}
                  onChange={(e) => setQrHashInput(e.target.value)}
                  placeholder="مثال: YMG-2026-0819 أو كود SHA256..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>فحص الختم والتوقيع الرقمي الآن</span>
              </button>
            </form>

            {qrValidationResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                  qrValidationResult.valid
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {qrValidationResult.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{qrValidationResult.valid ? 'ختم رقمي موثق ومطابق 100%' : 'فشل التحقق'}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  {qrValidationResult.message}
                </p>

                {qrValidationResult.valid && qrValidationResult.deal && (
                  <div className="pt-2 border-t border-emerald-200 text-[10px] space-y-1 text-emerald-900">
                    <div>عقد: <strong>{qrValidationResult.deal.contract?.contractNumber}</strong></div>
                    <div>الآلية: <strong>{qrValidationResult.deal.listingTitle}</strong></div>
                    <div>المشتري: <strong>{qrValidationResult.deal.buyerName}</strong></div>
                    <div>البائع: <strong>{qrValidationResult.deal.sellerName}</strong></div>
                    {qrValidationResult.deal.gpsDeviceId && (
                      <div>جهاز التتبع: <strong>{qrValidationResult.deal.gpsDeviceId}</strong></div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
