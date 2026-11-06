import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  UsedItem, 
  UsedItemCategory, 
  UsedItemCondition, 
  CurrencyCode, 
  ZoneLocation, 
  User 
} from '../types';
import { 
  USED_CATEGORY_LABELS, 
  USED_CONDITION_CONFIG, 
  calculateUsedItemCommission,
  formatUsedItemPrice 
} from '../utils/usedGoods';
import { classifyUsedItemCategoryNLP, NLPCategoryResult } from '../utils/usedGoodsNLP';
import { supabase } from '../lib/supabase';
import { 
  X, 
  Plus, 
  Camera, 
  Sparkles, 
  MapPin, 
  Tag, 
  ShieldCheck, 
  AlertCircle, 
  Package, 
  Check, 
  Coins,
  Cpu,
  Wand2,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Upload,
  Loader2
} from 'lucide-react';

interface NewUsedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<UsedItem, 'id' | 'createdAt' | 'platformCommissionRate' | 'platformCommissionAmount' | 'sellerNetPayout'>) => Promise<any>;
  currentUser: User;
  initialTitle?: string;
  initialDescription?: string;
  initialCategory?: UsedItemCategory;
}

const PRESET_IMAGES_BY_CATEGORY: Record<UsedItemCategory, string[]> = {
  home_appliances: ['https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80'],
  furniture: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'],
  electronics: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80'],
  solar_power: ['https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'],
  tools: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'],
  other: ['https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80'],
};

const base64ToBlob = (base64Data: string) => {
  const byteCharacters = atob(base64Data.split(',')[1]);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: 'image/jpeg' });
};

