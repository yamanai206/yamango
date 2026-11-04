import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { 
  Menu, 
  X, 
  ShieldCheck, 
  Database, 
  Plus, 
  RefreshCw, 
  HelpCircle, 
  Languages, 
  ShoppingBag, 
  Wrench, 
  Building, 
  LayoutDashboard, 
  Check, 
  MapPin, 
  SlidersHorizontal,
  Layers,
  UserCheck,
  BellRing,
  Package,
  LogOut
} from 'lucide-react';

interface TopBarProps {
  currentUser: User;
  activeRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  activeTab: 'listings' | 'used_goods' | 'garages' | 'deals' | 'agents' | 'admin';
  setActiveTab: (tab: 'listings' | 'used_goods' | 'garages' | 'deals' | 'agents' | 'admin') => void;
  onOpenNewListing: () => void;
  onOpenSqlModal: () => void;
  onResetData: () => void;
  onOpenHelpCenter?: () => void;
  onOpenPushModal?: () => void;
  onLogout: () => void;
  language?: 'ar' | 'en';
  onToggleLanguage?: () => void;
}

interface NavItemConfig {
  id: 'listings' | 'used_goods' | 'garages' | 'deals' | 'agents' | 'admin';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'listings', title: 'سوق المركبات والآليات', subtitle: 'تصفح وشراء وتأجير الجرارات والحفارات والشاحنات والسيارات', icon: ShoppingBag, tag: 'السوق الرئيسي' },
  { id: 'used_goods', title: 'سوق المستعمل والأجهزة والأثاث', subtitle: 'أدوات منزلية، أثاث، إلكترونيات، طاقة شمسية، ودفع عبر الوكلاء بالضمان', icon: Package, tag: 'سوق المستعمل' },
  { id: 'garages', title: 'الكراجات المعتمدة والفحص الفني', subtitle: 'حجز مواعيد المعاينة الميدانية وتقارير السلامة ومطابقة المواصفات', icon: Wrench, tag: 'فحص معتمد' },
  { id: 'deals', title: 'الصفقات والوساطة المالية (الإسكرو)', subtitle: 'متابعة العقود الرقمية، حجز العربون، ورموز التحقق السرية OTP', icon: ShieldCheck, tag: 'حماية إسكرو' },
  { id: 'agents', title: 'وكلاء الدفع المعتمدون', subtitle: 'نقاط تسليم واستلام الكاش المعتمدة في الكفر والسويداء وصلخد', icon: Building, tag: 'نقاط الكاش' },
  { id: 'admin', title: 'لوحة تحكم المشرف العام', subtitle: 'مراقبة الصفقات، نمو المبيعات، المخططات البيانية، وضبط العملات', icon: LayoutDashboard, tag: 'الإدارة العليا' },
];

