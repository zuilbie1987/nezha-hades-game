import type { Campaign, DailyMetric, PlatformSpend } from './store';

export type DateRangeLabel = '今天' | '过去 7 天' | '过去 30 天' | '本月';

export type DailySeriesPoint = {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
};

type MetricTotals = Omit<DailySeriesPoint, 'date'>;
export type DailyPlatformSeriesPoint = PlatformSpend & { date: string };

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function dateRangeBounds(range: string, today = new Date()): { start: string; end: string } {
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const startDate = new Date(endDate);
  if (range === '过去 7 天') startDate.setDate(startDate.getDate() - 6);
  else if (range === '过去 30 天') startDate.setDate(startDate.getDate() - 29);
  else if (range === '本月') startDate.setDate(1);
  return { start: dateKey(startDate), end: dateKey(endDate) };
}

export function filterDailyMetrics(metrics: DailyMetric[], range: string, today = new Date()): DailyMetric[] {
  const { start, end } = dateRangeBounds(range, today);
  return metrics.filter(metric => metric.date >= start && metric.date <= end);
}

function emptyTotals(): MetricTotals {
  return { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
}

function emptyPlatformSpend(): PlatformSpend {
  return { meta: 0, google: 0, tiktok: 0, kuai: 0 };
}

export function campaignsForDateRange(campaigns: Campaign[], metrics: DailyMetric[], range: string, today = new Date()): Campaign[] {
  if (!metrics.length) return campaigns;
  const totals = new Map<string, MetricTotals>();
  filterDailyMetrics(metrics, range, today).forEach(metric => {
    const current = totals.get(metric.campaignId) ?? emptyTotals();
    current.spend += metric.spend;
    current.impressions += metric.impressions;
    current.clicks += metric.clicks;
    current.conversions += metric.conversions;
    totals.set(metric.campaignId, current);
  });
  return campaigns.map(campaign => ({ ...campaign, ...(totals.get(campaign.id) ?? emptyTotals()) }));
}

export function dailySeriesForDateRange(metrics: DailyMetric[], range: string, today = new Date()): DailySeriesPoint[] {
  const { start, end } = dateRangeBounds(range, today);
  const totals = new Map<string, MetricTotals>();
  filterDailyMetrics(metrics, range, today).forEach(metric => {
    const current = totals.get(metric.date) ?? emptyTotals();
    current.spend += metric.spend;
    current.impressions += metric.impressions;
    current.clicks += metric.clicks;
    current.conversions += metric.conversions;
    totals.set(metric.date, current);
  });

  const series: DailySeriesPoint[] = [];
  const cursor = dateFromKey(start);
  const last = dateFromKey(end);
  while (cursor <= last) {
    const date = dateKey(cursor);
    series.push({ date, ...(totals.get(date) ?? emptyTotals()) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return series;
}

export function platformSeriesForDateRange(metrics: DailyMetric[], range: string, today = new Date()): DailyPlatformSeriesPoint[] {
  const dates = dailySeriesForDateRange(metrics, range, today).map(point => point.date);
  const totals = new Map<string, PlatformSpend>();
  filterDailyMetrics(metrics, range, today).forEach(metric => {
    const current = totals.get(metric.date) ?? emptyPlatformSpend();
    current.meta += metric.platformSpend?.meta ?? 0;
    current.google += metric.platformSpend?.google ?? 0;
    current.tiktok += metric.platformSpend?.tiktok ?? 0;
    current.kuai += metric.platformSpend?.kuai ?? 0;
    totals.set(metric.date, current);
  });
  return dates.map(date => ({ date, ...(totals.get(date) ?? emptyPlatformSpend()) }));
}
