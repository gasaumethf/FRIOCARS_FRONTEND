const formulario = document.getElementById('registroForm');

formulario.addEventListener('submit', async (e) => {

    e.preventDefault();

    // CAPTURAR DATOS

    const nombre = document.getElementById('nombre').value.trim();

    const apellido = document.getElementById('apellido').value.trim();

    const username = document.getElementById('username').value.trim();

    const correo = document.getElementById('correo').value.trim();

    const password = document.getElementById('password').value;

    const confirmarPassword = document.getElementById('confirmarPassword').value;

    const mensaje = document.getElementById('mensaje');

    // LIMPIAR MENSAJES

    mensaje.innerHTML = '';

    // VALIDAR PASSWORDS

    if (password !== confirmarPassword) {

        mensaje.innerHTML = `
            <p class="text-red-500">
                Las contraseñas no coinciden
            </p>
        `;

        return;
    }

    // VALIDAR PASSWORD

    if (password.length < 6) {

        mensaje.innerHTML = `
            <p class="text-red-500">
                La contraseña debe tener mínimo 6 caracteres
            </p>
        `;

        return;
    }

    try {

        // ENVIAR DATOS

        const respuesta = await fetch('http://127.0.0.1:8000/api/auth/register', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                nombre,
                apellido,
                username,
                correo,
                password

            })

        });

        const data = await respuesta.json();

        // SI TODO SALE BIEN

        if (respuesta.ok) {

            mensaje.innerHTML = `
                <p class="text-green-600 font-semibold">
             Usuario registrado cor  rectamente.
             Redirigiendo al inicio de sesión...
            </p>
            `;

            // GUARDAR SESION

            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            // REDIRECCIONAR

            setTimeout(() => {

                window.location.href = 'login.html';

            }, 1500);

        } else {

            mensaje.innerHTML = `
                <p class="text-red-500">
                    ${data.message}
                </p>
            `;
        }

    } catch (error) {

        console.error(error);

        mensaje.innerHTML = `
            <p class="text-red-500">
                Error de conexión con el servidor
            </p>
        `;
    }

});