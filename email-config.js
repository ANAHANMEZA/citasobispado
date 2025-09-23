// 📧 Sistema de Notificaciones por Email - Confirmación de Citas
// Usando EmailJS para envío real de emails

// 🔑 Configuración de EmailJS
const EMAILJS_CONFIG = {
    // ⚠️ CONFIGURA TUS CREDENCIALES REALES AQUÍ
    publicKey: 'YOUR_PUBLIC_KEY',        // ⚠️ Tu Public Key de EmailJS
    serviceId: 'YOUR_SERVICE_ID',        // ⚠️ Tu Service ID de EmailJS  
    templateId: 'template_confirmacion', // ID de la plantilla creada
    
    // Configuración del remitente (se configura en EmailJS)
    fromName: 'Obispado SUD',
    fromEmail: 'obispado@tudominio.com'  // Debe coincidir con tu servicio
};

// 📩 Función principal para enviar email de confirmación
async function enviarEmailConfirmacion(email, datosCita) {
    try {
        console.log('📧 Iniciando envío de email de confirmación...');
        console.log('  - Para:', email);
        console.log('  - Datos de cita:', datosCita);
        
        // Validar datos de entrada
        if (!email || !datosCita) {
            throw new Error('Email o datos de cita no proporcionados.');
        }
        
        // Validar formato de email
        if (!validarEmail(email)) {
            throw new Error('El formato del email no es válido: ' + email);
        }
        
        // Generar el contenido del email
        const asunto = `✅ CITA CONFIRMADA - ${datosCita.fecha}`;
        const contenidoHTML = generarPlantillaEmail(datosCita);
        
        console.log('📝 Email generado:');
        console.log('  - Asunto:', asunto);
        console.log('  - Longitud HTML:', contenidoHTML.length);
        
        // Enviar usando EmailJS
        const resultado = await enviarConEmailJS(email, asunto, datosCita);
        
        if (resultado.success) {
            console.log('✅ Email enviado exitosamente');
            return {
                success: true,
                message: 'Email de confirmación enviado correctamente',
                email: email,
                fecha: new Date().toISOString()
            };
        } else {
            throw new Error(resultado.error);
        }
        
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        return {
            success: false,
            error: error.message,
            email: email,
            fecha: new Date().toISOString()
        };
    }
}

// 📨 Función para enviar email usando EmailJS
async function enviarConEmailJS(email, asunto, datosCita) {
    try {
        // Inicializar EmailJS con la public key
        emailjs.init(EMAILJS_CONFIG.publicKey);
        
        console.log('🔄 Enviando email con EmailJS...');
        console.log('  - Destinatario:', email);
        console.log('  - Asunto:', asunto);
        
        // Preparar parámetros para la plantilla de EmailJS
        const templateParams = {
            to_email: email,
            to_name: datosCita.nombre,
            subject: asunto,
            
            // Datos de la cita
            nombre: datosCita.nombre,
            fecha: formatearFecha(datosCita.fecha),
            hora: formatearHora(datosCita.hora),
            motivo: datosCita.motivo || 'Consulta pastoral',
            
            // Información adicional
            lugar: 'Oficina del Obispo - Capilla Local',
            recordatorio: 'Llegue 10 minutos antes de la hora programada',
            fecha_actual: new Date().toLocaleDateString('es-ES'),
            
            // Datos del remitente
            from_name: EMAILJS_CONFIG.fromName
        };
        
        console.log('📋 Parámetros enviados:', templateParams);
        
        // Enviar email usando EmailJS
        const result = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            templateParams
        );
        
        console.log('✅ Email enviado exitosamente:', result);
        
        return {
            success: true,
            message: 'Email enviado correctamente con EmailJS',
            messageId: result.text
        };
        
    } catch (error) {
        console.error('❌ Error en EmailJS:', error);
        
        // Mensajes de error específicos
        let errorMessage = 'Error desconocido';
        if (error.text) {
            errorMessage = error.text;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return {
            success: false,
            error: `Error de EmailJS: ${errorMessage}`
        };
    }
}

// 🎨 Función para generar la plantilla HTML del email
function generarPlantillaEmail(datosCita) {
    const fechaFormateada = formatearFecha(datosCita.fecha);
    const horaFormateada = formatearHora(datosCita.hora);
    
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cita Confirmada - Obispado</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                color: #2c5aa0;
                border-bottom: 3px solid #2c5aa0;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .confirmation {
                background-color: #e8f5e8;
                border: 2px solid #4caf50;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
            }
            .details {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: bold;
                color: #555;
            }
            .value {
                color: #333;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .important {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🙏 OBISPADO</h1>
                <h2>Iglesia de Jesucristo de los Santos de los Últimos Días</h2>
            </div>
            
            <div class="confirmation">
                <h2 style="color: #4caf50; margin: 0;">✅ SU CITA HA SIDO CONFIRMADA</h2>
            </div>
            
            <div class="details">
                <h3 style="color: #2c5aa0; margin-top: 0;">📋 Detalles de su Cita:</h3>
                
                <div class="detail-row">
                    <span class="label">👤 Nombre:</span>
                    <span class="value">${datosCita.nombre}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">📅 Fecha:</span>
                    <span class="value">${fechaFormateada}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">⏰ Hora:</span>
                    <span class="value">${horaFormateada}</span>
                </div>
                
                <div class="detail-row">
                    <span class="label">📍 Lugar:</span>
                    <span class="value">Oficina del Obispo - Capilla Local</span>
                </div>
                
                ${datosCita.motivo ? `
                <div class="detail-row">
                    <span class="label">📝 Motivo:</span>
                    <span class="value">${datosCita.motivo}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="important">
                <h4 style="margin-top: 0; color: #856404;">📌 Recordatorios Importantes:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>Llegue 10 minutos antes</strong> de la hora programada</li>
                    <li>Traiga una <strong>actitud de oración</strong> y reflexión</li>
                    <li>Si necesita <strong>cancelar o reprogramar</strong>, contáctenos con anticipación</li>
                    <li>Este email serve como <strong>comprobante de confirmación</strong></li>
                </ul>
            </div>
            
            <div class="footer">
                <p><strong>Gracias por su confianza</strong></p>
                <p>Este email fue generado automáticamente • ${new Date().toLocaleDateString('es-ES')}</p>
                <p style="font-size: 12px; color: #999;">
                    Si tiene alguna pregunta, por favor contacte directamente al obispado
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// 📅 Función para formatear fecha
function formatearFecha(fecha) {
    try {
        const fechaObj = new Date(fecha);
        const opciones = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return fechaObj.toLocaleDateString('es-ES', opciones);
    } catch (error) {
        return fecha; // Retornar original si hay error
    }
}

// ⏰ Función para formatear hora
function formatearHora(hora) {
    try {
        // Si ya viene formateada, devolverla
        if (typeof hora === 'string' && hora.includes(':')) {
            const [h, m] = hora.split(':');
            return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
        }
        return hora;
    } catch (error) {
        return hora; // Retornar original si hay error
    }
}

// ✉️ Función para validar formato de email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Hacer la función disponible globalmente
window.enviarEmailConfirmacion = enviarEmailConfirmacion;

console.log('📧 Sistema de Email para confirmación de citas cargado correctamente');