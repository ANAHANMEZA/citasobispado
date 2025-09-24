// Funciones para interactuar con Supabase
let supabaseClient = null;

// =====================================================
// CONFIGURACIÓN DE HORARIOS DISPONIBLES
// =====================================================

const HORARIOS_DISPONIBLES = {
    // Martes (2), Miércoles (3), Jueves (4): 20:00 - 21:00
    2: { inicio: '20:00', fin: '21:00', intervalo: 60 }, // Martes
    3: { inicio: '20:00', fin: '21:00', intervalo: 60 }, // Miércoles  
    4: { inicio: '20:00', fin: '21:00', intervalo: 60 }, // Jueves
    
    // Sábado (6): 17:00 - 20:00
    6: { inicio: '17:00', fin: '20:00', intervalo: 30 }, // Sábado
    
    // Domingo (0): 18:00 - 20:00
    0: { inicio: '18:00', fin: '20:00', intervalo: 30 }  // Domingo
};

const DIAS_SEMANA = {
    0: 'Domingo',
    1: 'Lunes', 
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
};

// Inicializar cliente de Supabase
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('La librería de Supabase no está cargada. Asegúrate de incluir el CDN.');
        return false;
    }
    
    try {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('Cliente de Supabase inicializado correctamente');
        return true;
    } catch (error) {
        console.error('Error al inicializar Supabase:', error);
        return false;
    }
}

// =====================================================
// FUNCIONES PARA MANEJO DE HORARIOS
// =====================================================

/**
 * Verifica si un día de la semana tiene horarios disponibles
 */
function esDiaDisponible(diaSemana) {
    return HORARIOS_DISPONIBLES.hasOwnProperty(diaSemana);
}

/**
 * Obtiene los horarios disponibles para un día específico
 */
function obtenerHorariosDelDia(diaSemana) {
    if (!esDiaDisponible(diaSemana)) {
        return [];
    }
    
    const config = HORARIOS_DISPONIBLES[diaSemana];
    const horarios = [];
    
    const [horaInicio, minutoInicio] = config.inicio.split(':').map(Number);
    const [horaFin, minutoFin] = config.fin.split(':').map(Number);
    
    let horaActual = horaInicio * 60 + minutoInicio; // Convertir a minutos
    const horaLimite = horaFin * 60 + minutoFin;
    
    while (horaActual < horaLimite) {
        const horas = Math.floor(horaActual / 60);
        const minutos = horaActual % 60;
        const horaFormateada = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        
        horarios.push(horaFormateada);
        horaActual += config.intervalo;
    }
    
    return horarios;
}

/**
 * Obtiene todas las fechas disponibles para los próximos N días
 */
function obtenerFechasDisponibles(diasAdelante = 30) {
    const fechasDisponibles = [];
    const hoy = new Date();
    
    for (let i = 1; i <= diasAdelante; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() + i);
        
        const diaSemana = fecha.getDay();
        
        if (esDiaDisponible(diaSemana)) {
            fechasDisponibles.push({
                fecha: fecha.toISOString().split('T')[0], // YYYY-MM-DD
                diaSemana: diaSemana,
                nombreDia: DIAS_SEMANA[diaSemana],
                horarios: obtenerHorariosDelDia(diaSemana)
            });
        }
    }
    
    return fechasDisponibles;
}

/**
 * Verifica si una fecha y hora específica está dentro de los horarios permitidos
 */
function esHorarioValido(fecha, hora) {
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diaSemana = fechaObj.getDay();
    
    if (!esDiaDisponible(diaSemana)) {
        return {
            valido: false,
            mensaje: `Los ${DIAS_SEMANA[diaSemana]}s no están disponibles para citas`
        };
    }
    
    const horariosPermitidos = obtenerHorariosDelDia(diaSemana);
    
    if (!horariosPermitidos.includes(hora)) {
        const config = HORARIOS_DISPONIBLES[diaSemana];
        return {
            valido: false,
            mensaje: `Los ${DIAS_SEMANA[diaSemana]}s solo están disponibles de ${config.inicio} a ${config.fin}`
        };
    }
    
    return {
        valido: true,
        mensaje: 'Horario válido'
    };
}

