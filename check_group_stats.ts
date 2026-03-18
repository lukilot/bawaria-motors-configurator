import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGroupStats() {
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
    
    console.log(`Total Product Groups in Database: ${allGroups.length}`);
    
    let activePublicGroups = 0;
    let emptyGroups = 0;
    let soldOnlyGroups = 0;
    let internalOnlyGroups = 0;
    
    allGroups.forEach(group => {
        const units = group.stock_units || [];
        
        if (units.length === 0) {
            emptyGroups++;
            return;
        }
        
        const activeUnits = units.filter((u: any) => u.status_code !== 500);
        
        if (activeUnits.length === 0) {
            soldOnlyGroups++;
            return;
        }
        
        const isInternal = activeUnits.every((u: any) => u.visibility === 'INTERNAL');
        if (isInternal) {
            internalOnlyGroups++;
            return;
        }
        
        activePublicGroups++;
    });
    
    console.log(`- Active Public Groups (Shown on SRP): ~${activePublicGroups}`);
    console.log(`- Empty Groups (No cars): ${emptyGroups}`);
    console.log(`- Sold-Only Groups (All cars sold): ${soldOnlyGroups}`);
    console.log(`- Internal-Only Groups (Hidden): ${internalOnlyGroups}`);
}

checkGroupStats();
