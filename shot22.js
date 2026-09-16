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
const R = [];
const check = (n, ok, ex) => { R.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (ex ? '  [' + ex + ']' : '')); };

(async () => {
  const { srv, port } = await startServer();
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });

  // ---- 电脑端工作台 ----
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto('http://127.0.0.1:' + port + '/build/index.html', { waitUntil: 'load' });
  await sleep(400);
  await p.evaluate(() => { goTab('settings'); syncSettingsWorkbench(); openSettingsSection('ticket'); });
  await sleep(500);

  const d = await p.evaluate(() => {
    const box = document.getElementById('ticketPreview');
    const tk = box && box.querySelector('.ticket');
    const layout = document.querySelector('.tp-layout');
    const cs = layout ? getComputedStyle(layout).gridTemplateColumns : '';
    return {
      hasBox: !!box,
      hasTicket: !!tk,
      cls: tk ? tk.className : '',
      cols: cs,
      sub: (document.getElementById('ticketPreviewSub') || {}).textContent,
      rows: tk ? tk.querySelectorAll('.tk-item, .tk-payrow').length : 0
    };
  });
  check('预览区渲染出小票', d.hasBox && d.hasTicket, 'class="' + d.cls + '" rows=' + d.rows);
  check('桌面端两栏布局', /px .*px/.test(d.cols), 'grid-template-columns=' + d.cols);
  check('预览副标题有文案', !!d.sub, d.sub);
  await p.screenshot({ path: path.join(ROOT, 'preview22-desktop-preview.png') });

  // 点一个新样式 → 预览应实时切换
  const before = d.cls;
  await p.evaluate(() => {
    const opt = [...document.querySelectorAll('#ticketStylePicker .style-opt')].find(o => /cyberpunk/.test(o.getAttribute('onclick')));
    selectTicketStyle('cyberpunk', opt);
  });
  await sleep(300);
  const after = await p.evaluate(() => document.querySelector('#ticketPreview .ticket').className);
  check('点击样式后预览实时切换', /ticket-cyberpunk/.test(after) && !/ticket-classic/.test(after), before + ' -> ' + after);
  await p.screenshot({ path: path.join(ROOT, 'preview22-desktop-preview-cyberpunk.png') });

  // 连续切换两次，确认不残留旧主题类
  await p.evaluate(() => {
    const o1 = [...document.querySelectorAll('#ticketStylePicker .style-opt')].find(o => /strawberry/.test(o.getAttribute('onclick')));
    selectTicketStyle('strawberry', o1);
    const o2 = [...document.querySelectorAll('#ticketStylePicker .style-opt')].find(o => /thermal80/.test(o.getAttribute('onclick')));
    selectTicketStyle('thermal80', o2);
  });
  await sleep(200);
  const multi = await p.evaluate(() => document.querySelector('#ticketPreview .ticket').className);
  check('连续切换不残留旧主题类', multi === 'ticket ticket-thermal80', 'class="' + multi + '"');

  // ---- 手机端 ----
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await sleep(400);
  await p.evaluate(() => { openTicketStyle(); });
  await sleep(400);
  const m = await p.evaluate(() => {
    const card = document.querySelector('.ticket-preview-card');
    const box = document.getElementById('ticketPreview');
    const r = card.getBoundingClientRect();
    const order = getComputedStyle(card).order;
    return { order, top: Math.round(r.top), hasTicket: !!box.querySelector('.ticket'), scrollMax: getComputedStyle(document.querySelector('.ticket-preview-scroll')).maxHeight };
  });
  check('手机端预览排在列表上方', m.order === '-1' && m.hasTicket, 'order=' + m.order + ' maxH=' + m.scrollMax);
  await p.screenshot({ path: path.join(ROOT, 'preview22-mobile-preview.png') });

  check('无 JS 运行时错误', errs.length === 0, errs.slice(0, 3).join(' | '));

  await b.close(); srv.close();
  const bad = R.filter(x => !x).length;
  console.log('\n==== ' + (R.length - bad) + '/' + R.length + ' passed ====');
  if (bad) process.exit(1);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
