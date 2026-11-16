/**
 * ThriftSeller PK - WhatsApp Drop Dashboard & Inventory Engine
 * 
 * Vanilla JS, no build step, mobile-first PWA.
 * Supports Supabase backend and automatic interactive offline Demo Mode.
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. CONFIGURATION & INITIAL STATE
  // ============================================================================
  const config = window.APP_CONFIG || {
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    STORAGE_BUCKET: 'product-images',
    FORCE_DEMO_MODE: false,
    DEFAULT_STORE_NAME: 'Vintage Vault PK',
    DEFAULT_CAPTION_TEMPLATE: `🛍️ {title}
💰 Price: Rs {price}
📏 Size: {size}
✨ Condition: {condition}
{notes}
DM to order • {store}`
  };

  // State
  const state = {
    isDemoMode: true,
    supabase: null,
    currentUser: null,
    settings: {
      store_name: config.DEFAULT_STORE_NAME,
      caption_template: config.DEFAULT_CAPTION_TEMPLATE
    },
    products: [],
    activeTab: 'available', // 'available' | 'sold'
    statTimeframe: 'month', // 'month' | 'all'
    searchQuery: '',
    currentView: 'screen-login',
    activeProduct: null,

    // Upload & Compression state
    selectedImageFile: null,
    compressedImageFile: null,
    compressedThumbFile: null,
    previewUrl: null,

    // Sold Modal & Share State
    soldTargetProduct: null,
    generatedSoldBlob: null,
    generatedSoldFile: null
  };

  // ============================================================================
  // 2. CURATED DEMO PRODUCTS (Pakistani Thrift Specialties)
  // ============================================================================
  // High quality SVG data URIs so demo is 100% offline-ready & visually rich
  function createThriftSVG(label, color1, color2, iconType) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}"/>
          <stop offset="100%" stop-color="${color2}"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#g)"/>
      <circle cx="300" cy="270" r="140" fill="rgba(255,255,255,0.08)"/>
      <text x="300" y="270" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="110" fill="#FFFFFF" text-anchor="middle" dominant-baseline="central">${iconType}</text>
      <rect x="50" y="450" width="500" height="90" rx="18" fill="rgba(15,23,42,0.85)"/>
      <text x="300" y="505" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="28" fill="#F8FAFC" text-anchor="middle" letter-spacing="1">${label.toUpperCase()}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  const SAMPLE_PRODUCTS = [
    {
      id: 'demo-1',
      title: 'Vintage 90s Carhartt Detroit Duck Canvas Jacket',
      price: 5800,
      size: 'XL (Boxy Fit)',
      condition: 'Good',
      notes: 'Heavyweight duck canvas with blanket lining. Vintage patina around cuffs.',
      caption: `🛍️ Vintage 90s Carhartt Detroit Duck Canvas Jacket\n💰 Price: Rs 5,800\n📏 Size: XL (Boxy Fit)\n✨ Condition: Good\nHeavyweight duck canvas with blanket lining. Vintage patina around cuffs.\nDM to order • Vintage Vault PK`,
      status: 'available',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      image_data: createThriftSVG('Carhartt Detroit', '#854d0e', '#451a03', '🧥')
    },
    {
      id: 'demo-2',
      title: 'Retro Nike Swoosh 1/4 Zip Sherpa Fleece',
      price: 3200,
      size: 'L (Chest 44)',
      condition: 'Like new',
      notes: 'Super warm deep navy fleece. Mini swoosh chest embroidery. Flawless zippers.',
      caption: `🛍️ Retro Nike Swoosh 1/4 Zip Sherpa Fleece\n💰 Price: Rs 3,200\n📏 Size: L (Chest 44)\n✨ Condition: Like new\nSuper warm deep navy fleece. Mini swoosh chest embroidery. Flawless zippers.\nDM to order • Vintage Vault PK`,
      status: 'available',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      image_data: createThriftSVG('Nike Sherpa Fleece', '#1e3a8a', '#0f172a', '⚡')
    },
    {
      id: 'demo-3',
      title: 'Heavyweight Ralph Lauren Oxford Cotton Shirt',
      price: 2400,
      size: 'M (Relaxed)',
      condition: 'Like new',
      notes: 'Classic forest green button-down collar with navy polo rider. Crisp thick cotton.',
      caption: `🛍️ Heavyweight Ralph Lauren Oxford Cotton Shirt\n💰 Price: Rs 2,400\n📏 Size: M (Relaxed)\n✨ Condition: Like new\nClassic forest green button-down collar with navy polo rider. Crisp thick cotton.\nDM to order • Vintage Vault PK`,
      status: 'available',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      image_data: createThriftSVG('Ralph Lauren Oxford', '#064e3b', '#022c22', '👔')
    },
    {
      id: 'demo-4',
      title: '1994 Harley-Davidson Eagle Graphic Tee',
      price: 3600,
      size: 'L (Single Stitch)',
      condition: 'Good',
      notes: 'Authentic single stitch on sleeves & hem. Soft sun-faded charcoal wash.',
      caption: `🛍️ 1994 Harley-Davidson Eagle Graphic Tee\n💰 Price: Rs 3,600\n📏 Size: L (Single Stitch)\n✨ Condition: Good\nAuthentic single stitch on sleeves & hem. Soft sun-faded charcoal wash.\nDM to order • Vintage Vault PK`,
      status: 'available',
      created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
      image_data: createThriftSVG('Harley 3D Eagle', '#374151', '#111827', '🦅')
    },
    {
      id: 'demo-5',
      title: 'Ochre Corduroy Sherpa Trucker Jacket',
      price: 4500,
      size: 'M (Snug Fit)',
      condition: 'New',
      notes: 'Warm mustard wide-wale corduroy with cream sherpa collar. Tags attached.',
      caption: `🛍️ Ochre Corduroy Sherpa Trucker Jacket\n💰 Price: Rs 4,500\n📏 Size: M (Snug Fit)\n✨ Condition: New\nWarm mustard wide-wale corduroy with cream sherpa collar. Tags attached.\nDM to order • Vintage Vault PK`,
      status: 'available',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      image_data: createThriftSVG('Corduroy Trucker', '#b45309', '#78350f', '🧶')
    },
    {
      id: 'demo-6',
      title: 'Vintage Levi\'s 501 Original Fit Denim',
      price: 2900,
      size: 'W34 L32',
      condition: 'Good',
      notes: 'Classic medium stonewash button fly. Natural honeycombs and subtle whiskering.',
      caption: `🛍️ Vintage Levi's 501 Original Fit Denim\n💰 Price: Rs 2,900\n📏 Size: W34 L32\n✨ Condition: Good\nClassic medium stonewash button fly. Natural honeycombs and subtle whiskering.\nDM to order • Vintage Vault PK`,
      status: 'available',
      created_at: new Date(Date.now() - 3600000 * 60).toISOString(),
      image_data: createThriftSVG('Levi\'s 501 Denim', '#1d4ed8', '#1e3a5f', '👖')
    },
    {
      id: 'demo-7',
      title: 'Champion Reverse Weave Heather Grey Hoodie',
      price: 3800,
      sold_price: 3600,
      size: 'XL',
      condition: 'Like new',
      notes: 'Heavy 12oz reverse weave fleece with classic C patch. Sold via WhatsApp drop.',
      caption: `🛍️ Champion Reverse Weave Heather Grey Hoodie\n💰 Price: Rs 3,800\n📏 Size: XL\n✨ Condition: Like new\nHeavy 12oz reverse weave fleece with classic C patch. Sold via WhatsApp drop.\nDM to order • Vintage Vault PK`,
      status: 'sold',
      sold_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      image_data: createThriftSVG('Champion Hoodie', '#64748b', '#334155', '🏅')
    },
    {
      id: 'demo-8',
      title: 'Vintage Schott NYC Steerhide Leather Biker Jacket',
      price: 8500,
      sold_price: 8000,
      size: 'L (Chest 42)',
      condition: 'Good',
      notes: 'Heavy genuine cowhide leather with Talon zippers and red quilted satin lining.',
      caption: `🛍️ Vintage Schott NYC Steerhide Leather Biker Jacket\n💰 Price: Rs 8,500\n📏 Size: L (Chest 42)\n✨ Condition: Good\nHeavy genuine cowhide leather with Talon zippers and red quilted satin lining.\nDM to order • Vintage Vault PK`,
      status: 'sold',
      sold_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
      image_data: createThriftSVG('Schott Leather Biker', '#18181b', '#09090b', '🏍️')
    },
    {
      id: 'demo-9',
      title: 'Tommy Hilfiger Sailing Gear 90s Windbreaker',
      price: 3500,
      sold_price: 3500,
      size: 'L',
      condition: 'Good',
      notes: 'Iconic red, white, and navy colorblocking with stowaway hood. Quick sale.',
      caption: `🛍️ Tommy Hilfiger Sailing Gear 90s Windbreaker\n💰 Price: Rs 3,500\n📏 Size: L\n✨ Condition: Good\nIconic red, white, and navy colorblocking with stowaway hood. Quick sale.\nDM to order • Vintage Vault PK`,
      status: 'sold',
      sold_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      image_data: createThriftSVG('Tommy Sailing Gear', '#dc2626', '#1e3a8a', '⛵')
    },
    {
      id: 'demo-10',
      title: 'Vintage Pendleton Virgin Wool Tartan Plaid Shirt',
      price: 4200,
      sold_price: 4000,
      size: 'M',
      condition: 'Like new',
      notes: 'Made in USA 100% pure virgin wool in rich tartan plaid. Historical sales record.',
      caption: `🛍️ Vintage Pendleton Virgin Wool Tartan Plaid Shirt\n💰 Price: Rs 4,200\n📏 Size: M\n✨ Condition: Like new\nMade in USA 100% pure virgin wool in rich tartan plaid. Historical sales record.\nDM to order • Vintage Vault PK`,
      status: 'sold',
      sold_at: new Date(Date.now() - 86400000 * 42).toISOString(), // > 30 days ago!
      image_deleted_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      image_data: null, // Full image cleaned up!
      thumb_data: createThriftSVG('Pendleton Wool', '#047857', '#1e293b', '🌲'),
      created_at: new Date(Date.now() - 86400000 * 45).toISOString()
    }
  ];

  // ============================================================================
  // 3. INITIALIZATION & BACKEND DETECTION
  // ============================================================================
  function initApp() {
    setupDomReferences();
    setupEventListeners();

    const isConfigValid = config.SUPABASE_URL && 
                          !config.SUPABASE_URL.includes('YOUR_PROJECT_ID') && 
                          config.SUPABASE_ANON_KEY && 
                          !config.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY');

    if (isConfigValid && !config.FORCE_DEMO_MODE && window.supabase) {
      try {
        state.supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        state.isDemoMode = false;
        elements.backendBadge.textContent = 'Supabase Cloud';
        elements.backendBadge.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        checkSupabaseSession();
        return;
      } catch (err) {
        console.warn('Failed to init Supabase client, defaulting to Demo Mode:', err);
      }
    }

    // Default to Demo Mode
    setupDemoMode();
  }

  function setupDemoMode() {
    state.isDemoMode = true;
    elements.backendBadge.textContent = 'Demo Mode (Offline)';
    elements.backendBadge.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30';

    // Load from localStorage or seed
    const savedSettings = localStorage.getItem('thriftseller_demo_settings');
    if (savedSettings) {
      try {
        state.settings = JSON.parse(savedSettings);
      } catch (e) {}
    }

    const savedProducts = localStorage.getItem('thriftseller_demo_products');
    if (savedProducts) {
      try {
        state.products = JSON.parse(savedProducts);
      } catch (e) {
        state.products = [...SAMPLE_PRODUCTS];
      }
    } else {
      state.products = [...SAMPLE_PRODUCTS];
      saveDemoProducts();
    }

    updateStoreHeader();
  }

  function saveDemoProducts() {
    try {
      localStorage.setItem('thriftseller_demo_products', JSON.stringify(state.products));
    } catch (e) {
      console.warn('LocalStorage limit reached for demo images', e);
    }
  }

  function saveDemoSettings() {
    localStorage.setItem('thriftseller_demo_settings', JSON.stringify(state.settings));
  }

  async function checkSupabaseSession() {
    if (!state.supabase) return;
    try {
      const { data: { session }, error } = await state.supabase.auth.getSession();
      if (session && session.user) {
        state.currentUser = session.user;
        await loadUserData();
        switchView('screen-dashboard');
      } else {
        switchView('screen-login');
      }
    } catch (err) {
      console.error('Session check error:', err);
      switchView('screen-login');
    }
  }

  // ============================================================================
  // 4. DOM REFERENCES
  // ============================================================================
  let elements = {};

  function setupDomReferences() {
    elements = {
      appHeader: document.getElementById('app-header'),
      headerStoreName: document.getElementById('header-store-name'),
      backendBadge: document.getElementById('backend-badge'),
      bottomNav: document.getElementById('bottom-nav'),
      btnRefresh: document.getElementById('btn-refresh'),
      btnOpenSettings: document.getElementById('btn-open-settings'),

      // Auth Screen
      screenLogin: document.getElementById('screen-login'),
      formAuth: document.getElementById('form-auth'),
      tabLoginSignIn: document.getElementById('tab-login-signin'),
      tabLoginSignUp: document.getElementById('tab-login-signup'),
      authEmail: document.getElementById('auth-email'),
      authPassword: document.getElementById('auth-password'),
      btnAuthSubmit: document.getElementById('btn-auth-submit'),
      authBtnText: document.getElementById('auth-btn-text'),
      authSpinner: document.getElementById('auth-spinner'),
      authErrorMsg: document.getElementById('auth-error-msg'),
      btnEnterDemo: document.getElementById('btn-enter-demo'),

      // Dashboard Screen
      screenDashboard: document.getElementById('screen-dashboard'),
      statStockCount: document.getElementById('stat-stock-count'),
      statSoldCount: document.getElementById('stat-sold-count'),
      statSoldLabel: document.getElementById('stat-sold-label'),
      statRevenue: document.getElementById('stat-revenue'),
      statRevLabel: document.getElementById('stat-rev-label'),
      statAvgSale: document.getElementById('stat-avg-sale'),
      statAvgLabel: document.getElementById('stat-avg-label'),
      btnToggleAnalytics: document.getElementById('btn-toggle-analytics'),
      textToggleAnalytics: document.getElementById('text-toggle-analytics'),
      iconToggleAnalytics: document.getElementById('icon-toggle-analytics'),
      analyticsSection: document.getElementById('analytics-section'),
      chartRevenueCanvas: document.getElementById('chart-revenue-canvas'),
      chartSizesCanvas: document.getElementById('chart-sizes-canvas'),
      analyticsInsightText: document.getElementById('analytics-insight-text'),
      toggleStatMonth: document.getElementById('toggle-stat-month'),
      toggleStatAll: document.getElementById('toggle-stat-all'),
      btnDashboardAddProduct: document.getElementById('btn-dashboard-add-product'),
      inputSearch: document.getElementById('input-search'),
      tabAvailable: document.getElementById('tab-inventory-available'),
      tabSold: document.getElementById('tab-inventory-sold'),
      badgeAvailableCount: document.getElementById('badge-available-count'),
      badgeSoldCount: document.getElementById('badge-sold-count'),
      productListContainer: document.getElementById('product-list-container'),
      emptyState: document.getElementById('empty-state'),
      emptyStateTitle: document.getElementById('empty-state-title'),
      emptyStateDesc: document.getElementById('empty-state-desc'),
      btnEmptyAdd: document.getElementById('btn-empty-add'),

      // Add Product Screen
      screenAddProduct: document.getElementById('screen-add-product'),
      btnAddBack: document.getElementById('btn-add-back'),
      formAddProduct: document.getElementById('form-add-product'),
      imagePickerZone: document.getElementById('image-picker-zone'),
      inputProductPhoto: document.getElementById('input-product-photo'),
      photoUploadPrompt: document.getElementById('photo-upload-prompt'),
      photoPreviewWrap: document.getElementById('photo-preview-wrap'),
      photoPreviewImg: document.getElementById('photo-preview-img'),
      compressionBadge: document.getElementById('compression-badge'),
      btnRemovePhoto: document.getElementById('btn-remove-photo'),
      inputTitle: document.getElementById('input-title'),
      inputPrice: document.getElementById('input-price'),
      inputSize: document.getElementById('input-size'),
      inputCondition: document.getElementById('input-condition'),
      inputNotes: document.getElementById('input-notes'),
      captionPreview: document.getElementById('caption-preview'),
      btnCopyPreview: document.getElementById('btn-copy-preview'),
      btnSaveOnly: document.getElementById('btn-save-only'),
      btnSaveAndShare: document.getElementById('btn-save-and-share'),

      // Product Detail Screen
      screenProductDetail: document.getElementById('screen-product-detail'),
      btnDetailBack: document.getElementById('btn-detail-back'),
      detailStatusPill: document.getElementById('detail-status-pill'),
      detailImage: document.getElementById('detail-image'),
      detailSoldBanner: document.getElementById('detail-sold-banner'),
      detailTitle: document.getElementById('detail-title'),
      detailPrice: document.getElementById('detail-price'),
      detailSize: document.getElementById('detail-size'),
      detailCondition: document.getElementById('detail-condition'),
      detailSoldPrice: document.getElementById('detail-sold-price'),
      detailNotes: document.getElementById('detail-notes'),
      detailCaption: document.getElementById('detail-caption'),
      btnDetailSave: document.getElementById('btn-detail-save'),
      btnDetailShareWa: document.getElementById('btn-detail-share-wa'),
      detailShareBtnText: document.getElementById('detail-share-btn-text'),
      btnDetailMarkSold: document.getElementById('btn-detail-mark-sold'),
      btnDetailDelete: document.getElementById('btn-detail-delete'),

      // Settings Screen
      screenSettings: document.getElementById('screen-settings'),
      btnSettingsBack: document.getElementById('btn-settings-back'),
      settingsStoreName: document.getElementById('settings-store-name'),
      settingsCaptionTemplate: document.getElementById('settings-caption-template'),
      btnResetTemplate: document.getElementById('btn-reset-template'),
      btnSaveSettings: document.getElementById('btn-save-settings'),
      btnReseedDemo: document.getElementById('btn-reseed-demo'),
      settingsUserEmail: document.getElementById('settings-user-email'),
      btnLogout: document.getElementById('btn-logout'),

      // Bottom Nav
      navBtnInventory: document.getElementById('nav-btn-inventory'),
      navBtnAdd: document.getElementById('nav-btn-add'),
      navBtnSettings: document.getElementById('nav-btn-settings'),

      // Modals
      modalMarkSold: document.getElementById('modal-mark-sold'),
      btnCloseSoldModal: document.getElementById('btn-close-sold-modal'),
      inputFinalSoldPrice: document.getElementById('input-final-sold-price'),
      soldPreviewCanvas: document.getElementById('sold-preview-canvas'),
      btnConfirmSoldShare: document.getElementById('btn-confirm-sold-share'),
      btnConfirmSoldOnly: document.getElementById('btn-confirm-sold-only'),

      modalShareFallback: document.getElementById('modal-share-fallback'),
      btnFallbackContinue: document.getElementById('btn-fallback-continue'),

      // Toast
      toast: document.getElementById('toast'),
      toastIcon: document.getElementById('toast-icon'),
      toastMessage: document.getElementById('toast-message'),

      // Offscreen Canvas
      offscreenCanvas: document.getElementById('offscreen-sold-canvas')
    };
  }

  // ============================================================================
  // 5. VIEW NAVIGATION & ROUTING
  // ============================================================================
  function switchView(viewId) {
    const screens = [
      elements.screenLogin,
      elements.screenDashboard,
      elements.screenAddProduct,
      elements.screenProductDetail,
      elements.screenSettings
    ];

    screens.forEach(screen => {
      if (screen) {
        screen.classList.add('hidden');
      }
    });

    const target = document.getElementById(viewId);
    if (target) {
      target.classList.remove('hidden');
      state.currentView = viewId;
    }

    // Toggle header & bottom navigation visibility
    if (viewId === 'screen-login') {
      elements.appHeader.classList.add('hidden');
      elements.bottomNav.classList.add('hidden');
    } else {
      elements.appHeader.classList.remove('hidden');
      elements.bottomNav.classList.remove('hidden');
      updateNavHighlight(viewId);
    }

    window.scrollTo(0, 0);
  }

  function updateNavHighlight(viewId) {
    elements.navBtnInventory.classList.remove('text-brand-400');
    elements.navBtnInventory.classList.add('text-slate-400');
    elements.navBtnSettings.classList.remove('text-brand-400');
    elements.navBtnSettings.classList.add('text-slate-400');

    if (viewId === 'screen-dashboard' || viewId === 'screen-product-detail') {
      elements.navBtnInventory.classList.add('text-brand-400');
      elements.navBtnInventory.classList.remove('text-slate-400');
    } else if (viewId === 'screen-settings') {
      elements.navBtnSettings.classList.add('text-brand-400');
      elements.navBtnSettings.classList.remove('text-slate-400');
    }
  }

  function updateStoreHeader() {
    const store = state.settings.store_name || config.DEFAULT_STORE_NAME;
    elements.headerStoreName.textContent = store;
  }

  // ============================================================================
  // 6. FORMATTING & CAPTION TEMPLATING
  // ============================================================================
  function formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '0';
    return Number(amount).toLocaleString('en-PK');
  }

  function generateCaption(itemData) {
    const template = state.settings.caption_template || config.DEFAULT_CAPTION_TEMPLATE;
    const store = state.settings.store_name || config.DEFAULT_STORE_NAME;

    const priceFormatted = formatCurrency(itemData.price);
    const notesLine = itemData.notes && itemData.notes.trim() ? itemData.notes.trim() : '';

    return template
      .replace(/{title}/g, itemData.title || '')
      .replace(/{price}/g, priceFormatted)
      .replace(/{size}/g, itemData.size || '')
      .replace(/{condition}/g, itemData.condition || '')
      .replace(/{notes}/g, notesLine)
      .replace(/{store}/g, store)
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up excessive blank lines
      .trim();
  }

  function updateLiveCaptionPreview() {
    const itemData = {
      title: elements.inputTitle.value,
      price: elements.inputPrice.value,
      size: elements.inputSize.value,
      condition: elements.inputCondition.value,
      notes: elements.inputNotes.value
    };
    elements.captionPreview.value = generateCaption(itemData);
  }

  // ============================================================================
  // 7. CLIENT-SIDE IMAGE COMPRESSION (browser-image-compression)
  // ============================================================================
  async function handleImagePick(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', '⚠️');
      return;
    }

    const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    elements.photoUploadPrompt.classList.add('hidden');
    elements.photoPreviewWrap.classList.remove('hidden');
    elements.compressionBadge.textContent = `Compressing ${originalSizeMB} MB...`;
    elements.compressionBadge.className = 'absolute top-2 left-2 bg-slate-900/90 border border-amber-500/50 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-md';

    try {
      // 1. Compress main image: target ~150-250KB, WebP, max 1200px
      const mainOptions = {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.8
      };

      let compressedMain = file;
      if (window.imageCompression) {
        compressedMain = await window.imageCompression(file, mainOptions);
      }

      // 2. Compress thumbnail: ~300px, WebP, target 20-30KB
      const thumbOptions = {
        maxSizeMB: 0.03,
        maxWidthOrHeight: 300,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.7
      };

      let compressedThumb = compressedMain;
      if (window.imageCompression) {
        compressedThumb = await window.imageCompression(file, thumbOptions);
      }

      state.selectedImageFile = file;
      state.compressedImageFile = compressedMain;
      state.compressedThumbFile = compressedThumb;

      // Show preview
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = URL.createObjectURL(compressedMain);
      elements.photoPreviewImg.src = state.previewUrl;

      const newSizeKB = Math.round(compressedMain.size / 1024);
      elements.compressionBadge.textContent = `WebP: ${newSizeKB} KB (${originalSizeMB} MB orig)`;
      elements.compressionBadge.className = 'absolute top-2 left-2 bg-slate-900/90 border border-brand-500/50 text-brand-400 text-[10px] font-mono px-2 py-0.5 rounded-md';
      
      showToast(`Image compressed to ${newSizeKB} KB`, '⚡');
    } catch (err) {
      console.error('Compression failed:', err);
      // Fallback: use raw file
      state.compressedImageFile = file;
      state.compressedThumbFile = file;
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = URL.createObjectURL(file);
      elements.photoPreviewImg.src = state.previewUrl;
      elements.compressionBadge.textContent = 'Original image used';
    }
  }

  function resetPhotoPicker() {
    state.selectedImageFile = null;
    state.compressedImageFile = null;
    state.compressedThumbFile = null;
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = null;
    }
    elements.inputProductPhoto.value = '';
    elements.photoPreviewImg.src = '';
    elements.photoPreviewWrap.classList.add('hidden');
    elements.photoUploadPrompt.classList.remove('hidden');
  }

  // ============================================================================
  // 8. CANVAS SOLD OUT IMAGE GENERATOR
  // ============================================================================
  function drawSoldOutCanvas(targetCanvas, imageSource, storeName, soldPrice) {
    return new Promise((resolve, reject) => {
      const ctx = targetCanvas.getContext('2d');
      const size = 1080;
      targetCanvas.width = size;
      targetCanvas.height = size;

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        // 1. Draw base photo centered & scaled (aspect cover)
        ctx.clearRect(0, 0, size, size);
        const scale = Math.max(size / img.width, size / img.height);
        const x = (size / 2) - (img.width / 2) * scale;
        const y = (size / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // 2. Dark semi-transparent scrim
        ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
        ctx.fillRect(0, 0, size, size);

        // 3. Diagonal SOLD OUT Banner
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(-14 * Math.PI / 180);

        // Banner Red Bar
        const bannerH = 170;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 12;

        ctx.fillStyle = '#DC2626'; // Bold Red
        ctx.fillRect(-size, -bannerH / 2, size * 2, bannerH);

        // White border accents on the banner
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.strokeRect(-size, -bannerH / 2 + 8, size * 2, bannerH - 16);

        // Banner Text: SOLD OUT
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 92px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SOLD OUT', 0, 0);

        ctx.restore();

        // 4. Sleek Bottom Header / Store Brand Footer
        const footerH = 110;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, size - footerH, size, footerH);

        ctx.fillStyle = '#10B981'; // Emerald dot / accent
        ctx.font = '800 30px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const priceText = soldPrice ? ` • SOLD FOR Rs ${formatCurrency(soldPrice)}` : '';
        ctx.fillText(`✦ ${storeName.toUpperCase()} ✦${priceText}`, size / 2, size - (footerH / 2));

        resolve();
      };

      img.onerror = (err) => {
        console.warn('Canvas image loading failed, rendering banner placeholder:', err);
        // Draw solid background fallback
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#DC2626';
        ctx.fillRect(0, size / 2 - 80, size, 160);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 80px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SOLD OUT', size / 2, size / 2);

        resolve();
      };

      // Assign src
      img.src = imageSource;
    });
  }

  // ============================================================================
  // 9. WHATSAPP SHARE FLOW & FALLBACK
  // ============================================================================
  async function executeWhatsAppShare({ file, text, title, fallbackUrl }) {
    // 1. Primary: Web Share API with Files
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          text: text,
          title: title || 'Thrift Drop'
        });
        showToast('Shared to WhatsApp successfully!', '🚀');
        return true;
      } catch (err) {
        if (err.name === 'AbortError') {
          // User tapped back/cancelled share sheet - perfectly normal
          return false;
        }
        console.warn('navigator.share failed, trying fallback:', err);
      }
    }

    // 2. Fallback: Copy caption, trigger image download, open wa.me
    try {
      if (text && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch (e) {
      console.warn('Clipboard write error:', e);
    }

    // Download image file for user
    if (file) {
      const downloadUrl = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = (title ? title.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'thrift-product') + '.webp';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    }

    // Prepare wa.me link
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text || '')}`;
    
    // Show instruction modal
    elements.btnFallbackContinue.onclick = () => {
      elements.modalShareFallback.classList.add('hidden');
      window.open(waUrl, '_blank');
    };
    elements.modalShareFallback.classList.remove('hidden');

    showToast('Caption copied! Attach photo in WhatsApp', '📋');
    return false;
  }

  // ============================================================================
  // 10. PRODUCT ACTIONS (ADD, EDIT, MARK SOLD, DELETE)
  // ============================================================================
  async function saveNewProduct(shouldShare) {
    const title = elements.inputTitle.value.trim();
    const price = parseInt(elements.inputPrice.value, 10);
    const size = elements.inputSize.value.trim();
    const condition = elements.inputCondition.value;
    const notes = elements.inputNotes.value.trim();
    const caption = elements.captionPreview.value.trim();

    if (!title) {
      showToast('Please enter a product title', '⚠️');
      elements.inputTitle.focus();
      return;
    }
    if (isNaN(price) || price <= 0) {
      showToast('Please enter a valid price in Rs', '⚠️');
      elements.inputPrice.focus();
      return;
    }

    const newProduct = {
      id: 'prod-' + Date.now(),
      title,
      price,
      size,
      condition,
      notes,
      caption: caption || generateCaption({ title, price, size, condition, notes }),
      status: 'available',
      created_at: new Date().toISOString()
    };

    // Keep reference to image file before resetting
    const imageFileToShare = state.compressedImageFile;

    // Handle Image Data / Upload
    if (state.previewUrl && state.compressedImageFile) {
      if (state.isDemoMode) {
        // In demo mode, convert blob to data-url for local preview
        const reader = new FileReader();
        reader.readAsDataURL(state.compressedImageFile);
        await new Promise(resolve => {
          reader.onloadend = () => {
            newProduct.image_data = reader.result;
            resolve();
          };
        });
      } else {
        // Upload to Supabase Storage: {user_id}/{product_id}/main.webp
        try {
          const userId = state.currentUser ? state.currentUser.id : 'anon';
          const mainPath = `${userId}/${newProduct.id}/main.webp`;
          const thumbPath = `${userId}/${newProduct.id}/thumb.webp`;

          await state.supabase.storage.from(config.STORAGE_BUCKET).upload(mainPath, state.compressedImageFile, {
            contentType: 'image/webp',
            upsert: true
          });

          if (state.compressedThumbFile) {
            await state.supabase.storage.from(config.STORAGE_BUCKET).upload(thumbPath, state.compressedThumbFile, {
              contentType: 'image/webp',
              upsert: true
            });
          }

          newProduct.image_path = mainPath;
          newProduct.thumb_path = thumbPath;
        } catch (uploadErr) {
          console.error('Storage upload error:', uploadErr);
          showToast('Image uploaded with fallback', 'ℹ️');
        }
      }
    } else {
      // Default placeholder SVG if no image uploaded
      newProduct.image_data = createThriftSVG(title, '#0f766e', '#134e4a', '🛍️');
    }

    // Save to State (Optimistic UI)
    state.products.unshift(newProduct);

    if (state.isDemoMode) {
      saveDemoProducts();
    } else {
      // Insert to Supabase DB
      try {
        const dbPayload = {
          title: newProduct.title,
          price: newProduct.price,
          size: newProduct.size,
          condition: newProduct.condition,
          notes: newProduct.notes,
          caption: newProduct.caption,
          status: newProduct.status,
          image_path: newProduct.image_path,
          thumb_path: newProduct.thumb_path,
          user_id: state.currentUser.id
        };
        const { data, error } = await state.supabase.from('products').insert([dbPayload]).select();
        if (data && data[0]) {
          newProduct.id = data[0].id;
        }
      } catch (dbErr) {
        console.error('Database insert error:', dbErr);
      }
    }

    showToast('Product added to inventory!', '✅');

    // Trigger share flow if requested
    if (shouldShare) {
      executeWhatsAppShare({
        file: imageFileToShare,
        text: newProduct.caption,
        title: newProduct.title
      });
    }

    // Reset Form & switch back
    elements.formAddProduct.reset();
    resetPhotoPicker();
    renderDashboard();
    switchView('screen-dashboard');
  }

  function openMarkSoldModal(product) {
    state.soldTargetProduct = product;
    elements.inputFinalSoldPrice.value = product.price;

    const store = state.settings.store_name || config.DEFAULT_STORE_NAME;
    const imgSrc = getProductImageUrl(product);

    // Draw preview onto modal canvas
    drawSoldOutCanvas(elements.soldPreviewCanvas, imgSrc, store, product.price);

    elements.modalMarkSold.classList.remove('hidden');
  }

  async function confirmMarkSold(shouldShare) {
    const product = state.soldTargetProduct;
    if (!product) return;

    const soldPrice = parseInt(elements.inputFinalSoldPrice.value, 10) || product.price;
    const soldAt = new Date().toISOString();

    // Update Product State
    product.status = 'sold';
    product.sold_price = soldPrice;
    product.sold_at = soldAt;

    if (state.isDemoMode) {
      saveDemoProducts();
    } else {
      // Supabase DB Update
      try {
        await state.supabase.from('products')
          .update({ status: 'sold', sold_price: soldPrice, sold_at: soldAt })
          .eq('id', product.id);
      } catch (err) {
        console.error('Failed to update product in Supabase:', err);
      }
    }

    elements.modalMarkSold.classList.add('hidden');
    showToast(`Marked SOLD for Rs ${formatCurrency(soldPrice)}!`, '🎉');

    if (shouldShare) {
      // Generate High-Res SOLD OUT image on offscreen canvas
      const store = state.settings.store_name || config.DEFAULT_STORE_NAME;
      const imgSrc = getProductImageUrl(product);

      await drawSoldOutCanvas(elements.offscreenCanvas, imgSrc, store, soldPrice);

      elements.offscreenCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const soldFile = new File([blob], `SOLD-OUT-${product.title.replace(/[^a-z0-9]/gi, '-')}.webp`, { type: 'image/webp' });
        const soldCaption = `❌ SOLD OUT: ${product.title}\n💰 Sold for: Rs ${formatCurrency(soldPrice)}\n✨ Thanks for shopping with ${store}!`;

        await executeWhatsAppShare({
          file: soldFile,
          text: soldCaption,
          title: `SOLD OUT - ${product.title}`
        });
      }, 'image/webp', 0.9);
    }

    renderDashboard();
    if (state.currentView === 'screen-product-detail') {
      openProductDetail(product);
    }
  }

  function openProductDetail(product) {
    state.activeProduct = product;

    elements.detailTitle.value = product.title || '';
    elements.detailPrice.value = product.price || '';
    elements.detailSize.value = product.size || '';
    elements.detailCondition.value = product.condition || 'Like new';
    elements.detailNotes.value = product.notes || '';
    elements.detailCaption.value = product.caption || generateCaption(product);

    const isSold = product.status === 'sold';
    elements.detailSoldPrice.value = isSold ? (product.sold_price || product.price) : '';

    elements.detailStatusPill.textContent = isSold ? 'SOLD OUT' : 'AVAILABLE';
    elements.detailStatusPill.className = isSold
      ? 'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30'
      : 'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30';

    if (isSold) {
      elements.detailSoldBanner.classList.remove('hidden');
      elements.btnDetailMarkSold.classList.add('hidden');
      elements.detailShareBtnText.textContent = 'Share SOLD OUT Banner';
    } else {
      elements.detailSoldBanner.classList.add('hidden');
      elements.btnDetailMarkSold.classList.remove('hidden');
      elements.detailShareBtnText.textContent = 'Share to WhatsApp Group';
    }

    // Set Image
    const imgSrc = getProductImageUrl(product);
    elements.detailImage.src = imgSrc;

    switchView('screen-product-detail');
  }

  async function saveProductDetailChanges() {
    const product = state.activeProduct;
    if (!product) return;

    product.title = elements.detailTitle.value.trim();
    product.price = parseInt(elements.detailPrice.value, 10) || product.price;
    product.size = elements.detailSize.value.trim();
    product.condition = elements.detailCondition.value;
    product.notes = elements.detailNotes.value.trim();
    product.caption = elements.detailCaption.value.trim();

    if (state.isDemoMode) {
      saveDemoProducts();
    } else {
      try {
        await state.supabase.from('products').update({
          title: product.title,
          price: product.price,
          size: product.size,
          condition: product.condition,
          notes: product.notes,
          caption: product.caption
        }).eq('id', product.id);
      } catch (err) {
        console.error('Update detail error:', err);
      }
    }

    showToast('Changes saved', '✅');
    renderDashboard();
  }

  async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    state.products = state.products.filter(p => p.id !== productId);

    if (state.isDemoMode) {
      saveDemoProducts();
    } else {
      try {
        await state.supabase.from('products').delete().eq('id', productId);
      } catch (err) {
        console.error('Delete error:', err);
      }
    }

    showToast('Product deleted', '🗑️');
    renderDashboard();
    switchView('screen-dashboard');
  }

  function getProductImageUrl(product) {
    if (product.image_data) return product.image_data;
    if (product.thumb_data) return product.thumb_data;

    // Check Supabase Storage path
    if (state.supabase && product.image_path) {
      const { data } = state.supabase.storage.from(config.STORAGE_BUCKET).getPublicUrl(product.image_path);
      if (data && data.publicUrl) return data.publicUrl;
    }

    if (state.supabase && product.thumb_path) {
      const { data } = state.supabase.storage.from(config.STORAGE_BUCKET).getPublicUrl(product.thumb_path);
      if (data && data.publicUrl) return data.publicUrl;
    }

    // Default neutral SVG placeholder
    return createThriftSVG(product.title || 'Thrift Item', '#334155', '#1e293b', '👕');
  }

  // ============================================================================
  // 11. DASHBOARD & STATS RENDERING
  // ============================================================================
  function renderDashboard() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Calculate Stats
    const inStock = state.products.filter(p => p.status === 'available');
    const allSold = state.products.filter(p => p.status === 'sold');

    const monthSold = allSold.filter(p => {
      if (!p.sold_at) return false;
      const d = new Date(p.sold_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const isMonth = state.statTimeframe === 'month';
    const activeSoldList = isMonth ? monthSold : allSold;

    const totalRevenue = activeSoldList.reduce((sum, p) => sum + (p.sold_price || p.price || 0), 0);
    const avgSalePrice = activeSoldList.length > 0 ? Math.round(totalRevenue / activeSoldList.length) : 0;

    // Update UI Stats
    elements.statStockCount.textContent = inStock.length;
    elements.statSoldCount.textContent = activeSoldList.length;
    elements.statSoldLabel.textContent = isMonth ? 'Sold (Month)' : 'Sold (All Time)';
    elements.statRevenue.textContent = `Rs ${formatCurrency(totalRevenue)}`;
    elements.statRevLabel.textContent = isMonth ? 'Revenue (Mo)' : 'Revenue (Total)';
    if (elements.statAvgSale) {
      elements.statAvgSale.textContent = `Rs ${formatCurrency(avgSalePrice)}`;
    }
    if (elements.statAvgLabel) {
      elements.statAvgLabel.textContent = isMonth ? 'Avg Sale (Mo)' : 'Avg Sale (All)';
    }

    // Update Visual Analytics Charts
    updateAnalyticsCharts(activeSoldList);

    // Tab Counts
    elements.badgeAvailableCount.textContent = inStock.length;
    elements.badgeSoldCount.textContent = allSold.length;

    // Filter Products for Tab
    const currentTabStatus = state.activeTab === 'available' ? 'available' : 'sold';
    let filtered = state.products.filter(p => p.status === currentTabStatus);

    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.size && p.size.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Render Product Cards
    elements.productListContainer.innerHTML = '';

    if (filtered.length === 0) {
      elements.emptyState.classList.remove('hidden');
      if (state.activeTab === 'available') {
        elements.emptyStateTitle.textContent = 'No products in stock';
        elements.emptyStateDesc.textContent = 'Add your next piece to post into WhatsApp groups.';
        elements.btnEmptyAdd.classList.remove('hidden');
      } else {
        elements.emptyStateTitle.textContent = 'No sold items yet';
        elements.emptyStateDesc.textContent = 'Items marked as sold will appear here with revenue records.';
        elements.btnEmptyAdd.classList.add('hidden');
      }
    } else {
      elements.emptyState.classList.add('hidden');

      filtered.forEach(product => {
        const card = createProductCardElement(product);
        elements.productListContainer.appendChild(card);
      });
    }
  }

  function createProductCardElement(product) {
    const card = document.createElement('div');
    card.className = 'bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-3 flex items-center space-x-3 shadow transition active:bg-slate-800 cursor-pointer';

    const isSold = product.status === 'sold';
    const imgSrc = getProductImageUrl(product);

    card.innerHTML = `
      <div class="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80">
        <img src="${imgSrc}" alt="${escapeHtml(product.title)}" class="w-full h-full object-cover" loading="lazy">
        ${isSold ? '<div class="absolute inset-0 bg-red-950/60 flex items-center justify-center"><span class="text-[9px] font-black text-red-300 uppercase tracking-wider bg-red-600/80 px-1 rounded">SOLD</span></div>' : ''}
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-xs text-white truncate pr-1">${escapeHtml(product.title)}</h4>
        </div>
        
        <div class="flex items-center space-x-1.5 mt-1">
          <span class="text-xs font-black ${isSold ? 'text-amber-300' : 'text-emerald-400'}">Rs ${formatCurrency(isSold ? (product.sold_price || product.price) : product.price)}</span>
          ${isSold && product.sold_price && product.sold_price !== product.price ? `<span class="text-[10px] text-slate-500 line-through">Rs ${formatCurrency(product.price)}</span>` : ''}
          ${product.size ? `<span class="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">${escapeHtml(product.size)}</span>` : ''}
          ${product.condition ? `<span class="text-[9px] text-slate-400">${escapeHtml(product.condition)}</span>` : ''}
        </div>

        <div class="text-[10px] text-slate-500 mt-0.5">
          ${isSold ? (product.sold_at ? `Sold ${formatRelativeTime(product.sold_at)}` : 'Sold') : 'Ready to drop'}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center space-x-1 flex-shrink-0" onclick="event.stopPropagation()">
        ${!isSold ? `
          <button class="btn-card-share p-2 rounded-xl bg-brand-600/20 text-brand-400 hover:bg-brand-600 hover:text-white border border-brand-500/30 transition" title="Share to WhatsApp">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 2C6.494 2 2 6.495 2 12.031c0 1.996.586 3.86 1.603 5.435L2 22l4.673-1.572A9.972 9.972 0 0012.031 22C17.568 22 22 17.505 22 12.031 22 6.495 17.568 2 12.031 2z"/>
            </svg>
          </button>
          <button class="btn-card-sold px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white border border-amber-500/30 text-[11px] font-bold transition" title="Mark as Sold">
            Sold
          </button>
        ` : `
          <button class="btn-card-sold-share p-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/30 transition" title="Share SOLD OUT graphic">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 2C6.494 2 2 6.495 2 12.031c0 1.996.586 3.86 1.603 5.435L2 22l4.673-1.572A9.972 9.972 0 0012.031 22C17.568 22 22 17.505 22 12.031 22 6.495 17.568 2 12.031 2z"/>
            </svg>
          </button>
        `}
      </div>
    `;

    // Click on card opens details
    card.addEventListener('click', () => openProductDetail(product));

    // Bind card action buttons
    const shareBtn = card.querySelector('.btn-card-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        executeWhatsAppShare({
          text: product.caption || generateCaption(product),
          title: product.title
        });
      });
    }

    const soldBtn = card.querySelector('.btn-card-sold');
    if (soldBtn) {
      soldBtn.addEventListener('click', () => openMarkSoldModal(product));
    }

    const soldShareBtn = card.querySelector('.btn-card-sold-share');
    if (soldShareBtn) {
      soldShareBtn.addEventListener('click', () => openMarkSoldModal(product));
    }

    return card;
  }

  function formatRelativeTime(dateString) {
    try {
      const date = new Date(dateString);
      const diffDays = Math.floor((new Date() - date) / 86400000);
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
    } catch (e) {
      return '';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return m;
      }
    });
  }

  // ============================================================================
  // VISUAL SALES ANALYTICS & CHARTS (Chart.js)
  // ============================================================================
  let revenueChartInstance = null;
  let sizesChartInstance = null;

  function updateAnalyticsCharts(soldList) {
    if (!window.Chart) return;

    // 1. Prepare Revenue Curve Data (chronological drops)
    const sorted = [...soldList].sort((a, b) => new Date(a.sold_at || a.created_at) - new Date(b.sold_at || b.created_at));

    const dateMap = {};
    sorted.forEach(p => {
      const d = p.sold_at ? new Date(p.sold_at) : new Date(p.created_at || Date.now());
      const label = d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
      const rev = p.sold_price || p.price || 0;
      dateMap[label] = (dateMap[label] || 0) + rev;
    });

    let labels = Object.keys(dateMap);
    let values = Object.values(dateMap);

    if (labels.length === 0) {
      labels = ['Drop 1', 'Drop 2', 'Drop 3', 'Drop 4'];
      values = [0, 0, 0, 0];
    } else if (labels.length === 1) {
      labels = ['Previous', labels[0]];
      values = [0, values[0]];
    }

    // Render Revenue Curve Chart
    if (elements.chartRevenueCanvas) {
      if (revenueChartInstance) {
        revenueChartInstance.destroy();
      }

      const ctx = elements.chartRevenueCanvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 160);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

      revenueChartInstance = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Revenue (Rs)',
            data: values,
            borderColor: '#10B981',
            backgroundColor: gradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#34D399',
            pointBorderColor: '#064E3B',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0F172A',
              titleColor: '#F8FAFC',
              bodyColor: '#34D399',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 8,
              callbacks: {
                label: (context) => ` Rs ${formatCurrency(context.parsed.y)}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(51, 65, 85, 0.3)' },
              ticks: { color: '#94A3B8', font: { size: 10 } }
            },
            y: {
              grid: { color: 'rgba(51, 65, 85, 0.3)' },
              ticks: {
                color: '#94A3B8',
                font: { size: 10 },
                callback: (val) => 'Rs ' + (val >= 1000 ? (val / 1000) + 'k' : val)
              }
            }
          }
        }
      });
    }

    // 2. Size Demand Distribution (Doughnut Chart)
    const sizeCounts = {};
    soldList.forEach(p => {
      let size = (p.size || 'Free').split(' ')[0].toUpperCase();
      if (!size || size.length > 5) size = 'Other';
      sizeCounts[size] = (sizeCounts[size] || 0) + 1;
    });

    let sizeLabels = Object.keys(sizeCounts);
    let sizeData = Object.values(sizeCounts);

    if (sizeLabels.length === 0) {
      sizeLabels = ['XL', 'L', 'M'];
      sizeData = [40, 35, 25];
    }

    if (elements.chartSizesCanvas) {
      if (sizesChartInstance) {
        sizesChartInstance.destroy();
      }

      const ctx2 = elements.chartSizesCanvas.getContext('2d');
      sizesChartInstance = new window.Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: sizeLabels,
          datasets: [{
            data: sizeData,
            backgroundColor: [
              '#10B981', // Emerald
              '#3B82F6', // Blue
              '#8B5CF6', // Purple
              '#F59E0B', // Amber
              '#EC4899'  // Pink
            ],
            borderWidth: 2,
            borderColor: '#0F172A'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#CBD5E1',
                boxWidth: 8,
                boxHeight: 8,
                font: { size: 9 },
                padding: 6
              }
            },
            tooltip: {
              backgroundColor: '#0F172A',
              callbacks: {
                label: (context) => ` ${context.label}: ${context.parsed} sold`
              }
            }
          },
          cutout: '62%'
        }
      });
    }

    // 3. Dynamic Seller Insight
    if (elements.analyticsInsightText && soldList.length > 0) {
      const topSize = sizeLabels[0] || 'L';
      elements.analyticsInsightText.textContent = `Size ${topSize} & outerwear lead your drops. Stock more ${topSize} pieces for fast sell-outs!`;
    }
  }

  // ============================================================================
  // 12. TOAST NOTIFICATION UTILITY
  // ============================================================================
  let toastTimer = null;
  function showToast(message, icon = '✨') {
    if (toastTimer) clearTimeout(toastTimer);

    elements.toastIcon.textContent = icon;
    elements.toastMessage.textContent = message;
    elements.toast.classList.remove('hidden');

    toastTimer = setTimeout(() => {
      elements.toast.classList.add('hidden');
    }, 2800);
  }

  // ============================================================================
  // 13. SUPABASE AUTH & DATA SYNC
  // ============================================================================
  async function handleAuthSubmit(event) {
    event.preventDefault();
    const email = elements.authEmail.value.trim();
    const password = elements.authPassword.value;
    const isSignUp = elements.tabLoginSignUp.classList.contains('bg-brand-600');

    if (!email || !password) return;

    elements.authBtnText.textContent = isSignUp ? 'Creating Account...' : 'Signing In...';
    elements.authSpinner.classList.remove('hidden');
    elements.authErrorMsg.classList.add('hidden');

    try {
      if (isSignUp) {
        const { data, error } = await state.supabase.auth.signUp({ email, password });
        if (error) throw error;
        showToast('Account created! Logging in...', '🎉');
      } else {
        const { data, error } = await state.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      const { data: { user } } = await state.supabase.auth.getUser();
      state.currentUser = user;
      await loadUserData();
      switchView('screen-dashboard');
    } catch (err) {
      console.error('Auth error:', err);
      elements.authErrorMsg.textContent = err.message || 'Authentication failed';
      elements.authErrorMsg.classList.remove('hidden');
    } finally {
      elements.authBtnText.textContent = isSignUp ? 'Create Account' : 'Sign In to Dashboard';
      elements.authSpinner.classList.add('hidden');
    }
  }

  async function loadUserData() {
    if (!state.supabase || !state.currentUser) return;

    elements.settingsUserEmail.textContent = state.currentUser.email || 'Seller';

    // 1. Load Settings
    try {
      const { data: settingsData } = await state.supabase
        .from('settings')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .maybeSingle();

      if (settingsData) {
        state.settings.store_name = settingsData.store_name || config.DEFAULT_STORE_NAME;
        state.settings.caption_template = settingsData.caption_template || config.DEFAULT_CAPTION_TEMPLATE;
      }
    } catch (e) {
      console.warn('Could not load settings:', e);
    }

    // 2. Load Products
    try {
      const { data: productsData, error } = await state.supabase
        .from('products')
        .select('*')
        .eq('user_id', state.currentUser.id)
        .order('created_at', { ascending: false });

      if (productsData) {
        state.products = productsData;
      }
    } catch (e) {
      console.warn('Could not load products:', e);
    }

    updateStoreHeader();
    renderDashboard();
  }

  async function handleLogout() {
    if (state.supabase) {
      await state.supabase.auth.signOut();
    }
    state.currentUser = null;
    switchView('screen-login');
    showToast('Signed out successfully', '👋');
  }

  // ============================================================================
  // 14. EVENT LISTENERS
  // ============================================================================
  function setupEventListeners() {
    // 1. Navigation / Header
    elements.btnRefresh.addEventListener('click', () => {
      if (!state.isDemoMode) loadUserData();
      else renderDashboard();
      showToast('Inventory refreshed', '🔄');
    });

    elements.btnOpenSettings.addEventListener('click', () => {
      elements.settingsStoreName.value = state.settings.store_name;
      elements.settingsCaptionTemplate.value = state.settings.caption_template;
      switchView('screen-settings');
    });

    elements.btnSettingsBack.addEventListener('click', () => switchView('screen-dashboard'));
    elements.btnAddBack.addEventListener('click', () => switchView('screen-dashboard'));
    elements.btnDetailBack.addEventListener('click', () => switchView('screen-dashboard'));

    // Bottom Nav
    elements.navBtnInventory.addEventListener('click', () => switchView('screen-dashboard'));
    elements.navBtnAdd.addEventListener('click', () => {
      resetPhotoPicker();
      elements.formAddProduct.reset();
      updateLiveCaptionPreview();
      switchView('screen-add-product');
    });
    elements.navBtnSettings.addEventListener('click', () => {
      elements.settingsStoreName.value = state.settings.store_name;
      elements.settingsCaptionTemplate.value = state.settings.caption_template;
      switchView('screen-settings');
    });

    // 2. Auth Switchers
    elements.tabLoginSignIn.addEventListener('click', () => {
      elements.tabLoginSignIn.className = 'flex-1 py-1.5 text-xs font-semibold rounded-md bg-brand-600 text-white shadow-sm transition';
      elements.tabLoginSignUp.className = 'flex-1 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white transition';
      elements.authBtnText.textContent = 'Sign In to Dashboard';
      elements.authErrorMsg.classList.add('hidden');
    });

    elements.tabLoginSignUp.addEventListener('click', () => {
      elements.tabLoginSignUp.className = 'flex-1 py-1.5 text-xs font-semibold rounded-md bg-brand-600 text-white shadow-sm transition';
      elements.tabLoginSignIn.className = 'flex-1 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white transition';
      elements.authBtnText.textContent = 'Create Seller Account';
      elements.authErrorMsg.classList.add('hidden');
    });

    elements.formAuth.addEventListener('submit', handleAuthSubmit);

    // Pitch Demo Mode Quick-Enter
    elements.btnEnterDemo.addEventListener('click', () => {
      setupDemoMode();
      renderDashboard();
      switchView('screen-dashboard');
      showToast('Entered Pitch Demo Mode!', '⚡');
    });

    // 3. Dashboard Controls
    elements.btnDashboardAddProduct.addEventListener('click', () => {
      resetPhotoPicker();
      elements.formAddProduct.reset();
      updateLiveCaptionPreview();
      switchView('screen-add-product');
    });

    elements.btnEmptyAdd.addEventListener('click', () => {
      resetPhotoPicker();
      elements.formAddProduct.reset();
      updateLiveCaptionPreview();
      switchView('screen-add-product');
    });

    // Timeframe toggle (month vs all)
    elements.toggleStatMonth.addEventListener('click', () => {
      state.statTimeframe = 'month';
      elements.toggleStatMonth.className = 'px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-600 text-white shadow-sm transition';
      elements.toggleStatAll.className = 'px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-white transition';
      renderDashboard();
    });

    elements.toggleStatAll.addEventListener('click', () => {
      state.statTimeframe = 'all';
      elements.toggleStatAll.className = 'px-2.5 py-1 rounded-md text-[11px] font-semibold bg-brand-600 text-white shadow-sm transition';
      elements.toggleStatMonth.className = 'px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-white transition';
      renderDashboard();
    });

    // Drop Analytics Accordion Toggle
    if (elements.btnToggleAnalytics && elements.analyticsSection) {
      elements.btnToggleAnalytics.addEventListener('click', () => {
        const isHidden = elements.analyticsSection.classList.contains('hidden');
        if (isHidden) {
          elements.analyticsSection.classList.remove('hidden');
          elements.textToggleAnalytics.textContent = 'Hide Analytics';
          if (elements.iconToggleAnalytics) elements.iconToggleAnalytics.style.transform = 'rotate(180deg)';
          if (revenueChartInstance) revenueChartInstance.resize();
          if (sizesChartInstance) sizesChartInstance.resize();
        } else {
          elements.analyticsSection.classList.add('hidden');
          elements.textToggleAnalytics.textContent = 'Drop Analytics';
          if (elements.iconToggleAnalytics) elements.iconToggleAnalytics.style.transform = 'rotate(0deg)';
        }
      });
    }

    // Inventory Tabs (Available vs Sold)
    elements.tabAvailable.addEventListener('click', () => {
      state.activeTab = 'available';
      elements.tabAvailable.className = 'pb-2.5 px-4 text-brand-400 border-b-2 border-brand-500 transition flex items-center space-x-1.5';
      elements.tabSold.className = 'pb-2.5 px-4 text-slate-400 border-b-2 border-transparent hover:text-slate-200 transition flex items-center space-x-1.5';
      renderDashboard();
    });

    elements.tabSold.addEventListener('click', () => {
      state.activeTab = 'sold';
      elements.tabSold.className = 'pb-2.5 px-4 text-brand-400 border-b-2 border-brand-500 transition flex items-center space-x-1.5';
      elements.tabAvailable.className = 'pb-2.5 px-4 text-slate-400 border-b-2 border-transparent hover:text-slate-200 transition flex items-center space-x-1.5';
      renderDashboard();
    });

    // Search Filter
    elements.inputSearch.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderDashboard();
    });

    // 4. Add Product Screen Controls
    elements.inputProductPhoto.addEventListener('change', handleImagePick);
    elements.btnRemovePhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      resetPhotoPicker();
    });

    // Live Caption sync
    [elements.inputTitle, elements.inputPrice, elements.inputSize, elements.inputCondition, elements.inputNotes].forEach(input => {
      input.addEventListener('input', updateLiveCaptionPreview);
    });

    // Quick Size Chips
    document.querySelectorAll('.btn-size-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        elements.inputSize.value = chip.textContent;
        updateLiveCaptionPreview();
      });
    });

    // Copy Preview Caption Button
    elements.btnCopyPreview.addEventListener('click', () => {
      if (elements.captionPreview.value) {
        navigator.clipboard.writeText(elements.captionPreview.value);
        showToast('Caption copied to clipboard!', '📋');
      }
    });

    // Save Only / Save and Share
    elements.btnSaveOnly.addEventListener('click', () => saveNewProduct(false));
    elements.btnSaveAndShare.addEventListener('click', () => saveNewProduct(true));

    // 5. Product Detail Screen Controls
    elements.btnDetailSave.addEventListener('click', saveProductDetailChanges);
    elements.btnDetailShareWa.addEventListener('click', async () => {
      const product = state.activeProduct;
      if (!product) return;

      if (product.status === 'sold') {
        openMarkSoldModal(product);
      } else {
        executeWhatsAppShare({
          text: product.caption || generateCaption(product),
          title: product.title
        });
      }
    });

    elements.btnDetailMarkSold.addEventListener('click', () => {
      if (state.activeProduct) openMarkSoldModal(state.activeProduct);
    });

    elements.btnDetailDelete.addEventListener('click', () => {
      if (state.activeProduct) deleteProduct(state.activeProduct.id);
    });

    // 6. Mark Sold Modal Controls
    elements.btnCloseSoldModal.addEventListener('click', () => elements.modalMarkSold.classList.add('hidden'));
    elements.btnConfirmSoldShare.addEventListener('click', () => confirmMarkSold(true));
    elements.btnConfirmSoldOnly.addEventListener('click', () => confirmMarkSold(false));

    elements.inputFinalSoldPrice.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (state.soldTargetProduct) {
        const store = state.settings.store_name || config.DEFAULT_STORE_NAME;
        const imgSrc = getProductImageUrl(state.soldTargetProduct);
        drawSoldOutCanvas(elements.soldPreviewCanvas, imgSrc, store, val);
      }
    });

    // 7. Settings Controls
    elements.btnSaveSettings.addEventListener('click', async () => {
      const storeName = elements.settingsStoreName.value.trim() || config.DEFAULT_STORE_NAME;
      const template = elements.settingsCaptionTemplate.value.trim() || config.DEFAULT_CAPTION_TEMPLATE;

      state.settings.store_name = storeName;
      state.settings.caption_template = template;

      if (state.isDemoMode) {
        saveDemoSettings();
      } else if (state.supabase && state.currentUser) {
        try {
          await state.supabase.from('settings').upsert({
            user_id: state.currentUser.id,
            store_name: storeName,
            caption_template: template
          });
        } catch (e) {
          console.error('Settings save error:', e);
        }
      }

      updateStoreHeader();
      showToast('Settings saved successfully', '⚙️');
      switchView('screen-dashboard');
    });

    elements.btnResetTemplate.addEventListener('click', () => {
      elements.settingsCaptionTemplate.value = config.DEFAULT_CAPTION_TEMPLATE;
      showToast('Template reset to default', '🔄');
    });

    // Caption Placeholder Chips inside Settings
    document.querySelectorAll('.btn-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const placeholder = tag.textContent;
        const textarea = elements.settingsCaptionTemplate;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        textarea.value = text.substring(0, start) + placeholder + text.substring(end);
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
      });
    });

    // Reseed Demo Inventory
    elements.btnReseedDemo.addEventListener('click', () => {
      state.products = [...SAMPLE_PRODUCTS];
      saveDemoProducts();
      renderDashboard();
      showToast('10 demo pieces reloaded!', '🎉');
      switchView('screen-dashboard');
    });

    // Logout
    elements.btnLogout.addEventListener('click', handleLogout);
  }

  // ============================================================================
  // 15. RUN INITIALIZER
  // ============================================================================
  document.addEventListener('DOMContentLoaded', initApp);

})();
