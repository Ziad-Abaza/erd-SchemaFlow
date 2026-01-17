import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { messages, enable_thinking } = await req.json();

        const response = await fetch(`${process.env.AI_SERVER_URL || 'http://localhost:8000'}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages || [],
                enable_thinking,
                stream: true
            }),
        });

        if (!response.ok) {
            throw new Error(`AI server responded with ${response.status}`);
        }

        // Return the stream directly
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error('AI Chat Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
