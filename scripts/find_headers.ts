import * as XLSX from 'xlsx';
import * as fs from 'fs';

async function run() {
    const buf = fs.readFileSync('real_stock.xlsx');
    const wb = XLSX.read(buf, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    
    for (let i = 0; i < Math.min(20, data.length); i++) {
        if (data[i].some(cell => String(cell).includes('VIN'))) {
            console.log(`Header Row found at index ${i}:`);
            console.log(data[i].map((h, j) => `${j}: ${h}`).join(', '));
            break;
        }
    }
}
run();
