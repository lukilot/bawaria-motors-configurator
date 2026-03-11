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
    console.log("Analyzing 41HK and Color 490 cars...\n");

    const { data: groups } = await supabase.from('product_groups').select('id, signature, images, model_code, color_code, upholstery_code');
    const { data: cars } = await supabase.from('stock_units').select('vin, product_group_id, model_code, color_code, upholstery_code, individual_color, option_codes');

    const orphans = groups?.filter(g => g.images && g.images.length > 0) || [];
    const validCars = cars || [];

    const groupToVins: Record<string, any[]> = {};
    for (const car of validCars) {
        if (car.product_group_id) {
            if (!groupToVins[car.product_group_id]) groupToVins[car.product_group_id] = [];
            groupToVins[car.product_group_id].push(car);
        }
    }

    // Examine 41HK
    console.log("=== Model 41HK ===");
    const cars41HK = validCars.filter(c => c.model_code === '41HK');
    console.log(`Total active cars: ${cars41HK.length}`);
    const groups41HK = groups?.filter(g => g.model_code === '41HK') || [];

    for (const g of groups41HK) {
        const attachedCars = groupToVins[g.id] || [];
        console.log(`Group ID: ${g.id} (Pics: ${g.images?.length || 0}) -> Cars attached: ${attachedCars.length}`);
        console.log(`   Signature: ${g.signature}`);
    }

    // Examine 3-series (31..., 33...)
    console.log("\n=== 3-series ===");
    const cars3 = validCars.filter(c => c.model_code?.startsWith('31') || c.model_code?.startsWith('33'));
    console.log(`Total 3-series cars: ${cars3.length}`);

    // Examine color 490 globally
    console.log("\n=== Color 490 (Individual) ===");
    const cars490 = validCars.filter(c => c.color_code === '490');
    console.log(`Total active cars with color 490: ${cars490.length}`);
    for (const car of cars490) {
        console.log(`VIN: ${car.vin}, Individual Color Field: ${car.individual_color || 'NULL'}`);
        const carG = groups?.find(g => g.id === car.product_group_id);
        console.log(`   Attached to Group: ${carG?.id} (Pics: ${carG?.images?.length || 0})`);
        console.log(`   Signature: ${carG?.signature}`);

        // Find ANY orphan that might match
        const matchingOrphans = orphans.filter(o => o.model_code === car.model_code && o.color_code === '490');
        if (matchingOrphans.length > 0) {
            console.log(`   ! Found historic group with photos: ${matchingOrphans[0].id} (Pics: ${matchingOrphans[0].images?.length})`);
            console.log(`   ! Historic Sig: ${matchingOrphans[0].signature}`);
        }
    }
}
run();
