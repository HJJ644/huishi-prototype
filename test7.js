// Round 20 verification: auto cloud-save, 待交稿 count sync, 小票外观 moved, ticket image download
const path = require('path');
const fs = require('fs');
const http = require('http');
const puppeteer = require('./.pptr/node_modules/puppeteer-core');

const ROOT = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DL = path.join(ROOT, '.pptr', 'downloads');

// 本地 HTTP 服务（file:// 下画布会被标记污染，无法导出 PNG）
function startServer(rootDir) {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon' };
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const p = decodeURIComponent(req.url.split('?')[0]);
      const fp = path.join(rootDir, p);
      fs.readFile(fp, (e, data) => {
        if (e) { res.writeHead(404); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.rmSync(DL, { recursive: true, force: true });
  fs.mkdirSync(DL, { recursive: true });
  const { srv, port } = await startServer(ROOT);
  const FILE = 'http://127.0.0.1:' + port + '/build/index.html';

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const errors = [];
  page.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text());
  });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  const results = [];
  const check = (name, ok, extra) => { results.push({ name, ok, extra }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  [' + extra + ']' : '')); };

  await page.goto(FILE, { waitUntil: 'load' });
  await sleep(400);

  // 拦截程序化下载：捕获生成的 blob，直接在页面内取字节校验（不依赖浏览器下载目录）
  await page.evaluate(() => {
    window.__dl = null;
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download && this.href) { window.__dl = { href: this.href, name: this.download }; return; }
      return orig.apply(this, arguments);
    };
  });
  const grabDownload = async () => page.evaluate(async () => {
    if (!window.__dl) return null;
    const r = await fetch(window.__dl.href);
    const buf = new Uint8Array(await r.arrayBuffer());
    let s = ''; const CH = 0x8000;
    for (let i = 0; i < buf.length; i += CH) s += String.fromCharCode.apply(null, buf.subarray(i, i + CH));
    return { name: window.__dl.name, len: buf.length, b64: btoa(s) };
  });
  // 轮询等待异步生成的下载（图片解码 + canvas 导出是异步的）
  const waitDownload = async (ms = 6000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const d = await grabDownload();
      if (d) return d;
      await sleep(120);
    }
    return null;
  };

  // ---------- Req 3: 小票外观 moved to top-level settings entry ----------
  const r3 = await page.evaluate(() => {
    const listItem = document.querySelector('#page-settings [onclick="openTicketStyle()"]');
    const navItem = document.querySelector('#setNav [data-sec="ticket"]');
    const inFee = !!document.querySelector('#feeBody #ticketStylePicker');
    const inTicket = !!document.querySelector('#ticketBody #ticketStylePicker');
    const inSections = typeof SET_SECTIONS !== 'undefined' && SET_SECTIONS.some(s => s.key === 'ticket' && s.bodyId === 'ticketBody');
    return { listItem: !!listItem, listText: listItem ? listItem.textContent.replace(/\s+/g, ' ').trim() : '', navItem: !!navItem, inFee, inTicket, inSections };
  });
  check('小票外观 设置一级项存在', r3.listItem && /小票外观/.test(r3.listText), r3.listText);
  check('小票外观 工作台左侧导航存在', r3.navItem);
  check('小票外观 已从费用设置移除', r3.inFee === false);
  check('小票外观 已落到新页面 #ticketBody', r3.inTicket === true);
  check('SET_SECTIONS 含 ticket 分区', r3.inSections);

  await page.setViewport({ width: 390, height: 844 });
  await sleep(350);
  const r3b = await page.evaluate(() => {
    openTicketStyle();
    const pg = document.getElementById('page-ticket-style');
    const opts = [...document.querySelectorAll('#ticketStylePicker .style-opt')];
    const names = opts.map(o => o.querySelector('.style-name').textContent);
    const swatchOk = opts.every(o => /sp-/.test(o.querySelector('.style-preview').className));
    return { visible: pg && !pg.classList.contains('hidden'), n: opts.length, names, swatchOk, tag: (document.getElementById('ticketStyleTag') || {}).textContent };
  });
  check('点击小票外观跳转到独立页且显示 20 个样式', r3b.visible && r3b.n === 20, 'n=' + r3b.n + ' tag=' + r3b.tag);
  check('20 个样式均有预览色块', r3b.swatchOk === true);
  const need = ['草莓奶油', '小熊便利店', '猫咪超市', '手账胶带', '深色夜市', '58mm 热敏', '80mm 热敏', '科技风', '古风', '暗黑风', '年代感', '杂志风', '极简风', '赛博朋克', '清新薄荷', '邮票风'];
  const missingName = need.filter(n => !r3b.names.includes(n));
  check('16 个新样式名称齐全', missingName.length === 0, missingName.length ? '缺失: ' + missingName.join(',') : r3b.names.length + ' 项');
  await page.setViewport({ width: 1280, height: 900 });
  await sleep(300);

  // ---------- Req 2: 待交稿 count == 未完成 orders; unfinished shows 未交稿 ----------
  const r2 = await page.evaluate(() => {
    orders.length = 0;
    orders.push(
      { id: 90001, proj: '未完成单', balance: 200, status: '', rushRate: 1, lines: [] },
      { id: 90002, proj: '已完成单', balance: 0, status: 'done', rushRate: 1, lines: [] },
      { id: 90003, proj: '跑单单', balance: 50, status: 'failed', rushRate: 1, lines: [] },
      { id: 90004, proj: '加急未完成', balance: 100, status: '', rushRate: 1.5, lines: [] }
    );
    hsCurrent = 'unfinished';
    const unfinishedCount = getFilteredOrders().length;
    const due = getDueTotal();
    const stUnfinished = orderStatus(orders[0]).t;
    const stUrgent = orderStatus(orders[3]).t;
    const stDone = orderStatus(orders[1]).t;
    renderCal();
    const domDue = (document.getElementById('dueTotal') || {}).textContent;
    return { unfinishedCount, due, stUnfinished, stUrgent, stDone, domDue };
  });
  check('待交稿数 = 未完成订单数', r2.due === 2 && r2.unfinishedCount === 2, 'due=' + r2.due + ' unfinished=' + r2.unfinishedCount);
  check('未完成订单状态显示「未交稿」', r2.stUnfinished === '未交稿' && r2.stUrgent === '未交稿', 'normal=' + r2.stUnfinished + ' urgent=' + r2.stUrgent);
  check('已完成订单仍显示「已完成」', r2.stDone === '已完成');
  check('页面#dueTotal 与计数同步', /2\s*件/.test(r2.domDue || ''), 'dom="' + r2.domDue + '"');

  // ---------- Req 1: auto cloud-save ----------
  const r1 = await page.evaluate(() => {
    feeSettings.ticketStyle = 'warm';
    feeSettings.payFees.push({ id: 88888, name: '云保存测试费', val: 3 });
    cloudSave();
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const persisted = raw.feeSettings && raw.feeSettings.ticketStyle === 'warm'
      && raw.feeSettings.payFees.some(f => f.id === 88888);
    return { persisted };
  });
  check('费用设置改动即时落盘（云端自动保存）', r1.persisted);

  // ---------- Req 4a: download from order detail 小票 ----------
  await page.setViewport({ width: 390, height: 844 });
  await sleep(200);
  await page.evaluate(() => {
    orders.push({
      id: 91000, proj: '下载测试企划', customer: '单主A', contact: 'wx:abc', platform: '微博', pay: '微信', feePct: 0,
      startTime: '2026-09-01', endTime: '2026-09-30', orderNo: 'HS-DL-001',
      lines: [{ name: '立绘单人·半身', qty: 1, unit: '件', price: 300, actualPrice: 300, sub: 300, usageRate: 1, markup: 0 }],
      extras: [], payable: 300, discount: 0, actual: 300, deposit: 100, balance: 200,
      rushRate: 1, pubRate: 1, rushName: '不加急', pubName: '不公开', status: ''
    });
    saveAll(); curOrderId = 91000; odTicket();
  });
  await sleep(300);
  await page.evaluate(() => { window.__dl = null; downloadOrderTicket(); });
  const d1 = await waitDownload();
  let png1ok = false, dim = '';
  if (d1) {
    const buf = Buffer.from(d1.b64, 'base64');
    fs.writeFileSync(path.join(DL, d1.name), buf);
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    const w = isPng ? buf.readUInt32BE(16) : 0, h = isPng ? buf.readUInt32BE(20) : 0;
    dim = 'name=' + d1.name + ' bytes=' + buf.length + ' ' + w + 'x' + h;
    png1ok = isPng && w > 200 && h > 200 && buf.length > 3000 && /下载测试企划/.test(d1.name);
  }
  check('订单详情小票可下载 PNG 图片', png1ok, dim || 'no download captured');

  // ---------- 新样式在加单页小票生效 ----------
  await page.evaluate(() => { closeModal(); window.__dl = null; goTab('add'); goStep(3); document.getElementById('oName').value = '加单页测试'; feeSettings.ticketStyle = 'cyberpunk'; renderTicket(); });
  await sleep(400);
  const themeOk = await page.evaluate(() => document.getElementById('ticket').classList.contains('ticket-cyberpunk'));
  check('新样式(赛博朋克)在加单页小票生效', themeOk === true);

  // ---------- Req 4b: download from add page 清单打印 (step 3) ----------
  await page.evaluate(() => { window.__dl = null; downloadAddTicket(); });
  const d2 = await waitDownload();
  let png2ok = false, dim2 = '';
  if (d2) {
    const buf = Buffer.from(d2.b64, 'base64');
    fs.writeFileSync(path.join(DL, d2.name), buf);
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    const w = isPng ? buf.readUInt32BE(16) : 0, h = isPng ? buf.readUInt32BE(20) : 0;
    dim2 = 'name=' + d2.name + ' bytes=' + buf.length + ' ' + w + 'x' + h;
    png2ok = isPng && w > 200 && h > 200 && buf.length > 3000 && /加单页测试/.test(d2.name);
  }
  check('加单页清单打印可下载 PNG 图片', png2ok, dim2 || 'no download captured');

  // ---------- errors ----------
  check('无 JS 运行时错误', errors.length === 0, errors.slice(0, 4).join(' | '));

  await browser.close();
  srv.close();

  const failed = results.filter(r => !r.ok);
  console.log('\n==== ' + (results.length - failed.length) + '/' + results.length + ' passed ====');
  if (failed.length) { console.log('FAILED: ' + failed.map(f => f.name).join('; ')); process.exit(1); }
})().catch(e => { console.error('TEST CRASH:', e); process.exit(2); });
