import * as XLSX from 'xlsx';

const wb = XLSX.readFile('/Users/lukilot/Documents/Bawaria Motors/export-list-stock-20260409-bee592ed-a43b-35c5-ac94-7ca65e65014b (1).xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

let taken = 0;
let bmwplTaken = 0;
let allDealersTaken = 0;

data.slice(1).forEach((row: any) => {
   const takenVal = String(row[14] || '').toUpperCase().trim();
   const dealerVal = String(row[13] || '').toUpperCase().trim();
   const isBmwPl = ['BMW PL', 'BMW POLSKA', 'BMW POLAND', 'NSC'].some((term: string) => dealerVal.includes(term));
   
   if (takenVal.length > 0 && !takenVal.includes('NIE')) {
       allDealersTaken++;
       if (isBmwPl) bmwplTaken++;
   }

});

console.log({ allDealersTaken, bmwplTaken });
