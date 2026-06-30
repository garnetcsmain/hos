import { NextResponse } from "next/server";
import { getCoordinationSummary, getSectorStatus } from "@/app/lib/bff/coordinate";

// Cache the AI briefing for 10 minutes to avoid hammering OpenAI on every page load.
let cachedBriefing: { text: string; ts: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET() {
  // Return cached version if fresh
  if (cachedBriefing && Date.now() - cachedBriefing.ts < CACHE_TTL_MS) {
    return NextResponse.json({ briefing: cachedBriefing.text, cached: true });
  }

  const apiKey = process.env.OPENAI_KEY;
  if (!apiKey) {
    return NextResponse.json({ briefing: getFallbackBriefing(), cached: false });
  }

  const summary = getCoordinationSummary();
  const sectors = getSectorStatus();
  const criticalList = sectors.filter((s) => s.alertLevel === "critical").map((s) => s.zone.name).join(", ") || "none";
  const warnList = sectors.filter((s) => s.alertLevel === "warn").map((s) => s.zone.name).join(", ") || "none";

  const prompt = `You are the HOS (Humanitarian Operations System) AI coordinator for Venezuela disaster response.
Generate a concise situation briefing (3-4 sentences, plain prose, no bullet points) for coordinators.
Use only the data provided. Do not invent facts.

Current state:
- Missing person reports: ${summary.totalMissing}
- People found / sheltered: ${summary.totalFound}
- Active shelters: ${summary.activeShelters}
- Open needs: ${summary.openNeeds}
- Volunteers on ground: ${summary.volunteerCount}
- Critical zones (need immediate attention): ${criticalList}
- Elevated-alert zones: ${warnList}

Write the briefing for a coordinator who needs to decide where to send resources in the next hour.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const text = data.choices[0]?.message?.content?.trim() ?? getFallbackBriefing();
    cachedBriefing = { text, ts: Date.now() };
    return NextResponse.json({ briefing: text, cached: false });
  } catch {
    return NextResponse.json({ briefing: getFallbackBriefing(), cached: false });
  }
}

function getFallbackBriefing(): string {
  const summary = getCoordinationSummary();
  const critical = summary.criticalZones.length > 0 ? `Critical zones: ${summary.criticalZones.join(", ")}.` : "";
  return (
    `Active response: ${summary.totalMissing} missing reports against ${summary.totalFound} confirmed sheltered. ` +
    `${summary.activeShelters} shelters operational with ${summary.volunteerCount} volunteers on ground. ` +
    `${summary.openNeeds} open needs logged across all zones. ${critical} ` +
    `Prioritize verification queue and shelter capacity assessment.`
  );
}
