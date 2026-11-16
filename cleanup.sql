-- ==============================================================================
-- 30-DAY SOLD PRODUCT IMAGE CLEANUP (Supabase SQL & pg_cron Setup)
-- ==============================================================================
--
-- PURPOSE:
-- Pakistani thrift sellers move dozens of items every drop. Retaining full-resolution
-- images of sold items forever wastes Supabase Storage bandwidth and quota.
-- This script runs a daily maintenance job that:
-- 1. Finds all products where status = 'sold' and sold_at < NOW() - INTERVAL '30 days'.
-- 2. Deletes the full main image from storage.objects (`product-images` bucket).
-- 3. Sets image_deleted_at = NOW() and image_path = NULL on the products record.
-- 4. KEEPS the thumbnail (thumb_path), metadata, price, and sales history intact.
--
-- ==============================================================================

-- 1. Enable pg_cron and pg_net extensions in Supabase (Database -> Extensions)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Clean-up Function
CREATE OR REPLACE FUNCTION public.cleanup_old_sold_product_images()
RETURNS TABLE (
    deleted_count INTEGER,
    cleaned_product_ids UUID[]
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to clean storage.objects
AS $$
DECLARE
    r RECORD;
    v_deleted_count INTEGER := 0;
    v_ids UUID[] := ARRAY[]::UUID[];
BEGIN
    -- Loop over sold products older than 30 days that have not been cleaned up yet
    FOR r IN 
        SELECT id, image_path, user_id
        FROM public.products
        WHERE status = 'sold'
          AND sold_at IS NOT NULL
          AND sold_at < (NOW() - INTERVAL '30 days')
          AND image_deleted_at IS NULL
          AND image_path IS NOT NULL
    LOOP
        -- Delete file from storage.objects
        -- image_path format is typically: {user_id}/{product_id}/main.webp
        DELETE FROM storage.objects
        WHERE bucket_id = 'product-images'
          AND name = r.image_path;

        -- Update the product row: clear main image path, mark cleanup timestamp
        UPDATE public.products
        SET image_path = NULL,
            image_deleted_at = NOW()
        WHERE id = r.id;

        v_deleted_count := v_deleted_count + 1;
        v_ids := array_append(v_ids, r.id);
    END LOOP;

    RETURN QUERY SELECT v_deleted_count, v_ids;
END;
$$;

-- Grant execution permission to authenticated service roles
REVOKE ALL ON FUNCTION public.cleanup_old_sold_product_images() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_sold_product_images() TO postgres, service_role;

-- 3. Schedule the Cron Job (Runs daily at 3:00 AM UTC)
-- Note: In Supabase, pg_cron is enabled by default on paid plans and available on free tier projects.
-- You can run this block directly in the Supabase SQL Editor.
DO $$
BEGIN
    -- Remove old schedule if it exists
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-sold-image-cleanup') THEN
        PERFORM cron.unschedule('daily-sold-image-cleanup');
    END IF;

    -- Schedule daily run at 03:00 AM UTC
    PERFORM cron.schedule(
        'daily-sold-image-cleanup',
        '0 3 * * *',
        'SELECT public.cleanup_old_sold_product_images();'
    );
END
$$;

-- ==============================================================================
-- HOW TO TEST MANUALLY:
-- 1. Mark a test item as sold with an old timestamp:
--    UPDATE public.products 
--    SET status = 'sold', sold_at = NOW() - INTERVAL '35 days' 
--    WHERE id = '<YOUR_PRODUCT_ID>';
--
-- 2. Execute the function manually:
--    SELECT * FROM public.cleanup_old_sold_product_images();
--
-- 3. Check that image_path is NULL, image_deleted_at is set, and thumb_path remains!
-- ==============================================================================
