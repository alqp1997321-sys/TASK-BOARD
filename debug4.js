const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = c.split('\n');
const line = lines[379];
// Find all occurrences of borderRadius in this line
let idx = line.indexOf('borderRadius');
while (idx >= 0) {
  console.log('Found at:', idx);
  console.log('Context:', line.slice(idx, idx+20));
  console.log('Hex:', Buffer.from(line.slice(idx+13, idx+17)).toString('hex'));
  idx = line.indexOf('borderRadius', idx + 1);
}
