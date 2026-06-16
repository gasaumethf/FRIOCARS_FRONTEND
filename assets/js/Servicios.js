// ══════════════════════════════════════════════════════
//  FRÍO CARS — servicios.js
// ══════════════════════════════════════════════════════

const API = "https://friocars-backend.onrender.com/api";

let clientes  = [];
let tecnicos  = [];
let ordenes   = [];
let productos = [];
let clienteSeleccionado = null;
let ordenRepuestosActual = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarOrdenesActivas();
    cargarDatosFormulario();
    iniciarBuscadorCliente();
});


// ══════════════════════════════════════════════════════
//  CARGAR ÓRDENES ACTIVAS
// ══════════════════════════════════════════════════════
async function cargarOrdenesActivas() {
    const contenedor = document.getElementById("ordenes-activas-lista");
    const badge      = document.getElementById("ordenes-count-badge");

    contenedor.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--muted);grid-column:1/-1"><div style="font-size:1.5rem;margin-bottom:.5rem">⏳</div>Cargando órdenes activas...</div>`;

    try {
        const res = await fetch(`${API}/ordenes/activas`);
        if (!res.ok) throw new Error();
        ordenes = await res.json();

        if (badge) { badge.textContent = ordenes.length; badge.style.display = ordenes.length > 0 ? "inline-flex" : "none"; }
        renderOrdenesActivas(ordenes);
    } catch {
        contenedor.innerHTML = `<div style="text-align:center;padding:2rem;color:#dc2626;grid-column:1/-1"><div style="font-size:1.5rem;margin-bottom:.5rem">⚠️</div>Error conectando con el servidor.<br><button onclick="cargarOrdenesActivas()" style="margin-top:.8rem;background:var(--pri);color:#fff;border:none;border-radius:10px;padding:.5rem 1.2rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem">↺ Reintentar</button></div>`;
        if (badge) badge.style.display = "none";
    }
}


