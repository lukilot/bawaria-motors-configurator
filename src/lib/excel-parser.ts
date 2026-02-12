import * as XLSX from 'xlsx';
import { StockCar, ImportResult } from '@/types/stock';

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

    // Normalize spaces first
    const norm = optString.trim().replace(/\s+/g, ' ');

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
            // Rule 1: < 150 REJECT
            if (status < 150) {
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
                production_date: getVal('prod_date') ? String(getVal('prod_date')) : undefined,
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

    // Read as array of arrays (ignoring headers for mapping, using indices)
    // Starting from row 1 (index 1) assuming row 0 is header?
    // User gave columns (A, C etc). Usually there is a header.
    // Let's assume row 0 is header and data starts at 1.
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

    const result: ImportResult = {
        processed: 0,
        skipped_status: 0,
        skipped_type: 0,
        hidden_de: 0,
        errors: [],
        cars: []
    };

    // Find header row/start index? 
    // Let's assume standard Excel list where data starts at row 1 (0-based index)
    // We can try to validate if row 0 has "VIN" in Col C or check row 1.
    // If user says "VIN - column C", it's likely fixed structure.

    let startIndex = 1;
    // Simple heuristic: look for a row where Col C looks like a VIN (17 chars)
    // Or just start at 1.

    rows.forEach((row, rowIndex) => {
        if (rowIndex < startIndex) return; // Skip potential header

        try {
            const getVal = (idx: number) => {
                const val = row[idx];
                return val !== undefined && val !== null ? String(val).trim() : '';
            };

            // VIN - Col C (Index 2)
            const vin = getVal(2);
            if (!vin || vin.length < 10) return; // Basic validation

            // Order Status - Col A (Index 0)
            let rawStatus = parseInt(getVal(0) || '0');

            // Dealer Name - Col N (Index 13)
            // Filter: Must contain "BMW PL"
            const dealerName = getVal(13).toUpperCase();
            if (!dealerName.includes('BMW PL')) {
                return; // Skip other dealers
            }

            // Status Sprzedaży - Col O (Index 14)
            const salesStatus = getVal(14).toUpperCase();
            // Rules: TAK or PRZEJĘTE -> Sold (500)
            // NIE -> Available (use rawStatus)
            let order_status = salesStatus;

            if (['TAK', 'PRZEJĘTE', 'PRZEJETE'].some(s => salesStatus.includes(s))) {
                rawStatus = 500;
                order_status = 'Sprzedany';
            } else if (salesStatus.includes('NIE')) {
                order_status = 'Dostępny'; // or keep rawStatus text?
            }

            // Processing Type - User: "Always SH or ST"
            // Default to SH as public stock
            const processing_type = 'SH';

            // Filter out internal/low status if standard rules apply?
            // "if there is TAK... same as SPRZEDANY"
            // Standard parseStockFile rejects status < 150. 
            // Should we do the same? 
            // If it's BMW PL stock available for dealers, usually they are 112, 150...
            // Let's keep the filter "status < 150 REJECT" unless it is 500 (Sold).
            if (rawStatus < 150 && rawStatus !== 500) {
                result.skipped_status++;
                return;
            }

            // Body Group - Col E (Index 4) - First 3 chars
            let bodyGroup = getVal(4);
            if (bodyGroup.length > 3) {
                bodyGroup = bodyGroup.substring(0, 3);
            }

            // Model Code - Col G (Index 6)
            const modelCode = getVal(6);

            // Color - Col I (Index 8)
            const colorCode = getVal(8);

            // Upholstery - Col J (Index 9)
            const upholsteryCode = getVal(9);

            // Options - Col K (Index 10)
            const optionsString = getVal(10);
            const optionCodes = parseOptionString(optionsString); // Reuse existing helper

            // Production Date - Col H (Index 7)
            const prodDateRaw = row[7]; // Get raw value (number or string)
            let prodDate: string | undefined;

            if (typeof prodDateRaw === 'number') {
                // Excel Serial Date
                // Approx conversion: (value - 25569) * 86400 * 1000
                // Or using SSF if available, but simple math works for >= 1900
                const utc_days = Math.floor(prodDateRaw - 25569);
                const utc_value = utc_days * 86400;
                const date_info = new Date(utc_value * 1000);
                // Adjust for timezone offset if needed, but usually just getting YYYY-MM-DD is fine
                prodDate = date_info.toISOString().split('T')[0];
            } else if (typeof prodDateRaw === 'string') {
                const cleanDate = prodDateRaw.trim();
                // Handle DD.MM.YYYY
                if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(cleanDate)) {
                    const [d, m, y] = cleanDate.split('.');
                    prodDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                } else {
                    // Try standard parse
                    const d = new Date(cleanDate);
                    if (!isNaN(d.getTime())) {
                        prodDate = d.toISOString().split('T')[0];
                    }
                }
            }

            // Model Description - User requested to use Column E (Index 4)
            // Previously used for Body Group (first 3 chars), but now full string is Model Name
            const modelName = getVal(4);

            const car: StockCar = {
                vin,
                status_code: rawStatus,
                order_status: order_status,
                processing_type,
                reservation_details: '', // User said ignore
                model_code: modelCode,
                model_name: modelName,
                body_group: bodyGroup,
                color_code: colorCode,
                upholstery_code: upholsteryCode,
                option_codes: optionCodes,
                list_price: 0,
                currency: 'PLN',
                visibility: 'PUBLIC', // BMW PL stock is additional available source
                production_date: prodDate, // Can be undefined, which is allowed by type but handled safely in sync
                fuel_type: undefined, // Unknown without description
                drivetrain: undefined // Unknown without description
            };

            result.cars.push(car);
            result.processed++;

        } catch (e: any) {
            result.errors.push(`Row ${rowIndex + 1}: ${e.message}`);
        }
    });

    return result;
};
