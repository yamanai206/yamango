/**
 * Geographic coordinates & distance calculations for As-Suwayda Governorate & Al-Kafr
 * yamango Marketplace
 */

import { Listing, ZoneLocation } from '../types';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface VillageLocationInfo {
  id: ZoneLocation | string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  description: string;
  isMainHub?: boolean;
}

/**
 * High-accuracy coordinates for towns and villages in As-Suwayda Governorate
 * with Al-Kafr as the primary hub
 */
export const SUWAYDA_VILLAGES: Record<string, VillageLocationInfo> = {
  al_kafr: {
    id: 'al_kafr',
    nameAr: 'بلدة الكفر',
    nameEn: 'Al-Kafr',
    lat: 32.6167,
    lng: 36.6333,
    description: 'مركز انطلاق yamango الأول ومعقل كروم العنب والآليات الزراعية',
    isMainHub: true,
  },
  suwayda: {
    id: 'suwayda',
    nameAr: 'مدينة السويداء',
    nameEn: 'As-Suwayda City',
    lat: 32.7089,
    lng: 36.5667,
    description: 'مركز المحافظة والخدمات والتجارة والصناعة',
  },
  salkhad: {
    id: 'salkhad',
    nameAr: 'مدينة صلخد',
    nameEn: 'Salkhad',
    lat: 32.4928,
    lng: 36.7114,
    description: 'المنطقة الجنوبية، القلعة التاريخية وأراضي الرعي والحبوب',
  },
  shahba: {
    id: 'shahba',
    nameAr: 'مدينة شهبا',
    nameEn: 'Shahba',
    lat: 32.8550,
    lng: 36.6289,
    description: 'المنطقة الشمالية وبوابة اللجاة ومشاريع المقاولات',
  },
  al_qurayya: {
    id: 'al_qurayya',
    nameAr: 'بلدة القريّا',
    nameEn: 'Al-Qurayya',
    lat: 32.5350,
    lng: 36.5860,
    description: 'جنوب غرب السويداء، صرح الشهداء والمزارع الخصبة',
  },
  ariqa: {
    id: 'ariqa',
    nameAr: 'ناحية عريقة',
    nameEn: 'Ariqa',
    lat: 32.8940,
    lng: 36.4850,
    description: 'منطقة اللجاة الصخرية والكسارات ومزارع الزيتون',
  },
  mazraa: {
    id: 'mazraa',
    nameAr: 'بلدة المزرعة',
    nameEn: 'Al-Mazraa',
    lat: 32.7480,
    lng: 36.4420,
    description: 'السهول الغربية وزراعة القمح والشعير',
  },
  qanawat: {
    id: 'qanawat',
    nameAr: 'بلدة قنوات',
    nameEn: 'Qanawat',
    lat: 32.7550,
    lng: 36.6180,
    description: 'طريق الأحراش الجبلية والكروم',
  },
  risas: {
    id: 'risas',
    nameAr: 'بلدة رساس',
    nameEn: 'Risas',
    lat: 32.6580,
    lng: 36.5680,
    description: 'تقع بين السويداء والكفر ومحطة عبور رئيسية',
  },
  sahwat_khidr: {
    id: 'sahwat_khidr',
    nameAr: 'سهوة الخضر',
    nameEn: 'Sahwat al-Khidr',
    lat: 32.5530,
    lng: 36.6870,
    description: 'جنوب الكفر، أراضي التفاح والكروم الجبلية',
  },
};

/**
 * Center coordinate for the map viewport (Al-Kafr / As-Suwayda junction)
 */
export const DEFAULT_MAP_CENTER: GeoPoint = {
  lat: 32.6450,
  lng: 36.6100,
};

export const DEFAULT_MAP_ZOOM = 12;

/**
 * Deterministically calculate a unique coordinate for a listing within its zone
 * if no explicit gpsCoordinates are saved.
 */
export function getListingCoordinates(listing: Listing): GeoPoint {
  if (listing.gpsCoordinates && typeof listing.gpsCoordinates.lat === 'number' && typeof listing.gpsCoordinates.lng === 'number') {
    return {
      lat: listing.gpsCoordinates.lat,
      lng: listing.gpsCoordinates.lng,
    };
  }

  // Lookup village anchor
  const zoneKey = listing.zone || 'al_kafr';
  const baseVillage = SUWAYDA_VILLAGES[zoneKey] || SUWAYDA_VILLAGES.al_kafr;

  // Generate a small, deterministic spread (+/- 0.008 deg ~ 800m) based on listing ID
  const hash = listing.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = (((hash * 13) % 100) / 100 - 0.5) * 0.016;
  const lngOffset = (((hash * 17) % 100) / 100 - 0.5) * 0.018;

  return {
    lat: Number((baseVillage.lat + latOffset).toFixed(5)),
    lng: Number((baseVillage.lng + lngOffset).toFixed(5)),
  };
}

/**
 * Calculate distance in Kilometers between two coordinates using the Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Number(distance.toFixed(1));
}

/**
 * Format distance in Arabic
 */
export function formatDistanceKm(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} متر`;
  }
  return `${km.toLocaleString('ar-SY')} كم`;
}

/**
 * Predefined Buyer Locations for quick one-click distance sorting
 */
export const BUYER_REFERENCE_LOCATIONS = [
  { id: 'al_kafr', nameAr: 'بلدة الكفر (المدخل ومبنى البلدية)', lat: 32.6167, lng: 36.6333 },
  { id: 'suwayda_center', nameAr: 'مدينة السويداء (ساحة المشنقة / الفرسان)', lat: 32.7089, lng: 36.5667 },
  { id: 'suwayda_qanawat', nameAr: 'طريق قنوات (دوار الجرة)', lat: 32.7350, lng: 36.5920 },
  { id: 'salkhad', nameAr: 'مدينة صلخد (المركز والقلعة)', lat: 32.4928, lng: 36.7114 },
  { id: 'shahba', nameAr: 'مدينة شهبا (المركز الأثري)', lat: 32.8550, lng: 36.6289 },
  { id: 'al_qurayya', nameAr: 'بلدة القريّا (الصرح)', lat: 32.5350, lng: 36.5860 },
  { id: 'risas', nameAr: 'بلدة رساس (الشارع العام)', lat: 32.6580, lng: 36.5680 },
];
