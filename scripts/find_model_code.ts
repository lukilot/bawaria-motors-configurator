
import * as XLSX from 'xlsx';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'Kody modelowe x.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Find row with '81DB' in column 1 (index 1)
const target = '81DB';
const row = data.find((r: any) => r[1] === target);

if (row) {
    console.log('Found:', row);
    console.log('Model Code:', row[1]);
    console.log('Series Code (Body Group):', row[2]);
    console.log('Series Name:', row[3]);
    console.log('Body Type:', row[4]);
    console.log('Fuel Type:', row[8]);
} else {
    console.log('Not found');
}
