import * as XLSX from 'xlsx';
import * as fs from 'fs';

async function run() {
    if (!fs.existsSync('test_stock.xlsx')) return;
    const buf = fs.readFileSync('test_stock.xlsx');
    const wb = XLSX.read(buf, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    
    if (data.length > 0) {
        console.log("Headers for test_stock.xlsx:");
        data[0].forEach((h, i) => console.log(`${i}: ${h}`));
    }
}
run();
