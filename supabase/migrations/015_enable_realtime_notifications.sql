-- Enable Realtime for notifications table
-- This allows the dashboard to receive new notifications in real time
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
