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
    window.crearCita = crearCita;
    window.verificarDisponibilidad = verificarDisponibilidad;
    window.autenticarUsuario = autenticarUsuario;
    window.obtenerUsuarioActual = obtenerUsuarioActual;
    window.cerrarSesion = cerrarSesion;
    window.verificarPermiso = verificarPermiso;
    
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
}