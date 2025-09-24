# 🔐 Credenciales de Acceso al Panel de Administración

## Acceso al Panel del Obispado

Para acceder al panel de administración (`admin.html`), utiliza las siguientes credenciales:

### 👤 **Credenciales de Acceso**
- **Usuario**: `obispo`
- **Contraseña**: `ObispadoSeguro2024!`

## 🛡️ Características de Seguridad

### ✅ **Protección Implementada**
- **Pantalla de login obligatoria** antes del acceso
- **Verificación de credenciales** en cada intento
- **Sesión con expiración automática** (24 horas)
- **Cierre de sesión manual** disponible
- **Verificación continua** durante el uso
- **Protección contra acceso directo** a funciones administrativas

### 🔒 **Funcionalidades Protegidas**
- Ver todas las citas
- Cambiar estado de citas (confirmar/cancelar)
- Estadísticas del sistema
- Filtros y búsquedas
- Contacto con hermanos

### ⏰ **Gestión de Sesiones**
- **Duración**: 24 horas máximo
- **Extensión automática**: Con cada acción realizada
- **Cierre automático**: Al expirar el tiempo
- **Cierre manual**: Botón "Cerrar Sesión"

## 📱 **Cómo Usar el Sistema**

### 1. **Acceso Inicial**
1. Abrir `admin.html` en el navegador
2. Ver pantalla de login con icono de iglesia
3. Ingresar usuario y contraseña
4. Hacer clic en "🔐 Iniciar Sesión"

### 2. **Uso del Panel**
- **Dashboard**: Estadísticas automáticas al entrar
- **Filtros**: Por fecha, estado o nombre
- **Acciones**: Confirmar, cancelar, contactar
- **Info de sesión**: Usuario visible en la esquina superior

### 3. **Cerrar Sesión**
- Hacer clic en "🚪 Cerrar Sesión"
- Confirmar en el diálogo
- Regresa automáticamente al login

## 🔄 **Cambiar Credenciales (Para Desarrolladores)**

Si necesitas cambiar las credenciales, edita el archivo `supabase-functions.js`:

```javascript
// Línea ~180 aproximadamente
const credenciales = {
    usuario: 'tu_nuevo_usuario',
    password: 'TuNuevaContraseñaSegura!'
};
```

## 🚨 **Recomendaciones de Seguridad**

### Para Producción Real:
1. **Usar base de datos** para credenciales (no hardcodeadas)
2. **Hash de contraseñas** con bcrypt o similar
3. **JWT tokens** en lugar de localStorage simple
4. **HTTPS obligatorio** en el servidor
5. **Límite de intentos** de login fallidos
6. **Auditoría de accesos** con logs

### Para Uso Actual:
1. **Cambiar contraseña** regularmente
2. **No compartir credenciales** por mensajes
3. **Cerrar sesión** al terminar
4. **Usar en dispositivos seguros** únicamente

## ❓ **Resolución de Problemas**

### Error: "Credenciales incorrectas"
- Verificar usuario: `obispo` (sin mayúsculas)
- Verificar contraseña: `ObispadoSeguro2024!` (respeta mayúsculas)
- No incluir espacios antes o después

### Error: "Sesión expirada"
- La sesión duró más de 24 horas
- Volver a hacer login normalmente

### Error: "No se pueden cargar las citas"
- Verificar conexión a internet
- Comprobar configuración de Supabase
- Revisar consola del navegador (F12)

---

**📞 Contacto Técnico**: Revisa los logs del navegador (F12 > Console) para más detalles de cualquier error.