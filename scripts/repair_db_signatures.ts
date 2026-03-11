import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach((line: string) => {
    const [key, ...val] = line.split('=');
    if (key && val) env[key.trim()] = val.join('=').trim();
});
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl!, supabaseKey!);

function generateProductSignature(pg: any): string {
    const rawOptions = (pg.option_codes || []).map((c: string) => c.trim().toUpperCase()).sort().join('|');
    const individualColor = pg.individual_color?.trim().toUpperCase() || '';

    // Legacy format: Model | Color | IndividualColor | Upholstery | Options | Year
    // CRITICAL: Always includes "|" after Color, even if IndividualColor is empty (resulting in "||")
    const colorSegment = `${pg.color_code}|${individualColor}`;

    const content = `${pg.model_code}|${colorSegment}|${pg.upholstery_code}|${rawOptions}|${pg.production_year || '0'}`;
    return content;
}

async function fetchAll(table: string, columns: string) {
    const results: any[] = [];
    let page = 0;
    while (true) {
        const { data, error } = await supabase.from(table).select(columns).range(page * 1000, (page + 1) * 1000 - 1);
        if (error) throw error;
        if (data) results.push(...data);
        if (!data || data.length < 1000) break;
        page++;
    }
    return results;
}

async function run() {
    console.log("REPAIRING DATABASE SIGNATURES...");

    const groups = await fetchAll('product_groups', '*');
    const cars = await fetchAll('stock_units', 'vin, color_code, individual_color, option_codes');

    // 1. Repair Individual Colors for cars in DB
    console.log("Step 1: Repairing Individual Color names (Code 490)...");
    for (const car of cars) {
        if (car.color_code === '490' && !car.individual_color) {
            const indOption = car.option_codes?.find((opt: string) => opt.includes('|') && opt.split('|').length > 1);
            if (indOption) {
                const parts = indOption.split('|');
                const name = parts[parts.length - 1].trim();
                console.log(`Updating VIN ${car.vin} color code 490 -> ${name}`);
                await supabase.from('stock_units').update({ individual_color: name }).eq('vin', car.vin);
            }
        }
    }

    // 2. Repair Group Signatures
    console.log("Step 2: Repairing signatures in product_groups...");
    for (const pg of groups) {
        const newSig = generateProductSignature(pg);
        if (newSig !== pg.signature) {
            console.log(`Updating Sig for Group ${pg.id}`);
            await supabase.from('product_groups').update({ signature: newSig }).eq('id', pg.id);
        }
    }

    console.log("DB REPAIR DONE.");
}
run();
