// Variables globales
const welcomeScreen = document.getElementById('welcome-screen');
const formContainer = document.getElementById('form-container');
const confirmationDiv = document.getElementById('confirmation');

// Función para inicializar la aplicación
function init() {
    // Inicializar Supabase
    const supabaseInitialized = initSupabase();
    if (!supabaseInitialized) {
        showError('Error al conectar con la base de datos. Por favor, configura las credenciales de Supabase.');
    }
    
    createWelcomeScreen();
}

// Función para crear la pantalla de bienvenida
function createWelcomeScreen() {
    const welcomeHTML = `
        <div class="welcome-screen fade-in">
            <div class="welcome-logo"><img src="img/logo sud.png" alt="Logo" width="100" height="150"></div>
            <h1 class="welcome-title">Bienvenido al Obispado</h1>
            <p class="welcome-subtitle">Sistema de Citas del Obispado</p>
            
            <div class="welcome-description">
                <p>Te damos la bienvenida a nuestro sistema de agendamiento de citas. 
                Aquí podrás solicitar una cita con el Obispo de manera fácil y rápida.</p>
            </div>
            
            <div class="welcome-features">
                <div class="feature-item">
                    <div class="feature-icon">📅</div>
                    <div class="feature-title">Fácil Agendamiento</div>
                    <div class="feature-desc">Proceso simple y rápido para solicitar tu cita</div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon">⏰</div>
                    <div class="feature-title">Horarios Flexibles</div>
                    <div class="feature-desc">Disponibilidad de tardes</div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon">✉️</div>
                    <div class="feature-title">Confirmación Inmediata</div>
                    <div class="feature-desc">Recibirás confirmación de tu solicitud</div>
                </div>
            </div>
            
            <button onclick="mostrarFormulario()" class="btn-primary">
                📋 Agendar Cita 
            </button>
        </div>
    `;
    
    welcomeScreen.innerHTML = welcomeHTML;
}

// Función para mostrar el formulario de citas
function mostrarFormulario() {
    welcomeScreen.style.display = 'none';
    formContainer.classList.remove('hidden');
    formContainer.style.display = 'block';
    
    // Crear el formulario si no existe
    if (!document.getElementById('appointment-form')) {
        createForm();
        setupEventListeners();
    }
}

// Función para volver a la pantalla de bienvenida
function volverABienvenida() {
    formContainer.style.display = 'none';
    formContainer.classList.add('hidden');
    confirmationDiv.classList.add('hidden');
    welcomeScreen.style.display = 'block';
    
    // Limpiar formulario si existe
    const form = document.getElementById('appointment-form');
    if (form) {
        form.reset();
        clearAllErrors();
    }
}

// Función para crear el formulario HTML
function createForm() {
    const formHTML = `
        <form id="appointment-form" class="form fade-in">
            <div id="error-messages"></div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="nombre">Nombre completo *</label>
                    <input type="text" id="nombre" name="nombre" required>
                </div>
                
                <div class="form-group">
                    <label for="telefono">Teléfono *</label>
                    <input type="tel" id="telefono" name="telefono" placeholder="Ej: 612345678" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="email">Correo electrónico *</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="fecha">Fecha de la cita *</label>
                    <input type="date" id="fecha" name="fecha" required>
                </div>
                
                <div class="form-group">
                    <label for="hora">Hora de la cita *</label>
                    <select id="hora" name="hora" required>
                        <option value="">Selecciona una hora</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="motivo">Motivo de la consulta *</label>
                <textarea id="motivo" name="motivo" placeholder="Describe brevemente el motivo de tu cita" required></textarea>
            </div>
            
            <div class="form-group">
                <label for="comentarios">Comentarios adicionales</label>
                <textarea id="comentarios" name="comentarios" placeholder="Información adicional que consideres relevante (opcional)"></textarea>
            </div>
            
            <button type="submit" class="btn">Agendar Cita</button>
        </form>
    `;
    
    formContainer.innerHTML = formHTML;
    setupTimeOptions();
    setMinDate();
}

// Función para configurar las opciones de hora
function setupTimeOptions() {
    const horaSelect = document.getElementById('hora');
    const horas = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30', '18:00'
    ];
    
    horas.forEach(hora => {
        const option = document.createElement('option');
        option.value = hora;
        option.textContent = hora;
        horaSelect.appendChild(option);
    });
}

// Función para establecer la fecha mínima (hoy)
function setMinDate() {
    const fechaInput = document.getElementById('fecha');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const minDate = tomorrow.toISOString().split('T')[0];
    fechaInput.setAttribute('min', minDate);
}

