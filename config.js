/**
 * Thrift Seller Dashboard - Configuration
 * 
 * Replace these placeholder values with your real Supabase project credentials.
 * If left with defaults or empty, the app automatically runs in interactive DEMO MODE
 * with local storage persistence and pre-seeded thrift inventory.
 */
window.APP_CONFIG = {
  // Your Supabase Project URL (e.g., 'https://xyzcompany.supabase.co')
  SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',

  // Your Supabase Anon/Public Key (never use service_role key in frontend)
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

  // Storage bucket name for product images
  STORAGE_BUCKET: 'product-images',

  // Force demo mode for pitches and offline demonstration
  // Set to false when connecting to a real Supabase backend
  FORCE_DEMO_MODE: false,

  // App details
  APP_NAME: 'ThriftSeller PK',
  CURRENCY_SYMBOL: 'Rs',
  DEFAULT_STORE_NAME: 'Vintage Vault PK',
  
  // Default caption template for WhatsApp drops
  DEFAULT_CAPTION_TEMPLATE: `🛍️ {title}
💰 Price: Rs {price}
📏 Size: {size}
✨ Condition: {condition}
{notes}
DM to order • {store}`
};
