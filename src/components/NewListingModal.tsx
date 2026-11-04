import React, { useState, useRef } from 'react';
import { Listing, User, ZoneLocation, ListingCategory, ListingOperation, CurrencyCode, SUB_CATEGORIES_BY_CATEGORY } from '../types';
import { 
  X, 
  Plus, 
  ShieldCheck, 
  MapPin, 
  Gauge, 
  Radio, 
  Cpu, 
  Camera, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  Info, 
  Star, 
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { compressImage, POPULAR_VEHICLE_PHOTO_PRESETS } from '../utils/imageCompressor';
import { supabase } from '../lib/supabase'; // استيراد Supabase

interface NewListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAddListing: (newListing: Omit<Listing, 'id' | 'createdAt' | 'viewsCount' | 'clicksCount' | 'inquiriesCount'>) => Promise<Listing | null>;
}

// دالة مساعدة لتحويل Base64 إلى Blob لرفعه إلى Supabase
const base64ToBlob = (base64Data: string) => {
  const byteCharacters = atob(base64Data.split(',')[1]);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: 'image/jpeg' });
};

export const NewListingModal: React.FC<NewListingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAddListing,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ListingCategory>('tractors');
  const [subCategory, setSubCategory] = useState<string>('جرار عجلات');
  const [customSubCategory, setCustomSubCategory] = useState('');
  const [operation, setOperation] = useState<ListingOperation>('sale');
  const [make, setMake] = useState('Belarus');
  const [model, setModel] = useState('820');
  const [year, setYear] = useState(2021);
  const [metricType, setMetricType] = useState<'mileage_km' | 'work_hours'>('work_hours');
  const [metricValue, setMetricValue] = useState(1100);
  const [priceAmount, setPriceAmount] = useState(8500);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [zone, setZone] = useState<ZoneLocation>('al_kafr');
  const [locationDetails, setLocationDetails] = useState('بلدة الكفر - الحي الغربي');
  const [chassisNumber, setChassisNumber] = useState('BLR-992-KFR');
  const [hasDriverOption, setHasDriverOption] = useState(false);
  const [rentRateUnit, setRentRateUnit] = useState<'hour' | 'day' | 'week'>('day');
  const [gpsTrackingEnabled, setGpsTrackingEnabled] = useState(false);
  const [gpsDeviceId, setGpsDeviceId] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');

  // Image upload and gallery state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState('');

  // File input references
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process and compress chosen image files
  const handleProcessFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    setIsCompressing(true);
    setCompressionProgress(`جاري معالجة ${fileArray.length} صورة...`);

    const newCompressedImages: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setCompressionProgress(`جاري ضغط الصورة ${i + 1} من ${fileArray.length}...`);
      try {
        const compressedBase64 = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 900,
          quality: 0.82,
        });
        newCompressedImages.push(compressedBase64);
      } catch (err) {
        console.warn('Failed to compress image:', err);
      }
    }

    setUploadedImages((prev) => {
      const combined = [...prev, ...newCompressedImages];
      return combined.slice(0, 5); // حد أقصى 5 صور لتسريع الرفع
    });

    setIsCompressing(false);
    setCompressionProgress('');
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleProcessFiles(e.target.files);
    e.target.value = '';
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleProcessFiles(e.target.files);
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setUploadedImages((prev) => [...prev, trimmed].slice(0, 5));
    setImageUrlInput('');
  };

  const handleSelectPreset = (presetUrl: string) => {
    if (!uploadedImages.includes(presetUrl)) {
      setUploadedImages((prev) => [...prev, presetUrl].slice(0, 5));
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetAsMainImage = (indexToPromote: number) => {
    setUploadedImages((prev) => {
      const item = prev[indexToPromote];
      const rest = prev.filter((_, idx) => idx !== indexToPromote);
      return [item, ...rest];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsUploadingToCloud(true);
      const finalCloudUrls: string[] = [];

      // 1. رفع الصور الحقيقية إلى Supabase Storage
      for (const img of uploadedImages) {
        if (img.startsWith('data:image')) {
          // إذا كانت الصورة Base64 (من الكاميرا/المعرض)
          const blob = base64ToBlob(img);
          const fileName = `listing_${Date.now()}_${Math.random().toString(36).substring(7)}.jpeg`;
          
          const { data, error } = await supabase.storage
            .from('listings-images')
            .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

          if (error) throw error;

          // الحصول على الرابط العام للصورة
          const { data: urlData } = supabase.storage
            .from('listings-images')
            .getPublicUrl(data.path);
            
          finalCloudUrls.push(urlData.publicUrl);
        } else {
          // إذا كان رابطاً خارجياً (URL)
          finalCloudUrls.push(img);
        }
      }

      // إذا لم يضع المستخدم أي صورة، نضع صورة افتراضية
      let defaultImg = 'https://images.unsplash.com/photo-1592860956372-16e45c083c71?auto=format&fit=crop&w=800&q=80';
      if (category === 'cars') defaultImg = 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80';
      if (category === 'excavators') defaultImg = 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80';
      if (category === 'trucks') defaultImg = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80';

      // 2. إرسال بيانات الإعلان إلى المتجر (Store)
      const success = await onAddListing({
        userId: currentUser.id,
        sellerName: currentUser.fullName,
        sellerPhone: currentUser.phone,
        sellerRating: 5.0,
        title,
        category,
        subCategory: (subCategory === 'other' ? customSubCategory : subCategory).trim() || undefined,
        operation,
        make,
        model,
        year,
        metricType,
        metricValue,
        priceAmount,
        currency,
        rentRateUnit: operation === 'rent' ? rentRateUnit : undefined,
        rentRateAmount: operation === 'rent' ? priceAmount : undefined,
        hasDriverOption,
        driverFeePerDay: hasDriverOption ? 60000 : 0,
        securityDeposit: operation === 'rent' ? 1000000 : undefined,
        zone,
        locationDetails,
        images: finalCloudUrls.length > 0 ? finalCloudUrls : [defaultImg],
        chassisNumber,
        ownershipVerified: true,
        gpsTrackingEnabled,
        gpsDeviceId: gpsTrackingEnabled ? (gpsDeviceId.trim() || `GPS-SWD-${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
        gpsLastPing: gpsTrackingEnabled ? 'موقع الآلية محدّث ومقترن بنجاح' : undefined,
        gpsBatteryLevel: gpsTrackingEnabled ? 95 : undefined,
        serviceNotes: serviceNotes.trim() || undefined,
        inspectionStatus: 'none',
        isPromoted: false,
        status: 'active',
      });

      if (success) {
        onClose();
      }
    } catch (error: any) {
      console.error('Error during upload/submit:', error);
      alert('حدث خطأ أثناء رفع الصور أو حفظ الإعلان: ' + error.message);
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-orange-100 text-orange-800 rounded-xl">
              <Camera className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                إضافة إعلان جديد (بيع أو تأجير آلية / سيارة)
              </h3>
              <p className="text-[11px] text-slate-500">
                التقط صوراً حقيقية لآليتك أو ارفعها من المعرض لزيادة ثقة المشترين في السويداء والكفر
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Operation, Category & Sub-Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">نوع العملية:</label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="sale">بيع قطعي</option>
                <option value="rent">تأجير (باليوم / بالساعة)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">تصنيف الآلية الرئيسي:</label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as ListingCategory;
                  setCategory(val);
                  const availableSubs = SUB_CATEGORIES_BY_CATEGORY[val] || [];
                  setSubCategory(availableSubs[0] || '');
                  if (val === 'tractors' || val === 'excavators' || val === 'heavy_machinery') {
                    setMetricType('work_hours');
                  } else {
                    setMetricType('mileage_km');
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="tractors">جرار زراعي</option>
                <option value="excavators">حفارات وآليات حفر</option>
                <option value="trucks">شاحنات وسيارات نقل</option>
                <option value="heavy_machinery">آليات ثقيلة وإنشائية</option>
                <option value="agricultural">معدات زراعية وحصادات</option>
                <option value="cars">سيارات وبيك آب</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">النوع الفرعي:</label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-3 py-2 bg-orange-50/70 border border-orange-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-orange-500"
              >
                {(SUB_CATEGORIES_BY_CATEGORY[category] || []).map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
                <option value="other">نوع آخر (إدخال يدوي)...</option>
              </select>
            </div>
          </div>

          {subCategory === 'other' && (
            <div className="bg-orange-50/60 p-2.5 rounded-xl border border-orange-200 space-y-1 animate-in fade-in">
              <label className="text-[11px] font-bold text-orange-900 block">اكتب النوع الفرعي بدقة:</label>
              <input
                type="text"
                required
                value={customSubCategory}
                onChange={(e) => setCustomSubCategory(e.target.value)}
                placeholder="مثال: شاحنة قلابة، حفارة مجنزرة، رافعة شوكية..."
                className="w-full px-3 py-1.5 bg-white border border-orange-300 rounded-lg text-xs"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">عنوان الإعلان الواضح:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: جرار بيلاروس 820 بحالة ممتازة جاهز لكروم الكفر"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            />
          </div>

          {/* Make, Model, Year */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">الماركة:</label>
              <input type="text" required value={make} onChange={(e) => setMake(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">الموديل:</label>
              <input type="text" required value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">سنة الصنع:</label>
              <input type="number" min="1980" max="2026" required value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>

          {/* Hours/Km and Price */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">{metricType === 'work_hours' ? 'ساعات العمل:' : 'المسافة (كم):'}</label>
              <input type="number" required value={metricValue} onChange={(e) => setMetricValue(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">{operation === 'sale' ? 'السعر المطلوب:' : 'بدل الإيجار:'}</label>
              <input type="number" required value={priceAmount} onChange={(e) => setPriceAmount(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">العملة:</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                <option value="USD">دولار أمريكي ($)</option>
                <option value="SYP">ليرة سورية (SYP)</option>
              </select>
            </div>
          </div>

          {/* VEHICLE PHOTOS UPLOAD SECTION */}
          <div className="bg-gradient-to-b from-orange-50/50 to-slate-50 border-2 border-orange-300/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-orange-600" />
                <span>صور الآلية الحقيقية ({uploadedImages.length} صور مضافة)</span>
              </label>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                سيتم رفع الصور للسحابة فوراً
              </span>
            </div>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} className="hidden" />
            <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isCompressing || isUploadingToCloud}
                className="flex items-center justify-center gap-2 p-3.5 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-xl shadow-xs transition-all cursor-pointer font-bold text-xs disabled:opacity-50"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>التقاط بالكاميرا مباشرة</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isCompressing || isUploadingToCloud}
                className="flex items-center justify-center gap-2 p-3.5 bg-white hover:bg-slate-50 border-2 border-dashed border-orange-300 hover:border-orange-500 text-slate-800 rounded-xl transition-all cursor-pointer font-bold text-xs disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-orange-600 shrink-0" />
                <span>اختيار من ألبوم الصور</span>
              </button>
            </div>

            {isCompressing && (
              <div className="flex items-center justify-center gap-2 p-2 bg-orange-100/80 rounded-xl text-orange-900 font-semibold text-xs animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                <span>{compressionProgress || 'جاري معالجة الصور...'}</span>
              </div>
            )}

            {/* Optional URL input */}
            <div className="pt-1 border-t border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="أو الصق رابط صورة خارجية..."
                    className="w-full pr-8 pl-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-orange-400"
                  />
                </div>
                <button type="button" onClick={handleAddImageUrl} disabled={!imageUrlInput.trim()} className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg font-bold shrink-0">
                  إضافة
                </button>
              </div>
            </div>

            {/* Image Previews */}
            {uploadedImages.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-bold">الصورة الأولى هي الغلاف الرئيسي</span>
                  <button type="button" onClick={() => setUploadedImages([])} className="text-rose-600 hover:underline text-[10px] font-semibold">مسح كافة الصور</button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className={`relative group rounded-xl overflow-hidden aspect-square border-2 ${idx === 0 ? 'border-orange-500 ring-2 ring-orange-500/40' : 'border-slate-200'}`}>
                      <img src={img} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 ? (
                        <span className="absolute top-1 right-1 bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          <span>الغلاف</span>
                        </span>
                      ) : (
                        <button type="button" onClick={() => handleSetAsMainImage(idx)} className="absolute inset-x-0 bottom-0 bg-slate-950/80 text-white opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold py-1 text-center">تعيين كغلاف</button>
                      )}
                      <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 left-1 bg-slate-900/80 hover:bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location and Zone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">المنطقة:</label>
              <select value={zone} onChange={(e) => setZone(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
                <option value="al_kafr">بلدة الكفر (المركز)</option>
                <option value="suwayda">السويداء (المدينة)</option>
                <option value="shahba">شهبا</option>
                <option value="salkhad">صلخد</option>
                <option value="al_qurayya">القريّا</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">تفاصيل الموقع:</label>
              <input type="text" value={locationDetails} onChange={(e) => setLocationDetails(e.target.value)} placeholder="مثال: الكفر - قرب دوار الساحة" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>

          {/* GPS Tracking */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={gpsTrackingEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setGpsTrackingEnabled(checked);
                    if (checked && !gpsDeviceId) setGpsDeviceId(`GPS-SWD-${Math.floor(1000 + Math.random() * 9000)}`);
                  }}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Radio className={`w-4 h-4 text-blue-600 ${gpsTrackingEnabled ? 'animate-pulse' : ''}`} />
                  تفعيل تتبع GPS للآلية
                </span>
              </label>
            </div>
            {gpsTrackingEnabled && (
              <div className="space-y-1.5 pt-2 border-t border-blue-200/60 animate-in fade-in">
                <label className="font-bold text-slate-800 text-[11px] block">رقم جهاز التتبع:</label>
                <input
                  type="text"
                  value={gpsDeviceId}
                  onChange={(e) => setGpsDeviceId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isUploadingToCloud} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium disabled:opacity-50">إلغاء</button>
            <button
              type="submit"
              disabled={isUploadingToCloud}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 min-w-[150px] justify-center"
            >
              {isUploadingToCloud ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ رفع الصور للسحابة...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>نشر الإعلان فورياً</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};