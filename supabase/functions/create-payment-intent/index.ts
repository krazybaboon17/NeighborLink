import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE_PCT = 0.10;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: u } = await supabaseUser.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = u.user;
    if (!user?.email) throw new Error("Not authenticated");

    const { amount, helper_stripe_account_id, task_id } = await req.json();
    if (!amount || amount < 50) throw new Error("Amount must be at least 50 cents");
    if (!helper_stripe_account_id) throw new Error("Missing helper_stripe_account_id");
    if (!task_id) throw new Error("Missing task_id");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify task ownership and accepted offer matches helper's connect account
    const { data: task } = await supabase
      .from("tasks")
      .select("user_id, selected_offer_id, status")
      .eq("id", task_id)
      .single();
    if (!task) throw new Error("Task not found");
    if (task.user_id !== user.id) throw new Error("Only the task owner can pay");
    if (!task.selected_offer_id) throw new Error("No accepted offer on this task");

    const { data: offer } = await supabase
      .from("offers")
      .select("helper_id, price, status")
      .eq("id", task.selected_offer_id)
      .single();
    if (!offer || offer.status !== "accepted") throw new Error("Accepted offer missing");

    const { data: helperProfile } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", offer.helper_id)
      .single();
    if (helperProfile?.stripe_account_id !== helper_stripe_account_id) {
      throw new Error("Helper account mismatch");
    }
    if (!helperProfile.stripe_onboarding_complete) {
      throw new Error("Helper has not completed Stripe payout setup");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2025-08-27.basil",
    });

    // Reuse / create customer for the payer
    let customerId: string | undefined;
    const { data: payerProfile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, full_name")
      .eq("id", user.id)
      .single();
    customerId = payerProfile?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: payerProfile?.full_name ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const totalCents = Math.round(amount);
    const feeCents = Math.round(totalCents * PLATFORM_FEE_PCT);
    const helperCents = totalCents - feeCents;

    // Destination charge: platform charges customer, transfers to helper, keeps fee
    const intent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      application_fee_amount: feeCents,
      transfer_data: { destination: helper_stripe_account_id },
      metadata: {
        task_id,
        payer_user_id: user.id,
        payee_user_id: offer.helper_id,
        offer_id: task.selected_offer_id,
      },
    });

    // Record pending payment
    await supabase.from("payments").upsert(
      {
        task_id,
        payer_user_id: user.id,
        payee_user_id: offer.helper_id,
        amount_total: totalCents,
        amount_helper: helperCents,
        amount_platform_fee: feeCents,
        stripe_payment_intent_id: intent.id,
        status: "pending",
      },
      { onConflict: "stripe_payment_intent_id" }
    );

    return new Response(
      JSON.stringify({ clientSecret: intent.client_secret, paymentIntentId: intent.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
