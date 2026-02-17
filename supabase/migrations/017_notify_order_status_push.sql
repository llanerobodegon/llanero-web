-- Update handle_order_status_notification to also send push to the customer
-- when their order status changes (confirmed, on_delivery, completed, cancelled)

CREATE OR REPLACE FUNCTION handle_order_status_notification()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    service_key TEXT;
    project_url TEXT := 'https://uejjlbxgtlpqukuhusmt.supabase.co';
    status_labels JSONB := '{
        "pending":     "Pendiente",
        "confirmed":   "Confirmado",
        "on_delivery": "En camino",
        "completed":   "Completado",
        "cancelled":   "Cancelado"
    }';
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN

        -- Insert dashboard notification
        INSERT INTO notifications (type, title, description, reference_id, warehouse_id, metadata)
        VALUES (
            'order_updated',
            'Pedido #' || NEW.order_number,
            'Estado actualizado a: ' || (status_labels ->> NEW.status),
            NEW.id,
            NEW.warehouse_id,
            jsonb_build_object(
                'order_number', NEW.order_number,
                'old_status',   OLD.status,
                'new_status',   NEW.status,
                'status_label', status_labels ->> NEW.status
            )
        );

        -- Read service role key from Vault
        SELECT decrypted_secret INTO service_key
        FROM vault.decrypted_secrets
        WHERE name = 'service_role_key'
        LIMIT 1;

        IF service_key IS NULL THEN
            RAISE WARNING 'notify-order-status: service_role_key not found in vault';
            RETURN NEW;
        END IF;

        -- Call Edge Function to send push notification to the customer
        PERFORM net.http_post(
            url     := project_url || '/functions/v1/notify-order-status',
            headers := jsonb_build_object(
                'Content-Type',  'application/json',
                'Authorization', 'Bearer ' || service_key
            ),
            body    := jsonb_build_object(
                'order_id',     NEW.id,
                'order_number', NEW.order_number,
                'user_id',      NEW.user_id,
                'new_status',   NEW.status
            )::text
        );

    END IF;
    RETURN NEW;
END;
$$;
