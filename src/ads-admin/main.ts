import './style.css';
import { billingTotals, campaignBillingSummaries, UNASSIGNED_CAMPAIGN_ID } from './billing';
import { DEMO_STATE } from './demo-data';
import { loadSheetData } from './data-source';
import { campaignsForDateRange, dailySeriesForDateRange, filterDailyMetrics } from './metrics';
import {
  campaignCpa,
  campaignCpc,
  campaignCtr,
  createId,
  loadState,
  saveState,
} from './store';
import type { AdCreative, Campaign, CampaignObjective } from './store';

type ViewId = 'overview' | 'campaigns' | 'groups' | 'ads' | 'reports' | 'conversions' | 'billing';

type CampaignDraft = {
  objective: CampaignObjective;
  name: string;
  landingPage: string;
  startDate: string;
  endDate: string;
  dailyBudget: number;
  totalBudget: number;
  region: string;
  devices: string[];
  adGroupName: string;
  bid: number;
  headline: string;
  description: string;
  callToAction: string;
  imageDataUrl?: string;
};

const appElement = document.querySelector<HTMLDivElement>('#adsAdminApp');
if (!appElement) throw new Error('找不到广告后台应用容器');
const app = appElement;

const viewIds: ViewId[] = ['overview', 'campaigns', 'groups', 'ads', 'reports', 'conversions', 'billing'];
const navigation: Array<{ id: ViewId; label: string; icon: string }> = [
  { id: 'overview', label: '概览', icon: '▦' },
  { id: 'campaigns', label: '推广计划', icon: '◫' },
  { id: 'groups', label: '广告组', icon: '⌘' },
  { id: 'ads', label: '广告与素材', icon: '◇' },
  { id: 'reports', label: '报告', icon: '⌁' },
  { id: 'conversions', label: '转化目标', icon: '◎' },
  { id: 'billing', label: '结算中心', icon: '¥' },
];

let state = loadState(DEMO_STATE);
let campaignQuery = '';
let campaignStatus = '全部';
let selectedGroupCampaignId = '';
let billingCampaignFilter = 'all';
let wizardStep = 1;
let draft = createDraft();
let dataSourceStatus: 'loading' | 'remote' | 'fallback' = 'loading';
let activeSyncController: AbortController | undefined;

function createDraft(): CampaignDraft {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + 30);
  return {
    objective: '网站访问',
    name: '',
    landingPage: 'https://',
    startDate: today.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    dailyBudget: 100,
    totalBudget: 3000,
    region: '中国大陆',
    devices: ['桌面端', '移动端'],
    adGroupName: '默认广告组',
    bid: 0.5,
    headline: '',
    description: '',
    callToAction: '了解更多',
  };
}

function currentView(): ViewId {
  const hash = window.location.hash.replace('#', '') as ViewId;
  return viewIds.includes(hash) ? hash : 'overview';
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    投放中: 'success',
    审核通过: 'success',
    已启用: 'success',
    已入账: 'success',
    预算受限: 'warning',
    待处理: 'warning',
    审核中: 'info',
    未验证: 'warning',
    已暂停: 'muted',
    草稿: 'muted',
    已结束: 'muted',
    已作废: 'muted',
    审核未通过: 'danger',
  };
  return map[status] ?? 'muted';
}

function performanceCampaigns(): Campaign[] {
  return campaignsForDateRange(state.campaigns, state.dailyMetrics, state.preferences.dateRange);
}

