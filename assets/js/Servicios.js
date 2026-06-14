// ══════════════════════════════════════════════════════
//  FRÍO CARS — servicios.js
//  Gestión de órdenes de trabajo desde la página de servicios
// ══════════════════════════════════════════════════════

const API = "https://friocars-backend.onrender.com/api";

let clientes  = [];
let tecnicos  = [];
let ordenes   = [];
let servicioPreseleccionado = "";

// ── INIT ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    cargarOrdenesActivas();
    cargarDatosFormulario();
});


// ══════════════════════════════════════════════════════
//  CARGAR ÓRDENES ACTIVAS
// ══════════════════════════════════════════════════════
async function cargarOrdenesActivas() {
    const contenedor = document.getElementById("ordenes-activas-lista");
    const badge      = document.getElementById("ordenes-count-badge");

    contenedor.innerHTML = `
        <div style="text-align:center;padding:2rem;color:var(--muted)">
            <div style="font-size:1.5rem;margin-bottom:.5rem">⏳</div>
            Cargando órdenes activas...
        </div>`;

    try {
        const res = await fetch(`${API}/ordenes/activas`);
        if (!res.ok) throw new Error("Error cargando órdenes");
        ordenes = await res.json();

        badge.textContent = ordenes.length;
        badge.style.display = ordenes.length > 0 ? "inline-flex" : "none";

        renderOrdenesActivas(ordenes);
    } catch (err) {
        console.error(err);
        contenedor.innerHTML = `
            <div style="text-align:center;padding:2rem;color:#dc2626">
                <div style="font-size:1.5rem;margin-bottom:.5rem">⚠️</div>
                Error conectando con el servidor.
                <br><button onclick="cargarOrdenesActivas()" style="margin-top:.8rem;background:var(--pri);color:#fff;border:none;border-radius:10px;padding:.5rem 1.2rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem">↺ Reintentar</button>
            </div>`;
        if (badge) badge.style.display = "none";
    }
}


// ══════════════════════════════════════════════════════
//  RENDER ÓRDENES ACTIVAS
// ══════════════════════════════════════════════════════
function renderOrdenesActivas(lista) {
    const contenedor = document.getElementById("ordenes-activas-lista");

    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div style="text-align:center;padding:3rem 1rem;color:var(--muted)">
                <div style="font-size:2.5rem;margin-bottom:.8rem">📋</div>
                <p style="font-weight:600;margin-bottom:.3rem">No hay órdenes activas</p>
                <p style="font-size:.82rem">Usa los botones del catálogo para crear una nueva orden.</p>
            </div>`;
        return;
    }

    contenedor.innerHTML = "";
    lista.forEach(o => {
        const fecha = new Date(o.fecha_ingreso).toLocaleDateString("es-CO", {
            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        });

        const iconos = {
            "Mantenimiento": "❄️",
            "Reparación":    "🔧",
            "Instalación":   "⚙️",
            "Diagnóstico IA":"🤖"
        };
        const icono = iconos[o.tipo_servicio] || "🔩";

        const colores = {
            "Mantenimiento": { bg:"#dbeafe", color:"#1d4ed8" },
            "Reparación":    { bg:"#e0f2fe", color:"#0284c7" },
            "Instalación":   { bg:"#fef3c7", color:"#d97706" },
            "Diagnóstico IA":{ bg:"#ede9fe", color:"#7c3aed" }
        };
        const col = colores[o.tipo_servicio] || { bg:"#f1f5f9", color:"#64748b" };

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
                <div class="orden-info-item">
                    <span class="orden-info-label">👤 Cliente</span>
                    <span class="orden-info-val">${o.cliente_nombre || "—"} ${o.cliente_apellido || ""}</span>
                </div>
                <div class="orden-info-item">
                    <span class="orden-info-label">🚗 Vehículo</span>
                    <span class="orden-info-val">${o.marca || "—"} ${o.modelo || ""} ${o.anio || ""}</span>
                </div>
                <div class="orden-info-item">
                    <span class="orden-info-label">🔑 Placa</span>
                    <span class="orden-info-val" style="font-weight:800;color:var(--pri)">${o.placa || "—"}</span>
                </div>
                <div class="orden-info-item">
                    <span class="orden-info-label">🔧 Técnico</span>
                    <span class="orden-info-val">${o.tecnico_nombre ? o.tecnico_nombre + " " + (o.tecnico_apellido || "") : "Sin asignar"}</span>
                </div>
                <div class="orden-info-item" style="grid-column:1/-1">
                    <span class="orden-info-label">📅 Ingreso</span>
                    <span class="orden-info-val">${fecha}</span>
                </div>
                ${o.descripcion ? `
                <div class="orden-info-item" style="grid-column:1/-1">
                    <span class="orden-info-label">📝 Descripción</span>
                    <span class="orden-info-val" style="color:var(--muted)">${o.descripcion}</span>
                </div>` : ""}
            </div>

            <div class="orden-card-actions">
                <button class="btn-finalizar" onclick="finalizarOrden(${o.id_orden})">
                    ✓ Finalizar orden
                </button>
                <button class="btn-eliminar-orden" onclick="eliminarOrden(${o.id_orden})">
                    🗑 Eliminar
                </button>
            </div>
        `;
        contenedor.appendChild(card);
    });
}


