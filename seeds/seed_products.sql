-- ==============================================================================
-- DEMO SEED DATA: 10 CURATED PAKISTANI THRIFT STORE PRODUCTS
-- ==============================================================================
--
-- Instructions:
-- 1. Create a user account in the app or Supabase Auth.
-- 2. Find your user_id in auth.users (or use SELECT id FROM auth.users LIMIT 1;).
-- 3. Replace 'YOUR_USER_ID_HERE' with your real user_id, or run with the subquery below.
-- ==============================================================================

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get first registered user if none explicitly provided
    SELECT id INTO target_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No user found in auth.users. Please sign up or create a user first.';
        RETURN;
    END IF;

    -- Ensure settings exist for the target user
    INSERT INTO public.settings (user_id, store_name, caption_template)
    VALUES (
        target_user_id,
        'Vintage Vault PK',
        '🛍️ {title}
💰 Price: Rs {price}
📏 Size: {size}
✨ Condition: {condition}
{notes}
DM to order • {store}'
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET store_name = EXCLUDED.store_name;

    -- Clear previous test products for this user (optional)
    -- DELETE FROM public.products WHERE user_id = target_user_id;

    -- 1. Vintage Carhartt Detroit Duck Canvas Jacket (Available)
    INSERT INTO public.products (user_id, title, price, size, condition, notes, caption, status)
    VALUES (
        target_user_id,
        'Vintage 90s Carhartt Detroit Duck Canvas Jacket',
        5800,
        'XL (Boxy Fit)',
        'Good',
        'Sturdy heavyweight duck canvas with blanket lining. Beautiful vintage patina and authentic distress around cuffs.',
        '🛍️ Vintage 90s Carhartt Detroit Duck Canvas Jacket
💰 Price: Rs 5,800
📏 Size: XL (Boxy Fit)
✨ Condition: Good
Sturdy heavyweight duck canvas with blanket lining. Beautiful vintage patina and authentic distress around cuffs.
DM to order • Vintage Vault PK',
        'available'
    );

    -- 2. Retro Nike Swoosh 1/4 Zip Sherpa Fleece (Available)
    INSERT INTO public.products (user_id, title, price, size, condition, notes, caption, status)
    VALUES (
        target_user_id,
        'Retro Nike Swoosh 1/4 Zip Sherpa Fleece',
        3200,
        'L (Chest 44)',
        'Like new',
        'Super cozy winter fleece. Deep navy with embroidered mini swoosh on chest. Flawless zippers.',
        '🛍️ Retro Nike Swoosh 1/4 Zip Sherpa Fleece
💰 Price: Rs 3,200
📏 Size: L (Chest 44)
✨ Condition: Like new
Super cozy winter fleece. Deep navy with embroidered mini swoosh on chest. Flawless zippers.
DM to order • Vintage Vault PK',
        'available'
    );

    -- 3. Heavyweight Ralph Lauren Oxford Cotton Shirt (Available)
    INSERT INTO public.products (user_id, title, price, size, condition, notes, caption, status)
    VALUES (
        target_user_id,
        'Heavyweight Ralph Lauren Oxford Shirt',
        2400,
        'M (Relaxed)',
        'Like new',
        'Classic forest green button-down collar with navy polo rider embroidery. Crisp thick cotton.',
        '🛍️ Heavyweight Ralph Lauren Oxford Shirt
💰 Price: Rs 2,400
📏 Size: M (Relaxed)
✨ Condition: Like new
Classic forest green button-down collar with navy polo rider embroidery. Crisp thick cotton.
DM to order • Vintage Vault PK',
        'available'
    );

    -- 4. Vintage 1994 Harley-Davidson Eagle Graphic Tee (Available)
    INSERT INTO public.products (user_id, title, price, size, condition, notes, caption, status)
    VALUES (
        target_user_id,
        '1994 Harley-Davidson Eagle Graphic Tee',
        3600,
        'L (Single Stitch)',
        'Good',
        'Authentic single stitch on sleeves & hem. Soft sun-faded charcoal wash with cracked print.',
        '🛍️ 1994 Harley-Davidson Eagle Graphic Tee
💰 Price: Rs 3,600
📏 Size: L (Single Stitch)
✨ Condition: Good
Authentic single stitch on sleeves & hem. Soft sun-faded charcoal wash with cracked print.
DM to order • Vintage Vault PK',
        'available'
    );

    -- 5. Corduroy Collared Sherpa Trucker Jacket (Available)
    INSERT INTO public.products (user_id, title, price, size, condition, notes, caption, status)
    VALUES (
        target_user_id,
        'Ochre Corduroy Sherpa Trucker Jacket',
        4500,
        'M (Snug Fit)',
        'New',
        'Warm mustard/ochre wide-wale corduroy with cream sherpa collar. Tags attached, pristine.',
        '🛍️ Ochre Corduroy Sherpa Trucker Jacket
💰 Price: Rs 4,500
📏 Size: M (Snug Fit)
✨ Condition: New
Warm mustard/ochre wide-wale corduroy with cream sherpa collar. Tags attached, pristine.
DM to order • Vintage Vault PK',
        'available'
    );

    -- 6. Levi''s 501 Original Straight Cut Denim (Available)
    INSERT INTO public.products (user_id, title, price, size, condition, notes, caption, status)
    VALUES (
        target_user_id,
        'Vintage Levi''s 501 Original Fit Denim',
        2900,
        'W34 L32',
        'Good',
        'Classic medium stonewash button fly. Natural honeycombs and subtle whiskering.',
        '🛍️ Vintage Levi''s 501 Original Fit Denim
💰 Price: Rs 2,900
📏 Size: W34 L32
✨ Condition: Good
Classic medium stonewash button fly. Natural honeycombs and subtle whiskering.
DM to order • Vintage Vault PK',
        'available'
    );

    -- 7. Champion Reverse Weave University Hoodie (Sold this month)
    INSERT INTO public.products (user_id, title, price, size, condition, notes, caption, status, sold_price, sold_at)
    VALUES (
        target_user_id,
        'Champion Reverse Weave Heather Grey Hoodie',
        3800,
        'XL',
        'Like new',
        'Heavy 12oz reverse weave fleece with classic C patch on cuff. SOLD within 10 mins of drop!',
        '🛍️ Champion Reverse Weave Heather Grey Hoodie
💰 Price: Rs 3,800
📏 Size: XL
✨ Condition: Like new
Heavy 12oz reverse weave fleece with classic C patch on cuff. SOLD within 10 mins of drop!
DM to order • Vintage Vault PK',
        'sold',
        3600,
        NOW() - INTERVAL '2 days'
    );

    -- 8. Authentic Schott NYC Leather Biker Jacket (Sold this month)
    INSERT INTO public.products (user_id, title, price, size, condition, notes, caption, status, sold_price, sold_at)
    VALUES (
        target_user_id,
        'Vintage Schott NYC Steerhide Leather Biker Jacket',
        8500,
        'L (Chest 42)',
        'Good',
        'Heavy genuine cowhide leather with Talon zippers and red quilted satin lining. Grailed piece.',
        '🛍️ Vintage Schott NYC Steerhide Leather Biker Jacket
💰 Price: Rs 8,500
📏 Size: L (Chest 42)
✨ Condition: Good
Heavy genuine cowhide leather with Talon zippers and red quilted satin lining. Grailed piece.
DM to order • Vintage Vault PK',
        'sold',
        8000,
        NOW() - INTERVAL '6 days'
    );

    -- 9. Tommy Hilfiger 90s Sailing Colorblock Windbreaker (Sold this month)
    INSERT INTO public.products (user_id, title, price, size, condition, notes, caption, status, sold_price, sold_at)
    VALUES (
        target_user_id,
        'Tommy Hilfiger Sailing Gear 90s Windbreaker',
        3500,
        'L',
        'Good',
        'Iconic red, white, and navy colorblocking with stowaway hood. Quick sale via WhatsApp DM.',
        '🛍️ Tommy Hilfiger Sailing Gear 90s Windbreaker
💰 Price: Rs 3,500
📏 Size: L
✨ Condition: Good
Iconic red, white, and navy colorblocking with stowaway hood. Quick sale via WhatsApp DM.
DM to order • Vintage Vault PK',
        'sold',
        3500,
        NOW() - INTERVAL '14 days'
    );

    -- 10. Pendleton Virgin Wool Flannel Board Shirt (Sold 45 days ago - Image Cleaned Demo)
    INSERT INTO public.products (user_id, title, price, size, condition, notes, caption, status, sold_price, sold_at, image_deleted_at)
    VALUES (
        target_user_id,
        'Vintage Pendleton 100% Virgin Wool Plaid Shirt',
        4200,
        'M',
        'Like new',
        'Made in USA 100% pure virgin wool in rich tartan plaid. Historical sales record.',
        '🛍️ Vintage Pendleton 100% Virgin Wool Plaid Shirt
💰 Price: Rs 4,200
📏 Size: M
✨ Condition: Like new
Made in USA 100% pure virgin wool in rich tartan plaid. Historical sales record.
DM to order • Vintage Vault PK',
        'sold',
        4000,
        NOW() - INTERVAL '45 days',
        NOW() - INTERVAL '15 days'
    );

    RAISE NOTICE 'Successfully seeded 10 sample thrift products for user %', target_user_id;
END
$$;
