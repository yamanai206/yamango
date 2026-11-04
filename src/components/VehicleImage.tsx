import React, { useState, useEffect } from 'react';
import { ListingCategory } from '../types';
import { Car, Truck, Tractor, Construction, CheckCircle2 } from 'lucide-react';

interface VehicleImageProps {
  src?: string;
  alt: string;
  category: ListingCategory;
  className?: string;
  showVerifiedBadge?: boolean;
}

export const VehicleImage: React.FC<VehicleImageProps> = ({
  src,
  alt,
  category,
  className = 'w-full h-full object-cover',
  showVerifiedBadge = false,
}) => {
  const [hasError, setHasError] = useState(!src);
  const [isLoading, setIsLoading] = useState(Boolean(src));

  // Reset error state when src changes
  useEffect(() => {
    setHasError(!src);
    setIsLoading(Boolean(src));
  }, [src]);

  if (hasError || !src) {
    // Elegant domain-styled SVG/CSS fallback container
    const categoryConfig = {
      tractors: {
        bg: 'from-emerald-900 via-emerald-800 to-amber-950',
        icon: Tractor,
        badge: 'جرار زراعي',
        label: 'معدة زراعية',
      },
      excavators: {
        bg: 'from-amber-950 via-amber-800 to-slate-900',
        icon: Construction,
        badge: 'حفارة ثقيلة',
        label: 'آلية إنشائية',
      },
      cars: {
        bg: 'from-slate-900 via-slate-800 to-slate-950',
        icon: Car,
        badge: 'سيارة سياحية / بيك آب',
        label: 'مركبة معتمدة',
      },
      trucks: {
        bg: 'from-orange-950 via-slate-800 to-slate-900',
        icon: Truck,
        badge: 'شاحنة نقل',
        label: 'نقل ثقيل',
      },
      agricultural: {
        bg: 'from-emerald-950 via-emerald-900 to-slate-900',
        icon: Tractor,
        badge: 'معدة زراعية',
        label: 'معدات حقلية',
      },
      heavy_machinery: {
        bg: 'from-amber-900 via-slate-900 to-slate-950',
        icon: Construction,
        badge: 'آلية ثقيلة',
        label: 'معدات خاصة',
      },
    }[category] || {
      bg: 'from-slate-900 to-slate-800',
      icon: Car,
      badge: 'مركبة',
      label: 'yamango',
    };

    const Icon = categoryConfig.icon;

    return (
      <div className={`w-full h-full bg-gradient-to-br ${categoryConfig.bg} text-white flex flex-col justify-between p-4 relative overflow-hidden select-none`}>
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="flex items-center justify-between relative z-10">
          <span className="text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-xs text-white">
            {categoryConfig.badge}
          </span>
          <span className="text-[10px] text-amber-300 font-mono font-semibold">yamango</span>
        </div>

        <div className="flex flex-col items-center justify-center my-auto py-2 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg mb-2">
            <Icon className="w-8 h-8 text-amber-400" />
          </div>
          <span className="text-xs font-bold text-center text-white/95 line-clamp-1 px-2">
            {alt}
          </span>
          <span className="text-[10px] text-slate-300 mt-0.5">
            {categoryConfig.label}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 relative z-10 pt-1 border-t border-white/10">
          <span>توثيق المنصة ✓</span>
          <span>السويداء · الكفر</span>
        </div>
      </div>
    );
  }

  const isDataUrl = src.startsWith('data:image/');

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900/5">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center z-5">
          <span className="text-[10px] text-slate-400 font-semibold">جاري تحميل الصورة...</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        loading="lazy"
      />
      {showVerifiedBadge && isDataUrl && (
        <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs z-10">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>صورة حقيقية</span>
        </div>
      )}
    </div>
  );
};
