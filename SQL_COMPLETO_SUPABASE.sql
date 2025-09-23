-- ========================================
-- CONFIGURACIÓN COMPLETA DE SUPABASE
-- Sistema de Gestión de Citas del Obispado
-- ========================================

-- ========== CREAR TABLA DE CITAS ==========

CREATE TABLE IF NOT EXISTS citas_obispado (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo TEXT NOT NULL,
    comentarios TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas_obispado(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas_obispado(estado);
CREATE INDEX IF NOT EXISTS idx_citas_email ON citas_obispado(email);
CREATE INDEX IF NOT EXISTS idx_citas_created_at ON citas_obispado(created_at);

-- ========== CREAR TABLA DE USUARIOS ADMINISTRADORES ==========

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'obispo', 'asistente', 'secretario')),
    permissions JSONB DEFAULT '["read_appointments", "write_appointments"]'::jsonb,
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para la tabla de usuarios
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(active);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- ========== CREAR TABLA DE LOGS DE ACCESO ==========

CREATE TABLE IF NOT EXISTS access_logs (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    success BOOLEAN DEFAULT true,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para logs
CREATE INDEX IF NOT EXISTS idx_access_logs_username ON access_logs(username);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON access_logs(action);

-- ========== FUNCIÓN PARA ACTUALIZAR TIMESTAMP ==========

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========== TRIGGERS PARA UPDATED_AT ==========

-- Trigger para citas_obispado
DROP TRIGGER IF EXISTS update_citas_obispado_updated_at ON citas_obispado;
CREATE TRIGGER update_citas_obispado_updated_at
    BEFORE UPDATE ON citas_obispado
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para admin_users
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========== FUNCIÓN PARA GENERAR HASH DE CONTRASEÑA ==========

CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
DECLARE
    salt TEXT;
    hash_result TEXT;
BEGIN
    -- Generar salt aleatorio de 32 caracteres
    salt := encode(gen_random_bytes(16), 'hex');
    
    -- Crear hash SHA-256 con salt
    hash_result := encode(digest(password || salt, 'sha256'), 'hex') || ':' || salt;
    
    RETURN hash_result;
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCIÓN PARA VERIFICAR CONTRASEÑA ==========

CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
    salt TEXT;
    computed_hash TEXT;
BEGIN
    -- Validar formato del hash
    IF hash IS NULL OR position(':' in hash) = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Separar hash almacenado y salt
    stored_hash := split_part(hash, ':', 1);
    salt := split_part(hash, ':', 2);
    
    -- Computar hash con el salt
    computed_hash := encode(digest(password || salt, 'sha256'), 'hex');
    
    -- Comparar hashes
    RETURN stored_hash = computed_hash;
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCIÓN DE AUTENTICACIÓN PRINCIPAL ==========

CREATE OR REPLACE FUNCTION authenticate_user(input_username TEXT, input_password TEXT)
RETURNS JSON AS $$
DECLARE
    user_record admin_users%ROWTYPE;
    auth_result JSON;
    session_token TEXT;
BEGIN
    -- Buscar usuario activo
    SELECT * INTO user_record 
    FROM admin_users 
    WHERE username = input_username AND active = true;
    
    -- Verificar si el usuario existe
    IF NOT FOUND THEN
        -- Insertar log de intento fallido
        INSERT INTO access_logs (username, action, success, details) 
        VALUES (input_username, 'failed_login', false, 
                json_build_object('error', 'Usuario no encontrado'));
        
        RETURN json_build_object(
            'success', false,
            'error', 'Credenciales incorrectas'
        );
    END IF;
    
    -- Verificar si la cuenta está bloqueada
    IF user_record.locked_until IS NOT NULL AND user_record.locked_until > NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cuenta temporalmente bloqueada. Intente más tarde.'
        );
    END IF;
    
    -- Verificar contraseña
    IF verify_password(input_password, user_record.password_hash) THEN
        -- Generar token de sesión
        session_token := encode(gen_random_bytes(32), 'base64');
        
        -- Autenticación exitosa - actualizar usuario
        UPDATE admin_users 
        SET 
            last_login = NOW(),
            failed_login_attempts = 0,
            locked_until = NULL
        WHERE id = user_record.id;
        
        -- Insertar log de login exitoso
        INSERT INTO access_logs (username, action, success, details, session_id) 
        VALUES (user_record.username, 'successful_login', true, 
                json_build_object('role', user_record.role), session_token);
        
        -- Preparar resultado exitoso
        auth_result := json_build_object(
            'success', true,
            'user', json_build_object(
                'id', user_record.id,
                'username', user_record.username,
                'full_name', user_record.full_name,
                'email', user_record.email,
                'phone', user_record.phone,
                'role', user_record.role,
                'permissions', user_record.permissions,
                'last_login', user_record.last_login
            ),
            'session_token', session_token
        );
    ELSE
        -- Autenticación fallida - incrementar contador
        UPDATE admin_users 
        SET 
            failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE 
                WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
                ELSE locked_until 
            END
        WHERE id = user_record.id;
        
        -- Insertar log de intento fallido
        INSERT INTO access_logs (username, action, success, details) 
        VALUES (user_record.username, 'failed_login', false, 
                json_build_object('attempts', user_record.failed_login_attempts + 1));
        
        auth_result := json_build_object(
            'success', false,
            'error', 'Credenciales incorrectas'
        );
    END IF;
    
    RETURN auth_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== FUNCIÓN PARA REGISTRAR ACTIVIDAD ==========

