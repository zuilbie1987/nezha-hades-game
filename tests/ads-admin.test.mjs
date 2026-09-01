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

test('ads admin demo stays within static hosting capabilities', async () => {
  const [main, store, demoData] = await Promise.all([
    readFile(new URL('src/ads-admin/main.ts', projectRoot), 'utf8'),
    readFile(new URL('src/ads-admin/store.ts', projectRoot), 'utf8'),
    readFile(new URL('src/ads-admin/demo-data.ts', projectRoot), 'utf8'),
  ]);

  assert.match(store, /const STORAGE_KEY = 'adsAdmin:v1'/);
  assert.match(store, /schemaVersion: 1/);
  assert.match(main, /当前页面使用模拟数据与本地存储/);
  assert.match(main, /真实充值尚未开放/);
  assert.match(main, /不会参与真实竞价或产生扣费/);
  assert.match(main, /步骤 \$\{wizardStep\} \/ 6/);
  assert.match(main, /exportReport/);
  assert.match(demoData, /status: '预算受限'/);
  assert.match(demoData, /conversionActions/);
});
