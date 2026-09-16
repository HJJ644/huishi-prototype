// 验证「单选题 / 多选题」字段类型：模板编辑器 → 保存 → 填写端渲染 → 取值 → 必填校验 → 订单详情 → 回填
const puppeteer = require('./.pptr/node_modules/puppeteer-core');
const http = require('http'), path = require('path'), fs = require('fs');
const ROOT = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
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
let pass = 0, fail = 0;
function ok(label, cond, extra) {
  if (cond) pass++; else fail++;
  console.log((cond ? 'PASS' : 'FAIL') + ' | ' + label + (extra !== undefined ? ' | ' + JSON.stringify(extra) : ''));
}
// 把元素滚到可视区中间，再返回中心坐标（页面为内部滚动容器，直接算坐标可能落在视口外）
async function center(p, sel) {
  await p.evaluate(s => { const el = document.querySelector(s); if (el) el.scrollIntoView({ block: 'center' }); }, sel);
  await sleep(140);
  return p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
}
// 按 top 容差归并成「视觉行数」（同一行的控件存在 1~3px 垂直居中差异）
function lineCount(rects) {
  const tops = rects.map(r => r.top).sort((a, b) => a - b);
  let n = 0, last = -999;
  tops.forEach(t => { if (t - last > 6) { n++; last = t; } });
  return n;
}
// 用真实鼠标点击第 listIdx 组里的第 itemIdx 个选项（先滚入视口再取中心点）
async function clickChoice(p, listIdx, itemIdx) {
  const pick = (li, ii) => {
    const el = document.querySelectorAll('#customFields .choice-list')[li].querySelectorAll('.choice-item')[ii];
    return el;
  };
  await p.evaluate(([li, ii]) => { const el = document.querySelectorAll('#customFields .choice-list')[li].querySelectorAll('.choice-item')[ii]; el.scrollIntoView({ block: 'center' }); }, [listIdx, itemIdx]);
  await sleep(150);
  const pt = await p.evaluate(([li, ii]) => { const r = document.querySelectorAll('#customFields .choice-list')[li].querySelectorAll('.choice-item')[ii].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, vh: window.innerHeight }; }, [listIdx, itemIdx]);
  await p.mouse.click(pt.x, pt.y);
  await sleep(140);
  return pt;
}

