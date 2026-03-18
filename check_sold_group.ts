import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSoldGroup() {
    let allGroups: any[] = [];
    let count = 0;
    const pageSize = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from('product_groups')
            .select(`
                id,
                stock_units(status_code, visibility)
            `)
            .range(count, count + pageSize - 1);
            
        if (error || !data) break;
        
        allGroups = allGroups.concat(data);
        count += data.length;
        
        if (data.length < pageSize) break;
    }
    
    let soldGroupId = null;
    
    for (const group of allGroups) {
        const units = group.stock_units || [];
        if (units.length === 0) continue;
        
        const activeUnits = units.filter((u: any) => u.status_code !== 500);
        if (activeUnits.length === 0) {
            soldGroupId = group.id;
            break;
        }
    }
    
    if (soldGroupId) {
        const shortId = soldGroupId.slice(0, 8).toUpperCase();
        console.log(`Found Sold Group UUID: ${soldGroupId}`);
        console.log(`Short Offer ID: ${shortId}`);
        console.log(`Link: http://localhost:3001/cars/${shortId}`);
    } else {
        console.log("No sold group found.");
    }
}

checkSoldGroup();
