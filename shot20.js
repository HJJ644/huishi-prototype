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

  // 1) 设置页（我的->设置）：确认「小票外观」一级项
  await p.goto('http://127.0.0.1:' + port + '/build/index.html', { waitUntil: 'load' });
  await sleep(300);
  await p.evaluate(() => { goTab('settings'); });
  await sleep(300);
  await p.screenshot({ path: path.join(ROOT, 'preview20-settings-list.png') });

  // 2) 电脑端工作台：打开小票外观分区
  await p.evaluate(() => openSettingsSection('ticket'));
  await sleep(300);
  await p.screenshot({ path: path.join(ROOT, 'preview20-desktop-ticket.png') });

  // 3) 电脑端工作台：费用设置（确认小票外观已移出）
  await p.evaluate(() => openSettingsSection('fee'));
  await sleep(300);
  await p.screenshot({ path: path.join(ROOT, 'preview20-desktop-fee.png') });

  // 4) 订单详情页 + 小票弹窗（含下载按钮）
  await p.evaluate(() => {
    orders.push({ id: 92001, proj: '示例企划·夏日祭', customer: '小满', contact: 'wx:xiaoman', platform: '微博', pay: '微信', feePct: 1,
      startTime: '2026-09-01', endTime: '2026-09-30', orderNo: 'HS-2026-0920',
      lines: [{ name: '立绘单人·半身', qty: 1, unit: '件', price: 300, actualPrice: 330, subm: 0, sub: 330, usageRate: 1, markup: 30 }, { name: 'Q版头像', qty: 2, unit: '张', price: 150, actualPrice: 150, sub: 300, usageRate: 1, markup: 0 }],
      extras: [{ name: '加急费', amt: 60 }], payable: 693, discount: 20, actual: 673, deposit: 200, balance: 473,
      rushRate: 1.5, pubRate: 1, rushName: '72小时', pubName: '不公开', status: '' });
    saveAll(); curOrderId = 92001; odTicket();
  });
  await sleep(400);
  await p.screenshot({ path: path.join(ROOT, 'preview20-ticket-modal.png') });

  // 5) 加单页步骤3（清单打印 + 下载按钮）
  await p.evaluate(() => { closeModal(); goTab('add'); goStep(3); document.getElementById('oName').value = '示例企划·夏日祭'; renderTicket(); });
  await sleep(400);
  await p.screenshot({ path: path.join(ROOT, 'preview20-add-step3.png') });

  await b.close(); srv.close();
  console.log('shots done');
})().catch(e => { console.error(e); process.exit(1); });
