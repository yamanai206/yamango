import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toggleAdmin2fa,
  filterAuditLogs,
  exportAuditLogsToCsv,
  exportAuditLogsToJson,
  calculateSecurityOverviewMetrics,
} from './auditSecurity';
import { AdminSecurityProfile, AuditLogEntry } from '../types';

test('toggleAdmin2fa properly toggles 2FA status for specified admin', () => {
  const mockAdmins: AdminSecurityProfile[] = [
    {
      id: 'adm_1',
      fullName: 'مشرف رئيسي',
      email: 'admin1@yamango.sy',
      phone: '0999000111',
      role: 'super_admin',
      roleTitleArabic: 'المشرف العام',
      twoFactorEnabled: true,
      twoFactorMethod: 'authenticator_app',
      lastLoginAt: '2026-10-26 10:00',
      status: 'active',
    },
    {
      id: 'adm_2',
      fullName: 'مشرف مساعد',
      email: 'admin2@yamango.sy',
      phone: '0999000222',
      role: 'field_auditor',
      roleTitleArabic: 'مدقق ميداني',
      twoFactorEnabled: false,
      twoFactorMethod: 'sms_syria',
      lastLoginAt: '2026-10-25 14:00',
      status: 'active',
    },
  ];

  // Disable 2FA for adm_1
  const result1 = toggleAdmin2fa(mockAdmins, 'adm_1');
  assert.equal(result1.newStatus, false);
  assert.equal(result1.updatedAdmins.find((a) => a.id === 'adm_1')?.twoFactorEnabled, false);

  // Enable 2FA for adm_2
  const result2 = toggleAdmin2fa(mockAdmins, 'adm_2');
  assert.equal(result2.newStatus, true);
  assert.equal(result2.updatedAdmins.find((a) => a.id === 'adm_2')?.twoFactorEnabled, true);
});

test('filterAuditLogs filters by text query, category, and severity accurately', () => {
  const mockLogs: AuditLogEntry[] = [
    {
      id: 'log_1',
      timestamp: '2026-10-26 09:15',
      timestampMs: 1000,
      actorId: 'adm_1',
      actorName: 'مشرف عام',
      actorRole: 'المشرف العام',
      category: 'exchange_rates',
      categoryLabelArabic: 'أسعار الصرف',
      action: 'exchange_rate_updated',
      actionTitleArabic: 'تحديث سعر صرف الدولار',
      details: 'تم تحديث سعر الصرف إلى 14,850 ل.س',
      severity: 'high',
      status: 'success',
      location: 'الكفر',
    },
    {
      id: 'log_2',
      timestamp: '2026-10-26 09:20',
      timestampMs: 2000,
      actorId: 'system',
      actorName: 'نظام الحماية الذاتي',
      actorRole: 'النظام',
      category: 'anti_fraud',
      categoryLabelArabic: 'مكافحة الاحتيال',
      action: 'phone_leak_blocked',
      actionTitleArabic: 'حجب رقم هاتف مسرب في الشات',
      details: 'تم حجب الرقم 0933456789 وتوجيه الأطراف لدفع العربون',
      severity: 'critical',
      status: 'blocked',
      location: 'السويداء',
    },
  ];

  // Search by keyword
  const textMatch = filterAuditLogs(mockLogs, '14,850', 'all', 'all');
  assert.equal(textMatch.length, 1);
  assert.equal(textMatch[0].id, 'log_1');

  // Filter by category
  const fraudOnly = filterAuditLogs(mockLogs, '', 'anti_fraud', 'all');
  assert.equal(fraudOnly.length, 1);
  assert.equal(fraudOnly[0].id, 'log_2');

  // Filter by severity
  const criticalOnly = filterAuditLogs(mockLogs, '', 'all', 'critical');
  assert.equal(criticalOnly.length, 1);
  assert.equal(criticalOnly[0].id, 'log_2');

  const noneMatch = filterAuditLogs(mockLogs, 'غير موجود', 'all', 'all');
  assert.equal(noneMatch.length, 0);
});

