import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function checkResolution(idOrShortId: string) {
    if (idOrShortId.length >= 36) return idOrShortId;
    
    // We must fetch ALL records, Supabase limits to 1000 by default.
    let allData: any[] = [];
    let count = 0;
    const pageSize = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from('product_groups')
            .select('id')
            .range(count, count + pageSize - 1);
            
        if (error || !data) break;
        
        allData = allData.concat(data);
        count += data.length;
        
        if (data.length < pageSize) break;
    }
    
    console.log(`Searching for short ID: ${idOrShortId} among ${allData.length} groups`);
    
    const shortId = idOrShortId.toUpperCase();
    const found = allData.find(g => g.id.toUpperCase().startsWith(shortId));
    
    return found ? found.id : null;
}

async function run() {
    const res = await checkResolution('3BE0DB38');
    console.log("Resolution result:", res);
}

run();