// Función para guardar una cita en Supabase
async function guardarCitaSupabase(datosFormulario) {
    if (!supabaseClient) {
        throw new Error('Cliente de Supabase no inicializado');
    }
    
    try {
        // Preparar los datos para la base de datos
        const citaData = {
            nombre: datosFormulario.nombre.trim(),
            telefono: datosFormulario.telefono.trim(),
            email: datosFormulario.email.trim().toLowerCase(),
            fecha: datosFormulario.fecha,
            hora: datosFormulario.hora,
            motivo: datosFormulario.motivo.trim(),
            comentarios: datosFormulario.comentarios ? datosFormulario.comentarios.trim() : null,
            estado: 'pendiente'
        };
        
        // Insertar en la base de datos
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .insert([citaData])
            .select()
            .single();
        
        if (error) {
            console.error('Error de Supabase:', error);
            throw new Error(`Error al guardar la cita: ${error.message}`);
        }
        
        console.log('Cita guardada exitosamente:', data);
        return {
            success: true,
            data: data,
            id: data.id
        };
        
    } catch (error) {
        console.error('Error al guardar cita:', error);
        throw error;
    }
}

// Función para obtener todas las citas (para el panel administrativo)
async function obtenerTodasLasCitas() {
    if (!supabaseClient) {
        throw new Error('Cliente de Supabase no inicializado');
    }
    
    try {
        // Obtener todas las citas sin limpieza automática para evitar recursión
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .select('*')
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });
        
        if (error) {
            throw new Error(`Error al obtener citas: ${error.message}`);
        }
        
        return data;
        
    } catch (error) {
        console.error('Error al obtener citas:', error);
        throw error;
    }
}

// 🗑️ Función para eliminar citas vencidas automáticamente
async function limpiarCitasVencidas() {
    if (!supabaseClient) {
        throw new Error('Cliente de Supabase no inicializado');
    }
    
    try {
        // Obtener fecha actual
        const hoy = new Date();
        const fechaHoy = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        console.log('🗑️ Limpiando citas vencidas anteriores a:', fechaHoy);
        
        // Eliminar citas cuya fecha sea menor a hoy
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .delete()
            .lt('fecha', fechaHoy)
            .select();
        
        if (error) {
            console.error('Error al limpiar citas vencidas:', error);
            return { success: false, count: 0, error: error.message };
        }
        
        const count = data ? data.length : 0;
        if (count > 0) {
            console.log(`✅ ${count} citas vencidas eliminadas`);
        } else {
            console.log('✅ No hay citas vencidas que eliminar');
        }
        
        return { success: true, count: count };
        
    } catch (error) {
        console.error('❌ Error en limpiarCitasVencidas:', error);
        return { success: false, count: 0, error: error.message };
    }
}

// 🗑️ Función para eliminar citas específicas por ID
async function eliminarCita(idCita) {
    if (!supabaseClient) {
        throw new Error('Cliente de Supabase no inicializado');
    }
    
    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .delete()
            .eq('id', idCita)
            .select();
        
        if (error) {
            console.error('Error al eliminar cita:', error);
            return { success: false, error: error.message };
        }
        
        console.log('✅ Cita eliminada exitosamente:', idCita);
        return { success: true, message: 'Cita eliminada correctamente' };
        
    } catch (error) {
        console.error('❌ Error al eliminar cita:', error);
        return { success: false, error: error.message };
    }
}

// 🧹 Función para limpiar manualmente todas las citas vencidas
async function limpiarTodasLasCitasVencidas() {
    if (!supabaseClient) {
        throw new Error('Cliente de Supabase no inicializado');
    }
    
    try {
        // Obtener fecha actual
        const hoy = new Date();
        const fechaHoy = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        console.log('🗑️ Limpieza manual: eliminando citas anteriores a:', fechaHoy);
        
        // Eliminar citas cuya fecha sea menor a hoy
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .delete()
            .lt('fecha', fechaHoy)
            .select(); // Necesario para obtener los datos eliminados
        
        if (error) {
            console.error('Error en limpieza manual:', error);
            return { success: false, count: 0, error: error.message };
        }
        
        const count = data ? data.length : 0;
        console.log(`🎯 Limpieza manual completada: ${count} citas eliminadas`);
        
        return { 
            success: true, 
            count: count,
            message: count > 0 ? 
                `Se eliminaron ${count} citas vencidas correctamente` : 
                'No se encontraron citas vencidas que eliminar'
        };
        
    } catch (error) {
        console.error('❌ Error en limpieza manual:', error);
        return { 
            success: false, 
            count: 0,
            error: error.message 
        };
    }
}

