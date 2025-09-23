# 🚀 Guía de Configuración de Supabase

Esta guía te ayudará a configurar Supabase para que tu aplicación de citas funcione con una base de datos real.

## 📋 Paso 1: Crear cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project" 
3. Regístrate con tu email o GitHub
4. Verifica tu email si es necesario

## 🏗️ Paso 2: Crear un nuevo proyecto

1. Una vez en el dashboard, haz clic en "New Project"
2. Selecciona una organización (puedes usar la personal)
3. Llena los campos:
   - **Name**: `sistema-citas-profesional`
   - **Database Password**: Crea una contraseña segura (¡guárdala!)
   - **Region**: Selecciona la más cercana a tu ubicación
4. Haz clic en "Create new project"
5. Espera 2-3 minutos mientras se configura

## 🗄️ Paso 3: Crear la tabla de citas

1. En el dashboard de tu proyecto, ve a la pestaña **"SQL Editor"**
2. Copia y pega este código SQL:

```sql
-- Crear tabla de citas
CREATE TABLE citas (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo TEXT NOT NULL,
    comentarios TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX idx_citas_fecha ON citas(fecha);
CREATE INDEX idx_citas_estado ON citas(estado);
CREATE INDEX idx_citas_email ON citas(email);

-- Habilitar Row Level Security (RLS)
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- Política para permitir insertar citas (cualquiera puede agendar)
CREATE POLICY "Permitir insertar citas" ON citas
    FOR INSERT WITH CHECK (true);

-- Política para leer citas (cualquiera puede ver, en producción podrías restringir esto)
CREATE POLICY "Permitir leer citas" ON citas
    FOR SELECT USING (true);

-- Política para actualizar citas (cualquiera puede actualizar, en producción podrías restringir esto)
CREATE POLICY "Permitir actualizar citas" ON citas
    FOR UPDATE USING (true);

-- Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_citas_updated_at 
    BEFORE UPDATE ON citas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========== TABLA DE ADMINISTRADORES DEL OBISPADO ==========

-- Crear tabla de usuarios administradores
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    nombre_completo TEXT NOT NULL,
    rol TEXT DEFAULT 'admin' CHECK (rol IN ('admin', 'obispo', 'secretario')),
    activo BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar usuario del obispo (contraseña: ObispadoSeguro2024!)
-- NOTA: En producción, usar bcrypt para hash de contraseña
INSERT INTO admin_users (username, password_hash, email, nombre_completo, rol) 
VALUES (
    'obispo',
    'ObispadoSeguro2024!', -- En producción usar: '$2b$10$hash_real_aqui'
    'obispo@diocesis.org',
    'Su Excelencia Reverendísima',
    'obispo'
);

-- Crear índices para la tabla de administradores
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_activo ON admin_users(activo);

-- Habilitar RLS en tabla de administradores
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Política para administradores (solo pueden ver su propio perfil)
CREATE POLICY "Admin solo ve su perfil" ON admin_users
    FOR SELECT USING (username = current_setting('app.current_user', true));

-- ========== ACTUALIZACION DE POLITICAS DE CITAS ==========

-- Remover políticas anteriores
DROP POLICY IF EXISTS "Permitir leer citas" ON citas;
DROP POLICY IF EXISTS "Permitir actualizar citas" ON citas;

-- Nueva política más restrictiva para lectura (solo admins autenticados)
CREATE POLICY "Solo admin puede leer citas" ON citas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE username = current_setting('app.current_user', true)
            AND activo = true
        )
    );

-- Nueva política para actualización (solo admins autenticados)
CREATE POLICY "Solo admin puede actualizar citas" ON citas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE username = current_setting('app.current_user', true)
            AND activo = true
        )
    );

-- Política para eliminar citas (solo obispo)
CREATE POLICY "Solo obispo puede eliminar citas" ON citas
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE username = current_setting('app.current_user', true)
            AND rol = 'obispo'
            AND activo = true
        )
    );

-- ========== TABLA DE LOGS DE ACCESO ==========

-- Crear tabla para auditoría de accesos
CREATE TABLE access_logs (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para logs
CREATE INDEX idx_access_logs_username ON access_logs(username);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at);
CREATE INDEX idx_access_logs_success ON access_logs(success);

-- RLS para logs (solo el propio usuario y el obispo pueden ver)
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver logs propios o ser obispo" ON access_logs
    FOR SELECT USING (
        username = current_setting('app.current_user', true) OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE username = current_setting('app.current_user', true)
            AND rol = 'obispo'
        )
    );

-- ========== FUNCIONES DE AUTENTICACION ==========

-- Función para autenticar usuario
CREATE OR REPLACE FUNCTION authenticate_user(input_username TEXT, input_password TEXT)
RETURNS JSONB AS $$
DECLARE
    user_record admin_users%ROWTYPE;
    result JSONB;
BEGIN
    -- Buscar usuario activo
    SELECT * INTO user_record 
    FROM admin_users 
    WHERE username = input_username 
    AND activo = true;
    
    -- Verificar si existe el usuario
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Usuario no encontrado');
    END IF;
    
    -- Verificar contraseña (en producción usar crypt/bcrypt)
    IF user_record.password_hash = input_password THEN
        -- Actualizar último login
        UPDATE admin_users 
        SET ultimo_login = NOW(), updated_at = NOW()
        WHERE id = user_record.id;
        
        -- Registrar acceso exitoso
        INSERT INTO access_logs (username, action, success)
        VALUES (input_username, 'login', true);
        
        -- Establecer usuario actual para las políticas RLS
        PERFORM set_config('app.current_user', input_username, false);
        
        RETURN jsonb_build_object(
            'success', true,
            'user', jsonb_build_object(
                'username', user_record.username,
                'nombre_completo', user_record.nombre_completo,
                'rol', user_record.rol,
                'email', user_record.email
            )
        );
    ELSE
        -- Registrar intento fallido
        INSERT INTO access_logs (username, action, success, details)
        VALUES (input_username, 'failed_login', false, 
                jsonb_build_object('reason', 'invalid_password'));
        
        RETURN jsonb_build_object('success', false, 'error', 'Contraseña incorrecta');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== TRIGGER PARA UPDATED_AT EN ADMIN_USERS ==========

CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

3. Haz clic en "Run" para ejecutar el código
4. Deberías ver el mensaje "Success. No rows returned"

## 🔑 Paso 4: Obtener las credenciales de la API

1. Ve a la pestaña **"Settings"** > **"API"**
2. Encontrarás dos valores importantes:
   - **Project URL**: algo como `https://abcdefgh.supabase.co`
   - **anon public key**: una clave larga que empieza con `eyJhbGciOi...`

