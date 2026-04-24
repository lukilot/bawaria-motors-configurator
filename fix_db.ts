import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAll(table: string, select = '*') {
    const all: any[] = [];
    let page = 0;
    while (true) {
        const { data, error } = await supabase.from(table).select(select).range(page * 1000, (page + 1) * 1000 - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < 1000) break;
        page++;
    }
    return all;
}

function generateProductSignature(car: any): string {
    const rawOptions = (car.option_codes || []).map((c: string) => c.trim().toUpperCase()).sort().join('|');
    const individualColor = car.individual_color?.trim().toUpperCase() || '';
    const isIndividual = car.color_code === '490';
    const colorSegment = isIndividual ? `490|${car.vin}` : `${car.color_code}|${individualColor}`;
    return `${car.model_code}|${colorSegment}|${car.upholstery_code}|${rawOptions}|${car.production_date ? new Date(car.production_date).getFullYear() : '0'}`;
}

async function fixMissing() {
    console.log('Fetching groups and units...');
    const allGroups = await fetchAll('product_groups', 'id, signature');
    const allUnits = await fetchAll('stock_units', 'vin, product_group_id, option_codes, individual_color, color_code, upholstery_code, model_code, production_date');
    
    const signatureToId = new Map<string, string>();
    allGroups.forEach(g => signatureToId.set(g.signature, g.id));
    
    let toUpdate = [];
    
    // Check for units with null or invalid group
    const groupSet = new Set(allGroups.map(g => g.id));
    
    for (const u of allUnits) {
        let invalid = !u.product_group_id || !groupSet.has(u.product_group_id);
        
        if (invalid) {
            const sig = generateProductSignature(u);
            const correctId = signatureToId.get(sig);
            if (correctId) {
                toUpdate.push({ vin: u.vin, product_group_id: correctId });
            } else {
                console.log(`Still no map for ${u.vin} sig: ${sig}`);
            }
        }
    }
    
    console.log(`Found ${toUpdate.length} units to link back to valid groups.`);
    
    let success = 0;
    for (const update of toUpdate) {
        const { error } = await supabase.from('stock_units').update({ product_group_id: update.product_group_id }).eq('vin', update.vin);
        if (!error) success++;
    }
    
    console.log(`Successfully re-linked ${success} units.`);
}

fixMissing();
