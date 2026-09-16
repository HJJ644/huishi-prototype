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

// 给费用列表塞点数据，模拟用户截图里的内容量
const SEED = `feeSettings.payFees=[{id:1,name:'支付宝',val:0},{id:2,name:'微信',val:0},{id:3,name:'画加',val:0.06}];
feeSettings.usageFees=[{id:11,name:'自用',val:1},{id:12,name:'商用',val:2},{id:13,name:'私商同价',val:1}];
feeSettings.rushFees=[{id:21,name:'不加急',val:1},{id:22,name:'加急',val:2}];
feeSettings.publicFees=[{id:31,name:'全网公开',val:1.3},{id:32,name:'仅作品集',val:1}];
feeSettings.depositPct=50; cloudSave();`;

(async () => {
  const { srv, port } = await startServer();
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto('http://127.0.0.1:' + port + '/build/index.html', { waitUntil: 'load' });
  await sleep(400);
  await p.evaluate(() => { goTab('settings'); syncSettingsWorkbench(); });
  await p.evaluate(SEED);
  await p.evaluate(() => { openSettingsSection('fee'); });
  await sleep(500);

  const info = await p.evaluate(() => {
    const grid = document.querySelector('.fee-grid');
    const gs = getComputedStyle(grid);
    const items = [...grid.children].map(el => {
      const r = el.getBoundingClientRect();
      return {
        id: el.id || (el.classList.contains('fee-save-bar') ? '__saveBar' : el.className),
        left: Math.round(r.left), top: Math.round(r.top),
        w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom)
      };
    });
    const cols = {};
    items.forEach(c => { (cols[c.left] = cols[c.left] || []).push(c); });
    const holes = [];
    Object.keys(cols).forEach(L => {
      const list = cols[L].sort((a, b) => a.top - b.top);
      for (let i = 1; i < list.length; i++) {
        const gap = list[i].top - list[i - 1].bottom;
        if (gap > 28) holes.push(list[i - 1].id + ' -> ' + list[i].id + ' gap=' + Math.round(gap));
      }
    });
    const gridW = Math.round(grid.getBoundingClientRect().width);
    const sb = items.find(x => x.id === '__saveBar');
    const sbCol = sb ? cols[sb.left] : [];
    const sbLast = sbCol.length ? sbCol[sbCol.length - 1].id === '__saveBar' : false;
    return {
      columnCount: gs.columnCount, cols: Object.keys(cols).length, items,
      holes, gridW, sbW: sb ? sb.w : 0, sbLast
    };
  });
  console.log(JSON.stringify(info, null, 1));
  check('费用卡片排成两列（多列布局）', info.columnCount === '2' && info.cols === 2, 'columnCount=' + info.columnCount + ' cols=' + info.cols);
  check('同列卡片之间没有空洞', info.holes.length === 0, info.holes.join(' ; ') || 'none');
  check('保存块落在某一列内（不再通栏）', info.sbW > 0 && info.sbW < info.gridW * 0.7, 'saveW=' + info.sbW + ' gridW=' + info.gridW);
  check('保存块是其所在列的最后一块', info.sbLast === true);

  const el = await p.$('#feeBody');
  await el.screenshot({ path: path.join(ROOT, 'preview23-fee-body.png') });
  await p.screenshot({ path: path.join(ROOT, 'preview23-fee-viewport.png') });

  // 手机端：仍为单列、保持原边距
  await p.setViewport({ width: 390, height: 900, deviceScaleFactor: 2 });
  await sleep(400);
  await p.evaluate(() => { goTab('fee-settings'); initFeeSettingsPanel(); });
  await sleep(400);
  const mob = await p.evaluate(() => {
    const grid = document.querySelector('.fee-grid');
    const cs = getComputedStyle(grid);
    // 只测 5 张费用卡（保存条是通栏吸底，故意无边距）
    const items = [...grid.children].filter(e => !e.classList.contains('fee-save-bar'));
    const rects = items.map(e => { const r = e.getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), h: Math.round(r.height) }; });
    const bodyRect = document.getElementById('feeBody').getBoundingClientRect();
    const sameLeft = rects.every(r => r.left === rects[0].left);
    const asc = rects.every((r, i) => i === 0 || r.top > rects[i - 1].top);
    const maxRight = Math.max(...rects.map((r, i) => r.left + Math.round(items[i].getBoundingClientRect().width)));
    const noOverflow = maxRight <= Math.round(bodyRect.right) + 1;
    return {
      colCount: cs.columnCount, margin: getComputedStyle(items[0]).marginLeft,
      bodyW: Math.round(bodyRect.width), sameLeft, asc, noOverflow,
      rects
    };
  });
  console.log('mobile:', JSON.stringify(mob));
  check('手机端仍为单列纵向堆叠', (mob.colCount === '1' || mob.colCount === 'auto') && mob.sameLeft && mob.asc, 'columnCount=' + mob.colCount + ' sameLeft=' + mob.sameLeft + ' asc=' + mob.asc);
  check('手机端无横向溢出', mob.noOverflow, 'bodyW=' + mob.bodyW);
  check('手机端卡片保留左右边距', parseFloat(mob.margin) >= 16, 'marginLeft=' + mob.margin);
  await p.screenshot({ path: path.join(ROOT, 'preview23-mobile-fee.png') });

  check('无 JS 运行时错误', errs.length === 0, errs.slice(0, 3).join(' | '));

  await b.close(); srv.close();
  const bad = R.filter(x => !x).length;
  console.log('\n==== ' + (R.length - bad) + '/' + R.length + ' passed ====');
  if (bad) process.exit(1);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
