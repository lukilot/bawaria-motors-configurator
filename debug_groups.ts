import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeOptions(opts: string[]) {
    if (!opts) return '';
    return opts
        .flatMap(o => o.replace(/[\(\)]/g, ' ').split(' '))
        .map(x => x.trim())
        .filter(Boolean)
        .sort()
        .join('|');
}

async function debugGroups() {
    console.log('Fetching groups...');
    const { data: allGroups } = await supabase.from('product_groups').select('*');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const oldGroupsWithAssets = allGroups?.filter(g => 
        new Date(g.created_at) < todayStart && 
        ((g.images && g.images.length > 0) || g.manual_price !== null)
    );
    const newGroups = allGroups?.filter(g => new Date(g.updated_at) >= todayStart);

    const newGroup = newGroups?.[0];
    if (!newGroup) return;

    for (const oldGroup of oldGroupsWithAssets || []) {
        if (oldGroup.model_code === newGroup.model_code &&
            oldGroup.color_code === newGroup.color_code) {
             const oldNorm = normalizeOptions(oldGroup.option_codes || []);
             const newNorm = normalizeOptions(newGroup.option_codes || []);
             if (oldNorm !== newNorm) {
                 console.log('Old:', oldNorm);
                 console.log('New:', newNorm);
                 
                 // Show diff
                 const oldArr = oldNorm.split('|');
                 const newArr = newNorm.split('|');
                 
                 console.log('Missing in new:', oldArr.filter(x => !newArr.includes(x)));
                 console.log('Added in new:', newArr.filter(x => !oldArr.includes(x)));
             }
         }
    }
}

debugGroups();
