import fs from 'node:fs';
const OLD = '绘事工作台';
const NEW = 'Design · 美工接单助手';
const pairs = [
  ['build/index.html', ['publish/index.html', 'designer-mp-prototype.html']],
  ['build/client.html', ['publish/client.html', 'client.html']],
];
for (const [src, dsts] of pairs) {
  let s = fs.readFileSync(src, 'utf8');
  const n = (s.match(new RegExp(OLD, 'g')) || []).length;
  s = s.split(OLD).join(NEW);
  fs.writeFileSync(src, s);
  console.log('updated', src, '(' + n + ' hits)');
  for (const d of dsts) {
    fs.writeFileSync(d, s);
    console.log('  -> synced', d);
  }
}
console.log('=== done ===');
