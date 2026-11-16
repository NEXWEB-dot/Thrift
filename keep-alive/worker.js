/**
 * Cloudflare Worker: Supabase Keep-Alive Cron
 * 
 * Free Supabase instances pause after 7 days without traffic.
 * This worker wakes it up every few days by making a lightweight read request.
 * 
 * SETUP:
 * 1. Create a free Cloudflare Worker.
 * 2. Set environment variables (or Secrets) in Cloudflare dashboard:
 *    - SUPABASE_URL: e.g. "https://xxxxxx.supabase.co"
 *    - SUPABASE_ANON_KEY: "eyJhbGciOi..."
 * 3. Add a Cron Trigger in Settings -> Triggers: "0 0 * * 1,4" (Twice a week)
 */

export default {
  // Triggered automatically by Cloudflare Worker Cron
  async scheduled(event, env, ctx) {
    const supabaseUrl = env.SUPABASE_URL;
    const anonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.");
      return;
    }

    try {
      const targetUrl = `${supabaseUrl}/rest/v1/products?select=id&limit=1`;
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'User-Agent': 'ThriftSeller-KeepAlive/1.0'
        }
      });

      console.log(`Keep-alive ping sent to ${supabaseUrl}. Status: ${response.status}`);
    } catch (err) {
      console.error('Error executing keep-alive ping:', err);
    }
  },

  // Optional HTTP endpoint if you want to test by hitting the worker URL directly
  async fetch(request, env, ctx) {
    const supabaseUrl = env.SUPABASE_URL;
    const anonKey = env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return new Response("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.", { status: 500 });
    }

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        }
      });
      return new Response(`Supabase ping status: ${response.status} ${response.statusText}`, { status: 200 });
    } catch (err) {
      return new Response(`Ping failed: ${err.message}`, { status: 500 });
    }
  }
};
