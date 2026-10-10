import { test, expect } from '@playwright/test';
const ready = async page => { await page.goto('/'); await expect(page.locator('#result-count')).toContainText('121 locations'); };
test('overview, search, selection, directions and reset', async ({ page }) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await ready(page);
  await expect(page.locator('.result')).toHaveCount(121);
  await expect(page.locator('.cluster-marker').first()).toBeVisible();
  await page.locator('#search').fill('069184');
  await expect(page.locator('.result')).toHaveCount(1);
  await page.locator('.result').click();
  await expect(page.locator('.leaflet-popup-content')).toContainText('Maxwell Food Centre');
  await expect(page.getByRole('link',{name:'Get directions'})).toHaveAttribute('href', /google.com\/maps\/dir\/.*069184/);
  await page.locator('#search').fill('no such location');
  await expect(page.getByText('No matching locations')).toBeVisible();
  await expect(page.locator('.leaflet-popup')).toHaveCount(0);
  await page.getByRole('button',{name:'Clear filters'}).click();
  await expect(page.locator('.result')).toHaveCount(121);
  expect(errors).toEqual([]);
});
test('real geolocation permission flow sorts by distance and filters radius', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:1.2803,longitude:103.8447,accuracy:20});
  await ready(page); await page.locator('#locate').click();
  await expect(page.locator('#location-status')).toContainText('GPS accuracy ±20 m');
  await expect(page.locator('.result').first()).toContainText('Maxwell Food Centre');
  await page.locator('#radius').selectOption('1');
  const count=await page.locator('.result').count(); expect(count).toBeGreaterThan(1);expect(count).toBeLessThan(20);
  await page.locator('.result').first().click();
  await expect(page.locator('.leaflet-popup-content')).toContainText('straight-line distance');
  await page.locator('#overview').click();
  await expect(page.locator('.result')).toHaveCount(121); await expect(page.locator('#radius')).toBeDisabled();
});
test('denied and timed-out locations recover and manual location works', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:(ok,fail)=>fail({code:1})},configurable:true}); });
  await ready(page); await page.locator('#locate').click();
  await expect(page.locator('#location-status')).toContainText('Location access denied');
  await expect(page.locator('#locate')).toBeEnabled();
  await page.locator('#pick-location').click();
  await page.locator('#map').click({position:{x:150,y:200}});
  await expect(page.locator('#location-status')).toContainText('chosen point');
  await expect(page.locator('#sort-label')).toHaveText('Nearest first');
  await page.evaluate(()=>Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:(ok,fail)=>fail({code:3})},configurable:true}));
  await page.locator('#locate').click(); await expect(page.locator('#location-status')).toContainText('timed out');
});
test('mobile map, search, modal keyboard dismissal and no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});await ready(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#search').fill('chinatown');await page.locator('.result').click();
  await expect(page.locator('.leaflet-popup-content')).toContainText('Chinatown');
  await page.locator('#about-button').click();await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.locator('dialog')).not.toBeVisible();
  await page.locator('.leaflet-popup-close-button').click();
  await expect(page.locator('.map-toolbar')).toBeVisible();
  await page.locator('#overview').click();
  await page.waitForTimeout(600);
  await page.screenshot({path:'test-results/mobile.png',fullPage:true});
});
test('data loading failure provides retry', async ({ page }) => {
  await page.route('**/vendors.json',r=>r.abort());await page.goto('/');
  await expect(page.locator('#result-count')).toContainText('Couldn’t load');
  await expect(page.getByRole('button',{name:'Try again'})).toBeVisible();
});
test('tile failure preserves searchable map pins', async ({ page }) => {
  await page.route('**/tile.openstreetmap.org/**',r=>r.abort());await ready(page);
  await expect(page.locator('#map-error')).toBeVisible();
  await page.locator('#search').fill('069184');await page.locator('.result').click();
  await expect(page.locator('.leaflet-popup-content')).toContainText('Maxwell');
});
test('desktop screenshot with actual map tiles', async ({ page }) => {
  await page.setViewportSize({width:1440,height:1000});await ready(page);
  await expect.poll(()=>page.locator('.leaflet-tile-loaded').count()).toBeGreaterThan(0);
  await page.waitForTimeout(600);
  await page.screenshot({path:'test-results/desktop.png',fullPage:true});
});

