const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');
// Replace the exact pattern on line 380
const lines = c.split('\n');
lines[379] = lines[379].replace('borderRadius:12""}', 'borderRadius:12"}');
fs.writeFileSync('src/app/page.tsx', lines.join('\n'));
console.log('fixed line 380');
