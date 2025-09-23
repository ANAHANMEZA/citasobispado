// Script para redirección inicial a página de bienvenida
(function() {
    // Verificar si el usuario viene directamente sin haber visto la bienvenida
    const urlParams = new URLSearchParams(window.location.search);
    const fromWelcome = urlParams.get('from') === 'welcome';
    const hasVisitedWelcome = localStorage.getItem('visited_welcome');
    
    // Si no viene de bienvenida y no ha visitado antes, redirigir
    if (!fromWelcome && !hasVisitedWelcome) {
        // Marcar que será redirigido para evitar bucle
        localStorage.setItem('redirecting_to_welcome', 'true');
        window.location.href = 'bienvenida.html';
        return;
    }
    
    // Si viene de bienvenida, marcar como visitado
    if (fromWelcome) {
        localStorage.setItem('visited_welcome', 'true');
        localStorage.removeItem('redirecting_to_welcome');
        
        // Limpiar la URL para que quede más limpia
        if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    // Verificar si se está intentando acceder después de una redirección fallida
    const redirectingFlag = localStorage.getItem('redirecting_to_welcome');
    if (redirectingFlag) {
        // Si llegó aquí después de intentar redireccionar, limpiar flag y continuar
        localStorage.removeItem('redirecting_to_welcome');
        localStorage.setItem('visited_welcome', 'true');
    }
})();