// 把「新建订单」步骤1里的「基本信息」组移到最上方（订单模板之上）
const fs = require('fs');
const f = 'build/index.html';
let s = fs.readFileSync(f, 'utf8');
const before = s.length;

const step1Tag = '        <div class="step-panel show" id="step1" data-page-node-id="yGMaZtxo8wALZ0i6BzYWpI">';
const startM = '          <!-- 基本信息组 -->';
const endM   = '          <!-- 费用信息组 -->';

const k = s.indexOf(step1Tag);
const i = s.indexOf(startM);
const j = s.indexOf(endM);
console.log('idx', { k, i, j });
if (k < 0 || i < 0 || j < 0 || i > j) { console.error('MARKER FAIL'); process.exit(1); }
if (s.indexOf(startM, i + 1) !== -1) { console.error('基本信息组 marker not unique'); process.exit(1); }
if (s.indexOf(endM, j + 1) !== -1) { console.error('费用信息组 marker not unique'); process.exit(1); }

let block = s.slice(i, j);
block = block.replace(/\s+$/, '\n');
console.log('block len', block.length, 'head', JSON.stringify(block.slice(0, 30)), 'tail', JSON.stringify(block.slice(-24)));

// 1) 从原位置移除
s = s.slice(0, i) + s.slice(j);
// 2) 插到 step1 开标签之后
const k2 = s.indexOf(step1Tag);
const nl = s.indexOf('\n', k2);
s = s.slice(0, nl + 1) + block + '\n' + s.slice(nl + 1);

fs.writeFileSync(f, s);
console.log('written len', before, '->', s.length);

const pBasic = s.indexOf(startM);
const pTpl = s.indexOf('<!-- 订单模板选择 -->');
console.log('basic-before-tpl:', pBasic >= 0 && pTpl >= 0 && pBasic < pTpl, { pBasic, pTpl });
console.log('basic marker count:', (s.match(/<!-- 基本信息组 -->/g) || []).length);
console.log('fee marker count:', (s.match(/<!-- 费用信息组 -->/g) || []).length);
