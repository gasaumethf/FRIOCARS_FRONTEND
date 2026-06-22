// ══════════════════════════════════════════════════════
//  FRÍO CARS — login.js  (v2 — guarda token + rol)
// ══════════════════════════════════════════════════════

const form = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');

// Rutas por rol
const RUTAS_ROL = {
    admin: '../views/dashboard.html',
    trabajador: '../views/dashboard_trabajador.html',
    cliente: '../views/ventas.html'

};

form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        mensaje.style.color = '#ef4444';
        mensaje.innerText = 'Complete todos los campos';
        return;
    }

    try {

        const response = await fetch('https://friocars-backend.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {

            mensaje.style.color = '#22c55e';
            mensaje.innerText = 'Login exitoso';

            // ── Guardar sesión completa ──────────────────────
            localStorage.setItem('usuario', JSON.stringify({
                id_usuario: data.usuario.id_usuario,
                username: data.usuario.username,
                nombre: data.usuario.nombre,
                apellido: data.usuario.apellido,
                correo: data.usuario.correo,
                rol: data.usuario.rol || 'cliente'
            }));

            // Guardar el token JWT por separado
            localStorage.setItem('token', data.token);

            console.log('USUARIO LOGEADO:', data.usuario.username, '| ROL:', data.usuario.rol);

            // ── Redirigir según rol ──────────────────────────
            const destino = RUTAS_ROL[data.usuario.rol] || '../views/dashboard.html';

            setTimeout(() => {
                window.location.href = destino;
            }, 700);

        } else {

            mensaje.style.color = '#ef4444';
            mensaje.innerText = data.message || 'Credenciales incorrectas';

        }

    } catch (error) {

        console.error(error);
        mensaje.style.color = '#ef4444';
        mensaje.innerText = 'Error conectando con el servidor';

    }

});