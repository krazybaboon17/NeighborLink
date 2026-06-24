import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function requireAuth(req: Request, corsHeaders: Record<string, string>) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const unauthorized = await requireAuth(req, corsHeaders);
    if (unauthorized) return unauthorized;
    const { helperProfile, reviews } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Input validation
    if (!helperProfile || typeof helperProfile !== "object") {
      return new Response(JSON.stringify({ error: "Invalid helperProfile" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (reviews !== undefined && reviews !== null) {
      if (!Array.isArray(reviews) || reviews.length > 100) {
        return new Response(JSON.stringify({ error: "reviews must be an array of at most 100 items" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log("Analyzing helper profile for scam risk:", helperProfile?.full_name);

    // Quick heuristic checks first
    const rating = helperProfile?.rating || 0;
    const completedTasks = helperProfile?.completed_tasks || 0;
    const isVerified = helperProfile?.verified || false;

    // Calculate risk score based on heuristics
    let riskLevel = "low";
    let warnings: string[] = [];

    if (rating < 2 && completedTasks > 0) {
      riskLevel = "high";
      warnings.push("Very low average rating");
    } else if (rating < 3 && completedTasks > 0) {
      riskLevel = "medium";
      warnings.push("Below average rating");
    }

    if (completedTasks === 0 && !isVerified) {
      if (riskLevel === "low") riskLevel = "medium";
      warnings.push("New user with no verified identity");
    }

    // Analyze reviews with AI if there are any
    if (reviews && reviews.length > 0) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a safety analyst for a local task marketplace. Analyze helper reviews to detect potential issues.

Look for patterns indicating:
- Unreliability (no-shows, late arrivals)
- Poor quality work
- Unprofessional behavior
- Safety concerns
- Scam indicators (demands extra payment, doesn't complete work)

Respond with JSON:
{
  "riskLevel": "low" | "medium" | "high",
  "concerns": ["List of specific concerns found"],
  "recommendation": "Brief safety recommendation for the task owner"
}`
            },
            {
              role: "user",
              content: `Helper profile:
- Name: ${helperProfile?.full_name || 'Unknown'}
- Rating: ${rating}/5
- Completed tasks: ${completedTasks}
- Verified: ${isVerified ? 'Yes' : 'No'}

Recent reviews:
${JSON.stringify(reviews.map((r: any) => ({
  rating: r.rating,
  comment: r.comment,
  date: r.created_at
})), null, 2)}

Analyze for potential risks.`
            }
          ],
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";
        
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            if (analysis.riskLevel === "high" || (analysis.riskLevel === "medium" && riskLevel !== "high")) {
              riskLevel = analysis.riskLevel;
            }
            if (analysis.concerns) {
              warnings = [...warnings, ...analysis.concerns];
            }
          }
        } catch (parseError) {
          console.error("Failed to parse AI analysis:", parseError);
        }
      }
    }

    const result = {
      riskLevel,
      warnings,
      showWarning: riskLevel !== "low",
      message: riskLevel === "high" 
        ? "This helper has concerning reviews or rating. Proceed with caution."
        : riskLevel === "medium"
        ? "This helper is new or has limited history. Consider messaging them first."
        : "This helper has a good track record."
    };

    console.log("Scam analysis result:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Scam check error:", error);
    return new Response(JSON.stringify({ 
      riskLevel: "low", 
      warnings: [], 
      showWarning: false,
      message: "Unable to perform safety check"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