test('exportAuditLogsToCsv produces UTF-8 BOM and valid CSV columns', () => {
  const mockLogs: AuditLogEntry[] = [
    {
      id: 'log_101',
      timestamp: '2026-10-26 11:00',
      timestampMs: 1000,
      actorId: 'adm_1',
      actorName: 'رائد العبدالله',
      actorRole: 'مدير العمليات',
      category: 'commissions',
      categoryLabelArabic: 'العمولات',
      action: 'commission_rate_updated',
      actionTitleArabic: 'تعديل عمولة البيع',
      details: 'تم تعديل عمولة البيع إلى 2.5%',
      severity: 'medium',
      status: 'success',
      location: 'الكفر',
      ipAddress: '192.168.1.10',
    },
  ];

  const csv = exportAuditLogsToCsv(mockLogs);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('المعرف,التاريخ والوقت,المنفذ'));
  assert.ok(csv.includes('log_101'));
  assert.ok(csv.includes('رائد العبدالله'));
});

test('exportAuditLogsToJson returns parsable JSON matching original records', () => {
  const mockLogs: AuditLogEntry[] = [
    {
      id: 'log_201',
      timestamp: '2026-10-26 12:00',
      timestampMs: 2000,
      actorId: 'adm_2',
      actorName: 'ديما نصر',
      actorRole: 'مسؤولة الدعم',
      category: 'security_auth',
      categoryLabelArabic: 'أمان الحسابات',
      action: '2fa_enabled',
      actionTitleArabic: 'تفعيل المصادقة الثنائية',
      details: 'تم تفعيل 2FA للمشرف',
      severity: 'high',
      status: 'success',
    },
  ];

  const jsonStr = exportAuditLogsToJson(mockLogs);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, 'log_201');
});

test('calculateSecurityOverviewMetrics calculates 2FA adoption and severity breakdown accurately', () => {
  const mockAdmins: AdminSecurityProfile[] = [
    {
      id: 'adm_1',
      fullName: 'مشرف 1',
      email: 'a1@yamango.sy',
      phone: '0999000111',
      role: 'super_admin',
      roleTitleArabic: 'مشرف عام',
      twoFactorEnabled: true,
      twoFactorMethod: 'authenticator_app',
      lastLoginAt: '2026-10-26 09:00',
      status: 'active',
    },
    {
      id: 'adm_2',
      fullName: 'مشرف 2',
      email: 'a2@yamango.sy',
      phone: '0999000222',
      role: 'finance_admin',
      roleTitleArabic: 'مدير مالية',
      twoFactorEnabled: false,
      twoFactorMethod: 'sms_syria',
      lastLoginAt: '2026-10-26 09:30',
      status: 'active',
    },
  ];

  const mockLogs: AuditLogEntry[] = [
    {
      id: 'l1',
      timestamp: '2026-10-26',
      timestampMs: 100,
      actorId: 'adm_1',
      actorName: 'مشرف',
      actorRole: 'مشرف',
      category: 'security_auth',
      categoryLabelArabic: 'أمان',
      action: 'login',
      actionTitleArabic: 'تسجيل دخول',
      details: 'دخول ناجح',
      severity: 'critical',
      status: 'success',
    },
    {
      id: 'l2',
      timestamp: '2026-10-26',
      timestampMs: 200,
      actorId: 'system',
      actorName: 'نظام الحماية',
      actorRole: 'نظام',
      category: 'anti_fraud',
      categoryLabelArabic: 'حماية',
      action: 'blocked_attempt',
      actionTitleArabic: 'محاولة محجوبة',
      details: 'تم حجب محاولة غير مصرح بها',
      severity: 'high',
      status: 'blocked',
    },
  ];

  const metrics = calculateSecurityOverviewMetrics(mockAdmins, mockLogs);
  assert.equal(metrics.totalAdmins, 2);
  assert.equal(metrics.twoFactorEnabledCount, 1);
  assert.equal(metrics.twoFactorDisabledCount, 1);
  assert.equal(metrics.twoFactorAdoptionRate, 50); // 1 out of 2 = 50%
  assert.equal(metrics.totalAuditEvents, 2);
  assert.equal(metrics.criticalEventsCount, 1);
  assert.equal(metrics.highEventsCount, 1);
  assert.equal(metrics.suspiciousBlockedAttemptsCount, 1);
});
