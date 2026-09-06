import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt, userContext } = await request.json();

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 400 }
      );
    }

    const systemPrompt = `
      ${userContext ? `KONTEKS PENGGUNA: ${userContext}` : ''}
      GAYA BAHASA: Bahasa Indonesia, to-the-point, hilangkan basa-basi pembuka/penutup, actionable.
      
      TUGAS: ${prompt}
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Gemini API returned status ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({ result: resultText });
  } catch (error) {
    console.error('Server AI API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