CREATE OR REPLACE FUNCTION log_activity(
    p_username TEXT,
    p_action TEXT,
    p_success BOOLEAN DEFAULT true,
    p_details JSONB DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO access_logs (username, action, success, details, session_id, created_at)
    VALUES (p_username, p_action, p_success, p_details, p_session_id, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== FUNCIÓN PARA OBTENER ESTADÍSTICAS ==========

CREATE OR REPLACE FUNCTION get_appointment_stats()
RETURNS JSON AS $$
DECLARE
    stats_result JSON;
    total_citas INTEGER;
    citas_pendientes INTEGER;
    citas_confirmadas INTEGER;
    citas_hoy INTEGER;
    citas_semana INTEGER;
BEGIN
    -- Obtener estadísticas
    SELECT COUNT(*) INTO total_citas FROM citas_obispado;
    SELECT COUNT(*) INTO citas_pendientes FROM citas_obispado WHERE estado = 'pendiente';
    SELECT COUNT(*) INTO citas_confirmadas FROM citas_obispado WHERE estado = 'confirmada';
    SELECT COUNT(*) INTO citas_hoy FROM citas_obispado WHERE fecha = CURRENT_DATE;
    SELECT COUNT(*) INTO citas_semana FROM citas_obispado 
    WHERE fecha BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';
    
    -- Preparar resultado
    stats_result := json_build_object(
        'total_citas', total_citas,
        'citas_pendientes', citas_pendientes,
        'citas_confirmadas', citas_confirmadas,
        'citas_canceladas', total_citas - citas_pendientes - citas_confirmadas,
        'citas_hoy', citas_hoy,
        'citas_semana', citas_semana,
        'ultima_actualizacion', NOW()
    );
    
    RETURN stats_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== FUNCIÓN PARA CONFIGURAR USUARIO ACTUAL (RLS) ==========

CREATE OR REPLACE FUNCTION set_config(setting_name TEXT, new_value TEXT, is_local BOOLEAN DEFAULT false)
RETURNS TEXT AS $$
BEGIN
    PERFORM set_config(setting_name, new_value, is_local);
    RETURN new_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== CREAR USUARIOS ADMINISTRADORES POR DEFECTO ==========

-- Usuario Obispo Principal
INSERT INTO admin_users (username, password_hash, full_name, email, phone, role, permissions)
SELECT 
    'obispo',
    hash_password('ObispadoSeguro2024!'),
    'Su Excelencia el Obispo',
    'obispo@diocesis.org',
    '123-456-7890',
    'obispo',
    '["read_appointments", "write_appointments", "delete_appointments", "manage_users", "view_reports", "system_admin"]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM admin_users WHERE username = 'obispo'
);

-- Usuario Asistente
INSERT INTO admin_users (username, password_hash, full_name, email, phone, role, permissions)
SELECT 
    'asistente',
    hash_password('Asistente2024!'),
    'Asistente del Obispo',
    'asistente@diocesis.org',
    '123-456-7891',
    'asistente',
    '["read_appointments", "write_appointments", "view_reports"]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM admin_users WHERE username = 'asistente'
);

-- Usuario Secretario
INSERT INTO admin_users (username, password_hash, full_name, email, phone, role, permissions)
SELECT 
    'secretario',
    hash_password('Secretario2024!'),
    'Secretario del Obispado',
    'secretario@diocesis.org',
    '123-456-7892',
    'secretario',
    '["read_appointments", "write_appointments"]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM admin_users WHERE username = 'secretario'
);

-- ========== CONFIGURAR ROW LEVEL SECURITY (RLS) ==========

-- Habilitar RLS en todas las tablas
ALTER TABLE citas_obispado ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- ========== POLÍTICAS PARA CITAS_OBISPADO ==========

-- Los usuarios anónimos pueden crear citas
DROP POLICY IF EXISTS "anonymous_can_create_appointments" ON citas_obispado;
CREATE POLICY "anonymous_can_create_appointments" 
ON citas_obispado FOR INSERT 
TO anon 
WITH CHECK (true);

-- Los usuarios autenticados pueden ver todas las citas
DROP POLICY IF EXISTS "authenticated_can_view_all_appointments" ON citas_obispado;
CREATE POLICY "authenticated_can_view_all_appointments" 
ON citas_obispado FOR SELECT 
TO authenticated 
USING (true);

-- Los usuarios autenticados pueden actualizar citas
DROP POLICY IF EXISTS "authenticated_can_update_appointments" ON citas_obispado;
CREATE POLICY "authenticated_can_update_appointments" 
ON citas_obispado FOR UPDATE 
TO authenticated 
USING (true);

