import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    // 1. Get a random VIN
    const { data: cars, error: fetchErr } = await supabase
        .from('stock_units')
        .select('vin')
        .limit(1);
        
    if (fetchErr || !cars || cars.length === 0) {
        console.error("Could not fetch a car:", fetchErr);
        return;
    }
    
    const testVin = cars[0].vin;
    console.log("Testing update on VIN:", testVin);

    // 2. Perform the update with 'individual_color'
    const { data, error } = await supabase
        .from('stock_units')
        .update({ individual_color: 'Weryfikacja testowa' })
        .eq('vin', testVin)
        .select();

    if (error) {
        console.error("Update failed:", error.message);
    } else {
        console.log("Update succeeded! Row data:", data[0].individual_color);
        
        // Clean up
        await supabase
            .from('stock_units')
            .update({ individual_color: null })
            .eq('vin', testVin);
    }
}

testUpdate();
