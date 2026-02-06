const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../real_stock.xlsx');

const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];

// scan first 100 rows
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, limit: 100 });

let headerRowIndex = -1;

rows.forEach((row, i) => {
    const rowStr = JSON.stringify(row).toLowerCase();
    // Look for signature columns
    if (rowStr.includes('vin') || rowStr.includes('status') || rowStr.includes('model') || rowStr.includes('typ')) {
        console.log(`Potential Header at Row ${i}:`, row);
        headerRowIndex = i;
    }
});

if (headerRowIndex === -1) {
    console.log("Could not find a clear header row. Data might be headerless.");
    // Print a sample data row to verify indices
    const sample = rows.find(r => r[3] && r[3].toString().startsWith('W')); // Look for VIN-like
    console.log("Sample Data Row:", sample);
}
