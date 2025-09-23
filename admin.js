// Variables globales para el panel de administración
let todasLasCitas = [];
let citasFiltradas = [];
let sesionActiva = false;

// Inicializar panel de administración
async function inicializarAdmin() {
    // Inicializar Supabase
    const supabaseInitialized = initSupabase();
    if (!supabaseInitialized) {
        mostrarError('Error al conectar con la base de datos. Por favor, configura las credenciales de Supabase.');
        return;
    }
    
    // Verificar si hay una sesión activa
    const session = verificarSesion();
    if (session && session.valid) {
        console.log('Sesión activa encontrada para:', session.user);
        // Extender la sesión
        await extenderSesion();
        mostrarPanelAdmin(session.user);
        await cargarCitas();
    } else {
        console.log('No hay sesión activa:', session.reason || 'Sesión inválida');
        if (session && session.reason) {
            mostrarMensaje(session.reason, 'warning');
        }
        mostrarPantallaLogin();
    }
    
    // Verificar sesión cada 5 minutos
    setInterval(verificarSesionPeriodica, 5 * 60 * 1000);
}

// Mostrar pantalla de login
function mostrarPantallaLogin() {
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('admin-panel').classList.add('hidden');
    
    // Configurar evento de submit del formulario
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', manejarLogin);
}

// Mostrar panel de administración
function mostrarPanelAdmin(usuario) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').classList.remove('hidden');
    
    // Mostrar información del usuario
    const userInfo = obtenerUsuarioActual();
    const nombreUsuario = userInfo ? userInfo.username : usuario;
    const tipoUsuario = userInfo && userInfo.userData ? (userInfo.userData.role || 'Usuario') : 'Admin';
    
    document.getElementById('user-info').textContent = `Bienvenido, ${nombreUsuario} (${tipoUsuario})`;
    sesionActiva = true;
}

// Manejar intento de login
async function manejarLogin(e) {
    e.preventDefault();
    
    const loginBtn = document.getElementById('login-btn');
    const errorDiv = document.getElementById('login-error');
    const usuario = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Validaciones básicas
    if (!usuario || !password) {
        mostrarErrorLogin('Por favor, completa todos los campos');
        return;
    }
    
    // Mostrar loading
    loginBtn.disabled = true;
    loginBtn.textContent = '🔄 Verificando credenciales...';
    errorDiv.classList.add('hidden');
    
    try {
        const resultado = await autenticarObispo(usuario, password);
        
        if (resultado.success) {
            console.log('Login exitoso:', resultado.user);
            
            // Registrar login exitoso
            await registrarAcceso(resultado.user, 'successful_login', true);
            
            // Mostrar panel y cargar datos
            mostrarPanelAdmin(resultado.user);
            await cargarCitas();
            
            // Limpiar formulario
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        }
        
    } catch (error) {
        console.error('Error de autenticación:', error);
        mostrarErrorLogin(error.message || 'Error de autenticación');
    } finally {
        // Restaurar botón
        loginBtn.disabled = false;
        loginBtn.textContent = '🔐 Iniciar Sesión';
    }
}

// Mostrar error de login
function mostrarErrorLogin(mensaje) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = mensaje;
    errorDiv.classList.remove('hidden');
    
    // Limpiar campos
    document.getElementById('password').value = '';
    document.getElementById('username').focus();
}

// Cerrar sesión rápido y efectivo
async function cerrarSesion() {
    const confirmacion = confirm('¿Estás seguro de que quieres cerrar sesión?');
    
    if (confirmacion) {
        console.log('🚀 Ejecutando cierre de sesión rápida...');
        
        // Obtener información del usuario actual antes de cerrar
        const usuarioActual = obtenerUsuarioActual();
        const nombreUsuario = usuarioActual ? usuarioActual.username : 'Usuario';
        
        // Limpiar datos inmediatamente - método más efectivo
        localStorage.clear(); // Limpiar todo localStorage de una vez
        sessionStorage.clear(); // También sessionStorage por seguridad
        
        // Limpiar variables de sesión
        sesionActiva = false;
        todasLasCitas = [];
        citasFiltradas = [];
        
        // Mostrar mensaje rápido y efectivo
        mostrarMensaje(`¡Sesión cerrada! Que Dios lo bendiga, ${nombreUsuario} ✨`, 'success');
        
        // Redireccionar inmediatamente usando el método más confiable
        setTimeout(() => {
            window.location.replace('bienvenida.html');
        }, 800); // Tiempo mínimo para mostrar el mensaje
    }
}













