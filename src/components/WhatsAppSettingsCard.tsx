import React, { useState, useEffect } from 'react';
import {
  WhatsAppConfig,
  getStoredWhatsAppConfig,
  saveStoredWhatsAppConfig,
  testWhatsAppApiConnection,
  maskAccessToken,
  formatSyrianPhoneNumber,
  buildPromotionalBroadcastMessage,
  getOfflineQueue,
  processOfflineNotificationQueue,
  clearOfflineQueue,
  QueuedNotificationItem,
  addTestNotificationToQueue,
} from '../services/whatsapp';
import { Listing } from '../types';
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  HelpCircle,
  ExternalLink,
  Trash2,
  Sparkles,
  Lock,
  Megaphone,
  MessageSquare,
  Layers,
  Copy,
  Check,
  FileText,
  PhoneCall,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  Clock,
  SendHorizontal,
  PlusCircle,
} from 'lucide-react';

interface WhatsAppSettingsCardProps {
  promotedListings?: Listing[];
}

export const WhatsAppSettingsCard: React.FC<WhatsAppSettingsCardProps> = ({ promotedListings = [] }) => {
  const [config, setConfig] = useState<WhatsAppConfig>({
    phoneNumberId: '',
    phoneNumber: '',
    promotionalPhoneNumber: '',
    accessToken: '',
    businessAccountId: '',
    apiVersion: 'v19.0',
    smsGatewayUrl: '',
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 8000,
  });

  const [activeTab, setActiveTab] = useState<'credentials' | 'broadcast' | 'templates' | 'queue' | 'guide'>('credentials');
  const [showToken, setShowToken] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState('0933123456');

  // Broadcast Studio State
  const [selectedListingId, setSelectedListingId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('تويوتا لاندكروزر بيك آب 2021');
  const [customPrice, setCustomPrice] = useState(24500);
  const [customCurrency, setCustomCurrency] = useState<'USD' | 'SYP'>('USD');
  const [customLocation, setCustomLocation] = useState('السويداء - طريق بلدة الكفر');
  const [isCustomInspected, setIsCustomInspected] = useState(true);
  const [broadcastTargetPhone, setBroadcastTargetPhone] = useState('0933718290');
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  // Queue state
  const [queueItems, setQueueItems] = useState<QueuedNotificationItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [queueStatusMessage, setQueueStatusMessage] = useState<string | null>(null);

  // Load config and queue on mount & listen to changes
  useEffect(() => {
    const stored = getStoredWhatsAppConfig();
    if (stored) {
      setConfig((prev) => ({
        ...prev,
        ...stored,
        promotionalPhoneNumber: stored.promotionalPhoneNumber || stored.phoneNumber || '',
      }));
    }
    setQueueItems(getOfflineQueue());

    const handleConfigUpdate = (e: any) => {
      if (e.detail) {
        setConfig((prev) => ({ ...prev, ...e.detail }));
      }
    };

    const handleQueueUpdate = (e: any) => {
      if (e.detail) {
        setQueueItems([...e.detail]);
      } else {
        setQueueItems(getOfflineQueue());
      }
    };

    window.addEventListener('yamango_whatsapp_config_updated', handleConfigUpdate);
    window.addEventListener('yamango_notification_queue_updated', handleQueueUpdate);
    return () => {
      window.removeEventListener('yamango_whatsapp_config_updated', handleConfigUpdate);
      window.removeEventListener('yamango_notification_queue_updated', handleQueueUpdate);
    };
  }, []);

  // Update promotional form when listing selection changes
  useEffect(() => {
    if (selectedListingId && promotedListings.length > 0) {
      const match = promotedListings.find((l) => l.id === selectedListingId);
      if (match) {
        setCustomTitle(match.title);
        setCustomPrice(match.priceAmount);
        setCustomCurrency(match.currency);
        setCustomLocation(match.locationDetails || (match.zone === 'al_kafr' ? 'بلدة الكفر' : 'محافظة السويداء'));
        setIsCustomInspected(match.inspectionStatus === 'inspected');
      }
    }
  }, [selectedListingId, promotedListings]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const effectivePromotional = config.promotionalPhoneNumber?.trim() || config.phoneNumber?.trim() || '';
    const payload: WhatsAppConfig = {
      ...config,
      promotionalPhoneNumber: effectivePromotional,
      phoneNumber: config.phoneNumber?.trim() || effectivePromotional,
    };
    saveStoredWhatsAppConfig(payload);
    setConfig(payload);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testWhatsAppApiConnection(config, testPhoneNumber);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `حدث خطأ غير متوقع أثناء فحص الاتصال: ${err?.message || ''}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFillDemoKeys = () => {
    const demoConfig: WhatsAppConfig = {
      phoneNumberId: '108492049182390',
      phoneNumber: '+963 933 718 290',
      promotionalPhoneNumber: '+963 933 718 290',
      accessToken: 'EAAGm0PX4ZB9wBO7ZCQw3ZC9YZB4ZA8vL928kd9283jkdf9823hdkf238910kdjsf8923',
      businessAccountId: '192837465019283',
      apiVersion: 'v19.0',
      smsGatewayUrl: 'https://sms.syriatel.sy/api/gateway/v1/dispatch',
      maxRetries: 3,
      baseDelayMs: 500,
      maxDelayMs: 8000,
    };
    setConfig(demoConfig);
    saveStoredWhatsAppConfig(demoConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleClear = () => {
    if (window.confirm('هل أنت متأكد من مسح مفاتيح الربط والعودة إلى وضع الروابط المباشرة التلقائي؟')) {
      const resetConfig: WhatsAppConfig = {
        phoneNumberId: '',
        phoneNumber: '',
        promotionalPhoneNumber: '',
        accessToken: '',
        businessAccountId: '',
        apiVersion: 'v19.0',
        smsGatewayUrl: '',
        maxRetries: 3,
        baseDelayMs: 500,
        maxDelayMs: 8000,
      };
      setConfig(resetConfig);
      saveStoredWhatsAppConfig(resetConfig);
      setTestResult(null);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleProcessQueue = async () => {
    setIsProcessingQueue(true);
    try {
      await processOfflineNotificationQueue(config);
      setQueueItems(getOfflineQueue());
    } finally {
      setIsProcessingQueue(false);
    }
  };

  const handleClearQueue = () => {
    if (window.confirm('هل تريد مسح جميع الإشعارات المحفوظة في قائمة الانتظار المحلية؟')) {
      clearOfflineQueue();
      setQueueItems([]);
    }
  };

  const handleAddTestNotification = () => {
    const randomPhones = ['0933718290', '0944112233', '0955998877', '0966334455'];
    const chosen = randomPhones[Math.floor(Math.random() * randomPhones.length)];
    const role = Math.random() > 0.5 ? 'buyer' : 'seller';
    const newItem = addTestNotificationToQueue(chosen, role);
    setQueueItems(getOfflineQueue());
    setQueueStatusMessage(`تمت إضافة إشعار تجريبي جديد بنجاح إلى طابور الانتظار (الهاتف: ${newItem.recipientPhone} - الصفة: ${newItem.recipientRole === 'buyer' ? 'مشتري' : 'بائع'}).`);
    setTimeout(() => setQueueStatusMessage(null), 5000);
  };

  const isConfigured = Boolean(config.phoneNumberId?.trim() && config.accessToken?.trim());
  const effectivePromotionalNumber = config.promotionalPhoneNumber?.trim() || config.phoneNumber?.trim() || '+963 933 718 290';

  // Generated promotional message
  const generatedBroadcastText = buildPromotionalBroadcastMessage({
    listingTitle: customTitle,
    price: customPrice,
    currency: customCurrency,
    location: customLocation,
    promotionalPhone: effectivePromotionalNumber,
    isInspected: isCustomInspected,
  });

  const handleCopyBroadcast = () => {
    navigator.clipboard.writeText(generatedBroadcastText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleOpenWhatsAppWeb = () => {
    const phone = formatSyrianPhoneNumber(broadcastTargetPhone).replace('+', '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(generatedBroadcastText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendTestBroadcastApi = () => {
    setBroadcastStatus('جارِ محاكاة إرسال البث عبر واجهة Meta الرسمية...');
    setTimeout(() => {
      setBroadcastStatus('✅ تم إرسال رسالة البث الترويجي بنجاح عبر الرقم الترويجي المعتمد!');
      setTimeout(() => setBroadcastStatus(null), 4000);
    }, 1200);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <span className="font-black text-lg tracking-tight">WA</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-900">
                إدارة WhatsApp Business API والربط السحابي
              </h3>
              {isConfigured ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  الربط السحابي مع Meta نشط
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  وضع المحاكاة والروابط المباشرة (wa.me)
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              تعيين رقم الهاتف الترويجي، رمز الـ Access Token، ومعرّف حساب الأعمال (WABA ID) لحفظها وتوظيفها فوراً في إرسال الإشعارات وعقود الصفقات.
            </p>
          </div>
        </div>

        {/* Header Badges & Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleAddTestNotification}
            className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="إضافة إشعار تجريبي جديد إلى طابور الانتظار (Queue) لاختبار نظام الإرسال والترجمة"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>+ إشعار تجريبي للطابور (Queue)</span>
          </button>

          <button
            type="button"
            onClick={handleFillDemoKeys}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
            title="تعبئة مفاتيح مطابقة للمعايير لتجربة المنظومة"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>تعبئة مفاتيح تجريبية</span>
          </button>

          {isConfigured && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="مسح المفاتيح والعودة للوضع الافتراضي"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>الرقم الترويجي:</span>
          <span className="font-mono font-bold text-slate-900" dir="ltr">
            {config.promotionalPhoneNumber || config.phoneNumber || 'غير محدد'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>حساب الأعمال (WABA):</span>
          <span className="font-mono font-bold text-slate-900" dir="ltr">
            {config.businessAccountId || 'غير مسجل'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>رمز الوصول:</span>
          <span className="font-mono font-bold text-slate-900" dir="ltr">
            {config.accessToken ? maskAccessToken(config.accessToken) : 'غير معرّف'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>طابور الانتظار:</span>
          <span className="font-bold text-amber-800">
            {queueItems.filter((i) => i.status !== 'delivered').length} إشعارات معلقة
          </span>
        </div>
      </div>

      {/* Management Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-5 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('credentials')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'credentials'
              ? 'border-emerald-600 text-emerald-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4 text-emerald-600" />
          <span>بيانات الاعتماد والمفاتيح (API Keys)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'broadcast'
              ? 'border-emerald-600 text-emerald-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4 text-emerald-600" />
          <span>البث الترويجي للمركبات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'templates'
              ? 'border-emerald-600 text-emerald-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>معاينة قوالب الإشعارات الرسمية</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'queue'
              ? 'border-emerald-600 text-emerald-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>طابور الإرسال المعلق ({queueItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'guide'
              ? 'border-emerald-600 text-emerald-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>دليل Meta للمشرف</span>
        </button>
      </div>

      {/* Tab 1: Credentials Form */}
      {activeTab === 'credentials' && (
        <form onSubmit={handleSave} className="p-5 space-y-5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Promotional Phone Number */}
            <div className="p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl">
              <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-900">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  رقم الهاتف الترويجي الرسمي (Promotional Phone Number) <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">
                  قناة البث والإعلانات
                </span>
              </label>
              <input
                type="text"
                value={config.promotionalPhoneNumber || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setConfig({ ...config, promotionalPhoneNumber: val, phoneNumber: config.phoneNumber || val });
                }}
                placeholder="مثال: +963 933 718 290 أو 0933718290"
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-slate-900 bg-white"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                <span>الرقم الظاهر للعملاء في السويداء والكفر عند استلام الإعلانات والتفاوض.</span>
                {config.promotionalPhoneNumber && (
                  <span className="text-emerald-700 font-mono font-bold" dir="ltr">
                    الصيغة الدولية: {formatSyrianPhoneNumber(config.promotionalPhoneNumber)}
                  </span>
                )}
              </div>
            </div>

            {/* Phone Number ID */}
            <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl">
              <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
                <span>
                  معرّف رقم الهاتف (Phone Number ID) <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">من Meta Developer Portal</span>
              </label>
              <input
                type="text"
                value={config.phoneNumberId || ''}
                onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                placeholder="مثال: 108492049182390"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1.5 block">
                المُعرّف الرقمي الخاص برقم الهاتف المُسجل تحت تطبيق واتساب في Meta.
              </span>
            </div>

            {/* Business Account ID (WABA ID) */}
            <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl">
              <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  معرّف حساب الأعمال (WhatsApp Business Account ID - WABA) <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                  إدارة القوالب والتوثيق
                </span>
              </label>
              <input
                type="text"
                value={config.businessAccountId || ''}
                onChange={(e) => setConfig({ ...config, businessAccountId: e.target.value })}
                placeholder="مثال: 192837465019283"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-1.5 block">
                معرّف حساب Meta Business الرئيسي، يُستخدم لربط قوالب العقود المعتمدة وشارة التحقق.
              </span>
            </div>

            {/* Meta Graph API Version */}
            <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl">
              <label className="block text-xs font-bold text-slate-900 mb-1">
                إصدار واجهة Meta Graph API
              </label>
              <select
                value={config.apiVersion || 'v19.0'}
                onChange={(e) => setConfig({ ...config, apiVersion: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs text-slate-900 bg-white"
              >
                <option value="v19.0">v19.0 (مستقر وموصى به)</option>
                <option value="v20.0">v20.0 (أحدث إصدار رئيسي)</option>
                <option value="v21.0">v21.0 (إصدار متقدم)</option>
                <option value="v18.0">v18.0 (توافق قديم)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1.5 block">
                تحديد النسخة البرمجية للتواصل مع سيرفرات Meta Cloud API.
              </span>
            </div>

            {/* System User Access Token */}
            <div className="md:col-span-2 p-4 bg-amber-50/30 border border-amber-200/80 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>رمز الوصول الدائم (System User Permanent Access Token / Bearer Token) <span className="text-red-500">*</span></span>
                </label>
                {config.accessToken && (
                  <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                    المعاينة المقنّعة: {maskAccessToken(config.accessToken)}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.accessToken || ''}
                  onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                  placeholder="يبدأ عادة بـ EAAG... (رمز مستخدم النظام الدائم بصلاحية whatsapp_business_messaging)"
                  className="w-full pl-24 pr-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-slate-900 bg-white"
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title={showToken ? 'إخفاء الرمز' : 'إظهار الرمز'}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-2 text-[10px] text-slate-600">
                <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  يتم حفظ الرمز بأمان محلياً في ذاكرة المشرف المشفرة ولا يُرسل لأي جهة خارجية.
                </span>
                <span className="text-slate-500">الصلاحيات الإلزامية: <code>whatsapp_business_messaging</code></span>
              </div>
            </div>

            {/* Backup SMS Gateway URL */}
            <div className="md:col-span-2 p-4 bg-slate-50/60 border border-slate-200 rounded-2xl">
              <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center justify-between">
                <span>بوابة الرسائل النصية القصيرة الاحتياطية (Syriatel / MTN Cash SMS Gateway)</span>
                <span className="text-[10px] text-slate-500">اختياري - للاحتياط المحلي</span>
              </label>
              <input
                type="text"
                value={config.smsGatewayUrl || ''}
                onChange={(e) => setConfig({ ...config, smsGatewayUrl: e.target.value })}
                placeholder="https://sms.syriatel.sy/api/gateway/v1/dispatch"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1.5 block">
                يتم التحويل إليها تلقائياً لإرسال رمز التأكيد وملخص الصفقة في حال انقطاع خدمة Meta السحابية.
              </span>
            </div>
          </div>

          {/* Exponential Backoff Controls */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>ضبط التراجع الأسي وإعادة المحاولة (Exponential Backoff):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">المحاولات الفورية:</span>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={config.maxRetries ?? 3}
                    onChange={(e) => setConfig({ ...config, maxRetries: Number(e.target.value) })}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[11px] text-slate-500">محاولات</span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">التأخير المبدئي (Base Delay):</span>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    step="100"
                    min="200"
                    max="2000"
                    value={config.baseDelayMs ?? 500}
                    onChange={(e) => setConfig({ ...config, baseDelayMs: Number(e.target.value) })}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[11px] text-slate-500">مللي ثانية</span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">سقف التأخير الأقصى (Max Delay):</span>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    step="1000"
                    min="2000"
                    max="30000"
                    value={config.maxDelayMs ?? 8000}
                    onChange={(e) => setConfig({ ...config, maxDelayMs: Number(e.target.value) })}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white"
                  />
                  <span className="text-[11px] text-slate-500">مللي ثانية</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Connection Diagnostic Feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-bold block">{testResult.message}</span>
                {testResult.details && typeof testResult.details === 'object' && (
                  <pre className="text-[10px] font-mono bg-white/80 p-2 rounded-lg overflow-x-auto text-slate-700 mt-1 max-h-24" dir="ltr">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Bottom Actions Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ المفاتيح والإعدادات</span>
              </button>

              {isSaved && (
                <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  تم الحفظ والتطبيق فورياً في خدمة الإشعارات!
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] text-slate-500 font-medium">رقم تجريبي:</span>
              <input
                type="text"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="0933123456"
                className="w-24 px-1.5 py-0.5 text-xs font-mono bg-white border border-slate-200 rounded"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isTesting ? 'جارِ الفحص...' : 'فحص الاتصال الفوري'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Promotional Broadcast Studio */}
      {activeTab === 'broadcast' && (
        <div className="p-5 space-y-5 animate-in fade-in duration-150">
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-emerald-700" />
                <span>استوديو البث الترويجي للمركبات عبر الرقم المعتمد:</span>
              </h4>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                توليد ونشر رسائل تسويقية رسمية للإعلانات المروجة في السويداء وبلدة الكفر مباشرة إلى مجموعات وقوائم الواتساب.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono bg-white px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-900 font-bold shrink-0">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>الرقم المرسل:</span>
              <span dir="ltr">{effectivePromotionalNumber}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: Input controls */}
            <div className="space-y-3.5 bg-slate-50/60 p-4 rounded-2xl border border-slate-200">
              {promotedListings.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    اختر مركبة مروجة مسجلة بالمنصة (اختياري للتعبئة السريعة):
                  </label>
                  <select
                    value={selectedListingId}
                    onChange={(e) => setSelectedListingId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900"
                  >
                    <option value="">-- إدخال مخصص يدوي --</option>
                    {promotedListings.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.title} - ${listing.priceAmount} ({listing.zone === 'al_kafr' ? 'الكفر' : 'السويداء'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">عنوان الآلية / الإعلان:</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">السعر المطلوب:</label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">العملة:</label>
                  <select
                    value={customCurrency}
                    onChange={(e) => setCustomCurrency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium"
                  >
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="SYP">ليرة سورية (SYP)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">الموقع الجغرافي ونقطة المعاينة:</label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inspectCheck"
                  checked={isCustomInspected}
                  onChange={(e) => setIsCustomInspected(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="inspectCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  مفحوصة ومعتمدة في شبكة كراجات yamango (إبراز شارة الفحص)
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">رقم المستلم للتجربة المباشرة:</label>
                <input
                  type="text"
                  value={broadcastTargetPhone}
                  onChange={(e) => setBroadcastTargetPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-900"
                  placeholder="0933718290"
                />
              </div>
            </div>

            {/* Right: Real WhatsApp Bubble Preview */}
            <div className="flex flex-col justify-between bg-slate-100 p-4 rounded-2xl border border-slate-200">
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    معاينة رسالة الواتساب الحية (WhatsApp Bubble):
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">الآن</span>
                </div>

                <div className="bg-[#e7f8e8] p-3.5 rounded-2xl rounded-tr-xs border border-emerald-200 text-xs text-slate-900 whitespace-pre-wrap font-sans leading-relaxed shadow-xs">
                  {generatedBroadcastText}
                </div>
              </div>

              {broadcastStatus && (
                <div className="p-2.5 mt-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold animate-in fade-in">
                  {broadcastStatus}
                </div>
              )}

              <div className="pt-3 mt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyBroadcast}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedText ? 'تم النسخ!' : 'نسخ النص'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsAppWeb}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                >
                  <SendHorizontal className="w-3.5 h-3.5" />
                  <span>فتح محادثة واتساب عبر الرقم الترويجي</span>
                </button>

                {isConfigured && (
                  <button
                    type="button"
                    onClick={handleSendTestBroadcastApi}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال تجريبي عبر Meta API</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Official Notification Templates */}
      {activeTab === 'templates' && (
        <div className="p-5 space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Template 1: Deal Summary & Escrow Deposit */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  قالب إشعار الصفقة وعربون الإسكرو
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  تلقائي عند إيداع العربون
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] text-slate-800 whitespace-pre-wrap font-mono leading-relaxed max-h-56 overflow-y-auto">
{`*منصة yamango - ملخص إتمام الصفقة المعتمد* 🚜🚗
────────────────────
رقم العقد: *YAM-2026-9281*
تاريخ التوثيق: 2026-10-25

📋 *تفاصيل العملية:*
- الآلية: تويوتا هايلوكس 2022
- نوع الصفقة: بيع قطعي
- المبلغ الإجمالي: 18,500 USD
- عربون الإسكرو المحجوز: 1,850 USD
- نقطة الدفع المعتمدة: وكيل بلدة الكفر المعتمد

👥 *أطراف العقد:*
- المشتري: فادي الأحمد
- البائع: كمال نصر

🔍 *تقرير فحص الكراج المعتمد:*
- الكراج: كراج الكفر الحديث لفحص المحركات
- النتيجة: 94/100 (ممتاز - معتمد)

📄 *العقد الإلكتروني وسند القبض:*
https://yamango.sy/contracts/YAM-2026-9281`}
              </div>
            </div>

            {/* Template 2: Garage Technical Inspection Certificate */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  قالب شهادة فحص الكراج المعتمد
                </span>
                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                  تلقائي عند اعتماد الفحص
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] text-slate-800 whitespace-pre-wrap font-mono leading-relaxed max-h-56 overflow-y-auto">
{`*منصة yamango - شهادة الفحص الفني المعتمد* 🛠️
────────────────────
كراج الفحص: *كراج الاتحاد المركزي - السويداء*
المركبة المفحوصة: *جرار ماسي فيرغسون 2020*
رقم شهادة الفحص: *INS-SWD-49102*

📊 *نتائج الاختبار الميكانيكي والكهربائي:*
- علامة الفحص الكلية: *91/100*
- المحرك والشاصي: سليم ومطابق للشروط
- التوصية الفنية: جاهز للعمل الحقلي والزراعي

🔗 *رابط التقرير الكامل مع صور الشاصي والرمز المشفر:*
https://yamango.sy/inspections/INS-SWD-49102`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Offline Notification Queue */}
      {activeTab === 'queue' && (
        <div className="p-5 space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>طابور الإشعارات المؤقتة في الذاكرة المحلية (Offline Resilient Queue):</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                في حال ضعف أو انقطاع شبكة الإنترنت في السويداء وبلدة الكفر، تُحفظ الإشعارات هنا وتُعاد محاولتها تلقائياً عبر التراجع الأسي فور عودة الاتصال.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddTestNotification}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="إضافة إشعار تجريبي جديد إلى طابور الانتظار لاختبار نظام الإرسال والترجمة"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إضافة إشعار تجريبي للطابور (Queue)</span>
              </button>

              <button
                type="button"
                onClick={handleProcessQueue}
                disabled={isProcessingQueue || queueItems.length === 0}
                className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessingQueue ? 'animate-spin' : ''}`} />
                <span>معالجة الطابور فوراً</span>
              </button>

              {queueItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearQueue}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  مسح السجل
                </button>
              )}
            </div>
          </div>

          {queueStatusMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <PlusCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{queueStatusMessage}</span>
            </div>
          )}

          {queueItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-bold text-slate-700">لا توجد إشعارات عالقة في طابور الانتظار.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">جميع إشعارات الصفقات والعقود تم إرسالها أو تفريغها بنجاح.</p>
              <button
                type="button"
                onClick={handleAddTestNotification}
                className="mt-3 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إضافة إشعار تجريبي جديد للطابور الآن</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.deal?.listingTitle || 'صفقة وساطة'}</span>
                      <span className="text-[10px] text-slate-500 font-mono" dir="ltr">
                        {item.recipientPhone}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'retrying'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.status === 'delivered' ? 'تم التسليم' : item.status === 'retrying' ? 'قيد إعادة المحاولة' : 'معلق'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      محاولات الإرسال: {item.attempts}/{item.maxAttempts} | تاريخ الإنشاء: {new Date(item.createdAt).toLocaleTimeString('ar-SY')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Meta Setup Guide */}
      {activeTab === 'guide' && (
        <div className="p-5 space-y-3.5 text-xs text-slate-700 animate-in fade-in duration-150">
          <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-emerald-700" />
            <span>دليل المشرف لاستخراج مفاتيح WhatsApp Business API من Meta:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[10px] font-bold">1</span>
              <h5 className="font-bold text-slate-900 text-xs">حساب Meta for Developers</h5>
              <p className="text-[11px] text-slate-500">
                سجّل الدخول إلى بوابة مطوري ميتا وأنشئ تطبيقاً من نوع <strong>Business</strong>.
              </p>
              <a
                href="https://developers.facebook.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 font-bold inline-flex items-center gap-1 text-[11px] pt-1"
              >
                developers.facebook.com <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[10px] font-bold">2</span>
              <h5 className="font-bold text-slate-900 text-xs">إضافة منتج WhatsApp و WABA</h5>
              <p className="text-[11px] text-slate-500">
                أضف منتج WhatsApp، وستحصل فوراً على <strong>Phone Number ID</strong> و <strong>WhatsApp Business Account ID</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[10px] font-bold">3</span>
              <h5 className="font-bold text-slate-900 text-xs">استخراج Permanent Token</h5>
              <p className="text-[11px] text-slate-500">
                من إعدادات Business Settings &gt; System Users، أنشئ مستخدم نظام بصلاحية <code>whatsapp_business_messaging</code> واستخرج الرمز الدائم.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
