import * as XLSX from 'xlsx';
import * as fs from 'fs';

async function run() {
    const buf = fs.readFileSync('real_stock.xlsx');
    const wb = XLSX.read(buf, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    
    console.log("Searching for 'Individual' or '490' in all cells...");
    data.forEach((row, i) => {
        row.forEach((cell, j) => {
            if (String(cell).includes('Individual') || String(cell).includes('490')) {
                console.log(`Match at [${i}, ${j}]: ${cell}`);
                console.log(`Entire Row ${i}: ${JSON.stringify(row)}`);
            }
        });
    });
}
run();
