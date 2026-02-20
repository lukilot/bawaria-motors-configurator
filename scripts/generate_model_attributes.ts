
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const excelPath = path.resolve(process.cwd(), 'Kody modelowe x.xlsx');
const outputPath = path.resolve(process.cwd(), 'src/lib/model-attributes.ts');

console.log(`Reading Excel: ${excelPath}`);
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Skip header (row 0)
const rows = data.slice(1);

const fuelMap: Record<string, string> = {
    'Benzyna': 'Petrol',
    'Diesel': 'Diesel',
    'Elektryczny': 'Electric',
    'Hybryda plug-in': 'Hybrid', // Or PHEV?
    'Hybryda': 'Hybrid'
};

const entries: string[] = [];
let count = 0;

console.log(`Total rows in sheet: ${rows.length}`);

rows.forEach((row: any, index: number) => {
    const code = row[1]; // Kod modelowy
    // Log first few to verify structure
    if (index < 3) console.log(`Row ${index}:`, row);

    if (!code) return;

    // Check for specific missing codes
    if (code === '81DB' || code === '65GP' || code === '71EG') {
        console.log(`Found target code in Excel: ${code}`);
    }

    const bodyGroup = row[2]; // Grupa modelowa e.g. F70
    const series = row[3];    // Model e.g. Seria 1
    const bodyType = row[4];  // Typ nadwozia e.g. Hatchback
    const fuelRaw = row[8];   // Rodzaj paliwa

    const fuelType = fuelMap[fuelRaw] || fuelRaw || 'Petrol';

    // Clean up series string
    let cleanSeries = series;
    if (series && series.includes(' / ')) {
        cleanSeries = series.split(' / ')[0]; // Take primary e.g. "Seria 4 / i4" -> "Seria 4"
        // Or keep it? The prompt says "Seria 5" in existing file.
        // Let's keep it simple for now, maybe split is safer.
    }

    // Escape strings
    const safe = (s: any) => s ? `'${String(s).replace(/'/g, "\\'")}'` : 'undefined';

    entries.push(`    '${code}': { fuel_type: ${safe(fuelType)}, series: ${safe(series)}, body_group: ${safe(bodyGroup)}, body_type: ${safe(bodyType)} },`);
    count++;
});

const content = `
export interface ModelAttributes {
    fuel_type?: string;
    series?: string;
    body_group?: string; // critical for service pricing (e.g. G60)
    body_type?: string;
}

const MODEL_MAP: Record<string, ModelAttributes> = {
${entries.join('\n')}
};

export function getModelAttributes(code: string): ModelAttributes {
    return MODEL_MAP[code] || {};
}
`;

console.log(`Found ${count} models.`);
// Writing to file manually in script or just output?
// Let's write it.
fs.writeFileSync(outputPath, content, 'utf8');
console.log(`Wrote to ${outputPath}`);
