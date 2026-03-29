import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hzrxlhdhfaqraiaqyewk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cnhsaGRoZmFxcmFpYXF5ZXdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI4NzUzMywiZXhwIjoyMDg1ODYzNTMzfQ.HJCQMMAgm6tH3K8bVD6X52_JeUNIBXolZKGnnYB0EVs';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    const { data: groups } = await supabase.from('product_groups').select('*, stock_units(*)');
    if (!groups) { console.log('no groups'); return; }
    const group = groups.find(g => g.id.toUpperCase().includes('8BFE3C3C'));
    if (!group) { console.log('8bfe3c3c not found'); return; }
    const car = group.stock_units[0];
    console.log("GROUP ID:", group.id);
    console.log("car.list_price:", car.list_price);
    console.log("car.special_price:", car.special_price);
    console.log("group.min_price:", group.min_price);
    console.log("group.max_price:", group.max_price);
    console.log("group.manual_price:", group.manual_price);
}
run();
