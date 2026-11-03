/** Notification Report API helpers */

export const DEFAULT_API_BASE =
  (import.meta.env.VITE_NOTIFICATION_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:3000';

export interface BodyParam {
  key?: string;
  value?: string;
  value_text?: string;
}

export interface NotificationRecord {
  id?: number | string;
  phone?: string;
  status?: string;
  sender_id?: string;
  template_id?: string;
  source?: string;
  service_provider?: string;
  sent_at?: string;
  created_at?: string;
  params?: {
    body?: BodyParam[];
    buttons?: unknown[];
  };
  histories?: Array<{
    reason?: string;
    status?: string;
    reported_at?: string;
  }>;
}

export interface ReportsResponse {
  status?: string;
  data?: {
    page?: number;
    page_total?: number;
    limit?: number;
    data?: NotificationRecord[];
    data_total?: number;
    data_count?: number;
    sent_count?: number;
    delivered_count?: number;
    read_count?: number;
    failed_count?: number;
    total_cost?: number;
  };
}

export function normalizePhone(raw: string): string {
  let num = raw.trim().replace(/-/g, '').replace(/\s/g, '');
  if (num.startsWith('+62')) return '62' + num.slice(3);
  if (num.startsWith('62')) return num;
  if (num.startsWith('0')) return '62' + num.slice(1);
  return '62' + num;
}

export function formatSentAt(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return (
      d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
      }) + ' WIB'
    );
  } catch {
    return raw;
  }
}

export async function fetchReports(
  phone: string,
  limit = 10,
  baseUrl: string = DEFAULT_API_BASE,
): Promise<ReportsResponse> {
  const normalized = normalizePhone(phone);
  const safeLimit = Math.min(100, Math.max(1, limit || 10));
  const url =
    `${baseUrl.replace(/\/$/, '')}/v2/reports/?phone=` +
    encodeURIComponent(normalized) +
    `&limit=${safeLimit}&order=id%20desc`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
  }
  return (await resp.json()) as ReportsResponse;
}
