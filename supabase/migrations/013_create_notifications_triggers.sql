-- Trigger: insert notification when a new order is created
CREATE OR REPLACE FUNCTION handle_order_created_notification()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO notifications (type, title, description, reference_id, warehouse_id, metadata)
    VALUES (
        'order_created',
        'Nuevo pedido #' || NEW.order_number,
        'Se ha recibido un nuevo pedido',
        NEW.id,
        NEW.warehouse_id,
        jsonb_build_object(
            'order_number', NEW.order_number,
            'total_usd', NEW.total_usd,
            'delivery_type', NEW.delivery_type
        )
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_order_created_notification
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_created_notification();


-- Trigger: insert notification when order status changes
CREATE OR REPLACE FUNCTION handle_order_status_notification()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    status_labels JSONB := '{
        "pending":     "Pendiente",
        "confirmed":   "Confirmado",
        "on_delivery": "En camino",
        "completed":   "Completado",
        "cancelled":   "Cancelado"
    }';
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
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
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_order_status_notification
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_status_notification();
