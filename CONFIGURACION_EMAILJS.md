# 🎯 CONFIGURACIÓN EmailJS - Sistema de Confirmación por Email

## ✅ Código ya implementado - Solo falta configurar EmailJS

### 📋 Pasos para activar emails REALES:

## 1. **Crear cuenta EmailJS**
   - Ve a: https://www.emailjs.com/
   - Regístrate gratis (200 emails/mes gratis)

## 2. **Configurar servicio de email**
   - Dashboard → Email Services → "Add Email Service"
   - Selecciona **Gmail** (más fácil)
   - Autoriza tu cuenta Gmail
   - Anota el **Service ID** (ej: service_gmail123)

## 3. **Crear plantilla de email**
   - Dashboard → Email Templates → "Create New Template"
   - **Template ID**: `template_confirmacion`
   - **Asunto**: `✅ CITA CONFIRMADA - {{fecha}}`
   - **Contenido**:
   ```
   Hola {{nombre}},
   
   Su cita ha sido confirmada:
   📅 Fecha: {{fecha}}
   ⏰ Hora: {{hora}}  
   📍 Lugar: {{lugar}}
   📝 Motivo: {{motivo}}
   
   {{recordatorio}}
   
   Gracias por su confianza.
   {{from_name}}
   {{fecha_actual}}
   ```

## 4. **Obtener credenciales**
   - Dashboard → Account → General
   - Copia tu **Public Key** (ej: user_abc123def456)

## 5. **Configurar en tu código**
   Edita `email-config.js` líneas 6-9:
   ```javascript
   const EMAILJS_CONFIG = {
       publicKey: 'user_abc123def456',        // Tu Public Key
       serviceId: 'service_gmail123',         // Tu Service ID  
       templateId: 'template_confirmacion',   // Debe coincidir exactamente
       
       fromName: 'Obispado SUD',
       fromEmail: 'tuemailreal@gmail.com'     // Tu Gmail autorizado
   };
   ```

## 6. **¡Listo para probar!**
   - Abre `admin.html`
   - Confirma una cita que tenga email válido
   - ¡El email llegará realmente!

---

## 🔧 **Estado actual del sistema:**
✅ EmailJS SDK incluido
✅ Funciones implementadas  
✅ Plantilla preparada
⏳ **Solo faltan TUS credenciales**

## 🎁 **Una vez configurado tendrás:**
- ✅ Emails automáticos reales
- ✅ 200 emails gratis/mes
- ✅ Plantilla profesional
- ✅ Sin limitaciones de trial
- ✅ Compatible con Gmail/Outlook/Yahoo

**¡Configura EmailJS y tendrás emails funcionando en 5 minutos!** 📧✨