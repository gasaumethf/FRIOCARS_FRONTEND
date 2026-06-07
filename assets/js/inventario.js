// ══════════════════════════════════════════════════════
//  FRÍO CARS — inventario.js
//  CRUD completo de productos contra el backend
// ══════════════════════════════════════════════════════

const API = "https://friocars-backend.onrender.com/api";

let todosLosProductos = []; // cache local
let modoEdicion       = false;

// ── INIT ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
});


// ══════════════════════════════════════════════════════
//  CARGAR PRODUCTOS
// ══════════════════════════════════════════════════════
async function cargarProductos() {
  const tbody = document.getElementById("tablaProductos");
  tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><span style="font-size:2rem">⏳</span>Cargando...</div></td></tr>`;

  try {
    const res = await fetch(`${API}/productos`);
    if (!res.ok) throw new Error("Error obteniendo productos");
    todosLosProductos = await res.json();

    actualizarKPIs();
    poblarFiltroCategoria();
    renderTabla(todosLosProductos);

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <span>⚠️</span>
          <p style="font-weight:600;color:#dc2626">Error al cargar productos</p>
          <button onclick="cargarProductos()" style="margin-top:.8rem;background:var(--pri);color:#fff;border:none;border-radius:10px;padding:.5rem 1.2rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem">↺ Reintentar</button>
        </div>
      </td></tr>`;
  }
}


// ══════════════════════════════════════════════════════
//  KPIs
// ══════════════════════════════════════════════════════
function actualizarKPIs() {
  const total      = todosLosProductos.length;
  const stockSum   = todosLosProductos.reduce((s, p) => s + (p.stock || 0), 0);
  const stockBajo  = todosLosProductos.filter(p => p.stock < 5).length;
  const cats       = new Set(todosLosProductos.map(p => p.categoria).filter(Boolean)).size;

  document.getElementById("totalProductos").textContent  = total;
  document.getElementById("stockTotal").textContent      = stockSum.toLocaleString("es-CO");
  document.getElementById("stockBajo").textContent       = stockBajo;
  document.getElementById("totalCategorias").textContent = cats;
}


// ══════════════════════════════════════════════════════
//  POBLAR FILTRO DE CATEGORÍAS
// ══════════════════════════════════════════════════════
function poblarFiltroCategoria() {
  const cats = [...new Set(todosLosProductos.map(p => p.categoria).filter(Boolean))].sort();

  // Filtro de tabla
  const sel = document.getElementById("filtroCategoria");
  sel.innerHTML = `<option value="">Todas las categorías</option>`;
  cats.forEach(c => { sel.innerHTML += `<option value="${c}">${c}</option>`; });

  // Datalist del formulario
  const dl = document.getElementById("categorias-list");
  if (dl) {
    dl.innerHTML = cats.map(c => `<option value="${c}">`).join("");
  }
}


