# Supabase Keep-Alive Ping Service

Supabase free tier databases automatically pause after 7 days of inactivity. This folder contains two lightweight options to keep your project active:

## Option 1: GitHub Actions (Zero cost, easiest)
Defined in `../.github/workflows/keep-alive.yml`. Runs every 3 days.

## Option 2: Cloudflare Worker
`worker.js` can be deployed as a Cloudflare Worker on a cron schedule (`0 6 */3 * *`).
