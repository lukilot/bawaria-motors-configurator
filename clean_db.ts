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

async function cleanDB() {
    const allGroups = await fetchAll('product_groups', 'id');
    const allUnits = await fetchAll('stock_units', 'product_group_id');
    
    const activeGroupIds = new Set(allUnits.map(u => u.product_group_id));
    
    const abandoned = allGroups.filter(g => !activeGroupIds.has(g.id));
    
    console.log(`Total Groups: ${allGroups.length}`);
    console.log(`Abandoned Groups: ${abandoned.length}`);
    
    if (abandoned.length > 0) {
        // Delete in chunks of 100
        let deleted = 0;
        for (let i = 0; i < abandoned.length; i += 100) {
            const chunk = abandoned.slice(i, i + 100).map(g => g.id);
            const { error } = await supabase.from('product_groups').delete().in('id', chunk);
            if (!error) deleted += chunk.length;
        }
        console.log(`Successfully deleted ${deleted} abandoned groups.`);
    }
}

cleanDB();
