// 验证「编辑模板」弹窗内字段可自行排序：▲▼ 按钮 + 拖拽手柄
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
const labels = p => p.evaluate(() => [...document.querySelectorAll('#tplFields .tpl-fld .tpl-fld-label')].map(i => i.value));

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

  // 打开模板编辑器，造 4 个字段：书名 / 英文标题 / 作者 / 原IP
  await p.evaluate(() => {
    openTemplateEditor();
    document.getElementById('tplName').value = '排序测试模板';
    ['书名', '英文标题', '作者', '原IP'].forEach(l => addTplFieldRow({ key: 'k_' + l, label: l, type: 'text', required: true, options: [], note: '' }));
  });
  await sleep(300);

  const initial = await labels(p);
  const toolsCount = await p.evaluate(() => ({
    grips: document.querySelectorAll('#tplFields .tpl-fld-grip').length,
    ups: document.querySelectorAll('#tplFields .tpl-fld-mv.up').length,
    downs: document.querySelectorAll('#tplFields .tpl-fld-mv.down').length,
    firstUpOff: document.querySelector('#tplFields .tpl-fld .tpl-fld-mv.up').classList.contains('off'),
    lastDownOff: [...document.querySelectorAll('#tplFields .tpl-fld')].pop().querySelector('.tpl-fld-mv.down').classList.contains('off'),
  }));

  // 1) 点第一行的 ▼ → 下移一位
  await p.evaluate(() => document.querySelector('#tplFields .tpl-fld .tpl-fld-mv.down').click());
  await sleep(120);
  const afterDown = await labels(p);

  // 2) 点最后一行的 ▲ → 上移一位
  await p.evaluate(() => [...document.querySelectorAll('#tplFields .tpl-fld')].pop().querySelector('.tpl-fld-mv.up').click());
  await sleep(120);
  const afterUp = await labels(p);

  // 3) 真实鼠标拖拽：把第一行拖到最后
  const gripBox = await p.evaluate(() => {
    const g = document.querySelector('#tplFields .tpl-fld .tpl-fld-grip').getBoundingClientRect();
    const rows = [...document.querySelectorAll('#tplFields .tpl-fld')].map(r => r.getBoundingClientRect());
    return { x: g.left + g.width / 2, y: g.top + g.height / 2, lastBottom: rows[rows.length - 1].bottom };
  });
  await p.mouse.move(gripBox.x, gripBox.y);
  await p.mouse.down();
  await p.mouse.move(gripBox.x, gripBox.y + 20, { steps: 4 });
  const midDrag = await p.evaluate(() => ({ ghosts: document.querySelectorAll('.tpl-fld-ghost').length, slots: document.querySelectorAll('.tpl-fld.slot').length, ghostFixed: (() => { const g = document.querySelector('.tpl-fld-ghost'); return g ? getComputedStyle(g).position : null; })() }));
  await p.mouse.move(gripBox.x, gripBox.lastBottom + 40, { steps: 12 });
  await p.mouse.up();
  await sleep(200);
  const afterDrag = await labels(p);
  const afterDragCleanup = await p.evaluate(() => ({ ghosts: document.querySelectorAll('.tpl-fld-ghost').length, slots: document.querySelectorAll('.tpl-fld.slot').length, firstUpOff: document.querySelector('#tplFields .tpl-fld .tpl-fld-mv.up').classList.contains('off') }));

  // 3b) 轻点手柄（不移动）不应产生拖影、不应改变顺序
  const beforeTap = await labels(p);
  const tapBox = await p.evaluate(() => { const g = document.querySelector('#tplFields .tpl-fld .tpl-fld-grip').getBoundingClientRect(); return { x: g.left + g.width / 2, y: g.top + g.height / 2 }; });
  await p.mouse.move(tapBox.x, tapBox.y);
  await p.mouse.down();
  await p.mouse.up();
  await sleep(120);
  const afterTap = { order: await labels(p), ghosts: await p.evaluate(() => document.querySelectorAll('.tpl-fld-ghost').length), slots: await p.evaluate(() => document.querySelectorAll('.tpl-fld.slot').length) };

  // 4) 布局体检：控件是否挤压了字段名输入框 / 是否换行过多
  const layout = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('#tplFields .tpl-fld')];
    const r0 = rows[0];
    const kids = [...r0.querySelector('.tpl-fld-row').children].map(el => ({ cls: el.className.split(' ')[0], w: Math.round(el.getBoundingClientRect().width), top: Math.round(el.getBoundingClientRect().top - r0.getBoundingClientRect().top) }));
    // 按 top 聚类（容差 6px）算实际视觉行数
    const tops = [...new Set(kids.map(k => k.top))].sort((a, b) => a - b);
    const lines = [];
    tops.forEach(t => { const g = lines.find(l => Math.abs(l[0] - t) <= 6); if (g) g.push(t); else lines.push([t]); });
    const label = r0.querySelector('.tpl-fld-label').getBoundingClientRect();
    return { cardW: Math.round(r0.getBoundingClientRect().width), kids, visualLines: lines.length, lineGroups: lines, labelW: Math.round(label.width), labelH: Math.round(label.height) };
  });

  // 5) 保存 → 顺序是否持久化（orderTemplates 里字段顺序）
  await p.evaluate(() => { document.querySelector('.m-confirm').click(); });
  await sleep(300);
  const persisted = await p.evaluate(() => {
    const t = orderTemplates.find(x => x.name === '排序测试模板');
    return t ? t.fields.map(f => f.label) : null;
  });
  const stored = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); const t = (s.orderTemplates || []).find(x => x.name === '排序测试模板'); return t ? t.fields.map(f => f.label) : null; });

  // 6) 加单页：自定义字段是否按新顺序渲染
  const rendered = await p.evaluate(() => {
    const t = orderTemplates.find(x => x.name === '排序测试模板');
    if (!t) return null;
    goTab('add');
    onTemplateChange({ value: t.id });
    return [...document.querySelectorAll('#customFields [data-cf]')].map(e => e.dataset.cflabel);
  });
  await sleep(200);

  // 7) 刷新页面后重开编辑器：顺序是否持久化
  await p.reload({ waitUntil: 'load' });
  await sleep(500);
  await p.evaluate(() => { const t = orderTemplates.find(x => x.name === '排序测试模板'); openTemplateEditor(t.id); });
  await sleep(300);
  const afterReload = await labels(p);
  await p.evaluate(() => document.querySelector('.m-close').click());
  await sleep(200);

  await p.screenshot({ path: path.join(ROOT, 'preview-tplsort-addorder.png') });
  await p.evaluate(() => openSettingsSection('tpl'));
  await sleep(200);
  await p.evaluate(() => { const t = orderTemplates.find(x => x.name === '排序测试模板'); if (t) openTemplateEditor(t.id); });
  await sleep(300);
  await p.screenshot({ path: path.join(ROOT, 'preview-tplsort-editor.png') });
  await p.setViewport({ width: 390, height: 800 });
  await sleep(300);
  const mobileLayout = await p.evaluate(() => {
    const r0 = document.querySelector('#tplFields .tpl-fld');
    if (!r0) return null;
    const kids = [...r0.querySelector('.tpl-fld-row').children].map(el => ({ cls: el.className.split(' ')[0], w: Math.round(el.getBoundingClientRect().width), top: Math.round(el.getBoundingClientRect().top - r0.getBoundingClientRect().top) }));
    const tops = [...new Set(kids.map(k => k.top))].sort((a, b) => a - b);
    const lines = [];
    tops.forEach(t => { const g = lines.find(l => Math.abs(l[0] - t) <= 6); if (g) g.push(t); else lines.push([t]); });
    const label = r0.querySelector('.tpl-fld-label').getBoundingClientRect();
    return { visualLines: lines.length, labelW: Math.round(label.width), kids };
  });
  await p.screenshot({ path: path.join(ROOT, 'preview-tplsort-mobile.png') });

  console.log('INITIAL:', JSON.stringify(initial));
  console.log('TOOLS:', JSON.stringify(toolsCount));
  console.log('AFTER_DOWN_CLICK:', JSON.stringify(afterDown));
  console.log('AFTER_UP_CLICK:', JSON.stringify(afterUp));
  console.log('MID_DRAG:', JSON.stringify(midDrag));
  console.log('AFTER_DRAG:', JSON.stringify(afterDrag));
  console.log('AFTER_DRAG_CLEANUP:', JSON.stringify(afterDragCleanup));
  console.log('TAP_NOOP:', JSON.stringify({ sameOrder: JSON.stringify(beforeTap) === JSON.stringify(afterTap.order), ...afterTap }));
  console.log('LAYOUT_DESKTOP:', JSON.stringify(layout));
  console.log('PERSISTED_IN_MEM:', JSON.stringify(persisted));
  console.log('PERSISTED_IN_LS:', JSON.stringify(stored));
  console.log('ADD_PAGE_FIELDS:', JSON.stringify(rendered));
  console.log('AFTER_RELOAD_EDITOR:', JSON.stringify(afterReload));
  console.log('LAYOUT_MOBILE:', JSON.stringify(mobileLayout));
  console.log('CONSOLE_ERRORS:', errors.length ? JSON.stringify(errors) : 'none');
  await b.close(); srv.close();
  console.log('verify-tplsort done');
})().catch(e => { console.error(e); process.exit(1); });
