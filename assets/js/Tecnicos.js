// ══════════════════════════════════════════════════════
//  FRÍO CARS — tecnicos.js
//  CRUD completo de técnicos
// ══════════════════════════════════════════════════════

const API = "https://friocars-backend.onrender.com/api";

let todosTecnicos = [];
let modoEdicion   = false;

document.addEventListener("DOMContentLoaded", () => {
    cargarTecnicos();
});

// ══════════════════════════════════════════════════════
//  CARGAR TÉCNICOS
// ══════════════════════════════════════════════════════
async function cargarTecnicos() {
    const tbody = document.getElementById("tablaTecnicos");
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><span style="font-size:2rem">⏳</span>Cargando...</div></td></tr>`;

    try {
        const res = await fetch(`${API}/tecnicos`);
        if (!res.ok) throw new Error("Error obteniendo técnicos");
        todosTecnicos = await res.json();
        actualizarKPIs();
        renderTabla(todosTecnicos);
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `
            <tr><td colspan="5">
                <div class="empty-state">
                    <span>⚠️</span>
                    <p style="font-weight:600;color:#dc2626">Error al cargar técnicos</p>
                    <button onclick="cargarTecnicos()" style="margin-top:.8rem;background:var(--pri);color:#fff;border:none;border-radius:10px;padding:.5rem 1.2rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem">↺ Reintentar</button>
                </div>
            </td></tr>`;
    }
}

// ══════════════════════════════════════════════════════
//  KPIs
// ══════════════════════════════════════════════════════
function actualizarKPIs() {
    const total        = todosTecnicos.length;
    const activos      = todosTecnicos.filter(t => t.estado === "Activo").length;
    const inactivos    = total - activos;
    const especialidades = new Set(todosTecnicos.map(t => t.especialidad).filter(Boolean)).size;

    document.getElementById("kpi-total").textContent         = total;
    document.getElementById("kpi-activos").textContent       = activos;
    document.getElementById("kpi-inactivos").textContent     = inactivos;
    document.getElementById("kpi-especialidades").textContent = especialidades || "—";

    const topbarTotal = document.getElementById("topbar-total");
    if (topbarTotal) topbarTotal.textContent = total;
}

// ══════════════════════════════════════════════════════
//  RENDER TABLA
// ══════════════════════════════════════════════════════
function renderTabla(tecnicos) {
    const tbody = document.getElementById("tablaTecnicos");
    const count = document.getElementById("tabla-count");
    if (count) count.textContent = `${tecnicos.length} técnico${tecnicos.length !== 1 ? "s" : ""}`;

    if (tecnicos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><span>👷</span>No se encontraron técnicos</div></td></tr>`;
        return;
    }

    tbody.innerHTML = "";
    tecnicos.forEach(t => {
        const iniciales = ((t.nombre || "?")[0] + (t.apellido || "?")[0]).toUpperCase();
        const esActivo  = t.estado === "Activo";
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div style="display:flex;align-items:center;gap:.75rem">
                    <div class="avatar">${iniciales}</div>
                    <div>
                        <div style="font-weight:700;color:var(--text)">${t.nombre} ${t.apellido}</div>
                        <div style="font-size:.72rem;color:var(--muted)">ID #${t.id_tecnico}</div>
                    </div>
                </div>
            </td>
            <td style="color:var(--muted)">${t.telefono || "—"}</td>
            <td>
                ${t.especialidad
                    ? `<span style="background:var(--pri-lt);color:var(--pri);font-size:.72rem;font-weight:700;padding:2px 9px;border-radius:20px">${t.especialidad}</span>`
                    : `<span style="color:var(--muted);font-size:.82rem">Sin asignar</span>`}
            </td>
            <td>
                <span class="tag ${esActivo ? "tag-activo" : "tag-inactivo"}">
                    ${esActivo ? "✅ Activo" : "⏸ Inactivo"}
                </span>
            </td>
            <td>
                <div style="display:flex;gap:.4rem;flex-wrap:wrap">
                    <button class="btn-edit" onclick="editarTecnico(${t.id_tecnico})">✏️ Editar</button>
                    <button class="btn-toggle-estado"
                        style="${esActivo ? "background:#fef3c7;color:#d97706" : "background:#dcfce7;color:#16a34a"}"
                        onclick="toggleEstado(${t.id_tecnico}, '${esActivo ? "Inactivo" : "Activo"}')">
                        ${esActivo ? "⏸ Desactivar" : "✅ Activar"}
                    </button>
                    <button class="btn-del" onclick="eliminarTecnico(${t.id_tecnico}, '${(t.nombre + " " + t.apellido).replace(/'/g,"\\'")}')">🗑</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ══════════════════════════════════════════════════════
//  FILTRAR
// ══════════════════════════════════════════════════════
function filtrarTecnicos() {
    const texto = document.getElementById("buscador").value.toLowerCase().trim();
    const filtrados = todosTecnicos.filter(t =>
        !texto ||
        (t.nombre || "").toLowerCase().includes(texto) ||
        (t.apellido || "").toLowerCase().includes(texto) ||
        (t.especialidad || "").toLowerCase().includes(texto)
    );
    renderTabla(filtrados);
}

// ══════════════════════════════════════════════════════
//  FORMULARIO
// ══════════════════════════════════════════════════════
function toggleFormulario() {
    const panel = document.getElementById("formPanel");
    if (panel.classList.contains("visible")) {
        cancelarFormulario();
    } else {
        modoEdicion = false;
        limpiarFormulario();
        document.getElementById("formTitle").textContent = "Registrar nuevo técnico";
        document.getElementById("btnGuardar").textContent = "✓ Guardar Técnico";
        panel.classList.add("visible");
        document.getElementById("tec-nombre").focus();
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function cancelarFormulario() {
    document.getElementById("formPanel").classList.remove("visible");
    limpiarFormulario();
    modoEdicion = false;
}

function limpiarFormulario() {
    ["tec-nombre","tec-apellido","tec-telefono","tec-especialidad","editId"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    document.getElementById("tec-estado").value = "Activo";
}

// ══════════════════════════════════════════════════════
//  GUARDAR TÉCNICO
// ══════════════════════════════════════════════════════
async function guardarTecnico() {
    const nombre       = document.getElementById("tec-nombre").value.trim();
    const apellido     = document.getElementById("tec-apellido").value.trim();
    const telefono     = document.getElementById("tec-telefono").value.trim();
    const especialidad = document.getElementById("tec-especialidad").value.trim();
    const estado       = document.getElementById("tec-estado").value;
    const editId       = document.getElementById("editId").value;

    if (!nombre)   { mostrarToast("El nombre es obligatorio", "warn"); return; }
    if (!apellido) { mostrarToast("El apellido es obligatorio", "warn"); return; }

    const btn = document.getElementById("btnGuardar");
    btn.disabled = true;
    btn.textContent = "Guardando...";

    const body = { nombre, apellido, telefono: telefono || null, especialidad: especialidad || null, estado };

    try {
        let res;
        if (modoEdicion && editId) {
            res = await fetch(`${API}/tecnicos/${editId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
        } else {
            res = await fetch(`${API}/tecnicos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
        }
        if (!res.ok) throw new Error("Error guardando técnico");
        mostrarToast(modoEdicion ? "Técnico actualizado ✓" : "Técnico registrado ✓", "ok");
        cancelarFormulario();
        await cargarTecnicos();
    } catch (err) {
        console.error(err);
        mostrarToast("Error al guardar el técnico", "error");
    }

    btn.disabled = false;
    btn.textContent = modoEdicion ? "✓ Actualizar Técnico" : "✓ Guardar Técnico";
}

// ══════════════════════════════════════════════════════
//  EDITAR
// ══════════════════════════════════════════════════════
function editarTecnico(id) {
    const t = todosTecnicos.find(x => x.id_tecnico === id);
    if (!t) return;

    modoEdicion = true;
    document.getElementById("editId").value          = t.id_tecnico;
    document.getElementById("tec-nombre").value      = t.nombre || "";
    document.getElementById("tec-apellido").value    = t.apellido || "";
    document.getElementById("tec-telefono").value    = t.telefono || "";
    document.getElementById("tec-especialidad").value = t.especialidad || "";
    document.getElementById("tec-estado").value      = t.estado || "Activo";

    document.getElementById("formTitle").textContent  = "Editar técnico";
    document.getElementById("btnGuardar").textContent = "✓ Actualizar Técnico";

    const panel = document.getElementById("formPanel");
    panel.classList.add("visible");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ══════════════════════════════════════════════════════
//  TOGGLE ESTADO (Activo ↔ Inactivo)
// ══════════════════════════════════════════════════════
async function toggleEstado(id, nuevoEstado) {
    const t = todosTecnicos.find(x => x.id_tecnico === id);
    if (!t) return;
    try {
        const res = await fetch(`${API}/tecnicos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...t, estado: nuevoEstado })
        });
        if (!res.ok) throw new Error();
        mostrarToast(`Técnico marcado como ${nuevoEstado} ✓`, "ok");
        await cargarTecnicos();
    } catch {
        mostrarToast("Error cambiando estado", "error");
    }
}

// ══════════════════════════════════════════════════════
//  ELIMINAR
// ══════════════════════════════════════════════════════
async function eliminarTecnico(id, nombre) {
    if (!await confirmar(`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
        const res = await fetch(`${API}/tecnicos/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        mostrarToast(`"${nombre}" eliminado`, "ok");
        await cargarTecnicos();
    } catch {
        mostrarToast("Error al eliminar el técnico", "error");
    }
}

// ══════════════════════════════════════════════════════
//  CONFIRMACIÓN CUSTOM
// ══════════════════════════════════════════════════════
function confirmar(mensaje) {
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
                    <button id="fc-yes" style="background:#dc2626;color:#fff;border:none;border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">Eliminar</button>
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
function mostrarToast(msg, tipo = "ok") {
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