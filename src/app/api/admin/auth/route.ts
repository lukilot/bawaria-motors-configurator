import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        // Get admin password from environment variable
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error('ADMIN_PASSWORD not set in environment variables');
            return NextResponse.json(
                { authenticated: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Simple password comparison
        const authenticated = password === adminPassword;

        return NextResponse.json({ authenticated });
    } catch (error) {
        return NextResponse.json(
            { authenticated: false, error: 'Invalid request' },
            { status: 400 }
        );
    }
}
