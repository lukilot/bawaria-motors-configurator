const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../Kody modelowe x.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Headers:', json[0]);
console.log('First 3 data rows:', json.slice(1, 4));
