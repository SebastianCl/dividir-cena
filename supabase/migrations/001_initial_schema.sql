-- Habilitar extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de sesiones (cenas)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    short_code VARCHAR(6) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Mi Cena',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    receipt_image_url TEXT,
    tip_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0
);

-- Índice para búsqueda por código
CREATE INDEX idx_sessions_short_code ON sessions(short_code);

-- Tabla de participantes
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    is_owner BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por sesión
CREATE INDEX idx_participants_session ON participants(session_id);

-- Tabla de productos/items
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    order_index INTEGER DEFAULT 0,
    is_shared BOOLEAN DEFAULT FALSE,
    ocr_confidence DECIMAL(3,2),
    manually_added BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por sesión
CREATE INDEX idx_items_session ON items(session_id);

-- Tabla de asignaciones
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    share_fraction DECIMAL(5,4) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(item_id, participant_id)
);

-- Índices para búsqueda
CREATE INDEX idx_assignments_item ON assignments(item_id);
CREATE INDEX idx_assignments_participant ON assignments(participant_id);

-- Habilitar Row Level Security (políticas públicas para MVP)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para sesiones activas (MVP sin autenticación)
CREATE POLICY "Sesiones públicas para lectura" ON sessions
    FOR SELECT USING (status = 'active');

CREATE POLICY "Cualquiera puede crear sesiones" ON sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Cualquiera puede actualizar sesiones activas" ON sessions
    FOR UPDATE USING (status = 'active');

-- Políticas para participantes
CREATE POLICY "Participantes visibles en sesiones activas" ON participants
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM sessions WHERE sessions.id = participants.session_id AND sessions.status = 'active')
    );

CREATE POLICY "Cualquiera puede unirse a sesiones activas" ON participants
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_id AND sessions.status = 'active')
    );

CREATE POLICY "Cualquiera puede actualizar participantes" ON participants
    FOR UPDATE USING (true);

-- Políticas para items
CREATE POLICY "Items visibles en sesiones activas" ON items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM sessions WHERE sessions.id = items.session_id AND sessions.status = 'active')
    );

CREATE POLICY "Cualquiera puede agregar items" ON items
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_id AND sessions.status = 'active')
    );

CREATE POLICY "Cualquiera puede editar items" ON items
    FOR UPDATE USING (true);

CREATE POLICY "Cualquiera puede eliminar items" ON items
    FOR DELETE USING (true);

-- Políticas para asignaciones
CREATE POLICY "Asignaciones visibles" ON assignments
    FOR SELECT USING (true);

CREATE POLICY "Cualquiera puede asignar" ON assignments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Cualquiera puede actualizar asignaciones" ON assignments
    FOR UPDATE USING (true);

CREATE POLICY "Cualquiera puede eliminar asignaciones" ON assignments
    FOR DELETE USING (true);

-- Habilitar Realtime para todas las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
