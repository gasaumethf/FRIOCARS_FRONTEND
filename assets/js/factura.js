const datos = JSON.parse(localStorage.getItem("factura")) || [];

const detalle = document.getElementById("detalleFactura");
const totalSpan = document.getElementById("totalFactura");
const fechaSpan = document.getElementById("fecha");
const cliente = localStorage.getItem("cliente");




document.getElementById("cliente").innerText = cliente || "Consumidor final";


// FECHA
fechaSpan.innerText = new Date().toLocaleString();

let total = 0;

// SI NO HAY DATOS
if (datos.length === 0) {
    detalle.innerHTML = "<tr><td colspan='4'>No hay datos de factura</td></tr>";
}

// PINTAR PRODUCTOS
datos.forEach(p => {

    const subtotal = p.precio * p.cantidad;
    total += subtotal;

    detalle.innerHTML += `
        <tr>
            <td>${p.nombre}</td>
            <td>${p.cantidad}</td>
            <td>${p.precio}</td>
            <td>${subtotal}</td>
        </tr>
    `;
});

// 🔥 USAR TOTAL DEL BACKEND (ESTE ES EL CAMBIO IMPORTANTE)
const totalGuardado = localStorage.getItem("totalFactura");

if (totalGuardado) {
    totalSpan.innerText = totalGuardado;
} else {
    totalSpan.innerText = total;
}