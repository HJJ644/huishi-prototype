// 验证：模板字段备注（不限字数 · 浅色小字）
const http = require('http');
const path = require('path');
const fs = require('fs');
const puppeteer = require('./.pptr/node_modules/puppeteer-core');

const ROOT = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (extra ? '   [' + extra + ']' : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
function serve() {
  return new Promise(res => {
    const s = http.createServer((req, rq) => {
      const p = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(ROOT, 'build', p === '/' ? 'index.html' : p);
      fs.readFile(f, (e, buf) => {
        if (e) { rq.writeHead(404); rq.end(); return; }
        rq.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
        rq.end(buf);
      });
    }).listen(0, '127.0.0.1', () => res(s));
  });
}

(async () => {
  const srv = await serve();
  const port = srv.address().port;
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none', '--window-size=1440,1000']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('http://127.0.0.1:' + port + '/index.html', { waitUntil: 'networkidle2' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { } });
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(400);

  // ---- 1. 打开模板编辑器，每个字段都有备注框 ----
  await page.evaluate(() => { openTemplates(); openTemplateEditor(); addTplFieldRow(); addTplFieldRow(); });
  await sleep(300);
  const r1 = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#tplFields .tpl-fld')];
    const notes = rows.map(r => r.querySelector('.tpl-note'));
    const cs = notes[0] ? getComputedStyle(notes[0]) : null;
    return {
      rows: rows.length,
      noteCount: notes.filter(Boolean).length,
      hasMaxLength: notes.some(n => n && n.hasAttribute('maxlength')),
      tag: notes[0] ? notes[0].tagName : '',
      fontSize: cs ? cs.fontSize : '',
      color: cs ? cs.color : '',
      ph: notes[0] ? notes[0].placeholder : ''
    };
  });
  check('每个字段行都有备注输入框', r1.rows === 2 && r1.noteCount === 2, 'rows=' + r1.rows + ' notes=' + r1.noteCount);
  check('备注为多行输入且无字数上限', r1.tag === 'TEXTAREA' && !r1.hasMaxLength, 'tag=' + r1.tag + ' maxlength=' + r1.hasMaxLength);
  check('备注为小号浅色字', parseFloat(r1.fontSize) <= 12 && r1.color.replace(/\s/g, '') === 'rgb(169,161,146)', 'font=' + r1.fontSize + ' color=' + r1.color);
  check('备注有占位提示', /备注/.test(r1.ph), r1.ph);

  // ---- 2. 输入超长备注：不被限制，且自动撑高 ----
  const LONG = '请填写作品的书名与副标题，若为系列作品请标注第几部；书名请控制在 12 个字以内，' +
    '不要使用特殊符号与表情，副标题可用英文，如需保留原名请在括号内注明。' +
    '这里是第三行，用来验证备注不限字数、可以换行、输入框会自动变高而不会出现滚动条遮挡。';
  const r2 = await page.evaluate((longTxt) => {
    const rows = [...document.querySelectorAll('#tplFields .tpl-fld')];
    const a = rows[0].querySelector('.tpl-note');
    const before = Math.round(a.getBoundingClientRect().height);
    a.value = longTxt; a.dispatchEvent(new Event('input', { bubbles: true }));
    const after = Math.round(a.getBoundingClientRect().height);
    return { len: a.value.length, before, after, overflow: a.scrollHeight - a.clientHeight, scroll: getComputedStyle(a).overflowY };
  }, LONG);
  check('备注接受超长文本（' + r2.len + ' 字，无截断）', r2.len === LONG.length && r2.len > 100, 'len=' + r2.len);
  check('备注框随内容自动增高', r2.after > r2.before + 10, r2.before + 'px -> ' + r2.after + 'px');
  check('长备注不出现内部滚动条', r2.overflow <= 1 && r2.scroll === 'hidden', 'overflow=' + r2.overflow);

  // 第二行也填一条短备注
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#tplFields .tpl-fld')];
    const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set(rows[0].querySelector('.tpl-fld-label'), '书名 / 标题');
    set(rows[0].querySelector('.tpl-note'), document.querySelectorAll('#tplFields .tpl-fld')[0].querySelector('.tpl-note').value);
    rows[0].querySelector('.tpl-fld-req input').checked = true;
    set(rows[1].querySelector('.tpl-fld-label'), '英文标题');
    set(rows[1].querySelector('.tpl-note'), '选填，没有可不填');
  });
  await page.evaluate(() => { document.getElementById('tplName').value = '内页排版'; });
  await sleep(200);

  // 桌面端截图（编辑器弹窗）
  const card = await page.$('#modalCard');
  if (card) await card.screenshot({ path: path.join(ROOT, 'preview24-editor-modal.png') });

  // ---- 3. 保存后落库，且备注保留 ----
  await page.evaluate(() => saveTemplate());
  await sleep(400);
  const r3 = await page.evaluate(() => {
    const t = orderTemplates[orderTemplates.length - 1];
    const raw = JSON.parse(localStorage.getItem('huishi_workbench_v1') || '{}');
    const persisted = (raw.orderTemplates || []).find(x => x.name === '内页排版');
    return {
      id: t.id, name: t.name,
      n: t.fields.length,
      notes: t.fields.map(f => (f.note || '').length),
      n1: (t.fields[0].note || '').length,
      n2: t.fields[1].note,
      keys: t.fields.map(f => f.key),
      persisted: !!persisted, pNotes: persisted ? persisted.fields.map(f => (f.note || '').length) : []
    };
  });
  check('保存后模板含 2 个字段', r3.n === 2, 'n=' + r3.n);
  check('长备注完整保存（' + r3.n1 + ' 字）', r3.n1 === LONG.length, 'n1=' + r3.n1);
  check('短备注保存正确', r3.n2 === '选填，没有可不填', r3.n2);
  check('备注已写入本地存储', r3.persisted && r3.pNotes.join(',') === r3.notes.join(','), 'stored=' + r3.pNotes.join('/'));

  // ---- 4. 重新打开编辑器，备注回填 ----
  await page.evaluate((id) => openTemplateEditor(id), r3.id);
  await sleep(400);
  const r4 = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#tplFields .tpl-fld')];
    const notes = rows.map(r => r.querySelector('.tpl-note'));
    return {
      n: notes.length,
      v1: notes[0].value.length,
      v2: notes[1].value,
      h1: Math.round(notes[0].getBoundingClientRect().height),
      h2: Math.round(notes[1].getBoundingClientRect().height),
      keys: rows.map(r => r.dataset.key)
    };
  });
  check('重新打开时备注回填完整', r4.n === 2 && r4.v1 === LONG.length && r4.v2 === '选填，没有可不填', 'v1=' + r4.v1 + ' v2=' + r4.v2);
  check('回填时长备注自动撑高', r4.h1 > r4.h2 + 10, 'long=' + r4.h1 + 'px short=' + r4.h2 + 'px');
  check('重存模板不改变字段 key', r4.keys.join(',') === r3.keys.join(','), r4.keys.join('|') + ' vs ' + r3.keys.join('|'));

  await page.evaluate(() => closeModal());
  await sleep(200);

  // ---- 5. 加单页：备注以浅色小字显示在字段标题下方 ----
  const r5 = await page.evaluate((id) => {
    goTab('add'); goStep(1);                 // 加单页会 refreshTemplateSelector()，下拉里才有新模板
    const sel = document.getElementById('oTemplate');
    sel.value = id;
    onTemplateChange(sel);
    const notes = [...document.querySelectorAll('#customFields .fl-note')];
    const cs = notes[0] ? getComputedStyle(notes[0]) : null;
    const lab = document.querySelector('#customFields .fl');
    return {
      n: notes.length,
      txt: notes[0] ? notes[0].textContent.length : 0,
      fontSize: cs ? parseFloat(cs.fontSize) : 0,
      color: cs ? cs.color : '',
      ws: cs ? cs.whiteSpace : '',
      afterLabel: !!(lab && lab.nextElementSibling && lab.nextElementSibling.className === 'fl-note'),
      innerHTMLHasTag: /<div class="fl-note">/.test(document.getElementById('customFields').innerHTML)
    };
  }, r3.id);
  check('加单页每个字段显示备注', r5.n === 2 && r5.txt === LONG.length, 'n=' + r5.n + ' chars=' + r5.txt);
  check('加单页备注为浅色小字', r5.fontSize <= 11.5 && r5.color.replace(/\s/g, '') === 'rgb(179,172,160)', 'font=' + r5.fontSize + ' color=' + r5.color);
  check('备注位于字段标题下方', r5.afterLabel, 'afterLabel=' + r5.afterLabel);
  check('备注保留换行（pre-line）', r5.ws === 'pre-line', r5.ws);

  await sleep(300);
  await page.evaluate(() => { goTab('add'); goStep(1); window.scrollTo(0, 0); });
  await sleep(400);
  const addShot = await page.evaluate(() => {
    const cf = document.getElementById('customFields');
    const r = cf.getBoundingClientRect();
    return { y: Math.round(r.top + window.scrollY), h: Math.round(r.height) };
  });
  await page.screenshot({
    path: path.join(ROOT, 'preview24-add-note.png'),
    clip: { x: 0, y: Math.max(0, addShot.y - 120), width: 1440, height: Math.min(1000, addShot.h + 200) }
  });

  // ---- 6. 手机端编辑器不溢出 ----
  const mob = await browser.newPage();
  await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mob.goto('http://127.0.0.1:' + port + '/index.html', { waitUntil: 'networkidle2' });
  await sleep(400);
  const r6 = await mob.evaluate((id) => {
    openTemplates(); openTemplateEditor(id);
    const card = document.getElementById('modalCard');
    const inner = document.querySelector('#tplFields .tpl-note');
    const rows = [...document.querySelectorAll('#tplFields .tpl-fld-row')];
    let spread = 0;
    rows.forEach(row => {
      const kids = [...row.children];
      const c = kids.map(k => { const r = k.getBoundingClientRect(); return r.top + r.height / 2; });
      spread = Math.max(spread, Math.max(...c) - Math.min(...c));
    });
    const tops = rows.map(r => Math.round(r.getBoundingClientRect().top));
    return {
      cardW: Math.round(card.getBoundingClientRect().width),
      vw: window.innerWidth,
      noteRight: Math.round(inner.getBoundingClientRect().right),
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      rowTops: tops, rowSameLine: spread < 12
    };
  }, r3.id);
  check('手机端弹窗不横向溢出', r6.cardW <= r6.vw && !r6.overflowX, 'cardW=' + r6.cardW + ' vw=' + r6.vw + ' noteRight=' + r6.noteRight);
  check('手机端字段名/类型/必填/删除在同一行', r6.rowSameLine, 'tops=' + r6.rowTops.join(','));
  const mcard = await mob.$('#modalCard');
  if (mcard) await mcard.screenshot({ path: path.join(ROOT, 'preview24-editor-mobile.png') });

  check('无运行时报错', errs.length === 0, errs.slice(0, 2).join(' | '));

  await browser.close();
  srv.close();
  const bad = results.filter(r => !r.ok);
  console.log('\n' + (results.length - bad.length) + '/' + results.length + ' passed');
  process.exit(bad.length ? 1 : 0);
})();
