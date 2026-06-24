// ══════════════════════════════════════════════════════
//  FRÍO CARS — clientes.js  (v2 — solo nombre obligatorio)
// ══════════════════════════════════════════════════════

const API = "https://friocars-backend.onrender.com/api";

let todosLosClientes = [];
let modoEdicion = false;
let idClienteEdicion = null;

document.addEventListener("DOMContentLoaded", () => {
  cargarClientes();
});

async function cargarClientes() {
  const tbody = document.getElementById("tablaClientes");
  tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><span style="font-size:2rem">⏳</span>Cargando...</div></td></tr>`;
  try {
    const [resClientes, resVehiculos] = await Promise.all([
      fetch(`${API}/clientes`),
      fetch(`${API}/vehiculos`)
    ]);
    const clientes = await resClientes.json();
    const vehiculos = resVehiculos.ok ? await resVehiculos.json() : [];
    todosLosClientes = clientes.map(c => ({
      ...c,
      vehiculos: vehiculos.filter(v => v.id_cliente === c.id_cliente)
    }));
    actualizarKPIs();
    renderTabla(todosLosClientes);
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><span>⚠️</span><p style="font-weight:600;color:#dc2626">Error al cargar clientes</p><button onclick="cargarClientes()" style="margin-top:.8rem;background:var(--pri);color:#fff;border:none;border-radius:10px;padding:.5rem 1.2rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem">↺ Reintentar</button></div></td></tr>`;
  }
}

