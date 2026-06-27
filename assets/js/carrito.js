// ══════════════════════════════════════════════════════
//  FRÍO CARS — carrito.js  (v3 — descuento por producto, sin IVA, finaliza orden al pagar)
// ══════════════════════════════════════════════════════

const API = "https://friocars-backend.onrender.com/api";

let carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
let clientes = [];
let clienteIdSeleccionado = null;

const manoDeObra = parseFloat(localStorage.getItem("manoDeObra") || "0");
const desdeOrden = localStorage.getItem("desde_orden") || null;
const ordenesPendientes = JSON.parse(localStorage.getItem("ordenes_pendientes") || "[]");

document.addEventListener("DOMContentLoaded", () => {
    cargarClientes();
    renderCarrito();
    iniciarBuscadorCliente();

    if (desdeOrden) {
        const sec = document.getElementById("seccion-mano-obra");
        if (sec) {
            sec.style.display = "block";
            document.getElementById("mano-obra-input").value = manoDeObra || 0;
        }
        const filaM = document.getElementById("fila-mano-obra");
        if (filaM) filaM.style.display = "flex";
        actualizarResumenConManoObra();
    }
});

async function cargarClientes() {
    try {
        const res = await fetch(`${API}/clientes`);
        clientes = res.ok ? await res.json() : [];
        const idGuardado = localStorage.getItem("clienteId");
        const nombreGuardado = localStorage.getItem("cliente");
        if (idGuardado && nombreGuardado) {
            clienteIdSeleccionado = parseInt(idGuardado);
            const c = clientes.find(x => x.id_cliente === clienteIdSeleccionado);
            if (c) mostrarInfoCliente(c);
            document.getElementById("cliente-buscar").value = nombreGuardado;
            document.getElementById("cliente-id-hidden").value = idGuardado;
        }
    } catch { clientes = []; }
}

function iniciarBuscadorCliente() {
    const input = document.getElementById("cliente-buscar");
    const resultados = document.getElementById("cliente-resultados");
    if (!input) return;
    input.addEventListener("input", () => {
        const q = input.value.trim().toLowerCase();
        clienteIdSeleccionado = null;
        document.getElementById("cliente-id-hidden").value = "";
        document.getElementById("clienteInfo").style.display = "none";
        if (q.length < 1) { resultados.style.display = "none"; return; }
        const filtrados = clientes.filter(c =>
            (c.nombre || "").toLowerCase().includes(q) || (c.apellido || "").toLowerCase().includes(q) ||
            ((c.nombre || "") + " " + (c.apellido || "")).toLowerCase().includes(q) ||
            (c.numero_documento || "").toLowerCase().includes(q));
        resultados.innerHTML = filtrados.length === 0
            ? `<div class="cliente-result-item" style="color:var(--muted);cursor:default">No se encontraron clientes</div>`
            : filtrados.slice(0, 8).map(c => `<div class="cliente-result-item" onclick="seleccionarCliente(${c.id_cliente})"><div style="font-weight:700;color:var(--text)">${c.nombre} ${c.apellido || ""}</div><div style="font-size:.72rem;color:var(--muted)">Doc: ${c.numero_documento || "—"}${c.telefono ? " · " + c.telefono : ""}</div></div>`).join("");
        resultados.style.display = "block";
    });
    document.addEventListener("click", e => {
        if (!input.contains(e.target) && !resultados.contains(e.target)) resultados.style.display = "none";
    });
}

function seleccionarCliente(id) {
    const c = clientes.find(x => x.id_cliente === id);
    if (!c) return;
    clienteIdSeleccionado = id;
    document.getElementById("cliente-buscar").value = `${c.nombre} ${c.apellido || ""}`;
    document.getElementById("cliente-id-hidden").value = id;
    document.getElementById("cliente-resultados").style.display = "none";
    mostrarInfoCliente(c);
    localStorage.setItem("clienteId", id);
    localStorage.setItem("cliente", `${c.nombre} ${c.apellido || ""}`);
}

function mostrarInfoCliente(c) {
    const iniciales = `${(c.nombre || "?")[0]}${(c.apellido || "")[0] || ""}`.toUpperCase();
    document.getElementById("clienteAvatar").textContent = iniciales;
    document.getElementById("clienteNombre").textContent = `${c.nombre} ${c.apellido || ""}`;
    document.getElementById("clienteDetalle").textContent = `${c.telefono || ""}${c.numero_documento ? " · " + c.numero_documento : ""}`;
    document.getElementById("clienteInfo").style.display = "flex";
}

