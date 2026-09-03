export type CampaignStatus = '草稿' | '审核中' | '投放中' | '已暂停' | '预算受限' | '审核未通过' | '已结束';
export type CampaignObjective = '网站访问' | '获取线索' | '应用推广';

export type Campaign = {
  id: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  dailyBudget: number;
  totalBudget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  bid: number;
  startDate: string;
  endDate: string;
  region: string;
  devices: string[];
  updatedAt: string;
};

export type DailyMetric = {
  id: string;
  date: string;
  campaignId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  platformSpend: PlatformSpend;
  updatedAt: string;
};

export type PlatformSpend = {
  meta: number;
  google: number;
  tiktok: number;
  kuai: number;
};

export type AdCreative = {
  id: string;
  campaignId: string;
  name: string;
  headline: string;
  description: string;
  callToAction: string;
  format: string;
  reviewStatus: string;
  theme: string;
  imageDataUrl?: string;
};

export type ConversionAction = {
  id: string;
  name: string;
  category: string;
  status: string;
  count: number;
};

export type LedgerEntry = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  currency: string;
  status: 'posted' | 'pending' | 'void';
  campaignId?: string;
  updatedAt: string;
};

export type AdsAdminState = {
  schemaVersion: 1;
  campaigns: Campaign[];
  dailyMetrics: DailyMetric[];
  ads: AdCreative[];
  conversionActions: ConversionAction[];
  ledger: LedgerEntry[];
  preferences: {
    dateRange: string;
  };
};

const STORAGE_KEY = 'adsAdmin:v1';

function cloneState(state: AdsAdminState): AdsAdminState {
  return structuredClone(state);
}

export function loadState(fallback: AdsAdminState): AdsAdminState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return cloneState(fallback);

  try {
    const parsed = JSON.parse(stored) as AdsAdminState;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.campaigns)) {
      return cloneState(fallback);
    }
    return {
      ...parsed,
      dailyMetrics: Array.isArray(parsed.dailyMetrics) ? parsed.dailyMetrics.map(metric => ({
        ...metric,
        platformSpend: {
          meta: metric.platformSpend?.meta ?? 0,
          google: metric.platformSpend?.google ?? 0,
          tiktok: metric.platformSpend?.tiktok ?? 0,
          kuai: metric.platformSpend?.kuai ?? 0,
        },
      })) : [],
      ledger: Array.isArray(parsed.ledger) ? parsed.ledger.map(entry => ({
        ...entry,
        currency: entry.currency ?? 'USD',
        status: entry.status ?? 'posted',
        updatedAt: entry.updatedAt ?? '',
      })) : [],
    };
  } catch {
    return cloneState(fallback);
  }
}

export function saveState(state: AdsAdminState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetStoredState(fallback: AdsAdminState): AdsAdminState {
  localStorage.removeItem(STORAGE_KEY);
  return cloneState(fallback);
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function campaignCtr(campaign: Campaign): number {
  return campaign.impressions ? campaign.clicks / campaign.impressions : 0;
}

export function campaignCpc(campaign: Campaign): number {
  return campaign.clicks ? campaign.spend / campaign.clicks : 0;
}

export function campaignCpa(campaign: Campaign): number {
  return campaign.conversions ? campaign.spend / campaign.conversions : 0;
}