// ══════════════════════════════════════════════════════
//  RENDER TABLA
// ══════════════════════════════════════════════════════
function renderTabla(productos) {
  const tbody = document.getElementById("tablaProductos");
  const count = document.getElementById("tabla-count");

  if (count) count.textContent = `${productos.length} producto${productos.length !== 1 ? "s" : ""}`;

  if (productos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><span>📦</span>No se encontraron productos</div></td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  productos.forEach(p => {
    // Badge stock
    let stockTag = "";
    if (p.stock === 0)       stockTag = `<span class="tag tag-danger">Sin stock</span>`;
    else if (p.stock < 5)    stockTag = `<span class="tag tag-warn">Bajo</span>`;
    else if (p.stock <= 20)  stockTag = `<span class="tag" style="background:#e0f2fe;color:#0284c7">Medio</span>`;
    else                     stockTag = `<span class="tag tag-ok">Disponible</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div style="font-weight:700;color:var(--text)">${p.nombre}</div>
        ${p.descripcion ? `<div style="font-size:.72rem;color:var(--muted);margin-top:2px">${p.descripcion.slice(0,60)}${p.descripcion.length>60?"...":""}</div>` : ""}
      </td>
      <td>
        <span style="background:var(--pri-lt);color:var(--pri);font-size:.72rem;font-weight:700;padding:2px 9px;border-radius:20px">
          ${p.categoria || "—"}
        </span>
      </td>
      <td style="font-weight:700;color:var(--green)">$${Number(p.precio).toLocaleString("es-CO")}</td>
      <td style="font-weight:700;color:var(--text)">${p.stock}</td>
      <td>${stockTag}</td>
      <td>
        <div style="display:flex;gap:.4rem">
          <button class="btn-edit" onclick="editarProducto(${p.id_producto})">✏️ Editar</button>
          <button class="btn-del"  onclick="eliminarProducto(${p.id_producto}, '${p.nombre.replace(/'/g,"\\'")}')">🗑 Eliminar</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}


// ══════════════════════════════════════════════════════
//  FILTRAR PRODUCTOS
// ══════════════════════════════════════════════════════
function filtrarProductos() {
  const texto     = document.getElementById("buscador").value.toLowerCase().trim();
  const categoria = document.getElementById("filtroCategoria").value;
  const stockFilt = document.getElementById("filtroStock").value;

  const filtrados = todosLosProductos.filter(p => {
    const matchTexto = !texto ||
      p.nombre.toLowerCase().includes(texto) ||
      (p.categoria || "").toLowerCase().includes(texto) ||
      (p.descripcion || "").toLowerCase().includes(texto);

    const matchCat = !categoria || p.categoria === categoria;

    const matchStock =
      !stockFilt ||
      (stockFilt === "bajo"  && p.stock < 5) ||
      (stockFilt === "medio" && p.stock >= 5 && p.stock <= 20) ||
      (stockFilt === "alto"  && p.stock > 20);

    return matchTexto && matchCat && matchStock;
  });

  renderTabla(filtrados);
}


// ══════════════════════════════════════════════════════
//  FORMULARIO — mostrar / ocultar
// ══════════════════════════════════════════════════════
function toggleFormulario() {
  const panel = document.getElementById("formPanel");
  const visible = panel.classList.contains("visible");
  if (visible) {
    cancelarFormulario();
  } else {
    modoEdicion = false;
    limpiarFormulario();
    document.getElementById("formTitle").textContent = "Nuevo Producto";
    document.getElementById("btnGuardar").textContent = "✓ Guardar Producto";
    panel.classList.add("visible");
    document.getElementById("nombre").focus();
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function cancelarFormulario() {
  document.getElementById("formPanel").classList.remove("visible");
  limpiarFormulario();
  modoEdicion = false;
}

function limpiarFormulario() {
  ["nombre","categoria","precio","stock","descripcion","editId"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}


// ══════════════════════════════════════════════════════
//  CREAR / ACTUALIZAR PRODUCTO
// ══════════════════════════════════════════════════════
async function guardarProducto() {
  const nombre      = document.getElementById("nombre").value.trim();
  const categoria   = document.getElementById("categoria").value.trim();
  const precio      = parseFloat(document.getElementById("precio").value);
  const stock       = parseInt(document.getElementById("stock").value);
  const descripcion = document.getElementById("descripcion").value.trim();
  const editId      = document.getElementById("editId").value;

  // Validaciones
  if (!nombre)          { mostrarToast("El nombre es obligatorio", "warn"); return; }
  if (isNaN(precio) || precio < 0) { mostrarToast("Ingresa un precio válido", "warn"); return; }
  if (isNaN(stock)  || stock < 0)  { mostrarToast("Ingresa un stock válido", "warn"); return; }

  const btn = document.getElementById("btnGuardar");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  const body = { nombre, categoria, precio, stock, descripcion };

  try {
    let res;
    if (modoEdicion && editId) {
      res = await fetch(`${API}/productos/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } else {
      res = await fetch(`${API}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    }

    if (!res.ok) throw new Error("Error guardando producto");

    mostrarToast(modoEdicion ? "Producto actualizado ✓" : "Producto creado ✓", "ok");
    cancelarFormulario();
    await cargarProductos();

  } catch (err) {
    console.error(err);
    mostrarToast("Error al guardar el producto", "error");
  }

  btn.disabled = false;
  btn.textContent = "✓ Guardar Producto";
}


// ══════════════════════════════════════════════════════
//  EDITAR PRODUCTO
// ══════════════════════════════════════════════════════
function editarProducto(id) {
  const p = todosLosProductos.find(x => x.id_producto === id);
  if (!p) return;

  modoEdicion = true;
  document.getElementById("editId").value      = p.id_producto;
  document.getElementById("nombre").value      = p.nombre;
  document.getElementById("categoria").value   = p.categoria || "";
  document.getElementById("precio").value      = p.precio;
  document.getElementById("stock").value       = p.stock;
  document.getElementById("descripcion").value = p.descripcion || "";

  document.getElementById("formTitle").textContent  = "Editar Producto";
  document.getElementById("btnGuardar").textContent = "✓ Actualizar Producto";

  const panel = document.getElementById("formPanel");
  panel.classList.add("visible");
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}


// ══════════════════════════════════════════════════════
//  ELIMINAR PRODUCTO
// ══════════════════════════════════════════════════════
async function eliminarProducto(id, nombre) {
  // Confirmación visual en lugar de confirm()
  if (!await confirmar(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;

  try {
    const res = await fetch(`${API}/productos/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    mostrarToast(`"${nombre}" eliminado`, "ok");
    await cargarProductos();
  } catch {
    mostrarToast("Error al eliminar el producto", "error");
  }
}


// ══════════════════════════════════════════════════════
//  CONFIRMACIÓN CUSTOM (reemplaza confirm())
// ══════════════════════════════════════════════════════
function confirmar(mensaje) {
  return new Promise(resolve => {
    document.getElementById("fc-confirm")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "fc-confirm";
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;
      display:flex;align-items:center;justify-content:center;
      animation:fadeUp .2s ease;
    `;
    overlay.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:1.8rem;max-width:360px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.15)">
        <p style="font-size:.9rem;font-weight:600;color:var(--text);margin-bottom:1.4rem;line-height:1.5">${mensaje}</p>
        <div style="display:flex;gap:.7rem;justify-content:flex-end">
          <button id="fc-no"  style="background:var(--bg);border:1.5px solid var(--border);color:var(--muted);border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">Cancelar</button>
          <button id="fc-yes" style="background:#dc2626;color:#fff;border:none;border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">Eliminar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById("fc-yes").onclick = () => { overlay.remove(); resolve(true);  };
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
    warn:  { bg:"#fffbeb",         border:"#fde68a",             text:"#d97706",      icon:"⚠" },
    error: { bg:"#fff1f2",         border:"#fecdd3",             text:"#e11d48",      icon:"✕" },
  }[tipo] || {};

  document.getElementById("fc-toast")?.remove();
  const t = document.createElement("div");
  t.id = "fc-toast";
  t.style.cssText = `position:fixed;bottom:1.8rem;right:1.8rem;z-index:9999;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:.75rem 1.2rem;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.1);display:flex;align-items:center;gap:.6rem;animation:slideToast .25s ease;max-width:320px;`;
  t.innerHTML = `<span>${c.icon}</span>${msg}`;

  if (!document.getElementById("toast-style")) {
    const s = document.createElement("style");
    s.id = "toast-style";
    s.textContent = `@keyframes slideToast{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.appendChild(s);
  }

  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}