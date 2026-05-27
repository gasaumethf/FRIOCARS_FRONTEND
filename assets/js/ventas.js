let carrito = [];

//  CARGAR PRODUCTOS
// CARGAR PRODUCTOS
async function cargarProductos() {

    try {

        const res = await fetch("https://friocars-backend.onrender.com/api/productos");

        // VALIDAR RESPUESTA
        if (!res.ok) {
            throw new Error("Error obteniendo productos");
        }

        const productos = await res.json();

        console.log("PRODUCTOS:", productos);

        const contenedor = document.getElementById("listaProductos");

        // LIMPIAR CONTENEDOR
        contenedor.innerHTML = "";

        productos.forEach(p => {

            contenedor.innerHTML += `
                <div class="bg-white/10 border border-white/10 
                rounded-3xl p-5 shadow-xl backdrop-blur-xl">

                    <h3 class="text-2xl font-bold text-white mb-3">
                        ${p.nombre}
                    </h3>

                    <p class="text-slate-300 mb-2">
                        Categoría: ${p.categoria || "Sin categoría"}
                    </p>

                    <p class="text-green-400 font-bold text-xl mb-2">
                        $${p.precio}
                    </p>

                    <p class="text-slate-400 mb-4">
                        Stock: ${p.stock}
                    </p>

                    <button 
                        onclick='agregarAlCarrito(${JSON.stringify(p)})'
                        class="bg-blue-600 hover:bg-blue-700 
                        text-white px-4 py-2 rounded-xl w-full">

                        Agregar
                    </button>

                </div>
            `;
        });

    } catch (error) {

        console.error("Error cargando productos", error);

    }
}


//  AGREGAR AL CARRITO
function agregarAlCarrito(producto) {

    const existente = carrito.find(p => p.id_producto === producto.id_producto);

    if (existente) {
        existente.cantidad++;
    } else {
        producto.cantidad = 1;
        carrito.push(producto);
    }

    renderCarrito();
}


//  RENDER CARRITO
function renderCarrito() {
    const tabla = document.getElementById("carrito");
    const totalSpan = document.getElementById("total");

    tabla.innerHTML = "";
    let total = 0;

    carrito.forEach(p => {
        const subtotal = p.precio * p.cantidad;
        total += subtotal;

        tabla.innerHTML += `
    <tr>
        <td>${p.nombre}</td>
        <td>${p.cantidad}</td>
        <td>$${p.precio}</td>
        <td>$${subtotal}</td>
        <td>
            <button onclick="eliminarDelCarrito(${p.id_producto})" class="text-red-600">
                ❌
            </button>
        </td>
    </tr>
`;
    });

    totalSpan.innerText = total;
}


function eliminarDelCarrito(id) {

    const producto = carrito.find(p => p.id_producto === id);

    if (producto.cantidad > 1) {
        producto.cantidad--;
    } else {
        carrito = carrito.filter(p => p.id_producto !== id);
    }

    renderCarrito();
}




// GUARDAR VENTAS 

async function guardarVenta() {

    if (carrito.length === 0) {
        alert("Carrito vacío");
        return;
    }

    try {

        const res = await fetch("https://friocars-backend.onrender.com/api/ventas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ productos: carrito })
        });

        const data = await res.json();

        //  GUARDAR INFO PARA FACTURA
        localStorage.setItem("factura", JSON.stringify(carrito));

        localStorage.setItem("cliente", document.getElementById("clienteNombre").value);

        //  OPCIONAL: guardar total también
        localStorage.setItem("totalFactura", data.total);

        //  LIMPIAR CARRITO (ANTES DE SALIR)
        carrito = [];

        //  REDIRIGIR A FACTURA
        window.location.href = "factura.html";

    } catch (error) {
        console.error("Error en venta", error);
    }
}



async function cargarClientes() {
    const res = await fetch("https://friocars-backend.onrender.com/api/clientes");
    const clientes = await res.json();

    const select = document.getElementById("clienteSelect");

    clientes.forEach(c => {
        select.innerHTML += `
            <option value="${c.id_cliente}">
                ${c.nombre} ${c.apellido}
            </option>
        `;
    });
}



cargarProductos();
cargarClientes();