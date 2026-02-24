const fs = require('fs');
const lines = fs.readFileSync('src/components/cars/CarCard.tsx', 'utf8').split('\n');
console.log(Buffer.from(lines[86]).toString('hex'));
console.log(lines[86]);
