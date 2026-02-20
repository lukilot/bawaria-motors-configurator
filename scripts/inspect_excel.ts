
import * as XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'Kody modelowe x.xlsx');
console.log(`Reading file: ${filePath}`);

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Get headers (first row)
const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
const headers = [];
for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
    headers.push(cell ? cell.v : undefined);
}

console.log('Headers:', headers);

// Get a few rows
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log('First 5 rows:', data.slice(0, 5));

// Check specifically for 71FN
// Assuming one of the columns is model code. Let's look at the data first.
