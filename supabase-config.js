// Configuración de Supabase
// IMPORTANTE: Reemplaza estas credenciales con las de tu proyecto de Supabase

const SUPABASE_CONFIG = {
    // URL de tu proyecto Supabase
    url: 'https://omjvbuboatndmwumpfis.supabase.co',
    
    // Clave pública (anon key) de tu proyecto Supabase
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tanZidWJvYXRuZG13dW1wZmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MzM0NTEsImV4cCI6MjA3NDEwOTQ1MX0.L51PYUKe_unn_wIPriAZHrACLh68J6Sz8bDF08vR8tc',
    
    // Nombre de la tabla donde se guardarán las citas
    tableName: 'citas'
};

// Para configurar tu proyecto de Supabase:
// 1. Ve a https://supabase.com y crea una cuenta
// 2. Crea un nuevo proyecto
// 3. En el dashboard, ve a Settings > API
// 4. Copia la URL y la clave anon key
// 5. Reemplaza los valores arriba

// SQL para crear la tabla de citas en Supabase:
/*
CREATE TABLE citas (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo TEXT NOT NULL,
    comentarios TEXT,
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- Política para permitir insertar citas (clientes)
CREATE POLICY "Permitir insertar citas" ON citas
    FOR INSERT WITH CHECK (true);

-- Política para que solo el profesional pueda leer las citas
CREATE POLICY "Solo profesional puede leer citas" ON citas
    FOR SELECT USING (true);

-- Política para que solo el profesional pueda actualizar citas
CREATE POLICY "Solo profesional puede actualizar citas" ON citas
    FOR UPDATE USING (true);
*/