(async () => {
  const { srv, port } = await startServer();
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--window-size=1280,980'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 980 });
  const errors = [];
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  let lastDialog = null;
  p.on('dialog', async d => { lastDialog = d.message(); await d.dismiss(); });
  await p.goto('http://127.0.0.1:' + port + '/build/index.html', { waitUntil: 'load' });
  await sleep(400);
  await p.evaluate(() => localStorage.removeItem('huishi_workbench_v1'));
  await p.reload({ waitUntil: 'load' });
  await sleep(400);

  // ---------- A. 模板编辑器：新增单选 / 多选字段 ----------
  await p.evaluate(() => {
    openTemplateEditor();
    document.getElementById('tplName').value = '选择字段模板';
    addTplFieldRow({ key: 'k_rush', label: '加急方式补充', type: 'radio', required: true, options: ['不加急', '普通加急', '超级加急'], note: '选择最接近的一项' });
    addTplFieldRow({ key: 'k_style', label: '参考风格', type: 'checkbox', required: false, options: ['厚涂', '赛璐璐', '水彩'], note: '' });
    addTplFieldRow({ key: 'k_note', label: '补充说明', type: 'text', required: false, options: [], note: '' });
  });
  await sleep(300);
  const editor = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('#tplFields .tpl-fld')];
    return {
      types: rows.map(r => r.querySelector('.tpl-fld-type').value),
      optsDisplay: rows.map(r => r.querySelector('.tpl-fld-opts').style.display),
      optsValue: rows.map(r => r.querySelector('.tpl-fld-opts').value),
      optsPlaceholder: rows.map(r => r.querySelector('.tpl-fld-opts').placeholder),
      optionLabels: [...rows[0].querySelectorAll('.tpl-fld-type option')].map(o => o.textContent),
      rowsInOneLine: rows.map(r => [...r.querySelector('.tpl-fld-row').children].map(el => ({ top: Math.round(el.getBoundingClientRect().top) }))),
    };
  });
  ok('A1 类型下拉新增单选题/多选题', editor.optionLabels.includes('单选题') && editor.optionLabels.includes('多选题'), editor.optionLabels);
  ok('A2 已有字段类型正确回填', JSON.stringify(editor.types) === JSON.stringify(['radio', 'checkbox', 'text']), editor.types);
  ok('A3 候选项框只对选择类显示', JSON.stringify(editor.optsDisplay) === JSON.stringify(['block', 'block', 'none']), editor.optsDisplay);
  ok('A4 候选项正确回填', editor.optsValue[0] === '不加急,普通加急,超级加急' && editor.optsValue[1] === '厚涂,赛璐璐,水彩', editor.optsValue);
  ok('A5 占位文案按类型区分', /单选/.test(editor.optsPlaceholder[0]) && /多选/.test(editor.optsPlaceholder[1]) && /下拉选项/.test(editor.optsPlaceholder[2]), editor.optsPlaceholder);
  const rowLines = editor.rowsInOneLine.map(lineCount);
  ok('A6 字段行版式仍为 2 行（未被撑破）', rowLines.every(n => n === 2), rowLines);

  // ---------- A7. 切换类型 → 候选项框即时显隐 ----------
  const switchCheck = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('#tplFields .tpl-fld')];
    const sel = rows[2].querySelector('.tpl-fld-type');
    sel.value = 'radio'; sel.dispatchEvent(new Event('change'));
    const on = { display: rows[2].querySelector('.tpl-fld-opts').style.display, ph: rows[2].querySelector('.tpl-fld-opts').placeholder };
    sel.value = 'text'; sel.dispatchEvent(new Event('change'));
    const off = rows[2].querySelector('.tpl-fld-opts').style.display;
    return { on, off };
  });
  ok('A7 切换类型即时显隐候选项框', switchCheck.on.display === 'block' && /单选/.test(switchCheck.on.ph) && switchCheck.off === 'none', switchCheck);

  // ---------- B. 候选项不足 2 个 → 拦截保存 ----------
  await p.evaluate(() => { document.querySelectorAll('#tplFields .tpl-fld')[0].querySelector('.tpl-fld-opts').value = '只有一个'; });
  await p.evaluate(() => { [...document.querySelectorAll('.m-actions button')].find(x => /保存模板/.test(x.textContent)).click(); });
  await sleep(220);
  const guard = await p.evaluate(() => ({ modalOpen: document.getElementById('modalMask').classList.contains('show'), toast: document.getElementById('toast').textContent, shown: document.getElementById('toast').classList.contains('show') }));
  ok('B1 选择类少于 2 项被拦截', guard.modalOpen && guard.shown && /至少填写 2 个候选项/.test(guard.toast), guard);

  // ---------- B2. 修正后保存 ----------
  await p.evaluate(() => { document.querySelectorAll('#tplFields .tpl-fld')[0].querySelector('.tpl-fld-opts').value = '不加急,普通加急,超级加急'; });
  await p.evaluate(() => { [...document.querySelectorAll('.m-actions button')].find(x => /保存模板/.test(x.textContent)).click(); });
  await sleep(320);
  const saved = await p.evaluate(() => {
    const t = orderTemplates.find(x => x.name === '选择字段模板');
    const raw = JSON.parse(localStorage.getItem('huishi_workbench_v1') || '{}');
    const st = (raw.orderTemplates || []).find(x => x.name === '选择字段模板');
    return {
      modalClosed: !document.getElementById('modalMask').classList.contains('show'),
      fields: t ? t.fields.map(f => ({ key: f.key, label: f.label, type: f.type, required: f.required, options: f.options, note: f.note })) : null,
      persisted: !!st,
    };
  });
  ok('B2 保存成功并关闭弹窗', saved.modalClosed && !!saved.fields, saved.modalClosed);
  ok('B3 类型/候选项/必填已存盘', !!saved.fields && saved.fields[0].type === 'radio' && saved.fields[1].type === 'checkbox' && saved.fields[0].options.length === 3 && saved.fields[0].required === true && saved.fields[1].options.length === 3, saved.fields);
  ok('B4 已写入 localStorage', saved.persisted);

  // ---------- C. 填写端渲染 ----------
  const tplId = await p.evaluate(() => (orderTemplates.find(x => x.name === '选择字段模板') || {}).id);
  await p.evaluate(id => { goTab('add'); refreshTemplateSelector(); const sel = document.getElementById('oTemplate'); sel.value = id; onTemplateChange(sel); }, tplId);
  await sleep(350);
  const render = await p.evaluate(() => {
    const lists = [...document.querySelectorAll('#customFields .choice-list')];
    return {
      listCount: lists.length,
      radios: [...document.querySelectorAll('#customFields .choice-list input[type="radio"]')].map(i => i.value),
      checks: [...document.querySelectorAll('#customFields .choice-list input[type="checkbox"]')].map(i => i.value),
      names: lists.map(l => l.dataset.cfGroup),
      multi: lists.map(l => l.dataset.cfMulti),
      labelTexts: lists.map(l => [...l.querySelectorAll('.choice-item span')].map(s => s.textContent)),
      checkedInitially: document.querySelectorAll('#customFields .choice-list input:checked').length,
      textField: !!document.querySelector('#customFields input[data-cf="k_note"]'),
      noteRendered: !!document.querySelector('#customFields .fl-note'),
      radioNameAttr: [...document.querySelectorAll('#customFields .choice-list input[type="radio"]')].map(i => i.name),
      requiredStar: document.querySelectorAll('#customFields .req').length,
    };
  });
  ok('C1 单选/多选各渲染一组', render.listCount === 2, render.listCount);
  ok('C2 单选 3 项、多选 3 项', render.radios.length === 3 && render.checks.length === 3, { radios: render.radios, checks: render.checks });
  ok('C3 组标识 / 多选标记正确', JSON.stringify(render.multi) === JSON.stringify(['0', '1']) && JSON.stringify(render.names) === JSON.stringify(['k_rush', 'k_style']), { names: render.names, multi: render.multi });
  ok('C4 选项文案正确', JSON.stringify(render.labelTexts[1]) === JSON.stringify(['厚涂', '赛璐璐', '水彩']), render.labelTexts);
  ok('C5 同组 radio 共用 name', new Set(render.radioNameAttr).size === 1, render.radioNameAttr);
  ok('C6 初始无勾选、文本与备注仍正常', render.checkedInitially === 0 && render.textField && render.noteRendered && render.requiredStar >= 1);

  // ---------- D. 真实鼠标点击交互 ----------
  const pt1 = await clickChoice(p, 0, 1);
  const radioPick = await p.evaluate(() => [...document.querySelectorAll('#customFields .choice-list')[0].querySelectorAll('input')].map(i => i.checked));
  ok('D1 单选互斥（只勾一个）', JSON.stringify(radioPick) === JSON.stringify([false, true, false]), { radioPick, pt1 });
  await clickChoice(p, 0, 2);   // 点第二项 → 应切换，仍只有一个勾选
  const radioPick2 = await p.evaluate(() => [...document.querySelectorAll('#customFields .choice-list')[0].querySelectorAll('input')].map(i => i.checked));
  ok('D1b 单选可改选（互斥仍成立）', JSON.stringify(radioPick2) === JSON.stringify([false, false, true]), radioPick2);
  await clickChoice(p, 0, 1);

  await clickChoice(p, 1, 0);
  await clickChoice(p, 1, 2);
  const checkPick = await p.evaluate(() => [...document.querySelectorAll('#customFields .choice-list')[1].querySelectorAll('input')].map(i => i.checked));
  ok('D2 多选可同时勾多项', JSON.stringify(checkPick) === JSON.stringify([true, false, true]), checkPick);

  const styleCheck = await p.evaluate(() => {
    const i = document.querySelector('#customFields .choice-list input[type="checkbox"]:checked');
    const cs = getComputedStyle(i);
    const r = i.getBoundingClientRect();
    return { bg: cs.backgroundColor, border: cs.borderTopColor, size: Math.round(r.width) + 'x' + Math.round(r.height), appearance: cs.appearance };
  });
  ok('D3 勾选态为自绘绿色方块（非原生样式）', styleCheck.bg === 'rgb(95, 164, 124)' && styleCheck.size === '18x18' && styleCheck.appearance === 'none', styleCheck);

  // ---------- E. 取值 ----------
  const data = await p.evaluate(() => { document.querySelector('#customFields input[data-cf="k_note"]').value = '青花瓷质感'; return getCustomFieldsData(); });
  ok('E1 单选取选中值', (data.find(d => d.key === 'k_rush') || {}).value === '普通加急', data);
  ok('E2 多选取值以「、」连接', (data.find(d => d.key === 'k_style') || {}).value === '厚涂、水彩', data);
  ok('E3 收集顺序与模板一致', JSON.stringify(data.map(d => d.key)) === JSON.stringify(['k_rush', 'k_style', 'k_note']), data.map(d => d.key));
  ok('E4 每项都带 label', data.length === 3 && data.every(d => !!d.label), data);

  // ---------- F. 必填校验：单选未选 → 拦截提交 ----------
  await p.evaluate(() => {
    document.getElementById('oName').value = '单选多选测试单';
    // 只清空单选组（保留多选勾选，用于验证切步骤不丢状态）
    document.querySelectorAll('#customFields .choice-list')[0].querySelectorAll('input:checked').forEach(i => { i.checked = false; });
    goStep(2); addProdLine();
    const sel = document.querySelector('#prodLines .prod-line select[onchange="onProdSelect(this)"]');
    sel.selectedIndex = 1; onProdSelect(sel);
  });
  await sleep(300);
  await p.evaluate(() => { goStep(1); submitOrder(); });
  await sleep(250);
  const reqBlock = await p.evaluate(() => ({ toast: document.getElementById('toast').textContent, shown: document.getElementById('toast').classList.contains('show'), saved: (JSON.parse(localStorage.getItem('huishi_workbench_v1') || '{}').orders || []).some(o => o.proj === '单选多选测试单') }));
  ok('F1 单选必填未选被拦截', reqBlock.shown && /请填写模板必填项：加急方式补充/.test(reqBlock.toast) && !reqBlock.saved, reqBlock);

  // ---------- G. 补齐后提交 → 落盘 → 订单详情展示 ----------
  const kept = await p.evaluate(() => [...document.querySelectorAll('#customFields .choice-list')[1].querySelectorAll('input')].map(i => i.checked));
  ok('G0 切步骤/拦截后多选勾选未丢失', JSON.stringify(kept) === JSON.stringify([true, false, true]), kept);
  await p.evaluate(() => { document.querySelectorAll('#customFields .choice-list')[0].querySelectorAll('input')[2].click(); });
  await sleep(120);
  await p.evaluate(() => submitOrder());
  await sleep(400);
  const orderInfo = await p.evaluate(() => {
    const o = orders.find(x => x.proj === '单选多选测试单');
    return o ? { id: o.id, templateName: o.templateName, cf: o.customFields } : null;
  });
  ok('G1 订单已保存', !!orderInfo, orderInfo);
  ok('G2 订单字段值正确', !!orderInfo && (orderInfo.cf.find(c => c.key === 'k_rush') || {}).value === '超级加急' && (orderInfo.cf.find(c => c.key === 'k_style') || {}).value === '厚涂、水彩', orderInfo && orderInfo.cf);

  await p.evaluate(id => openOrderDetail(id), orderInfo.id);
  await sleep(350);
  const detail = await p.evaluate(() => {
    const card = [...document.querySelectorAll('#orderDetail .od-card, .od-card')].find(c => /模板字段/.test(c.querySelector('.grp-title') ? c.querySelector('.grp-title').textContent : ''));
    return card ? [...card.querySelectorAll('.od-row')].map(r => ({ k: r.querySelector('.k').textContent, v: r.querySelector('.v').textContent })) : null;
  });
  ok('G3 订单详情展示单选/多选值', !!detail && detail.some(r => r.k === '加急方式补充' && r.v === '超级加急') && detail.some(r => r.k === '参考风格' && r.v === '厚涂、水彩'), detail);

  // ---------- H. 编辑订单回填（prefillOrderForm 真实链路） ----------
  await p.evaluate(() => { const o = orders.find(x => x.proj === '单选多选测试单'); prefillOrderForm(o); });
  await sleep(400);
  const prefill = await p.evaluate(() => {
    const lists = [...document.querySelectorAll('#customFields .choice-list')];
    return {
      lists: lists.length,
      radioChecked: [...(lists[0] ? lists[0].querySelectorAll('input') : [])].map(i => i.checked),
      checkChecked: [...(lists[1] ? lists[1].querySelectorAll('input') : [])].map(i => i.checked),
      noteVal: (document.querySelector('#customFields input[data-cf="k_note"]') || {}).value,
    };
  });
  ok('H1 编辑订单单选正确回填', JSON.stringify(prefill.radioChecked) === JSON.stringify([false, false, true]), prefill);
  ok('H2 编辑订单多选正确回填', JSON.stringify(prefill.checkChecked) === JSON.stringify([true, false, true]), prefill);
  ok('H3 文本字段回填正常', prefill.noteVal === '青花瓷质感', prefill.noteVal);

  // ---------- I. 截图 ----------
  await p.evaluate(() => { closeModal(); goTab('add'); });
  await sleep(300);
  await p.evaluate(() => { const el = document.getElementById('customFields'); if (el) el.scrollIntoView({ block: 'center' }); });
  await sleep(250);
  await p.screenshot({ path: path.join(ROOT, 'preview-choice-add.png'), fullPage: false });
  await p.evaluate(() => openTemplateEditor((orderTemplates.find(x => x.name === '选择字段模板') || {}).id));
  await sleep(320);
  await p.evaluate(() => { const el = document.getElementById('tplFields'); if (el) el.scrollIntoView({ block: 'center' }); });
  await sleep(220);
  await p.screenshot({ path: path.join(ROOT, 'preview-choice-editor.png') });
  const reopen = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('#tplFields .tpl-fld')];
    return { types: rows.map(r => r.querySelector('.tpl-fld-type').value), opts: rows.map(r => r.querySelector('.tpl-fld-opts').value) };
  });
  ok('I1 重开编辑器类型与候选项仍在', JSON.stringify(reopen.types) === JSON.stringify(['radio', 'checkbox', 'text']) && reopen.opts[1] === '厚涂,赛璐璐,水彩', reopen);
  await p.evaluate(() => closeModal());
  await sleep(200);

  // ---------- J. 移动端 ----------
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await sleep(300);
  await p.evaluate(id => { goTab('add'); const sel = document.getElementById('oTemplate'); sel.value = id; onTemplateChange(sel); }, tplId);
  await sleep(350);
  const mobile = await p.evaluate(() => {
    const lists = [...document.querySelectorAll('#customFields .choice-list')];
    const overflow = lists.map(l => l.scrollWidth - l.clientWidth);
    const items = lists.map(l => [...l.querySelectorAll('.choice-item')].map(el => Math.round(el.getBoundingClientRect().width)));
    const hidden = lists.map(l => [...l.querySelectorAll('.choice-item')].filter(el => { const r = el.getBoundingClientRect(); return r.width === 0 || r.height === 0; }).length);
    return { count: lists.length, overflow, items, hidden, checked: document.querySelectorAll('#customFields .choice-list input:checked').length };
  });
  ok('J1 移动端渲染 2 组且无横向溢出', mobile.count === 2 && mobile.overflow.every(v => v <= 1), mobile);
  ok('J2 移动端选项均可点击（无 0 尺寸）', mobile.hidden.every(n => n === 0), mobile.hidden);
  await p.evaluate(() => { const l = document.querySelectorAll('#customFields .choice-list')[0]; l.scrollIntoView({ block: 'center' }); });
  await sleep(250);
  await p.screenshot({ path: path.join(ROOT, 'preview-choice-mobile.png') });

  // ---------- L. 客户问卷页（client.html）也要支持单选/多选 ----------
  await p.setViewport({ width: 1280, height: 980 });
  await p.goto('http://127.0.0.1:' + port + '/build/client.html?tpl=' + encodeURIComponent(tplId), { waitUntil: 'load' });
  await sleep(500);
  const cli = await p.evaluate(() => {
    const lists = [...document.querySelectorAll('#tplFields .choice-list')];
    return {
      cardShown: getComputedStyle(document.getElementById('tplFieldsCard')).display !== 'none',
      lists: lists.length,
      radios: [...document.querySelectorAll('#tplFields input[type="radio"]')].map(i => i.value),
      checks: [...document.querySelectorAll('#tplFields input[type="checkbox"]')].map(i => i.value),
      texts: lists.map(l => [...l.querySelectorAll('.ch-item span')].map(s => s.textContent)),
      multi: lists.map(l => l.dataset.multi),
    };
  });
  ok('L1 客户页渲染单选/多选', cli.cardShown && cli.lists === 2 && cli.radios.length === 3 && cli.checks.length === 3, cli);
  ok('L2 客户页选项文案与多选标记正确', JSON.stringify(cli.texts[0]) === JSON.stringify(['不加急', '普通加急', '超级加急']) && JSON.stringify(cli.multi) === JSON.stringify(['0', '1']), cli);

  // 真实点击：先选多选两项，单选留空 → 提交应被必填拦住
  const cliClick = async (listIdx, itemIdx) => {
    await p.evaluate(([li, ii]) => { document.querySelectorAll('#tplFields .choice-list')[li].querySelectorAll('.ch-item')[ii].scrollIntoView({ block: 'center' }); }, [listIdx, itemIdx]);
    await sleep(150);
    const c = await p.evaluate(([li, ii]) => { const r = document.querySelectorAll('#tplFields .choice-list')[li].querySelectorAll('.ch-item')[ii].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, [listIdx, itemIdx]);
    await p.mouse.click(c.x, c.y); await sleep(140);
  };
  await cliClick(1, 0); await cliClick(1, 2);
  const cliPick = await p.evaluate(() => [...document.querySelectorAll('#tplFields .choice-list')[1].querySelectorAll('input')].map(i => i.checked));
  ok('L3 客户页多选可多选', JSON.stringify(cliPick) === JSON.stringify([true, false, true]), cliPick);

  await p.evaluate(() => {
    document.getElementById('fProj').value = '客户页选择字段测试';
    document.getElementById('fCustomer').value = '小鹿';
    document.getElementById('fContact').value = 'lu@example.com';
    document.querySelector('#lines .c-line .cl-name').value = '头像';
  });
  lastDialog = null;
  await p.evaluate(() => submitQuestionnaire());
  await sleep(300);
  ok('L4 客户页单选必填被拦截', !!lastDialog && /请填写必填项：加急方式补充/.test(lastDialog), lastDialog);

  await cliClick(0, 1);
  lastDialog = null;
  await p.evaluate(() => submitQuestionnaire());
  await sleep(400);
  const cliOrder = await p.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('huishi_workbench_v1') || '{}');
    const o = (raw.orders || []).find(x => x.proj === '客户页选择字段测试');
    return { success: /需求已提交/.test(document.getElementById('app').textContent), cf: o ? o.customFields : null, source: o ? o.source : null };
  });
  ok('L5 客户页提交成功', cliOrder.success && cliOrder.source === 'client', cliOrder);
  ok('L6 客户页单选/多选取值落盘正确', !!cliOrder.cf && (cliOrder.cf.find(c => c.key === 'k_rush') || {}).value === '普通加急' && (cliOrder.cf.find(c => c.key === 'k_style') || {}).value === '厚涂、水彩', cliOrder.cf);
  await p.screenshot({ path: path.join(ROOT, 'preview-choice-client.png') });

  // ---------- K. 控制台错误 ----------
  const realErrors = errors.filter(e => !/favicon|404 \(Not Found\)|Failed to load resource/i.test(e));
  ok('K1 无 JS 报错', realErrors.length === 0, realErrors);

  console.log('\n===== RESULT: ' + pass + ' passed, ' + fail + ' failed =====');
  await b.close();
  srv.close();
  process.exit(fail ? 1 : 0);
})();
