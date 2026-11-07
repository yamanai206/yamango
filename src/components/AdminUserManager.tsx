import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { Users, ShieldCheck, Loader2 } from 'lucide-react';

interface AdminUserManagerProps {
  onUpdateRole: (userId: string, role: UserRole) => Promise<boolean>;
}

interface DbUser {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  kyc_status: string;
  created_at: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  buyer: 'مشتري / مستأجر',
  seller: 'بائع / مؤجر',
  lessor: 'مؤجر (قديم)',
  garage: 'كراج معتمد',
  agent: 'وكيل دفع',
  admin: 'مشرف عام',
};

export const AdminUserManager: React.FC<AdminUserManagerProps> = ({ onUpdateRole }) => {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    // جلب المستخدمين مباشرة من السحابة لضمان أحدث البيانات
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as DbUser[]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setProcessingId(userId);
    const success = await onUpdateRole(userId, newRole);
    if (success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert('حدث خطأ أثناء تحديث الصلاحية');
    }
    setProcessingId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            <span>إدارة المستخدمين والصلاحيات</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            عرض جميع الحسابات المسجلة، وتعديل صلاحياتهم (بائع، وكيل، مشرف...).
          </p>
        </div>
        <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-lg">
          {users.length} مستخدم
        </span>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-orange-500" />
            <span>جارٍ تحميل المستخدمين...</span>
          </div>
        ) : (
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">الاسم الكامل</th>
                <th className="py-3 px-4">رقم الهاتف</th>
                <th className="py-3 px-4">الصلاحية الحالية</th>
                <th className="py-3 px-4 text-center">تغيير الصلاحية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      {user.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />}
                      {user.full_name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.id}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                    {user.phone || 'غير مسجل'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      user.role === 'admin' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      user.role === 'agent' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      user.role === 'garage' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={processingId === user.id}
                        className="px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-orange-500 cursor-pointer disabled:opacity-50"
                      >
                        <option value="buyer">مشتري / مستأجر</option>
                        <option value="seller">بائع / مؤجر</option>
                        <option value="garage">كراج معتمد</option>
                        <option value="agent">وكيل دفع</option>
                        <option value="admin">مشرف عام</option>
                      </select>
                      {processingId === user.id && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};