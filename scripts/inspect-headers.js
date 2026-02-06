const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../real_stock.xlsx');
console.log('Reading file:', filePath);

try {
    const wb = XLSX.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    // Convert first 20 rows to array of arrays to find the header
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, limit: 20 });

    rows.forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
    });

} catch (e) {
    console.error('Error reading file:', e);
}