function actualizarKPIs() {
  const total = todosLosClientes.length;
  const conVeh = todosLosClientes.filter(c => c.vehiculos?.length > 0).length;
  const ciudades = new Set(todosLosClientes.map(c => c.ciudad).filter(Boolean)).size;
  const ahora = new Date();
  const esMes = todosLosClientes.filter(c => {
    if (!c.fecha_registro) return false;
    const f = new Date(c.fecha_registro);
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
  }).length;
  setText("kpi-total", total);
  setText("kpi-vehiculos", conVeh);
  setText("kpi-mes", esMes);
  setText("kpi-ciudades", ciudades || "—");
  setText("topbar-total", total);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderTabla(clientes) {
  const tbody = document.getElementById("tablaClientes");
  const count = document.getElementById("tabla-count");
  if (count) count.textContent = `${clientes.length} cliente${clientes.length !== 1 ? "s" : ""}`;

  if (clientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><span>👥</span>No se encontraron clientes</div></td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  clientes.forEach(c => {
    const iniciales = `${(c.nombre || "?")[0]}${(c.apellido || "")[0] || ""}`.toUpperCase();
    const veh = c.vehiculos?.[0];
    const masVeh = (c.vehiculos?.length || 0) - 1;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div style="display:flex;align-items:center;gap:.7rem">
          <div class="avatar">${iniciales}</div>
          <div>
            <div style="font-weight:700;color:var(--text)">${c.nombre} ${c.apellido || ""}</div>
            ${c.correo ? `<div style="font-size:.72rem;color:var(--muted)">${c.correo}</div>` : ""}
          </div>
        </div>
      </td>
      <td style="font-weight:600">${c.numero_documento || "—"}</td>
      <td style="font-weight:600">${c.telefono || "—"}</td>
      <td style="color:var(--muted);font-size:.82rem">${c.direccion || "—"}</td>
      <td>
        ${veh
        ? `<div style="font-size:.78rem;font-weight:600;color:var(--text)">${veh.marca} ${veh.modelo} ${veh.anio || ""}</div>
             <div style="font-size:.68rem;color:var(--muted)">${veh.tipo_vehiculo || ""}</div>
             ${masVeh > 0 ? `<div style="font-size:.66rem;color:var(--pri);font-weight:700">+${masVeh} vehículo${masVeh > 1 ? "s" : ""} más</div>` : ""}`
        : `<span style="color:var(--muted);font-size:.78rem">Sin vehículo</span>`}
      </td>
      <td>
        ${veh?.placa
        ? `<span style="background:var(--pri-lt);color:var(--pri);font-size:.72rem;font-weight:800;padding:3px 10px;border-radius:6px;letter-spacing:.06em">${veh.placa.toUpperCase()}</span>`
        : "—"}
      </td>
      <td>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap">
          <button class="btn-ver"  onclick="verCliente(${c.id_cliente})">👁 Ver</button>
          <button class="btn-edit" onclick="editarCliente(${c.id_cliente})">✏️ Editar</button>
          <button class="btn-del"  onclick="eliminarCliente(${c.id_cliente}, '${(c.nombre + " " + (c.apellido || "")).trim().replace(/'/g, "\\'")}')">🗑</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function filtrarClientes() {
  const q = document.getElementById("buscador").value.toLowerCase().trim();
  if (!q) { renderTabla(todosLosClientes); return; }
  const filtrados = todosLosClientes.filter(c => {
    const placas = (c.vehiculos || []).map(v => v.placa).join(" ");
    const vehStr = (c.vehiculos || []).map(v => `${v.marca} ${v.modelo}`).join(" ");
    return `${c.nombre} ${c.apellido} ${c.numero_documento} ${c.telefono} ${c.correo} ${c.direccion} ${placas} ${vehStr}`
      .toLowerCase().includes(q);
  });
  renderTabla(filtrados);
}

function toggleFormulario() {
  const panel = document.getElementById("formPanel");
  if (panel.classList.contains("visible")) {
    cancelarFormulario();
  } else {
    modoEdicion = false; idClienteEdicion = null;
    limpiarFormulario();
    setText("formTitle", "Registrar nuevo cliente");
    document.getElementById("btnGuardar").textContent = "✓ Guardar Cliente";
    panel.classList.add("visible");
    document.getElementById("cli-nombre").focus();
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function cancelarFormulario() {
  document.getElementById("formPanel").classList.remove("visible");
  limpiarFormulario();
  modoEdicion = false; idClienteEdicion = null;
}

function limpiarFormulario() {
  ["editId", "cli-nombre", "cli-apellido", "cli-documento",
    "cli-telefono", "cli-correo", "cli-direccion",
    "cli-placa", "cli-marca", "cli-modelo", "cli-anio"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
  const tv = document.getElementById("cli-tipo-vehiculo");
  if (tv) tv.value = "";
}

// ══════════════════════════════════════════════════════
//  GUARDAR — solo nombre es obligatorio, año opcional
// ══════════════════════════════════════════════════════
async function guardarCliente() {
  const nombre = document.getElementById("cli-nombre").value.trim();
  const apellido = document.getElementById("cli-apellido").value.trim();
  const documento = document.getElementById("cli-documento").value.trim();
  const telefono = document.getElementById("cli-telefono").value.trim();
  const correo = document.getElementById("cli-correo").value.trim();
  const direccion = document.getElementById("cli-direccion").value.trim();
  const placa = document.getElementById("cli-placa").value.trim().toUpperCase();
  const marca = document.getElementById("cli-marca").value.trim();
  const modelo = document.getElementById("cli-modelo").value.trim();
  const anio = document.getElementById("cli-anio").value.trim();
  const tipo_vehiculo = document.getElementById("cli-tipo-vehiculo").value;

  // ── Solo el nombre es obligatorio ──
  if (!nombre) { mostrarToast("El nombre es obligatorio", "warn"); return; }

  const btn = document.getElementById("btnGuardar");
  btn.disabled = true; btn.textContent = "Guardando...";

  try {
    const bodyCliente = {
      nombre,
      apellido: apellido || null,
      numero_documento: documento || null,
      telefono: telefono || null,
      correo: correo || null,
      direccion: direccion || null
    };

    const resCliente = await fetch(
      modoEdicion ? `${API}/clientes/${idClienteEdicion}` : `${API}/clientes`,
      { method: modoEdicion ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyCliente) }
    );
    if (!resCliente.ok) throw new Error("Error guardando cliente");

    const clienteGuardado = await resCliente.json();
    const id_cliente = clienteGuardado.id_cliente || idClienteEdicion;

    // Guardar vehículo si hay al menos placa o marca
    if (placa || marca) {
      const bodyVeh = {
        placa: placa || null,
        marca: marca || null,
        modelo: modelo || null,
        tipo_vehiculo: tipo_vehiculo || null,
        anio: anio ? parseInt(anio) : null,   // año opcional
        id_cliente
      };
      await fetch(`${API}/vehiculos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyVeh)
      });
    }

    mostrarToast(modoEdicion ? "Cliente actualizado ✓" : "Cliente registrado ✓", "ok");
    cancelarFormulario();
    await cargarClientes();

  } catch (err) {
    console.error(err);
    mostrarToast("Error al guardar el cliente", "error");
  }

  btn.disabled = false; btn.textContent = "✓ Guardar Cliente";
}

function verCliente(id) {
  const c = todosLosClientes.find(x => x.id_cliente === id);
  if (!c) return;
  const vehHTML = (c.vehiculos || []).length > 0
    ? (c.vehiculos || []).map(v => `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:.8rem 1rem;margin-top:.6rem">
          <div style="font-weight:700;font-size:.85rem;color:var(--text)">${v.marca || ""} ${v.modelo || ""} ${v.anio || ""}</div>
          <div style="font-size:.75rem;color:var(--muted);margin-top:2px">Placa: <strong style="color:var(--pri)">${(v.placa || "—").toUpperCase()}</strong> · Tipo: ${v.tipo_vehiculo || "—"}</div>
        </div>`).join("")
    : `<div style="font-size:.82rem;color:var(--muted);padding:.5rem 0">Sin vehículos registrados</div>`;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <div style="display:flex;align-items:center;gap:.8rem;margin-bottom:1.2rem">
        <div class="avatar" style="width:44px;height:44px;font-size:1rem">${((c.nombre || "?")[0] + (c.apellido || "")[0] || "").toUpperCase()}</div>
        <div><h3 style="margin:0;font-size:1rem">${c.nombre} ${c.apellido || ""}</h3><p style="font-size:.72rem;color:var(--muted);margin:0">Ficha de cliente · ID ${c.id_cliente}</p></div>
      </div>
      <div class="modal-row"><span>Documento</span><span>${c.numero_documento || "—"}</span></div>
      <div class="modal-row"><span>Teléfono</span><span>${c.telefono || "—"}</span></div>
      <div class="modal-row"><span>Correo</span><span>${c.correo || "—"}</span></div>
      <div class="modal-row"><span>Dirección</span><span>${c.direccion || "—"}</span></div>
      <div style="margin-top:1rem">
        <p style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:.2rem">🚗 Vehículos</p>
        ${vehHTML}
      </div>
      <div style="margin-top:1.2rem;display:flex;gap:.6rem;justify-content:flex-end">
        <button onclick="this.closest('.modal-overlay').remove()" style="background:var(--bg);border:1.5px solid var(--border);color:var(--muted);border-radius:10px;padding:.5rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">Cerrar</button>
        <button onclick="this.closest('.modal-overlay').remove();editarCliente(${id})" style="background:var(--pri);color:#fff;border:none;border-radius:10px;padding:.5rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">✏️ Editar</button>
      </div>
    </div>`;
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function editarCliente(id) {
  const c = todosLosClientes.find(x => x.id_cliente === id);
  if (!c) return;
  modoEdicion = true; idClienteEdicion = c.id_cliente;
  document.getElementById("editId").value = c.id_cliente;
  document.getElementById("cli-nombre").value = c.nombre || "";
  document.getElementById("cli-apellido").value = c.apellido || "";
  document.getElementById("cli-documento").value = c.numero_documento || "";
  document.getElementById("cli-telefono").value = c.telefono || "";
  document.getElementById("cli-correo").value = c.correo || "";
  document.getElementById("cli-direccion").value = c.direccion || "";
  const veh = c.vehiculos?.[0];
  if (veh) {
    document.getElementById("cli-placa").value = veh.placa || "";
    document.getElementById("cli-marca").value = veh.marca || "";
    document.getElementById("cli-modelo").value = veh.modelo || "";
    document.getElementById("cli-anio").value = veh.anio || "";
    document.getElementById("cli-tipo-vehiculo").value = veh.tipo_vehiculo || "";
  }
  setText("formTitle", "Editar cliente");
  document.getElementById("btnGuardar").textContent = "✓ Actualizar Cliente";
  const panel = document.getElementById("formPanel");
  panel.classList.add("visible");
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function eliminarCliente(id, nombre) {
  if (!await confirmar(`¿Eliminar al cliente "${nombre}"?\nTambién se eliminarán sus vehículos asociados.`)) return;
  try {
    const res = await fetch(`${API}/clientes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    mostrarToast(`"${nombre}" eliminado`, "ok");
    await cargarClientes();
  } catch { mostrarToast("Error al eliminar el cliente", "error"); }
}

function confirmar(mensaje) {
  return new Promise(resolve => {
    document.getElementById("fc-confirm")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "fc-confirm";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeUp .2s ease";
    overlay.innerHTML = `<div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:1.8rem;max-width:360px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.15)"><p style="font-size:.9rem;font-weight:600;color:var(--text);margin-bottom:1.4rem;line-height:1.6;white-space:pre-line">${mensaje}</p><div style="display:flex;gap:.7rem;justify-content:flex-end"><button id="fc-no" style="background:var(--bg);border:1.5px solid var(--border);color:var(--muted);border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">Cancelar</button><button id="fc-yes" style="background:#dc2626;color:#fff;border:none;border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">Eliminar</button></div></div>`;
    document.body.appendChild(overlay);
    document.getElementById("fc-yes").onclick = () => { overlay.remove(); resolve(true); };
    document.getElementById("fc-no").onclick = () => { overlay.remove(); resolve(false); };
    overlay.addEventListener("click", e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
  });
}

function mostrarToast(msg, tipo = "ok") {
  const c = { ok: { bg: "var(--green-lt)", border: "var(--green-border)", text: "var(--green)", icon: "✓" }, warn: { bg: "#fffbeb", border: "#fde68a", text: "#d97706", icon: "⚠" }, error: { bg: "#fff1f2", border: "#fecdd3", text: "#e11d48", icon: "✕" } }[tipo];
  document.getElementById("fc-toast")?.remove();
  const t = document.createElement("div");
  t.id = "fc-toast";
  t.style.cssText = `position:fixed;bottom:1.8rem;right:1.8rem;z-index:9999;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:.75rem 1.2rem;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.1);display:flex;align-items:center;gap:.6rem;max-width:320px`;
  t.innerHTML = `<span>${c.icon}</span>${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}