// ══════════════════════════════════════════════════════
//  FRÍO CARS — carrito.js
//  Lee productos de ventas.js (localStorage "carrito")
//  Selecciona cliente, procesa pago y genera factura
// ══════════════════════════════════════════════════════

const API = "https://friocars-backend.onrender.com/api";

let carrito  = JSON.parse(localStorage.getItem("carrito")) || [];
let clientes = [];

// ── INIT ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  cargarClientes();
  renderCarrito();
});


// ══════════════════════════════════════════════════════
//  CARGAR CLIENTES EN SELECT
// ══════════════════════════════════════════════════════
async function cargarClientes() {
  const select = document.getElementById("clienteSelect");
  try {
    const res = await fetch(`${API}/clientes`);
    clientes  = await res.json();

    select.innerHTML = `<option value="">— Selecciona un cliente —</option>`;
    clientes.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id_cliente;
      opt.textContent = `${c.nombre} ${c.apellido}`;
      select.appendChild(opt);
    });

    // Si venía preseleccionado de ventas.js
    const idGuardado = localStorage.getItem("clienteId");
    if (idGuardado) {
      select.value = idGuardado;
      onClienteChange();
    }
  } catch {
    select.innerHTML = `<option value="">Error cargando clientes</option>`;
  }
}


// ══════════════════════════════════════════════════════
//  CAMBIO DE CLIENTE → mostrar info
// ══════════════════════════════════════════════════════
function onClienteChange() {
  const select  = document.getElementById("clienteSelect");
  const id      = parseInt(select.value);
  const info    = document.getElementById("clienteInfo");
  const cliente = clientes.find(c => c.id_cliente === id);

  if (!cliente) { info.style.display = "none"; return; }

  const iniciales = `${(cliente.nombre||"?")[0]}${(cliente.apellido||"")[0]||""}`.toUpperCase();
  document.getElementById("clienteAvatar").textContent  = iniciales;
  document.getElementById("clienteNombre").textContent  = `${cliente.nombre} ${cliente.apellido}`;
  document.getElementById("clienteDetalle").textContent = `${cliente.telefono || ""}${cliente.numero_documento ? " · " + cliente.numero_documento : ""}`;
  info.style.display = "flex";
}


// ══════════════════════════════════════════════════════
//  RENDER CARRITO
// ══════════════════════════════════════════════════════
function renderCarrito() {
  const tbody = document.getElementById("carritoBody");
  const badge = document.getElementById("badge-items");
  const topbarItems = document.getElementById("topbar-items");

  const totalItems = carrito.reduce((s, p) => s + p.cantidad, 0);
  if (badge) badge.textContent = `${totalItems} artículo${totalItems !== 1 ? "s" : ""}`;
  if (topbarItems) topbarItems.textContent = totalItems;

  // Badge sidebar
  const sidebarBadge = document.getElementById("sidebarCartCount");
  if (sidebarBadge) {
    sidebarBadge.textContent = totalItems;
    sidebarBadge.classList.toggle("hidden", totalItems === 0);
  }

  if (carrito.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-cart">
          <span>🛒</span>
          El carrito está vacío —
          <a href="ventas.html" style="color:var(--pri);font-weight:700">ir a ventas</a>
        </div>
      </td></tr>`;
    actualizarResumen(0);
    return;
  }

  tbody.innerHTML = "";
  let subtotal = 0;

  carrito.forEach(p => {
    const sub = p.precio * p.cantidad;
    subtotal += sub;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:600;color:var(--text)">${p.nombre}</td>
      <td>
        <div class="qty-control">
          <button class="qty-btn" onclick="cambiarCantidad(${p.id_producto}, -1)">−</button>
          <span class="qty-val">${p.cantidad}</span>
          <button class="qty-btn" onclick="cambiarCantidad(${p.id_producto}, +1)">+</button>
        </div>
      </td>
      <td style="color:var(--muted)">$${Number(p.precio).toLocaleString("es-CO")}</td>
      <td style="font-weight:700;color:var(--green)">$${Number(sub).toLocaleString("es-CO")}</td>
      <td><button class="btn-quitar" onclick="quitarDelCarrito(${p.id_producto})">Quitar</button></td>
    `;
    tbody.appendChild(tr);
  });

  actualizarResumen(subtotal);
}


