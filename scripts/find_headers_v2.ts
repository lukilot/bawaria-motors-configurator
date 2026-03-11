import * as XLSX from 'xlsx';
import * as fs from 'fs';

async function run() {
    const buf = fs.readFileSync('real_stock.xlsx');
    const wb = XLSX.read(buf, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    
    const hRow = data[2]; // Based on find_headers.ts
    if (hRow) {
        console.log("Full Headers list:");
        hRow.forEach((h, i) => console.log(`${i}: ${h}`));
    }
}
run();
