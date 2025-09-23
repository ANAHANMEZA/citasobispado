# 🔐 CREDENCIALES LOCALES - NO SUBIR A GITHUB

## ⚠️ Para que el sistema funcione localmente:

### 📧 Configurar email-config.js líneas 6-9:
```javascript
const EMAILJS_CONFIG = {
    publicKey: 'R_Ntb2sYOaIUVPl95',     // Tu Public Key real
    serviceId: 'service_fsk6815',        // Tu Service ID real  
    templateId: 'template_confirmacion', // Mantener igual
    // resto igual...
};
```

## 🎯 Pasos para trabajar:

### 1. Para USAR el sistema:
- Reemplaza las credenciales en `email-config.js` con las de arriba
- El sistema funcionará perfectamente

### 2. Para SUBIR cambios a GitHub:
- Reemplaza temporalmente con placeholders:
  - `publicKey: 'YOUR_PUBLIC_KEY'`
  - `serviceId: 'YOUR_SERVICE_ID'`
- Haz commit y push
- Vuelve a poner las credenciales reales

## ✅ Estado actual:
- Sistema funcionando ✅
- GitHub limpio y seguro ✅ 
- 200 emails gratis/mes ✅
- Confirmaciones automáticas ✅

**NUNCA subir este archivo a GitHub**