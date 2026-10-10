import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../public/participating-stalls.md', import.meta.url), 'utf8');
const listings = JSON.parse(readFileSync(new URL('../public/stalls.json', import.meta.url)));
test('every supplied stall and unit is preserved under its postal code', () => {
  let sections = 0, total = 0;
  const expected = {};
  for (const section of source.split(/^## /m).slice(1)) {
    const postal = section.match(/\*\*Postal code:\*\* (\d{6})/)?.[1];
    if (!postal) continue;
    sections++;
    expected[postal] ||= new Map();
    const rows = section.split('\n').filter(l => l.startsWith('| ') && !l.startsWith('| Stall / Merchant'));
    assert.equal(rows.length, Number(section.match(/\*\*Participating merchant listings:\*\* (\d+)/)[1]));
    for (const row of rows) {
      const [name, unit] = row.slice(1,-1).split('|').map(c => c.trim());
      expected[postal].set(JSON.stringify([name,unit]), {name,unit}); total++;
    }
  }
  assert.equal(sections,133);assert.equal(total,3955);
  assert.deepEqual(Object.keys(listings).sort(),Object.keys(expected).sort());
  for(const [postal,stalls] of Object.entries(expected)) assert.deepEqual(listings[postal].stalls,[...stalls.values()]);
  assert.equal(listings['560724'].names.length,2);
});
