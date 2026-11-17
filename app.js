/**
 * ThriftSeller PK - WhatsApp Drop Dashboard & Inventory Engine
 * 
 * Luxury Light Mode UI (Inspired by Ramotion Upstream)
 * Pure client-side demo with interactive onboarding walkthrough,
 * in-browser image compression, dynamic drop captions, and WhatsApp sharing.
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. CONFIGURATION & STATE
  // ============================================================================
  const config = window.APP_CONFIG || {
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    STORAGE_BUCKET: 'product-images',
    FORCE_DEMO_MODE: true,
    DEFAULT_STORE_NAME: 'Vintage Vault PK',
    DEFAULT_CAPTION_TEMPLATE: `🛍️ {title}
💰 Price: Rs {price}
📏 Size: {size}
✨ Condition: {condition}
{notes}
DM to order • {store}`
  };

  const state = {
    isDemoMode: true,
    supabase: null,
    currentUser: { id: 'demo-seller', email: 'shayan@vintagevault.pk' },
    settings: {
      store_name: config.DEFAULT_STORE_NAME,
      caption_template: config.DEFAULT_CAPTION_TEMPLATE
    },
    products: [],
    activeTab: 'available', // 'available' | 'sold'
    statTimeframe: 'month', // 'month' | 'all'
    searchQuery: '',
    currentView: 'screen-dashboard',
    activeProduct: null,

    // Upload & Compression
    selectedImageFile: null,
    compressedImageFile: null,
    compressedThumbFile: null,
    previewUrl: null,

    // Sold Modal & Share State
    soldTargetProduct: null,
    generatedSoldBlob: null,

    // Tutorial Walkthrough State
    tutorialStep: 0
  };

  // ============================================================================
  // 2. CURATED DEMO PRODUCTS (High-End Pakistani Thrift Pieces)
  // ============================================================================
  function createThriftSVG(label, color1, color2, iconType) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}"/>
          <stop offset="100%" stop-color="${color2}"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#g)"/>
      <circle cx="300" cy="270" r="140" fill="rgba(255,255,255,0.2)"/>
      <text x="300" y="270" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="120" fill="#FFFFFF" text-anchor="middle" dominant-baseline="central">${iconType}</text>
      <rect x="40" y="450" width="520" height="90" rx="20" fill="#FFFFFF" opacity="0.95"/>
      <text x="300" y="505" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="26" fill="#0F172A" text-anchor="middle" letter-spacing="1.2">${label.toUpperCase()}</text>
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
      image_data: createThriftSVG('Carhartt Detroit', '#92400e', '#78350f', '🧥')
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
      image_data: createThriftSVG('Nike Sherpa Fleece', '#1e40af', '#1e3a8a', '⚡')
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
      image_data: createThriftSVG('Ralph Lauren Oxford', '#065f46', '#047857', '👔')
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
      image_data: createThriftSVG('Harley 3D Eagle', '#475569', '#334155', '🦅')
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
      image_data: createThriftSVG('Corduroy Trucker', '#d97706', '#b45309', '🧶')
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
      image_data: createThriftSVG('Levi\'s 501 Denim', '#2563eb', '#1d4ed8', '👖')
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
      image_data: createThriftSVG('Champion Hoodie', '#64748b', '#475569', '🏅')
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
      image_data: createThriftSVG('Schott Leather Biker', '#1e293b', '#0f172a', '🏍️')
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
      image_data: createThriftSVG('Tommy Sailing Gear', '#ef4444', '#1e40af', '⛵')
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
      sold_at: new Date(Date.now() - 86400000 * 42).toISOString(),
      image_deleted_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      image_data: null,
      thumb_data: createThriftSVG('Pendleton Wool', '#047857', '#065f46', '🌲'),
      created_at: new Date(Date.now() - 86400000 * 45).toISOString()
    }
  ];

  // ============================================================================
  // 3. TUTORIAL SLIDES DATA
  // ============================================================================
  const TUTORIAL_SLIDES = [
    {
      tag: 'Step 1 of 3: Snap & Compress',
      icon: '📸',
      title: 'Snap & In-Browser Auto Compression',
      body: 'Take camera photos directly with your phone. In-browser compression cuts 5MB down to ~180KB in milliseconds so drops upload smoothly even on weak mobile data.',
      btnText: 'Next: Drop Captions →'
    },
    {
      tag: 'Step 2 of 3: Live Captions',
      icon: '🛍️',
      title: '1-Tap Drop Caption Generation',
      body: 'Live placeholder replacement for {title}, {price}, {size}, and {condition}. Pre-formatted with emojis and your store DM link, ready to drop.',
      btnText: 'Next: WhatsApp Sharing →'
    },
    {
      tag: 'Step 3 of 3: 2-Tap Share & SOLD OUT',
      icon: '🚀',
      title: '2-Tap Share & Branded SOLD OUT Badges',
      body: 'Share photo + caption directly to your WhatsApp group in two taps. When a customer orders, mark it sold to auto-generate a high-contrast SOLD OUT banner to stop duplicate DMs!',
      btnText: 'Start Pitch Demo ✨'
    }
  ];

  // ============================================================================
  // 4. INITIALIZATION
  // ============================================================================
  let elements = {};

  function initApp() {
    setupDomReferences();
    setupEventListeners();
    setupDemoData();

    // Check if tutorial should be shown
    const hasSeenTutorial = localStorage.getItem('thriftseller_tutorial_seen');
    if (!hasSeenTutorial) {
      setTimeout(openTutorial, 400);
    }
  }

  function setupDemoData() {
    state.isDemoMode = true;

    // Load from localStorage or seed defaults
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
    renderDashboard();
    switchView('screen-dashboard');
  }

  function saveDemoProducts() {
    try {
      localStorage.setItem('thriftseller_demo_products', JSON.stringify(state.products));
    } catch (e) {
      console.warn('LocalStorage limit for demo images reached', e);
    }
  }

  function saveDemoSettings() {
    localStorage.setItem('thriftseller_demo_settings', JSON.stringify(state.settings));
  }

  // ============================================================================
  // 5. DOM REFERENCES
  // ============================================================================
  function setupDomReferences() {
    elements = {
      appHeader: document.getElementById('app-header'),
      headerStoreName: document.getElementById('header-store-name'),
      bottomNav: document.getElementById('bottom-nav'),
      btnOpenSettings: document.getElementById('btn-open-settings'),
      btnOpenTutorial: document.getElementById('btn-open-tutorial'),

      // Dashboard Screen
      screenDashboard: document.getElementById('screen-dashboard'),
      btnHeroAddProduct: document.getElementById('btn-hero-add-product'),
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

      // Bottom Nav
      navBtnInventory: document.getElementById('nav-btn-inventory'),
      navBtnAdd: document.getElementById('nav-btn-add'),
      navBtnSettings: document.getElementById('nav-btn-settings'),

      // Tutorial Modal Elements
      modalTutorial: document.getElementById('modal-tutorial'),
      btnCloseTutorial: document.getElementById('btn-close-tutorial'),
      btnTutorialNext: document.getElementById('btn-tutorial-next'),
      btnTutorialPrev: document.getElementById('btn-tutorial-prev'),
      tutorialStepTag: document.getElementById('tutorial-step-tag'),
      tutorialSlideIcon: document.getElementById('tutorial-slide-icon'),
      tutorialSlideTitle: document.getElementById('tutorial-slide-title'),
      tutorialSlideBody: document.getElementById('tutorial-slide-body'),
      tutorialBtnText: document.getElementById('tutorial-btn-text'),
      tutorialDot1: document.getElementById('tutorial-dot-1'),
      tutorialDot2: document.getElementById('tutorial-dot-2'),
      tutorialDot3: document.getElementById('tutorial-dot-3'),

      // Sold Modal Elements
      modalMarkSold: document.getElementById('modal-mark-sold'),
      btnCloseSoldModal: document.getElementById('btn-close-sold-modal'),
      inputFinalSoldPrice: document.getElementById('input-final-sold-price'),
      soldPreviewCanvas: document.getElementById('sold-preview-canvas'),
      btnConfirmSoldShare: document.getElementById('btn-confirm-sold-share'),
      btnConfirmSoldOnly: document.getElementById('btn-confirm-sold-only'),

      // WhatsApp Fallback Modal
      modalShareFallback: document.getElementById('modal-share-fallback'),
      btnFallbackContinue: document.getElementById('btn-fallback-continue'),

      // Toast & Offscreen Canvas
      toast: document.getElementById('toast'),
      toastIcon: document.getElementById('toast-icon'),
      toastMessage: document.getElementById('toast-message'),
      offscreenCanvas: document.getElementById('offscreen-sold-canvas')
    };
  }

  // ============================================================================
  // 6. VIEW NAVIGATION & ROUTING
  // ============================================================================
  function switchView(viewId) {
    const screens = [
      elements.screenDashboard,
      elements.screenAddProduct,
      elements.screenProductDetail,
      elements.screenSettings
    ];

    screens.forEach(screen => {
      if (screen) screen.classList.add('hidden');
    });

    const target = document.getElementById(viewId);
    if (target) {
      target.classList.remove('hidden');
      state.currentView = viewId;
    }

    updateNavHighlight(viewId);
    window.scrollTo(0, 0);
  }

  function updateNavHighlight(viewId) {
    elements.navBtnInventory.classList.remove('text-brand-600');
    elements.navBtnInventory.classList.add('text-slate-400');
    elements.navBtnSettings.classList.remove('text-brand-600');
    elements.navBtnSettings.classList.add('text-slate-400');

    if (viewId === 'screen-dashboard' || viewId === 'screen-product-detail') {
      elements.navBtnInventory.classList.add('text-brand-600');
      elements.navBtnInventory.classList.remove('text-slate-400');
    } else if (viewId === 'screen-settings') {
      elements.navBtnSettings.classList.add('text-brand-600');
      elements.navBtnSettings.classList.remove('text-slate-400');
    }
  }

  function updateStoreHeader() {
    const store = state.settings.store_name || config.DEFAULT_STORE_NAME;
    elements.headerStoreName.textContent = store;
  }

  // ============================================================================
  // 7. INTERACTIVE TUTORIAL CONTROLLER
  // ============================================================================
  function openTutorial() {
    state.tutorialStep = 0;
    renderTutorialStep(0);
    elements.modalTutorial.classList.remove('hidden');
  }

  function closeTutorial() {
    elements.modalTutorial.classList.add('hidden');
    localStorage.setItem('thriftseller_tutorial_seen', 'true');
  }

  function renderTutorialStep(stepIndex) {
    const slide = TUTORIAL_SLIDES[stepIndex];
    if (!slide) return;

    elements.tutorialStepTag.textContent = slide.tag;
    elements.tutorialSlideIcon.textContent = slide.icon;
    elements.tutorialSlideTitle.textContent = slide.title;
    elements.tutorialSlideBody.textContent = slide.body;
    elements.tutorialBtnText.textContent = slide.btnText;

    // Prev Button Visibility
    if (stepIndex > 0) {
      elements.btnTutorialPrev.classList.remove('hidden');
    } else {
      elements.btnTutorialPrev.classList.add('hidden');
    }

    // Dot indicators
    const dots = [elements.tutorialDot1, elements.tutorialDot2, elements.tutorialDot3];
    dots.forEach((dot, idx) => {
      if (idx === stepIndex) {
        dot.className = 'w-6 h-1.5 rounded-full bg-emerald-600 transition-all';
      } else {
        dot.className = 'w-1.5 h-1.5 rounded-full bg-slate-200 transition-all';
      }
    });
  }

  function handleTutorialNext() {
    if (state.tutorialStep < TUTORIAL_SLIDES.length - 1) {
      state.tutorialStep++;
      renderTutorialStep(state.tutorialStep);
    } else {
      closeTutorial();
      showToast('Welcome to ThriftSeller PK!', '✨');
    }
  }

  function handleTutorialPrev() {
    if (state.tutorialStep > 0) {
      state.tutorialStep--;
      renderTutorialStep(state.tutorialStep);
    }
  }

  // ============================================================================
  // 8. FORMATTING & CAPTION TEMPLATING
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
      .replace(/\n\s*\n\s*\n/g, '\n\n')
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
  // 9. CLIENT-SIDE IMAGE COMPRESSION (browser-image-compression)
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
    elements.compressionBadge.className = 'absolute top-2 left-2 bg-slate-900/90 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-md';

    try {
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

      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = URL.createObjectURL(compressedMain);
      elements.photoPreviewImg.src = state.previewUrl;

      const newSizeKB = Math.round(compressedMain.size / 1024);
      elements.compressionBadge.textContent = `WebP: ${newSizeKB} KB (${originalSizeMB} MB orig)`;
      elements.compressionBadge.className = 'absolute top-2 left-2 bg-slate-900/90 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-md';
      
      showToast(`Photo compressed to ${newSizeKB} KB`, '⚡');
    } catch (err) {
      console.error('Compression failed:', err);
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
  // 10. CANVAS SOLD OUT GRAPHIC GENERATOR
  // ============================================================================
  function drawSoldOutCanvas(targetCanvas, imageSource, storeName, soldPrice) {
    return new Promise((resolve) => {
      const ctx = targetCanvas.getContext('2d');
      const size = 1080;
      targetCanvas.width = size;
      targetCanvas.height = size;

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        ctx.clearRect(0, 0, size, size);
        const scale = Math.max(size / img.width, size / img.height);
        const x = (size / 2) - (img.width / 2) * scale;
        const y = (size / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Dark scrim
        ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
        ctx.fillRect(0, 0, size, size);

        // Diagonal SOLD OUT Banner
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate(-14 * Math.PI / 180);

        const bannerH = 175;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 12;

        ctx.fillStyle = '#DC2626'; // High-contrast Red
        ctx.fillRect(-size, -bannerH / 2, size * 2, bannerH);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.strokeRect(-size, -bannerH / 2 + 8, size * 2, bannerH - 16);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 94px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SOLD OUT', 0, 0);

        ctx.restore();

        // Bottom Store Banner
        const footerH = 110;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, size - footerH, size, footerH);

        ctx.fillStyle = '#34D399';
        ctx.font = '800 30px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const priceText = soldPrice ? ` • SOLD FOR Rs ${formatCurrency(soldPrice)}` : '';
        ctx.fillText(`✦ ${storeName.toUpperCase()} ✦${priceText}`, size / 2, size - (footerH / 2));

        resolve();
      };

      img.onerror = () => {
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

      img.src = imageSource;
    });
  }

  // ============================================================================
  // 11. WHATSAPP SHARE FLOW & FALLBACK
  // ============================================================================
  async function executeWhatsAppShare({ file, text, title }) {
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
        if (err.name === 'AbortError') return false;
        console.warn('navigator.share failed, trying fallback:', err);
      }
    }

    // Fallback: Copy caption + download photo + open wa.me
    try {
      if (text && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch (e) {}

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

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text || '')}`;
    elements.btnFallbackContinue.onclick = () => {
      elements.modalShareFallback.classList.add('hidden');
      window.open(waUrl, '_blank');
    };
    elements.modalShareFallback.classList.remove('hidden');

    showToast('Caption copied! Attach photo in WhatsApp', '📋');
    return false;
  }

  // ============================================================================
  // 12. PRODUCT ACTIONS (ADD, EDIT, MARK SOLD, DELETE)
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

    const imageFileToShare = state.compressedImageFile;

    if (state.previewUrl && state.compressedImageFile) {
      const reader = new FileReader();
      reader.readAsDataURL(state.compressedImageFile);
      await new Promise(resolve => {
        reader.onloadend = () => {
          newProduct.image_data = reader.result;
          resolve();
        };
      });
    } else {
      newProduct.image_data = createThriftSVG(title, '#059669', '#047857', '🛍️');
    }

    state.products.unshift(newProduct);
    saveDemoProducts();
    showToast('Product dropped to inventory!', '✅');

    if (shouldShare) {
      executeWhatsAppShare({
        file: imageFileToShare,
        text: newProduct.caption,
        title: newProduct.title
      });
    }

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

    drawSoldOutCanvas(elements.soldPreviewCanvas, imgSrc, store, product.price);
    elements.modalMarkSold.classList.remove('hidden');
  }

  async function confirmMarkSold(shouldShare) {
    const product = state.soldTargetProduct;
    if (!product) return;

    const soldPrice = parseInt(elements.inputFinalSoldPrice.value, 10) || product.price;
    const soldAt = new Date().toISOString();

    product.status = 'sold';
    product.sold_price = soldPrice;
    product.sold_at = soldAt;

    saveDemoProducts();
    elements.modalMarkSold.classList.add('hidden');
    showToast(`Marked SOLD for Rs ${formatCurrency(soldPrice)}!`, '🎉');

    if (shouldShare) {
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
      ? 'text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase bg-rose-100 text-rose-700 border border-rose-200'
      : 'text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-200';

    if (isSold) {
      elements.detailSoldBanner.classList.remove('hidden');
      elements.btnDetailMarkSold.classList.add('hidden');
      elements.detailShareBtnText.textContent = 'Share SOLD OUT Banner';
    } else {
      elements.detailSoldBanner.classList.add('hidden');
      elements.btnDetailMarkSold.classList.remove('hidden');
      elements.detailShareBtnText.textContent = 'Share to WhatsApp Group';
    }

    elements.detailImage.src = getProductImageUrl(product);
    switchView('screen-product-detail');
  }

  function saveProductDetailChanges() {
    const product = state.activeProduct;
    if (!product) return;

    product.title = elements.detailTitle.value.trim();
    product.price = parseInt(elements.detailPrice.value, 10) || product.price;
    product.size = elements.detailSize.value.trim();
    product.condition = elements.detailCondition.value;
    product.notes = elements.detailNotes.value.trim();
    product.caption = elements.detailCaption.value.trim();

    saveDemoProducts();
    showToast('Product details saved', '✅');
    renderDashboard();
  }

  function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    state.products = state.products.filter(p => p.id !== productId);
    saveDemoProducts();
    showToast('Product removed', '🗑️');
    renderDashboard();
    switchView('screen-dashboard');
  }

  function getProductImageUrl(product) {
    if (product.image_data) return product.image_data;
    if (product.thumb_data) return product.thumb_data;
    return createThriftSVG(product.title || 'Thrift Item', '#059669', '#047857', '👕');
  }

  // ============================================================================
  // 13. DASHBOARD RENDERING & VISUAL ANALYTICS (LIGHT MODE)
  // ============================================================================
  function renderDashboard() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

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

    // Stat Cards
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

    // Tabs
    elements.badgeAvailableCount.textContent = inStock.length;
    elements.badgeSoldCount.textContent = allSold.length;

    // Filter
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

    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Render Cards
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
        elements.productListContainer.appendChild(createProductCardElement(product));
      });
    }

    // Update Analytics Charts
    updateAnalyticsCharts(activeSoldList);
  }

  function createProductCardElement(product) {
    const card = document.createElement('div');
    card.className = 'bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-3 flex items-center space-x-3 shadow-card transition active:bg-slate-50 cursor-pointer';

    const isSold = product.status === 'sold';
    const imgSrc = getProductImageUrl(product);

    card.innerHTML = `
      <div class="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        <img src="${imgSrc}" alt="${escapeHtml(product.title)}" class="w-full h-full object-cover" loading="lazy">
        ${isSold ? '<div class="absolute inset-0 bg-slate-900/60 flex items-center justify-center"><span class="text-[9px] font-black text-white uppercase tracking-wider bg-rose-600 px-1.5 py-0.5 rounded">SOLD</span></div>' : ''}
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-xs text-slate-900 truncate pr-1">${escapeHtml(product.title)}</h4>
        </div>
        
        <div class="flex items-center space-x-1.5 mt-1">
          <span class="text-xs font-black ${isSold ? 'text-amber-600' : 'text-emerald-700'}">Rs ${formatCurrency(isSold ? (product.sold_price || product.price) : product.price)}</span>
          ${isSold && product.sold_price && product.sold_price !== product.price ? `<span class="text-[10px] text-slate-400 line-through">Rs ${formatCurrency(product.price)}</span>` : ''}
          ${product.size ? `<span class="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200 font-mono">${escapeHtml(product.size)}</span>` : ''}
          ${product.condition ? `<span class="text-[9px] text-slate-500 font-medium">${escapeHtml(product.condition)}</span>` : ''}
        </div>

        <div class="text-[10px] text-slate-400 font-medium mt-0.5">
          ${isSold ? (product.sold_at ? `Sold ${formatRelativeTime(product.sold_at)}` : 'Sold') : 'Ready to drop'}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center space-x-1.5 flex-shrink-0" onclick="event.stopPropagation()">
        ${!isSold ? `
          <button class="btn-card-share px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 text-[11px] font-bold transition flex items-center space-x-1" title="Share to WhatsApp">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 2C6.494 2 2 6.495 2 12.031c0 1.996.586 3.86 1.603 5.435L2 22l4.673-1.572A9.972 9.972 0 0012.031 22C17.568 22 22 17.505 22 12.031 22 6.495 17.568 2 12.031 2z"/>
            </svg>
            <span>Share</span>
          </button>
          <button class="btn-card-sold px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white border border-amber-200 text-[11px] font-bold transition" title="Mark as Sold">
            Sold
          </button>
        ` : `
          <button class="btn-card-sold-share px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 text-[11px] font-bold transition flex items-center space-x-1" title="Share SOLD OUT graphic">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 2C6.494 2 2 6.495 2 12.031c0 1.996.586 3.86 1.603 5.435L2 22l4.673-1.572A9.972 9.972 0 0012.031 22C17.568 22 22 17.505 22 12.031 22 6.495 17.568 2 12.031 2z"/>
            </svg>
            <span>SOLD OUT</span>
          </button>
        `}
      </div>
    `;

    card.addEventListener('click', () => openProductDetail(product));

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

  // ============================================================================
  // 14. LIGHT-MODE CHART.JS INTEGRATION
  // ============================================================================
  let revenueChartInstance = null;
  let sizesChartInstance = null;

  function updateAnalyticsCharts(soldList) {
    if (!window.Chart) return;

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

    if (elements.chartRevenueCanvas) {
      if (revenueChartInstance) revenueChartInstance.destroy();

      const ctx = elements.chartRevenueCanvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 160);
      gradient.addColorStop(0, 'rgba(5, 150, 105, 0.25)');
      gradient.addColorStop(1, 'rgba(5, 150, 105, 0.0)');

      revenueChartInstance = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Revenue (Rs)',
            data: values,
            borderColor: '#059669',
            backgroundColor: gradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#FFFFFF',
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
              borderColor: '#E2E8F0',
              borderWidth: 1,
              padding: 8,
              callbacks: {
                label: (context) => ` Rs ${formatCurrency(context.parsed.y)}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(226, 232, 240, 0.8)' },
              ticks: { color: '#64748B', font: { size: 10, weight: 600 } }
            },
            y: {
              grid: { color: 'rgba(226, 232, 240, 0.8)' },
              ticks: {
                color: '#64748B',
                font: { size: 10, weight: 600 },
                callback: (val) => 'Rs ' + (val >= 1000 ? (val / 1000) + 'k' : val)
              }
            }
          }
        }
      });
    }

    // Size Demand
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
      if (sizesChartInstance) sizesChartInstance.destroy();

      const ctx2 = elements.chartSizesCanvas.getContext('2d');
      sizesChartInstance = new window.Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: sizeLabels,
          datasets: [{
            data: sizeData,
            backgroundColor: [
              '#059669',
              '#0D9488',
              '#4F46E5',
              '#D97706',
              '#E11D48'
            ],
            borderWidth: 3,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#475569',
                boxWidth: 8,
                boxHeight: 8,
                font: { size: 9, weight: 600 },
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

    if (elements.analyticsInsightText && soldList.length > 0) {
      const topSize = sizeLabels[0] || 'L';
      elements.analyticsInsightText.textContent = `Size ${topSize} & outerwear lead your drops. Stock more ${topSize} pieces for fast sell-outs!`;
    }
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
  // 15. TOAST NOTIFICATION UTILITY
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
  // 16. EVENT LISTENERS
  // ============================================================================
  function setupEventListeners() {
    // Tutorial Guide Controls
    if (elements.btnOpenTutorial) elements.btnOpenTutorial.addEventListener('click', openTutorial);
    if (elements.btnCloseTutorial) elements.btnCloseTutorial.addEventListener('click', closeTutorial);
    if (elements.btnTutorialNext) elements.btnTutorialNext.addEventListener('click', handleTutorialNext);
    if (elements.btnTutorialPrev) elements.btnTutorialPrev.addEventListener('click', handleTutorialPrev);

    // Settings Navigation
    elements.btnOpenSettings.addEventListener('click', () => {
      elements.settingsStoreName.value = state.settings.store_name;
      elements.settingsCaptionTemplate.value = state.settings.caption_template;
      switchView('screen-settings');
    });

    elements.btnSettingsBack.addEventListener('click', () => switchView('screen-dashboard'));
    elements.btnAddBack.addEventListener('click', () => switchView('screen-dashboard'));
    elements.btnDetailBack.addEventListener('click', () => switchView('screen-dashboard'));

    // Bottom Navigation
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

    // Hero Drop Button
    if (elements.btnHeroAddProduct) {
      elements.btnHeroAddProduct.addEventListener('click', () => {
        resetPhotoPicker();
        elements.formAddProduct.reset();
        updateLiveCaptionPreview();
        switchView('screen-add-product');
      });
    }

    if (elements.btnEmptyAdd) {
      elements.btnEmptyAdd.addEventListener('click', () => {
        resetPhotoPicker();
        elements.formAddProduct.reset();
        updateLiveCaptionPreview();
        switchView('screen-add-product');
      });
    }

    // Timeframe Toggles
    elements.toggleStatMonth.addEventListener('click', () => {
      state.statTimeframe = 'month';
      elements.toggleStatMonth.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-900 shadow-sm transition';
      elements.toggleStatAll.className = 'px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 transition';
      renderDashboard();
    });

    elements.toggleStatAll.addEventListener('click', () => {
      state.statTimeframe = 'all';
      elements.toggleStatAll.className = 'px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-900 shadow-sm transition';
      elements.toggleStatMonth.className = 'px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 transition';
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
          elements.textToggleAnalytics.textContent = 'Sales Analytics';
          if (elements.iconToggleAnalytics) elements.iconToggleAnalytics.style.transform = 'rotate(0deg)';
        }
      });
    }

    // Inventory Tabs (Available vs Sold Out)
    elements.tabAvailable.addEventListener('click', () => {
      state.activeTab = 'available';
      elements.tabAvailable.className = 'flex-1 py-2 rounded-lg bg-white text-slate-900 shadow-sm transition flex items-center justify-center space-x-1.5';
      elements.tabSold.className = 'flex-1 py-2 rounded-lg text-slate-600 hover:text-slate-900 transition flex items-center justify-center space-x-1.5';
      renderDashboard();
    });

    elements.tabSold.addEventListener('click', () => {
      state.activeTab = 'sold';
      elements.tabSold.className = 'flex-1 py-2 rounded-lg bg-white text-slate-900 shadow-sm transition flex items-center justify-center space-x-1.5';
      elements.tabAvailable.className = 'flex-1 py-2 rounded-lg text-slate-600 hover:text-slate-900 transition flex items-center justify-center space-x-1.5';
      renderDashboard();
    });

    // Search
    elements.inputSearch.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderDashboard();
    });

    // Add Product Form
    elements.inputProductPhoto.addEventListener('change', handleImagePick);
    elements.btnRemovePhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      resetPhotoPicker();
    });

    [elements.inputTitle, elements.inputPrice, elements.inputSize, elements.inputCondition, elements.inputNotes].forEach(input => {
      input.addEventListener('input', updateLiveCaptionPreview);
    });

    document.querySelectorAll('.btn-size-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        elements.inputSize.value = chip.textContent;
        updateLiveCaptionPreview();
      });
    });

    elements.btnCopyPreview.addEventListener('click', () => {
      if (elements.captionPreview.value) {
        navigator.clipboard.writeText(elements.captionPreview.value);
        showToast('Caption copied to clipboard!', '📋');
      }
    });

    elements.btnSaveOnly.addEventListener('click', () => saveNewProduct(false));
    elements.btnSaveAndShare.addEventListener('click', () => saveNewProduct(true));

    // Detail Screen Actions
    elements.btnDetailSave.addEventListener('click', saveProductDetailChanges);
    elements.btnDetailShareWa.addEventListener('click', () => {
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

    // Sold Modal Controls
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

    // Settings Controls
    elements.btnSaveSettings.addEventListener('click', () => {
      const storeName = elements.settingsStoreName.value.trim() || config.DEFAULT_STORE_NAME;
      const template = elements.settingsCaptionTemplate.value.trim() || config.DEFAULT_CAPTION_TEMPLATE;

      state.settings.store_name = storeName;
      state.settings.caption_template = template;
      saveDemoSettings();

      updateStoreHeader();
      showToast('Settings saved successfully', '⚙️');
      switchView('screen-dashboard');
    });

    elements.btnResetTemplate.addEventListener('click', () => {
      elements.settingsCaptionTemplate.value = config.DEFAULT_CAPTION_TEMPLATE;
      showToast('Template reset to default', '🔄');
    });

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

    elements.btnReseedDemo.addEventListener('click', () => {
      state.products = [...SAMPLE_PRODUCTS];
      saveDemoProducts();
      renderDashboard();
      showToast('10 demo pieces reloaded!', '🎉');
      switchView('screen-dashboard');
    });
  }

  // ============================================================================
  // 17. BOOTSTRAP APP
  // ============================================================================
  document.addEventListener('DOMContentLoaded', initApp);

})();