// ══════════════════════════════════════════════════════
//  ACTUALIZAR RESUMEN (subtotal / IVA / total)
// ══════════════════════════════════════════════════════
function actualizarResumen(subtotal) {
  const iva   = subtotal * 0.19;
  const total = subtotal + iva;

  const fmt = v => Number(v).toLocaleString("es-CO", { minimumFractionDigits: 0 });

  setText("resumen-subtotal", `$${fmt(subtotal)}`);
  setText("resumen-iva",      `$${fmt(iva)}`);
  setText("resumen-total",    fmt(total));
  setText("totalDisplay",     fmt(total));
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}


// ══════════════════════════════════════════════════════
//  CAMBIAR CANTIDAD
// ══════════════════════════════════════════════════════
function cambiarCantidad(id, delta) {
  const p = carrito.find(x => x.id_producto === id);
  if (!p) return;

  p.cantidad += delta;
  if (p.cantidad <= 0) {
    carrito = carrito.filter(x => x.id_producto !== id);
  }
  guardarCarritoLocal();
  renderCarrito();
}

function quitarDelCarrito(id) {
  carrito = carrito.filter(x => x.id_producto !== id);
  guardarCarritoLocal();
  renderCarrito();
}

function vaciarCarrito() {
  if (carrito.length === 0) return;
  confirmar("¿Vaciar el carrito? Se eliminarán todos los productos.").then(ok => {
    if (!ok) return;
    carrito = [];
    guardarCarritoLocal();
    renderCarrito();
  });
}

function guardarCarritoLocal() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}


// ══════════════════════════════════════════════════════
//  PROCESAR PAGO
// ══════════════════════════════════════════════════════
async function procesarPago() {
  const select     = document.getElementById("clienteSelect");
  const id_cliente = parseInt(select.value);

  if (!id_cliente) {
    mostrarToast("Selecciona un cliente antes de procesar el pago", "warn");
    select.focus();
    return;
  }
  if (carrito.length === 0) {
    mostrarToast("El carrito está vacío", "warn");
    return;
  }

  const btn = document.getElementById("btnPagar");
  btn.disabled    = true;
  btn.textContent = "⏳ Procesando...";

  try {
    const clienteSeleccionado = clientes.find(c => c.id_cliente === id_cliente);
    const nombreCliente = clienteSeleccionado
      ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`
      : "Cliente General";

    // Llamar al backend — descuenta stock automáticamente
    const res = await fetch(`${API}/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productos:   carrito,
        id_cliente
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error en el servidor");
    }

    const data = await res.json();

    // Calcular IVA para factura
    const subtotal   = data.total;
    const iva        = subtotal * 0.19;
    const totalFinal = subtotal + iva;

    // Guardar datos para factura
    localStorage.setItem("factura",         JSON.stringify(carrito));
    localStorage.setItem("cliente",         nombreCliente);
    localStorage.setItem("clienteId",       id_cliente);
    localStorage.setItem("subtotalFactura", subtotal);
    localStorage.setItem("ivaFactura",      iva.toFixed(2));
    localStorage.setItem("totalFactura",    totalFinal.toFixed(2));
    localStorage.setItem("ventaId",         data.ventaId);

    // Limpiar carrito
    carrito = [];
    localStorage.removeItem("carrito");

    mostrarToast("Venta procesada correctamente ✓", "ok");

    // Redirigir a factura
    setTimeout(() => { window.location.href = "factura.html"; }, 800);

  } catch (err) {
    console.error(err);
    mostrarToast(`Error: ${err.message}`, "error");
    btn.disabled    = false;
    btn.textContent = "✓ Procesar Pago";
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
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center";
    overlay.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:1.8rem;max-width:340px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.15)">
        <p style="font-size:.9rem;font-weight:600;color:var(--text);margin-bottom:1.4rem;line-height:1.5">${mensaje}</p>
        <div style="display:flex;gap:.7rem;justify-content:flex-end">
          <button id="fc-no"  style="background:var(--bg);border:1.5px solid var(--border);color:var(--muted);border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">Cancelar</button>
          <button id="fc-yes" style="background:#dc2626;color:#fff;border:none;border-radius:10px;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem">Vaciar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById("fc-yes").onclick = () => { overlay.remove(); resolve(true);  };
    document.getElementById("fc-no").onclick  = () => { overlay.remove(); resolve(false); };
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
  }[tipo];
  document.getElementById("fc-toast")?.remove();
  const t = document.createElement("div");
  t.id = "fc-toast";
  t.style.cssText = `position:fixed;bottom:1.8rem;right:1.8rem;z-index:9999;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:.75rem 1.2rem;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.1);display:flex;align-items:center;gap:.6rem;animation:slideToast .25s ease;max-width:320px`;
  t.innerHTML = `<span>${c.icon}</span>${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}