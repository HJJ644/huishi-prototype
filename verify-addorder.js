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
  await p.evaluate(() => goTab('add'));
  await sleep(400);

  const order = await p.evaluate(() => {
    const step1 = document.getElementById('step1');
    const kids = Array.from(step1.children).map(e => {
      const t = e.querySelector ? (e.querySelector('.grp-title') || {}).textContent : null;
      return { cls: (e.className || '').toString(), id: e.id || '', grp: t || null, isTpl: e.classList.contains('tpl-bar') };
    });
    return kids;
  });

  // 功能回归：填 企划名称
  const fn = await p.evaluate(() => {
    const n = document.getElementById('oName');
    n.value = '测试企划';
    n.dispatchEvent(new Event('input', { bubbles: true }));
    const saved = document.getElementById('oName').value;
    return { exists: !!n, value: saved, platformSel: !!document.getElementById('oPlatform'), remark: !!document.getElementById('oRemark') };
  });

  // 视觉位置：基本信息组的顶部 y 应小于 订单模板 y
  const pos = await p.evaluate(() => {
    const step1 = document.getElementById('step1');
    const basic = step1.querySelector('.form-group');
    const tpl = step1.querySelector('.tpl-bar');
    const rb = basic.getBoundingClientRect(), rt = tpl.getBoundingClientRect();
    return { basicY: Math.round(rb.top), tplY: Math.round(rt.top), basicAboveTpl: rb.top < rt.top, basicTitle: basic.querySelector('.grp-title').textContent };
  });

  await p.screenshot({ path: path.join(ROOT, 'preview-addorder-desktop.png') });
  await p.setViewport({ width: 390, height: 800 });
  await sleep(300);
  await p.evaluate(() => { const s = document.getElementById('step1'); if (s) s.scrollIntoView(); });
  await p.screenshot({ path: path.join(ROOT, 'preview-addorder-mobile.png') });

  console.log('STEP1_ORDER:', JSON.stringify(order, null, 1));
  console.log('FIRST_IS_BASIC:', order[0] && order[0].grp === '基本信息');
  console.log('INPUTS_OK:', JSON.stringify(fn));
  console.log('POS:', JSON.stringify(pos));
  console.log('CONSOLE_ERRORS:', errors.length ? JSON.stringify(errors) : 'none');
  await b.close(); srv.close();
  console.log('verify-addorder done');
})().catch(e => { console.error(e); process.exit(1); });
