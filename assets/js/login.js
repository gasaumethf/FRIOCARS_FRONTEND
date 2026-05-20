// =============================
// ELEMENTOS
// =============================

const form = document.getElementById('loginForm');

const mensaje = document.getElementById('mensaje');


// =============================
// LOGIN
// =============================

form.addEventListener('submit', async (e) => {

    e.preventDefault();

    // DATOS

    const username = document.getElementById('username').value.trim();

    const password = document.getElementById('password').value.trim();

    // VALIDACION

    if(!username || !password){

        mensaje.style.color = "red";

        mensaje.innerText = "Complete todos los campos";

        return;

    }

    try {

        // =============================
        // PETICION LOGIN
        // =============================

        const response = await fetch('http://localhost:8000/api/auth/login', {

            method: 'POST',

            headers: {

                'Content-Type': 'application/json'

            },

            body: JSON.stringify({

                username,
                password

            })

        });

        // RESPUESTA

        const data = await response.json();

        // =============================
        // LOGIN EXITOSO
        // =============================

        if(response.ok){

            mensaje.style.color = "#22c55e";

            mensaje.innerText = "Login exitoso";

            // =============================
            // GUARDAR SESION
            // =============================

            localStorage.setItem("usuario", JSON.stringify({

                id_usuario: data.usuario.id_usuario,

                username: data.usuario.username,

                rol: data.usuario.rol || "usuario"

            }));

            console.log("USUARIO LOGEADO:", data.usuario);

            // =============================
            // REDIRECCION
            // =============================

            setTimeout(() => {

                window.location.href = "../views/dashboard.html";

            }, 700);

        }

        // =============================
        // ERROR LOGIN
        // =============================

        else {

            mensaje.style.color = "#ef4444";

            mensaje.innerText = data.message || "Credenciales incorrectas";

        }

    }

    // =============================
    // ERROR SERVIDOR
    // =============================

    catch (error) {

        console.error(error);

        mensaje.style.color = "#ef4444";

        mensaje.innerText = "Error conectando con el servidor";

    }

});