const puppeteer = require('./.pptr/node_modules/puppeteer-core');
const http = require('http'), path = require('path'), fs = require('fs');
const ROOT = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png' };
function startServer() {
  return new Promise(res => {
    const srv = http.createServer((req, r) => {
      const fp = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      fs.readFile(fp, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' }); r.end(d); });
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, port: srv.address().port }));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const { srv, port } = await startServer();
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--window-size=1280,900'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  const errors = [];
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await p.goto('http://127.0.0.1:' + port + '/build/index.html', { waitUntil: 'load' });
  await sleep(400);

  // ---- background layer checks ----
  const bg = await p.evaluate(() => {
    const layer = document.getElementById('bg-doodles');
    if (!layer) return { exists: false };
    const cs = getComputedStyle(layer);
    const kids = Array.from(layer.querySelectorAll('.bg-doodle'));
    const items = kids.map(e => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return { sym: (e.querySelector('use') || {}).getAttribute ? e.querySelector('use').getAttribute('href') : null, w: Math.round(r.width), h: Math.round(r.height), op: +s.opacity, color: s.color, vis: r.width > 0 && r.height > 0 };
    });
    return { exists: true, layerPos: cs.position, layerZ: cs.zIndex, layerOverflow: cs.overflow, count: kids.length, items };
  });

  // ---- regression: 24 inline doodles still present ----
  const inlineCount = await p.evaluate(() => document.querySelectorAll('.doodle').length);

  // ---- visual: are bg doodles behind content? check a doodle's center is covered by a content element ----
  const behind = await p.evaluate(() => {
    const d = document.querySelector('.bg-doodle');
    if (!d) return null;
    const r = d.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const top = document.elementFromPoint(cx, cy);
    // if top is the doodle itself (pointer-events:none means it should pass through), it's NOT the top; it should be a content node
    return { topTag: top ? top.tagName + '.' + (top.className || '').toString().split(' ')[0] : null, isDoodle: top ? top.classList && top.classList.contains('bg-doodle') : false };
  });

  await p.screenshot({ path: path.join(ROOT, 'preview-bg-home.png') });
  await p.setViewport({ width: 390, height: 800 });
  await sleep(300);
  await p.screenshot({ path: path.join(ROOT, 'preview-bg-mobile.png') });

  // mobile check of bg doodles
  const bgMobile = await p.evaluate(() => {
    const kids = Array.from(document.querySelectorAll('#bg-doodles .bg-doodle'));
    return { count: kids.length, visible: kids.filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length };
  });

  console.log('BG_LAYER:', JSON.stringify(bg));
  console.log('INLINE_DOODLES:', inlineCount);
  console.log('BEHIND_CONTENT:', JSON.stringify(behind));
  console.log('BG_MOBILE:', JSON.stringify(bgMobile));
  console.log('CONSOLE_ERRORS:', errors.length ? JSON.stringify(errors) : 'none');
  await b.close(); srv.close();
  console.log('verify-bg done');
})().catch(e => { console.error(e); process.exit(1); });
