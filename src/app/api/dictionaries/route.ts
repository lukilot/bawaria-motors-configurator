import { getAllDictionaries } from '@/lib/dictionary-fetch';
import { NextResponse } from 'next/server';

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
    try {
        const dicts = await getAllDictionaries();
        return NextResponse.json(dicts);
    } catch (e) {
        return NextResponse.json({}, { status: 500 });
    }
}
