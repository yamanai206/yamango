import React, { useState, useEffect } from 'react';
import { GarageProfile, User, ZoneLocation } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Wrench, Plus, Search, MapPin, 
  CheckCircle2, XCircle, Loader2, Link as LinkIcon, User as UserIcon,
  Trash2 
} from 'lucide-react';

interface AdminGarageManagerProps {
  garages: GarageProfile[];
  onRefresh?: () => void; // جعلناها اختيارية لتجنب الانهيار
}

export const AdminGarageManager: React.FC<AdminGarageManagerProps> = ({ garages, onRefresh }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [name, setName] = useState('');
  const [zone, setZone] = useState<ZoneLocation>('al_kafr');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [feeSyp, setFeeSyp] = useState(180000);
  const [feeUsd, setFeeUsd] = useState(15);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setUsers(data as any);
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.from('garages').insert([{
        business_name: name,
        zone: zone,
        address: address,
        phone: phone,
        inspection_fee_syp: feeSyp,
        inspection_fee_usd: feeUsd,
        user_id: selectedUserId || null,
        is_verified: true,
        subscription_active: true,
        rating_avg: 5.0,
        reviews_count: 0,
        completed_inspections_count: 0,
        specialties: ['فحص شامل', 'محرك وجير']
      }]);

      if (error) throw error;
      
      setIsModalOpen(false);
      if (onRefresh) onRefresh(); else window.location.reload();
      
      setName(''); setAddress(''); setPhone(''); setSelectedUserId('');
      
    } catch (error: any) {
      alert("حدث خطأ أثناء إضافة الكراج: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVerify = async (garageId: string, currentStatus: boolean) => {
    try {
      await supabase.from('garages').update({ is_verified: !currentStatus }).eq('id', garageId);
      if (onRefresh) onRefresh(); else window.location.reload();
    } catch (error) {
      alert("تعذر تحديث حالة الكراج");
    }
  };

  const handleDeleteGarage = async (garageId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الكراج نهائياً؟ سيتم حذف جميع طلبات الفحص والتقييمات المرتبطة به.')) return;
    
    try {
      const { error } = await supabase.from('garages').delete().eq('id', garageId);
      if (error) throw error;
      if (onRefresh) onRefresh(); else window.location.reload();
    } catch (error: any) {
      alert("تعذر حذف الكراج: " + error.message);
    }
  };

  const filteredGarages = garages.filter(g => 
    g.businessName.includes(searchQuery) || g.address.includes(searchQuery)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-600" />
            <span>إدارة الكراجات المعتمدة</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">إضافة كراجات جديدة، ربطها بحسابات المستخدمين، وإدارة اعتمادها.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs shrink-0">
          <Plus className="w-4 h-4" /><span>إضافة كراج جديد</span>
        </button>
      </div>

      <div className="p-3 border-b border-slate-100">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="بحث باسم الكراج أو العنوان..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-orange-500" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">اسم الكراج</th>
              <th className="py-3 px-4">الموقع</th>
              <th className="py-3 px-4">رسم الفحص</th>
              <th className="py-3 px-4">الحساب المرتبط</th>
              <th className="py-3 px-4 text-center">حالة الاعتماد</th>
              <th className="py-3 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredGarages.map(garage => {
              const linkedUser = users.find(u => u.id === garage.userId);
              return (
                <tr key={garage.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{garage.businessName}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{garage.phone}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-600"><MapPin className="w-3.5 h-3.5 text-orange-500" />{garage.address}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold">
                    {garage.inspectionFeeSYP.toLocaleString()} ل.س / ${garage.inspectionFeeUSD}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {linkedUser ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200"><UserIcon className="w-3 h-3" />{linkedUser.fullName}</span>
                    ) : (
                      <span className="text-slate-400 text-[10px] bg-slate-100 px-2 py-1 rounded-md">غير مرتبط بحساب</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => handleToggleVerify(garage.id, garage.isVerified)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[10px] ${garage.isVerified ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                      {garage.isVerified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {garage.isVerified ? 'معتمد' : 'موقوف'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => handleDeleteGarage(garage.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="حذف الكراج نهائياً">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-4">إضافة كراج معتمد جديد</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم الكراج التجاري:</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">المنطقة:</label>
                  <select value={zone} onChange={e => setZone(e.target.value as ZoneLocation)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                    <option value="al_kafr">الكفر</option>
                    <option value="suwayda">السويداء</option>
                    <option value="salkhad">صلخد</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الهاتف:</label>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">العنوان التفصيلي:</label>
                <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رسم الفحص (SYP):</label>
                  <input type="number" required value={feeSyp} onChange={e => setFeeSyp(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رسم الفحص (USD):</label>
                  <input type="number" required value={feeUsd} onChange={e => setFeeUsd(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <label className="font-bold text-blue-900 block mb-1 flex items-center gap-1.5"><LinkIcon className="w-4 h-4" /> ربط الكراج بحساب مستخدم (اختياري):</label>
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm mt-1">
                  <option value="">-- بدون ربط (كراج مستقل) --</option>
                  {users.map(u => (<option key={u.id} value={u.id}>{u.fullName} ({u.phone})</option>))}
                </select>
                <p className="text-[10px] text-blue-700 mt-1">عند ربط حساب، سيتمكن صاحب هذا الحساب من الدخول إلى لوحة تحكم الكراج فوراً.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isLoading} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">إلغاء</button>
                <button type="submit" disabled={isLoading} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} حفظ الكراج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
};