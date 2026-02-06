const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../Kody modelowe x.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Row 0 (Header?):');
json[0].forEach((cell, i) => console.log(`${i}: ${cell}`));

console.log('\nRow 1:');
json[1].forEach((cell, i) => console.log(`${i}: ${cell}`));