## ⚙️ Paso 5: Configurar la aplicación

1. Abre el archivo `supabase-config.js` en tu proyecto
2. Reemplaza los valores de ejemplo:

```javascript
const SUPABASE_CONFIG = {
    // Reemplaza con tu Project URL
    url: 'https://tu-proyecto-id.supabase.co',
    
    // Reemplaza con tu anon public key
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    
    // Este nombre de tabla coincide con lo que creamos
    tableName: 'citas'
};
```

## 🧪 Paso 6: Probar la aplicación

1. Abre `index.html` en tu navegador
2. Completa el formulario de citas
3. Haz clic en "Agendar Cita"
4. Si todo está configurado correctamente, deberías ver:
   - Mensaje de confirmación con ID de cita
   - Los datos guardados en Supabase

## 👨‍💼 Paso 7: Usar el panel de administración

1. Abre `admin.html` en tu navegador
2. Verás todas las citas guardadas
3. Puedes:
   - Filtrar por fecha, estado o nombre
   - Confirmar o cancelar citas
   - Contactar pacientes por teléfono o email

## 🔒 Seguridad en Producción

Para un entorno de producción, considera:

### Autenticación del administrador
```sql
-- Crear tabla de usuarios admin (solo ejecutar si necesitas autenticación)
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Política más restrictiva para lectura (solo admins autenticados)
DROP POLICY "Permitir leer citas" ON citas;
CREATE POLICY "Solo admin puede leer citas" ON citas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE email = auth.jwt() ->> 'email'
        )
    );
```

### Variables de entorno
En lugar de poner las credenciales directamente en el código:

```javascript
// En supabase-config.js
const SUPABASE_CONFIG = {
    url: process.env.SUPABASE_URL || 'https://tu-proyecto.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'tu-key-aqui',
    tableName: 'citas'
};
```

## 🎯 Características adicionales que puedes agregar

1. **Notificaciones por email**: Usar Supabase Edge Functions
2. **Notificaciones por email**: Integrar con EmailJS
3. **Calendario sincronizado**: Conectar con Google Calendar
4. **Pagos**: Integrar Stripe para citas de pago
5. **Reportes**: Generar estadísticas avanzadas

## 🚨 Solución de problemas comunes

### Error: "Invalid API key"
- Verifica que copiaste correctamente la `anon key`
- Asegúrate de que no hay espacios extra

### Error: "Table doesn't exist"
- Ejecuta de nuevo el SQL para crear la tabla
- Verifica que el nombre de la tabla en `SUPABASE_CONFIG` coincida

### Error: "Row Level Security violation"
- Las políticas están muy restrictivas
- Temporalmente puedes deshabilitar RLS: `ALTER TABLE citas DISABLE ROW LEVEL SECURITY;`

### Las citas no aparecen en el admin
- Verifica que las credenciales sean las mismas en ambos archivos
- Abre la consola del navegador para ver errores

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12) para errores
2. Verifica que Supabase esté funcionando en su página de estado
3. Consulta la documentación oficial: [https://supabase.com/docs](https://supabase.com/docs)

¡Tu sistema de citas con Supabase está listo! 🎉