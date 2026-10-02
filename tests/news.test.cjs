const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const robots = fs.readFileSync(path.join(__dirname, '..', 'robots.txt'), 'utf8');
const sitemap = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(m => !m[1].includes('application/ld+json'))
  .map(m => m[2]);
for (const script of scripts) new vm.Script(script);
const elements = {};
const document = {
  addEventListener() {},
  querySelectorAll() { return []; },
  getElementById(id) {
    return elements[id] ||= { innerHTML: '', classList: { remove() {} } };
  }
};
const ctx = vm.createContext({ document, console });
const app = scripts.find(s => s.includes('const APP_DATA'));
vm.runInContext(app + '\nthis.stories = APP_DATA.stories; this.keyCountyRaces = APP_DATA.keyCountyRaces;', ctx);
const ids = ['hero-1', 'hidalgo-20260919', 'pensilvania-20260919', 'gwinnett-20260919', 'machado-20260919'];
for (const id of ids) {
  const story = ctx.stories[id];
  assert.equal(story.date, '2026-09-19');
  assert.equal(story.author, 'Correo USA');
  assert.ok(story.content.length > 400);
  assert.ok(story.image.startsWith('https://i.imgur.com/'));
  ctx.openStoryModal(id);
  assert.ok(elements['modal-content'].innerHTML.includes(story.title));
  assert.ok(elements['modal-content'].innerHTML.includes(story.content));
  assert.ok(elements['modal-content'].innerHTML.includes('19/09/2026'));
  assert.ok(elements['modal-content'].innerHTML.includes(story.location));
  assert.ok(elements['modal-content'].innerHTML.includes('Por Correo USA'));
  assert.ok(!elements['modal-content'].innerHTML.includes('Correo USA • Correo USA'));
}
ctx.renderLatestNews();
assert.equal((elements['latest-news-grid'].innerHTML.match(/<article /g) || []).length, 4);
assert.ok(/\.editorial-face-safe\s*\{\s*object-fit: cover/.test(html));
assert.ok(/\.editorial-face-safe-secondary\s*\{\s*object-fit: cover/.test(html));
assert.ok(/\.editorial-article-full\s*\{\s*object-fit: contain/.test(html));
assert.ok(!/\.editorial-article-full[\s\S]{0,200}background:\s*#0D1B3D/.test(html));
assert.ok(!html.includes('Florida vota este martes:'));
assert.equal(ctx.escapeNewsText('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
console.log('PASS: syntax, 5 full articles, dates, locations, 4 cards, escaping and face-safe image rules.');

const newIds = ['hero-2', 'hot-1', 'hot-2', 'hot-3', 'florida-agenda', 'registro-electoral', 'salsa-cultura'];
for (const id of newIds) {
  const story = ctx.stories[id];
  assert.equal(story.date, '2026-09-20');
  assert.equal(story.author, 'Correo USA');
  assert.ok(story.sources.length);
  ctx.openStoryModal(id);
  for (const source of story.sources) {
    assert.equal(new URL(source.url).protocol, 'https:');
    assert.ok(elements['modal-content'].innerHTML.includes(source.url));
  }
}
for (const [date, expected] of [
  ['2026-09-20T16:00:00Z', 44],
  ['2026-09-20T03:59:59Z', 45],
  ['2026-09-20T04:00:00Z', 44],
  ['2026-11-01T04:00:00Z', 2],
  ['2026-11-02T05:00:00Z', 1],
  ['2026-11-03T05:00:00Z', 0],
  ['2026-11-04T05:00:00Z', -1]
]) {
  assert.equal(ctx.electionDaysRemaining(new Date(date)), expected, date);
  ctx.initElectionCountdown(new Date(date));
  assert.equal(elements['home-election-countdown'].textContent, Math.max(0, expected));
  assert.equal(elements['election-countdown'].textContent, Math.max(0, expected));
}
for (const obsolete of ['Primaria 18 Ago', 'este martes 18 de agosto', 'España campeona', 'España fue campeona', '3,50%', 'en julio de 2026', 'Qué debe vivir aquí', 'Cómo crecer esta sección']) {
  assert.ok(!html.includes(obsolete), obsolete);
}
for (const match of html.matchAll(/openStoryModal\('([^']+)'\)/g)) {
  if (!match[1].includes('${')) assert.ok(ctx.stories[match[1]], match[1]);
}
assert.ok(ctx.stories['hero-2'].content.includes('581'));
assert.ok(ctx.stories['hero-2'].content.includes('±4,3'));
assert.ok(html.includes("setInterval(() => { initDateDisplay(); initElectionCountdown(); }, 60000)"));
console.log('PASS: institutional source links, all story targets, 7 countdown dates including DST, obsolete content removed.');

const todayIds = ['caravana-20261002', 'trump-accounts-20261002', 'rick-scott-save-20261002', 'trump-midterms-20261002', 'maga-motivacion-20261002', 'byron-donalds-20261002'];
for (const id of todayIds) {
  const story = ctx.stories[id];
  assert.equal(story.date, '2026-10-02');
  assert.equal(story.author, 'Redacción Correo USA');
  assert.ok(story.image.startsWith('https://i.imgur.com/'));
  assert.ok(story.imagePosition.includes('center'));
  assert.ok(story.content.length > 400);
  assert.equal(story.sources, undefined);
  ctx.openStoryModal(id);
  assert.ok(elements['modal-content'].innerHTML.includes(story.title));
  assert.ok(elements['modal-content'].innerHTML.includes('02/10/2026'));
  assert.ok(elements['modal-content'].innerHTML.includes('Por Redacción Correo USA'));
}
ctx.renderLatestNews();
assert.equal((elements['latest-news-grid'].innerHTML.match(/<article /g) || []).length, 4);
ctx.renderPreviousNews();
assert.equal((elements['previous-news-grid'].innerHTML.match(/<li /g) || []).length, 10);
for (const id of [...ids, 'salazar-delcy-20260921', 'austin-ice-20260921', 'gwinnett-collins-20260921', 'clark-tps-20260921', 'rubio-nyse-20260921']) {
  assert.ok(elements['previous-news-grid'].innerHTML.includes(id));
}
assert.ok(html.includes('AL DÍA · 2 OCT'));
assert.ok(html.includes('Edición del 2 de octubre de 2026'));
assert.ok(html.includes("openStoryModal('trump-accounts-20261002')"));
assert.ok(elements['latest-news-grid'].innerHTML.includes('Rick Scott presiona al Senado'));
assert.equal((elements['latest-news-grid'].innerHTML.match(/<article[^>]*>[\s\S]*?Rick Scott presiona al Senado/g) || []).length, 1);
for (const outlet of ['EFE y N+', 'Reuters ·', 'Associated Press ·', 'New York Post ·']) assert.ok(!html.includes(outlet), outlet);
console.log('PASS: 6 noticias del 02/10, portada sin duplicación visual, 10 enlaces de archivo y encuadres personalizados.');

assert.equal(ctx.keyCountyRaces.length, 15);
assert.deepEqual([...new Set(ctx.keyCountyRaces.map(item => item.stateCode))], ['FL', 'TX', 'AZ', 'NV', 'PA', 'GA', 'CO']);
ctx.renderKeyCountyFilters();
ctx.renderKeyCounties();
assert.equal((elements['key-county-grid'].innerHTML.match(/<button /g) || []).length, 4);
assert.ok(elements['key-county-summary'].textContent.includes('Florida'));
ctx.selectKeyCountyState('TX');
assert.equal((elements['key-county-grid'].innerHTML.match(/<button /g) || []).length, 3);
assert.ok(elements['key-county-grid'].innerHTML.includes('Hidalgo'));
ctx.selectKeyCountyState('all');
assert.equal((elements['key-county-grid'].innerHTML.match(/<button /g) || []).length, 15);
ctx.openKeyCountyModal('GA-GWI');
assert.ok(elements['modal-content'].innerHTML.includes('Gwinnett County'));
assert.ok(elements['modal-content'].innerHTML.includes('Jon Ossoff'));

assert.ok(html.includes('<link rel="canonical" href="https://www.correousanews.com/">'));
assert.ok(html.includes('<link rel="sitemap" type="application/xml" href="https://www.correousanews.com/sitemap.xml">'));
assert.ok(html.includes('application/ld+json'));
assert.ok(html.includes('NewsMediaOrganization'));
assert.ok(html.includes('max-image-preview:large'));
assert.ok(robots.includes('Sitemap: https://www.correousanews.com/sitemap.xml'));
assert.ok(sitemap.includes('<loc>https://www.correousanews.com/</loc>'));
const ticker = html.split('<!-- TOP TICKER BAR (COMPACT) -->')[1].split('<!-- HEADER (COMPACT) -->')[0];
for (const id of todayIds) assert.ok(!ticker.includes(`openStoryModal('${id}')`), id);
console.log('PASS: 15 condados interactivos, 7 filtros estatales, SEO completo y cinta independiente.');
