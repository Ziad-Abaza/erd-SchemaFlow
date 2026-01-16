import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { prompt, currentSchema } = await req.json();

        const params = new URLSearchParams({
            prompt: prompt,
            current_schema: currentSchema || ''
        });

        const response = await fetch(`${process.env.AI_SERVER_URL || 'http://localhost:8000'}/api/create-table?${params}`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`AI server responded with ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('AI Create Table Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
