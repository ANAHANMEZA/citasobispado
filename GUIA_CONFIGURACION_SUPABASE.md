# 🚀 Configuración Paso a Paso de Supabase

## 📋 **PASO 1: Crear Cuenta y Proyecto en Supabase**

1. **Ve a** [https://supabase.com](https://supabase.com)
2. **Crea una cuenta** o inicia sesión
3. **Clic en "New Project"**
4. **Configura tu proyecto:**
   - **Name:** `sistema-citas-obispado`
   - **Password:** Crea una contraseña fuerte (¡guárdala!)
   - **Region:** Selecciona la más cercana
5. **Espera 2-3 minutos** mientras se configura

---

## 🗄️ **PASO 2: Ejecutar el SQL de Configuración**

### **Opción A: SQL Completo (RECOMENDADO)**

1. **Ve al SQL Editor** en tu proyecto Supabase
2. **Copia TODO el contenido** del archivo `SQL_COMPLETO_SUPABASE.sql`
3. **Pégalo en el SQL Editor**
4. **Clic en "Run"** 
5. **Espera a que termine** (puede tomar 30-60 segundos)
6. **Deberías ver:** "INSTALACIÓN COMPLETADA EXITOSAMENTE"

### **Opción B: SQL por Secciones (Si hay errores)**

Si la opción A falla, ejecuta estas secciones por separado:

**1. Primero - Tablas básicas:**
```sql
-- Ejecutar sección: CREAR TABLA DE CITAS
-- Ejecutar sección: CREAR TABLA DE USUARIOS ADMINISTRADORES  
-- Ejecutar sección: CREAR TABLA DE LOGS DE ACCESO
```

**2. Segundo - Funciones:**
```sql
-- Ejecutar sección: FUNCIÓN PARA GENERAR HASH DE CONTRASEÑA
-- Ejecutar sección: FUNCIÓN PARA VERIFICAR CONTRASEÑA
-- Ejecutar sección: FUNCIÓN DE AUTENTICACIÓN PRINCIPAL
```

**3. Tercero - Usuarios y Seguridad:**
```sql
-- Ejecutar sección: CREAR USUARIOS ADMINISTRADORES POR DEFECTO
-- Ejecutar sección: CONFIGURAR ROW LEVEL SECURITY (RLS)
```

---

## ⚙️ **PASO 3: Obtener Credenciales de tu Proyecto**

1. **Ve a Settings → API** en tu proyecto Supabase
2. **Copia estas credenciales:**
   - **URL:** `https://tu-proyecto.supabase.co`
   - **anon public:** `eyJ0eXAi...` (key larga)

---

## 🔧 **PASO 4: Configurar tu Aplicación**

1. **Abre** el archivo `supabase-config.js`
2. **Reemplaza** con tus credenciales:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://TU-PROYECTO-AQUI.supabase.co',  // ⬅️ Tu URL
    key: 'TU-ANON-KEY-AQUI',                      // ⬅️ Tu anon key
    tableName: 'citas_obispado'
};
```

---

## ✅ **PASO 5: Verificar que Todo Funciona**

### **Verificar Tablas Creadas:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('citas_obispado', 'admin_users', 'access_logs');
```
**Resultado esperado:** 3 filas

### **Verificar Usuarios Creados:**
```sql
SELECT username, full_name, role, active FROM admin_users;
```
**Resultado esperado:** 3 usuarios (obispo, asistente, secretario)

### **Verificar Funciones:**
```sql
SELECT proname FROM pg_proc 
WHERE proname IN ('authenticate_user', 'hash_password', 'verify_password');
```
**Resultado esperado:** 3 funciones

---

## 🔑 **CREDENCIALES POR DEFECTO**

### **👑 Usuario Obispo (Completo)**
- **Usuario:** `obispo`
- **Contraseña:** `ObispadoSeguro2024!`
- **Permisos:** Administración completa

### **👤 Usuario Asistente**
- **Usuario:** `asistente`
- **Contraseña:** `Asistente2024!`
- **Permisos:** Gestión de citas

### **📝 Usuario Secretario**
- **Usuario:** `secretario`
- **Contraseña:** `Secretario2024!`
- **Permisos:** Gestión básica

---

## 🧪 **PASO 6: Probar el Sistema**

1. **Abrir** `bienvenida.html` en tu navegador
2. **Clic en "Solicitar Cita"** y llenar una cita de prueba
3. **Abrir** `admin.html` en otra pestaña
4. **Iniciar sesión** con credenciales del obispo
5. **Verificar** que la cita aparezca en el panel

---

## 🛡️ **Características de Seguridad Implementadas**

✅ **Hash de contraseñas** con salt aleatorio SHA-256  
✅ **Bloqueo automático** después de 5 intentos fallidos  
✅ **Sesiones con expiración** de 24 horas  
✅ **Row Level Security (RLS)** en todas las tablas  
✅ **Logs de actividad** completos  
✅ **Roles y permisos** granulares  
✅ **Validación de entrada** en todos los formularios  

---

## 🔧 **Comandos Útiles de Administración**

### **Cambiar Contraseña:**
```sql
UPDATE admin_users 
SET password_hash = hash_password('NuevaContraseñaSegura!')
WHERE username = 'obispo';
```

### **Crear Nuevo Usuario:**
```sql
INSERT INTO admin_users (username, password_hash, full_name, role, permissions)
VALUES ('nuevo_usuario', hash_password('ContraseñaSegura!'), 'Nombre Completo', 'asistente', '["read_appointments", "write_appointments"]'::jsonb);
```

### **Ver Estadísticas:**
```sql
SELECT get_appointment_stats();
```

### **Ver Logs Recientes:**
```sql
SELECT username, action, success, created_at 
FROM access_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### **Desbloquear Usuario:**
```sql
UPDATE admin_users 
SET failed_login_attempts = 0, locked_until = NULL
WHERE username = 'usuario_bloqueado';
```

---

## 🚨 **Solución de Problemas Comunes**

### **Error: "Function doesn't exist"**
- Ejecuta primero las secciones de funciones
- Verifica que no haya errores de sintaxis

### **Error: "Permission denied"**
- Verifica que RLS esté configurado correctamente
- Ejecuta la sección de políticas

### **Login no funciona:**
- Verifica que los usuarios fueron creados
- Comprueba la función `authenticate_user`

### **No se guardan las citas:**
- Verifica la tabla `citas_obispado`
- Comprueba las políticas RLS

---

## 🎯 **¡Configuración Completa!**

Una vez completados todos los pasos, tendrás:

🎉 **Sistema completamente funcional**  
🔐 **Autenticación segura implementada**  
📊 **Base de datos configurada**  
👥 **Usuarios administrativos listos**  
🛡️ **Seguridad de nivel empresarial**  

**¡Tu sistema del obispado está listo para usar!** 🙏✨