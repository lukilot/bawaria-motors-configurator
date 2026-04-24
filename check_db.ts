import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTotal() {
    const { data: allGroups } = await supabase.from('product_groups').select('id, images, stock_units(status_code, visibility)');
    
    let active = 0;
    
    for (const g of allGroups || []) {
        const units = g.stock_units || [];
        const hasActiveUnits = units.some((u: any) => u.status_code !== 500);
        if (!hasActiveUnits) continue;
        
        const isInternalGroup = units.length > 0 && units.every((u: any) => u.status_code !== 500 && u.visibility === 'INTERNAL');
        if (isInternalGroup) continue;
        
        const hasGroupImages = g.images && g.images.length > 0;
        if (hasGroupImages) active++;
    }

    console.log(`Current Total Active Groups: ${active}`);
}

checkTotal();
