# ThriftSeller PK — WhatsApp Drop Dashboard & Inventory

A mobile-first, installable Progressive Web App (PWA) built specifically for Pakistani thrift store sellers who run their drops via WhatsApp groups.

---

## 🌟 Key Features

1. **Snap & Auto-Compress**: Photo picker compresses large mobile camera photos down to lightweight WebP format (<250 KB) directly in the browser using `browser-image-compression`.
2. **2-Tap WhatsApp Share**: Uses the Web Share API (`navigator.share({ files, text })`) to share directly into WhatsApp groups with an image + pre-formatted caption. Includes a fallback (copy caption + download photo + `wa.me` redirect) for desktop or unsupported browsers.
3. **Dynamic Caption Templating**: Pre-fills drop captions from seller's template (`{title}`, `{price}`, `{size}`, `{condition}`, `{notes}`, `{store}`). Replaces placeholders live as the seller types.
4. **Mark as Sold & Canvas SOLD OUT Graphic**: Prompts for negotiated sold price, records sales & revenue, and generates an on-the-fly branded 1080x1080 "SOLD OUT" overlay graphic via HTML5 Canvas to share back into the WhatsApp group.
5. **Inventory & Revenue Tracker**:
   - Stock count
   - Items sold (current month vs. all-time)
   - Revenue in PKR (`Rs 45,800`) with monthly and all-time toggle
   - Available vs. Sold Out tabs with fast search
6. **Built-in Offline Pitch Demo Mode**:
   - Pre-loaded with 10 Pakistani thrift pieces (vintage Carhartt, Nike fleece, Levi's 501, Ralph Lauren Oxford, Schott leather jacket, etc.).
   - Works immediately out of the box without any setup.

---

## 📁 Project Structure

```text
d:\Project\
├── index.html               # Mobile app shell (Login, Dashboard, Add, Detail, Sold Modal, Settings)
├── app.js                   # Application state, router, compression, canvas engine, share flow
├── config.js                # Supabase project URL & Anon key configuration
├── styles.css               # Mobile tap & UI styling, animations, safe area padding
├── manifest.json            # PWA manifest for home-screen installation
├── service-worker.js        # Offline caching of app shell & CDN assets
├── icons/                   # App icons (192x192 PNG, 512x512 PNG, SVG)
├── schema.sql               # PostgreSQL tables, RLS security policies, storage bucket policies
├── cleanup.sql              # 30-day sold image cleanup function & pg_cron schedule
├── seeds/
│   └── seed_products.sql    # 10 realistic Pakistani thrift products SQL seed
├── keep-alive/
│   ├── worker.js            # Cloudflare Worker keep-alive cron
│   └── README.md            # Worker instructions
├── .github/workflows/
│   └── keep-alive.yml       # GitHub Actions keep-alive workflow
└── README.md
```

---

## 🚀 Quick Start (Instant Pitch / Demo)

No build tools or installation needed. You can run the app with any local web server:

```powershell
# Using Python
python -m http.server 8000

# Or using Node.js npx serve
npx serve .
```

Open `http://localhost:8000` (or your local IP address `http://192.168.x.x:8000` on your mobile phone connected to the same Wi-Fi) to test the camera picker, client-side compression, and direct WhatsApp sharing!

---

## 🛠️ Supabase Production Setup

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project (e.g. `vintage-vault-pk`).
2. Note your **Project URL** and **anon / public API key** from **Project Settings -> API**.

### Step 2: Run Database Schema
1. Open the **SQL Editor** in your Supabase dashboard.
2. Copy and paste the contents of `schema.sql`.
3. Click **Run**. This creates:
   - `settings` table with Row Level Security.
   - `products` table with Row Level Security.
   - `product-images` storage bucket with user folder policies.
   - Automatic user setup trigger on signup.

### Step 3: Configure `config.js`
Open `config.js` and paste your Supabase URL and anon key:

```javascript
window.APP_CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...',
  STORAGE_BUCKET: 'product-images',
  FORCE_DEMO_MODE: false,
  DEFAULT_STORE_NAME: 'Vintage Vault PK',
  // ...
};
```

---

## 🧹 30-Day Image Storage Cleanup

Pakistani thrift stores move dozens of items each week. Retaining full-resolution photos forever consumes storage quota.

1. In Supabase, go to **Database -> Extensions** and ensure `pg_cron` is enabled.
2. Open the **SQL Editor** and execute `cleanup.sql`.
3. This creates a daily job scheduled at 03:00 UTC that:
   - Deletes `main.webp` from storage for items sold over 30 days ago.
   - Retains the thumbnail, title, price, and sales revenue history.
   - Sets `image_deleted_at = NOW()`.

---

## ⏰ Supabase Free Tier Keep-Alive

Free Supabase projects pause after 7 days of inactivity. We provide two zero-cost options to prevent pausing:

### Option A: GitHub Actions (Recommended)
1. Push this repository to GitHub.
2. Go to **Settings -> Secrets and variables -> Actions**.
3. Add two repository secrets:
   - `SUPABASE_URL`: e.g. `https://xxxxxx.supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJhbGciOi...`
4. `.github/workflows/keep-alive.yml` will automatically make a lightweight read request every 3 days.

### Option B: Cloudflare Worker Cron
1. Create a free Cloudflare Worker with `keep-alive/worker.js`.
2. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in environment variables.
3. Add a Cron Trigger (`0 6 */3 * *`).

---

## 👥 How to Clone for a New Client

To onboard a new thrift seller:
1. Create a new Supabase project for the client (keeps data isolated).
2. Run `schema.sql`.
3. Update `config.js` with the client's URL and anon key, plus their `DEFAULT_STORE_NAME`.
4. Deploy the static folder to Cloudflare Pages or Vercel:
   - **Cloudflare Pages**: Drag and drop the project folder or connect the Git repository. Set build command to *None* and output directory to `./`.
   - **Vercel**: Deploy with `vercel --prod`.

---

## 📱 Testing WhatsApp Sharing on a Real Phone
1. Connect phone and computer to the same Wi-Fi.
2. Run `python -m http.server 8000 --bind 0.0.0.0`.
3. On phone, open `http://<YOUR_PC_LOCAL_IP>:8000`.
4. Tap **Enter Pitch Demo Mode**.
5. Tap any product or add a new piece, and tap **Share to WhatsApp**.
6. The phone's native share sheet will launch WhatsApp directly with the product image and drop caption!
