// ══════════════════════════════════════════════════════
//  FRÍO CARS — sidebar.js  (v2 — menú por rol)
// ══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const respuesta = await fetch('/../component/sidebar.html');
        const sidebarHTML = await respuesta.text();
        document.getElementById('sidebar-container').innerHTML = sidebarHTML;

        // Aplicar filtro de menú según rol
        filtrarMenuPorRol();

    } catch (error) {
        console.error('Error cargando sidebar:', error);
    }
});

// ── Filtrar items del menú según rol ─────────────────
function filtrarMenuPorRol() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const rol = usuario.rol || 'cliente';

    // Definir qué páginas puede ver cada rol
    // admin → ve todo (no se toca nada)
    // trabajador → solo servicios, historial, carrito, perfil, reportes
    // cliente → solo ventas, cotizacion, carrito, perfil

    const permitidosPorRol = {
        trabajador: [
            'servicios.html',
            'Historial.html',
            'carrito.html',
            'Usuarios.html',
            'Reportes.html',
            'dashboard_trabajador.html'
        ],
        cliente: [
            'dashboard_cliente.html',
            'ventas.html',
            'cotizacion.html',
            'carrito.html',
            'Usuarios.html'
        ]
    };

    if (rol === 'admin') return; // admin ve todo

    const permitidos = permitidosPorRol[rol] || [];

    // Ocultar links no permitidos
    document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
        const pagina = link.dataset.page;
        if (!permitidos.includes(pagina)) {
            link.style.display = 'none';
        }
    });

    // Ocultar separadores y labels de secciones vacías
    // Si el trabajador no ve nada de "Ventas/Cotización/Inventario",
    // ocultar el primer bloque de navegación y dejar solo Servicios+Historial
    limpiarSeparadoresVacios();

    // Cambiar "Inicio" para que apunte al dashboard correcto según rol
    const linkInicio = document.querySelector('.sidebar-link[data-page="dashboard.html"]');
    if (linkInicio) {
        if (rol === 'trabajador') {
            linkInicio.href = 'dashboard_trabajador.html';
            linkInicio.dataset.page = 'dashboard_trabajador.html';
            linkInicio.style.display = 'flex'; // asegurarse que se ve
        } else if (rol === 'cliente') {
            linkInicio.href = 'ventas.html';
            linkInicio.style.display = 'none'; // cliente no tiene dashboard propio
        }
    }

    // Marcar página activa correctamente
    const currentPage = window.location.pathname.split('/').pop() || '';
    document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
        link.removeAttribute('data-active');
        if (link.dataset.page === currentPage) link.setAttribute('data-active', 'true');
    });
}

// Ocultar separadores y labels de secciones que quedaron completamente vacías
function limpiarSeparadoresVacios() {
    const nav = document.querySelector('#fc-sidebar nav');
    if (!nav) return;

    const children = Array.from(nav.children);

    children.forEach((el, i) => {
        // Si es un label de sección (el <p> uppercase)
        if (el.tagName === 'P' && el.style.textTransform === 'uppercase' ||
            el.style.fontSize === '.62rem') {

            // Buscar los links de esa sección (hasta el siguiente separador o label)
            let j = i + 1;
            let tieneVisibles = false;
            while (j < children.length) {
                const next = children[j];
                // Si es otro separador o label, parar
                if ((next.tagName === 'P') || (next.tagName === 'DIV' && next.style.height === '1px')) break;
                if (next.tagName === 'A' && next.style.display !== 'none') {
                    tieneVisibles = true;
                    break;
                }
                j++;
            }

            if (!tieneVisibles) el.style.display = 'none';
        }

        // Si es un separador (div altura 1px), verificar si hay contenido visible
        // antes y después — si no, ocultarlo
        if (el.tagName === 'DIV' && el.style.height === '1px') {
            const prev = children[i - 1];
            const next = children[i + 1];
            const prevOculto = !prev || prev.style.display === 'none';
            const nextOculto = !next || next.style.display === 'none' || (next.tagName === 'DIV' && next.style.height === '1px');
            if (prevOculto || nextOculto) el.style.display = 'none';
        }
    });
}

// ── LOGOUT GLOBAL ─────────────────────────────────────
function logout() {
    localStorage.clear();
    window.location.href = '../pages/login.html';
}