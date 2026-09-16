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
function visDoodles(p) {
  return p.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.doodle'));
    return els.map(e => { const r = e.getBoundingClientRect(); return { c: e.getAttribute('class'), w: Math.round(r.width), h: Math.round(r.height), v: r.width > 0 && r.height > 0 }; });
  });
}
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

  const doShot = async (name) => { await p.screenshot({ path: path.join(ROOT, name) }); };
  const report = {};

  await p.evaluate(() => goTab('home')); await sleep(300);
  report.home = await visDoodles(p); await doShot('preview-doodle-home.png');

  await p.evaluate(() => goTab('schedule')); await sleep(300);
  report.schedule = await visDoodles(p); await doShot('preview-doodle-schedule.png');

  await p.evaluate(() => goTab('me')); await sleep(300);
  report.me = await visDoodles(p); await doShot('preview-doodle-me.png');

  await p.evaluate(() => goTab('add')); await sleep(300);
  report.add = await visDoodles(p); await doShot('preview-doodle-add.png');

  await p.evaluate(() => goTab('settings')); await sleep(300);
  report.settings = await visDoodles(p); await doShot('preview-doodle-settings.png');

  for (const key of ['fee','tpl','cust','ticket']) {
    await p.evaluate(k => openSettingsSection(k), key); await sleep(300);
    report['sec_' + key] = await visDoodles(p);
    await doShot('preview-doodle-sec-' + key + '.png');
  }

  await p.evaluate(() => { products.length = 0; goTab('warehouse'); renderProd(); }); await sleep(300);
  report.warehouse = await visDoodles(p); await doShot('preview-doodle-warehouse-empty.png');

  await p.evaluate(() => { openCustomers(); customers.length = 0; renderCustomers(); }); await sleep(300);
  report.customers = await visDoodles(p); await doShot('preview-doodle-customers-empty.png');

  await p.evaluate(() => { orderTemplates.length = 0; openTemplates(); }); await sleep(300);
  report.templates = await visDoodles(p); await doShot('preview-doodle-templates-empty.png');

  await p.evaluate(() => { closeModal(); openEmailLogin(); }); await sleep(300);
  report.login = await visDoodles(p); await doShot('preview-doodle-login.png');

  // summary counts
  const summ = {};
  for (const k of Object.keys(report)) {
    const arr = report[k];
    summ[k] = { total: arr.length, vis: arr.filter(x => x.v).length };
  }
  console.log('SUMMARY:', JSON.stringify(summ));
  console.log('CONSOLE_ERRORS:', errors.length ? JSON.stringify(errors) : 'none');
  await b.close(); srv.close();
  console.log('verify done');
})().catch(e => { console.error(e); process.exit(1); });
