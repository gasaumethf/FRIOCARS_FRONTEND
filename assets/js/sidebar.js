document.addEventListener('DOMContentLoaded', async () => {

    try {

        // CARGAR SIDEBAR
        const respuesta = await fetch('/../component/sidebar.html');
        const sidebarHTML = await respuesta.text();

        // INSERTAR SIDEBAR
        document.getElementById('sidebar-container').innerHTML = sidebarHTML;

        // ACTIVAR LINK ACTUAL
        const currentPage = window.location.pathname.split('/').pop();
        const links = document.querySelectorAll('aside nav a.sidebar-link');

        links.forEach(link => {
            const href = link.getAttribute('href');

            // Limpiar estado activo
            link.classList.remove('bg-blue-600', 'text-white', 'shadow-lg', 'shadow-blue-500/20');
            link.removeAttribute('data-active');
            link.style.removeProperty('color');

            // Activar página actual
            if (href === currentPage) {
                link.setAttribute('data-active', 'true');
                // La clase data-active es manejada por CSS en el sidebar
            }
        });

    } catch (error) {
        console.error('Error cargando sidebar:', error);
    }

});

// LOGOUT GLOBAL
function logout() {
    localStorage.clear();
    window.location.href = '../pages/login.html';
}
