import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../', import.meta.url);

test('ads admin is a separate noindex Vite page', async () => {
  const [html, viteConfig] = await Promise.all([
    readFile(new URL('ads-admin.html', projectRoot), 'utf8'),
    readFile(new URL('vite.config.ts', projectRoot), 'utf8'),
  ]);

  assert.match(html, /<meta name="robots" content="noindex,nofollow"/);
  assert.match(html, /id="adsAdminApp"/);
  assert.match(html, /src="\/src\/ads-admin\/main\.ts"/);
  assert.match(viteConfig, /adsAdmin: '\.\/ads-admin\.html'/);
});

test('ads admin uses Google Sheet data with a local fallback', async () => {
  const [main, store, demoData, dataSource] = await Promise.all([
    readFile(new URL('src/ads-admin/main.ts', projectRoot), 'utf8'),
    readFile(new URL('src/ads-admin/store.ts', projectRoot), 'utf8'),
    readFile(new URL('src/ads-admin/demo-data.ts', projectRoot), 'utf8'),
    readFile(new URL('src/ads-admin/data-source.ts', projectRoot), 'utf8'),
  ]);

  assert.match(store, /const STORAGE_KEY = 'adsAdmin:v1'/);
  assert.match(store, /schemaVersion: 1/);
  assert.match(main, /同步 Google Sheet/);
  assert.match(main, /loadSheetData/);
  assert.match(store, /dailyMetrics: DailyMetric\[\]/);
  assert.match(main, /currency: 'USD'/);
  assert.doesNotMatch(main, /SPARK ADS \/ 演示工作区/);
  assert.doesNotMatch(main, /第一版为每个推广计划生成一个默认广告组/);
  assert.doesNotMatch(main, /比较推广计划表现并导出演示数据/);
  assert.doesNotMatch(main, /当前显示演示数据/);
  assert.doesNotMatch(main, /该金额由本地模拟流水计算/);
  assert.match(main, /真实充值尚未开放/);
  assert.match(main, /不会参与真实竞价或产生扣费/);
  assert.match(main, /步骤 \$\{wizardStep\} \/ 6/);
  assert.match(main, /exportReport/);
  assert.match(demoData, /status: '预算受限'/);
  assert.match(demoData, /conversionActions/);
  assert.match(dataSource, /AKfycbzAgdqL2lrwNPumuj7WsHQWuaKmOY04_lIkMycULq5AhP7FIeEaNTm1ZrlmSZ5DkaBx/);
  assert.match(dataSource, /url\.searchParams\.set\('sheet', sheet\)/);
  assert.match(dataSource, /fetchSheet\('campaigns'/);
  assert.match(dataSource, /fetchSheet\('daily_metrics'/);
  assert.doesNotMatch(demoData, /WEEKLY_SERIES/);
});

test('Google Sheet rows preserve campaign configuration and daily metrics', async () => {
  const { mapSheetCampaigns, mapSheetDailyMetrics } = await import('../src/ads-admin/data-source.ts');
  const [campaign] = mapSheetCampaigns([
    {
      id: 'cmp_001',
      name: '表格推广计划',
      status: 'active',
      objective: 'traffic',
      daily_budget: '100',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      region: 'CN',
    },
  ]);
  const [metric] = mapSheetDailyMetrics([
    { metric_id: '2026-09-01_cmp_001', date: '2026-09-01', campaign_id: 'cmp_001', cost: '$12.50', impressions: '1,000', clicks: '25', conversions: '2' },
  ]);

  assert.equal(campaign.status, '投放中');
  assert.equal(campaign.objective, '网站访问');
  assert.equal(campaign.totalBudget, 3000);
  assert.deepEqual(
    { spend: metric.spend, impressions: metric.impressions, clicks: metric.clicks, conversions: metric.conversions },
    { spend: 12.5, impressions: 1000, clicks: 25, conversions: 2 },
  );
});

test('daily metrics follow the selected report period and fill missing dates', async () => {
  const { campaignsForDateRange, dailySeriesForDateRange } = await import('../src/ads-admin/metrics.ts');
  const campaign = {
    id: 'cmp_001', name: '表格推广计划', status: '投放中', objective: '网站访问', dailyBudget: 100,
    totalBudget: 3000, spend: 0, impressions: 0, clicks: 0, conversions: 0, bid: 0.2,
    startDate: '2026-09-01', endDate: '2026-09-30', region: 'US', devices: ['移动端'], updatedAt: '',
  };
  const metrics = [
    { id: 'm1', date: '2026-08-26', campaignId: 'cmp_001', spend: 12, impressions: 1000, clicks: 20, conversions: 1, updatedAt: '' },
    { id: 'm2', date: '2026-09-01', campaignId: 'cmp_001', spend: 18, impressions: 1500, clicks: 30, conversions: 2, updatedAt: '' },
  ];
  const today = new Date(2026, 8, 1, 12);
  const [summary] = campaignsForDateRange([campaign], metrics, '过去 7 天', today);
  const series = dailySeriesForDateRange(metrics, '过去 7 天', today);

  assert.deepEqual(
    { spend: summary.spend, impressions: summary.impressions, clicks: summary.clicks, conversions: summary.conversions },
    { spend: 30, impressions: 2500, clicks: 50, conversions: 3 },
  );
  assert.equal(series.length, 7);
  assert.equal(series[1].date, '2026-08-27');
  assert.equal(series[1].spend, 0);
  assert.equal(series.at(-1).date, '2026-09-01');
});
