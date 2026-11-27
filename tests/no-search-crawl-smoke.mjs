import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const get = name => readFile(new URL('../public/' + name, import.meta.url), 'utf8');
const robots = await get('robots.txt');
assert.match(robots, /^User-agent:\s*\*$/m);
assert.match(robots, /^Disallow:\s*\/$/m);
const headers = await get('_headers');
assert.match(headers, /^\/\*$/m, 'all static URL paths must be covered');
assert.match(headers, /^\s*X-Robots-Tag:\s*noindex, nofollow, noimageindex, nosnippet$/m);
for (const name of ['index.html', 'admin.html', 'genesis.html']) {
  const html = await get(name);
  assert.match(html, /<meta\s+name="robots"\s+content="[^"]*noindex[^"]*nofollow[^"]*">/i, name + ': missing indexing opt-out');
}
const cfg=JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url),'utf8'));
assert.equal(cfg.assets.directory, './public');
assert.ok(Array.isArray(cfg.assets.run_worker_first));
console.log('SEARCH_CRAWL_PAUSE_OK: robots.txt + static response headers + 3 HTML page metas');
