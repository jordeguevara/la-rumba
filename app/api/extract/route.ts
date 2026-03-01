import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { ExtractedEvent } from "@/lib/types";

const SYSTEM_PROMPT = `You are an event data extractor for a Latin dance event discovery app.
Extract structured event information from the provided text or image (Instagram captions, Facebook posts, event flyers, etc.).

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

For dateTime: if no year is given, assume the nearest upcoming occurrence (use current year, or next year if the date has passed). Current year is ${new Date().getFullYear()}.
Be conservative — only include fields you are reasonably confident about.
Respond with raw JSON only, no markdown, no explanation.`;

async function scrapeOgTags(url: string): Promise<{ imageUrl?: string; description?: string }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    },
    signal: AbortSignal.timeout(8000),
  });
  const html = await res.text();

  const ogImage =
    html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ||
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)?.[1];

  const ogDescription =
    html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] ||
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i)?.[1];

  return {
    imageUrl: ogImage ? decodeHTMLEntities(ogImage) : undefined,
    description: ogDescription ? decodeHTMLEntities(ogDescription) : undefined,
  };
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

async function extractWithVisionUrl(openai: OpenAI, imageUrl: string): Promise<ExtractedEvent> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: false,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
          { type: "text", text: "Extract all event details from this image." },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 500,
  });
  return parseCompletion(completion);
}

async function extractWithVisionBase64(
  openai: OpenAI,
  imageBase64: string,
  mimeType: string,
  caption?: string
): Promise<ExtractedEvent> {
  const userText = caption?.trim()
    ? `Extract all event details from this image. Additional caption text:\n\n${caption}`
    : "Extract all event details from this image.";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: false,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" },
          },
          { type: "text", text: userText },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 500,
  });
  return parseCompletion(completion);
}

async function extractWithText(openai: OpenAI, text: string): Promise<ExtractedEvent> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: false,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text.slice(0, 4000) },
    ],
    temperature: 0.1,
    max_tokens: 500,
  });
  return parseCompletion(completion);
}

function parseCompletion(completion: ChatCompletion): ExtractedEvent {
  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let body: { text?: string; url?: string; imageBase64?: string; mimeType?: string; caption?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    // Mode 1: base64 image upload (photo of flyer or Instagram screenshot)
    if (body.imageBase64 && body.mimeType) {
      const parsed = await extractWithVisionBase64(openai, body.imageBase64, body.mimeType, body.caption);
      return NextResponse.json(parsed);
    }

    // Mode 2: URL — fetch OG tags and use vision on the OG image, fallback to OG description
    if (body.url) {
      const og = await scrapeOgTags(body.url).catch(
        (): { imageUrl?: string; description?: string } => ({})
      );

      if (og.imageUrl) {
        const parsed = await extractWithVisionUrl(openai, og.imageUrl);
        // attach the instagram link if not already extracted
        if (!parsed.instagramLink) parsed.instagramLink = body.url;
        return NextResponse.json(parsed);
      }

      if (og.description) {
        const text = `${body.url}\n\n${og.description}`;
        const parsed = await extractWithText(openai, text);
        if (!parsed.instagramLink) parsed.instagramLink = body.url;
        return NextResponse.json(parsed);
      }

      return NextResponse.json(
        { error: "Could not load content from that URL. Try pasting the caption instead." },
        { status: 422 }
      );
    }

    // Mode 3: plain text (existing behavior)
    if (body.text && typeof body.text === "string") {
      const parsed = await extractWithText(openai, body.text);
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ error: "Provide text, url, or imageBase64" }, { status: 400 });
  } catch (err: unknown) {
    console.error("Extraction error:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
