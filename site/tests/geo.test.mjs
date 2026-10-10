import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { distanceKm, filterVendors } from '../src/geo.js';
const vendors = JSON.parse(readFileSync(new URL('../public/vendors.json', import.meta.url)));
test('every supplied location has a postal-matched Singapore coordinate', () => {
  const source = readFileSync(new URL('../public/supported-hawkers.md', import.meta.url), 'utf8').trim().split('\n').slice(2).map(line => line.split('|').slice(1,4).map(s => s.trim()));
  assert.equal(vendors.length, source.length);
  assert.equal(new Set(vendors.map(v => v.id)).size, source.length);
  for (const [name, address, postal] of source) {
    const v = vendors.find(v => v.postal === postal);
    assert.equal(v?.name, name); assert.equal(v.address, address);
    assert.ok(v.lat > 1.2 && v.lat < 1.5 && v.lng > 103.6 && v.lng < 104.1);
    assert.ok(v.geocodedAddress.includes(postal));
  }
});
test('distance uses great-circle kilometres', () => {
  assert.equal(distanceKm({lat:1,lng:103},{lat:1,lng:103}), 0);
  assert.ok(Math.abs(distanceKm({lat:0,lng:0},{lat:1,lng:0}) - 111.195) < .01);
});
test('search supports case, whitespace, postal codes and multiword addresses', () => {
  assert.equal(filterVendors(vendors,'  MAXWELL  ')[0].name, 'Amoy Street Food Centre');
  assert.equal(filterVendors(vendors,'069184')[0].name, 'Maxwell Food Centre');
  assert.ok(filterVendors(vendors,'bedok north').every(v => /bedok north/i.test(v.address)));
  assert.equal(filterVendors(vendors,'nonexistent123').length,0);
});
test('nearby results are ordered and radius-filtered without modifying source', () => {
  const origin = vendors.find(v => v.postal === '069184');
  const rows = filterVendors(vendors,'',origin,'1');
  assert.equal(rows[0].postal, origin.postal);
  assert.equal(rows[0].distance,0);
  assert.ok(rows.every((v,i) => v.distance <= 1 && (!i || v.distance >= rows[i-1].distance)));
  assert.ok(!('distance' in vendors[0]));
});
