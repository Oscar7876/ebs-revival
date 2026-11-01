import { MECHS } from './catalog.js';
import { EXTRA_MECHS } from './catalog-v07-extra.js';
for(const m of EXTRA_MECHS){if(!MECHS.some(x=>x.id===m.id))MECHS.push(m);}
export { GenesisWorld } from './genesis-v07.js';