// Función para obtener citas por fecha
async function obtenerCitasPorFecha(fecha) {
    if (!supabaseClient) {
        throw new Error('Cliente de Supabase no inicializado');
    }
    
    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .select('*')
            .eq('fecha', fecha)
            .order('hora', { ascending: true });
        
        if (error) {
            throw new Error(`Error al obtener citas: ${error.message}`);
        }
        
        return data;
        
    } catch (error) {
        console.error('Error al obtener citas por fecha:', error);
        throw error;
    }
}

// Función para actualizar el estado de una cita
async function actualizarEstadoCita(idCita, nuevoEstado) {
    if (!supabaseClient) {
        throw new Error('Cliente de Supabase no inicializado');
    }
    
    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .update({ 
                estado: nuevoEstado,
                updated_at: new Date().toISOString()
            })
            .eq('id', idCita)
            .select()
            .single();
        
        if (error) {
            throw new Error(`Error al actualizar cita: ${error.message}`);
        }
        
        console.log('Estado de cita actualizado:', data);
        return data;
        
    } catch (error) {
        console.error('Error al actualizar estado de cita:', error);
        throw error;
    }
}

// Función para eliminar una cita
async function eliminarCita(idCita) {
    if (!supabaseClient) {
        throw new Error('Cliente de Supabase no inicializado');
    }
    
    try {
        const { error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .delete()
            .eq('id', idCita);
        
        if (error) {
            throw new Error(`Error al eliminar cita: ${error.message}`);
        }
        
        console.log('Cita eliminada exitosamente');
        return true;
        
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        throw error;
    }
}

// Función para verificar disponibilidad de horario
async function verificarDisponibilidad(fecha, hora) {
    if (!supabaseClient) {
        throw new Error('Cliente de Supabase no inicializado');
    }
    
    try {
        // Primero verificar si el horario está dentro de los permitidos
        const validacionHorario = esHorarioValido(fecha, hora);
        if (!validacionHorario.valido) {
            return {
                disponible: false,
                mensaje: validacionHorario.mensaje,
                tipoError: 'horario_no_permitido'
            };
        }
        
        // Luego verificar si ya hay una cita en ese horario
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .select('id')
            .eq('fecha', fecha)
            .eq('hora', hora)
            .neq('estado', 'cancelada');
        
        if (error) {
            throw new Error(`Error al verificar disponibilidad: ${error.message}`);
        }
        
        // Si hay datos, significa que el horario ya está ocupado
        const estaDisponible = data.length === 0;
        
        return {
            disponible: estaDisponible,
            mensaje: estaDisponible ? 
                'Horario disponible' : 
                'Este horario ya está ocupado por otra cita',
            tipoError: estaDisponible ? null : 'horario_ocupado'
        };
        
    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        return {
            disponible: false,
            mensaje: 'Error al verificar disponibilidad: ' + error.message,
            tipoError: 'error_sistema'
        };
    }
}

// =====================================================
// FUNCIONES PARA RECORDATORIO SEMANAL DEL OBISPO
// =====================================================

/**
 * Obtiene todas las citas de la semana actual (lunes a domingo)
 */
async function obtenerCitasSemanaActual() {
    if (!supabaseClient) {
        throw new Error('Cliente de Supabase no inicializado');
    }
    
    try {
        // Calcular el lunes de la semana actual
        const hoy = new Date();
        const diaActual = hoy.getDay(); // 0 = domingo, 1 = lunes, etc.
        const diasHastaLunes = diaActual === 0 ? 6 : diaActual - 1; // Si es domingo, retroceder 6 días
        
        const lunesActual = new Date(hoy);
        lunesActual.setDate(hoy.getDate() - diasHastaLunes);
        lunesActual.setHours(0, 0, 0, 0);
        
        // Calcular el domingo de la semana actual
        const domingoActual = new Date(lunesActual);
        domingoActual.setDate(lunesActual.getDate() + 6);
        domingoActual.setHours(23, 59, 59, 999);
        
        const fechaInicio = lunesActual.toISOString().split('T')[0];
        const fechaFin = domingoActual.toISOString().split('T')[0];
        
        console.log(`📅 Obteniendo citas de la semana: ${fechaInicio} a ${fechaFin}`);
        
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .select('*')
            .gte('fecha', fechaInicio)
            .lte('fecha', fechaFin)
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });
        
        if (error) {
            throw new Error(`Error al obtener citas semanales: ${error.message}`);
        }
        
        return {
            success: true,
            citas: data || [],
            semana: {
                inicio: fechaInicio,
                fin: fechaFin,
                lunes: lunesActual.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })
            }
        };
        
    } catch (error) {
        console.error('❌ Error al obtener citas semanales:', error);
        return {
            success: false,
            error: error.message,
            citas: [],
            semana: null
        };
    }
}

