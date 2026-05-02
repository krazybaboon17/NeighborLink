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
ADDITIONAL RULES FOR YOUNG NEIGHBOR (user is under 18):
- BLOCK any task involving alcohol, tobacco, vaping, drugs, or controlled substances
- BLOCK any task involving weapons, firearms, or ammunition  
- BLOCK any task requiring unsupervised overnight stays at a stranger's home
- BLOCK any task that describes solo one-on-one interaction with an unknown adult in a private setting
- BLOCK any task involving gambling or age-restricted venues
- BLOCK any task that seems designed to exploit or take advantage of minors
- Be EXTRA cautious with anything that might put a minor in an unsafe situation
- Apply stricter scrutiny to tasks with suspiciously high pay for simple work (possible exploitation)
` : '';

        messages = [
          {
            role: "system",
            content: `You are a content moderator for NeighborLink, a hyperlocal community task marketplace where neighbors help each other. Your job is to review task postings and messages for safety.

RULES (be DECENTLY LENIENT — this is a casual community platform):

IMMEDIATELY BLOCK:
- Explicit sexual content, solicitation, or sexually suggestive tasks
- Requests for illegal activities (drug deals, theft, fraud, etc.)
- OBVIOUS scam patterns: advance fee requests, "wire money", "too good to be true" payments for no work, phishing, pyramid schemes, requests for bank/SSN/password info
- Threats, harassment, or violent content
- Tasks designed to stalk, harass, or harm someone

ALLOW (do NOT block these):
- Normal everyday tasks: yard work, errands, pet care, cleaning, moving help, babysitting, tutoring, etc.
- Casual/informal language, slang, abbreviations
- Mild frustration or urgency in descriptions ("I REALLY need this done ASAP!!!")
- Religious or political references in task context (e.g., "help set up for church event")
- Tasks with physical labor descriptions
- Any normal, legitimate neighborhood task request
- Offer messages with casual language or negotiation
${youngNeighborRules}
IMPORTANT: When in doubt, ALLOW the content. Only block things that are clearly and obviously problematic.

Return ONLY a JSON object in this exact format:
{"allowed": true/false, "reason": "brief explanation if blocked", "severity": "low/medium/high"}

If the content is fine, return: {"allowed": true}
If blocked, severity should be "high" for explicit/illegal, "medium" for scam-like, "low" for borderline.`
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
