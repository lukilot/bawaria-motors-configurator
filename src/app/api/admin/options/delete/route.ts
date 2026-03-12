import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteFromStorage(url: string | null | undefined) {
    if (!url) return;
    
    // We only delete if it's in our stock-images bucket
    // URL example: https://.../storage/v1/object/public/stock-images/options/G60/1CE.webp
    const bucketName = 'stock-images';
    const marker = `${bucketName}/`;
    const pathStart = url.indexOf(marker);
    
    if (pathStart !== -1) {
        const relativePath = url.substring(pathStart + marker.length);
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([relativePath]);
        
        if (error) {
            console.error(`Failed to delete ${relativePath} from storage:`, error);
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const { ids, bodyGroup } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Missing or invalid IDs' }, { status: 400 });
        }

        const results = { deleted: 0, updated: 0, errors: [] as string[] };

        for (const id of ids) {
            try {
                const { data: record, error: fetchError } = await supabase
                    .from('dictionaries')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (fetchError || !record) {
                    results.errors.push(`Record ${id} not found`);
                    continue;
                }

                if (bodyGroup) {
                    // Logic: Remove specific model association
                    let data = record.data || {};
                    const currentGroups = data.body_groups || [];
                    const updatedGroups = currentGroups.filter((bg: string) => bg !== bodyGroup);

                    // 1. Delete variation image
                    if (data.variations) {
                        const vIdx = data.variations.findIndex((v: any) => v.body_groups.includes(bodyGroup));
                        if (vIdx >= 0) {
                            const variation = data.variations[vIdx];
                            await deleteFromStorage(variation.image_url || variation.image);
                            data.variations.splice(vIdx, 1);
                        }
                    }

                    // 2. If no more groups, delete the whole record
                    if (updatedGroups.length === 0) {
                        // Delete global image if any
                        await deleteFromStorage(data.image_url || data.image);
                        
                        const { error: delError } = await supabase
                            .from('dictionaries')
                            .delete()
                            .eq('id', id);
                        
                        if (delError) throw delError;
                        results.deleted++;
                    } else {
                        // Update remaining groups
                        data.body_groups = updatedGroups;
                        
                        const { error: updError } = await supabase
                            .from('dictionaries')
                            .update({ data })
                            .eq('id', id);
                        
                        if (updError) throw updError;
                        results.updated++;
                    }
                } else {
                    // Logic: Full delete (Knowledge Base context)
                    let data = record.data || {};
                    
                    // Delete global image
                    await deleteFromStorage(data.image_url || data.image);
                    
                    // Delete all variation images
                    if (data.variations && Array.isArray(data.variations)) {
                        for (const v of data.variations) {
                            await deleteFromStorage(v.image_url || v.image);
                        }
                    }

                    const { error: delError } = await supabase
                        .from('dictionaries')
                        .delete()
                        .eq('id', id);
                    
                    if (delError) throw delError;
                    results.deleted++;
                }
            } catch (err: any) {
                results.errors.push(`${id}: ${err.message}`);
            }
        }

        return NextResponse.json({ success: true, ...results });

    } catch (error: any) {
        console.error('Options delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
