import React, { useState, useEffect, useRef } from 'react';
import { ListingFilter } from '../utils/ranking';
import { ZoneLocation, ListingCategory, ListingOperation } from '../types';
import { Search, MapPin, ChevronDown, CheckCircle, SlidersHorizontal, X, Clock, Trash2, ArrowUpLeft, ShieldCheck } from 'lucide-react';

interface FilterBarProps {
  filter: ListingFilter;
  setFilter: React.Dispatch<React.SetStateAction<ListingFilter>>;
  promotedCount: number;
  totalMatchesCount: number;
}

const STORAGE_KEY_SEARCH_HISTORY = 'yamango_recent_searches_v1';
const DEFAULT_INITIAL_SEARCHES = ['جرار بيلاروس', 'حفارة كوماتسو', 'سيارة كيا', 'بيك آب تويوتا', 'الكفر'];

export const ZONES: { id: ZoneLocation | 'all'; label: string; shortLabel: string }[] = [
  { id: 'all', label: 'كافة النواحي والمناطق (السويداء)', shortLabel: 'كافة المناطق' },
  { id: 'al_kafr', label: 'بلدة الكفر (مركز الانطلاق)', shortLabel: 'الكفر' },
  { id: 'suwayda', label: 'مدينة السويداء', shortLabel: 'السويداء' },
  { id: 'salkhad', label: 'ناحية صلخد', shortLabel: 'صلخد' },
  { id: 'shahba', label: 'ناحية شهبا', shortLabel: 'شهبا' },
  { id: 'al_qurayya', label: 'ناحية القريّا', shortLabel: 'القريّا' },
  { id: 'mazraa', label: 'ناحية المزرعة', shortLabel: 'المزرعة' },
  { id: 'ariqa', label: 'ناحية عريقة', shortLabel: 'عريقة' },
];

