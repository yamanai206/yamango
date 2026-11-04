import { AdminSecurityProfile, AuditLogEntry, AuditSeverity, AuditActionCategory } from '../types';

/**
 * Toggles two-factor authentication (2FA) status for an admin/supervisor
 */
export function toggleAdmin2fa(
  admins: AdminSecurityProfile[],
  adminId: string
): { updatedAdmins: AdminSecurityProfile[]; toggledAdmin?: AdminSecurityProfile; newStatus: boolean } {
  let toggledAdmin: AdminSecurityProfile | undefined;
  let newStatus = false;

  const updatedAdmins = admins.map((adm) => {
    if (adm.id === adminId) {
      newStatus = !adm.twoFactorEnabled;
      toggledAdmin = {
        ...adm,
        twoFactorEnabled: newStatus,
      };
      return toggledAdmin;
    }
    return adm;
  });

  return { updatedAdmins, toggledAdmin, newStatus };
}

/**
 * Filters audit log entries by text search query, action category, and severity level
 */
export function filterAuditLogs(
  logs: AuditLogEntry[],
  searchQuery: string = '',
  categoryFilter: string = 'all',
  severityFilter: string = 'all'
): AuditLogEntry[] {
  const query = searchQuery.trim().toLowerCase();

  return logs.filter((entry) => {
    // Category match
    if (categoryFilter !== 'all' && entry.category !== categoryFilter) {
      return false;
    }

    // Severity match
    if (severityFilter !== 'all' && entry.severity !== severityFilter) {
      return false;
    }

    // Search query match
    if (!query) return true;

    const actor = entry.actorName.toLowerCase();
    const action = entry.actionTitleArabic.toLowerCase();
    const details = entry.details.toLowerCase();
    const cat = entry.categoryLabelArabic.toLowerCase();
    const id = entry.id.toLowerCase();
    const location = (entry.location || '').toLowerCase();

    return (
      actor.includes(query) ||
      action.includes(query) ||
      details.includes(query) ||
      cat.includes(query) ||
      id.includes(query) ||
      location.includes(query)
    );
  });
}

/**
 * Exports audit log entries to standard CSV format with BOM for proper Arabic Excel display
 */
export function exportAuditLogsToCsv(logs: AuditLogEntry[]): string {
  const headers = [
    'المعرف',
    'التاريخ والوقت',
    'المنفذ',
    'الدور',
    'التصنيف',
    'العملية',
    'مستوى الأهمية',
    'النتيجة',
    'الموقع',
    'عنوان IP',
    'التفاصيل الكاملة',
  ];

  const rows = logs.map((log) => [
    `"${log.id}"`,
    `"${log.timestamp}"`,
    `"${log.actorName.replace(/"/g, '""')}"`,
    `"${log.actorRole.replace(/"/g, '""')}"`,
    `"${log.categoryLabelArabic.replace(/"/g, '""')}"`,
    `"${log.actionTitleArabic.replace(/"/g, '""')}"`,
    `"${log.severity}"`,
    `"${log.status}"`,
    `"${(log.location || '').replace(/"/g, '""')}"`,
    `"${log.ipAddress || ''}"`,
    `"${log.details.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  // Prepend UTF-8 BOM so Excel opens Arabic letters accurately without garbling
  return '\uFEFF' + csvContent;
}

/**
 * Exports audit log entries to clean, formatted JSON string
 */
export function exportAuditLogsToJson(logs: AuditLogEntry[]): string {
  return JSON.stringify(logs, null, 2);
}

export interface SecurityOverviewMetrics {
  totalAdmins: number;
  twoFactorEnabledCount: number;
  twoFactorDisabledCount: number;
  twoFactorAdoptionRate: number; // percentage e.g. 75
  totalAuditEvents: number;
  criticalEventsCount: number;
  highEventsCount: number;
  suspiciousBlockedAttemptsCount: number;
}

/**
 * Calculates security KPIs for admin accounts and audit logs
 */
export function calculateSecurityOverviewMetrics(
  admins: AdminSecurityProfile[],
  logs: AuditLogEntry[]
): SecurityOverviewMetrics {
  const totalAdmins = admins.length;
  const twoFactorEnabledCount = admins.filter((a) => a.twoFactorEnabled).length;
  const twoFactorDisabledCount = totalAdmins - twoFactorEnabledCount;
  const twoFactorAdoptionRate = totalAdmins > 0 ? Math.round((twoFactorEnabledCount / totalAdmins) * 100) : 0;

  const totalAuditEvents = logs.length;
  const criticalEventsCount = logs.filter((l) => l.severity === 'critical').length;
  const highEventsCount = logs.filter((l) => l.severity === 'high').length;
  const suspiciousBlockedAttemptsCount = logs.filter((l) => l.status === 'blocked').length;

  return {
    totalAdmins,
    twoFactorEnabledCount,
    twoFactorDisabledCount,
    twoFactorAdoptionRate,
    totalAuditEvents,
    criticalEventsCount,
    highEventsCount,
    suspiciousBlockedAttemptsCount,
  };
}
