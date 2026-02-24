import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
    // Supabase JS client doesn't have direct DDL access without postgres extensions
    // but we can try using RPC if a migration function exists, or just query it
    
    // Actually the easiest way to run DDL in Supabase from JS if you don't have psql
    // is using the Management API, but we might just need to use the SQL editor online.
    // Let's check if we can execute raw SQL via RPC
    const { data, error } = await supabase.rpc('execute_sql', {
        query: 'ALTER TABLE stock_units ADD COLUMN IF NOT EXISTS individual_color TEXT;'
    });

    if (error) {
        console.error("RPC Error:", error.message);
        console.log("No execute_sql RPC found. Please run this in Supabase SQL editor:");
        console.log("ALTER TABLE stock_units ADD COLUMN IF NOT EXISTS individual_color TEXT;");
    } else {
        console.log("Success:", data);
    }
}
addColumn();
