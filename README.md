# 📅 Sistema de Gestión de Citas para el Obispado

Un sistema web profesional y seguro para gestionar las citas pastorales del obispado, desarrollado con tecnologías modernas y enfoque en la seguridad.

## 🌟 Características Principales

### 🎯 Para los miembros
- **Formulario intuitivo** para solicitar audiencias con el obispo
- **Validación en tiempo real** de datos
- **Diseño responsivo** optimizado para móviles
- **Tema religioso** con iconografía apropiada
- **Validación española** de números de teléfono

### 🔐 Para Administradores
- **Panel de control seguro** con autenticación robusta
- **Dashboard con estadísticas** de citas
- **Gestión completa** de citas (ver, modificar, eliminar)
- **Sistema de roles** y permisos granulares
- **Logs de actividad** y auditoría
- **Sesiones seguras** con expiración automática

### 🛡️ Seguridad Implementada
- **Autenticación con hash** de contraseñas + salt
- **Row Level Security** en base de datos
- **Bloqueo automático** después de intentos fallidos
- **Logs de acceso** completos
- **Sesiones con expiración** (24 horas)
- **Validación de entrada** en todos los formularios

## 🚀 Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Supabase (PostgreSQL + API REST)
- **Base de Datos**: PostgreSQL con RLS
- **Autenticación**: Sistema custom con hash SHA-256
- **Diseño**: CSS Grid/Flexbox, responsive design
- **Control de Versiones**: Git + GitHub

## 📁 Estructura del Proyecto

```
aplicacion-agenda-obispo/
├── index.html              # Formulario público de citas
├── admin.html              # Panel de administración
├── script.js               # Lógica del formulario principal
├── admin.js                # Lógica del panel administrativo  
├── styles.css              # Estilos CSS responsivos
├── supabase-config.js      # Configuración de Supabase
├── supabase-functions.js   # Funciones de base de datos
├── package.json            # Dependencias del proyecto
├── CONFIGURACION_SUPABASE.md  # Guía de setup de DB
├── CREDENCIALES_ADMIN.md      # Info de acceso admin
├── INSTRUCCIONES_FINALES.md   # Guía de configuración final
└── README.md               # Este archivo
```

## ⚡ Instalación Rápida

### 1. Clonar el Repositorio
```bash
git clone https://github.com/ANAHANMEZA/citasobispado.git
cd citasobispado
```

### 2. Configurar Supabase
1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Ejecuta el SQL del archivo `CONFIGURACION_SUPABASE.md`
4. Actualiza `supabase-config.js` con tus credenciales

### 3. Ejecutar la Aplicación
Simplemente abre `index.html` en tu navegador web.

## 🔑 Credenciales por Defecto

### Usuario Principal (Obispo)
- **Usuario**: `obispo`
- **Contraseña**: `ObispadoSeguro2024!`
- **Permisos**: Completos

### Usuario Asistente
- **Usuario**: `asistente`
- **Contraseña**: `Asistente2024!`
- **Permisos**: Gestión básica de citas

> ⚠️ **IMPORTANTE**: Cambia estas contraseñas después de la primera configuración.

## 📚 Documentación

- 📖 **[Configuración de Supabase](CONFIGURACION_SUPABASE.md)** - Setup completo de la base de datos
- 🔐 **[Credenciales Admin](CREDENCIALES_ADMIN.md)** - Información de acceso
- 🎯 **[Instrucciones Finales](INSTRUCCIONES_FINALES.md)** - Guía paso a paso
- 💻 **[Contribuir](CONTRIBUTING.md)** - Cómo colaborar con el proyecto

## 🌐 Demo en Vivo

Una vez configurado Supabase, puedes ver la aplicación en funcionamiento:

- **Formulario de Citas**: Abre `index.html`
- **Panel Administrativo**: Abre `admin.html`

## 🎨 Personalización

### Cambiar Colores del Tema
Edita las variables CSS en `styles.css`:

```css
:root {
    --color-primario: #8B4513;    /* Marrón del obispado */
    --color-secundario: #D4AF37;  /* Dorado litúrgico */
    --color-fondo: #F5F5DC;       /* Beige suave */
}
```

### Modificar Textos
Todos los textos están en los archivos HTML y pueden editarse fácilmente.

## 🚀 Despliegue

### GitHub Pages (Gratis)
1. Ve a Settings → Pages
2. Selecciona source: Deploy from branch → main
3. Tu sitio estará en: `https://usuario.github.io/citasobispado/`

### Netlify (Gratis)
1. Conecta tu repositorio en [netlify.com](https://netlify.com)
2. Deploy automático

### Vercel (Gratis)
1. Importa el proyecto en [vercel.com](https://vercel.com)
2. Deploy automático

## 🔧 API de Supabase

El sistema utiliza estas funciones de Supabase:

### Autenticación
```javascript
// Autenticar usuario
const result = await supabaseClient.rpc('authenticate_user', {
    input_username: username,
    input_password: password
});
```

### Gestión de Citas
```javascript
// Crear cita
await supabaseClient.from('citas_obispado').insert([citaData]);

// Obtener citas
const { data } = await supabaseClient
    .from('citas_obispado')
    .select('*')
    .order('fecha', { ascending: true });
```

## 📊 Estadísticas y Logs

El sistema registra automáticamente:
- Intentos de login (exitosos y fallidos)
- Creación y modificación de citas
- Acciones administrativas
- Tiempos de sesión

## 🐛 Solución de Problemas

### Error de conexión a Supabase
1. Verifica las credenciales en `supabase-config.js`
2. Comprueba que el proyecto Supabase esté activo
3. Revisa la consola del navegador para errores

### Login no funciona
1. Ejecuta el SQL de configuración en Supabase
2. Verifica que la tabla `admin_users` exista
3. Confirma que las funciones SQL estén creadas

### Citas no se guardan
1. Verifica la tabla `citas_obispado` en Supabase
2. Comprueba las políticas RLS
3. Revisa la configuración de la API

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu función (`git checkout -b feature/nueva-funcion`)
3. Commit tus cambios (`git commit -m 'Agregar nueva función'`)
4. Push a la rama (`git push origin feature/nueva-funcion`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Supabase** - Por proporcionar una plataforma de base de datos excelente
- **GitHub** - Por el hosting de código y páginas
- **La comunidad de desarrolladores** - Por las herramientas y librerías utilizadas

---

## 📞 Soporte

Para soporte técnico o preguntas:

1. 📖 Revisa la documentación en los archivos MD
2. 🔍 Busca en los issues del repositorio
3. 💬 Crea un nuevo issue si no encuentras solución

---

**Desarrollado con ❤️ para servir a la comunidad SUD**

*¡Que Dios bendiga este proyecto!* 🙏✨
