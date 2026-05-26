const tabla = document.getElementById("tablaProductos");

const totalProductos = document.getElementById("totalProductos");

const stockTotal = document.getElementById("stockTotal");

const buscador = document.getElementById("buscador");

let productoEditando = null;


// MOSTRAR / OCULTAR FORMULARIO

function mostrarFormulario() {

    const form = document.getElementById("formulario");

    if(form){

        form.classList.toggle("hidden");

    }

}


// CARGAR PRODUCTOS

async function cargarProductos() {

    try{

        const response = await fetch("http://localhost:8000/api/productos");

        const productos = await response.json();

        if(!tabla) return;

        tabla.innerHTML = "";

        //  ESTADISTICAS

        let totalStockProductos = 0;

        totalProductos.textContent = productos.length;

        productos.forEach(p => {

            totalStockProductos += Number(p.stock);

            // ESTADO STOCK

            let estado = "";

            if(p.stock > 10){

                estado = `
                    <span class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                        Disponible
                    </span>
                `;

            }else if(p.stock > 0){

                estado = `
                    <span class="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                        Bajo Stock
                    </span>
                `;

            }else{

                estado = `
                    <span class="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                        Agotado
                    </span>
                `;

            }

            // 🔥 FILA

            const fila = `

                <tr class="hover:bg-white/5 transition duration-300">

                    <td class="p-4 font-medium">
                        ${p.nombre}
                    </td>

                    <td class="p-4">
                        $${p.precio}
                    </td>

                    <td class="p-4">
                        ${p.stock}
                    </td>

                    <td class="p-4">
                        ${p.categoria}
                    </td>

                    <td class="p-4">
                        ${estado}
                    </td>

                    <td class="p-4">

                        <div class="flex flex-wrap gap-3">

                            <!-- EDITAR -->

                            <button 
                                onclick="editarProducto(
                                    ${p.id_producto},
                                    \`${p.nombre}\`,
                                    \`${p.descripcion}\`,
                                    ${p.precio},
                                    ${p.stock},
                                    \`${p.categoria}\`
                                )"

                                class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition duration-300">

                                Editar

                            </button>

                            <!-- ELIMINAR -->

                            <button 
                                onclick="eliminarProducto(${p.id_producto})"

                                class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition duration-300">

                                Eliminar

                            </button>

                        </div>

                    </td>

                </tr>

            `;

            tabla.innerHTML += fila;

        });

        //  STOCK TOTAL

        stockTotal.textContent = totalStockProductos;

    }catch(error){

        console.error("Error cargando productos", error);

    }

}


// EDITAR PRODUCTO

function editarProducto(id, nombre, descripcion, precio, stock, categoria) {

    productoEditando = id;

    document.getElementById("nombre").value = nombre;

    document.getElementById("descripcion").value = descripcion;

    document.getElementById("precio").value = precio;

    document.getElementById("stock").value = stock;

    document.getElementById("categoria").value = categoria;

    // MOSTRAR FORMULARIO

    document.getElementById("formulario").classList.remove("hidden");

    //  SUBIR AUTOMATICAMENTE

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


//  CREAR / ACTUALIZAR

async function crearProducto() {

    const nombre = document.getElementById("nombre").value.trim();

    const descripcion = document.getElementById("descripcion").value.trim();

    const precio = Number(document.getElementById("precio").value);

    const stock = Number(document.getElementById("stock").value);

    const categoria = document.getElementById("categoria").value.trim();

    // VALIDACIONES

    if(!nombre || !descripcion || !categoria){

        alert("Completa todos los campos");

        return;

    }

    if(precio <= 0){

        alert("El precio debe ser mayor a 0");

        return;

    }

    if(stock < 0){

        alert("El stock no puede ser negativo");

        return;

    }

    const data = {

        nombre,
        descripcion,
        precio,
        stock,
        categoria

    };

    try{

        let response;

        // 🔥 EDITAR

        if(productoEditando){

            response = await fetch(`http://localhost:8000/api/productos/${productoEditando}`, {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(data)

            });

        }else{

            //  CREAR

            response = await fetch("http://localhost:8000/api/productos", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(data)

            });

        }

        //  VALIDAR RESPUESTA

        if(!response.ok){

            alert("Error guardando producto");

            return;

        }

        //  MENSAJE

        alert("Producto guardado correctamente");

        //  LIMPIAR

        limpiarFormulario();

        document.getElementById("formulario").classList.add("hidden");

        productoEditando = null;

        //  RECARGAR

        cargarProductos();

    }catch(error){

        console.error("Error guardando producto", error);

    }

}


// 🔥 LIMPIAR FORMULARIO

function limpiarFormulario(){

    document.getElementById("nombre").value = "";

    document.getElementById("descripcion").value = "";

    document.getElementById("precio").value = "";

    document.getElementById("stock").value = "";

    document.getElementById("categoria").value = "";

}


// 🔥 ELIMINAR PRODUCTO

async function eliminarProducto(id) {

    const confirmar = confirm("¿Deseas eliminar este producto?");

    if(!confirmar) return;

    try{

        await fetch(`http://localhost:8000/api/productos/${id}`, {

            method: "DELETE"

        });

        cargarProductos();

    }catch(error){

        console.error("Error eliminando producto", error);

    }

}


//  BUSCADOR

if(buscador){

    buscador.addEventListener("keyup", () => {

        const texto = buscador.value.toLowerCase();

        const filas = tabla.querySelectorAll("tr");

        filas.forEach(fila => {

            const contenido = fila.textContent.toLowerCase();

            fila.style.display = contenido.includes(texto)

                ? ""

                : "none";

        });

    });

}


//  INICIAR

if(tabla){

    cargarProductos();

}