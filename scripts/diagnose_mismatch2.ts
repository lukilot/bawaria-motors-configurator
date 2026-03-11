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

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL']!, env['SUPABASE_SERVICE_ROLE_KEY']!);

async function run() {
    const { data: cars } = await supabase.from('stock_units').select('vin, status_code, order_status, product_group_id, option_codes, model_code, color_code');
    const { data: groups } = await supabase.from('product_groups').select('id, signature, images');

    const linkedGroupIds = new Set((cars||[]).map(c => c.product_group_id));
    const orphanedGroups = (groups||[]).filter(g => g.images && g.images.length > 0 && !linkedGroupIds.has(g.id));

    console.log(`Found ${orphanedGroups.length} orphaned groups with images.`);
    if (orphanedGroups.length === 0) return;

    for (let i = 0; i < Math.min(3, orphanedGroups.length); i++) {
        const orphan = orphanedGroups[i];
        console.log(`\n--- Orphan Group ${orphan.id} ---`);
        console.log(`Signature: ${orphan.signature}`);
        
        // Find cars by model_code
        const matchingModelCode = orphan.signature.split('|')[0];
        const matchingCars = (cars||[]).filter(c => c.model_code === matchingModelCode);
        console.log(`Found ${matchingCars.length} cars with model_code ${matchingModelCode}`);
        
        if (matchingCars.length > 0) {
            console.log(`First car VIN: ${matchingCars[0].vin}, Color: ${matchingCars[0].color_code}`);
            
            // Compare signatures
            for (const car of matchingCars) {
                const rawOptions = (car.option_codes || []).map((c: string) => c.trim().toUpperCase()).sort().join('|');
                const carGenSig = `${car.model_code}|${car.color_code}|||${rawOptions}|...`;
                if (car.color_code === orphan.signature.split('|')[1]) {
                    console.log(`\nComparing to VIN: ${car.vin}`);
                    console.log(`Orphan Sig: ${orphan.signature}`);
                    const carOptionsSig = rawOptions;
                    console.log(`Car Options Sig: ${carOptionsSig}`);
                    break;
                }
            }
        }
    }
}
run().catch(console.error);