const CATEGORIES: { id: ListingCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'جميع الآليات والمركبات' },
  { id: 'tractors', label: 'جرارات زراعية' },
  { id: 'excavators', label: 'حفارات ومعدات ثقيلة' },
  { id: 'cars', label: 'سيارات وبيك آب' },
  { id: 'trucks', label: 'شاحنات وقلابات' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  setFilter,
  promotedCount,
  totalMatchesCount,
}) => {
  const currentZone = filter.zone || 'all';
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Search history state (max 5 items)
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_SEARCH_HISTORY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 5);
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_INITIAL_SEARCHES;
  });

  // Save history to localStorage
  const saveHistoryToStorage = (items: string[]) => {
    setSearchHistory(items);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SEARCH_HISTORY, JSON.stringify(items));
      }
    } catch (e) {
      console.warn('Could not save search history', e);
    }
  };

  // Add a query to history
  const addQueryToHistory = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    const updated = [trimmed, ...searchHistory.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    saveHistoryToStorage(updated);
  };

  // Remove single query from history
  const removeQueryFromHistory = (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = searchHistory.filter((item) => item !== queryToRemove);
    saveHistoryToStorage(updated);
  };

  // Clear all history
  const clearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveHistoryToStorage([]);
    setIsHistoryOpen(false);
  };

  // Select a suggestion
  const handleSelectSuggestion = (query: string) => {
    setFilter((prev) => ({ ...prev, searchQuery: query }));
    addQueryToHistory(query);
    setIsHistoryOpen(false);
  };

  // Handle enter key in search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filter.searchQuery?.trim()) {
        addQueryToHistory(filter.searchQuery);
      }
      setIsHistoryOpen(false);
    } else if (e.key === 'Escape') {
      setIsHistoryOpen(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsHistoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6 space-y-4">
      {/* Row 1: Search Input, Dedicated 'الناحية' Selection Field, and Operation Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Input with History Dropdown */}
        <div ref={searchContainerRef} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            data-testid="search-input"
            value={filter.searchQuery || ''}
            onFocus={() => setIsHistoryOpen(true)}
            onClick={() => setIsHistoryOpen(true)}
            onMouseDown={() => setIsHistoryOpen(true)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (filter.searchQuery?.trim()) {
                addQueryToHistory(filter.searchQuery);
              }
            }}
            onChange={(e) => {
              setFilter((prev) => ({ ...prev, searchQuery: e.target.value }));
              setIsHistoryOpen(true);
            }}
            placeholder="ابحث عن جرار، حفارة، تويوتا، كيا، ساعات عمل، موقع..."
            className="w-full pr-10 pl-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
          />
          {filter.searchQuery && (
            <button
              type="button"
              onClick={() => {
                setFilter((prev) => ({ ...prev, searchQuery: '' }));
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search History Dropdown (Last 5 Queries) */}
          {isHistoryOpen && searchHistory.length > 0 && (
            <div data-testid="search-history-dropdown" className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg z-40 overflow-hidden animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>عمليات البحث الأخيرة ({searchHistory.length})</span>
                </div>
                <button
                  type="button"
                  onClick={clearAllHistory}
                  className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors font-medium cursor-pointer"
                >
                  مسح السجل
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {searchHistory.map((queryText, index) => (
                  <div
                    key={`${queryText}-${index}`}
                    onClick={() => handleSelectSuggestion(queryText)}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs text-slate-700 hover:bg-amber-50/70 hover:text-amber-900 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0" />
                      <span className="truncate font-medium">{queryText}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-slate-400 group-hover:text-amber-700 font-mono hidden sm:inline">
                        اختيار
                      </span>
                      <button
                        type="button"
                        onClick={(e) => removeQueryFromHistory(queryText, e)}
                        className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="حذف من السجل"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dedicated 'الناحية' (Sub-District / Zone) Selection Field */}
        <div className="relative flex-initial sm:w-64">
          <label htmlFor="zone-select" className="sr-only">
            الناحية / المنطقة
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-amber-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="zone-select"
              name="zone"
              aria-label="الناحية"
              value={currentZone}
              onChange={(e) => {
                const newZone = e.target.value as ZoneLocation | 'all';
                setFilter((prev) => ({ ...prev, zone: newZone }));
              }}
              className="w-full appearance-none pr-9 pl-9 py-2.5 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-2xs"
            >
              {ZONES.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.id === 'all' ? 'الناحية: كافة المناطق' : `الناحية: ${zone.label}`}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Operation Tabs (Sale / Rent) */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter((prev) => ({ ...prev, operation: 'all' }))}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter.operation === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => setFilter((prev) => ({ ...prev, operation: 'sale' }))}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter.operation === 'sale'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            بيع قطعي
          </button>
          <button
            type="button"
            onClick={() => setFilter((prev) => ({ ...prev, operation: 'rent' }))}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              filter.operation === 'rent'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تأجير باليوم / بالساعة
          </button>
        </div>
      </div>

      {/* Row 2: Categories Scroller */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => setFilter((prev) => ({ ...prev, category: cat.id }))}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter.category === cat.id
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Row 3: Quick Zone chips and Inspected Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <span className="flex items-center gap-1 text-slate-500 font-bold shrink-0 text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span>اختر الناحية سريعاً:</span>
          </span>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {ZONES.map((zone) => {
              const isSelected = currentZone === zone.id;
              return (
                <button
                  type="button"
                  key={zone.id}
                  onClick={() => setFilter((prev) => ({ ...prev, zone: zone.id }))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {zone.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inspected Only Filter & Result Counter */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(filter.inspectedOnly)}
            onClick={() => setFilter((prev) => ({ ...prev, inspectedOnly: !prev.inspectedOnly }))}
            className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              filter.inspectedOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="تصفية لعرض المركبات المفحوصة بكراج معتمد فقط"
          >
            <ShieldCheck
              className={`w-4 h-4 transition-colors ${
                filter.inspectedOnly ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
              }`}
            />
            <span>المفحوصة فقط</span>

            {/* Visual toggle switch pill */}
            <span
              dir="ltr"
              className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                filter.inspectedOnly ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition-transform ${
                  filter.inspectedOnly ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </span>
          </button>

          <div className="text-slate-500 text-xs font-semibold">
            <span className="text-slate-900 font-bold">{totalMatchesCount}</span> إعلان متاح
            {promotedCount > 0 && (
              <span className="mr-1.5 text-amber-700 font-bold">({promotedCount} مروّج)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
