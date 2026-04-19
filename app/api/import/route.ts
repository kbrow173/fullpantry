import { NextRequest, NextResponse } from "next/server";
import { scrapeRecipeFromUrl } from "@/lib/scraper";

function isPrivateHost(hostname: string): boolean {
  // Reject localhost, loopback, and RFC-1918 private ranges
  if (hostname === "localhost" || hostname === "::1") return true;
  const v4 = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [, a, b] = v4.map(Number);
    if (a === 127) return true;                      // 127.0.0.0/8 loopback
    if (a === 10) return true;                       // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true;         // 192.168.0.0/16
    if (a === 169 && b === 254) return true;         // 169.254.0.0/16 link-local (AWS metadata)
    if (a === 0) return true;                        // 0.x.x.x
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: string };
    const url = body?.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    // Basic URL validation
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Only http and https URLs are supported." }, { status: 400 });
    }

    // Block SSRF: reject localhost, loopback, and private IP ranges
    const hostname = parsed.hostname.toLowerCase();
    if (isPrivateHost(hostname)) {
      return NextResponse.json({ error: "That URL is not allowed." }, { status: 400 });
    }

    const recipe = await scrapeRecipeFromUrl(url);
    return NextResponse.json(recipe);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Something went wrong while importing. Please try again.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
