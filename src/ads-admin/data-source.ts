import type { Campaign, CampaignObjective, CampaignStatus, DailyMetric } from './store';

export const ADS_DATA_API_URL = 'https://script.google.com/macros/s/AKfycbzAgdqL2lrwNPumuj7WsHQWuaKmOY04_lIkMycULq5AhP7FIeEaNTm1ZrlmSZ5DkaBx/exec';

type SheetRow = Record<string, unknown>;

type SheetResponse = {
  success: boolean;
  data: SheetRow[];
  updatedAt?: string;
};

const statusMap: Record<string, CampaignStatus> = {
  active: '投放中',
  paused: '已暂停',
  draft: '草稿',
  reviewing: '审核中',
  limited: '预算受限',
  rejected: '审核未通过',
  ended: '已结束',
};

const objectiveMap: Record<string, CampaignObjective> = {
  traffic: '网站访问',
  leads: '获取线索',
  app: '应用推广',
};

const campaignStatuses: CampaignStatus[] = ['草稿', '审核中', '投放中', '已暂停', '预算受限', '审核未通过', '已结束'];
const campaignObjectives: CampaignObjective[] = ['网站访问', '获取线索', '应用推广'];

function toNumber(value: unknown, fallback = 0): number {
  const normalized = String(value ?? '').replace(/[\s,$￥¥]/g, '');
  if (!normalized) return fallback;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStatus(value: unknown): CampaignStatus {
  const status = String(value ?? '').trim();
  if (campaignStatuses.includes(status as CampaignStatus)) return status as CampaignStatus;
  return statusMap[status.toLowerCase()] ?? '草稿';
}

function toObjective(value: unknown): CampaignObjective {
  const objective = String(value ?? '').trim();
  if (campaignObjectives.includes(objective as CampaignObjective)) return objective as CampaignObjective;
  return objectiveMap[objective.toLowerCase()] ?? '网站访问';
}

function toDevices(value: unknown): string[] {
  const devices = String(value ?? '')
    .split(/[,，、]/)
    .map(item => item.trim())
    .filter(Boolean);
  return devices.length ? devices : ['桌面端', '移动端'];
}

function campaignDuration(startDate: string, endDate: string): number {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 30;
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

export function mapSheetCampaigns(campaignRows: SheetRow[], updatedAt = ''): Campaign[] {
  return campaignRows.flatMap(row => {
    const id = String(row.id ?? '').trim();
    const name = String(row.name ?? '').trim();
    if (!id || !name) return [];

    const startDate = String(row.start_date ?? row.startDate ?? '').trim();
    const endDate = String(row.end_date ?? row.endDate ?? '').trim();
    const dailyBudget = toNumber(row.daily_budget ?? row.dailyBudget);
    return [{
      id,
      name,
      objective: toObjective(row.objective),
      status: toStatus(row.status),
      dailyBudget,
      totalBudget: toNumber(row.total_budget ?? row.totalBudget, dailyBudget * campaignDuration(startDate, endDate)),
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      bid: toNumber(row.bid),
      startDate,
      endDate,
      region: String(row.region ?? row.target_region ?? '中国大陆').trim(),
      devices: toDevices(row.devices),
      updatedAt: String(row.updated_at ?? row.updatedAt ?? updatedAt),
    }];
  });
}

export function mapSheetDailyMetrics(rows: SheetRow[], updatedAt = ''): DailyMetric[] {
  const metrics = new Map<string, DailyMetric>();
  rows.forEach(row => {
    const date = String(row.date ?? '').trim();
    const campaignId = String(row.campaign_id ?? row.campaignId ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !campaignId) return;
    const uniqueKey = `${date}:${campaignId}`;
    metrics.set(uniqueKey, {
      id: String(row.metric_id ?? row.id ?? `${date}_${campaignId}`).trim(),
      date,
      campaignId,
      impressions: toNumber(row.impressions),
      clicks: toNumber(row.clicks),
      conversions: toNumber(row.conversions),
      spend: toNumber(row.cost ?? row.spend),
      updatedAt: String(row.updated_at ?? row.updatedAt ?? updatedAt),
    });
  });
  return [...metrics.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchSheet(sheet: 'campaigns' | 'daily_metrics', signal: AbortSignal): Promise<SheetResponse> {
  const url = new URL(ADS_DATA_API_URL);
  url.searchParams.set('sheet', sheet);
  const response = await fetch(url, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`Google Sheet API 返回 ${response.status}`);

  const payload = await response.json() as Partial<SheetResponse>;
  if (payload.success !== true || !Array.isArray(payload.data)) {
    throw new Error(`Google Sheet API 的 ${sheet} 数据格式不正确`);
  }
  return payload as SheetResponse;
}

export async function loadSheetData(signal: AbortSignal): Promise<{ campaigns: Campaign[]; dailyMetrics: DailyMetric[]; updatedAt: string }> {
  const [campaignResponse, metricResponse] = await Promise.all([
    fetchSheet('campaigns', signal),
    fetchSheet('daily_metrics', signal),
  ]);
  const updatedAt = campaignResponse.updatedAt ?? metricResponse.updatedAt ?? new Date().toISOString();
  const campaigns = mapSheetCampaigns(campaignResponse.data, updatedAt);
  const dailyMetrics = mapSheetDailyMetrics(metricResponse.data, updatedAt);
  if (!campaigns.length) throw new Error('Google Sheet 中没有有效的推广计划');
  return { campaigns, dailyMetrics, updatedAt };
}
