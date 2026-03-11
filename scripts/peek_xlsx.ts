import * as XLSX from 'xlsx';
import * as fs from 'fs';

async function run() {
    const buf = fs.readFileSync('real_stock.xlsx');
    const wb = XLSX.read(buf, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    
    if (data.length > 0) {
        console.log("Headers (first 20):");
        const headers = data[0];
        for (let i = 0; i < 20; i++) {
            console.log(`${i}: ${headers[i] || 'EMPTY'}`);
        }
    }

    console.log("\nSearching for 490 color rows...");
    const matches = data.filter(row => String(row[8] || '').trim() === '490'); 
    console.log(`Found ${matches.length} matches for 490.`);
    matches.slice(0, 5).forEach(row => {
        console.log(`490 Row VIN ${row[2]}: Col 10(K)=${row[10]}, Col 11(L)=${row[11]}, Col 12(M)=${row[12]}`);
    });
}
run();
