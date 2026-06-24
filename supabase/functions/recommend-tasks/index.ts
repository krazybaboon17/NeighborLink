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
    const { userSkills, completedCategories, availableTasks } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating task recommendations for user with skills:", userSkills);

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
            content: `You are a task recommendation assistant for NeighborLink, a local task marketplace.
Given a user's skills and their history of completed task categories, recommend the most suitable tasks from the available list.

Consider:
- Match user skills to task requirements (inferred from title/description)
- Prioritize categories the user has successfully completed before
- Consider task budget range (higher budgets may indicate complexity)
- Recommend a mix of familiar and stretch opportunities

Return a JSON array of task IDs ranked by fit, with a brief reason for each.
Format: [{"id": "task-id", "reason": "Brief explanation"}]
Return maximum 5 recommendations.`
          },
          {
            role: "user",
            content: `User skills: ${JSON.stringify(userSkills || [])}
Previously completed categories: ${JSON.stringify(completedCategories || [])}

Available tasks:
${JSON.stringify(availableTasks.map((t: any) => ({
  id: t.id,
  title: t.title,
  description: t.description?.substring(0, 200),
  category: t.category,
  budget_min: t.budget_min,
  budget_max: t.budget_max,
  location: t.location
})), null, 2)}

Recommend the best matching tasks for this user.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ recommendations: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    console.log("AI recommendations response:", content);

    let recommendations = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse recommendations:", parseError);
    }

    return new Response(JSON.stringify({ recommendations }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
