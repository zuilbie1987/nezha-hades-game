import type { Campaign, LedgerEntry } from './store';

export const UNASSIGNED_CAMPAIGN_ID = '__unassigned__';

export type BillingTotals = {
  credited: number;
  spent: number;
  balance: number;
  transactionCount: number;
};

export type CampaignBillingSummary = BillingTotals & {
  campaignId: string;
  campaignName: string;
};

function emptyTotals(): BillingTotals {
  return { credited: 0, spent: 0, balance: 0, transactionCount: 0 };
}

function postedUsdEntries(ledger: LedgerEntry[]): LedgerEntry[] {
  return ledger.filter(entry => entry.status === 'posted' && entry.currency === 'USD');
}

function addEntry(totals: BillingTotals, entry: LedgerEntry): void {
  if (entry.amount >= 0) totals.credited += entry.amount;
  else totals.spent += Math.abs(entry.amount);
  totals.balance += entry.amount;
  totals.transactionCount += 1;
}

export function billingTotals(ledger: LedgerEntry[]): BillingTotals {
  const totals = emptyTotals();
  postedUsdEntries(ledger).forEach(entry => addEntry(totals, entry));
  return totals;
}

export function campaignBillingSummaries(campaigns: Campaign[], ledger: LedgerEntry[]): CampaignBillingSummary[] {
  const campaignNames = new Map(campaigns.map(campaign => [campaign.id, campaign.name]));
  const summaries = new Map<string, CampaignBillingSummary>(campaigns.map(campaign => [campaign.id, {
    campaignId: campaign.id,
    campaignName: campaign.name,
    ...emptyTotals(),
  }]));

  postedUsdEntries(ledger).forEach(entry => {
    const campaignId = entry.campaignId && campaignNames.has(entry.campaignId) ? entry.campaignId : UNASSIGNED_CAMPAIGN_ID;
    const summary = summaries.get(campaignId) ?? {
      campaignId,
      campaignName: '未分配 / 账户级',
      ...emptyTotals(),
    };
    addEntry(summary, entry);
    summaries.set(campaignId, summary);
  });

  return [...summaries.values()].sort((a, b) => {
    if (a.campaignId === UNASSIGNED_CAMPAIGN_ID) return 1;
    if (b.campaignId === UNASSIGNED_CAMPAIGN_ID) return -1;
    return b.spent - a.spent || a.campaignName.localeCompare(b.campaignName, 'zh-CN');
  });
}
