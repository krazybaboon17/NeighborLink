import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  budget_min: number;
  budget_max: number;
  created_at: string;
  status: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tasks, userLocation, maxMiles } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!tasks || !userLocation || !maxMiles) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Filtering", tasks.length, "tasks within", maxMiles, "miles of", userLocation);

    // Use AI to analyze locations and determine which tasks are within range
    const taskLocations = tasks.map((t: Task) => ({
      id: t.id,
      location: t.location
    }));

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
            content: `You are a location analysis assistant. Given a user's location and a list of task locations, determine which tasks are approximately within the specified mile radius.

For each task, estimate if it's within range based on:
- If both locations are in the same city/town, they're likely within range for smaller radii
- If locations mention nearby suburbs or neighborhoods, estimate based on typical distances
- If locations are vague (like "Downtown" or "Near the mall"), use your best judgment based on common knowledge

Respond ONLY with a JSON array of task IDs that are within range. Example: ["id1", "id2", "id3"]
If you cannot determine location for a task, include it to be safe.`
          },
          {
            role: "user",
            content: `User location: "${userLocation}"
Maximum distance: ${maxMiles} miles
Tasks to evaluate:
${JSON.stringify(taskLocations, null, 2)}

Return ONLY a JSON array of task IDs that are within ${maxMiles} miles.`
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded", taskIds: tasks.map((t: Task) => t.id) }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status);
      // Return all tasks if AI fails
      return new Response(JSON.stringify({ taskIds: tasks.map((t: Task) => t.id) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    console.log("AI response:", content);
    
    // Parse the JSON array from the response
    let taskIds: string[] = [];
    try {
      // Extract JSON array from response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        taskIds = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return all tasks if parsing fails
      taskIds = tasks.map((t: Task) => t.id);
    }

    console.log("Filtered to", taskIds.length, "tasks within range");

    return new Response(JSON.stringify({ taskIds }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Filter error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