// ══════════════════════════════════════════════════════
//  RENDER ÓRDENES ACTIVAS
// ══════════════════════════════════════════════════════
function renderOrdenesActivas(lista) {
    const contenedor = document.getElementById("ordenes-activas-lista");

    if (lista.length === 0) {
        contenedor.innerHTML = `<div style="text-align:center;padding:3rem 1rem;color:var(--muted);grid-column:1/-1"><div style="font-size:2.5rem;margin-bottom:.8rem">📋</div><p style="font-weight:600;margin-bottom:.3rem">No hay órdenes activas</p><p style="font-size:.82rem">Usa los botones del catálogo para crear una nueva orden.</p></div>`;
        return;
    }

    contenedor.innerHTML = "";
    lista.forEach(o => {
        const fecha = new Date(o.fecha_ingreso).toLocaleDateString("es-CO", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
        const iconos  = { "Mantenimiento":"❄️","Reparación":"🔧","Instalación":"⚙️","Diagnóstico IA":"🤖" };
        const colores = { "Mantenimiento":{bg:"#dbeafe",color:"#1d4ed8"},"Reparación":{bg:"#e0f2fe",color:"#0284c7"},"Instalación":{bg:"#fef3c7",color:"#d97706"},"Diagnóstico IA":{bg:"#ede9fe",color:"#7c3aed"} };
        const icono = iconos[o.tipo_servicio]  || "🔩";
        const col   = colores[o.tipo_servicio] || { bg:"#f1f5f9", color:"#64748b" };

        const card = document.createElement("div");
        card.className = "orden-card";
        card.innerHTML = `
            <div class="orden-card-header">
                <div style="display:flex;align-items:center;gap:.75rem">
                    <div style="width:38px;height:38px;border-radius:10px;background:${col.bg};color:${col.color};display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">${icono}</div>
                    <div>
                        <div style="font-size:.72rem;font-weight:700;color:${col.color};text-transform:uppercase;letter-spacing:.05em">${o.tipo_servicio}</div>
                        <div style="font-size:.95rem;font-weight:800;color:var(--text)">Orden #${o.id_orden}</div>
                    </div>
                </div>
                <span class="orden-estado-badge activa">● Activa</span>
            </div>

            <div class="orden-info-grid">
                <div class="orden-info-item"><span class="orden-info-label">👤 Cliente</span><span class="orden-info-val">${o.cliente_nombre||"—"} ${o.cliente_apellido||""}</span></div>
                <div class="orden-info-item"><span class="orden-info-label">🚗 Vehículo</span><span class="orden-info-val">${o.marca||"—"} ${o.modelo||""} ${o.anio||""}</span></div>
                <div class="orden-info-item"><span class="orden-info-label">🔑 Placa</span><span class="orden-info-val" style="font-weight:800;color:var(--pri)">${o.placa||"—"}</span></div>
                <div class="orden-info-item"><span class="orden-info-label">🔧 Técnico</span><span class="orden-info-val">${o.tecnico_nombre ? o.tecnico_nombre+" "+(o.tecnico_apellido||"") : "Sin asignar"}</span></div>
                <div class="orden-info-item" style="grid-column:1/-1"><span class="orden-info-label">📅 Ingreso</span><span class="orden-info-val">${fecha}</span></div>
                ${o.descripcion ? `<div class="orden-info-item" style="grid-column:1/-1"><span class="orden-info-label">📝 Descripción</span><span class="orden-info-val" style="color:var(--muted)">${o.descripcion}</span></div>` : ""}
                ${o.observaciones ? `<div class="orden-info-item" style="grid-column:1/-1"><span class="orden-info-label">🔍 Observaciones</span><span class="orden-info-val" style="color:var(--muted);white-space:pre-line">${o.observaciones}</span></div>` : ""}
            </div>

            <div class="orden-card-actions">
                <button class="btn-repuestos" onclick="abrirModalRepuestos(${o.id_orden})">🔩 Repuestos</button>
                <button class="btn-editar-orden" onclick="abrirModalEditar(${o.id_orden})">✏️ Editar</button>
                <button class="btn-finalizar" onclick="finalizarOrdenConResumen(${o.id_orden})">✓ Finalizar</button>
                <button class="btn-eliminar-orden" onclick="eliminarOrden(${o.id_orden})">🗑</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
}


// ══════════════════════════════════════════════════════
//  CARGAR DATOS FORMULARIOS
// ══════════════════════════════════════════════════════
async function cargarDatosFormulario() {
    try {
        const [resC, resT, resP] = await Promise.all([
            fetch(`${API}/clientes`),
            fetch(`${API}/tecnicos`),
            fetch(`${API}/productos`)
        ]);
        clientes  = resC.ok ? await resC.json() : [];
        tecnicos  = resT.ok ? await resT.json() : [];
        productos = resP.ok ? await resP.json() : [];

        poblarSelectTecnico("orden-tecnico");
        poblarSelectTecnico("edit-tecnico");
    } catch (err) {
        console.error("Error cargando datos:", err);
    }
}

function poblarSelectTecnico(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = `<option value="">— Sin asignar —</option>`;
    tecnicos.forEach(t => {
        if (t.estado === "Activo" || !t.estado) {
            sel.innerHTML += `<option value="${t.id_tecnico}">${t.nombre} ${t.apellido}${t.especialidad ? " · "+t.especialidad : ""}</option>`;
        }
    });
}


// ══════════════════════════════════════════════════════
//  BUSCADOR CLIENTE EN TIEMPO REAL
// ══════════════════════════════════════════════════════
function iniciarBuscadorCliente() {
    const input      = document.getElementById("cliente-search");
    const resultados = document.getElementById("cliente-resultados");
    const hiddenId   = document.getElementById("orden-cliente-id");
    if (!input) return;

    input.addEventListener("input", () => {
        const q = input.value.trim().toLowerCase();
        clienteSeleccionado = null;
        hiddenId.value = "";
        if (q.length < 1) { resultados.style.display = "none"; resultados.innerHTML = ""; return; }

        const filtrados = clientes.filter(c =>
            (c.nombre||"").toLowerCase().includes(q) ||
            (c.apellido||"").toLowerCase().includes(q) ||
            ((c.nombre||"")+" "+(c.apellido||"")).toLowerCase().includes(q) ||
            (c.numero_documento||"").toLowerCase().includes(q)
        );

        if (filtrados.length === 0) {
            resultados.innerHTML = `<div class="cliente-result-item" style="color:var(--muted);cursor:default">No se encontraron clientes</div>`;
        } else {
            resultados.innerHTML = filtrados.map(c => `
                <div class="cliente-result-item" onclick="seleccionarCliente(${c.id_cliente},'${(c.nombre+" "+c.apellido).replace(/'/g,"\\'")}','${c.numero_documento}')">
                    <div style="font-weight:700;color:var(--text)">${c.nombre} ${c.apellido}</div>
                    <div style="font-size:.72rem;color:var(--muted)">Doc: ${c.numero_documento}</div>
                </div>`).join("");
        }
        resultados.style.display = "block";
    });

    document.addEventListener("click", e => {
        if (!input.contains(e.target) && !resultados.contains(e.target)) resultados.style.display = "none";
    });
}

function seleccionarCliente(id, nombre, documento) {
    clienteSeleccionado = id;
    document.getElementById("cliente-search").value   = `${nombre} — ${documento}`;
    document.getElementById("orden-cliente-id").value = id;
    document.getElementById("cliente-resultados").style.display = "none";
    onClienteChange(id);
}

async function onClienteChange(idCliente) {
    const sel = document.getElementById("orden-vehiculo");
    sel.innerHTML = `<option value="">Cargando vehículos...</option>`;
    sel.disabled = true;
    if (!idCliente) { sel.innerHTML = `<option value="">— Primero selecciona un cliente —</option>`; return; }
    try {
        const res  = await fetch(`${API}/vehiculos`);
        const todos = await res.json();
        const vehiculosCliente = todos.filter(v => v.id_cliente == idCliente);
        sel.innerHTML = `<option value="">— Seleccionar vehículo —</option>`;
        if (vehiculosCliente.length === 0) {
            sel.innerHTML = `<option value="">Este cliente no tiene vehículos registrados</option>`;
        } else {
            vehiculosCliente.forEach(v => { sel.innerHTML += `<option value="${v.id_vehiculo}">${v.marca} ${v.modelo} ${v.anio} — ${v.placa}</option>`; });
        }
        sel.disabled = false;
    } catch { sel.innerHTML = `<option value="">Error cargando vehículos</option>`; }
}


// ══════════════════════════════════════════════════════
//  MODAL NUEVA ORDEN
// ══════════════════════════════════════════════════════
function abrirModalOrden(tipoServicio) {
    document.getElementById("cliente-search").value   = "";
    document.getElementById("orden-cliente-id").value = "";
    document.getElementById("cliente-resultados").style.display = "none";
    document.getElementById("orden-vehiculo").innerHTML = `<option value="">— Primero selecciona un cliente —</option>`;
    document.getElementById("orden-vehiculo").disabled  = true;
    document.getElementById("orden-tecnico").value = "";
    document.getElementById("orden-desc").value    = "";
    clienteSeleccionado = null;
    const sel = document.getElementById("orden-tipo");
    if (sel && tipoServicio) sel.value = tipoServicio;
    document.getElementById("modal-nueva-orden").classList.add("visible");
    document.body.style.overflow = "hidden";
    setTimeout(() => document.getElementById("cliente-search").focus(), 100);
}

function cerrarModalOrden() {
    document.getElementById("modal-nueva-orden").classList.remove("visible");
    document.body.style.overflow = "";
}

async function guardarOrden() {
    const tipo_servicio = document.getElementById("orden-tipo").value;
    const id_cliente    = document.getElementById("orden-cliente-id").value;
    const id_vehiculo   = document.getElementById("orden-vehiculo").value;
    const id_tecnico    = document.getElementById("orden-tecnico").value;
    const descripcion   = document.getElementById("orden-desc").value.trim();

    if (!tipo_servicio) { mostrarToast("Selecciona el tipo de servicio", "warn"); return; }
    if (!id_cliente)    { mostrarToast("Selecciona un cliente", "warn"); return; }
    if (!id_vehiculo)   { mostrarToast("Selecciona un vehículo", "warn"); return; }

    const btn = document.getElementById("btn-guardar-orden");
    btn.disabled = true; btn.textContent = "Guardando...";

    try {
        const res = await fetch(`${API}/ordenes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipo_servicio, descripcion, id_cliente: parseInt(id_cliente), id_vehiculo: parseInt(id_vehiculo), id_tecnico: id_tecnico ? parseInt(id_tecnico) : null })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Error"); }
        mostrarToast("Orden creada exitosamente ✓", "ok");
        cerrarModalOrden();
        await cargarOrdenesActivas();
    } catch (err) { mostrarToast(err.message || "Error al crear la orden", "error"); }

    btn.disabled = false; btn.textContent = "✓ Crear Orden";
}


