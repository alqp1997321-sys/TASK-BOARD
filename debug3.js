const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = c.split('\n');
const line = lines[379];
console.log('Line 380:', line);
console.log('Index of borderRadius:', line.indexOf('borderRadius'));
console.log('Substring:', line.slice(line.indexOf('borderRadius'), line.indexOf('borderRadius')+20));
console.log('Hex:', Buffer.from(line.slice(line.indexOf('borderRadius')+13, line.indexOf('borderRadius')+17)).toString('hex'));
