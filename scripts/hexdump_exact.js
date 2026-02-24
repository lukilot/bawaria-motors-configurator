const fs = require('fs');

function checkFile(pathStr) {
    if (!fs.existsSync(pathStr)) return;
    const buf = fs.readFileSync(pathStr);
    let str = buf.toString('utf8');
    let idx = str.indexOf('mr-[');
    while (idx !== -1) {
        console.log(`Found mr-[ at ${idx} in ${pathStr}`);
        const snippet = str.substring(Math.max(0, idx - 5), Math.min(str.length, idx + 20));
        console.log('Str:', JSON.stringify(snippet));
        idx = str.indexOf('mr-[', idx + 1);
    }
}

checkFile('src/components/cars/CarCard.tsx');
checkFile('src/components/cars/CarRow.tsx');
