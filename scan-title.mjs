import fs from 'node:fs';
const files = ['build/index.html', 'publish/index.html', 'designer-mp-prototype.html', 'build/client.html', 'publish/client.html'];
for (const f of files) {
  if (!fs.existsSync(f)) { console.log('[missing]', f); continue; }
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const hits = [];
  lines.forEach((ln, i) => { if (ln.includes('绘事')) hits.push((i+1) + ': ' + ln.trim().slice(0, 70)); });
  console.log(`\n== ${f} (绘事 x${hits.length}) ==`);
  hits.slice(0, 50).forEach(h => console.log('  ' + h));
}
console.log('\n=== done ===');
