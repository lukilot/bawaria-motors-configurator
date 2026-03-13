import * as XLSX from 'xlsx';
import { StockCar, ImportResult } from '@/types/stock';
import { CHASSIS_MAPPING } from './chassis-mapping';

// Header mapping configuration
const COL_MAP: Record<string, string[]> = {
    vin: ['VIN'],
    status_code: ['Order Status'],
    order_status_text: ['Status Sprzedaży', 'Order Status Desc'],
    model_code: ['Model Code'],
    model_name: ['Model Description'],
    body_group: ['Body Group'], // Col I
    color_code: ['Color Code'],
    upholstery_code: ['Upholstery Code'],
    options_string: ['Options String'],
    processing_type: ['Processing Type'],
    prod_date: ['Actual Production Date'],
    sales_status: ['Status Sprzedaży', 'Sales Status'], // Col R
    reservation: ['Rezerwacja', 'Reservation'] // Col S
};

function parseOptionString(optString: string): string[] {
    if (!optString) return [];

    // User Requirement: Preserve package grouping "337 ( 1G6 )"
    // Approach: Match parenthesized groups or standalone tokens
    // improved regex: matches "CODE ( ... )" as one token OR standalone "CODE"
    // But be careful: "337 ( 1G6 )" -> "337 ( 1G6 )"

    // Normalize separators: replace commas and semicolons with spaces
    let norm = optString.trim().replace(/[,;]/g, ' ').replace(/\s+/g, ' ');

    const result: string[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < norm.length; i++) {
        const char = norm[i];

        if (char === '(') {
            depth++;
            current += char;
        } else if (char === ')') {
            depth--;
            current += char;
            if (depth === 0) {
                result.push(current.trim());
                current = '';
            }
        } else if (char === ' ' && depth === 0) {
            if (current.trim()) {
                result.push(current.trim());
            }
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        result.push(current.trim());
    }

    // Now, we might have ["337", "( 1G6 223 )"]. 
    // The user says "package... preceding each bracket". 
    // So usually it looks like "337 ( ... )". 
    // If the parser split them, we might want to merge them?
    // Actually, "337 ( ... )" with the loop above:
    // "337" -> space -> push "337"
    // "(" -> start group -> ... -> ")" -> push "( ... )"
    // So we get ["337", "( ... )"].
    // We should merge them if a group follows a code immediately? 
    // Or does the Excel string look like "337(..."?
    // If "337 (", there is a space.

    // Let's refine: A group usually belongs to the preceding code.
    // We can post-process the result array.

    const merged: string[] = [];
    for (let i = 0; i < result.length; i++) {
        const item = result[i];
        const next = result[i + 1];

        if (next && next.startsWith('(') && next.endsWith(')')) {
            // It's a package header + content
            merged.push(`${item} ${next}`);
            i++; // skip next
        } else {
            merged.push(item);
        }
    }

    return merged;
}

function extractAttributes(modelDesc: string) {
    const desc = modelDesc.toLowerCase();
    const result = {
        fuel_type: '',
        drivetrain: desc.includes('xdrive') ? 'xDrive' : (desc.includes('sDrive') ? 'sDrive' : '')
    };

    // Fuel Type Logic
    if (desc.includes('740d') || desc.includes('320d') || desc.includes('520d') || desc.endsWith('d')) {
        result.fuel_type = 'Diesel';
    } else if (desc.includes('30e') || desc.includes('50e') || desc.includes('edrive')) {
        if (desc.startsWith('i')) {
            result.fuel_type = 'Electric';
        } else {
            result.fuel_type = 'Hybrid';
        }
    } else if (desc.includes('i') || desc.includes('m60') || desc.includes('m50')) {
        if (desc.startsWith('i')) {
            result.fuel_type = 'Electric';
        } else {
            result.fuel_type = 'Gasoline';
        }
    }

    return result;
}

export const parseStockFile = async (fileBuffer: ArrayBuffer): Promise<ImportResult> => {
    const wb = XLSX.read(fileBuffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    // Convert to JSON
    // Dynamic Header Detection via Array of Arrays (Robust)
    const jsonArrays = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

    let headerRowIndex = -1;
    let headerRow: any[] = [];

    // Scan first 20 rows
    for (let i = 0; i < Math.min(jsonArrays.length, 20); i++) {
        const row = jsonArrays[i];
        const rowStr = JSON.stringify(row).toLowerCase();
        // Check for signature columns
        if (rowStr.includes('vin') && (rowStr.includes('status') || rowStr.includes('model'))) {
            headerRowIndex = i;
            headerRow = row;
            break;
        }
    }

    if (headerRowIndex === -1) {
        // Fallback: Try row 0
        headerRowIndex = 0;
        headerRow = jsonArrays[0] || [];
    }

    // --- Header Validation & Mapping ---
    // Instead of fuzzy-searching every row, we find the ACTUAL column names once.
    const headerMap: Record<string, string> = {};
    const missingHeaders: string[] = [];

    // Map strict internal keys (e.g. 'vin') to the Actual Excel Header (e.g. 'VIN')
    for (const [targetKey, possibleHeaders] of Object.entries(COL_MAP)) {
        const foundHeader = headerRow.find((h: any) =>
            typeof h === 'string' && possibleHeaders.some(ph => h.toLowerCase().includes(ph.toLowerCase()))
        );

        if (foundHeader) {
            headerMap[targetKey] = foundHeader;
        } else {
            // Only VIN is strictly critical
            if (targetKey === 'vin') missingHeaders.push('VIN');
        }
    }

    const result: ImportResult = {
        processed: 0,
        skipped_status: 0,
        skipped_type: 0,
        hidden_de: 0,
        errors: [],
        cars: []
    };

    if (missingHeaders.length > 0) {
        result.errors.push(`CRITICAL: Missing Headers: ${missingHeaders.join(', ')}`);
        result.errors.push(`Detected Header Row Index: ${headerRowIndex}`);
        result.errors.push(`Found Headers in Row: ${headerRow.join(', ')}`);
        return result;
    }

    // Read data using the detected header row
    const rawData = XLSX.utils.sheet_to_json<any>(ws, { range: headerRowIndex });

    rawData.forEach((row, index) => {
        try {
            // Helper to get value using the mapped header
            const getVal = (key: string) => row[headerMap[key]];

            const rawVin = getVal('vin');
            const vin = rawVin ? String(rawVin).trim() : null;
            if (!vin) return; // Skip invalid rows/empty lines

            // --- GATEKEEPER ---
            const status = parseInt(getVal('status_code') || '0');
            // Rule 1: < 152 REJECT
            if (status < 152) {
                result.skipped_status++;
                return;
            }

            // Rule 2: Type Filter
            const rawType = (getVal('processing_type') || '').toString().toUpperCase();
            let visibility: 'PUBLIC' | 'INTERNAL' = 'PUBLIC';

            if (['SH', 'ST'].includes(rawType)) {
                visibility = 'PUBLIC';
            } else if (rawType === 'DE') {
                visibility = 'INTERNAL';
                result.hidden_de++;
            } else {
                result.skipped_type++;
                return; // REJECT OTHERS
            }

            const rawDate = getVal('prod_date');
            let prodDate: string | undefined;
            if (typeof rawDate === 'number') {
                const date = new Date(Math.floor((rawDate - 25569) * 86400 * 1000));
                prodDate = date.toISOString().split('T')[0];
            } else if (typeof rawDate === 'string' && rawDate.length > 0) {
                if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(rawDate)) {
                    const [d, m, y] = rawDate.split('.');
                    prodDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                } else {
                    prodDate = rawDate; // Fallback to raw string
                }
            }

            // --- MAPPING ---
            const car: StockCar = {
                vin,
                status_code: status,
                order_status: getVal('sales_status') || String(status), // Use Col R for status text if available
                processing_type: rawType,
                reservation_details: String(getVal('reservation') || ''), // Col S
                model_code: String(getVal('model_code') || ''),
                model_name: String(getVal('model_name') || ''),
                body_group: String(getVal('body_group') || ''), // Col I
                color_code: String(getVal('color_code') || ''),
                upholstery_code: String(getVal('upholstery_code') || ''),
                option_codes: parseOptionString(String(getVal('options_string') || '')),
                list_price: 0, // No price in this format
                currency: 'PLN',
                visibility: visibility,
                production_date: prodDate,
                ...extractAttributes(String(getVal('model_name') || ''))
            };

            result.cars.push(car);
            result.processed++;

        } catch (e: any) {
            result.errors.push(`Row ${index + headerRowIndex + 2}: ${e.message}`);
        }
    });

    return result;
};
export const parseModelsFile = async (fileBuffer: ArrayBuffer): Promise<any> => {
    const wb = XLSX.read(fileBuffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

    const results = [];
    const errors = [];

    // Dynamic Header Detection
    let codeIndex = 1; // Default to B
    const headerRow = json[0] as any[];

    if (headerRow) {
        headerRow.forEach((cell, idx) => {
            const val = String(cell || '').trim().toLowerCase();
            if (val.includes('kod model') || val.includes('model code')) {
                codeIndex = idx;
            }
        });
    }

    // Skip header row
    for (let i = 1; i < json.length; i++) {
        try {
            const row = json[i];

            // Use detected index
            const code = String(row[codeIndex] || '').trim();
            if (!code || code === 'undefined' || code.toLowerCase().includes('kod model')) continue;

            const series = String(row[3] || '').trim(); // indices might also be shifted? 
            // Ideally we map all columns, but let's stick to Code fix first unless user complains about empty data.
            // Assuming others are relative or standard.

            // Map other columns blindly for now based on old logic, but let's be safer:
            // If Code is at 0, likely everything shifted left by 1.
            // Make a helper to get offset
            const offset = (codeIndex === 0) ? -1 : 0; // If default was 1.

            const getVal = (defaultIdx: number) => {
                const idx = defaultIdx + offset;
                return String(row[idx] || '').trim();
            };

            const body_type = getVal(4);
            const name = getVal(5);
            const power = getVal(6);
            const acceleration = getVal(7);
            const fuel = getVal(8);
            const drivetrain = getVal(9);
            const max_speed = getVal(10);
            const trunk = getVal(11);

            results.push({
                type: 'model',
                code,
                data: {
                    series: getVal(3),
                    body_type,
                    name,
                    power,
                    acceleration,
                    fuel,
                    drivetrain,
                    max_speed,
                    trunk_capacity: trunk
                }
            });
        } catch (e: any) {
            errors.push(`Row ${i + 1}: ${e.message}`);
        }
    }

    return { results, errors };
};
export const parseBMWPLStock = async (fileBuffer: ArrayBuffer): Promise<ImportResult> => {
    const wb = XLSX.read(fileBuffer, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    const jsonArrays = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

    const result: ImportResult = {
        processed: 0,
        skipped_status: 0,
        skipped_type: 0,
        hidden_de: 0,
        errors: [],
        cars: []
    };

    if (jsonArrays.length < 1) return result;

    // Strict indices from user: A=0, C=2, G=6, N=13, O=14
    const COL_STATUS = 0;
    const COL_VIN = 2;
    const COL_MODEL_NAME = 4;
    const COL_MODEL_CODE = 6;
    const COL_PROD_DATE = 7;
    const COL_COLOR = 8;
    const COL_UPHOLSTERY = 9;
    const COL_OPTIONS = 10;
    const COL_DEALER = 13;
    const COL_TAKEN = 14;

    const firstRowVin = String(jsonArrays[0]?.[COL_VIN] || '').toUpperCase();
    const dataStartRow = firstRowVin.includes('VIN') ? 1 : 0;

    jsonArrays.slice(dataStartRow).forEach((row, rowIndex) => {
        try {
            if (!row || !Array.isArray(row)) return;

            const vin = String(row[COL_VIN] || '').trim();
            if (!vin || vin.length < 7) return;

            // Dealer check
            const dealer = String(row[COL_DEALER] || '').toUpperCase().trim();
            const isBmwPl = ['BMW PL', 'BMW POLSKA', 'BMW POLAND', 'NSC'].some(term => dealer.includes(term));
            if (dealer.length > 0 && !isBmwPl) {
                result.skipped_type++;
                return;
            }

            // Status check
            const rawStatusVal = row[COL_STATUS];
            let status = 0;
            if (typeof rawStatusVal === 'number') {
                status = rawStatusVal;
            } else if (typeof rawStatusVal === 'string') {
                status = parseInt(rawStatusVal.replace(/\D/g, '') || '0');
            }

            // Taken check (Column O)
            const takenVal = String(row[COL_TAKEN] || '').toUpperCase().trim();
            const isActuallyTaken = takenVal.length > 0 && !takenVal.includes('NIE');
            if (isActuallyTaken) {
                status = 500;
            }

            if (status < 152 && status !== 500) {
                result.skipped_status++;
                return;
            }

            const modelCode = String(row[COL_MODEL_CODE] || '').trim();
            const modelName = String(row[COL_MODEL_NAME] || '').trim();

            const rawDate = row[COL_PROD_DATE];
            let prodDate: string | undefined;
            if (typeof rawDate === 'number') {
                const date = new Date(Math.floor((rawDate - 25569) * 86400 * 1000));
                prodDate = date.toISOString().split('T')[0];
            } else if (typeof rawDate === 'string' && rawDate.length > 0) {
                if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(rawDate)) {
                    const [d, m, y] = rawDate.split('.');
                    prodDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }
            }

            const car: StockCar = {
                vin,
                status_code: status,
                order_status: status === 500 ? 'Sprzedany / Przejęty' : 'Od ręki',
                processing_type: 'SH',
                model_code: modelCode,
                model_name: modelName,
                body_group: CHASSIS_MAPPING[modelCode] || '',
                color_code: String(row[COL_COLOR] || '').trim(),
                upholstery_code: String(row[COL_UPHOLSTERY] || '').trim(),
                option_codes: parseOptionString(String(row[COL_OPTIONS] || '')),
                list_price: 0,
                currency: 'PLN',
                visibility: status === 500 ? 'HIDDEN' : 'PUBLIC',
                production_date: prodDate,
                ...extractAttributes(modelName)
            };

            // Individual Color (490) processing removed as per user feedback.
            // Stock list only contains '490' code, not the name.
            // Names are managed in Admin UI and preserved by syncStockToSupabase.

            result.cars.push(car);
            result.processed++;

        } catch (e: any) {
            result.errors.push(`Row ${rowIndex + dataStartRow + 1}: ${e.message}`);
        }
    });

    return result;
};
