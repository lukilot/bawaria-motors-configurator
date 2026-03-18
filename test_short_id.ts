import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInMemoryShortLookup(shortId: string) {
    const { data, error } = await supabase
        .from('product_groups')
        .select('id');
    
    if (error) {
        console.error("Error:", error);
    } else {
        const found = data.find(g => g.id.startsWith(shortId.toLowerCase()));
        console.log(`Searching for ${shortId}...`);
        if (found) {
            console.log("Found matching UUID:", found.id);
        } else {
            console.log("Not found.");
        }
    }
}

testInMemoryShortLookup('B0D53301');
