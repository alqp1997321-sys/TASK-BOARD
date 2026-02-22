const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');
console.log('Before:', c.includes('borderRadius:12""'));
c = c.replace(/borderRadius:12""/g, 'borderRadius:12');
console.log('After:', c.includes('borderRadius:12""'));
fs.writeFileSync('src/app/page.tsx', c);
