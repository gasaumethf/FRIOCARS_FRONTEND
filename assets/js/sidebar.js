// ══════════════════════════════════════════════════════
//  FRÍO CARS — sidebar.js
// ══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const respuesta  = await fetch('/../component/sidebar.html');
        const sidebarHTML = await respuesta.text();
        document.getElementById('sidebar-container').innerHTML = sidebarHTML;
    } catch (error) {
        console.error('Error cargando sidebar:', error);
    }
});

// LOGOUT GLOBAL
function logout() {
    localStorage.clear();
    window.location.href = '../pages/login.html';
}