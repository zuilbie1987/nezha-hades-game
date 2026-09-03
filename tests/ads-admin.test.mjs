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
  const [main, store, demoData, dataSource, billing] = await Promise.all([
    readFile(new URL('src/ads-admin/main.ts', projectRoot), 'utf8'),
    readFile(new URL('src/ads-admin/store.ts', projectRoot), 'utf8'),
    readFile(new URL('src/ads-admin/demo-data.ts', projectRoot), 'utf8'),
    readFile(new URL('src/ads-admin/data-source.ts', projectRoot), 'utf8'),
    readFile(new URL('src/ads-admin/billing.ts', projectRoot), 'utf8'),
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
  assert.match(dataSource, /AKfycbxa0gHRRIPqA8U6S5QexUOcz_HvvopUcqAr9PePHdvhi0BSe1u1ZwEK6EpnejXhouuD/);
  assert.match(dataSource, /url\.searchParams\.set\('sheet', sheet\)/);
  assert.match(dataSource, /fetchSheet\('campaigns'/);
  assert.match(dataSource, /fetchSheet\('daily_metrics'/);
  assert.match(dataSource, /fetchSheet\('billing_ledger'/);
  assert.match(billing, /entry\.status === 'posted' && entry\.currency === 'USD'/);
  assert.match(main, /id="groupCampaignSelect"/);
  assert.match(main, /每日消耗明细/);
  assert.match(main, /group-spend-chart/);
  assert.match(main, /renderPlatformTrendChart\(groupMetrics/);
  assert.match(main, /Meta.*Google.*TikTok.*Kuai/);
  assert.match(dataSource, /meta_spend/);
  assert.match(dataSource, /google_spend/);
  assert.match(dataSource, /tiktok_spend/);
  assert.match(dataSource, /kuai_spend/);
  assert.match(main, /filterDailyMetrics\(state\.dailyMetrics/);
  assert.match(main, /id="billingCampaignFilter"/);
  assert.match(main, /项目资金概览/);
  assert.doesNotMatch(demoData, /WEEKLY_SERIES/);
});

test('billing ledger rows map, deduplicate and protect pending balances', async () => {
  const { mapSheetLedger } = await import('../src/ads-admin/data-source.ts');
  const ledger = mapSheetLedger([
    { transaction_id: 'txn_1', occurred_at: '2026-09-01 09:00:00', type: 'opening_balance', description: '初始余额', amount: '5,000.00', currency: 'usd', status: 'posted' },
    { transaction_id: 'txn_2', occurred_at: '2026-09-02 09:00:00', type: 'ad_spend', description: '广告消耗', amount: '-475.82', currency: 'USD', status: '' },
    { transaction_id: 'txn_1', occurred_at: '2026-09-01 09:00:00', type: 'opening_balance', description: '修正余额', amount: '4,900.00', currency: 'USD', status: 'posted' },
  ]);

  assert.equal(ledger.length, 2);
  assert.equal(ledger[0].id, 'txn_2');
  assert.equal(ledger[0].status, 'pending');
  assert.equal(ledger[1].amount, 4900);
  assert.equal(ledger[1].currency, 'USD');
});

test('billing separates credited and spent amounts by campaign', async () => {
  const { billingTotals, campaignBillingSummaries, UNASSIGNED_CAMPAIGN_ID } = await import('../src/ads-admin/billing.ts');
  const campaigns = [
    { id: 'cmp_a', name: 'A项目' },
    { id: 'cmp_b', name: 'B项目' },
  ];
  const ledger = [
    { id: 't1', campaignId: 'cmp_a', amount: 1000, currency: 'USD', status: 'posted' },
    { id: 't2', campaignId: 'cmp_a', amount: -320, currency: 'USD', status: 'posted' },
    { id: 't3', campaignId: 'cmp_b', amount: 500, currency: 'USD', status: 'pending' },
    { id: 't4', amount: 200, currency: 'USD', status: 'posted' },
  ];
  const totals = billingTotals(ledger);
  const summaries = campaignBillingSummaries(campaigns, ledger);
  const projectA = summaries.find(summary => summary.campaignId === 'cmp_a');
  const unassigned = summaries.find(summary => summary.campaignId === UNASSIGNED_CAMPAIGN_ID);

  assert.deepEqual(
    { credited: totals.credited, spent: totals.spent, balance: totals.balance },
    { credited: 1200, spent: 320, balance: 880 },
  );
  assert.deepEqual(
    { credited: projectA.credited, spent: projectA.spent, balance: projectA.balance },
    { credited: 1000, spent: 320, balance: 680 },
  );
  assert.equal(unassigned.balance, 200);
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

test('daily metrics use platform spend fields when supplied', async () => {
  const { mapSheetDailyMetrics } = await import('../src/ads-admin/data-source.ts');
  const { platformSeriesForDateRange } = await import('../src/ads-admin/metrics.ts');
  const [metric] = mapSheetDailyMetrics([{
    date: '2026-09-01', campaign_id: 'cmp_001', cost: '999',
    meta_spend: '10.25', google_spend: '$20', tiktok_spend: '5.50', kuai_spend: '4.25',
  }]);

  assert.deepEqual(metric.platformSpend, { meta: 10.25, google: 20, tiktok: 5.5, kuai: 4.25 });
  assert.equal(metric.spend, 40);
  const point = platformSeriesForDateRange([metric], '过去 7 天', new Date(2026, 8, 1, 12)).find(item => item.date === metric.date);
  assert.deepEqual(
    { meta: point.meta, google: point.google, tiktok: point.tiktok, kuai: point.kuai },
    metric.platformSpend,
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