// ══════════════════════════════════════════════════════
//  MODAL EDITAR ORDEN
// ══════════════════════════════════════════════════════
function abrirModalEditar(id) {
    const o = ordenes.find(x => x.id_orden === id);
    if (!o) return;
    document.getElementById("edit-id").value            = o.id_orden;
    document.getElementById("edit-tipo").value          = o.tipo_servicio || "";
    document.getElementById("edit-descripcion").value   = o.descripcion   || "";
    document.getElementById("edit-observaciones").value = o.observaciones  || "";
    document.getElementById("edit-info-cliente").textContent = `${o.cliente_nombre||"—"} ${o.cliente_apellido||""} · ${o.marca||""} ${o.modelo||""} · Placa: ${o.placa||"—"}`;
    poblarSelectTecnico("edit-tecnico");
    setTimeout(() => { if (o.id_tecnico) document.getElementById("edit-tecnico").value = o.id_tecnico; }, 80);
    document.getElementById("modal-editar-orden").classList.add("visible");
    document.body.style.overflow = "hidden";
}

function cerrarModalEditar() {
    document.getElementById("modal-editar-orden").classList.remove("visible");
    document.body.style.overflow = "";
}

async function guardarEdicionOrden() {
    const id            = document.getElementById("edit-id").value;
    const tipo_servicio = document.getElementById("edit-tipo").value;
    const descripcion   = document.getElementById("edit-descripcion").value.trim();
    const observaciones = document.getElementById("edit-observaciones").value.trim();
    const id_tecnico    = document.getElementById("edit-tecnico").value;
    if (!tipo_servicio) { mostrarToast("Selecciona el tipo de servicio", "warn"); return; }

    const btn = document.getElementById("btn-guardar-edicion");
    btn.disabled = true; btn.textContent = "Guardando...";

    try {
        const res = await fetch(`${API}/ordenes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipo_servicio, descripcion, observaciones, estado:"Activa", id_tecnico: id_tecnico ? parseInt(id_tecnico) : null })
        });
        if (!res.ok) throw new Error();
        mostrarToast("Orden actualizada ✓", "ok");
        cerrarModalEditar();
        await cargarOrdenesActivas();
    } catch { mostrarToast("Error al actualizar la orden", "error"); }

    btn.disabled = false; btn.textContent = "✓ Guardar cambios";
}


// ══════════════════════════════════════════════════════
//  MODAL REPUESTOS
// ══════════════════════════════════════════════════════
async function abrirModalRepuestos(idOrden) {
    ordenRepuestosActual = idOrden;
    const o = ordenes.find(x => x.id_orden === idOrden);
    document.getElementById("rep-info-orden").textContent = o
        ? `Orden #${idOrden} · ${o.cliente_nombre||""} ${o.cliente_apellido||""} · ${o.placa||""}`
        : `Orden #${idOrden}`;

    // Poblar selector de productos
    const sel = document.getElementById("rep-producto");
    sel.innerHTML = `<option value="">— Seleccionar producto —</option>`;
    productos.filter(p => p.stock > 0 && p.activo !== false).forEach(p => {
        sel.innerHTML += `<option value="${p.id_producto}" data-precio="${p.precio}" data-stock="${p.stock}">${p.nombre} — $${Number(p.precio).toLocaleString("es-CO")} (stock: ${p.stock})</option>`;
    });

    document.getElementById("rep-cantidad").value = 1;
    document.getElementById("modal-repuestos").classList.add("visible");
    document.body.style.overflow = "hidden";
    await cargarRepuestosOrden(idOrden);
}

function cerrarModalRepuestos() {
    document.getElementById("modal-repuestos").classList.remove("visible");
    document.body.style.overflow = "";
    ordenRepuestosActual = null;
}

async function cargarRepuestosOrden(idOrden) {
    const lista = document.getElementById("rep-lista");
    lista.innerHTML = `<div style="text-align:center;padding:1rem;color:var(--muted);font-size:.82rem">⏳ Cargando...</div>`;
    try {
        const res = await fetch(`${API}/ordenes/${idOrden}/repuestos`);
        const repuestos = res.ok ? await res.json() : [];
        renderListaRepuestos(repuestos);
    } catch {
        lista.innerHTML = `<div style="text-align:center;padding:1rem;color:#dc2626;font-size:.82rem">Error cargando repuestos</div>`;
    }
}

function renderListaRepuestos(repuestos) {
    const lista = document.getElementById("rep-lista");
    const total = document.getElementById("rep-total");

    if (repuestos.length === 0) {
        lista.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--muted);font-size:.82rem">🔩 No hay repuestos agregados</div>`;
        if (total) total.textContent = "$0";
        return;
    }

    let totalVal = 0;
    lista.innerHTML = "";
    repuestos.forEach(r => {
        totalVal += parseFloat(r.subtotal);
        const div = document.createElement("div");
        div.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid var(--border);gap:.5rem";
        div.innerHTML = `
            <div style="flex:1">
                <div style="font-size:.84rem;font-weight:700;color:var(--text)">${r.producto_nombre}</div>
                <div style="font-size:.72rem;color:var(--muted)">${r.cantidad} × $${Number(r.precio_aplicado).toLocaleString("es-CO")} = <strong style="color:var(--green)">$${Number(r.subtotal).toLocaleString("es-CO")}</strong></div>
            </div>
            <button onclick="quitarRepuesto(${r.id_orden_repuesto})" style="background:#fee2e2;color:#dc2626;border:none;border-radius:7px;padding:.3rem .6rem;font-size:.7rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;flex-shrink:0">Quitar</button>
        `;
        lista.appendChild(div);
    });

    if (total) total.textContent = `$${Number(totalVal).toLocaleString("es-CO")}`;
}

async function agregarRepuesto() {
    const sel      = document.getElementById("rep-producto");
    const id_producto = parseInt(sel.value);
    const cantidad = parseInt(document.getElementById("rep-cantidad").value);

    if (!id_producto) { mostrarToast("Selecciona un producto", "warn"); return; }
    if (!cantidad || cantidad < 1) { mostrarToast("Cantidad inválida", "warn"); return; }

    const btn = document.getElementById("btn-agregar-repuesto");
    btn.disabled = true; btn.textContent = "Agregando...";

    try {
        const res = await fetch(`${API}/ordenes/${ordenRepuestosActual}/repuestos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_producto, cantidad })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
        mostrarToast("Repuesto agregado ✓", "ok");
        // Actualizar stock en lista local
        const prod = productos.find(p => p.id_producto === id_producto);
        if (prod) prod.stock -= cantidad;
        // Resetear selector
        sel.value = "";
        document.getElementById("rep-cantidad").value = 1;
        await cargarRepuestosOrden(ordenRepuestosActual);
    } catch (err) { mostrarToast(err.message || "Error agregando repuesto", "error"); }

    btn.disabled = false; btn.textContent = "+ Agregar";
}

async function quitarRepuesto(idOrdenRepuesto) {
    try {
        const res = await fetch(`${API}/ordenes/${ordenRepuestosActual}/repuestos/${idOrdenRepuesto}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        mostrarToast("Repuesto eliminado ✓", "ok");
        await cargarRepuestosOrden(ordenRepuestosActual);
        // Recargar productos para actualizar stock
        const resP = await fetch(`${API}/productos`);
        if (resP.ok) productos = await resP.json();
        // Refrescar selector
        const sel = document.getElementById("rep-producto");
        if (sel) {
            sel.innerHTML = `<option value="">— Seleccionar producto —</option>`;
            productos.filter(p => p.stock > 0 && p.activo !== false).forEach(p => {
                sel.innerHTML += `<option value="${p.id_producto}" data-precio="${p.precio}" data-stock="${p.stock}">${p.nombre} — $${Number(p.precio).toLocaleString("es-CO")} (stock: ${p.stock})</option>`;
            });
        }
    } catch { mostrarToast("Error eliminando repuesto", "error"); }
}


// ══════════════════════════════════════════════════════
//  FINALIZAR CON RESUMEN DE COBRO
// ══════════════════════════════════════════════════════
async function finalizarOrdenConResumen(idOrden) {
    try {
        const res = await fetch(`${API}/ordenes/${idOrden}/resumen`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        const o = data.orden;
        const repuestos = data.repuestos;
        const totalRep  = data.totalRepuestos;
        const iva       = data.iva;
        const total     = data.totalConIva;

        // Construir contenido del modal de resumen
        let repuestosHtml = repuestos.length > 0
            ? repuestos.map(r => `
                <div style="display:flex;justify-content:space-between;padding:.4rem 0;border-bottom:1px solid var(--border);font-size:.82rem">
                    <span>${r.producto_nombre} × ${r.cantidad}</span>
                    <span style="font-weight:700;color:var(--green)">$${Number(r.subtotal).toLocaleString("es-CO")}</span>
                </div>`).join("")
            : `<p style="text-align:center;color:var(--muted);font-size:.82rem;padding:.5rem">Sin repuestos registrados</p>`;

        document.getElementById("resumen-orden-info").innerHTML = `
            <div style="font-size:.84rem;font-weight:600;color:var(--text);margin-bottom:.5rem">
                <strong>Orden #${o.id_orden}</strong> · ${o.tipo_servicio}
            </div>
            <div style="font-size:.78rem;color:var(--muted)">
                ${o.cliente_nombre} ${o.cliente_apellido} · ${o.placa} · ${o.marca} ${o.modelo}
            </div>`;
        document.getElementById("resumen-repuestos-lista").innerHTML = repuestosHtml;
        document.getElementById("resumen-subtotal").textContent = `$${Number(totalRep).toLocaleString("es-CO")}`;
        document.getElementById("resumen-iva").textContent      = `$${Number(iva).toLocaleString("es-CO")}`;
        document.getElementById("resumen-total-final").textContent = `$${Number(total).toLocaleString("es-CO")}`;

        // Guardar datos para el carrito
        document.getElementById("modal-resumen-orden").dataset.idOrden    = idOrden;
        document.getElementById("modal-resumen-orden").dataset.idCliente  = o.id_cliente;
        document.getElementById("modal-resumen-orden").dataset.repuestos  = JSON.stringify(repuestos);
        document.getElementById("modal-resumen-orden").dataset.totalFinal = total;
        document.getElementById("modal-resumen-orden").dataset.iva        = iva;
        document.getElementById("modal-resumen-orden").dataset.subtotal   = totalRep;
        document.getElementById("modal-resumen-orden").dataset.cliente    = `${o.cliente_nombre} ${o.cliente_apellido}`;

        document.getElementById("modal-resumen-orden").classList.add("visible");
        document.body.style.overflow = "hidden";

    } catch { mostrarToast("Error cargando resumen de la orden", "error"); }
}

function cerrarModalResumen() {
    document.getElementById("modal-resumen-orden").classList.remove("visible");
    document.body.style.overflow = "";
}

async function confirmarFinalizarOrden() {
    const modal      = document.getElementById("modal-resumen-orden");
    const idOrden    = modal.dataset.idOrden;
    const idCliente  = modal.dataset.idCliente;
    const repuestos  = JSON.parse(modal.dataset.repuestos || "[]");
    const totalFinal = parseFloat(modal.dataset.totalFinal);
    const iva        = parseFloat(modal.dataset.iva);
    const subtotal   = parseFloat(modal.dataset.subtotal);
    const cliente    = modal.dataset.cliente;

    const btn = document.getElementById("btn-confirmar-finalizar");
    btn.disabled = true; btn.textContent = "Finalizando...";

    try {
        // 1. Finalizar la orden
        const res = await fetch(`${API}/ordenes/${idOrden}/finalizar`, { method: "PATCH" });
        if (!res.ok) throw new Error("Error finalizando orden");

        // 2. Si hay repuestos, enviar al carrito para pago
        if (repuestos.length > 0) {
            const carritoItems = repuestos.map(r => ({
                id_producto: r.id_producto,
                nombre:      r.producto_nombre,
                precio:      parseFloat(r.precio_aplicado),
                cantidad:    r.cantidad,
                desde_orden: idOrden
            }));

            // Agregar al carrito existente o reemplazar
            const carritoActual = JSON.parse(localStorage.getItem("carrito") || "[]");
            const carritoMerged = [...carritoActual, ...carritoItems];
            localStorage.setItem("carrito",         JSON.stringify(carritoMerged));
            localStorage.setItem("clienteId",       idCliente);
            localStorage.setItem("subtotalFactura", subtotal);
            localStorage.setItem("ivaFactura",      iva.toFixed(2));
            localStorage.setItem("totalFactura",    totalFinal.toFixed(2));
            localStorage.setItem("cliente",         cliente);
            localStorage.setItem("desde_orden",     idOrden);

            mostrarToast("Orden finalizada — redirigiendo al carrito ✓", "ok");
            cerrarModalResumen();
            setTimeout(() => { window.location.href = "carrito.html"; }, 1000);
        } else {
            mostrarToast("Orden finalizada exitosamente ✓", "ok");
            cerrarModalResumen();
            await cargarOrdenesActivas();
        }

    } catch (err) {
        mostrarToast(err.message || "Error al finalizar", "error");
        btn.disabled = false; btn.textContent = "✓ Finalizar y Cobrar";
    }
}


// ══════════════════════════════════════════════════════
//  FINALIZAR SIN REPUESTOS (directo)
// ══════════════════════════════════════════════════════
async function finalizarOrden(id) {
    if (!await confirmar("¿Marcar esta orden como finalizada?", "Finalizar", "#16a34a")) return;
    try {
        const res = await fetch(`${API}/ordenes/${id}/finalizar`, { method: "PATCH" });
        if (!res.ok) throw new Error();
        mostrarToast("Orden finalizada ✓", "ok");
        await cargarOrdenesActivas();
    } catch { mostrarToast("Error al finalizar la orden", "error"); }
}

async function eliminarOrden(id) {
    if (!await confirmar("¿Eliminar esta orden? No se puede deshacer.", "Eliminar", "#dc2626")) return;
    try {
        const res = await fetch(`${API}/ordenes/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        mostrarToast("Orden eliminada", "ok");
        await cargarOrdenesActivas();
    } catch { mostrarToast("Error al eliminar la orden", "error"); }
}


// ══════════════════════════════════════════════════════
//  CONFIRMACIÓN Y TOAST
// ══════════════════════════════════════════════════════
function confirmar(mensaje, textoBtn, colorBtn) {
    textoBtn = textoBtn || "Confirmar"; colorBtn = colorBtn || "#dc2626";
    return new Promise(resolve => {
        document.getElementById("fc-confirm")?.remove();
        const overlay = document.createElement("div");
        overlay.id = "fc-confirm";
        overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;`;
        overlay.innerHTML = `<div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:1.8rem;max-width:360px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.15)"><p style="font-size:.9rem;font-weight:600;color:var(--text);margin-bottom:1.4rem;line-height:1.5">${mensaje}</p><div style="display:flex;gap:.7rem;justify-content:flex-end"><button id="fc-no" style="background:var(--bg);border:1.5px solid var(--border);color:var(--muted);border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">Cancelar</button><button id="fc-yes" style="background:${colorBtn};color:#fff;border:none;border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">${textoBtn}</button></div></div>`;
        document.body.appendChild(overlay);
        document.getElementById("fc-yes").onclick = () => { overlay.remove(); resolve(true); };
        document.getElementById("fc-no").onclick  = () => { overlay.remove(); resolve(false); };
        overlay.addEventListener("click", e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
    });
}

function mostrarToast(msg, tipo) {
    tipo = tipo || "ok";
    const c = { ok:{bg:"var(--green-lt)",border:"var(--green-border)",text:"var(--green)",icon:"✓"}, warn:{bg:"#fffbeb",border:"#fde68a",text:"#d97706",icon:"⚠"}, error:{bg:"#fff1f2",border:"#fecdd3",text:"#e11d48",icon:"✕"} }[tipo] || {};
    document.getElementById("fc-toast")?.remove();
    const t = document.createElement("div");
    t.id = "fc-toast";
    t.style.cssText = `position:fixed;bottom:1.8rem;right:1.8rem;z-index:9999;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:.75rem 1.2rem;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.1);display:flex;align-items:center;gap:.6rem;max-width:320px;`;
    t.innerHTML = `<span>${c.icon}</span>${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}