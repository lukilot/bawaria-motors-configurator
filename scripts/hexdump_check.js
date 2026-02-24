const fs = require('fs');

function checkFile(pathStr) {
    if (!fs.existsSync(pathStr)) return;
    const buf = fs.readFileSync(pathStr);
    let idx = buf.indexOf('mr-[');
    while (idx !== -1) {
        console.log(`Found mr-[ at ${idx} in ${pathStr}`);
        const snippet = buf.subarray(Math.max(0, idx - 5), Math.min(buf.length, idx + 20));
        console.log('Hex:', snippet.toString('hex'));
        console.log('Str:', snippet.toString('ascii').replace(/\n/g, '\\n'));
        idx = buf.indexOf('mr-[', idx + 1);
    }
}

checkFile('src/components/cars/CarCard.tsx');
checkFile('src/components/cars/CarRow.tsx');