// ══════════════════════════════════════════════════════
//  CARGAR DATOS PARA EL FORMULARIO (clientes + técnicos)
// ══════════════════════════════════════════════════════
async function cargarDatosFormulario() {
    try {
        const [resC, resT] = await Promise.all([
            fetch(`${API}/clientes`),
            fetch(`${API}/tecnicos`)
        ]);

        clientes = resC.ok ? await resC.json() : [];
        tecnicos = resT.ok ? await resT.json() : [];

        const selCliente = document.getElementById("orden-cliente");
        selCliente.innerHTML = `<option value="">— Seleccionar cliente —</option>`;
        clientes.forEach(c => {
            selCliente.innerHTML += `<option value="${c.id_cliente}">${c.nombre} ${c.apellido} — ${c.numero_documento}</option>`;
        });

        const selTecnico = document.getElementById("orden-tecnico");
        selTecnico.innerHTML = `<option value="">— Sin asignar —</option>`;
        tecnicos.forEach(t => {
            if (t.estado === "Activo" || !t.estado) {
                selTecnico.innerHTML += `<option value="${t.id_tecnico}">${t.nombre} ${t.apellido}${t.especialidad ? " · " + t.especialidad : ""}</option>`;
            }
        });

    } catch (err) {
        console.error("Error cargando datos del formulario:", err);
    }
}


// ══════════════════════════════════════════════════════
//  CUANDO CAMBIA EL CLIENTE → cargar sus vehículos
// ══════════════════════════════════════════════════════
async function onClienteChange() {
    const id = document.getElementById("orden-cliente").value;
    const selVehiculo = document.getElementById("orden-vehiculo");

    selVehiculo.innerHTML = `<option value="">Cargando vehículos...</option>`;
    selVehiculo.disabled = true;

    if (!id) {
        selVehiculo.innerHTML = `<option value="">— Primero selecciona un cliente —</option>`;
        return;
    }

    try {
        const res = await fetch(`${API}/vehiculos`);
        const todos = await res.json();
        const vehiculosCliente = todos.filter(v => v.id_cliente == id);

        selVehiculo.innerHTML = `<option value="">— Seleccionar vehículo —</option>`;
        if (vehiculosCliente.length === 0) {
            selVehiculo.innerHTML = `<option value="">Este cliente no tiene vehículos registrados</option>`;
        } else {
            vehiculosCliente.forEach(v => {
                selVehiculo.innerHTML += `<option value="${v.id_vehiculo}">${v.marca} ${v.modelo} ${v.anio} — ${v.placa}</option>`;
            });
        }
        selVehiculo.disabled = false;
    } catch (err) {
        selVehiculo.innerHTML = `<option value="">Error cargando vehículos</option>`;
    }
}


// ══════════════════════════════════════════════════════
//  ABRIR MODAL DE NUEVA ORDEN
// ══════════════════════════════════════════════════════
function abrirModalOrden(tipoServicio) {
    servicioPreseleccionado = tipoServicio || "";

    const sel = document.getElementById("orden-tipo");
    if (sel && tipoServicio) sel.value = tipoServicio;

    // Limpiar vehículo
    document.getElementById("orden-vehiculo").innerHTML = `<option value="">— Primero selecciona un cliente —</option>`;
    document.getElementById("orden-vehiculo").disabled = true;
    document.getElementById("orden-cliente").value  = "";
    document.getElementById("orden-tecnico").value  = "";
    document.getElementById("orden-desc").value     = "";

    document.getElementById("modal-nueva-orden").classList.add("visible");
    document.body.style.overflow = "hidden";
}

function cerrarModalOrden() {
    document.getElementById("modal-nueva-orden").classList.remove("visible");
    document.body.style.overflow = "";
}