-- Solo obispo y admin pueden eliminar citas
DROP POLICY IF EXISTS "admin_can_delete_appointments" ON citas_obispado;
CREATE POLICY "admin_can_delete_appointments" 
ON citas_obispado FOR DELETE 
TO authenticated 
USING (
    current_setting('app.current_user', true) IN (
        SELECT username FROM admin_users 
        WHERE role IN ('obispo', 'admin') AND active = true
    )
);

-- ========== POLÍTICAS PARA ADMIN_USERS ==========

-- Solo usuarios autenticados pueden ver datos de usuarios
DROP POLICY IF EXISTS "authenticated_can_view_admin_users" ON admin_users;
CREATE POLICY "authenticated_can_view_admin_users" 
ON admin_users FOR SELECT 
TO authenticated 
USING (true);

-- Los usuarios pueden actualizar sus propios datos
DROP POLICY IF EXISTS "users_can_update_own_data" ON admin_users;
CREATE POLICY "users_can_update_own_data" 
ON admin_users FOR UPDATE 
TO authenticated 
USING (username = current_setting('app.current_user', true));

-- Solo el obispo puede crear nuevos usuarios
DROP POLICY IF EXISTS "obispo_can_create_users" ON admin_users;
CREATE POLICY "obispo_can_create_users" 
ON admin_users FOR INSERT 
TO authenticated 
WITH CHECK (
    current_setting('app.current_user', true) IN (
        SELECT username FROM admin_users 
        WHERE role = 'obispo' AND active = true
    )
);

-- ========== POLÍTICAS PARA ACCESS_LOGS ==========

-- Todos pueden insertar logs
DROP POLICY IF EXISTS "anyone_can_insert_logs" ON access_logs;
CREATE POLICY "anyone_can_insert_logs" 
ON access_logs FOR INSERT 
TO public 
WITH CHECK (true);

-- Solo usuarios autenticados pueden ver logs
DROP POLICY IF EXISTS "authenticated_can_view_logs" ON access_logs;
CREATE POLICY "authenticated_can_view_logs" 
ON access_logs FOR SELECT 
TO authenticated 
USING (true);

-- ========== CREAR VISTAS ÚTILES ==========

-- Vista de citas con información resumida
CREATE OR REPLACE VIEW vista_citas_resumen AS
SELECT 
    id,
    nombre,
    telefono,
    email,
    fecha,
    hora,
    motivo,
    estado,
    created_at,
    CASE 
        WHEN fecha = CURRENT_DATE THEN 'Hoy'
        WHEN fecha = CURRENT_DATE + 1 THEN 'Mañana'
        WHEN fecha BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 THEN 'Esta semana'
        ELSE 'Próximamente'
    END as periodo
FROM citas_obispado
ORDER BY fecha ASC, hora ASC;

-- Vista de estadísticas por día
CREATE OR REPLACE VIEW vista_estadisticas_diarias AS
SELECT 
    fecha,
    COUNT(*) as total_citas,
    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
    COUNT(CASE WHEN estado = 'confirmada' THEN 1 END) as confirmadas,
    COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas
FROM citas_obispado
GROUP BY fecha
ORDER BY fecha DESC;

-- ========== DATOS DE PRUEBA (OPCIONAL) ==========

-- Comentar o eliminar esta sección en producción
/*
INSERT INTO citas_obispado (nombre, telefono, email, fecha, hora, motivo, comentarios, estado)
VALUES 
    ('Juan Pérez', '123456789', 'juan@email.com', CURRENT_DATE + 1, '10:00', 'Consulta espiritual', 'Primera cita', 'pendiente'),
    ('María García', '987654321', 'maria@email.com', CURRENT_DATE + 2, '15:30', 'Bendición matrimonial', 'Preparativos boda', 'confirmada'),
    ('Carlos López', '456789123', 'carlos@email.com', CURRENT_DATE + 3, '09:00', 'Confirmación', 'Documentos listos', 'pendiente');
*/

-- ========== VERIFICAR INSTALACIÓN ==========

-- Verificar que todas las tablas se crearon correctamente
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Contar tablas
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('citas_obispado', 'admin_users', 'access_logs');
    
    -- Contar funciones
    SELECT COUNT(*) INTO function_count
    FROM pg_proc 
    WHERE proname IN ('authenticate_user', 'hash_password', 'verify_password', 'get_appointment_stats');
    
    -- Contar políticas RLS
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Mostrar resultados
    RAISE NOTICE '========================================';
    RAISE NOTICE 'INSTALACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tablas creadas: % de 3', table_count;
    RAISE NOTICE 'Funciones creadas: % de 4+', function_count;
    RAISE NOTICE 'Políticas RLS: %', policy_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CREDENCIALES POR DEFECTO:';
    RAISE NOTICE 'Obispo: obispo / ObispadoSeguro2024!';
    RAISE NOTICE 'Asistente: asistente / Asistente2024!';
    RAISE NOTICE 'Secretario: secretario / Secretario2024!';
    RAISE NOTICE '========================================';
END $$;