export const NewUsedItemModal: React.FC<NewUsedItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  initialTitle = '',
  initialDescription = '',
  initialCategory,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState<UsedItemCategory>(initialCategory || 'home_appliances');
  const [condition, setCondition] = useState<UsedItemCondition>('excellent');
  const [price, setPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState<CurrencyCode>('SYP');
  const [zone, setZone] = useState<ZoneLocation>(currentUser.zone || 'al_kafr');
  const [locationDetails, setLocationDetails] = useState('');
  const [sellerName, setSellerName] = useState(currentUser.fullName);
  const [sellerPhone, setSellerPhone] = useState(currentUser.phone);
  const [deliveryOption, setDeliveryOption] = useState<'pickup_in_person' | 'local_delivery' | 'both'>('both');
  
  // Image state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // NLP state
  const [autoApplyNLP, setAutoApplyNLP] = useState(true);
  const [userManuallySelectedCategory, setUserManuallySelectedCategory] = useState(false);
  
  const nlpResult = useMemo(() => classifyUsedItemCategoryNLP(description, title), [description, title]);

  useEffect(() => {
    if (autoApplyNLP && !userManuallySelectedCategory && nlpResult.isConfident) {
      setCategory(nlpResult.suggestedCategory);
    }
  }, [nlpResult, autoApplyNLP, userManuallySelectedCategory]);

  if (!isOpen) return null;

  const numericPrice = typeof price === 'number' ? price : 0;
  const commissionCalc = calculateUsedItemCommission(numericPrice, currency);

  // Compress and preview images
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setUploadedImages(prev => [...prev, canvas.toDataURL('image/jpeg', 0.8)].slice(0, 3)); // Max 3 images
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !numericPrice || numericPrice <= 0 || !sellerPhone.trim()) {
      setErrorMsg('يرجى إكمال البيانات الأساسية (العنوان، السعر، الهاتف).');
      return;
    }

    setIsUploading(true);
    const finalCloudUrls: string[] = [];

    try {
      // 1. Upload images to Supabase
      for (const img of uploadedImages) {
        if (img.startsWith('data:image')) {
          const blob = base64ToBlob(img);
          const fileName = `used_${Date.now()}_${Math.random().toString(36).substring(7)}.jpeg`;
          
          const { data, error } = await supabase.storage
            .from('used-items-images')
            .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from('used-items-images')
            .getPublicUrl(data.path);
            
          finalCloudUrls.push(urlData.publicUrl);
        }
      }

      // 2. Submit to Database
      const success = await onSubmit({
        sellerId: currentUser.id,
        sellerName: sellerName.trim() || currentUser.fullName,
        sellerPhone: sellerPhone.trim(),
        sellerRating: 5.0,
        title: title.trim(),
        category,
        condition,
        price: numericPrice,
        currency,
        zone,
        locationDetails: locationDetails.trim() || (zone === 'al_kafr' ? 'بلدة الكفر' : 'محافظة السويداء'),
        description: description.trim() || 'غرض مستعمل بحالة جيدة متاح للمعاينة والتسليم.',
        images: finalCloudUrls.length > 0 ? finalCloudUrls : [PRESET_IMAGES_BY_CATEGORY[category][0]],
        status: 'available',
        deliveryOption,
        viewsCount: 1,
      });

      if (success) onClose();
    } catch (err: any) {
      setErrorMsg('فشل الرفع: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-200" />
              <span>إضافة غرض مستعمل للبيع</span>
            </h2>
            <p className="text-xs text-orange-100 mt-0.5">اعرض أغراضك المنزلية، الأثاث، أو الأجهزة وحدد السعر.</p>
          </div>
          <button onClick={onClose} disabled={isUploading} className="p-1.5 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">عنوان الغرض المستعمل <span className="text-rose-500">*</span></label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: غسالة LG أوتوماتيك 9 كغ" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 outline-none text-sm" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">الوصف والمواصفات</label>
              <button type="button" onClick={() => setAutoApplyNLP(!autoApplyNLP)} className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${autoApplyNLP ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-slate-100 text-slate-600'}`}>
                <Wand2 className="w-3 h-3 inline mr-1" />
                {autoApplyNLP ? 'التصنيف التلقائي: مفعّل' : 'التصنيف التلقائي: يدوي'}
              </button>
            </div>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اكتب مواصفات الغرض بالتفصيل..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-orange-500 outline-none text-sm" />
            
            {/* NLP Result Card */}
            {nlpResult.isConfident && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-purple-900 font-bold block">اقتراح التصنيف بالـ NLP:</span>
                  <span className="text-amber-800 font-bold text-sm">{nlpResult.categoryLabel}</span> <span className="text-[10px] text-purple-700">({nlpResult.confidence}%)</span>
                </div>
                {category !== nlpResult.suggestedCategory && (
                  <button type="button" onClick={() => { setCategory(nlpResult.suggestedCategory); setUserManuallySelectedCategory(false); }} className="px-3 py-1.5 bg-purple-600 text-white font-bold rounded-lg">
                    تطبيق
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">تصنيف الغرض</label>
              <select value={category} onChange={(e) => { setCategory(e.target.value as UsedItemCategory); setUserManuallySelectedCategory(true); }} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm">
                {Object.entries(USED_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">الحالة</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value as UsedItemCondition)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm">
                {Object.entries(USED_CONDITION_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Images Upload */}
          <div className="p-4 bg-orange-50/50 border-2 border-dashed border-orange-300 rounded-2xl space-y-3">
            <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>صور الغرض (حتى 3 صور)</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">ترفع للسحابة فوراً</span>
            </label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full py-3 bg-white hover:bg-slate-50 border-2 border-orange-200 rounded-xl font-bold text-xs text-orange-800 flex items-center justify-center gap-2 disabled:opacity-50">
              <Upload className="w-4 h-4" /> اختر صوراً من جهازك
            </button>

            {uploadedImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 relative group">
                    <img src={img} alt="preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold">حذف</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">السعر <span className="text-rose-500">*</span></label>
                <input type="number" min="1" required value={price} onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')} placeholder="مثال: 150" className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العملة</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setCurrency('SYP')} className={`py-2 text-xs font-bold rounded-xl border ${currency === 'SYP' ? 'bg-orange-600 text-white' : 'bg-white'}`}>ل.س</button>
                  <button type="button" onClick={() => setCurrency('USD')} className={`py-2 text-xs font-bold rounded-xl border ${currency === 'USD' ? 'bg-orange-600 text-white' : 'bg-white'}`}>دولار</button>
                </div>
              </div>
            </div>
            {numericPrice > 0 && (
              <div className="text-[11px] text-slate-600 flex justify-between border-t border-slate-200 pt-2">
                <span>عمولة المنصة (3.5%): <strong className="text-amber-700">{formatUsedItemPrice(commissionCalc.commissionAmount, currency)}</strong></span>
                <span>صافي مستحقك: <strong className="text-emerald-700">{formatUsedItemPrice(commissionCalc.sellerNetPayout, currency)}</strong></span>
              </div>
            )}
          </div>

          {/* Contact & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">المنطقة</label>
              <select value={zone} onChange={(e) => setZone(e.target.value as ZoneLocation)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm">
                <option value="al_kafr">بلدة الكفر</option>
                <option value="suwayda">مدينة السويداء</option>
                <option value="salkhad">صلخد</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">رقم الهاتف <span className="text-rose-500">*</span></label>
              <input type="tel" required value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isUploading} className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">إلغاء</button>
            <button type="submit" disabled={isUploading} className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isUploading ? 'جارٍ رفع الصور...' : 'نشر الغرض في السوق'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};