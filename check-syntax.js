const fs = require('fs'), vm = require('vm');
const file = process.argv[2] || 'build/index.html';
const h = fs.readFileSync(file, 'utf8');
const re = /<script>([\s\S]*?)<\/script>/g;
let m, all = '';
while ((m = re.exec(h))) all += m[1] + '\n;\n';
try {
  new vm.Script(all, { filename: 'app.js' });
  console.log('SYNTAX OK chars=' + all.length);
} catch (e) {
  console.log('SYNTAX ERROR: ' + e.message);
  process.exit(1);
}
