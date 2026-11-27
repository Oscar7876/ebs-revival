import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import app, { GenesisWorld } from '../src/genesis-entry.js';

const urls = [
  '/api/genesis/meta', '/api/genesis/state', '/api/genesis/join',
  '/api/genesis/action', '/api/genesis/anything',
  '/genesis', '/genesis/', '/genesis.html',
  '/genesis-v094.js', '/genesis-v094.css'
];
for (const path of urls) {
  for (const method of ['GET', 'POST']) {
    const r = await app.fetch(new Request('https://example.com' + path, { method }), {}, {});
    assert.equal(r.status, 503, path + ' ' + method);
    assert.equal(r.headers.get('x-genesis-status'), 'offline');
    assert.match(r.headers.get('cache-control') || '', /no-store/);
    if (path.startsWith('/api/')) {
      assert.equal((await r.json()).code, 'GENESIS_DISABLED');
    } else {
      assert.match(await r.text(), /暫停開放/);
    }
  }
}
let alarmCancels = 0;
const storage = { deleteAlarm: async () => { alarmCancels++; } };
let gate;
const ctx = {
  storage,
  blockConcurrencyWhile(fn) { gate = fn(); return gate; }
};
const world = new GenesisWorld(ctx, {});
await gate;
assert.equal(alarmCancels, 1, 'existing alarm must be cancelled on init');
await world.alarm();
assert.equal(alarmCancels, 2, 'alarm must never tick simulation');
const blocked = await world.fetch(new Request('https://genesis.internal/action', { method: 'POST' }));
assert.equal(blocked.status, 503);
assert.equal(alarmCancels, 3);
const html = await readFile(new URL('../public/genesis.html', import.meta.url), 'utf8');
assert.ok(!/<script\b/i.test(html), 'offline Genesis page cannot load game scripts');
assert.match(html, /暫停開放/);
const main = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
assert.ok(!/<a[^>]+href=["']\/genesis\.html["']/i.test(main), 'main world must not link to disabled Genesis');
const wrangler = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
assert.ok(wrangler.assets.run_worker_first.includes('/genesis*'));
assert.equal(wrangler.durable_objects.bindings.find(x => x.name === 'GENESIS')?.class_name, 'GenesisWorld');
console.log('GENESIS_OFFLINE_OK: all public routes blocked, background alarms cancelled, data binding retained');