function aggregate() {
  return performanceCampaigns().reduce((totals, campaign) => ({
    spend: totals.spend + campaign.spend,
    impressions: totals.impressions + campaign.impressions,
    clicks: totals.clicks + campaign.clicks,
    conversions: totals.conversions + campaign.conversions,
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
}

function balance(): number {
  return billingTotals(state.ledger).balance;
}

function ledgerStatusLabel(status: string): string {
  return ({ posted: '已入账', pending: '待处理', void: '已作废' } as Record<string, string>)[status] ?? status;
}

function ledgerTypeLabel(type: string): string {
  return ({ opening_balance: '初始余额', ad_spend: '广告消耗', credit: '入账', refund: '退款', adjustment: '调整' } as Record<string, string>)[type] ?? type;
}

function pageHeading(title: string, description: string, action = ''): string {
  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">SPARK ADS</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
      </div>
      ${action}
    </div>`;
}

function renderApp(): void {
  const view = currentView();
  app.innerHTML = `
    <div class="admin-shell">
      <aside class="sidebar" id="sidebar">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">S</span>
          <span><strong>星火推广</strong><small>广告管理后台</small></span>
        </div>
        <nav aria-label="后台主导航">
          ${navigation.map(item => `
            <a href="#${item.id}" class="nav-link ${view === item.id ? 'active' : ''}">
              <span class="nav-icon" aria-hidden="true">${item.icon}</span>${item.label}
            </a>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <button class="ghost-button sidebar-reset" type="button" data-action="sync-sheet" ${dataSourceStatus === 'loading' ? 'disabled' : ''}>↻ 同步 Google Sheet</button>
          <p>${dataSourceStatus === 'remote' ? '数据来自 Google Sheet' : '当前显示本地备用数据'}</p>
        </div>
      </aside>
      <button class="sidebar-scrim" type="button" data-action="close-menu" aria-label="关闭菜单"></button>
      <div class="workspace">
        <header class="topbar">
          <button class="menu-button" type="button" data-action="open-menu" aria-label="打开菜单">☰</button>
          <div class="account-switcher">
            <span class="account-avatar">星</span>
            <span><strong>星火演示账户</strong><small>账户 ID：DEMO-2026</small></span>
          </div>
          <div class="topbar-actions">
            <label class="date-select">报告周期
              <select id="dateRange" aria-label="报告周期">
                ${['今天', '过去 7 天', '过去 30 天', '本月'].map(range => (
                  `<option ${state.preferences.dateRange === range ? 'selected' : ''}>${range}</option>`
                )).join('')}
              </select>
            </label>
            <button class="icon-button" type="button" aria-label="帮助">?</button>
            <button class="icon-button notification" type="button" aria-label="通知">●</button>
          </div>
        </header>
        <main class="content" id="mainContent">
          ${renderView(view)}
        </main>
      </div>
    </div>
    <dialog class="campaign-dialog" id="campaignDialog" aria-labelledby="wizardTitle"></dialog>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

async function syncSheetData(showFeedback = false): Promise<void> {
  activeSyncController?.abort();
  const controller = new AbortController();
  activeSyncController = controller;
  dataSourceStatus = 'loading';
  renderApp();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);

  try {
    const remote = await loadSheetData(controller.signal);
    if (controller.signal.aborted) return;
    state = { ...state, campaigns: remote.campaigns, dailyMetrics: remote.dailyMetrics, ledger: remote.ledger };
    dataSourceStatus = 'remote';
    renderApp();
    if (showFeedback) showToast(`已同步 ${remote.campaigns.length} 个推广计划、${remote.dailyMetrics.length} 条每日数据和 ${remote.ledger.length} 条流水。`);
  } catch (error) {
    if (activeSyncController !== controller) return;
    dataSourceStatus = 'fallback';
    renderApp();
    if (showFeedback) {
      const message = error instanceof Error && error.name !== 'AbortError' ? error.message : 'Google Sheet API 请求超时';
      showToast(`${message}，已保留本地备用数据。`);
    }
  } finally {
    window.clearTimeout(timeout);
    if (activeSyncController === controller) activeSyncController = undefined;
  }
}

function renderView(view: ViewId): string {
  if (view === 'campaigns') return renderCampaigns();
  if (view === 'groups') return renderGroups();
  if (view === 'ads') return renderAds();
  if (view === 'reports') return renderReports();
  if (view === 'conversions') return renderConversions();
  if (view === 'billing') return renderBilling();
  return renderOverview();
}

function renderOverview(): string {
  const totals = aggregate();
  const ctr = totals.impressions ? totals.clicks / totals.impressions : 0;
  const cpc = totals.clicks ? totals.spend / totals.clicks : 0;
  const cpa = totals.conversions ? totals.spend / totals.conversions : 0;
  const active = performanceCampaigns().filter(campaign => campaign.status === '投放中' || campaign.status === '预算受限');
  return `
    ${pageHeading('账户概览', '快速了解推广效果、预算状态和需要处理的问题。', `
      <button class="primary-button" type="button" data-action="new-campaign">＋ 新建推广计划</button>`)}
    <section class="metric-grid" aria-label="账户核心指标">
      ${metricCard('可用余额', formatMoney(balance()), '', 'wallet')}
      ${metricCard('总消耗', formatMoney(totals.spend), '较上一周期 +12.8%', 'spend')}
      ${metricCard('展示量', formatNumber(totals.impressions), '覆盖全部推广计划', 'impressions')}
      ${metricCard('点击量', formatNumber(totals.clicks), `点击率 ${formatPercent(ctr)}`, 'clicks')}
      ${metricCard('平均 CPC', formatMoney(cpc), '每次有效点击成本', 'cpc')}
      ${metricCard('转化', formatNumber(totals.conversions), `平均成本 ${formatMoney(cpa)}`, 'conversions')}
    </section>
    <div class="dashboard-grid">
      <section class="panel chart-panel">
        <div class="panel-heading">
          <div><h2>消耗与点击趋势</h2><p>过去 7 天模拟数据</p></div>
          <span class="legend"><i></i> 消耗</span>
        </div>
        ${renderTrendChart()}
      </section>
      <section class="panel alerts-panel">
        <div class="panel-heading"><div><h2>优化提醒</h2><p>3 项需要关注</p></div></div>
        <ul class="alert-list">
          <li><span class="alert-icon warning">!</span><span><strong>蓝调口琴课程引流</strong><small>每日预算可能限制当前点击量</small></span><a href="#campaigns">查看</a></li>
          <li><span class="alert-icon info">i</span><span><strong>独立开发者合作招募</strong><small>素材正在演示审核中</small></span><a href="#ads">查看</a></li>
          <li><span class="alert-icon success">✓</span><span><strong>转化追踪已工作</strong><small>2 个转化目标收到演示数据</small></span><a href="#conversions">查看</a></li>
        </ul>
      </section>
    </div>
    <section class="panel">
      <div class="panel-heading">
        <div><h2>正在投放</h2><p>${active.length} 个推广计划正在消耗预算</p></div>
        <a class="text-link" href="#campaigns">查看全部 →</a>
      </div>
      ${campaignTable(active, true)}
    </section>`;
}

function metricCard(label: string, value: string, detail: string, tone: string): string {
  return `
    <article class="metric-card ${tone}">
      <span class="metric-label">${label}</span>
      <strong>${value}</strong>
      ${detail ? `<small>${detail}</small>` : ''}
    </article>`;
}

function renderTrendChart(): string {
  const series = dailySeriesForDateRange(state.dailyMetrics, state.preferences.dateRange);
  if (!series.some(point => point.spend || point.clicks || point.impressions || point.conversions)) {
    return `<div class="empty-state"><span>⌁</span><h3>当前周期暂无每日数据</h3><p>在 Google Sheet 的 daily_metrics 中添加该日期范围的数据后重新同步。</p></div>`;
  }
  const width = 680;
  const height = 220;
  const maxSpend = Math.max(1, ...series.map(point => point.spend));
  const xForIndex = (index: number) => series.length === 1 ? width / 2 : 24 + index * ((width - 48) / (series.length - 1));
  const points = series.map((point, index) => {
    const x = xForIndex(index);
    const y = height - 34 - (point.spend / maxSpend) * (height - 70);
    return `${x},${y}`;
  }).join(' ');
  const firstX = xForIndex(0);
  const lastX = xForIndex(series.length - 1);
  const labelStep = Math.max(1, Math.ceil(series.length / 7));
  return `
    <div class="trend-chart" role="img" aria-label="${escapeHtml(state.preferences.dateRange)}每日消耗趋势折线图">
      <svg viewBox="0 0 ${width} ${height}" aria-hidden="true">
        <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d5dfc" stop-opacity=".3"/><stop offset="1" stop-color="#6d5dfc" stop-opacity="0"/></linearGradient></defs>
        <line x1="24" y1="45" x2="656" y2="45"/><line x1="24" y1="105" x2="656" y2="105"/><line x1="24" y1="165" x2="656" y2="165"/>
        <polygon points="${firstX},186 ${points} ${lastX},186" fill="url(#chartFill)"/>
        <polyline points="${points}"/>
        ${series.map((point, index) => {
          const x = xForIndex(index);
          const y = height - 34 - (point.spend / maxSpend) * (height - 70);
          const label = `${Number(point.date.slice(5, 7))}/${Number(point.date.slice(8, 10))}`;
          const showLabel = index % labelStep === 0 || index === series.length - 1;
          return `<circle cx="${x}" cy="${y}" r="4"><title>${point.date}：${formatMoney(point.spend)}，${point.clicks} 次点击</title></circle>${showLabel ? `<text x="${x}" y="210">${label}</text>` : ''}`;
        }).join('')}
      </svg>
    </div>`;
}

function renderCampaigns(): string {
  const statuses = ['全部', '投放中', '预算受限', '审核中', '已暂停', '草稿', '已结束'];
  const filtered = performanceCampaigns().filter(campaign => {
    const queryMatches = !campaignQuery || campaign.name.toLocaleLowerCase('zh-CN').includes(campaignQuery.toLocaleLowerCase('zh-CN'));
    return queryMatches && (campaignStatus === '全部' || campaign.status === campaignStatus);
  });
  return `
    ${pageHeading('推广计划', '管理预算、状态、推广目标和投放表现。', `
      <button class="primary-button" type="button" data-action="new-campaign">＋ 新建推广计划</button>`)}
    <section class="panel table-panel">
      <form class="toolbar" id="campaignSearchForm">
        <label class="search-field"><span aria-hidden="true">⌕</span><input name="query" type="search" value="${escapeHtml(campaignQuery)}" placeholder="搜索推广计划" aria-label="搜索推广计划"></label>
        <label>状态
          <select id="campaignStatusFilter">
            ${statuses.map(status => `<option ${status === campaignStatus ? 'selected' : ''}>${status}</option>`).join('')}
          </select>
        </label>
        <button class="secondary-button" type="submit">筛选</button>
        <span class="result-count">${filtered.length} 个结果</span>
      </form>
      ${campaignTable(filtered, false)}
    </section>`;
}

function campaignTable(campaigns: Campaign[], compact: boolean): string {
  if (!campaigns.length) return `<div class="empty-state"><span>⌕</span><h3>没有符合条件的推广计划</h3><p>调整筛选条件，或创建新的推广计划。</p></div>`;
  return `
    <div class="table-scroll">
      <table class="data-table ${compact ? 'compact' : ''}">
        <thead><tr><th>状态</th><th>推广计划</th><th>每日预算</th><th>消耗</th><th>展示</th><th>点击</th><th>CTR</th><th>平均 CPC</th><th>转化</th>${compact ? '' : '<th>操作</th>'}</tr></thead>
        <tbody>
          ${campaigns.map(campaign => `
            <tr>
              <td><span class="status ${statusClass(campaign.status)}"><i></i>${campaign.status}</span></td>
              <td><strong class="campaign-name">${escapeHtml(campaign.name)}</strong><small>${campaign.objective} · ${escapeHtml(campaign.region)}</small></td>
              <td>${formatMoney(campaign.dailyBudget)}</td>
              <td>${formatMoney(campaign.spend)}</td>
              <td>${formatNumber(campaign.impressions)}</td>
              <td>${formatNumber(campaign.clicks)}</td>
              <td>${formatPercent(campaignCtr(campaign))}</td>
              <td>${formatMoney(campaignCpc(campaign))}</td>
              <td>${formatNumber(campaign.conversions)}</td>
              ${compact ? '' : `<td>${campaignActions(campaign)}</td>`}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function campaignActions(campaign: Campaign): string {
  const toggleable = ['投放中', '预算受限', '已暂停'].includes(campaign.status);
  return `<div class="row-actions">
    ${toggleable ? `<button type="button" data-action="toggle-campaign" data-id="${campaign.id}">${campaign.status === '已暂停' ? '启用' : '暂停'}</button>` : ''}
    <button type="button" data-action="copy-campaign" data-id="${campaign.id}">复制</button>
    ${campaign.status === '草稿' ? `<button class="danger-text" type="button" data-action="delete-campaign" data-id="${campaign.id}">删除</button>` : ''}
  </div>`;
}

function renderGroups(): string {
  const campaigns = performanceCampaigns();
  if (!campaigns.some(campaign => campaign.id === selectedGroupCampaignId)) {
    selectedGroupCampaignId = campaigns[0]?.id ?? '';
  }
  const campaign = campaigns.find(item => item.id === selectedGroupCampaignId);
  if (!campaign) {
    return `${pageHeading('广告组', '查看单个广告组在所选报告周期内的消耗与每日表现。')}
      <section class="panel empty-state"><span>⌘</span><h3>暂无广告组</h3><p>创建推广计划后将自动生成默认广告组。</p></section>`;
  }
  const dailyRows = filterDailyMetrics(state.dailyMetrics, state.preferences.dateRange)
    .filter(metric => metric.campaignId === campaign.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  return `
    ${pageHeading('广告组', '查看单个广告组在所选报告周期内的消耗与每日表现。')}
    <section class="panel table-panel">
      <div class="toolbar">
        <label>选择广告组
          <select id="groupCampaignSelect" aria-label="选择广告组">
            ${campaigns.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === campaign.id ? 'selected' : ''}>${escapeHtml(item.name)} · 默认组</option>`).join('')}
          </select>
        </label>
        <span class="result-count">所属推广计划：${escapeHtml(campaign.name)} · ${escapeHtml(campaign.region)} · ${campaign.devices.map(escapeHtml).join('、')}</span>
        <span class="status ${statusClass(campaign.status)}"><i></i>${campaign.status}</span>
      </div>
    </section>
    <section class="metric-grid" aria-label="广告组核心指标">
      ${metricCard('消耗', formatMoney(campaign.spend), state.preferences.dateRange, 'spend')}
      ${metricCard('展示量', formatNumber(campaign.impressions), '广告组展示次数', 'impressions')}
      ${metricCard('点击量', formatNumber(campaign.clicks), `点击率 ${formatPercent(campaignCtr(campaign))}`, 'clicks')}
      ${metricCard('平均 CPC', formatMoney(campaignCpc(campaign)), `最高 CPC ${formatMoney(campaign.bid)}`, 'cpc')}
      ${metricCard('转化', formatNumber(campaign.conversions), `平均成本 ${formatMoney(campaignCpa(campaign))}`, 'conversions')}
      ${metricCard('每日预算', formatMoney(campaign.dailyBudget), campaign.objective, 'wallet')}
    </section>
    <section class="panel table-panel">
      <div class="panel-heading"><div><h2>${escapeHtml(campaign.name)} · 默认组</h2><p>${state.preferences.dateRange}每日消耗明细</p></div></div>
      <div class="table-scroll"><table class="data-table">
        <thead><tr><th>日期</th><th>消耗</th><th>展示</th><th>点击</th><th>CTR</th><th>平均 CPC</th><th>转化</th></tr></thead>
        <tbody>${dailyRows.length ? dailyRows.map(metric => `
          <tr><td>${metric.date}</td><td>${formatMoney(metric.spend)}</td><td>${formatNumber(metric.impressions)}</td><td>${formatNumber(metric.clicks)}</td><td>${formatPercent(metric.impressions ? metric.clicks / metric.impressions : 0)}</td><td>${formatMoney(metric.clicks ? metric.spend / metric.clicks : 0)}</td><td>${formatNumber(metric.conversions)}</td></tr>`).join('') : '<tr><td colspan="7">当前周期暂无该广告组的每日数据</td></tr>'}</tbody>
      </table></div>
    </section>`;
}

function renderAds(): string {
  return `
    ${pageHeading('广告与素材', '查看素材审核状态以及不同广告格式的预览。', `
      <button class="primary-button" type="button" data-action="new-campaign">＋ 创建广告</button>`)}
    <div class="creative-grid">
      ${state.ads.map(ad => creativeCard(ad)).join('')}
      <article class="creative-card creative-placeholder">
        <button type="button" data-action="new-campaign"><span>＋</span><strong>创建新广告</strong><small>通过推广计划向导添加素材</small></button>
      </article>
    </div>
    <div class="storage-note panel"><strong>素材存储限制</strong><p>本演示版只支持内置图片或小于 800KB 的浏览器本地预览。尚未配置 Cloud Storage，图片不会上传到服务器。</p></div>`;
}

function creativeCard(ad: AdCreative): string {
  const campaign = state.campaigns.find(item => item.id === ad.campaignId);
  const visualStyle = ad.imageDataUrl ? `style="background-image:url('${ad.imageDataUrl}')"` : '';
  return `
    <article class="creative-card">
      <div class="creative-visual ${escapeHtml(ad.theme)}" ${visualStyle}><span>SPARK</span><b>${escapeHtml(ad.callToAction)}</b></div>
      <div class="creative-body">
        <div class="creative-meta"><span>${escapeHtml(ad.format)}</span><span class="status ${statusClass(ad.reviewStatus)}"><i></i>${ad.reviewStatus}</span></div>
        <h2>${escapeHtml(ad.headline)}</h2>
        <p>${escapeHtml(ad.description)}</p>
        <small>${escapeHtml(campaign?.name ?? '新推广计划')} · ${escapeHtml(ad.name)}</small>
      </div>
    </article>`;
}

function renderReports(): string {
  const totals = aggregate();
  return `
    ${pageHeading('推广报告', '比较推广计划表现并导出数据。', `
      <button class="secondary-button" type="button" data-action="export-report">↓ 导出 CSV</button>`)}
    <section class="report-summary panel">
      <div><span>总消耗</span><strong>${formatMoney(totals.spend)}</strong></div>
      <div><span>展示量</span><strong>${formatNumber(totals.impressions)}</strong></div>
      <div><span>点击量</span><strong>${formatNumber(totals.clicks)}</strong></div>
      <div><span>转化数</span><strong>${formatNumber(totals.conversions)}</strong></div>
    </section>
    <section class="panel chart-panel">
      <div class="panel-heading"><div><h2>账户趋势</h2><p>${state.preferences.dateRange}</p></div><span class="legend"><i></i> 消耗</span></div>
      ${renderTrendChart()}
    </section>
    <section class="panel table-panel">
      <div class="panel-heading"><div><h2>推广计划表现</h2><p>按消耗从高到低排列</p></div></div>
      <div class="table-scroll"><table class="data-table">
        <thead><tr><th>推广计划</th><th>消耗</th><th>展示</th><th>点击</th><th>CTR</th><th>平均 CPC</th><th>转化</th><th>转化成本</th></tr></thead>
        <tbody>${performanceCampaigns().sort((a, b) => b.spend - a.spend).map(campaign => `
          <tr><td><strong>${escapeHtml(campaign.name)}</strong><small>${campaign.objective}</small></td><td>${formatMoney(campaign.spend)}</td><td>${formatNumber(campaign.impressions)}</td><td>${formatNumber(campaign.clicks)}</td><td>${formatPercent(campaignCtr(campaign))}</td><td>${formatMoney(campaignCpc(campaign))}</td><td>${formatNumber(campaign.conversions)}</td><td>${formatMoney(campaignCpa(campaign))}</td></tr>`).join('')}</tbody>
      </table></div>
    </section>`;
}

function renderConversions(): string {
  return `
    ${pageHeading('转化目标', '定义广告点击后希望用户完成的关键动作。')}
    <div class="conversion-layout">
      <section class="panel table-panel">
        <div class="panel-heading"><div><h2>转化操作</h2><p>${state.conversionActions.length} 个目标</p></div></div>
        <div class="table-scroll"><table class="data-table"><thead><tr><th>名称</th><th>类别</th><th>状态</th><th>演示转化数</th></tr></thead><tbody>
          ${state.conversionActions.map(action => `<tr><td><strong>${escapeHtml(action.name)}</strong></td><td>${escapeHtml(action.category)}</td><td><span class="status ${statusClass(action.status)}"><i></i>${action.status}</span></td><td>${formatNumber(action.count)}</td></tr>`).join('')}
        </tbody></table></div>
      </section>
      <section class="panel conversion-form-panel">
        <h2>新建转化目标</h2><p>保存到当前浏览器，用于验证配置流程。</p>
        <form id="conversionForm" class="stacked-form">
          <label>目标名称<input name="name" required maxlength="40" placeholder="例如：完成注册"></label>
          <label>转化类别<select name="category"><option>注册</option><option>潜在客户</option><option>购买</option><option>下载</option><option>自定义事件</option></select></label>
          <button class="primary-button" type="submit">创建演示目标</button>
        </form>
      </section>
    </div>
    <section class="panel code-panel">
      <div><h2>追踪代码示例</h2><p>当前没有事件服务器，下面代码仅用于展示未来接入方式。</p></div>
      <pre><code>promotion.track('conversion', {
  action: 'signup',
  value: 1
});</code></pre>
    </section>`;
}

function renderBilling(): string {
  const campaignIds = new Set(state.campaigns.map(campaign => campaign.id));
  const hasUnassignedLedger = state.ledger.some(entry => !entry.campaignId || !campaignIds.has(entry.campaignId));
  if (billingCampaignFilter !== 'all' && billingCampaignFilter !== UNASSIGNED_CAMPAIGN_ID && !campaignIds.has(billingCampaignFilter)) {
    billingCampaignFilter = 'all';
  }
  const totals = billingTotals(state.ledger);
  const summaries = campaignBillingSummaries(state.campaigns, state.ledger);
  const unassigned = summaries.find(summary => summary.campaignId === UNASSIGNED_CAMPAIGN_ID);
  const fundedProjects = summaries.filter(summary => summary.campaignId !== UNASSIGNED_CAMPAIGN_ID && summary.transactionCount > 0).length;
  const filteredLedger = state.ledger.filter(entry => {
    if (billingCampaignFilter === 'all') return true;
    if (billingCampaignFilter === UNASSIGNED_CAMPAIGN_ID) return !entry.campaignId || !campaignIds.has(entry.campaignId);
    return entry.campaignId === billingCampaignFilter;
  });
  const campaignName = (campaignId?: string) => state.campaigns.find(campaign => campaign.id === campaignId)?.name ?? '未分配 / 账户级';
  return `
    ${pageHeading('结算中心', '查看账户余额和账务流水。')}
    <div class="billing-grid">
      <section class="balance-card">
        <span>可用余额</span><strong>${formatMoney(balance())}</strong>
        <button type="button" disabled>真实充值尚未开放</button>
      </section>
      <section class="panel billing-safety">
        <span class="shield">◇</span><div><h2>资金功能保持锁定</h2><p>现有静态 Hosting 无法安全处理充值、退款、原子扣费和发票。接入服务端账务系统前，页面不会收集任何支付信息。</p></div>
      </section>
    </div>
    <section class="report-summary panel">
      <div><span>累计入账</span><strong>${formatMoney(totals.credited)}</strong></div>
      <div><span>累计出账</span><strong>${formatMoney(totals.spent)}</strong></div>
      <div><span>已分配项目</span><strong>${formatNumber(fundedProjects)}</strong></div>
      <div><span>未分配余额</span><strong>${formatMoney(unassigned?.balance ?? 0)}</strong></div>
    </section>
    <section class="panel table-panel billing-projects">
      <div class="panel-heading"><div><h2>项目资金概览</h2><p>仅统计已入账的美元流水</p></div></div>
      <div class="table-scroll"><table class="data-table"><thead><tr><th>广告项目</th><th>累计入账</th><th>累计消耗</th><th>项目余额</th><th>已入账流水</th></tr></thead><tbody>
        ${summaries.map(summary => `<tr><td><strong>${escapeHtml(summary.campaignName)}</strong><small>${summary.campaignId === UNASSIGNED_CAMPAIGN_ID ? '未关联 campaign_id' : escapeHtml(summary.campaignId)}</small></td><td class="positive">+${formatMoney(summary.credited)}</td><td class="negative">-${formatMoney(summary.spent)}</td><td class="${summary.balance >= 0 ? 'positive' : 'negative'}">${formatMoney(summary.balance)}</td><td>${formatNumber(summary.transactionCount)}</td></tr>`).join('')}
      </tbody></table></div>
    </section>
    <section class="panel table-panel">
      <div class="panel-heading"><div><h2>流水</h2><p>${dataSourceStatus === 'remote' ? '流水数据来自 Google Sheet' : '当前显示本地备用流水'}</p></div></div>
      <div class="toolbar"><label>筛选广告项目
        <select id="billingCampaignFilter" aria-label="筛选广告项目">
          <option value="all">全部项目</option>
          ${state.campaigns.map(campaign => `<option value="${escapeHtml(campaign.id)}" ${billingCampaignFilter === campaign.id ? 'selected' : ''}>${escapeHtml(campaign.name)}</option>`).join('')}
          ${hasUnassignedLedger ? `<option value="${UNASSIGNED_CAMPAIGN_ID}" ${billingCampaignFilter === UNASSIGNED_CAMPAIGN_ID ? 'selected' : ''}>未分配 / 账户级</option>` : ''}
        </select>
      </label><span class="result-count">${filteredLedger.length} 条流水</span></div>
      <div class="table-scroll"><table class="data-table"><thead><tr><th>日期</th><th>广告项目</th><th>类型</th><th>说明</th><th>状态</th><th>金额</th></tr></thead><tbody>
        ${filteredLedger.length ? filteredLedger.map(entry => `<tr><td>${escapeHtml(entry.date)}</td><td>${escapeHtml(campaignName(entry.campaignId))}</td><td>${escapeHtml(ledgerTypeLabel(entry.type))}</td><td>${escapeHtml(entry.description)}</td><td><span class="status ${statusClass(ledgerStatusLabel(entry.status))}"><i></i>${ledgerStatusLabel(entry.status)}</span></td><td class="${entry.amount >= 0 ? 'positive' : 'negative'}">${entry.amount >= 0 ? '+' : ''}${formatMoney(entry.amount)}</td></tr>`).join('') : '<tr><td colspan="6">暂无流水</td></tr>'}
      </tbody></table></div>
    </section>`;
}

function openWizard(): void {
  draft = createDraft();
  wizardStep = 1;
  renderWizard();
  const dialog = document.querySelector<HTMLDialogElement>('#campaignDialog');
  dialog?.showModal();
}

function renderWizard(error = ''): void {
  const dialog = document.querySelector<HTMLDialogElement>('#campaignDialog');
  if (!dialog) return;
  const steps = ['推广目标', '基本信息', '预算周期', '目标受众', '广告组', '广告素材'];
  dialog.innerHTML = `
    <div class="wizard-shell">
      <aside class="wizard-sidebar">
        <span class="wizard-kicker">新建推广计划</span>
        <ol>${steps.map((step, index) => `<li class="${wizardStep === index + 1 ? 'active' : ''} ${wizardStep > index + 1 ? 'done' : ''}"><span>${wizardStep > index + 1 ? '✓' : index + 1}</span>${step}</li>`).join('')}</ol>
      </aside>
      <section class="wizard-content">
        <div class="wizard-heading"><div><small>步骤 ${wizardStep} / 6</small><h2 id="wizardTitle">${steps[wizardStep - 1]}</h2></div><button type="button" data-action="close-wizard" aria-label="关闭">×</button></div>
        <div class="wizard-body">${wizardStepContent()}</div>
        <p class="wizard-error" role="alert">${escapeHtml(error)}</p>
        <footer class="wizard-footer">
          <button class="secondary-button" type="button" data-action="wizard-back" ${wizardStep === 1 ? 'disabled' : ''}>上一步</button>
          ${wizardStep < 6 ? '<button class="primary-button" type="button" data-action="wizard-next">继续</button>' : '<button class="primary-button" type="button" data-action="wizard-save">保存并提交演示审核</button>'}
        </footer>
      </section>
    </div>`;
}

function wizardStepContent(): string {
  if (wizardStep === 1) {
    return `<div class="objective-grid">
      ${(['网站访问', '获取线索', '应用推广'] as CampaignObjective[]).map((objective, index) => `
        <label class="objective-card"><input type="radio" name="objective" value="${objective}" ${draft.objective === objective ? 'checked' : ''}><span class="objective-icon">${['↗', '✦', '▣'][index]}</span><strong>${objective}</strong><small>${['吸引用户访问指定落地页', '获取注册、咨询或表单提交', '推广游戏或应用体验'][index]}</small></label>`).join('')}
    </div>`;
  }
  if (wizardStep === 2) {
    return `<div class="wizard-form two-columns">
      <label class="full">推广计划名称<input id="draftName" value="${escapeHtml(draft.name)}" maxlength="50" placeholder="例如：九月新品推广"></label>
      <label class="full">落地页 URL<input id="draftLanding" type="url" value="${escapeHtml(draft.landingPage)}" placeholder="https://example.com/landing"></label>
      <div class="form-tip full"><strong>落地页检查</strong><span>正式版本将检查 HTTPS、可访问性和恶意跳转；当前只验证 URL 格式。</span></div>
    </div>`;
  }
  if (wizardStep === 3) {
    return `<div class="wizard-form two-columns">
      <label>开始日期<input id="draftStart" type="date" value="${draft.startDate}"></label>
      <label>结束日期<input id="draftEnd" type="date" value="${draft.endDate}"></label>
      <label>每日预算（元）<input id="draftDaily" type="number" min="10" step="1" value="${draft.dailyBudget}"></label>
      <label>总预算（元）<input id="draftTotal" type="number" min="10" step="1" value="${draft.totalBudget}"></label>
      <div class="budget-preview full"><span>预计最长投放</span><strong>${Math.max(1, Math.ceil(draft.totalBudget / draft.dailyBudget))} 天</strong><small>演示估算，不代表实际流量结果</small></div>
    </div>`;
  }
  if (wizardStep === 4) {
    return `<div class="wizard-form">
      <label>投放地域<select id="draftRegion"><option ${draft.region === '中国大陆' ? 'selected' : ''}>中国大陆</option><option ${draft.region === '全国重点城市' ? 'selected' : ''}>全国重点城市</option><option ${draft.region === '北京、上海、广州、深圳' ? 'selected' : ''}>北京、上海、广州、深圳</option></select></label>
      <fieldset><legend>设备</legend><div class="choice-row">${['桌面端', '移动端', 'Android', 'iOS'].map(device => `<label><input type="checkbox" name="device" value="${device}" ${draft.devices.includes(device) ? 'checked' : ''}>${device}</label>`).join('')}</div></fieldset>
      <fieldset><legend>投放时段</legend><div class="schedule-preview"><span>周一至周日</span><strong>全天投放</strong><small>第一版使用简化时段设置</small></div></fieldset>
    </div>`;
  }
  if (wizardStep === 5) {
    return `<div class="wizard-form two-columns">
      <label class="full">广告组名称<input id="draftGroup" value="${escapeHtml(draft.adGroupName)}" maxlength="40"></label>
      <label>最高 CPC（元）<input id="draftBid" type="number" min="0.1" step="0.01" value="${draft.bid}"></label>
      <div class="bid-card"><span>演示建议出价</span><strong>¥0.45 – ¥0.80</strong><small>基于模拟流量区间</small></div>
      <div class="form-tip full"><strong>计费说明</strong><span>当前不会参与真实竞价或产生扣费，设置仅保存为产品演示数据。</span></div>
    </div>`;
  }
  return `<div class="creative-editor">
    <div class="wizard-form">
      <label>广告标题<input id="draftHeadline" value="${escapeHtml(draft.headline)}" maxlength="35" placeholder="输入简洁有力的标题"></label>
      <label>广告描述<textarea id="draftDescription" maxlength="90" placeholder="介绍产品价值和行动理由">${escapeHtml(draft.description)}</textarea></label>
      <label>按钮文字<select id="draftCta">${['了解更多', '立即体验', '免费注册', '立即下载'].map(cta => `<option ${draft.callToAction === cta ? 'selected' : ''}>${cta}</option>`).join('')}</select></label>
      <label>本地素材预览<input id="draftImage" type="file" accept="image/png,image/jpeg,image/webp"><small>可选，小于 800KB，不会上传服务器</small></label>
    </div>
    <div class="live-preview"><span class="preview-label">原生卡片预览</span><div class="preview-image" ${draft.imageDataUrl ? `style="background-image:url('${draft.imageDataUrl}')"` : ''}><b>SPARK ADS</b></div><div><small>广告 · ${escapeHtml(draft.name || '新推广计划')}</small><strong>${escapeHtml(draft.headline || '你的广告标题将显示在这里')}</strong><p>${escapeHtml(draft.description || '补充广告描述，帮助用户了解推广内容。')}</p><button type="button">${escapeHtml(draft.callToAction)}</button></div></div>
  </div>`;
}

function collectWizardStep(): string {
  if (wizardStep === 1) {
    const selected = document.querySelector<HTMLInputElement>('input[name="objective"]:checked');
    if (!selected) return '请选择一个推广目标。';
    draft.objective = selected.value as CampaignObjective;
  }
  if (wizardStep === 2) {
    const name = document.querySelector<HTMLInputElement>('#draftName')?.value.trim() ?? '';
    const landing = document.querySelector<HTMLInputElement>('#draftLanding')?.value.trim() ?? '';
    if (name.length < 2) return '推广计划名称至少需要 2 个字符。';
    try {
      const url = new URL(landing);
      if (url.protocol !== 'https:') return '落地页必须使用 HTTPS。';
    } catch {
      return '请输入有效的落地页 URL。';
    }
    draft.name = name;
    draft.landingPage = landing;
  }
  if (wizardStep === 3) {
    draft.startDate = document.querySelector<HTMLInputElement>('#draftStart')?.value ?? '';
    draft.endDate = document.querySelector<HTMLInputElement>('#draftEnd')?.value ?? '';
    draft.dailyBudget = Number(document.querySelector<HTMLInputElement>('#draftDaily')?.value ?? 0);
    draft.totalBudget = Number(document.querySelector<HTMLInputElement>('#draftTotal')?.value ?? 0);
    if (!draft.startDate || !draft.endDate || draft.endDate < draft.startDate) return '结束日期不能早于开始日期。';
    if (draft.dailyBudget < 10 || draft.totalBudget < draft.dailyBudget) return '每日预算至少 10 元，总预算不能低于每日预算。';
  }
  if (wizardStep === 4) {
    draft.region = document.querySelector<HTMLSelectElement>('#draftRegion')?.value ?? '中国大陆';
    draft.devices = [...document.querySelectorAll<HTMLInputElement>('input[name="device"]:checked')].map(input => input.value);
    if (!draft.devices.length) return '请至少选择一种设备。';
  }
  if (wizardStep === 5) {
    draft.adGroupName = document.querySelector<HTMLInputElement>('#draftGroup')?.value.trim() ?? '';
    draft.bid = Number(document.querySelector<HTMLInputElement>('#draftBid')?.value ?? 0);
    if (!draft.adGroupName) return '请输入广告组名称。';
    if (draft.bid < 0.1) return '最高 CPC 不能低于 0.10 元。';
  }
  if (wizardStep === 6) {
    draft.headline = document.querySelector<HTMLInputElement>('#draftHeadline')?.value.trim() ?? '';
    draft.description = document.querySelector<HTMLTextAreaElement>('#draftDescription')?.value.trim() ?? '';
    draft.callToAction = document.querySelector<HTMLSelectElement>('#draftCta')?.value ?? '了解更多';
    if (draft.headline.length < 4) return '广告标题至少需要 4 个字符。';
    if (draft.description.length < 8) return '广告描述至少需要 8 个字符。';
  }
  return '';
}

function saveDraftCampaign(): void {
  const campaignId = createId('cmp');
  const campaign: Campaign = {
    id: campaignId,
    name: draft.name,
    objective: draft.objective,
    status: '审核中',
    dailyBudget: draft.dailyBudget,
    totalBudget: draft.totalBudget,
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    bid: draft.bid,
    startDate: draft.startDate,
    endDate: draft.endDate,
    region: draft.region,
    devices: draft.devices,
    updatedAt: new Date().toISOString(),
  };
  const ad: AdCreative = {
    id: createId('ad'),
    campaignId,
    name: `${draft.adGroupName}素材`,
    headline: draft.headline,
    description: draft.description,
    callToAction: draft.callToAction,
    format: '原生卡片',
    reviewStatus: '审核中',
    theme: 'cyan',
    imageDataUrl: draft.imageDataUrl,
  };
  state.campaigns.unshift(campaign);
  state.ads.unshift(ad);
  saveState(state);
  document.querySelector<HTMLDialogElement>('#campaignDialog')?.close();
  window.location.hash = 'campaigns';
  renderApp();
  showToast('推广计划已保存，并进入演示审核状态。');
}

function toggleCampaign(id: string): void {
  const campaign = state.campaigns.find(item => item.id === id);
  if (!campaign) return;
  campaign.status = campaign.status === '已暂停' ? '投放中' : '已暂停';
  campaign.updatedAt = new Date().toISOString();
  saveState(state);
  renderApp();
  showToast(`“${campaign.name}”已${campaign.status === '已暂停' ? '暂停' : '启用'}。`);
}

function copyCampaign(id: string): void {
  const campaign = state.campaigns.find(item => item.id === id);
  if (!campaign) return;
  const copy: Campaign = {
    ...structuredClone(campaign),
    id: createId('cmp'),
    name: `${campaign.name} - 副本`,
    status: '草稿',
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    updatedAt: new Date().toISOString(),
  };
  state.campaigns.unshift(copy);
  saveState(state);
  renderApp();
  showToast('已复制为新的草稿。');
}

function deleteCampaign(id: string): void {
  const campaign = state.campaigns.find(item => item.id === id);
  if (!campaign || campaign.status !== '草稿') return;
  if (!window.confirm(`删除草稿“${campaign.name}”？此操作只影响当前浏览器。`)) return;
  state.campaigns = state.campaigns.filter(item => item.id !== id);
  state.ads = state.ads.filter(ad => ad.campaignId !== id);
  saveState(state);
  renderApp();
  showToast('草稿已删除。');
}

function exportReport(): void {
  const headers = ['推广计划', '状态', '目标', '消耗', '展示', '点击', 'CTR', '平均CPC', '转化'];
  const rows = performanceCampaigns().map(campaign => [
    campaign.name,
    campaign.status,
    campaign.objective,
    campaign.spend.toFixed(2),
    campaign.impressions,
    campaign.clicks,
    formatPercent(campaignCtr(campaign)),
    campaignCpc(campaign).toFixed(2),
    campaign.conversions,
  ]);
  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'spark-ads-report.csv';
  link.click();
  URL.revokeObjectURL(url);
  showToast('报告已导出。');
}

function showToast(message: string): void {
  const toast = document.querySelector<HTMLDivElement>('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
}

document.addEventListener('click', event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id ?? '';
  if (action === 'open-menu') document.body.classList.add('menu-open');
  if (action === 'close-menu') document.body.classList.remove('menu-open');
  if (action === 'new-campaign') openWizard();
  if (action === 'close-wizard') document.querySelector<HTMLDialogElement>('#campaignDialog')?.close();
  if (action === 'wizard-back' && wizardStep > 1) {
    collectWizardStep();
    wizardStep -= 1;
    renderWizard();
  }
  if (action === 'wizard-next') {
    const error = collectWizardStep();
    if (error) renderWizard(error);
    else {
      wizardStep += 1;
      renderWizard();
    }
  }
  if (action === 'wizard-save') {
    const error = collectWizardStep();
    if (error) renderWizard(error);
    else saveDraftCampaign();
  }
  if (action === 'toggle-campaign') toggleCampaign(id);
  if (action === 'copy-campaign') copyCampaign(id);
  if (action === 'delete-campaign') deleteCampaign(id);
  if (action === 'export-report') exportReport();
  if (action === 'sync-sheet') void syncSheetData(true);
});

document.addEventListener('submit', event => {
  const form = event.target as HTMLFormElement;
  if (form.id === 'campaignSearchForm') {
    event.preventDefault();
    campaignQuery = new FormData(form).get('query')?.toString().trim() ?? '';
    campaignStatus = document.querySelector<HTMLSelectElement>('#campaignStatusFilter')?.value ?? '全部';
    renderApp();
  }
  if (form.id === 'conversionForm') {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get('name')?.toString().trim() ?? '';
    const category = data.get('category')?.toString() ?? '自定义事件';
    if (!name) return;
    state.conversionActions.unshift({ id: createId('conv'), name, category, status: '未验证', count: 0 });
    saveState(state);
    renderApp();
    showToast('演示转化目标已创建。');
  }
});

document.addEventListener('change', event => {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  if (target.id === 'dateRange') {
    state.preferences.dateRange = target.value;
    saveState(state);
    renderApp();
  }
  if (target.id === 'groupCampaignSelect') {
    selectedGroupCampaignId = target.value;
    renderApp();
  }
  if (target.id === 'billingCampaignFilter') {
    billingCampaignFilter = target.value;
    renderApp();
  }
  if (target.id === 'draftImage' && target instanceof HTMLInputElement && target.files?.[0]) {
    const file = target.files[0];
    if (file.size > 800 * 1024) {
      renderWizard('图片必须小于 800KB，以免超过浏览器本地存储限制。');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      draft.imageDataUrl = reader.result?.toString();
      renderWizard();
    });
    reader.readAsDataURL(file);
  }
});

window.addEventListener('hashchange', () => {
  document.body.classList.remove('menu-open');
  renderApp();
});

renderApp();
void syncSheetData();
