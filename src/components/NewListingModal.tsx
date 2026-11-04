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

interface NewListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAddListing: (newListing: Omit<Listing, 'id' | 'createdAt' | 'viewsCount' | 'clicksCount' | 'inquiriesCount'>) => Listing;
}

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
      // Limit to 10 photos total to preserve state health
      const combined = [...prev, ...newCompressedImages];
      return combined.slice(0, 10);
    });

    setIsCompressing(false);
    setCompressionProgress('');
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleProcessFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleProcessFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setUploadedImages((prev) => [...prev, trimmed].slice(0, 10));
    setImageUrlInput('');
  };

  const handleSelectPreset = (presetUrl: string) => {
    if (!uploadedImages.includes(presetUrl)) {
      setUploadedImages((prev) => [...prev, presetUrl].slice(0, 10));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Default image based on category if user didn't supply any
    let defaultImg = 'https://images.unsplash.com/photo-1592860956372-16e45c083c71?auto=format&fit=crop&w=800&q=80';
    if (category === 'cars') defaultImg = 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80';
    if (category === 'excavators') defaultImg = 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80';
    if (category === 'trucks') defaultImg = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80';

    onAddListing({
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
      images: uploadedImages.length > 0 ? uploadedImages : [defaultImg],
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

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
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
              <label className="font-bold text-slate-700 block mb-1">
                النوع الفرعي (Sub-category):
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-3 py-2 bg-amber-50/70 border border-amber-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              >
                {(SUB_CATEGORIES_BY_CATEGORY[category] || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
                <option value="other">نوع آخر (إدخال يدوي)...</option>
              </select>
            </div>
          </div>

          {subCategory === 'other' && (
            <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 space-y-1 animate-in fade-in">
              <label className="text-[11px] font-bold text-amber-900 block">
                اكتب النوع الفرعي بدقة (مثال: شاحنة قلابة، حفارة مجنزرة، رافعة شوكية):
              </label>
              <input
                type="text"
                required
                value={customSubCategory}
                onChange={(e) => setCustomSubCategory(e.target.value)}
                placeholder="اكتب النوع الفرعي للآلية..."
                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
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
              <label className="font-bold text-slate-700 block mb-1">الماركة (الشركة):</label>
              <input
                type="text"
                required
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">الموديل والطراز:</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">سنة الصنع:</label>
              <input
                type="number"
                min="1980"
                max="2027"
                required
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Hours/Km and Price */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {metricType === 'work_hours' ? 'ساعات العمل:' : 'المسافة (كم):'}
              </label>
              <input
                type="number"
                required
                value={metricValue}
                onChange={(e) => setMetricValue(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {operation === 'sale' ? 'السعر المطلوب:' : 'بدل الإيجار:'}
              </label>
              <input
                type="number"
                required
                value={priceAmount}
                onChange={(e) => setPriceAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">العملة:</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="USD">دولار أمريكي ($)</option>
                <option value="SYP">ليرة سورية (SYP)</option>
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VEHICLE PHOTOS UPLOAD & CAMERA SECTION (FEATURE HIGHLIGHT) */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-b from-amber-50/50 to-slate-50 border-2 border-amber-300/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-600" />
                <span>صور الآلية / المركبة الحقيقية ({uploadedImages.length} صور مضافة)</span>
              </label>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                الصور تظهر مباشرة في البطاقة والتفاصيل
              </span>
            </div>

            {/* Hidden Input Elements for Camera and File Picker */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
            />

            {/* Primary Action Buttons: Camera + Gallery */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Direct Camera Capture Button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isCompressing}
                className="flex items-center justify-center gap-2 p-3.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl shadow-xs transition-all cursor-pointer font-bold text-xs"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>التقاط بالكاميرا مباشرة (Camera)</span>
              </button>

              {/* Gallery / File Picker Button */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isCompressing}
                className="flex items-center justify-center gap-2 p-3.5 bg-white hover:bg-slate-50 border-2 border-dashed border-amber-300 hover:border-amber-500 text-slate-800 rounded-xl transition-all cursor-pointer font-bold text-xs"
              >
                <Upload className="w-4 h-4 text-amber-600 shrink-0" />
                <span>اختيار من ألبوم الصور / الجهاز</span>
              </button>
            </div>

            {/* Compression Loading Feedback */}
            {isCompressing && (
              <div className="flex items-center justify-center gap-2 p-2 bg-amber-100/80 rounded-xl text-amber-900 font-semibold text-xs animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>{compressionProgress || 'جاري معالجة وضغط الصور لتسريع التصفح...'}</span>
              </div>
            )}

            {/* Optional URL input & Quick Presets */}
            <div className="pt-1 border-t border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="أو الصق رابط صورة خارجية (URL)..."
                    className="w-full pr-8 pl-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!imageUrlInput.trim()}
                  className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg font-bold shrink-0 cursor-pointer"
                >
                  إضافة الرابط
                </button>
              </div>

              {/* Popular Presets Quick Pick */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>صور جاهزة سريعة:</span>
                </span>
                {POPULAR_VEHICLE_PHOTO_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-amber-100 border border-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                    title={preset.description}
                  >
                    + {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Previews Thumbnails Grid */}
            {uploadedImages.length > 0 ? (
              <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-bold">
                    معاينة الصور ({uploadedImages.length}): الصورة الأولى هي صورة الغلاف الرئيسية
                  </span>
                  <button
                    type="button"
                    onClick={() => setUploadedImages([])}
                    className="text-rose-600 hover:underline cursor-pointer text-[10px] font-semibold"
                  >
                    مسح كافة الصور
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                        idx === 0 ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-xs' : 'border-slate-200 bg-slate-100'
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`صورة الآلية ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                      
                      {/* Main Cover Badge */}
                      {idx === 0 ? (
                        <span className="absolute top-1 right-1 bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs pointer-events-none flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          <span>الرئيسية</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetAsMainImage(idx)}
                          className="absolute inset-x-0 bottom-0 bg-slate-950/80 text-white opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold py-1 text-center cursor-pointer"
                          title="تعيين هذه الصورة كغلاف رئيسي للإعلان"
                        >
                          تعيين كغلاف
                        </button>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 left-1 bg-slate-900/80 hover:bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-[11px] text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>لم ترفق صوراً بعد. اضغط على الكاميرا لالتقاط صورة حية، أو اختر صوراً من جهازك لتبديل الأيقونات التلقائية بصور حقيقية.</span>
                </span>
              </div>
            )}
          </div>

          {/* Location and Zone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">المنطقة / الناحية:</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="al_kafr">بلدة الكفر (مركز الانطلاق)</option>
                <option value="suwayda">السويداء (المدينة)</option>
                <option value="shahba">شهبا</option>
                <option value="salkhad">صلخد</option>
                <option value="al_qurayya">القريّا</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">تفاصيل الموقع والمعالم:</label>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="مثال: الكفر - قرب دوار الساحة"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Chassis verification */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">رقم الهيكل (الشاسيه):</label>
            <input
              type="text"
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value)}
              placeholder="يُحفظ في السجل لمنع تكرار الإعلانات الوهمية"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
            />
          </div>

          {/* Service & Maintenance Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 block text-xs">
                ملاحظات الخدمة والصيانة الدورية (سجل الصيانة):
              </label>
              <span className="text-[10px] text-slate-400">اختياري - يعزز ثقة المشتري</span>
            </div>
            <textarea
              rows={2}
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder="مثال: تم تبديل زيت المحرك وفلاتر الديزل الأصلية حديثاً، فحص ضغط الهيدروليك، بطارية وإطارات جديدة..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

          {/* GPS Tracking for machinery & rentals */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={gpsTrackingEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setGpsTrackingEnabled(checked);
                    if (checked && !gpsDeviceId) {
                      setGpsDeviceId(`GPS-SWD-${Math.floor(1000 + Math.random() * 9000)}`);
                    }
                  }}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Radio className={`w-4 h-4 text-blue-600 ${gpsTrackingEnabled ? 'animate-pulse' : ''}`} />
                  تفعيل تتبع GPS للآلية (موصى به للآليات المؤجرة والمعدات الثقيلة)
                </span>
              </label>

              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                حماية وإسكرو
              </span>
            </div>

            {gpsTrackingEnabled && (
              <div className="space-y-1.5 pt-2 border-t border-blue-200/60 animate-in fade-in">
                <label className="font-bold text-slate-800 text-[11px] block">
                  رقم جهاز التتبع (GPS Device ID / IMEI):
                </label>
                <div className="relative">
                  <Cpu className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={gpsDeviceId}
                    onChange={(e) => setGpsDeviceId(e.target.value)}
                    placeholder="مثال: GPS-SWD-4912 أو IMEI: 862910482910482"
                    className="w-full pr-9 pl-3 py-2 bg-white border border-blue-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
                <p className="text-[10px] text-blue-800 leading-relaxed">
                  يُثبّت رقم جهاز التتبع تلقائياً في العقد الإلكتروني لحماية الآلية من السرقة أو الخروج عن النطاق الجغرافي المحدد في محافظة السويداء.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              يحق للمشتري طلب فحص الآلية في كراج معتمد قبل الشراء. جميع الصفقات تتم بوساطة إسكرو yamango لحمايتك.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>نشر الإعلان فورياً</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