/**
 * Genera el contenido HTML para el email semanal del Obispo
 */
function generarEmailSemanal(citasDatos) {
    const { citas, semana } = citasDatos;
    
    // Agrupar citas por día
    const citasPorDia = {};
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    
    citas.forEach(cita => {
        const fecha = new Date(cita.fecha + 'T00:00:00');
        const diaSemana = diasSemana[fecha.getDay()];
        const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
        });
        
        if (!citasPorDia[diaSemana]) {
            citasPorDia[diaSemana] = {
                fecha: fechaFormateada,
                citas: []
            };
        }
        citasPorDia[diaSemana].citas.push(cita);
    });
    
    // Contar citas por estado
    const estadisticas = {
        total: citas.length,
        pendientes: citas.filter(c => c.estado === 'pendiente').length,
        confirmadas: citas.filter(c => c.estado === 'confirmada').length,
        canceladas: citas.filter(c => c.estado === 'cancelada').length
    };
    
    let contenidoDias = '';
    
    // Solo mostrar días que tienen citas
    Object.entries(citasPorDia).forEach(([dia, datos]) => {
        contenidoDias += `
            <div style="margin-bottom: 25px; border-left: 4px solid #0F2A44; padding-left: 15px;">
                <h3 style="color: #0F2A44; margin: 0 0 10px 0; text-transform: capitalize; font-size: 18px;">
                    ${datos.fecha}
                </h3>
                ${datos.citas.map(cita => `
                    <div style="background: #F8F9FA; border-radius: 8px; padding: 12px; margin-bottom: 8px; border: 1px solid #E8F4FD;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong style="color: #0F2A44; font-size: 16px;">${cita.nombre}</strong>
                            <span style="background: ${cita.estado === 'confirmada' ? '#27AE60' : cita.estado === 'pendiente' ? '#F39C12' : '#E74C3C'}; 
                                         color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px; text-transform: uppercase;">
                                ${cita.estado}
                            </span>
                        </div>
                        <div style="color: #546E7A; font-size: 14px; margin-bottom: 3px;">
                            🕐 <strong>${cita.hora}</strong> | 📞 ${cita.telefono} | 📧 ${cita.email}
                        </div>
                        <div style="color: #2C3E50; font-size: 14px; margin-top: 8px;">
                            <strong>Motivo:</strong> ${cita.motivo}
                        </div>
                        ${cita.comentarios ? `
                            <div style="color: #546E7A; font-size: 13px; margin-top: 5px; font-style: italic;">
                                <strong>Comentarios:</strong> ${cita.comentarios}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    });
    
    if (citas.length === 0) {
        contenidoDias = `
            <div style="text-align: center; padding: 40px; color: #546E7A;">
                <h3>📅 No hay citas programadas para esta semana</h3>
                <p>Puede disfrutar de una semana más relajada para otras actividades pastorales.</p>
            </div>
        `;
    }
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Recordatorio Semanal - Citas del Obispado</title>
        </head>
        <body style="font-family: 'Source Sans Pro', Arial, sans-serif; line-height: 1.6; color: #2C3E50; margin: 0; padding: 20px; background-color: #F8F9FA;">
            <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 42, 68, 0.15);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #0F2A44 0%, #1F5582 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">📅 Recordatorio Semanal</h1>
                    <h2 style="margin: 10px 0 0 0; font-size: 18px; font-weight: 400; opacity: 0.9;">
                        La Iglesia de Jesucristo de los Santos de los Últimos Días
                    </h2>
                    <div style="background: rgba(255,255,255,0.1); border-radius: 20px; padding: 10px; margin-top: 15px; display: inline-block;">
                        <span style="font-size: 16px;">Semana del ${semana.lunes}</span>
                    </div>
                </div>
                
                <!-- Estadísticas -->
                <div style="padding: 25px; background: #E8F4FD; border-bottom: 1px solid #0F2A44;">
                    <h3 style="margin: 0 0 15px 0; color: #0F2A44; font-size: 20px;">📊 Resumen de la Semana</h3>
                    <div style="display: flex; justify-content: space-around; text-align: center;">
                        <div style="flex: 1;">
                            <div style="font-size: 24px; font-weight: bold; color: #0F2A44;">${estadisticas.total}</div>
                            <div style="font-size: 12px; color: #546E7A; text-transform: uppercase;">Total</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 24px; font-weight: bold; color: #F39C12;">${estadisticas.pendientes}</div>
                            <div style="font-size: 12px; color: #546E7A; text-transform: uppercase;">Pendientes</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 24px; font-weight: bold; color: #27AE60;">${estadisticas.confirmadas}</div>
                            <div style="font-size: 12px; color: #546E7A; text-transform: uppercase;">Confirmadas</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 24px; font-weight: bold; color: #E74C3C;">${estadisticas.canceladas}</div>
                            <div style="font-size: 12px; color: #546E7A; text-transform: uppercase;">Canceladas</div>
                        </div>
                    </div>
                </div>
                
                <!-- Contenido de citas -->
                <div style="padding: 30px;">
                    <h3 style="color: #0F2A44; margin: 0 0 20px 0; font-size: 22px;">🗓️ Citas de la Semana</h3>
                    ${contenidoDias}
                </div>
                
                <!-- Footer -->
                <div style="background: #0F2A44; color: white; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 14px;">
                        Este recordatorio se envía automáticamente cada lunes.<br>
                        Sistema de Gestión de Citas del Obispado - ${new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Genera HTML simplificado para usar dentro del template EmailJS
 * (sin head, body, estilos complejos - solo el contenido)
 */
function generarHTMLCitasParaTemplate(citasDatos) {
    const { citas, semana } = citasDatos;
    
    if (!Array.isArray(citas) || citas.length === 0) {
        return `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3 style="color: #0F2A44;">📅 No hay citas programadas</h3>
                <p>No se encontraron citas para esta semana.</p>
            </div>
        `;
    }
    
    // Agrupar citas por día
    const citasPorDia = {};
    const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    
    citas.forEach(cita => {
        const fecha = new Date(cita.fecha + 'T00:00:00');
        const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
        const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'long' 
        });
        
        const claveDay = `${diaSemana} ${fechaFormateada}`;
        
        if (!citasPorDia[claveDay]) {
            citasPorDia[claveDay] = [];
        }
        citasPorDia[claveDay].push(cita);
    });
    
    // Generar HTML por día
    let contenidoDias = '';
    
    for (const dia of diasSemana) {
        const citasDelDia = Object.keys(citasPorDia)
            .filter(key => key.toLowerCase().startsWith(dia))
            .map(key => citasPorDia[key])
            .flat();
        
        if (citasDelDia.length > 0) {
            const fechaCompleta = Object.keys(citasPorDia).find(key => key.toLowerCase().startsWith(dia));
            
            contenidoDias += `
                <div style="margin: 25px 0; border-left: 4px solid #0F2A44; padding-left: 20px;">
                    <h4 style="color: #0F2A44; margin: 0 0 15px 0; font-size: 18px; text-transform: capitalize;">
                        📅 ${fechaCompleta}
                    </h4>
            `;
            
            citasDelDia.forEach(cita => {
                const estadoColor = {
                    'pendiente': '#F39C12',
                    'confirmada': '#27AE60',
                    'cancelada': '#E74C3C'
                }[cita.estado] || '#6C757D';
                
                const estadoTexto = {
                    'pendiente': 'Pendiente',
                    'confirmada': 'Confirmada',
                    'cancelada': 'Cancelada'
                }[cita.estado] || cita.estado;
                
                contenidoDias += `
                    <div style="background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 3px solid ${estadoColor};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <strong style="color: #0F2A44; font-size: 16px;">${cita.nombre}</strong>
                            <span style="background: ${estadoColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                                ${estadoTexto}
                            </span>
                        </div>
                        <div style="color: #666; font-size: 14px; line-height: 1.5;">
                            <div style="margin: 5px 0;">⏰ <strong>Hora:</strong> ${cita.hora}</div>
                            <div style="margin: 5px 0;">📞 <strong>Teléfono:</strong> ${cita.telefono}</div>
                            <div style="margin: 5px 0;">📧 <strong>Email:</strong> ${cita.email}</div>
                            <div style="margin: 5px 0;">💭 <strong>Motivo:</strong> ${cita.motivo}</div>
                            ${cita.comentarios ? `<div style="margin: 5px 0;">📝 <strong>Comentarios:</strong> ${cita.comentarios}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            
            contenidoDias += `</div>`;
        }
    }
    
    if (!contenidoDias) {
        return `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3 style="color: #0F2A44;">📅 No hay citas programadas</h3>
                <p>No se encontraron citas para esta semana.</p>
            </div>
        `;
    }
    
    return contenidoDias;
}

// ========== FUNCIONES DE AUTENTICACIÓN CON SUPABASE ==========

// Función para autenticar al obispo usando Supabase
async function autenticarObispo(usuario, password) {
    if (!supabaseClient) {
        throw new Error('Cliente de Supabase no inicializado');
    }
    
    try {
        // Llamar a la función de autenticación en Supabase
        const { data, error } = await supabaseClient.rpc('authenticate_user', {
            input_username: usuario,
            input_password: password
        });
        
        if (error) {
            throw new Error(`Error de autenticación: ${error.message}`);
        }
        
        if (data && data.success) {
            // Generar token de sesión
            const sessionToken = btoa(`${usuario}:${Date.now()}`);
            
            // Guardar sesión en localStorage
            localStorage.setItem('obispado_session', sessionToken);
            localStorage.setItem('obispado_user', usuario);
            localStorage.setItem('obispado_user_data', JSON.stringify(data.user));
            localStorage.setItem('obispado_login_time', Date.now().toString());
            
            // Establecer usuario para RLS
            await supabaseClient.rpc('set_config', {
                setting_name: 'app.current_user',
                new_value: usuario,
                is_local: false
            });
            
            return {
                success: true,
                user: data.user.username,
                userData: data.user,
                token: sessionToken
            };
        } else {
            throw new Error(data.error || 'Credenciales incorrectas');
        }
        
    } catch (error) {
        console.error('Error en autenticación:', error);
        
        // Registrar intento fallido si es posible
        try {
            await registrarAcceso(usuario, 'failed_login', false, { error: error.message });
        } catch (logError) {
            console.error('Error al registrar acceso fallido:', logError);
        }
        
        throw error;
    }
}

// Función para registrar accesos y acciones
async function registrarAcceso(username, action, success = true, details = null) {
    if (!supabaseClient) return;
    
    try {
        const { error } = await supabaseClient
            .from('access_logs')
            .insert([{
                username: username,
                action: action,
                success: success,
                details: details,
                ip_address: null, // Se podría obtener con una API externa
                user_agent: navigator.userAgent
            }]);
        
        if (error) {
            console.error('Error al registrar acceso:', error);
        }
    } catch (error) {
        console.error('Error en registrarAcceso:', error);
    }
}

// Función para verificar si hay una sesión activa
function verificarSesion() {
    const session = localStorage.getItem('obispado_session');
    const user = localStorage.getItem('obispado_user');
    const loginTime = localStorage.getItem('obispado_login_time');
    
    if (!session || !user || !loginTime) {
        return { valid: false, reason: 'No hay sesión activa' };
    }
    
    // Verificar si la sesión ha expirado (24 horas)
    const now = Date.now();
    const sessionAge = now - parseInt(loginTime);
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    
    if (sessionAge > maxSessionAge) {
        cerrarSesion();
        return { valid: false, reason: 'Sesión expirada' };
    }
    
    return {
        valid: true,
        user: user,
        userData: JSON.parse(localStorage.getItem('obispado_user_data') || '{}'),
        token: session,
        loginTime: parseInt(loginTime),
        sessionTime: sessionAge
    };
}

// Función para cerrar sesión
async function cerrarSesion() {
    const usuario = localStorage.getItem('obispado_user');
    
    try {
        // Registrar cierre de sesión
        if (usuario && supabaseClient) {
            await registrarAcceso(usuario, 'logout', true);
            
            // Limpiar configuración de RLS
            await supabaseClient.rpc('set_config', {
                setting_name: 'app.current_user',
                new_value: '',
                is_local: false
            }).catch(err => console.warn('Error limpiando RLS config:', err));
        }
        
        // Limpiar datos de sesión completamente
        localStorage.removeItem('obispado_session');
        localStorage.removeItem('obispado_user');
        localStorage.removeItem('obispado_user_data');
        localStorage.removeItem('obispado_login_time');
        
        // Limpiar también la marca de bienvenida para mostrarla de nuevo
        localStorage.removeItem('visited_welcome');
        localStorage.removeItem('redirecting_to_welcome');
        
        console.log('Sesión cerrada completamente - datos limpiados');
        return { success: true };
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // Aún así limpiamos los datos locales
        cerrarSesionLocal();
        return { success: false, error: error.message };
    }
}

// Función auxiliar para limpiar sesión localmente
function cerrarSesionLocal() {
    localStorage.removeItem('obispado_session');
    localStorage.removeItem('obispado_user');
    localStorage.removeItem('obispado_user_data');
    localStorage.removeItem('obispado_login_time');
    
    // También limpiar la marca de bienvenida para que la vea de nuevo
    localStorage.removeItem('visited_welcome');
    localStorage.removeItem('redirecting_to_welcome');
}

// Función para extender sesión
async function extenderSesion() {
    const session = verificarSesion();
    if (session && session.valid) {
        // Actualizar tiempo de login
        localStorage.setItem('obispado_login_time', Date.now().toString());
        
        // Registrar actividad si es necesario
        try {
            if (supabaseClient) {
                await registrarAcceso(session.user, 'session_extended', true);
            }
        } catch (error) {
            console.warn('Error al registrar extensión de sesión:', error);
        }
        
        return true;
    }
    return false;
}

// Función para obtener información del usuario autenticado
function obtenerUsuarioActual() {
    const session = verificarSesion();
    if (session && session.valid) {
        return {
            username: session.user,
            userData: session.userData,
            loginTime: session.loginTime,
            sessionDuration: session.sessionTime
        };
    }
    return null;
}

// Función para verificar permisos específicos
function verificarPermiso(permiso) {
    const usuario = obtenerUsuarioActual();
    if (!usuario || !usuario.userData) {
        return false;
    }
    
    // Verificar si el usuario tiene el permiso específico
    const permisos = usuario.userData.permissions || [];
    return permisos.includes(permiso) || usuario.userData.role === 'admin';
}

// =====================================================
// EXPORTACIONES GLOBALES PARA USO EN OTROS ARCHIVOS
// =====================================================
if (typeof window !== 'undefined') {
    // Funciones principales
    window.obtenerTodasLasCitas = obtenerTodasLasCitas;
    window.cambiarEstadoCita = actualizarEstadoCita;
    window.crearCita = guardarCitaSupabase;
    window.guardarCitaSupabase = guardarCitaSupabase;
    window.verificarDisponibilidad = verificarDisponibilidad;
    
    // Funciones de limpieza
    window.limpiarCitasVencidas = limpiarCitasVencidas;
    window.eliminarCita = eliminarCita;
    window.limpiarTodasLasCitasVencidas = limpiarTodasLasCitasVencidas;
    
    // Funciones de horarios
    window.esDiaDisponible = esDiaDisponible;
    window.obtenerHorariosDelDia = obtenerHorariosDelDia;
    window.obtenerFechasDisponibles = obtenerFechasDisponibles;
    window.esHorarioValido = esHorarioValido;
    window.HORARIOS_DISPONIBLES = HORARIOS_DISPONIBLES;
    window.DIAS_SEMANA = DIAS_SEMANA;
    
    // Funciones de recordatorio semanal
    window.obtenerCitasSemanaActual = obtenerCitasSemanaActual;
    window.generarEmailSemanal = generarEmailSemanal;
    window.generarHTMLCitasParaTemplate = generarHTMLCitasParaTemplate;
}