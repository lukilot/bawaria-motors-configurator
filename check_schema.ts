import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('product_groups')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Columns:", Object.keys(data[0]));
        console.log("Sample Data:", data[0]);
    }
}

checkSchema();
