const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aI1sAAAAASUVORK5CYII=', 'base64');

test.beforeEach(async ({page}) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});
async function mockMapResources(page) {
  await page.route('https://unpkg.com/leaflet@1.9.4/dist/*', route => {
    const file = route.request().url().endsWith('.css') ? 'leaflet.css' : 'leaflet.js';
    return route.fulfill({body:fs.readFileSync(require.resolve('leaflet/dist/' + file)), contentType:file.endsWith('.css') ? 'text/css' : 'text/javascript', headers:{'Access-Control-Allow-Origin':'*'}});
  });
  await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({body:png, contentType:'image/png'}));
}
async function setData(page, data) {
  await page.route('**/data.js', route => route.fulfill({contentType:'text/javascript', body:'window.OWS_DATA = ' + JSON.stringify(data) + ';'}));
}

test('list works without contacting map providers until requested', async ({page}) => {
  const external = []; page.on('request', request => {if (new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url());});
  await page.goto('/');
  await expect(page.locator('#area-list li')).toHaveCount(14);
  await expect(page.locator('#map')).toBeHidden();
  await expect(page.getByRole('button', {name:'Load interactive map'})).toBeEnabled();
  expect(external).toEqual([]);
  await expect(page.locator('.intro')).toContainText('not official county boundaries');
});
test('real Leaflet renders all reference markers and fits them in the view', async ({page}) => {
  await mockMapResources(page); await page.goto('/'); await page.getByRole('button', {name:'Load interactive map'}).click();
  await expect(page.locator('#map-status')).toContainText('Interactive map loaded');
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(14);
  const inside = await page.locator('#map').evaluate(map => {
    const host = map.getBoundingClientRect();
    return [...map.querySelectorAll('.leaflet-marker-icon')].every(marker => {const r=marker.getBoundingClientRect(); return r.left>=host.left && r.right<=host.right && r.top>=host.top && r.bottom<=host.bottom;});
  });
  expect(inside).toBe(true);
  await page.getByRole('button', {name:'Lone Camp vicinity', exact:true}).press('Enter');
  await expect(page.locator('.leaflet-popup-content')).toContainText('not an office');
});
test('configured markup stays inert in the list and Leaflet popup', async ({page}) => {
  const name = '<img src=x onerror=window.__injected=true>';
  await setData(page, {towns:[{name,lat:32.7,lon:-98.3}]}); await mockMapResources(page);
  await page.goto('/'); await page.getByRole('button', {name:'Load interactive map'}).click();
  await page.locator('.leaflet-marker-icon').click();
  await expect(page.locator('.leaflet-popup-content')).toContainText(name);
  await expect(page.locator('.leaflet-popup-content img, #area-list img')).toHaveCount(0);
  expect(await page.evaluate(() => window.__injected)).toBeUndefined();
});
test('invalid and empty configurations show a useful error without initializing a map', async ({page}) => {
  await setData(page, {towns:[{name:'Invalid',lat:1000,lon:-98}]}); await page.goto('/');
  await expect(page.locator('#map-status')).toContainText('invalid'); await expect(page.locator('#load-map')).toBeDisabled();
  await setData(page, {}); await page.reload();
  await expect(page.locator('#map-status')).toContainText('No map locations'); await expect(page.locator('#load-map')).toBeDisabled();
});
test('library failure preserves list and permits retry', async ({page}) => {
  await page.goto('/'); await page.getByRole('button', {name:'Load interactive map'}).click();
  await expect(page.locator('#map-status')).toContainText('could not load'); await expect(page.locator('#area-list li')).toHaveCount(14);
  await mockMapResources(page); await page.getByRole('button', {name:'Load interactive map'}).click();
  await expect(page.locator('#map-status')).toContainText('Interactive map loaded');
});
test('base-map tile errors are visible while markers remain usable', async ({page}) => {
  await mockMapResources(page); await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  await page.goto('/'); await page.getByRole('button', {name:'Load interactive map'}).click();
  await expect(page.locator('#map-status')).toContainText('tiles could not load');
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(14);
});
test('mobile map and fallback list fit the viewport', async ({page}) => {
  await page.setViewportSize({width:390,height:844}); await mockMapResources(page);
  await page.goto('/'); await page.getByRole('button', {name:'Load interactive map'}).click();
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(14);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({path:'output/playwright/map-mobile.png', fullPage:true});
});
