-- Trigger: call Edge Function when a delivery person is assigned to an order
-- Uses Supabase Vault to securely store the service role key

-- Note: pg_net and supabase_vault are pre-installed in Supabase, no need to create them.

-- Store secrets in Vault (run manually in SQL editor, replace <YOUR_SERVICE_ROLE_KEY>):
--
--   SELECT vault.create_secret(
--     '<YOUR_SERVICE_ROLE_KEY>',
--     'service_role_key'
--   );

DROP TRIGGER IF EXISTS trigger_notify_delivery_assigned ON orders;
DROP FUNCTION IF EXISTS handle_delivery_person_assigned();

CREATE OR REPLACE FUNCTION handle_delivery_person_assigned()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    service_key TEXT;
    project_url TEXT := 'https://uejjlbxgtlpqukuhusmt.supabase.co';
BEGIN
    -- Only fire when delivery_person_id changes from NULL to a value
    IF OLD.delivery_person_id IS NULL AND NEW.delivery_person_id IS NOT NULL THEN

        -- Read service role key from Vault
        SELECT decrypted_secret INTO service_key
        FROM vault.decrypted_secrets
        WHERE name = 'service_role_key'
        LIMIT 1;

        IF service_key IS NULL THEN
            RAISE WARNING 'notify-delivery: service_role_key not found in vault';
            RETURN NEW;
        END IF;

        PERFORM net.http_post(
            url     := project_url || '/functions/v1/notify-delivery',
            headers := jsonb_build_object(
                'Content-Type',  'application/json',
                'Authorization', 'Bearer ' || service_key
            ),
            body    := jsonb_build_object(
                'order_id',           NEW.id,
                'order_number',       NEW.order_number,
                'delivery_person_id', NEW.delivery_person_id
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_delivery_assigned
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_delivery_person_assigned();
