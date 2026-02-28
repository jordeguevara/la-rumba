import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ExtractedEvent } from "@/lib/types";

const SYSTEM_PROMPT = `You are an event data extractor for a Latin dance event discovery app.
Extract structured event information from the provided text (Instagram captions, Facebook posts, event flyers, etc.).

Return ONLY a JSON object with these fields (omit any you cannot determine):
- name: string (event name)
- address: string (full address with city and state if possible)
- dateTime: string (ISO 8601 format, e.g. "2025-03-15T21:00:00")
- danceTypes: array of strings from ["salsa", "bachata", "cumbia", "merengue"] only
- venueType: one of "club" | "restaurant" | "house_party" | "outdoor"
- floorType: one of "wood" | "tile" | "concrete" | "outdoor"
- liveMusic: boolean
- coverPrice: number (dollars, 0 if free)
- organizerName: string
- instagramLink: string (full URL if found)

Be conservative — only include fields you are reasonably confident about.
Respond with raw JSON only, no markdown, no explanation.`;

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  let text: string;
  try {
    const body = await req.json();
    text = body.text;
    if (!text || typeof text !== "string") throw new Error("Invalid input");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text.slice(0, 4000) },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed: ExtractedEvent;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("OpenAI extraction error:", err);
    return NextResponse.json(
      { error: "Extraction failed" },
      { status: 500 }
    );
  }
}
