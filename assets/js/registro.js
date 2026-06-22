// ══════════════════════════════════════════════════════
//  FRÍO CARS — registro.js  (v3 — rol + pendiente)
// ══════════════════════════════════════════════════════

const API = 'https://friocars-backend.onrender.com/api';

document.getElementById('registroForm').addEventListener('submit', async (e) => {

    e.preventDefault();

    const btn = document.getElementById('btnReg');

    // ── Capturar datos ────────────────────────────────
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const username = document.getElementById('username').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;
    const confirmar = document.getElementById('confirmar').value;
    const terminos = document.getElementById('terminos').checked;

    // Rol seleccionado
    const rolInput = document.querySelector('input[name="rol"]:checked');
    const rol = rolInput ? rolInput.value : null;

    // ── Validaciones ──────────────────────────────────
    if (!rol) {
        return showAlert('Selecciona cómo vas a usar el sistema (Trabajador o Cliente).', 'err');
    }
    if (!nombre || !apellido || !username || !correo || !password || !confirmar) {
        return showAlert('Por favor completa todos los campos.', 'err');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        return showAlert('Ingresa un correo electrónico válido.', 'err');
    }
    if (password.length < 8) {
        return showAlert('La contraseña debe tener al menos 8 caracteres.', 'err');
    }
    if (password !== confirmar) {
        return showAlert('Las contraseñas no coinciden.', 'err');
    }
    if (!terminos) {
        return showAlert('Debes aceptar los términos y condiciones.', 'err');
    }

    // ── Loading ───────────────────────────────────────
    btn.disabled = true;
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" style="width:17px;height:17px;stroke:#fff;stroke-width:2;fill:none;animation:spin .8s linear infinite">
            <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>
        </svg>
        Enviando solicitud...`;
    document.getElementById('alert').style.display = 'none';

    try {

        // ── Petición al backend ───────────────────────
        const response = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, apellido, username, correo, password, rol })
        });

        const data = await response.json();

        if (response.ok) {

            // ── Éxito — solicitud pendiente ───────────
            const rolLabel = rol === 'trabajador' ? 'Trabajador' : 'Cliente';

            showAlert(
                `✅ Solicitud enviada como ${rolLabel}. Un administrador revisará tu cuenta y te dará acceso pronto. Puedes cerrar esta ventana.`,
                'ok'
            );

            // Marcar progreso completo
            ['pd2', 'pd3'].forEach(id => document.getElementById(id).classList.add('done'));
            ['pt2', 'pt3'].forEach(id => document.getElementById(id).classList.add('done'));

            // Deshabilitar formulario
            document.getElementById('registroForm').querySelectorAll('input, button').forEach(el => el.disabled = true);

            btn.innerHTML = '✓ Solicitud enviada';
            btn.style.background = '#16a34a';

            // Redirigir al login después de 4 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 4500);

        } else {

            // ── Error del backend ─────────────────────
            showAlert(data.message || 'Error al enviar la solicitud. Intenta de nuevo.', 'err');
            btn.disabled = false;
            btn.innerHTML = 'Enviar solicitud de acceso';
        }

    } catch (error) {

        console.error('Error registro:', error);
        showAlert('Error de conexión con el servidor. Verifica tu internet e intenta de nuevo.', 'err');
        btn.disabled = false;
        btn.innerHTML = 'Enviar solicitud de acceso';
    }

});

// ── Helper alert ─────────────────────────────────────
function showAlert(msg, type) {
    const el = document.getElementById('alert');
    el.textContent = msg;
    el.className = 'alert ' + type;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}