// Script de prueba mejorado para verificar el funcionamiento del cierre de sesión

console.log('🧪 SCRIPT DE PRUEBA - CIERRE DE SESIÓN OPTIMIZADO');

// Función para medir tiempo de redirección
function medirTiempoRedireccion() {
    const inicio = Date.now();
    
    // Escuchar cuando cambie la página
    window.addEventListener('beforeunload', () => {
        const tiempo = Date.now() - inicio;
        console.log(`⏱️ Tiempo hasta redirección: ${tiempo}ms`);
    });
}

// Función para verificar todas las funciones de logout
function verificarFuncionesLogout() {
    const funciones = [
        'cerrarSesion',
        'cerrarSesionRapida', 
        'logoutInmediato',
        'cerrarSesionLocal'
    ];
    
    funciones.forEach(func => {
        if (typeof window[func] === 'function') {
            console.log(`✅ ${func}() disponible`);
        } else {
            console.log(`❌ ${func}() NO disponible`);
        }
    });
}

// Función de prueba de limpieza rápida
function probarLimpiezaRapida() {
    console.log('📝 Probando limpieza rápida de datos...');
    
    // Simular datos de sesión
    localStorage.setItem('test_session', 'test_value');
    localStorage.setItem('obispado_session', 'test_obispo');
    
    console.log('📊 Datos antes:', {
        test: localStorage.getItem('test_session'),
        obispo: localStorage.getItem('obispado_session')
    });
    
    // Limpiar con función local
    if (typeof cerrarSesionLocal === 'function') {
        cerrarSesionLocal();
    }
    
    console.log('📊 Datos después:', {
        test: localStorage.getItem('test_session'),
        obispo: localStorage.getItem('obispado_session')
    });
}

// Función para probar redirección manual
function probarRedireccionManual() {
    console.log('� Probando redirección manual...');
    
    // Crear botón de prueba
    const botonPrueba = document.createElement('button');
    botonPrueba.textContent = '🧪 Probar Redirección';
    botonPrueba.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        padding: 10px;
        background: #ff6b35;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    `;
    
    botonPrueba.onclick = () => {
        console.log('🚀 Iniciando redirección de prueba...');
        medirTiempoRedireccion();
        setTimeout(() => {
            window.location.href = 'bienvenida.html';
        }, 100);
    };
    
    document.body.appendChild(botonPrueba);
}

// Ejecutar todas las pruebas si estamos en admin
if (window.location.pathname.includes('admin.html')) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('🎯 Iniciando pruebas de logout...');
            verificarFuncionesLogout();
            probarLimpiezaRapida();
            probarRedireccionManual();
            
            // Mostrar estadísticas de rendimiento
            if (window.performance) {
                console.log('⚡ Rendimiento de página:', {
                    carga: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
                    dom: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart
                });
            }
        }, 1000);
    });
}

// Monitor de redirección
let redireccionIntentada = false;
window.addEventListener('beforeunload', () => {
    if (!redireccionIntentada) {
        redireccionIntentada = true;
        console.log('📤 Redirección detectada');
    }
});

console.log('🎯 Script de prueba optimizado cargado correctamente');