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
const THEMES = ['strawberry','bear','cat','journal','nightmarket','thermal58','thermal80','tech','ancient','darkgold','retro','magazine','minimal','cyberpunk','mint','stamp'];

(async () => {
  const { srv, port } = await startServer();
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 420, height: 1000, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:' + port + '/build/index.html', { waitUntil: 'load' });
  await sleep(300);

  // 造一张内容较丰富的订单，便于看效果
  await p.evaluate(() => {
    orders.push({
      id: 92002, proj: '惠民超市', customer: '小可爱', contact: 'wx:ke', platform: '惠民超市', pay: '微信', feePct: 0,
      startTime: '2025-09-15', endTime: '2025-09-30', orderNo: '202509150001',
      lines: [
        { name: '矿泉水', qty: 2, unit: '件', price: 2.0, actualPrice: 2.0, sub: 4.00, usageRate: 1, markup: 0 },
        { name: '抽纸', qty: 1, unit: '件', price: 12.9, actualPrice: 12.9, sub: 12.90, usageRate: 1, markup: 0 },
        { name: '方便面', qty: 3, unit: '件', price: 4.5, actualPrice: 4.5, sub: 13.50, usageRate: 1, markup: 0 },
        { name: '鸡蛋', qty: 1, unit: '件', price: 15.8, actualPrice: 15.8, sub: 15.80, usageRate: 1, markup: 0 },
        { name: '香蕉', qty: 2, unit: '件', price: 6.8, actualPrice: 6.8, sub: 13.60, usageRate: 1, markup: 0 }
      ],
      extras: [], payable: 59.80, discount: 5.00, actual: 54.80, deposit: 20, balance: 34.80,
      rushRate: 1, pubRate: 1, rushName: '不加急', pubName: '不公开', status: '', remark: '会员：小可爱 · 金卡'
    });
    saveAll();
  });

  for (const t of THEMES) {
    await p.evaluate((tt) => {
      const old = document.getElementById('__shot'); if (old) old.remove();
      const host = document.createElement('div');
      host.id = '__shot';
      host.style.cssText = 'position:fixed;left:0;top:0;width:340px;background:#FAF7F2;padding:12px;z-index:99999;';
      const el = document.createElement('div');
      el.className = 'ticket ticket-' + tt;
      el.style.cssText = 'margin:0;width:316px;box-sizing:border-box;';
      el.innerHTML = buildTicketHtml(orders.find(o => o.id === 92002));
      host.appendChild(el);
      document.body.appendChild(host);
    }, t);
    await sleep(120);
    const el = await p.$('#__shot');
    await el.screenshot({ path: path.join(ROOT, 'preview21-style-' + t + '.png') });
    await p.evaluate(() => { const o = document.getElementById('__shot'); if (o) o.remove(); });
  }

  // 样式选择器整页（电脑端工作台，2 列网格）
  await p.setViewport({ width: 1280, height: 1400, deviceScaleFactor: 1 });
  await p.evaluate(() => { goTab('settings'); syncSettingsWorkbench(); openSettingsSection('ticket'); });
  await sleep(400);
  await p.screenshot({ path: path.join(ROOT, 'preview21-picker-desktop.png'), fullPage: false });

  await b.close(); srv.close();
  console.log('done: ' + THEMES.length + ' theme shots + picker');
})().catch(e => { console.error(e); process.exit(1); });