// ══════════════════════════════════════════════════════
//  GUARDAR NUEVA ORDEN
// ══════════════════════════════════════════════════════
async function guardarOrden() {
    const tipo_servicio = document.getElementById("orden-tipo").value;
    const id_cliente    = document.getElementById("orden-cliente").value;
    const id_vehiculo   = document.getElementById("orden-vehiculo").value;
    const id_tecnico    = document.getElementById("orden-tecnico").value;
    const descripcion   = document.getElementById("orden-desc").value.trim();

    if (!tipo_servicio) { mostrarToast("Selecciona el tipo de servicio", "warn"); return; }
    if (!id_cliente)    { mostrarToast("Selecciona un cliente", "warn"); return; }
    if (!id_vehiculo)   { mostrarToast("Selecciona un vehículo", "warn"); return; }

    const btn = document.getElementById("btn-guardar-orden");
    btn.disabled = true;
    btn.textContent = "Guardando...";

    try {
        const res = await fetch(`${API}/ordenes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tipo_servicio,
                descripcion,
                id_cliente:  parseInt(id_cliente),
                id_vehiculo: parseInt(id_vehiculo),
                id_tecnico:  id_tecnico ? parseInt(id_tecnico) : null
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Error creando orden");
        }

        mostrarToast("Orden creada exitosamente ✓", "ok");
        cerrarModalOrden();
        await cargarOrdenesActivas();

    } catch (err) {
        console.error(err);
        mostrarToast(err.message || "Error al crear la orden", "error");
    }

    btn.disabled = false;
    btn.textContent = "✓ Crear Orden";
}


// ══════════════════════════════════════════════════════
//  FINALIZAR ORDEN
// ══════════════════════════════════════════════════════
async function finalizarOrden(id) {
    if (!await confirmar("¿Marcar esta orden como finalizada?", "Finalizar", "#16a34a")) return;

    try {
        const res = await fetch(`${API}/ordenes/${id}/finalizar`, { method: "PATCH" });
        if (!res.ok) throw new Error();
        mostrarToast("Orden finalizada ✓", "ok");
        await cargarOrdenesActivas();
    } catch {
        mostrarToast("Error al finalizar la orden", "error");
    }
}


// ══════════════════════════════════════════════════════
//  ELIMINAR ORDEN
// ══════════════════════════════════════════════════════
async function eliminarOrden(id) {
    if (!await confirmar("¿Eliminar esta orden? Esta acción no se puede deshacer.", "Eliminar", "#dc2626")) return;

    try {
        const res = await fetch(`${API}/ordenes/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        mostrarToast("Orden eliminada", "ok");
        await cargarOrdenesActivas();
    } catch {
        mostrarToast("Error al eliminar la orden", "error");
    }
}


// ══════════════════════════════════════════════════════
//  CONFIRMACIÓN CUSTOM
// ══════════════════════════════════════════════════════
function confirmar(mensaje, textoBtn, colorBtn) {
    textoBtn = textoBtn || "Confirmar";
    colorBtn = colorBtn || "#dc2626";
    return new Promise(resolve => {
        document.getElementById("fc-confirm")?.remove();
        const overlay = document.createElement("div");
        overlay.id = "fc-confirm";
        overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;`;
        overlay.innerHTML = `
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:1.8rem;max-width:360px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.15)">
                <p style="font-size:.9rem;font-weight:600;color:var(--text);margin-bottom:1.4rem;line-height:1.5">${mensaje}</p>
                <div style="display:flex;gap:.7rem;justify-content:flex-end">
                    <button id="fc-no"  style="background:var(--bg);border:1.5px solid var(--border);color:var(--muted);border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">Cancelar</button>
                    <button id="fc-yes" style="background:${colorBtn};color:#fff;border:none;border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">${textoBtn}</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        document.getElementById("fc-yes").onclick = () => { overlay.remove(); resolve(true); };
        document.getElementById("fc-no").onclick  = () => { overlay.remove(); resolve(false); };
        overlay.addEventListener("click", e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
    });
}


// ══════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════
function mostrarToast(msg, tipo) {
    tipo = tipo || "ok";
    const c = {
        ok:    { bg:"var(--green-lt)", border:"var(--green-border)", text:"var(--green)", icon:"✓" },
        warn:  { bg:"#fffbeb", border:"#fde68a", text:"#d97706", icon:"⚠" },
        error: { bg:"#fff1f2", border:"#fecdd3", text:"#e11d48", icon:"✕" }
    }[tipo] || {};

    document.getElementById("fc-toast")?.remove();
    const t = document.createElement("div");
    t.id = "fc-toast";
    t.style.cssText = `position:fixed;bottom:1.8rem;right:1.8rem;z-index:9999;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:.75rem 1.2rem;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.1);display:flex;align-items:center;gap:.6rem;max-width:320px;`;
    t.innerHTML = `<span>${c.icon}</span>${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}