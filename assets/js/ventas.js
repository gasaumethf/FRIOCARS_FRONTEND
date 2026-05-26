let carrito = [];

//  CARGAR PRODUCTOS
async function cargarProductos() {
    const res = await fetch("http://localhost:3000/api/productos");
    const productos = await res.json();

    const contenedor = document.getElementById("listaProductos");

    productos.forEach(p => {
        contenedor.innerHTML += `
            <div class="bg-white p-4 shadow">
                <h3>${p.nombre}</h3>
                <p>$${p.precio}</p>
                <button onclick='agregarAlCarrito(${JSON.stringify(p)})'
                class="bg-blue-500 text-white px-2 py-1 mt-2">
                    Agregar
                </button>
            </div>
        `;
    });
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
        <td>${p.precio}</td>
        <td>${subtotal}</td>
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

        const res = await fetch("http://localhost:3000/api/ventas", {
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
    const res = await fetch("http://localhost:3000/api/clientes");
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