// Función para configurar event listeners
function setupEventListeners() {
    const form = document.getElementById('appointment-form');
    form.addEventListener('submit', handleSubmit);
    
    // Event listener para validación en tiempo real
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Función para manejar el envío del formulario
function handleSubmit(e) {
    e.preventDefault();
    
    if (validateForm()) {
        const formData = getFormData();
        sendAppointment(formData);
    }
}

// Función para obtener los datos del formulario
function getFormData() {
    const form = document.getElementById('appointment-form');
    const formData = new FormData(form);
    
    return {
        nombre: formData.get('nombre'),
        telefono: formData.get('telefono'),
        email: formData.get('email'),
        fecha: formData.get('fecha'),
        hora: formData.get('hora'),
        motivo: formData.get('motivo'),
        comentarios: formData.get('comentarios')
    };
}

// Función para validar todo el formulario
function validateForm() {
    let isValid = true;
    clearAllErrors();
    
    const nombre = document.getElementById('nombre');
    const telefono = document.getElementById('telefono');
    const email = document.getElementById('email');
    const fecha = document.getElementById('fecha');
    const hora = document.getElementById('hora');
    const motivo = document.getElementById('motivo');
    
    // Validar nombre
    if (!nombre.value.trim()) {
        showFieldError(nombre, 'El nombre es obligatorio');
        isValid = false;
    } else if (nombre.value.trim().length < 2) {
        showFieldError(nombre, 'El nombre debe tener al menos 2 caracteres');
        isValid = false;
    }
    
    // Validar teléfono
    if (!telefono.value.trim()) {
        showFieldError(telefono, 'El teléfono es obligatorio');
        isValid = false;
    } else if (!/^\d{9}$/.test(telefono.value.replace(/\s|-/g, ''))) {
        showFieldError(telefono, 'Ingresa un teléfono válido (9 dígitos españoles)');
        isValid = false;
    }
    
    // Validar email
    if (!email.value.trim()) {
        showFieldError(email, 'El correo electrónico es obligatorio');
        isValid = false;
    } else if (!isValidEmail(email.value)) {
        showFieldError(email, 'Ingresa un correo electrónico válido');
        isValid = false;
    }
    
    // Validar fecha
    if (!fecha.value) {
        showFieldError(fecha, 'La fecha es obligatoria');
        isValid = false;
    } else if (!isValidDate(fecha.value)) {
        showFieldError(fecha, 'La fecha debe ser posterior a hoy');
        isValid = false;
    }
    
    // Validar hora
    if (!hora.value) {
        showFieldError(hora, 'La hora es obligatoria');
        isValid = false;
    }
    
    // Validar motivo
    if (!motivo.value.trim()) {
        showFieldError(motivo, 'El motivo de la consulta es obligatorio');
        isValid = false;
    } else if (motivo.value.trim().length < 10) {
        showFieldError(motivo, 'El motivo debe tener al menos 10 caracteres');
        isValid = false;
    }
    
    return isValid;
}

// Función para validar un campo individual
function validateField(e) {
    const field = e.target;
    clearFieldError(field);
    
    switch(field.id) {
        case 'nombre':
            if (field.value.trim() && field.value.trim().length < 2) {
                showFieldError(field, 'El nombre debe tener al menos 2 caracteres');
            }
            break;
        case 'telefono':
            if (field.value.trim() && !/^\d{9}$/.test(field.value.replace(/\s|-/g, ''))) {
                showFieldError(field, 'Ingresa un teléfono válido (9 dígitos españoles)');
            }
            break;
        case 'email':
            if (field.value.trim() && !isValidEmail(field.value)) {
                showFieldError(field, 'Ingresa un correo electrónico válido');
            }
            break;
        case 'fecha':
            if (field.value && !isValidDate(field.value)) {
                showFieldError(field, 'La fecha debe ser posterior a hoy');
            }
            break;
        case 'motivo':
            if (field.value.trim() && field.value.trim().length < 10) {
                showFieldError(field, 'El motivo debe tener al menos 10 caracteres');
            }
            break;
    }
}

// Función para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para validar fecha
function isValidDate(dateString) {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedDate > today;
}

// Función para mostrar error en un campo
function showFieldError(field, message) {
    field.style.borderColor = '#dc3545';
    
    // Remover error anterior si existe
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Crear nuevo mensaje de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '14px';
    errorDiv.style.marginTop = '5px';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

// Función para limpiar error de un campo
function clearFieldError(field) {
    if (typeof field === 'object' && field.target) {
        field = field.target;
    }
    
    field.style.borderColor = '#e1e5e9';
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Función para limpiar todos los errores
function clearAllErrors() {
    const errorMessages = document.getElementById('error-messages');
    errorMessages.innerHTML = '';
    
    const fieldErrors = document.querySelectorAll('.field-error');
    fieldErrors.forEach(error => error.remove());
    
    const fields = document.querySelectorAll('input, textarea, select');
    fields.forEach(field => {
        field.style.borderColor = '#e1e5e9';
    });
}

// Función para simular el envío de la cita
async function sendAppointment(data) {
    // Mostrar loading
    const submitBtn = document.querySelector('.btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    try {
        // Verificar disponibilidad antes de guardar
        const isAvailable = await verificarDisponibilidad(data.fecha, data.hora);
        
        if (!isAvailable) {
            throw new Error('Lo sentimos, ese horario ya no está disponible. Por favor, selecciona otro.');
        }
        
        // Guardar en Supabase
        const result = await guardarCitaSupabase(data);
        
        if (result.success) {
            showConfirmation(data, result.id);
        } else {
            throw new Error('Error al guardar la cita');
        }
        
    } catch (error) {
        console.error('Error al enviar cita:', error);
        showError(error.message || 'Hubo un problema al agendar tu cita. Por favor, intenta de nuevo.');
    } finally {
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Función para mostrar confirmación
function showConfirmation(data, citaId) {
    const confirmationHTML = `
        <div class="confirmation fade-in">
            <h2>¡Cita agendada exitosamente!</h2>
            <div style="margin: 20px 0; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
                <p><strong>ID de Cita:</strong> #${citaId}</p>
                <p><strong>Nombre:</strong> ${data.nombre}</p>
                <p><strong>Fecha:</strong> ${formatDate(data.fecha)}</p>
                <p><strong>Hora:</strong> ${data.hora}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Teléfono:</strong> ${data.telefono}</p>
            </div>
            <p>Tu cita ha sido guardada en nuestro sistema.</p>
            <p>El profesional se pondrá en contacto contigo para confirmar la disponibilidad.</p>
            <p><strong>Importante:</strong> Guarda el ID de tu cita para futuras referencias.</p>
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px; flex-wrap: wrap;">
                <button onclick="resetForm()" class="btn">Agendar otra cita</button>
                <button onclick="volverABienvenida()" class="btn" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">Volver al inicio</button>
                <button onclick="cerrarAplicacion()" class="btn" style="background: #6c757d;">Salir</button>
            </div>
        </div>
    `;
    
    formContainer.style.display = 'none';
    confirmationDiv.innerHTML = confirmationHTML;
    confirmationDiv.classList.remove('hidden');
}

// Función para formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
}

// Función para resetear el formulario
function resetForm() {
    formContainer.style.display = 'block';
    confirmationDiv.classList.add('hidden');
    document.getElementById('appointment-form').reset();
    clearAllErrors();
}

// Función para mostrar errores generales
function showError(message) {
    const errorMessages = document.getElementById('error-messages');
    errorMessages.innerHTML = `
        <div class="error">
            <strong>Error:</strong> ${message}
        </div>
    `;
    errorMessages.scrollIntoView({ behavior: 'smooth' });
}

// Función para cerrar la aplicación
function cerrarAplicacion() {
    const confirmacion = confirm('¿Estás seguro de que quieres salir de la aplicación?');
    
    if (confirmacion) {
        // Mostrar mensaje de despedida
        const despedidaHTML = `
            <div class="confirmation fade-in">
                <h2>¡Gracias por usar nuestro sistema!</h2>
                <p style="margin: 20px 0;">Tu cita ha sido registrada exitosamente.</p>
                <p>Nos pondremos en contacto contigo pronto.</p>
                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                    Puedes cerrar esta ventana del navegador.
                </p>
            </div>
        `;
        
        formContainer.style.display = 'none';
        confirmationDiv.innerHTML = despedidaHTML;
        confirmationDiv.classList.remove('hidden');
        
        // Opcional: cerrar la ventana después de 3 segundos (solo funciona si la ventana fue abierta por JavaScript)
        setTimeout(() => {
            try {
                window.close();
            } catch (e) {
                // Si no se puede cerrar automáticamente, el usuario puede cerrarla manualmente
                console.log('La ventana debe cerrarse manualmente');
            }
        }, 3000);
    }
}

// Inicializar la aplicación cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', init);