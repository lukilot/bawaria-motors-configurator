import * as XLSX from 'xlsx';

async function checkVins() {
    const wb = XLSX.readFile('/Users/lukilot/Documents/Bawaria Motors/export-list-stock-20260409-bee592ed-a43b-35c5-ac94-7ca65e65014b (1).xlsx');
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const targetVins = [
        'WBA81DB020CW92214',
        'WBS41HK040CU83333',
        'WBS41HK030CU76387',
        'WBS41HK010CU96010'
    ];

    const COL_VIN = 2; // Usually VIN is in C
    
    let foundCount = 0;

    data.forEach((row: any, i) => {
        // Search all columns just in case
        for (const cell of row) {
            const cellStr = String(cell || '').trim().toUpperCase();
            if (targetVins.includes(cellStr)) {
                console.log(`FOUND ${cellStr} on Row ${i + 1}`);
                console.log(`Entire Row Data:`, row);
                foundCount++;
            }
        }
    });

    console.log(`Total found: ${foundCount} out of ${targetVins.length}`);
}

checkVins();
