import React from 'react';
import { ShoppingBag, Package, Wrench, ShieldCheck, Building, LayoutDashboard } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'listings' | 'used_goods' | 'garages' | 'deals' | 'agents' | 'admin';
  setActiveTab: (tab: 'listings' | 'used_goods' | 'garages' | 'deals' | 'agents' | 'admin') => void;
  dealsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  dealsCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-bottom">
      <div className="grid grid-cols-6 items-center h-16 max-w-lg mx-auto">
        <button
          onClick={() => setActiveTab('listings')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[40px] py-1 transition-colors ${
            activeTab === 'listings' ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[9px] tracking-tight mt-1 whitespace-nowrap">الآليات</span>
        </button>

        <button
          onClick={() => setActiveTab('used_goods')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[40px] py-1 transition-colors relative ${
            activeTab === 'used_goods' ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[9px] tracking-tight mt-1 whitespace-nowrap">المستعمل</span>
          <span className="absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-amber-500" />
        </button>

        <button
          onClick={() => setActiveTab('garages')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-colors ${
            activeTab === 'garages' ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">الكراجات</span>
        </button>

        <button
          onClick={() => setActiveTab('deals')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-colors relative ${
            activeTab === 'deals' ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">الصفقات</span>
          {dealsCount > 0 && (
            <span className="absolute top-1 right-3 w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center">
              {dealsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-colors ${
            activeTab === 'agents' ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">الوكلاء</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-colors ${
            activeTab === 'admin' ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">الإدارة</span>
        </button>
      </div>
    </nav>
  );
};
