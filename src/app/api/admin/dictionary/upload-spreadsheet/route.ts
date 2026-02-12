import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string;

        if (!file || !type) {
            return NextResponse.json({ error: 'Missing file or dictionary type' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Parse rows: Code (A), Name (B), Group (C)
        // Assume header row exists or not? Let's assume user provides headers or we check index.
        // Let's use sheet_to_json with header: 1 (arrays) to be safe, or just iterate.
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Skip header if it looks like "Code" or "Kod"
        let startRow = 0;
        if (rows.length > 0 && String(rows[0][0]).toLowerCase().includes('kod')) {
            startRow = 1;
        }

        const updates = [];

        for (let i = startRow; i < rows.length; i++) {
            const row = rows[i];
            const code = String(row[0] || '').trim();
            const name = String(row[1] || '').trim();
            const group = String(row[2] || '').trim();

            if (code) {
                updates.push({ code, name, group });
            }
        }

        // Process updates in batches or individually to merge with existing data
        // Fetch existing dictionary for this type to merge
        const { data: existingData, error: fetchError } = await supabase
            .from('dictionaries')
            .select('*')
            .eq('type', type);

        if (fetchError) throw fetchError;

        const existingMap = new Map();
        existingData?.forEach((item: any) => {
            existingMap.set(item.code, item.data);
        });

        const upsertPayload = updates.map(update => {
            const currentData = existingMap.get(update.code) || {};

            // Merge logic:
            // - Update Name if present
            // - Update Group if present
            // - valid: true (default)
            // - Preserve image and other fields

            const newData = {
                ...currentData,
                name: update.name || currentData.name || update.code, // fallback to code if no name
            };

            if (update.group) {
                newData.group = update.group;
            }

            return {
                type,
                code: update.code,
                data: newData
            };
        });

        // Supabase Upsert
        const { error: upsertError } = await supabase
            .from('dictionaries')
            .upsert(upsertPayload, { onConflict: 'type,code' });

        if (upsertError) throw upsertError;

        return NextResponse.json({
            success: true,
            count: upsertPayload.length
        });

    } catch (error: any) {
        console.error('Spreadsheet upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
