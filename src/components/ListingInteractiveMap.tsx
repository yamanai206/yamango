import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Listing, ZoneLocation, ListingCategory, ListingOperation } from '../types';
import { 
  DEFAULT_MAP_CENTER, 
  DEFAULT_MAP_ZOOM, 
  SUWAYDA_VILLAGES, 
  BUYER_REFERENCE_LOCATIONS,
  getListingCoordinates, 
  calculateDistanceKm, 
  formatDistanceKm,
  GeoPoint
} from '../utils/geoLocations';
import { 
  MapPin, 
  Navigation, 
  SlidersHorizontal, 
  Crosshair, 
  Compass, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  Wrench, 
  ExternalLink, 
  Eye, 
  Check, 
  Filter, 
  Car, 
  X,
  Maximize2,
  Minimize2,
  Radio,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { VehicleImage } from './VehicleImage';

interface ListingInteractiveMapProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onStartDeal?: (listing: Listing) => void;
  selectedZone?: ZoneLocation | 'all';
  onZoneChange?: (zone: ZoneLocation | 'all') => void;
  className?: string;
}

export const ListingInteractiveMap: React.FC<ListingInteractiveMapProps> = ({
  listings,
  onSelectListing,
  onStartDeal,
  selectedZone = 'all',
  onZoneChange,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const buyerMarkerRef = useRef<L.Marker | null>(null);
  const buyerCircleRef = useRef<L.Circle | null>(null);

  // Buyer location state (defaults to Al-Kafr hub)
  const [buyerLocation, setBuyerLocation] = useState<GeoPoint>({
    lat: SUWAYDA_VILLAGES.al_kafr.lat,
    lng: SUWAYDA_VILLAGES.al_kafr.lng,
  });
  const [buyerLocationLabel, setBuyerLocationLabel] = useState<string>('بلدة الكفر (مركز الانطلاق)');
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Filtering on map
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'all'>('all');
  const [selectedOperation, setSelectedOperation] = useState<ListingOperation | 'all'>('all');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | 'all'>('all');
  const [inspectedOnly, setInspectedOnly] = useState(false);

  // Active highlighted listing
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Setup Global Event Listeners for Leaflet popup action buttons
  useEffect(() => {
    const handlePopupOpenDetail = (e: CustomEvent) => {
      const listingId = e.detail?.listingId;
      const found = listings.find((l) => l.id === listingId);
      if (found) {
        onSelectListing(found);
      }
    };

    const handlePopupStartDeal = (e: CustomEvent) => {
      const listingId = e.detail?.listingId;
      const found = listings.find((l) => l.id === listingId);
      if (found && onStartDeal) {
        onStartDeal(found);
      }
    };

    window.addEventListener('yamango_map_open_detail' as any, handlePopupOpenDetail);
    window.addEventListener('yamango_map_start_deal' as any, handlePopupStartDeal);

    return () => {
      window.removeEventListener('yamango_map_open_detail' as any, handlePopupOpenDetail);
      window.removeEventListener('yamango_map_start_deal' as any, handlePopupStartDeal);
    };
  }, [listings, onSelectListing, onStartDeal]);

  // Compute listings with distance from current buyer location
  const listingsWithDistance = useMemo(() => {
    return listings.map((item) => {
      const coords = getListingCoordinates(item);
      const distanceKm = calculateDistanceKm(
        buyerLocation.lat,
        buyerLocation.lng,
        coords.lat,
        coords.lng
      );
      return {
        ...item,
        mapCoords: coords,
        distanceKm,
      };
    });
  }, [listings, buyerLocation]);

  // Filter listings based on active filters
  const filteredListings = useMemo(() => {
    return listingsWithDistance.filter((item) => {
      if (selectedZone && selectedZone !== 'all' && item.zone !== selectedZone) {
        return false;
      }
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedOperation !== 'all' && item.operation !== selectedOperation) {
        return false;
      }
      if (inspectedOnly && item.inspectionStatus !== 'inspected') {
        return false;
      }
      if (maxDistanceKm !== 'all' && item.distanceKm > maxDistanceKm) {
        return false;
      }
      return true;
    }).sort((a, b) => a.distanceKm - b.distanceKm); // Closest first!
  }, [listingsWithDistance, selectedZone, selectedCategory, selectedOperation, inspectedOnly, maxDistanceKm]);

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
        zoom: DEFAULT_MAP_ZOOM,
        zoomControl: false, // will add customized control in appropriate corner
      });

      // Add OpenStreetMap tiles with high clarity
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | yamango السويداء والكفر',
        maxZoom: 18,
      }).addTo(map);

      // Add Zoom control at top left (RTL friendly)
      L.control.zoom({ position: 'topleft' }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Render Buyer Position Radar Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (buyerMarkerRef.current) {
      buyerMarkerRef.current.remove();
    }
    if (buyerCircleRef.current) {
      buyerCircleRef.current.remove();
    }

    // Custom pulsing Radar Icon for Buyer Location
    const buyerIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <div class="absolute w-10 h-10 bg-blue-500/25 rounded-full animate-ping"></div>
          <div class="absolute w-7 h-7 bg-blue-500/40 rounded-full animate-pulse"></div>
          <div class="relative w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white">
            <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
          </div>
          <div class="absolute -bottom-6 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-md pointer-events-none border border-slate-700">
            موقعك (${buyerLocationLabel.split(' ')[0]})
          </div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker([buyerLocation.lat, buyerLocation.lng], {
      icon: buyerIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    marker.bindPopup(`
      <div class="p-3 text-right font-sans">
        <div class="flex items-center gap-1.5 text-blue-700 font-bold text-xs mb-1">
          <span class="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>نقطة انطلاقك لحساب المسافات</span>
        </div>
        <div class="font-black text-slate-900 text-sm">${buyerLocationLabel}</div>
        <p class="text-[11px] text-slate-500 mt-1">يتم حساب بعد كل آلية أو سيارة عن هذه النقطة بدقة.</p>
      </div>
    `);

    // Radius circle showing immediate proximity (3 km)
    const circle = L.circle([buyerLocation.lat, buyerLocation.lng], {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.05,
      weight: 1.5,
      dashArray: '4, 4',
      radius: 3000,
    }).addTo(map);

    buyerMarkerRef.current = marker;
    buyerCircleRef.current = circle;
  }, [buyerLocation, buyerLocationLabel]);

  // 3. Render Vehicle & Machinery Pins on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    filteredListings.forEach((item) => {
      const { lat, lng } = item.mapCoords;

      // Color scheme based on category
      let categoryColor = 'bg-amber-600';
      let categoryBorder = 'border-amber-400';
      let categoryEmoji = '🚗';
      let categoryBgLight = 'bg-amber-50';

      if (item.category === 'tractors') {
        categoryColor = 'bg-emerald-600';
        categoryBorder = 'border-emerald-400';
        categoryEmoji = '🚜';
        categoryBgLight = 'bg-emerald-50';
      } else if (item.category === 'excavators' || item.category === 'heavy_machinery') {
        categoryColor = 'bg-amber-700';
        categoryBorder = 'border-amber-500';
        categoryEmoji = '🏗️';
        categoryBgLight = 'bg-amber-50';
      } else if (item.category === 'trucks') {
        categoryColor = 'bg-purple-600';
        categoryBorder = 'border-purple-400';
        categoryEmoji = '🚛';
        categoryBgLight = 'bg-purple-50';
      } else if (item.category === 'agricultural') {
        categoryColor = 'bg-teal-600';
        categoryBorder = 'border-teal-400';
        categoryEmoji = '🌾';
        categoryBgLight = 'bg-teal-50';
      } else {
        categoryColor = 'bg-blue-600';
        categoryBorder = 'border-blue-400';
        categoryEmoji = '🚙';
        categoryBgLight = 'bg-blue-50';
      }

      const isPromoted = item.isPromoted;
      const formattedPrice = item.priceAmount.toLocaleString('ar-SY');
      const currencySymbol = item.currency === 'USD' ? '$' : 'ل.س';
      const formattedDistance = formatDistanceKm(item.distanceKm);

      // Custom divIcon with price tag and interactive hover effect
      const markerHtml = `
        <div class="relative group cursor-pointer -translate-x-1/2 -translate-y-full transition-transform duration-200 hover:scale-110">
          ${isPromoted ? '<div class="absolute -top-2.5 -right-2 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white shadow-xs z-10 animate-bounce">مميز ⭐</div>' : ''}
          
          <div class="flex items-center gap-1 px-2 py-1 rounded-xl shadow-md text-white ${categoryColor} border-2 border-white backdrop-blur-xs font-sans">
            <span class="text-xs">${categoryEmoji}</span>
            <span class="font-black text-[11px] tracking-tight" dir="ltr">${formattedPrice} ${currencySymbol}</span>
          </div>
          
          <div class="w-2.5 h-2.5 bg-slate-900 border-2 border-white rotate-45 mx-auto -mt-1.5 shadow-sm"></div>

          <!-- Mini distance pill below pin -->
          <div class="mt-0.5 mx-auto w-max bg-slate-900/90 text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs border border-slate-700">
            ${formattedDistance}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: markerHtml,
        iconSize: [80, 45],
        iconAnchor: [40, 40],
        popupAnchor: [0, -42],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Rich HTML Popup Content with clean image, details, and actionable buttons
      const popupHtml = `
        <div class="w-64 sm:w-72 overflow-hidden rounded-2xl bg-white font-sans text-slate-900 text-right">
          <!-- Thumbnail & Badges -->
          <div class="relative h-32 w-full bg-slate-100 overflow-hidden">
            <img 
              src="${item.images[0] || 'https://images.unsplash.com/photo-1592860956372-16e45c083c71?auto=format&fit=crop&w=600&q=80'}" 
              alt="${item.title}" 
              class="w-full h-full object-cover"
              onerror="this.src='https://images.unsplash.com/photo-1592860956372-16e45c083c71?auto=format&fit=crop&w=600&q=80'"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
            
            <div class="absolute top-2 right-2 flex items-center gap-1">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${item.operation === 'sale' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}">
                ${item.operation === 'sale' ? 'للبيع' : 'للإيجار'}
              </span>
              ${item.inspectionStatus === 'inspected' ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-0.5">فحص معتمد ✓</span>' : ''}
            </div>

            <div class="absolute bottom-2 right-2 left-2 flex items-center justify-between text-white">
              <span class="font-black text-sm" dir="ltr">${formattedPrice} ${currencySymbol}</span>
              <span class="text-[11px] bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs font-bold text-amber-300">
                على بعد ${formattedDistance}
              </span>
            </div>
          </div>

          <!-- Content Body -->
          <div class="p-3.5 space-y-2">
            <div>
              <h4 class="font-bold text-xs text-slate-900 line-clamp-1 leading-snug">${item.title}</h4>
              <div class="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <span class="text-amber-600 font-medium">📍 ${item.locationDetails || (SUWAYDA_VILLAGES[item.zone]?.nameAr || 'محافظة السويداء')}</span>
              </div>
            </div>

            <!-- Meta details -->
            <div class="grid grid-cols-2 gap-1.5 py-1.5 border-y border-slate-100 text-[10px]">
              <div>
                <span class="text-slate-400 block">سنة الصنع:</span>
                <span class="font-bold text-slate-800">${item.year}</span>
              </div>
              <div>
                <span class="text-slate-400 block">${item.metricType === 'work_hours' ? 'ساعات العمل:' : 'المسافة المقطوعة:'}</span>
                <span class="font-bold text-slate-800 font-mono">${item.metricValue.toLocaleString('ar-SY')} ${item.metricType === 'work_hours' ? 'ساعة' : 'كم'}</span>
              </div>
            </div>

            <!-- Action Buttons inside Leaflet Popup -->
            <div class="pt-1 flex items-center gap-1.5">
              <button 
                type="button" 
                onclick="window.dispatchEvent(new CustomEvent('yamango_map_open_detail', { detail: { listingId: '${item.id}' } }))"
                class="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
              >
                عرض التفاصيل
              </button>
              
              <button 
                type="button" 
                onclick="window.dispatchEvent(new CustomEvent('yamango_map_start_deal', { detail: { listingId: '${item.id}' } }))"
                class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                title="بدء صفقة / حجز إسكرو"
              >
                صفقة 🛡️
              </button>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 320,
        className: 'yamango-leaflet-popup',
      });

      marker.on('click', () => {
        setActiveListing(item);
      });

      markersLayer.addLayer(marker);
    });
  }, [filteredListings]);

  // Handle GPS Locating Buyer
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('خاصية تحديد الموقع الجغرافي غير مدعومة في متصفحك.');
      return;
    }

    setIsLocatingUser(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords: GeoPoint = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        };
        setBuyerLocation(newCoords);
        setBuyerLocationLabel('موقعي الحالي عبر GPS');
        setIsLocatingUser(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([newCoords.lat, newCoords.lng], 13, { duration: 1.2 });
        }
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setLocationError('تعذر الحصول على موقعك عبر GPS. تم الاعتماد على اختيارك اليدوي.');
        setIsLocatingUser(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Change buyer location from predefined reference towns
  const handleSelectBuyerLocation = (loc: typeof BUYER_REFERENCE_LOCATIONS[0]) => {
    setBuyerLocation({ lat: loc.lat, lng: loc.lng });
    setBuyerLocationLabel(loc.nameAr);
    setLocationError(null);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 13, { duration: 1 });
    }
  };

  // Focus on specific village
  const handleFlyToVillage = (villageKey: string) => {
    const v = SUWAYDA_VILLAGES[villageKey];
    if (v && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([v.lat, v.lng], 14, { duration: 1 });
    }
  };

  // Fit bounds to all matching markers
  const handleFitAllMarkers = () => {
    if (!mapInstanceRef.current || filteredListings.length === 0) return;
    const bounds = L.latLngBounds(
      filteredListings.map((item) => [item.mapCoords.lat, item.mapCoords.lng])
    );
    // Include buyer location in bounds
    bounds.extend([buyerLocation.lat, buyerLocation.lng]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  };

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[680px]'
      } ${className}`}
    >
      {/* 1. Map Header Controls & Location Finder */}
      <div className="p-4 border-b border-slate-200 bg-slate-900 text-white shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight">
                  خريطة الآليات والمركبات التفاعلية
                </h3>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                  السويداء والكفر
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                تحديد مواقع الجرارات والحفارات والسيارات بدقة وحساب المسافة من موقعك الحالي
              </p>
            </div>
          </div>

          {/* Quick Hub Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocatingUser}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              title="تحديد موقعي التلقائي عبر GPS"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">أين أنا؟ (GPS)</span>
              <span className="sm:hidden">موقعي</span>
            </button>

            <button
              type="button"
              onClick={handleFitAllMarkers}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="توسيع الخريطة لتشمل كافة الآليات"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
              <span>إظهار الكل</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700 cursor-pointer"
              title={isFullscreen ? 'تصغير الخريطة' : 'ملء الشاشة'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 2. Proximity Reference Bar (Select Buyer's Village) */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-400" />
              <span>موقعي لحساب المسافة:</span>
            </span>

            <select
              value={buyerLocationLabel}
              onChange={(e) => {
                const found = BUYER_REFERENCE_LOCATIONS.find((l) => l.nameAr === e.target.value);
                if (found) handleSelectBuyerLocation(found);
              }}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
            >
              {BUYER_REFERENCE_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.nameAr}>
                  {loc.nameAr}
                </option>
              ))}
            </select>

            {/* Quick jump to Al-Kafr hub */}
            <button
              type="button"
              onClick={() => handleFlyToVillage('al_kafr')}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
            >
              التركيز على بلدة الكفر 🍇
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            عدد الخيارات المتاحة على الخريطة: <strong className="text-amber-400">{filteredListings.length}</strong>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar on Top of Map */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-slate-500 text-[11px] font-bold shrink-0">التصنيف:</span>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'tractors', label: '🚜 جرارات' },
            { id: 'excavators', label: '🏗️ حفارات' },
            { id: 'trucks', label: '🚛 شاحنات' },
            { id: 'cars', label: '🚙 سيارات' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Distance Range Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px] font-bold shrink-0">النطاق الأقرب:</span>
          <select
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs font-bold cursor-pointer"
          >
            <option value="all">كافة المسافات</option>
            <option value="5">أقل من 5 كم</option>
            <option value="10">أقل من 10 كم</option>
            <option value="20">أقل من 20 كم</option>
            <option value="35">أقل من 35 كم</option>
          </select>

          {/* Toggle Side List Panel */}
          <button
            type="button"
            onClick={() => setShowSidePanel(!showSidePanel)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
              showSidePanel
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {showSidePanel ? 'إخفاء القائمة' : 'عرض القائمة'}
          </button>
        </div>
      </div>

      {/* 4. Map & Interactive Side Drawer Viewport */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* The Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Proximity List Side Panel (Desktop & Tablet) */}
        {showSidePanel && (
          <div className="absolute top-3 left-3 bottom-3 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 z-20 flex flex-col overflow-hidden animate-in slide-in-from-left duration-200">
            {/* Side Panel Header */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  <span>الخيارات مرتبة حسب الأقرب لموقعك</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  منطلق الحساب: {buyerLocationLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSidePanel(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Side Panel List */}
            <div className="p-3 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
              {filteredListings.length === 0 ? (
                <div className="p-6 text-center text-slate-400 space-y-2">
                  <Car className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">لا توجد آليات مطابقة للمسافة المختارة</p>
                  <p className="text-[11px]">جرب توسيع نطاق المسافة أو اختيار تصنيف آخر.</p>
                </div>
              ) : (
                filteredListings.map((item) => {
                  const isSelected = activeListing?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveListing(item);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo(
                            [item.mapCoords.lat, item.mapCoords.lng],
                            15,
                            { duration: 0.8 }
                          );
                        }
                      }}
                      className={`pt-2.5 first:pt-0 cursor-pointer transition-all rounded-xl p-2 group ${
                        isSelected
                          ? 'bg-amber-50/80 border border-amber-300 shadow-2xs'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                          <VehicleImage
                            src={item.images[0]}
                            alt={item.title}
                            category={item.category}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className={`absolute bottom-1 right-1 text-[9px] font-bold px-1.5 rounded-sm text-white ${
                              item.operation === 'sale' ? 'bg-emerald-600' : 'bg-indigo-600'
                            }`}
                          >
                            {item.operation === 'sale' ? 'بيع' : 'إيجار'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] font-mono font-black text-amber-700 shrink-0" dir="ltr">
                              {item.priceAmount.toLocaleString('ar-SY')} {item.currency === 'USD' ? '$' : 'ل.س'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">{item.locationDetails}</span>
                          </div>

                          <div className="flex items-center justify-between mt-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                              <span>تبعد عنك:</span>
                              <strong>{formatDistanceKm(item.distanceKm)}</strong>
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectListing(item);
                              }}
                              className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5"
                            >
                              <span>التفاصيل</span>
                              <ChevronRight className="w-3 h-3 rotate-180" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>أقرب خيار: {filteredListings[0] ? formatDistanceKm(filteredListings[0].distanceKm) : '-'}</span>
              <button
                type="button"
                onClick={handleFitAllMarkers}
                className="text-amber-700 font-bold hover:underline"
              >
                إظهار نطاق الجميع
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
