# 📧 Opción FÁCIL: EmailJS para envío de emails

## 🚀 Setup rápido con EmailJS (5 minutos)

### 1. Crear cuenta
- Ve a: https://www.emailjs.com/
- Regístrate gratis (hasta 200 emails/mes)

### 2. Configurar servicio de email
- Dashboard > Email Services > Add Email Service
- Selecciona tu proveedor (Gmail, Outlook, etc.)
- Sigue las instrucciones de configuración

### 3. Crear plantilla de email
- Dashboard > Email Templates > Create New Template
- Template ID: `confirmacion_cita`
- Content:
```
Asunto: ✅ CITA CONFIRMADA - {{fecha}}

Cuerpo HTML:
Hola {{nombre}},

Su cita ha sido confirmada:
📅 Fecha: {{fecha}}
⏰ Hora: {{hora}}
📍 Lugar: Obispado

Gracias por su confianza.
```

### 4. Obtener credenciales
- Public Key: Dashboard > Account > General
- Service ID: Dashboard > Email Services (tu servicio)
- Template ID: confirmacion_cita

### 5. Implementar en el código
Solo necesitas incluir EmailJS en admin.html y actualizar email-config.js

¿Quieres que implemente la solución EmailJS? Es la más rápida y simple.