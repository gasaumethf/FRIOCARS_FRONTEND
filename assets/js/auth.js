// ══════════════════════════════════════════════════════
//  FRÍO CARS — auth.js  (v2 — bloqueo real por rol)
//  Incluir en TODAS las páginas protegidas
// ══════════════════════════════════════════════════════

// ── Permisos por página ──────────────────────────────
//  Define qué roles pueden ver cada archivo.
//  Agrega aquí cada página nueva que crees.
// ─────────────────────────────────────────────────────
const PERMISOS = {
    // Solo admin
    'dashboard.html': ['admin'],
    'reportes.html': ['admin'],
    'tecnicos.html': ['admin'],
    'clientes.html': ['admin'],
    'inventario.html': ['admin'],

    // Admin y trabajador
    'servicios.html': ['admin', 'trabajador'],
    'Historial.html': ['admin', 'trabajador'],
    'ordenes.html': ['admin', 'trabajador'],

    // Admin y cliente
    'ventas.html': ['admin', 'cliente'],
    'carrito.html': ['admin', 'cliente'],
    'cotizacion.html': ['admin', 'cliente'],
    'perfil.html': ['admin', 'trabajador', 'cliente'],
};

// ── Función principal ────────────────────────────────
(function verificarAcceso() {

    const usuarioRaw = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');

    // 1. Si no hay sesión → login
    if (!usuarioRaw || !token) {
        redirigirLogin();
        return;
    }

    let usuario;
    try {
        usuario = JSON.parse(usuarioRaw);
    } catch {
        redirigirLogin();
        return;
    }

    // 2. Si no tiene rol válido → login
    const rolesValidos = ['admin', 'trabajador', 'cliente'];
    if (!usuario.rol || !rolesValidos.includes(usuario.rol)) {
        redirigirLogin();
        return;
    }

    // 3. Verificar que el token no esté vencido (decodificación básica sin librería)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const ahora = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < ahora) {
            // Token vencido
            logout();
            return;
        }
    } catch {
        redirigirLogin();
        return;
    }

    // 4. Verificar permiso para esta página
    const pagina = window.location.pathname.split('/').pop();
    const rolesPage = PERMISOS[pagina];

    if (rolesPage && !rolesPage.includes(usuario.rol)) {
        // Tiene sesión pero no tiene permiso para esta página
        redirigirSinPermiso(usuario.rol);
        return;
    }

    // 5. Todo OK — exponer usuario globalmente para que otras páginas lo usen
    window.usuarioActual = usuario;

})();


// ── Helpers ──────────────────────────────────────────

function redirigirLogin() {
    // Evitar loop si ya estamos en index
    if (!window.location.pathname.includes('index')) {
        window.location.href = '../index.html';
    }
}

function redirigirSinPermiso(rol) {
    // Llevar a la página que sí le corresponde según su rol
    const destinos = {
        trabajador: '../views/servicios.html',
        cliente: '../views/ventas.html',
        admin: '../views/dashboard.html'
    };
    window.location.href = destinos[rol] || '../index.html';
}

function logout() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    window.location.href = '../index.html';
}