const ROLES_CONFIG: { role: UserRole; title: string; desc: string; badge: string; }[] = [
  { role: 'buyer', title: 'مشتري / مستأجر', desc: 'تصفح الآليات، تقديم العروض، إيداع العربون، وحجز الفحص', badge: 'طلب وشراء' },
  { role: 'seller', title: 'بائع / مؤجّر', desc: 'إضافة الإعلانات، إدارة الأسعار وتتبع العروض وتوقيع العقود', badge: 'عرض وبيع' },
  { role: 'garage', title: 'كراج فني معتمد', desc: 'إصدار تقارير الفحص الفني وتوثيق حالة المحرك والشاسيه', badge: 'فحص ميكانيكي' },
  { role: 'agent', title: 'وكيل دفع (إسكرو)', desc: 'تأكيد استلام العربون بالكاش وفتح رموز التحقق OTP وإصدار الإيصالات', badge: 'وساطة كاش' },
  { role: 'admin', title: 'مشرف المنصة العام', desc: 'إدارة شاملة لكافة الصفقات، إشغال الكراجات، العمولات وأسعار الصرف', badge: 'إشراف كامل' },
];

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  activeRole,
  onSwitchRole,
  activeTab,
  setActiveTab,
  onOpenNewListing,
  onOpenSqlModal,
  onResetData,
  onOpenHelpCenter,
  onOpenPushModal,
  onLogout,
  language = 'ar',
  onToggleLanguage,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    if (isMenuOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // --- Role-Based Access Control (RBAC) ---
  const isAdmin = currentUser.roles.includes('admin');
  
  const allowedNavItems = NAV_ITEMS.filter(item => {
    if (isAdmin) return true;
    if (currentUser.roles.includes('buyer') && ['listings', 'used_goods', 'garages', 'deals'].includes(item.id)) return true;
    if ((currentUser.roles.includes('seller') || currentUser.roles.includes('lessor')) && ['listings', 'used_goods', 'deals'].includes(item.id)) return true;
    if (currentUser.roles.includes('garage') && ['garages', 'deals'].includes(item.id)) return true;
    if (currentUser.roles.includes('agent') && ['agents', 'deals'].includes(item.id)) return true;
    return false;
  });

  const handleSelectTab = (tabId: 'listings' | 'used_goods' | 'garages' | 'deals' | 'agents' | 'admin') => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Top Corner: Menu Launcher & Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="relative group flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-white border border-slate-700/80 shadow-xs transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-slate-950 transition-colors">
                  <Menu className="w-4 h-4 transition-transform group-hover:scale-110" />
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-black block leading-tight text-white group-hover:text-orange-300 transition-colors">قائمة الخيارات</span>
                  <span className="text-[10px] text-slate-400 block font-normal leading-tight">أقسام المنصة والأدوار</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              <button onClick={() => handleSelectTab('listings')} className="flex items-center gap-2.5 text-right group focus:outline-none cursor-pointer">
                <img src="/icon-192.png" alt="yamango" className="w-9 h-9 rounded-xl shadow-sm shadow-orange-500/30 group-hover:scale-105 transition-transform object-contain" />
                <div className="leading-tight hidden xs:block">
                  <span className="text-lg font-black tracking-tight text-white group-hover:text-orange-400 transition-colors">yamango</span>
                  <span className="text-[10px] text-slate-400 font-medium block">السويداء · الكفر</span>
                </div>
              </button>
            </div>

            {/* Center: Desktop Navigation Hub (Filtered by RBAC) */}
            <div className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
              {allowedNavItems.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === item.id ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span>{item.title.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Left Corner: Quick Actions */}
            <div className="flex items-center gap-2">
              <button onClick={onOpenNewListing} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-orange-500 hover:bg-orange-400 rounded-xl transition-all shadow-sm shadow-orange-500/20 whitespace-nowrap cursor-pointer">
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">أضف إعلانك</span>
              </button>

              {onOpenPushModal && (
                <button onClick={onOpenPushModal} className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer" title="تنبيهات المتصفح">
                  <BellRing className="w-3.5 h-3.5 text-orange-400" />
                </button>
              )}

              {onToggleLanguage && (
                <button onClick={onToggleLanguage} className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer">
                  <Languages className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px] font-black">{language === 'ar' ? 'EN' : 'عربي'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من تسجيل الخروج من الحساب؟')) onLogout();
                }}
                className="flex items-center justify-center p-2 text-rose-400 hover:text-white bg-slate-800 hover:bg-rose-600 border border-slate-700 hover:border-rose-500 rounded-xl transition-colors cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Menu / Options Hub Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 sm:pl-16">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200 ease-out text-slate-900">
              
              <div className="p-5 bg-gradient-to-l from-slate-900 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <img src="/icon-192.png" alt="yamango" className="w-11 h-11 rounded-xl shadow-md shadow-orange-500/20 object-contain" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black tracking-tight text-white">yamango</span>
                      <span className="text-[10px] bg-orange-500/20 text-orange-300 font-bold px-2 py-0.5 rounded-full border border-orange-500/30">منصة معتمدة</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">محافظة السويداء · مركز الانطلاق: بلدة الكفر</p>
                  </div>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-emerald-600" />الحساب النشط</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">موثق</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{currentUser.fullName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{currentUser.phone || 'لا يوجد هاتف مسجل'}</p>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold block">{currentUser.roles[0]}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5"><SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" />أقسام المنصة المسموح بها</h3>
                    <span className="text-[10px] text-slate-400 font-bold">{allowedNavItems.length} أقسام</span>
                  </div>
                  <div className="space-y-2">
                    {allowedNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button key={item.id} onClick={() => handleSelectTab(item.id)} className={`w-full text-right p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${isActive ? 'bg-orange-500/10 border-orange-400 shadow-xs' : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                          <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'}`}><Icon className="w-4 h-4" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-xs font-black truncate ${isActive ? 'text-orange-950 font-bold' : 'text-slate-900'}`}>{item.title}</span>
                              {isActive && <span className="text-[10px] bg-orange-600 text-white font-black px-2 py-0.5 rounded-md shrink-0">القسم الحالي</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{item.subtitle}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-slate-700" />أدوات مساعدة وإعدادات</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {onOpenHelpCenter && (
                      <button onClick={() => { onOpenHelpCenter(); setIsMenuOpen(false); }} className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-right transition-colors cursor-pointer flex flex-col justify-between">
                        <HelpCircle className="w-4 h-4 text-orange-600 mb-1" />
                        <div><span className="font-bold text-slate-900 block">مركز المساعدة</span><span className="text-[10px] text-slate-500 block">دليل الاستخدام</span></div>
                      </button>
                    )}
                    <button onClick={() => { onOpenSqlModal(); setIsMenuOpen(false); }} className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-right transition-colors cursor-pointer flex flex-col justify-between">
                      <Database className="w-4 h-4 text-blue-600 mb-1" />
                      <div><span className="font-bold text-slate-900 block">مخطط SQL DDL</span><span className="text-[10px] text-slate-500 block">الجداول</span></div>
                    </button>
                  </div>
                </div>

              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-[11px]"><MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" /><span>السويداء · الكفر · صلخد</span></span>
                <button onClick={() => setIsMenuOpen(false)} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer text-[11px]">إغلاق</button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};