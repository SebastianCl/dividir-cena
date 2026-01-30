-- Política para permitir eliminar participantes
CREATE POLICY "Cualquiera puede eliminar participantes" ON participants
    FOR DELETE USING (true);
