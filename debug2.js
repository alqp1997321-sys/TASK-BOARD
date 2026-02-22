const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');
// Find the exact pattern around borderRadius:12
const idx = c.indexOf('borderRadius:12');
console.log('Found at:', idx);
console.log('Context:', c.slice(idx-10, idx+30));
console.log('Hex:', Buffer.from(c.slice(idx+13, idx+16)).toString('hex'));
