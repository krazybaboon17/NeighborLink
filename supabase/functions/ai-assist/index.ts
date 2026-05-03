import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Input validation
    const allowedTypes = ["generate-description", "suggest-pricing", "generate-bio", "moderate-task"];
    if (typeof type !== "string" || !allowedTypes.includes(type)) {
      return new Response(JSON.stringify({ error: "Invalid assist type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!data || typeof data !== "object") {
      return new Response(JSON.stringify({ error: "Invalid data payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Cap any string field at 2000 chars to prevent abuse
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (typeof v === "string" && v.length > 2000) {
        return new Response(JSON.stringify({ error: `Field '${k}' is too long` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let messages: any[] = [];

    switch (type) {
      case "generate-description": {
        const { title, category } = data;
        messages = [
          {
            role: "system",
            content: `You are a helpful assistant for NeighborLink, a hyperlocal task marketplace. Generate a clear, detailed task description based on the title and category. Keep it under 150 words. Be specific about what the helper should expect. Include any relevant details a helper would need.`
          },
          {
            role: "user",
            content: `Generate a task description for:\nTitle: "${title}"\nCategory: ${category}`
          }
        ];
        break;
      }

      case "suggest-pricing": {
        const { title, category, description, location } = data;
        messages = [
          {
            role: "system",
            content: `You are a pricing expert for NeighborLink, a hyperlocal task marketplace. Based on the task details, suggest a fair budget range (min and max) in USD. Consider the category, complexity described, and typical market rates. Return ONLY a JSON object like: {"min": 25, "max": 50, "reasoning": "brief explanation"}`
          },
          {
            role: "user",
            content: `Suggest pricing for:\nTitle: "${title}"\nCategory: ${category}\nDescription: "${description}"\nLocation: ${location || "not specified"}`
          }
        ];
        break;
      }

      case "generate-bio": {
        const { fullName, skills, completedTasks, rating, isYoungNeighbor } = data;
        messages = [
          {
            role: "system",
            content: `You are a profile writer for NeighborLink, a community task marketplace. Write a friendly, professional bio (2-3 sentences) based on the user's information. Make it warm and community-focused. ${isYoungNeighbor ? "This is a Young Neighbor (under 18) - emphasize their enthusiasm and community spirit." : ""}`
          },
          {
            role: "user",
            content: `Write a bio for:\nName: ${fullName}\nSkills: ${skills?.join(", ") || "not specified"}\nTasks Completed: ${completedTasks || 0}\nRating: ${rating || "new member"}${isYoungNeighbor ? "\nYoung Neighbor: Yes" : ""}`
          }
        ];
        break;
      }

      case "moderate-task": {
        const { title, description, category, isYoungNeighbor } = data;
        
        const youngNeighborRules = isYoungNeighbor ? `
ADDITIONAL STRICT RULES FOR YOUNG NEIGHBOR (user is under 18) — APPLY ZERO TOLERANCE:
- BLOCK anything involving alcohol, tobacco, vaping, drugs, marijuana/CBD, or any controlled substance (even "pick up", "deliver", "buy")
- BLOCK anything involving weapons, firearms, ammunition, knives beyond kitchen use, fireworks, or explosives
- BLOCK any task requiring overnight stays, sleepovers, or being alone with an unknown adult
- BLOCK any solo one-on-one interaction with an unknown adult in a private/secluded setting (homes, cars, hotels, basements, garages after hours)
- BLOCK gambling, betting, age-restricted venues (bars, clubs, casinos, dispensaries, adult stores)
- BLOCK tasks involving modeling, photography of the minor, "test shoots", "photo gigs", or any request for photos/videos of the minor
- BLOCK requests for personal info beyond first name (address, school, schedule, phone, social handles)
- BLOCK tasks with suspiciously high pay for trivial work (likely grooming or exploitation)
- BLOCK rideshare/driving tasks, anything requiring a license, or transporting strangers
- BLOCK anything involving childcare of infants without explicit parental supervision
- BLOCK requests to keep the task "secret", "private", "just between us", or to not tell parents
- BLOCK any romantic, dating, companionship, "hangout", or "keep me company" framing
` : '';

        messages = [
          {
            role: "system",
            content: `You are a STRICT content moderator for NeighborLink, a hyperlocal community task marketplace used by MANY MINORS and suburban families. Safety of minors is the #1 priority. Err on the side of BLOCKING when there is any meaningful risk.

BLOCK (zero tolerance — block even if only implied or ambiguous):
- ANY sexual, romantic, suggestive, flirtatious, or fetish content (including "massage", "cuddle", "companionship", "foot", "feet pics", "lingerie", "modeling", "swimsuit", "sugar baby/daddy", etc.)
- ANY solicitation, escort, dating, hookup, "discreet", or "NSA" framing
- ANY nudity, body-part focus, or requests for photos/videos of a person
- Illegal activity: drug sales/delivery, theft, fraud, forged documents, hacking, account selling, fake reviews, ID/SSN trafficking
- Weapons, firearms, ammunition, explosives, fireworks
- Alcohol, tobacco, vaping, marijuana, controlled substances — including buying, picking up, or delivering
- Scam indicators: advance fees, "wire money", crypto for tasks, gift card payments, overpayment refund schemes, "too good to be true" pay for trivial work, phishing, pyramid/MLM recruiting, requests for bank/SSN/password/2FA codes, check-cashing, package re-shipping (mule patterns), Zelle/CashApp BEFORE work, requests to move conversation off-platform immediately
- Threats, harassment, hate speech, slurs, doxxing, stalking, revenge tasks
- Self-harm, suicide encouragement, eating-disorder coaching
- Anything targeting, exploiting, sexualizing, or grooming minors (extreme zero tolerance)
- Adult-only venues, gambling, escort services, adult content production
- Tasks that try to extract personal info (address, schedule, school, phone, social handles, photos)
- Profanity-laden harassment or slurs in titles/descriptions (mild profanity in passing is fine)
- Contact info dumps designed to bypass platform (phone numbers / emails / social handles in title or first line of description without legitimate task purpose)

ALLOW (legitimate neighborhood tasks):
- Yard work, snow shoveling, raking, gardening, mowing
- Errands, grocery pickup (non-restricted items), package help
- Pet care, dog walking, pet sitting (in owner's home)
- Cleaning, organizing, moving help, furniture assembly
- Babysitting and tutoring framed normally with parents present/aware
- Tech help, handyman work, painting, light repairs
- Event setup, church/community/school volunteering
- Casual/informal language, mild urgency, mild frustration
${youngNeighborRules}
DECISION RULES:
- When in doubt about safety, BLOCK. Do NOT fail open on borderline sexual, drug, weapon, scam, or minor-safety content.
- A task can look mundane but contain a red-flag phrase — still BLOCK if any red flag is present.
- Consider combinations: "babysit overnight at my place, just us, cash, don't tell anyone" = BLOCK even though "babysit" is normally fine.
- If the user is a Young Neighbor, raise scrutiny significantly and apply the young-neighbor rules above.

Return ONLY a JSON object in this exact format:
{"allowed": true/false, "reason": "short, specific reason citing which rule", "severity": "low|medium|high"}

Severity guide:
- "high": sexual/explicit, minor exploitation, weapons, drugs, clear scams, threats
- "medium": likely scam patterns, suspicious payment requests, off-platform pressure, borderline adult content
- "low": mild policy edge cases (e.g., contact info in description, mild profanity overload)`
          },
          {
            role: "user",
            content: `Review this task posting for safety:
Title: "${title || ''}"
Description: "${description || ''}"
Category: ${category || 'not specified'}
User type: ${isYoungNeighbor ? 'Young Neighbor (under 18)' : 'Standard user'}`
          }
        ];
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown assist type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI assist error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
