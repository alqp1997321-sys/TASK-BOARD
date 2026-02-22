const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');
// Fix borderRadius:12"" to borderRadius:12"
c = c.split('borderRadius:12""').join('borderRadius:12"');
fs.writeFileSync('src/app/page.tsx', c);
console.log('fixed');
