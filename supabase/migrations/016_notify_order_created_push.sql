-- Update handle_order_created_notification to also send push notifications
-- to admins and managers via the notify-order-created Edge Function

CREATE OR REPLACE FUNCTION handle_order_created_notification()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    service_key TEXT;
    project_url TEXT := 'https://uejjlbxgtlpqukuhusmt.supabase.co';
BEGIN
    -- Insert dashboard notification
    INSERT INTO notifications (type, title, description, reference_id, warehouse_id, metadata)
    VALUES (
        'order_created',
        'Nuevo pedido #' || NEW.order_number,
        'Se ha recibido un nuevo pedido',
        NEW.id,
        NEW.warehouse_id,
        jsonb_build_object(
            'order_number', NEW.order_number,
            'total_usd',    NEW.total_usd,
            'delivery_type', NEW.delivery_type
        )
    );

    -- Read service role key from Vault
    SELECT decrypted_secret INTO service_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;

    IF service_key IS NULL THEN
        RAISE WARNING 'notify-order-created: service_role_key not found in vault';
        RETURN NEW;
    END IF;

    -- Call Edge Function to send push notifications to admins and managers
    PERFORM net.http_post(
        url     := project_url || '/functions/v1/notify-order-created',
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || service_key
        ),
        body    := jsonb_build_object(
            'order_id',     NEW.id,
            'order_number', NEW.order_number,
            'warehouse_id', NEW.warehouse_id,
            'total_usd',    NEW.total_usd
        )::text
    );

    RETURN NEW;
END;
$$;