// ══════════════════════════════════════════════════════
//  RENDER CARRITO — con columna descuento editable
// ══════════════════════════════════════════════════════
function renderCarrito() {
    const tbody = document.getElementById("carritoBody");
    const badge = document.getElementById("badge-items");
    const topbarItems = document.getElementById("topbar-items");

    const totalItems = carrito.reduce((s, p) => s + p.cantidad, 0);
    if (badge) badge.textContent = `${totalItems} artículo${totalItems !== 1 ? "s" : ""}`;
    if (topbarItems) topbarItems.textContent = totalItems;
    const sidebarBadge = document.getElementById("sidebarCartCount");
    if (sidebarBadge) { sidebarBadge.textContent = totalItems; sidebarBadge.style.display = totalItems > 0 ? "inline-flex" : "none"; }

    if (carrito.length === 0 && !desdeOrden) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-cart"><span>🛒</span>El carrito está vacío — <a href="ventas.html" style="color:var(--pri);font-weight:700">ir a ventas</a></div></td></tr>`;
        actualizarResumenConManoObra();
        return;
    }

    tbody.innerHTML = "";
    carrito.forEach((p, idx) => {
        const descuento = parseFloat(p.descuento) || 0;
        const bruto = p.precio * p.cantidad;
        const neto = bruto - descuento;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div style="font-weight:700;color:var(--text)">${p.nombre}</div>
                ${p.desde_orden ? `<div style="font-size:.68rem;color:#d97706;font-weight:600">📋 Orden #${p.desde_orden}</div>` : ""}
            </td>
            <td>
                <div class="qty-control">
                    <button class="qty-btn" onclick="cambiarCantidad(${idx}, -1)">−</button>
                    <span class="qty-val">${p.cantidad}</span>
                    <button class="qty-btn" onclick="cambiarCantidad(${idx}, +1)">+</button>
                </div>
            </td>
            <td style="color:var(--muted)">$${Number(p.precio).toLocaleString("es-CO")}</td>
            <td>
                <input type="number" min="0" value="${descuento}"
                    style="width:100px;border:1.5px solid var(--border);border-radius:8px;padding:.3rem .5rem;font-size:.8rem;font-family:'Plus Jakarta Sans',sans-serif;outline:none;background:var(--bg);color:#dc2626;font-weight:700"
                    onchange="cambiarDescuento(${idx}, this.value)"
                    onfocus="this.style.borderColor='#dc2626'" onblur="this.style.borderColor='var(--border)'">
            </td>
            <td style="font-weight:700;color:var(--green)">$${Number(neto).toLocaleString("es-CO")}</td>
            <td><button class="btn-quitar" onclick="quitarDelCarrito(${idx})">Quitar</button></td>`;
        tbody.appendChild(tr);
    });

    actualizarResumenConManoObra();
}

// ══════════════════════════════════════════════════════
//  RESUMEN — sin IVA, con descuentos y mano de obra
// ══════════════════════════════════════════════════════
function actualizarResumenConManoObra(subtotalRep) {
    if (subtotalRep === undefined) {
        subtotalRep = carrito.reduce((s, p) => {
            const bruto = p.precio * p.cantidad;
            const descuento = parseFloat(p.descuento) || 0;
            return s + bruto - descuento;
        }, 0);
    }
    const mo = parseFloat(document.getElementById("mano-obra-input")?.value || manoDeObra || "0") || 0;
    const total = mo + subtotalRep;   // sin IVA
    const fmt = v => Number(v).toLocaleString("es-CO", { minimumFractionDigits: 0 });

    setText("resumen-mano-obra-display", `$${fmt(mo)}`);
    setText("resumen-subtotal", `$${fmt(subtotalRep)}`);
    setText("resumen-iva", `$0`);
    setText("resumen-total", fmt(total));
    setText("totalDisplay", fmt(total));
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function cambiarCantidad(idx, delta) {
    if (!carrito[idx]) return;
    carrito[idx].cantidad += delta;
    if (carrito[idx].cantidad <= 0) carrito.splice(idx, 1);
    guardarCarritoLocal(); renderCarrito();
}

function cambiarDescuento(idx, valor) {
    if (!carrito[idx]) return;
    carrito[idx].descuento = parseFloat(valor) || 0;
    guardarCarritoLocal(); renderCarrito();
}

function quitarDelCarrito(idx) {
    carrito.splice(idx, 1);
    guardarCarritoLocal(); renderCarrito();
}

function vaciarCarrito() {
    if (carrito.length === 0) return;
    confirmar("¿Vaciar el carrito? Se eliminarán todos los productos.").then(ok => {
        if (!ok) return;
        carrito = []; guardarCarritoLocal(); renderCarrito();
    });
}

function guardarCarritoLocal() { localStorage.setItem("carrito", JSON.stringify(carrito)); }

// ══════════════════════════════════════════════════════
//  PROCESAR PAGO — finaliza órdenes de servicio pendientes
// ══════════════════════════════════════════════════════
async function procesarPago() {
    const id_cliente = clienteIdSeleccionado || parseInt(localStorage.getItem("clienteId") || "0");
    if (!id_cliente) { mostrarToast("Selecciona un cliente antes de procesar el pago", "warn"); document.getElementById("cliente-buscar").focus(); return; }

    const mo = parseFloat(document.getElementById("mano-obra-input")?.value || "0") || 0;
    if (carrito.length === 0 && mo === 0) { mostrarToast("El carrito está vacío y la mano de obra es $0", "warn"); return; }

    const btn = document.getElementById("btnPagar");
    btn.disabled = true; btn.textContent = "⏳ Procesando...";

    try {
        const nombreCliente = localStorage.getItem("cliente") || "Cliente";
        const subtotalRep = carrito.reduce((s, p) => {
            const bruto = p.precio * p.cantidad;
            const desc = parseFloat(p.descuento) || 0;
            return s + bruto - desc;
        }, 0);
        const totalDescuentos = carrito.reduce((s, p) => s + (parseFloat(p.descuento) || 0), 0);
        const totalFinal = mo + subtotalRep;  // sin IVA

        // 1. Registrar venta en BD si hay productos
        let ventaId = null;
        if (carrito.length > 0) {
            const res = await fetch(`${API}/ventas`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productos: carrito, id_cliente })
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Error en el servidor"); }
            const data = await res.json();
            ventaId = data.ventaId;
        }

        // 2. Finalizar órdenes de servicio pendientes en la BD
        for (const idOrden of ordenesPendientes) {
            await fetch(`${API}/ordenes/${idOrden}/finalizar`, { method: "PATCH" });
        }

        // 3. Guardar datos para factura
        localStorage.setItem("factura", JSON.stringify(carrito));
        localStorage.setItem("cliente", nombreCliente);
        localStorage.setItem("clienteId", id_cliente);
        localStorage.setItem("manoDeObra", mo.toFixed(2));
        localStorage.setItem("subtotalFactura", subtotalRep.toFixed(2));
        localStorage.setItem("totalDescuentos", totalDescuentos.toFixed(2));
        localStorage.setItem("ivaFactura", "0");
        localStorage.setItem("totalFactura", totalFinal.toFixed(2));
        if (ventaId) localStorage.setItem("ventaId", ventaId);

        // Limpiar
        carrito = [];
        localStorage.removeItem("carrito");
        localStorage.removeItem("desde_orden");
        localStorage.removeItem("manoDeObra");
        localStorage.removeItem("ordenes_pendientes");

        mostrarToast("Pago procesado correctamente ✓", "ok");
        setTimeout(() => { window.location.href = "factura.html"; }, 800);

    } catch (err) {
        console.error(err);
        mostrarToast(`Error: ${err.message}`, "error");
        btn.disabled = false; btn.textContent = "✓ Procesar Pago";
    }
}

function confirmar(mensaje) {
    return new Promise(resolve => {
        document.getElementById("fc-confirm")?.remove();
        const overlay = document.createElement("div");
        overlay.id = "fc-confirm";
        overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center";
        overlay.innerHTML = `<div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:1.8rem;max-width:340px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.15)"><p style="font-size:.9rem;font-weight:600;color:var(--text);margin-bottom:1.4rem;line-height:1.5">${mensaje}</p><div style="display:flex;gap:.7rem;justify-content:flex-end"><button id="fc-no" style="background:var(--bg);border:1.5px solid var(--border);color:var(--muted);border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">Cancelar</button><button id="fc-yes" style="background:#dc2626;color:#fff;border:none;border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">Vaciar</button></div></div>`;
        document.body.appendChild(overlay);
        document.getElementById("fc-yes").onclick = () => { overlay.remove(); resolve(true); };
        document.getElementById("fc-no").onclick = () => { overlay.remove(); resolve(false); };
    });
}

function mostrarToast(msg, tipo) {
    tipo = tipo || "ok";
    const c = { ok: { bg: "var(--green-lt)", border: "var(--green-border)", text: "var(--green)", icon: "✓" }, warn: { bg: "#fffbeb", border: "#fde68a", text: "#d97706", icon: "⚠" }, error: { bg: "#fff1f2", border: "#fecdd3", text: "#e11d48", icon: "✕" } }[tipo] || {};
    document.getElementById("fc-toast")?.remove();
    const t = document.createElement("div");
    t.id = "fc-toast";
    t.style.cssText = `position:fixed;bottom:1.8rem;right:1.8rem;z-index:9999;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:.75rem 1.2rem;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.1);display:flex;align-items:center;gap:.6rem;max-width:320px`;
    t.innerHTML = `<span>${c.icon}</span>${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}