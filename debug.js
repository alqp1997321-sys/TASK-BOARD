const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');
// Find the specific line
const lines = c.split('\n');
console.log('Line 380:', lines[379]);