test('clusters expand, map zooms and drags, overview restores the island', async ({ page }) => {
  await ready(page);
  const tileZoom = () => page.locator('.leaflet-tile').evaluateAll(tiles => Math.max(...tiles.map(tile => Number(tile.src.match(/\/(\d+)\/\d+\/\d+\.png/)?.[1] || 0))));
  const before = await tileZoom();
  await page.locator('.cluster-marker').first().click();
  await expect.poll(tileZoom).toBeGreaterThan(before);
  await page.getByRole('button',{name:'Zoom in', exact:true}).click();
  const pane=page.locator('.leaflet-map-pane');
  await expect(pane).not.toHaveClass(/leaflet-zoom-anim/);
  await expect(pane).not.toHaveClass(/leaflet-cluster-anim/);
  const transform=await pane.getAttribute('style');
  const box=await page.locator('#map').boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();await page.mouse.move(box.x+box.width/2+100,box.y+box.height/2+70,{steps:10});await page.mouse.up();
  await expect(pane).not.toHaveAttribute('style',transform);
  await page.locator('#overview').click();await expect(page.locator('.result')).toHaveCount(121);
});
test('overview ignores a late location response', async ({page}) => {
  await page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:ok=>{window.finishGPS=()=>ok({coords:{latitude:1.2803,longitude:103.8447,accuracy:20}});}}}));
  await ready(page);await page.locator('#locate').click();await page.locator('#overview').click();
  await page.evaluate(()=>window.finishGPS());
  await expect(page.locator('#sort-label')).toHaveText('A–Z');await expect(page.locator('#locate')).toBeEnabled();
});

test('hover opens every stall, list stays scrollable, and click keeps it open', async ({page}) => {
  await ready(page);
  await page.locator('#search').fill('160112');
  const marker=page.locator('.vendor-icon');
  await marker.hover();
  const popup=page.locator('.leaflet-popup-content');
  await expect(popup).toContainText('17 participating listings');
  await expect(popup.locator('.stall-list li')).toHaveCount(17);
  await expect(popup).toContainText('112 COFFEE STALL');
  await expect(popup).toContainText('#01-14');
  await page.locator('.stall-scroll').hover();
  await page.mouse.wheel(0,600);
  await expect(popup).toBeVisible();
  await expect.poll(()=>page.locator('.stall-scroll').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
  await page.locator('#search').hover();
  await expect(popup).not.toBeVisible();
  await marker.click();
  await page.locator('#search').hover();
  await expect(popup).toBeVisible();
  await page.locator('#search').fill('642221');
  await page.locator('.result').click();
  await expect(page.locator('.stall-list li').filter({hasText:'BOON LAY BONELESS DUCK NOODLES'}).locator('.stall-unit')).toHaveText('#01-140');
});

test('tap displays full stall list, and unavailable listings are explicit', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await ready(page);
  await page.locator('#search').fill('069184');await page.locator('.result').click();
  await expect(page.locator('.stall-list li')).toHaveCount(48);
  await expect(page.locator('.map-toolbar')).not.toBeVisible();
  await page.locator('#search').fill('650469');await page.locator('.result').click();
  await expect(page.locator('.stall-empty')).toContainText('No stalls are listed');
  await page.locator('#search').fill('640493');await page.locator('.result').click();
  await expect(page.locator('.stall-empty')).toHaveCount(1);
  await expect(page.locator('.stall-empty')).toContainText('no entry');
});

test('stall-data loading failure offers retry', async ({page}) => {
  await page.route('**/stalls.json',r=>r.abort());await page.goto('/');
  await expect(page.locator('#result-count')).toContainText('Couldn’t load');
  await expect(page.getByRole('button',{name:'Try again'})).toBeVisible();
});
