CREATE OR REPLACE FUNCTION update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "Chat"  -- Nombre correcto de la tabla Chat
    SET "updatedAt" = NEW."createdAt"
    WHERE id = NEW."chatId";  -- chatId entre comillas
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_after_message
AFTER INSERT ON messages  -- ¡minúsculas! (nombre real de la tabla)
FOR EACH ROW
EXECUTE FUNCTION update_chat_updated_at();