// Función para verificar sesión periódicamente
async function verificarSesionPeriodica() {
    if (!sesionActiva) return;
    
    const session = verificarSesion();
    if (!session || !session.valid) {
        console.log('Sesión expirada o inválida:', session.reason || 'Sesión no válida');
        
        // Mostrar mensaje y cerrar sesión automáticamente
        mostrarMensaje('Su sesión ha expirado por seguridad. 🔒\nSera redirigido al inicio para una nueva sesión.', 'warning');
        
        sesionActiva = false;
        todasLasCitas = [];
        citasFiltradas = [];
        
        // Limpiar datos de sesión
        try {
            await window.cerrarSesion();
        } catch (error) {
            console.error('Error al cerrar sesión automáticamente:', error);
            cerrarSesionLocal();
        }
        
        // Redireccionar a bienvenida después de mostrar el mensaje
        setTimeout(() => {
            window.location.href = 'bienvenida.html';
        }, 3000);
        
        return;
    }
    
    // Extender sesión automáticamente si está cerca de expirar
    const tiempoRestante = (24 * 60 * 60 * 1000) - session.sessionTime; // 24 horas - tiempo transcurrido
    const unaHora = 60 * 60 * 1000; // 1 hora en milisegundos
    
    if (tiempoRestante < unaHora) {
        await extenderSesion();
        console.log('Sesión extendida automáticamente');
    }
}

// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo = 'info') {
    // Crear elemento de mensaje si no existe
    let mensajeElement = document.getElementById('sistema-mensaje');
    if (!mensajeElement) {
        mensajeElement = document.createElement('div');
        mensajeElement.id = 'sistema-mensaje';
        mensajeElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-weight: bold;
            max-width: 300px;
            word-wrap: break-word;
        `;
        document.body.appendChild(mensajeElement);
    }
    
    // Establecer estilo según el tipo
    const colores = {
        info: { bg: '#e3f2fd', text: '#1976d2', border: '#2196f3' },
        warning: { bg: '#fff3e0', text: '#f57c00', border: '#ff9800' },
        error: { bg: '#ffebee', text: '#d32f2f', border: '#f44336' },
        success: { bg: '#e8f5e8', text: '#388e3c', border: '#4caf50' }
    };
    
    const color = colores[tipo] || colores.info;
    mensajeElement.style.backgroundColor = color.bg;
    mensajeElement.style.color = color.text;
    mensajeElement.style.border = `2px solid ${color.border}`;
    mensajeElement.textContent = mensaje;
    mensajeElement.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        if (mensajeElement) {
            mensajeElement.style.display = 'none';
        }
    }, 5000);
}

// Cargar todas las citas
async function cargarCitas() {
    // Verificar sesión antes de cargar datos
    const session = verificarSesion();
    if (!sesionActiva || !session || !session.valid) {
        mostrarPantallaLogin();
        return;
    }
    
    try {
        mostrarLoading(true);
        todasLasCitas = await obtenerTodasLasCitas();
        citasFiltradas = [...todasLasCitas];
        
        mostrarEstadisticas();
        mostrarCitas();
        mostrarLoading(false);
        
        // Extender sesión con la actividad
        extenderSesion();
        
    } catch (error) {
        console.error('Error al cargar citas:', error);
        
        // Si hay error de autenticación, cerrar sesión
        if (error.message.includes('auth') || error.message.includes('unauthorized')) {
            cerrarSesion();
        } else {
            mostrarError('Error al cargar las citas: ' + error.message);
            mostrarLoading(false);
        }
    }
}

// Mostrar estadísticas
function mostrarEstadisticas() {
    const stats = calcularEstadisticas(todasLasCitas);
    
    const statsHTML = `
        <div class="stat-card">
            <div class="stat-number">${stats.total}</div>
            <div class="stat-label">Total de Citas</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.pendientes}</div>
            <div class="stat-label">Pendientes</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.confirmadas}</div>
            <div class="stat-label">Confirmadas</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.hoy}</div>
            <div class="stat-label">Hoy</div>
        </div>
    `;
    
    document.getElementById('stats-container').innerHTML = statsHTML;
}

// Calcular estadísticas
function calcularEstadisticas(citas) {
    const hoy = new Date().toISOString().split('T')[0];
    
    return {
        total: citas.length,
        pendientes: citas.filter(c => c.estado === 'pendiente').length,
        confirmadas: citas.filter(c => c.estado === 'confirmada').length,
        canceladas: citas.filter(c => c.estado === 'cancelada').length,
        hoy: citas.filter(c => c.fecha === hoy).length
    };
}

// Mostrar citas en el DOM
function mostrarCitas() {
    const container = document.getElementById('citas-container');
    
    if (citasFiltradas.length === 0) {
        container.innerHTML = `
            <div class="no-citas">
                <h3>No hay citas que mostrar</h3>
                <p>No se encontraron citas con los filtros seleccionados.</p>
            </div>
        `;
        return;
    }
    
    const citasHTML = citasFiltradas.map(cita => crearTarjetaCita(cita)).join('');
    container.innerHTML = citasHTML;
}

// Crear tarjeta HTML para una cita
function crearTarjetaCita(cita) {
    const fechaFormateada = formatearFecha(cita.fecha);
    const estadoClass = `estado-${cita.estado}`;
    
    return `
        <div class="cita-card">
            <div class="cita-header">
                <div class="cita-id">#${cita.id}</div>
                <div class="cita-estado ${estadoClass}">${cita.estado}</div>
            </div>
            
            <div class="cita-info">
                <div class="info-group">
                    <div class="info-label">Paciente</div>
                    <div class="info-value">${cita.nombre}</div>
                </div>
                
                <div class="info-group">
                    <div class="info-label">Fecha y Hora</div>
                    <div class="info-value">${fechaFormateada} - ${cita.hora}</div>
                </div>
                
                <div class="info-group">
                    <div class="info-label">Teléfono</div>
                    <div class="info-value">
                        <a href="tel:${cita.telefono}">${cita.telefono}</a>
                    </div>
                </div>
                
                <div class="info-group">
                    <div class="info-label">Email</div>
                    <div class="info-value">
                        <a href="mailto:${cita.email}">${cita.email}</a>
                    </div>
                </div>
            </div>
            
            <div class="info-group">
                <div class="info-label">Motivo</div>
                <div class="info-value">${cita.motivo}</div>
            </div>
            
            ${cita.comentarios ? `
                <div class="info-group" style="margin-top: 10px;">
                    <div class="info-label">Comentarios</div>
                    <div class="info-value">${cita.comentarios}</div>
                </div>
            ` : ''}
            
            <div class="cita-actions">
                ${cita.estado === 'pendiente' ? `
                    <button class="btn-small btn-confirmar" onclick="cambiarEstado(${cita.id}, 'confirmada')">
                        Confirmar
                    </button>
                ` : ''}
                
                ${cita.estado !== 'cancelada' ? `
                    <button class="btn-small btn-cancelar" onclick="cambiarEstado(${cita.id}, 'cancelada')">
                        Cancelar
                    </button>
                ` : ''}
                
                <button class="btn-small btn-contactar" onclick="contactarPaciente('${cita.telefono}', '${cita.nombre}')">
                    Llamar
                </button>
                
                <button class="btn-small btn-contactar" onclick="enviarEmail('${cita.email}', '${cita.nombre}')">
                    Email
                </button>
            </div>
        </div>
    `;
}

// Cambiar estado de una cita
async function cambiarEstado(idCita, nuevoEstado) {
    // Verificar sesión
    if (!sesionActiva && !verificarSesion()) {
        mostrarPantallaLogin();
        return;
    }
    
    try {
        const confirmacion = confirm(`¿Estás seguro de que quieres ${nuevoEstado === 'confirmada' ? 'confirmar' : 'cancelar'} esta cita?`);
        
        if (!confirmacion) return;
        
        // Buscar los datos de la cita antes de actualizarla
        const cita = todasLasCitas.find(c => c.id === idCita);
        if (!cita) {
            throw new Error('Cita no encontrada');
        }
        
        // Actualizar estado en la base de datos
        await actualizarEstadoCita(idCita, nuevoEstado);
        
        // Actualizar la cita en el array local
        const citaIndex = todasLasCitas.findIndex(c => c.id === idCita);
        if (citaIndex !== -1) {
            todasLasCitas[citaIndex].estado = nuevoEstado;
        }
        
        // Si la cita fue confirmada, enviar SMS
        if (nuevoEstado === 'confirmada') {
            try {
                mostrarMensaje('� Verificando datos para Email...', 'info');
                
                // Verificar datos de la cita
                console.log('📊 Datos de la cita:');
                console.log('  - Nombre:', cita.nombre);
                console.log('  - Email:', cita.email);
                console.log('  - Fecha:', cita.fecha);
                console.log('  - Hora:', cita.hora);
                
                // Verificar que la cita tenga email válido
                if (cita.email && cita.email.toString().trim() !== '' && cita.email !== 'null') {
                    mostrarMensaje('� Enviando Email de confirmación...', 'info');
                    
                    // Log adicional del email específico
                    console.log('� Email que se va a procesar:');
                    console.log('  - Raw:', cita.email);
                    console.log('  - Tipo:', typeof cita.email);
                    console.log('  - String:', cita.email.toString());
                    console.log('  - Trim:', cita.email.toString().trim());
                    
                    const resultadoEmail = await enviarEmailConfirmacion(cita.email, {
                        nombre: cita.nombre,
                        fecha: cita.fecha,
                        hora: cita.hora,
                        motivo: cita.motivo || 'Consulta pastoral',
                        telefono: cita.telefono
                    });
                    
                    if (resultadoEmail.success) {
                        mostrarMensaje(`✅ Cita confirmada y Email enviado a ${cita.nombre} (${cita.email})`, 'success');
                        console.log('✅ Email enviado correctamente:', resultadoEmail);
                    } else {
                        mostrarMensaje(`⚠️ Cita confirmada, pero no se pudo enviar Email: ${resultadoEmail.error}`, 'warning');
                        console.warn('⚠️ Error enviando Email:', resultadoEmail.error);
                    }
                } else {
                    mostrarMensaje(`⚠️ Cita confirmada, pero no hay email válido (actual: "${cita.email}"). Agregar email en la base de datos.`, 'warning');
                    console.warn('⚠️ Email inválido o faltante:', cita.email);
                }
            } catch (emailError) {
                console.error('Error enviando Email:', emailError);
                mostrarMensaje('⚠️ Cita confirmada, pero hubo un problema enviando el Email', 'warning');
            }
        } else {
            // Para cancelaciones, solo mostrar mensaje normal
            mostrarMensaje(`Cita ${nuevoEstado} exitosamente`, 'info');
        }
        
        // Refiltrar y mostrar
        filtrarCitas();
        mostrarEstadisticas();
        
        // Extender sesión
        extenderSesion();
        
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        
        if (error.message.includes('auth') || error.message.includes('unauthorized')) {
            cerrarSesion();
        } else {
            mostrarMensaje('Error al cambiar el estado de la cita: ' + error.message, 'error');
        }
    }
}

// Filtrar citas
function filtrarCitas() {
    const filtroFecha = document.getElementById('filtro-fecha').value;
    const filtroEstado = document.getElementById('filtro-estado').value;
    const buscarTexto = document.getElementById('buscar-texto').value.toLowerCase();
    
    citasFiltradas = todasLasCitas.filter(cita => {
        const coincideFecha = !filtroFecha || cita.fecha === filtroFecha;
        const coincideEstado = !filtroEstado || cita.estado === filtroEstado;
        const coincideTexto = !buscarTexto || cita.nombre.toLowerCase().includes(buscarTexto);
        
        return coincideFecha && coincideEstado && coincideTexto;
    });
    
    mostrarCitas();
}

// Contactar paciente por teléfono
function contactarPaciente(telefono, nombre) {
    if (confirm(`¿Quieres llamar a ${nombre}?`)) {
        window.open(`tel:${telefono}`);
    }
}

// Enviar email al paciente
function enviarEmail(email, nombre) {
    const asunto = 'Confirmación de cita - Consulta profesional';
    const mensaje = `Estimado/a ${nombre},\n\nEsperamos este mensaje le encuentre bien.\n\nPor favor, confirme su cita...\n\nSaludos cordiales.`;
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
    window.open(mailtoLink);
}

// Formatear fecha para mostrar
function formatearFecha(fechaString) {
    const fecha = new Date(fechaString + 'T00:00:00');
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Mostrar/ocultar loading
function mostrarLoading(show) {
    const loading = document.getElementById('loading');
    const container = document.getElementById('citas-container');
    
    if (show) {
        loading.style.display = 'block';
        container.style.display = 'none';
    } else {
        loading.style.display = 'none';
        container.style.display = 'block';
    }
}

// Mostrar error
function mostrarError(mensaje) {
    const container = document.getElementById('citas-container');
    container.innerHTML = `
        <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px; text-align: center;">
            <h3>Error</h3>
            <p>${mensaje}</p>
        </div>
    `;
}

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', inicializarAdmin);