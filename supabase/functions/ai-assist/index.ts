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

        messages = [
          {
            role: "system",
            content: `You are a NARROW content moderator for Taskfy, a community task marketplace. Your job is to ONLY block content that falls into these three categories:

1. SEXUAL / EXPLICIT content — nudity, sexual services, escort/hookup/dating framing, requests for photos of a person's body, fetish content, romantic/companionship-for-pay framing, anything sexualizing or targeting minors.
2. EXPLICIT content — graphic violence, threats of violence, hate speech / slurs, self-harm encouragement.
3. OBVIOUS SCAMS — advance-fee schemes, "wire money first", crypto/gift-card payment demands, overpayment-refund scams, requests for bank login / SSN / 2FA codes, check-cashing or package re-shipping (mule patterns), pyramid/MLM recruiting, phishing.

DO NOT BLOCK for any other reason. In particular, ALLOW:
- Short or vague descriptions ("help with yard", "need a hand", "stuff to move") — short ≠ unsafe
- Mild profanity, casual tone, typos, low effort writing
- Missing details, unclear scope, no budget specified
- Tasks that mention alcohol, tobacco, weapons, etc. in a normal legal context (e.g., "help me move boxes that include wine bottles")
- Contact info, off-platform mentions, urgency, low pay, high pay
- Anything else that is merely low quality, weird, or borderline

Default strongly to allowed:true. Only block when the content CLEARLY falls into category 1, 2, or 3 above.

Return ONLY a JSON object: {"allowed": true|false, "reason": "short reason if blocked", "severity": "low|medium|high"}`
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
