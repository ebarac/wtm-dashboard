// Supabase Edge Function: dashboard-data
//
// Checks a shared password (kept as a Supabase secret, never in this
// file or the frontend) and, if correct, returns the latest rows from
// trainerize_daily_snapshot using the service role key - which also
// stays server-side, never sent to the browser.
//
// Deploy this via Supabase Studio's Edge Functions section (no CLI
// needed) - see DASHBOARD_SETUP.md for exact steps.
//
// IMPORTANT: when creating this function, turn OFF "Verify JWT" /
// "Enforce JWT verification" - this function does its own password
// check instead, and turning JWT verification on would block the
// static page from ever reaching it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DASHBOARD_PASSWORD = Deno.env.get("DASHBOARD_PASSWORD");
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically
// by Supabase to every Edge Function - you don't need to set these
// yourself.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!DASHBOARD_PASSWORD) {
    return new Response(
      JSON.stringify({ error: "DASHBOARD_PASSWORD secret is not set" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const password = body.password;

    if (password !== DASHBOARD_PASSWORD) {
      return new Response(JSON.stringify({ error: "Incorrect password" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

    // Latest 14 days is plenty for a "what's going on" dashboard -
    // adjust the range if you want more history visible.
    const { data, error } = await supabase
      .from("trainerize_daily_snapshot")
      .select("*")
      .order("sync_date", { ascending: false })
      .order("first_name", { ascending: true })
      .limit(2000);

    if (error) throw error;

    return new Response(JSON.stringify({ rows: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
