/**
 * assets/js/sidebar.js
 * Carga component/sidebar.html via fetch() y activa el link de la página actual.
 */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // ── 1. Cargar HTML de la sidebar ──────────────────────────────────────
    const res = await fetch('/../component/sidebar.html');
    const html = await res.text();
    document.getElementById('sidebar-container').innerHTML = html;

    // ── 2. Marcar body para ajustar margin del main ───────────────────────
    document.body.classList.add('has-sidebar');

    // ── 3. Leer el tema guardado (comparte localStorage con el login) ──────
    const tema = localStorage.getItem('a11y-tema');
    const temas = ['high-contrast', 'sepia', 'soft-dark'];
    temas.forEach(t => document.body.classList.remove(t));
    if (tema && tema !== 'normal') document.body.classList.add(tema);

    // ── 4. Escala de texto ─────────────────────────────────────────────────
    const esc = parseFloat(localStorage.getItem('a11y-esc') || '1');
    document.documentElement.style.setProperty('--font-scale', esc);

    // ── 5. Activar link de la página actual ────────────────────────────────
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('#fc-sidebar .sb-link').forEach(link => {
      link.classList.remove('sb-active');
      if (link.getAttribute('href') === currentPage) {
        link.classList.add('sb-active');
      }
    });

    // ── 6. Datos del usuario desde localStorage ────────────────────────────
    try {
      const user = JSON.parse(
        localStorage.getItem('fc_user') ||
        sessionStorage.getItem('fc_user') || '{}'
      );
      if (user.nombre) {
        document.getElementById('sb-username').textContent = user.nombre;
        document.getElementById('sb-avatar').textContent =
          user.nombre.charAt(0).toUpperCase();
      }
      if (user.rol) {
        document.getElementById('sb-user-role').textContent = 'Rol: ' + user.rol;
      }
    } catch (_) {}

    // ── 7. Toggle móvil ────────────────────────────────────────────────────
    const sidebar = document.getElementById('fc-sidebar');
    const toggle  = document.getElementById('sb-toggle');
    const overlay = document.getElementById('sb-overlay');

    if (toggle && overlay) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
      });
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
    }

  } catch (error) {
    console.error('Error cargando sidebar:', error);
  }
});

// ── Logout global ────────────────────────────────────────────────────────────
function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '../pages/login.html';
}
