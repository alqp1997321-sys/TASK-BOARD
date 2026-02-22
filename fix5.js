const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');
// Replace borderRadius:12" with borderRadius:12
c = c.replace(/borderRadius:12"/g, 'borderRadius:12');
fs.writeFileSync('src/app/page.tsx', c);
console.log('fixed');
