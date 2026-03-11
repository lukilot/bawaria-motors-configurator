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
    console.log("Looking for missed rescue opportunities...");

    // 1. Get ALL groups with images
    const { data: groupsWithImages } = await supabase.from('product_groups').select('id, signature, images, model_code, color_code').not('images', 'is', null);
    const validGroupsWithImages = (groupsWithImages || []).filter(g => g.images.length > 0);
    console.log(`Found ${validGroupsWithImages.length} groups with at least 1 image.`);

    const orphanMap = new Map();
    validGroupsWithImages.forEach(g => orphanMap.set(g.id, g));

    // 2. Get ALL active cars
    const { data: cars } = await supabase.from('stock_units').select('vin, product_group_id, model_code, color_code');
    const validCars = cars || [];

    // 3. Remove non-orphaned groups from our orphan map
    validCars.forEach(c => {
        orphanMap.delete(c.product_group_id);
    });
    console.log(`After removing linked groups, ${orphanMap.size} orphaned groups remain with images.`);

    let missedRescueCount = 0;

    // 4. For each car without images, see if there is a matching orphan
    for (const car of validCars) {
        // Is this car in an empty group? Let's assume yes if its group isn't in validGroupsWithImages map
        // Actually, we need to fetch the car's *current* group safely
        const { data: carGroup } = await supabase.from('product_groups').select('images').eq('id', car.product_group_id).single();
        if (!carGroup || !carGroup.images || carGroup.images.length === 0) {
            // car is naked.
            // Does an orphan exist with same model and color?
            const matchingOrphans = Array.from(orphanMap.values()).filter(o => o.model_code === car.model_code && o.color_code === car.color_code);
            if (matchingOrphans.length > 0) {
                missedRescueCount++;
                if (missedRescueCount <= 3) {
                    console.log(`\nMISSED RESCUE: VIN ${car.vin} (${car.model_code} / ${car.color_code})`);
                    console.log(`Car is in empty group ${car.product_group_id}`);
                    console.log(`Could have rescued from orphan group: ${matchingOrphans[0].id}`);
                    console.log(`Orphan Signature: ${matchingOrphans[0].signature}`);
                    // Find the car's current signature
                    const { data: cGroup } = await supabase.from('product_groups').select('signature').eq('id', car.product_group_id).single();
                    console.log(`Car Signature   : ${cGroup?.signature}`);
                }
            }
        }
    }

    console.log(`\nTotal naked cars that had a matching orphan: ${missedRescueCount}`);
}
run();
