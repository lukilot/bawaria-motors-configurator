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

async function run() {
    console.log("Investigating orphan groups vs active cars...");

    // Fetch all stock units
    const { data: cars } = await supabase.from('stock_units').select('vin, product_group_id, option_codes, model_code, color_code, upholstery_code, production_date, individual_color');
    if (!cars) return;

    // Fetch all product groups that have images
    const { data: groups } = await supabase.from('product_groups').select('id, signature, images, option_codes, model_code, color_code');
    if (!groups) return;

    // Identify orphaned groups (groups with images, but no cars pointing to them)
    const linkedGroupIds = new Set(cars.map(c => c.product_group_id));
    const orphanedGroups = groups.filter(g => g.images && g.images.length > 0 && !linkedGroupIds.has(g.id));

    console.log(`Found ${orphanedGroups.length} orphaned groups with images.`);

    if (orphanedGroups.length === 0) {
        console.log("No orphans found. The 447 pending cars probably just genuinely never had photos.");
        return;
    }

    const sampleOrphan = orphanedGroups[0];
    console.log(`\nSample Orphan Group ID: ${sampleOrphan.id}`);
    console.log(`Signature: ${sampleOrphan.signature}`);

    // Try to find ANY car that looks identical to this orphan
    const matchingCars = cars.filter(c => c.model_code === sampleOrphan.model_code && c.color_code === sampleOrphan.color_code);
    console.log(`Found ${matchingCars.length} cars with identical model and color.`);

    if (matchingCars.length > 0) {
        const car = matchingCars[0];
        console.log(`\nComparing Orphan Group to Car VIN: ${car.vin}`);

        const rawOptions = (car.option_codes || []).map((c: string) => c.trim().toUpperCase()).sort().join('|');
        const individualColor = car.individual_color?.trim().toUpperCase() || '';
        const carGenSig = `${car.model_code}|${car.color_code}|${individualColor}|${car.upholstery_code}|${rawOptions}|${car.production_date ? new Date(car.production_date).getFullYear() : '0'}`;

        console.log(`Orphan Signature: ${sampleOrphan.signature}`);
        console.log(`Car Gen Sig     : ${carGenSig}`);

        if (sampleOrphan.signature !== carGenSig) {
            console.log("\n!! MISMATCH DETECTED !!");
            // Let's diff them character by character or parts
            const oParts = sampleOrphan.signature.split('|');
            const cParts = carGenSig.split('|');
            console.log(`Orphan Parts: ${oParts.length}, Car Parts: ${cParts.length}`);

            for (let i = 0; i < Math.max(oParts.length, cParts.length); i++) {
                if (oParts[i] !== cParts[i]) {
                    console.log(`Mismatch at token ${i}:`);
                    console.log(`  Orphan: ${oParts[i]}`);
                    console.log(`  Car   : ${cParts[i]}`);
                }
            }
        } else {
            console.log("\nWARNING: Signatures match perfectly! Why is the car not linked to this group?");
            console.log(`Car's current product_group_id: ${car.product_group_id}`);
        }
    }
}

run().catch(console.error);
