const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Starting data clearance script...");

    // Helper for fetching all records above 1000 limit
    async function fetchAll(table, columns) {
        let allData = [];
        let from = 0;
        let batch = 1000;
        while(true) {
            const { data, error } = await supabase.from(table).select(columns).range(from, from + batch - 1);
            if (error) throw error;
            if (data.length === 0) break;
            allData.push(...data);
            if (data.length < batch) break;
            from += batch;
        }
        return allData;
    }

    // 1. Clear database prices and empty images array for all stock units
    console.log("Fetching all stock units...");
    const stockUnits = await fetchAll('stock_units', 'vin');
    console.log(`Found ${stockUnits.length} stock units. Clearing prices and images...`);
    
    let dbUpdatedCount = 0;
    for (const unit of stockUnits) {
        const { error: updateError } = await supabase
            .from('stock_units')
            .update({ 
                list_price: null, 
                special_price: null, 
                images: [] 
            })
            .eq('vin', unit.vin);
            
        if (!updateError) dbUpdatedCount++;
    }
    console.log(`Successfully updated ${dbUpdatedCount} stock units in the database.`);

    // 1.5 Clear database prices and empty images array for all product groups
    console.log("Fetching all product groups...");
    const productGroups = await fetchAll('product_groups', 'id');
    console.log(`Found ${productGroups.length} product groups. Clearing prices and images...`);

    let groupUpdatedCount = 0;
    for (const group of productGroups) {
        const { error: groupUpdateError } = await supabase
            .from('product_groups')
            .update({ 
                manual_price: null,
                images: [] 
            })
            .eq('id', group.id);
            
        if (!groupUpdateError) groupUpdatedCount++;
    }
    console.log(`Successfully updated ${groupUpdatedCount} product groups in the database.`);

    // 2. Clear stock-images bucket
    console.log("Clearing 'stock-images' bucket storage...");
    const { data: rootFolders, error: lsError } = await supabase.storage.from('stock-images').list();
    if (lsError) {
        console.error("Failed to list root folders in stock-images:", lsError);
    } else {
        let deletedImagesCount = 0;
        for (const folder of rootFolders) {
            // Check if it's a folder (no id means it's a prefix/folder)
            if (!folder.id) {
                const { data: files, error: filesError } = await supabase.storage.from('stock-images').list(folder.name);
                if (filesError) {
                    console.error(`Failed to list files in ${folder.name}:`, filesError);
                    continue;
                }
                
                if (files && files.length > 0) {
                    const pathsToRemove = files.map(f => `${folder.name}/${f.name}`);
                    const { error: rmError } = await supabase.storage.from('stock-images').remove(pathsToRemove);
                    if (rmError) {
                        console.error(`Failed to delete files in ${folder.name}:`, rmError);
                    } else {
                        deletedImagesCount += pathsToRemove.length;
                    }
                }
            } else {
                // It's a file in the root
                const { error: rmError } = await supabase.storage.from('stock-images').remove([folder.name]);
                if (!rmError) deletedImagesCount++;
            }
        }
        console.log(`Successfully deleted ${deletedImagesCount} files from 'stock-images' bucket.`);
    }

    // 3. Clear option images from dictionaries
    console.log("Fetching options from dictionaries...");
    const { data: options, error: optFetchError } = await supabase.from('dictionaries').select('id, data').eq('type', 'option');
    if (optFetchError) throw optFetchError;

    let optUpdatedCount = 0;
    for (const opt of options) {
        if (opt.data && opt.data.image) {
            const newData = { ...opt.data };
            delete newData.image; // remove the image property
            
            const { error: optUpdateError } = await supabase
                .from('dictionaries')
                .update({ data: newData })
                .eq('id', opt.id);
                
            if (optUpdateError) {
                console.error(`Failed to update option ${opt.id}:`, optUpdateError);
            } else {
                optUpdatedCount++;
            }
        }
    }
    console.log(`Successfully removed image property from ${optUpdatedCount} options in the database.`);

    // 4. Clear option images from dictionary-assets bucket under 'option/' prefix
    console.log("Clearing option images from 'dictionary-assets' bucket...");
    const { data: optFiles, error: optLsError } = await supabase.storage.from('dictionary-assets').list('option');
    if (optLsError) {
        console.error("Failed to list files in dictionary-assets/option:", optLsError);
    } else {
        if (optFiles && optFiles.length > 0) {
            // Filter out any placeholders (like .emptyFolderPlaceholder if it exists, though usually it doesn't)
            const pathsToRemove = optFiles.map(f => `option/${f.name}`);
            const { error: optRmError } = await supabase.storage.from('dictionary-assets').remove(pathsToRemove);
            
            if (optRmError) {
                console.error("Failed to delete option files from storage:", optRmError);
            } else {
                console.log(`Successfully deleted ${pathsToRemove.length} option files from 'dictionary-assets' bucket.`);
            }
        } else {
            console.log("No option files found to delete in 'dictionary-assets'.");
        }
    }

    console.log("Data clearance completed successfully.");
}

main().catch(console.error);
