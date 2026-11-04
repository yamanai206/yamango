import React, { useState } from 'react';
import { POSTGRES_DDL_SCHEMA } from '../utils/sqlExport';
import { X, Copy, Check, Download, Database } from 'lucide-react';

interface SqlExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlExportModal: React.FC<SqlExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(POSTGRES_DDL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([POSTGRES_DDL_SCHEMA], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'yamango_schema_postgresql.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                مخطط قاعدة البيانات DDL (جاهز لـ PostgreSQL وSupabase)
              </h3>
              <span className="text-xs text-slate-400">
                يشمل جداول الكراجات، الاشتراكات، الفحوصات، الترويج، الإسكرو، وجاهزية التاكسي.
              </span>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-[50vh] border border-slate-800 leading-relaxed dir-ltr text-left">
            {POSTGRES_DDL_SCHEMA.trim()}
          </pre>
        </div>

        <div className="flex items-center justify-between text-xs pt-2">
          <span className="text-slate-400">
            يمكنك تشغيل هذا المخطط مباشرة على أي خادم PostgreSQL 14+ أو مشروع Supabase جديد.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ' : 'نسخ الكود'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>تحميل ملف .sql</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
