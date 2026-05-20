const tablaClientes = document.getElementById("tablaClientes");

const totalClientes = document.getElementById("totalClientes");

const clienteForm = document.getElementById("clienteForm");

const buscarCliente = document.getElementById("buscarCliente");

let clienteEditando = null;

let clientesGlobal = [];


// =============================
// CARGAR CLIENTES
// =============================

async function cargarClientes() {

    try {

        const response = await fetch("http://localhost:8000/api/clientes");

        const clientes = await response.json();

        clientesGlobal = clientes;

        renderClientes(clientes);

    } catch (error) {

        console.error("Error cargando clientes", error);

    }

}


// =============================
// RENDER CLIENTES
// =============================

function renderClientes(clientes){

    tablaClientes.innerHTML = "";

    totalClientes.textContent = clientes.length;

    clientes.forEach(cliente => {

        const fila = `
        
            <tr class="border-b border-white/5 hover:bg-white/5 transition duration-300">

                <!-- CLIENTE -->

                <td class="py-5">

                    <div class="flex items-center gap-4">

                        <!-- AVATAR -->

                        <div class="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-xl">

                            👤

                        </div>

                        <div>

                            <h3 class="font-semibold text-white">

                                ${cliente.nombre} ${cliente.apellido}

                            </h3>

                            <p class="text-slate-400 text-sm">

                                ${cliente.correo || 'Sin correo'}

                            </p>

                        </div>

                    </div>

                </td>

                <!-- DOCUMENTO -->

                <td class="py-5 text-slate-300">

                    ${cliente.numero_documento}

                </td>

                <!-- TELEFONO -->

                <td class="py-5 text-slate-300">

                    ${cliente.telefono}

                </td>

                <!-- PUNTOS -->

                <td class="py-5">

                    <span class="bg-cyan-500/10 text-cyan-300 px-4 py-2 rounded-xl text-sm">

                        ${cliente.puntos || 0} pts

                    </span>

                </td>

                <!-- ACCIONES -->

                <td class="py-5">

                    <div class="flex gap-3">

                        <!-- EDITAR -->

                        <button
                            onclick='editarCliente(${JSON.stringify(cliente)})'
                            class="bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 px-4 py-2 rounded-xl transition">

                            Editar

                        </button>

                        <!-- ELIMINAR -->

                        <button
                            onclick="eliminarCliente(${cliente.id_cliente})"
                            class="bg-red-500/15 hover:bg-red-500/25 text-red-300 px-4 py-2 rounded-xl transition">

                            Eliminar

                        </button>

                    </div>

                </td>

            </tr>

        `;

        tablaClientes.innerHTML += fila;

    });

}


// =============================
// GUARDAR CLIENTE
// =============================

clienteForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const data = {

        numero_documento: document.getElementById("numero_documento").value,

        nombre: document.getElementById("nombre").value,

        apellido: document.getElementById("apellido").value,

        telefono: document.getElementById("telefono").value,

        correo: document.getElementById("correo").value,

        direccion: document.getElementById("direccion").value

    };

    try {

        // =============================
        // ACTUALIZAR
        // =============================

        if(clienteEditando){

            await fetch(`http://localhost:8000/api/clientes/${clienteEditando}`, {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)

            });

            clienteEditando = null;

        } else {

            // =============================
            // CREAR
            // =============================

            await fetch("http://localhost:8000/api/clientes", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)

            });

        }

        // LIMPIAR

        clienteForm.reset();

        // RECARGAR

        cargarClientes();

    } catch (error) {

        console.error("Error guardando cliente", error);

    }

});


// =============================
// EDITAR CLIENTE
// =============================

function editarCliente(cliente){

    clienteEditando = cliente.id_cliente;

    document.getElementById("numero_documento").value = cliente.numero_documento;

    document.getElementById("nombre").value = cliente.nombre;

    document.getElementById("apellido").value = cliente.apellido;

    document.getElementById("telefono").value = cliente.telefono;

    document.getElementById("correo").value = cliente.correo;

    document.getElementById("direccion").value = cliente.direccion;

}


// =============================
// ELIMINAR CLIENTE
// =============================

async function eliminarCliente(id){

    const confirmar = confirm("¿Deseas eliminar este cliente?");

    if(!confirmar) return;

    try{

        await fetch(`http://localhost:8000/api/clientes/${id}`, {

            method: "DELETE"

        });

        cargarClientes();

    }catch(error){

        console.error("Error eliminando cliente", error);

    }

}


// =============================
// BUSCADOR
// =============================

buscarCliente.addEventListener("input", (e) => {

    const texto = e.target.value.toLowerCase();

    const filtrados = clientesGlobal.filter(cliente =>

        cliente.nombre.toLowerCase().includes(texto) ||

        cliente.apellido.toLowerCase().includes(texto) ||

        cliente.numero_documento.toLowerCase().includes(texto)

    );

    renderClientes(filtrados);

});


// =============================
// INICIAR
// =============================

cargarClientes();