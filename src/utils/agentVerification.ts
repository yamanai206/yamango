import { Deal, PaymentAgent } from '../types';

/**
 * Generates an escrow verification OTP code for buyers to show to physical agents
 * Format: YM-XXXX (e.g. YM-5821)
 */
export function generateAgentVerificationOtp(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `YM-${randomNum}`;
}

/**
 * Normalizes input OTP: trims, converts to uppercase, and converts any Arabic numerals to standard digits
 */
export function normalizeOtp(code: string): string {
  if (!code) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let normalized = code.trim().toUpperCase();
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replaceAll(arabicNumerals[i], i.toString());
  }
  return normalized;
}

/**
 * Checks if a string is a valid yamango verification code format (YM-XXXX)
 */
export function isValidOtpFormat(code: string): boolean {
  const norm = normalizeOtp(code);
  return /^YM-[0-9]{4,6}$/.test(norm);
}

/**
 * Finds a deal in the system by verification code (case-insensitive, normalized)
 */
export function findDealByVerificationCode(deals: Deal[], code: string): Deal | undefined {
  const target = normalizeOtp(code);
  if (!target) return undefined;
  return deals.find((d) => normalizeOtp(d.secretOtp) === target);
}

export interface VerificationCodeItem {
  dealId: string;
  code: string;
  listingTitle: string;
  buyerName: string;
  sellerName: string;
  depositAmount: number;
  currency: 'SYP' | 'USD';
  status: Deal['status'];
  statusLabelArabic: string;
  isSecured: boolean;
  agentName?: string;
  receiptNumber?: string;
  createdAt: number;
}

/**
 * Extract verification codes from deals and format for the admin manager table
 */
export function extractVerificationCodes(
  deals: Deal[],
  searchQuery: string = '',
  statusFilter: 'all' | 'pending' | 'secured' = 'all'
): VerificationCodeItem[] {
  const query = searchQuery.trim().toLowerCase();

  return deals
    .filter((deal) => {
      if (!deal.secretOtp) return false;

      const isSecured = deal.status === 'escrow_secured' || deal.status === 'completed';
      if (statusFilter === 'pending' && isSecured) return false;
      if (statusFilter === 'secured' && !isSecured) return false;

      if (!query) return true;

      const normOtp = normalizeOtp(deal.secretOtp).toLowerCase();
      const title = deal.listingTitle.toLowerCase();
      const buyer = deal.buyerName.toLowerCase();
      const seller = deal.sellerName.toLowerCase();
      const id = deal.id.toLowerCase();
      const agent = (deal.escrowAgentName || '').toLowerCase();

      return (
        normOtp.includes(query) ||
        title.includes(query) ||
        buyer.includes(query) ||
        seller.includes(query) ||
        id.includes(query) ||
        agent.includes(query)
      );
    })
    .map((deal) => {
      const isSecured = deal.status === 'escrow_secured' || deal.status === 'completed';
      let statusLabelArabic = 'بانتظار إيداع العربون لدى الوكيل';
      if (deal.status === 'escrow_secured') {
        statusLabelArabic = 'تم تأكيد الاستلام وحجز العربون بالكامل';
      } else if (deal.status === 'completed') {
        statusLabelArabic = 'صفقة مكتملة ومحررة';
      } else if (deal.status === 'cancelled') {
        statusLabelArabic = 'صفقة ملغاة - تم إرجاع العربون';
      }

      return {
        dealId: deal.id,
        code: normalizeOtp(deal.secretOtp),
        listingTitle: deal.listingTitle,
        buyerName: deal.buyerName,
        sellerName: deal.sellerName,
        depositAmount: deal.depositAmount,
        currency: deal.currency,
        status: deal.status,
        statusLabelArabic,
        isSecured,
        agentName: deal.escrowAgentName,
        receiptNumber: deal.receiptNumber,
        createdAt: deal.createdAt,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export interface AgentMetricsSummary {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  totalFloatUSD: number;
  totalFloatSYP: number;
  dealsSecuredCount: number;
}

/**
 * Calculates aggregate summary metrics for certified payment agents
 */
export function calculateAgentMetrics(agents: PaymentAgent[], deals: Deal[]): AgentMetricsSummary {
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.isActive).length;
  const inactiveAgents = totalAgents - activeAgents;

  let totalFloatUSD = 0;
  let totalFloatSYP = 0;

  for (const ag of agents) {
    totalFloatUSD += ag.balanceUSD || 0;
    totalFloatSYP += ag.balanceSYP || 0;
  }

  const dealsSecuredCount = deals.filter(
    (d) => d.status === 'escrow_secured' || d.status === 'completed'
  ).length;

  return {
    totalAgents,
    activeAgents,
    inactiveAgents,
    totalFloatUSD,
    totalFloatSYP,
    dealsSecuredCount,
  };
}
