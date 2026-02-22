const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = c.split('\n');
const line = lines[379];
const idx = line.indexOf('borderRadius') + 13;
// Print each char
for (let i = idx; i < idx+5; i++) {
  console.log('Char', i-idx, ':', line[i], '=', line.charCodeAt(i), '=', line.charCodeAt(i).toString(16));
}
