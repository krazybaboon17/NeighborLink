import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-TASK-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    // Create Supabase client WITH user's auth token so RLS works
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const { taskId, offerId, amount, helperName } = await req.json();
    if (!taskId || !offerId || !amount) {
      throw new Error("Missing required fields: taskId, offerId, or amount");
    }
    logStep("Request parsed", { taskId, offerId, amount, helperName });

    // Verify task ownership
    const { data: task, error: taskError } = await supabaseClient
      .from('tasks')
      .select('user_id, status, selected_offer_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) throw new Error("Task not found");
    if (task.user_id !== user.id) throw new Error("Unauthorized: Not task owner");
    if (task.selected_offer_id !== offerId) throw new Error("Offer not selected for this task");

    // Verify offer amount and status
    const { data: offer, error: offerError } = await supabaseClient
      .from('offers')
      .select('price, status')
      .eq('id', offerId)
      .single();

    if (offerError || !offer) throw new Error("Offer not found");
    if (offer.status !== 'accepted') throw new Error("Offer must be accepted");
    if (offer.price !== amount) throw new Error("Amount mismatch");
    logStep("Authorization verified");

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });
    logStep("Stripe initialized");

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Calculate 10% platform fee (added on top of helper amount)
    const PLATFORM_FEE_PERCENT = 0.10;
    const helperAmountCents = Math.round(amount * 100);
    const platformFeeCents = Math.round(helperAmountCents * PLATFORM_FEE_PERCENT);
    const totalAmountCents = helperAmountCents + platformFeeCents;
    logStep("Fee calculated", { helperAmountCents, platformFeeCents, totalAmountCents });

    // Create a one-time payment session with platform fee
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Task Payment to ${helperName || 'Helper'}`,
              description: `Payment for completed task`,
            },
            unit_amount: helperAmountCents,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Platform Service Fee (10%)",
              description: "Doable platform fee",
            },
            unit_amount: platformFeeCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/task/${taskId}?payment=success&offer_id=${offerId}`,
      cancel_url: `${req.headers.get("origin")}/task/${taskId}?payment=cancelled`,
      metadata: {
        task_id: taskId,
        offer_id: offerId,
        payer_id: user.id,
        platform_fee_cents: platformFeeCents.toString(),
      },
    });
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
