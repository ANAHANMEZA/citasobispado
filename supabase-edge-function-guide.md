# 📧 Guía: Configurar Edge Function para Emails en Supabase

## 🎯 Pasos para configurar envío real de emails:

### 1. **Instalar Supabase CLI**
```bash
npm install supabase --save-dev
```

### 2. **Inicializar proyecto Supabase**
```bash
supabase init
```

### 3. **Crear Edge Function**
```bash
supabase functions new send-email
```

### 4. **Código para la función (supabase/functions/send-email/index.ts)**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { to, subject, html } = await req.json()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'obispado@tudominio.com',
      to: [to],
      subject: subject,
      html: html,
    }),
  })

  const data = await res.json()
  
  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})
```

### 5. **Deploy de la función**
```bash
supabase functions deploy send-email --project-ref YOUR_PROJECT_REF
```

### 6. **Configurar variables de entorno**
En Supabase Dashboard > Settings > Edge Functions:
- `RESEND_API_KEY`: Tu API key de Resend.com

---

## 🎯 **Opción más Simple: Usar servicio externo**

### **Opción 2: EmailJS (Más fácil)**
1. Crear cuenta en EmailJS.com
2. Configurar plantilla de email
3. Usar su SDK directamente desde JavaScript

### **Opción 3: Resend.com (Directo)**
1. Crear cuenta en Resend.com
2. Obtener API Key
3. Hacer fetch directo desde el frontend

---

## 🤔 **¿Cuál prefieres?**

**Para simplicidad inmediata**: EmailJS
**Para control total**: Edge Function con Resend
**Para integración nativa**: Edge Function con Supabase Auth

¿Qué opción te parece mejor para tu caso?