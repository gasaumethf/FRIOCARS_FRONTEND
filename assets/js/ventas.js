// ══════════════════════════════════════════════════════
//  FRÍO CARS — ventas.js
//  Compatible con el sistema de diseño del dashboard
// ══════════════════════════════════════════════════════

let carrito = [];
const API = "https://friocars-backend.onrender.com/api";

// ── INIT ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  cargarClientes();
});


// ══════════════════════════════════════════════════════
//  CARGAR PRODUCTOS
// ══════════════════════════════════════════════════════
async function cargarProductos() {
  const contenedor = document.getElementById("listaProductos");
  const counter    = document.getElementById("productos-count");

  // Skeleton loader
  contenedor.innerHTML = Array(6).fill(`
    <div style="
      background:var(--surface);border:1.5px solid var(--border);
      border-radius:16px;padding:1.2rem 1.3rem;
      display:flex;flex-direction:column;gap:.7rem;
      animation:pulse-sk 1.4s ease-in-out infinite
    ">
      <div style="height:18px;background:var(--border);border-radius:8px;width:70%"></div>
      <div style="height:13px;background:var(--border);border-radius:8px;width:45%"></div>
      <div style="height:22px;background:var(--border);border-radius:8px;width:40%"></div>
      <div style="height:13px;background:var(--border);border-radius:8px;width:30%"></div>
      <div style="height:36px;background:var(--border);border-radius:10px"></div>
    </div>
  `).join("");

  try {
    const res = await fetch(`${API}/productos`);
    if (!res.ok) throw new Error("Error obteniendo productos");
    const productos = await res.json();

    if (counter) counter.textContent = `${productos.length} producto${productos.length !== 1 ? "s" : ""} disponibles`;

    contenedor.innerHTML = "";

    if (productos.length === 0) {
      contenedor.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem 1rem;color:var(--muted)">
          <span style="font-size:2.5rem;display:block;margin-bottom:.6rem">📦</span>
          <p style="font-weight:600">Sin productos disponibles</p>
        </div>`;
      return;
    }

    productos.forEach(p => {
      const card = document.createElement("div");
      card.className = "producto-card";
      card.innerHTML = `
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem">
          <div class="producto-nombre">${p.nombre}</div>
          ${p.stock <= 5
            ? `<span style="background:#fee2e2;color:#dc2626;font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0">Bajo stock</span>`
            : p.stock <= 15
            ? `<span style="background:#fef3c7;color:#d97706;font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0">Stock medio</span>`
            : `<span style="background:var(--green-lt);color:var(--green);font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0">Disponible</span>`
          }
        </div>
        <p style="font-size:.75rem;font-weight:600;color:var(--muted)">
          ${p.categoria || "Sin categoría"}
        </p>
        <p class="producto-precio">
          $${Number(p.precio).toLocaleString("es-CO")}
        </p>
        <p class="producto-stock">
          📦 Stock: <strong style="color:var(--text)">${p.stock}</strong>
        </p>
        <button
          class="btn-agregar"
          onclick='agregarAlCarrito(${JSON.stringify(p).replace(/'/g, "&#39;")})'
          ${p.stock === 0 ? "disabled style=\"opacity:.5;cursor:not-allowed\"" : ""}>
          ${p.stock === 0 ? "Sin stock" : "+ Agregar al carrito"}
        </button>
      `;
      contenedor.appendChild(card);
    });

  } catch (error) {
    console.error("Error cargando productos:", error);
    contenedor.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:2rem;color:#dc2626">
        <span style="font-size:2rem;display:block;margin-bottom:.5rem">⚠️</span>
        <p style="font-weight:600">No se pudieron cargar los productos</p>
        <p style="font-size:.78rem;color:var(--muted);margin-top:.3rem">Verifica tu conexión e intenta de nuevo</p>
        <button onclick="cargarProductos()" style="
          margin-top:1rem;background:var(--pri);color:#fff;border:none;
          border-radius:10px;padding:.5rem 1.2rem;font-weight:700;cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem
        ">↺ Reintentar</button>
      </div>`;
    if (counter) counter.textContent = "Error al cargar";
  }
}


// ══════════════════════════════════════════════════════
//  CARGAR CLIENTES
// ══════════════════════════════════════════════════════
async function cargarClientes() {
  const select = document.getElementById("clienteSelect");
  try {
    const res = await fetch(`${API}/clientes`);
    const clientes = await res.json();

    select.innerHTML = `<option value="">— Selecciona un cliente —</option>`;

    clientes.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id_cliente;
      opt.textContent = `${c.nombre} ${c.apellido}`;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error("Error cargando clientes:", error);
    select.innerHTML = `<option value="">Error cargando clientes</option>`;
  }
}


// ══════════════════════════════════════════════════════
//  AGREGAR AL CARRITO
// ══════════════════════════════════════════════════════
function agregarAlCarrito(producto) {
  const existente = carrito.find(p => p.id_producto === producto.id_producto);

  if (existente) {
    if (existente.cantidad >= producto.stock) {
      mostrarToast(`Stock máximo alcanzado (${producto.stock} unidades)`, "warn");
      return;
    }
    existente.cantidad++;
  } else {
    producto.cantidad = 1;
    carrito.push(producto);
  }

  mostrarToast(`"${producto.nombre}" agregado al carrito ✓`, "ok");
  renderCarrito();
}


// ══════════════════════════════════════════════════════
//  ELIMINAR / AJUSTAR CANTIDAD
// ══════════════════════════════════════════════════════
function eliminarDelCarrito(id) {
  const producto = carrito.find(p => p.id_producto === id);
  if (!producto) return;

  if (producto.cantidad > 1) {
    producto.cantidad--;
  } else {
    carrito = carrito.filter(p => p.id_producto !== id);
  }
  renderCarrito();
}

function sumarCantidad(id) {
  const producto = carrito.find(p => p.id_producto === id);
  if (!producto) return;
  if (producto.cantidad >= producto.stock) {
    mostrarToast("Stock máximo alcanzado", "warn");
    return;
  }
  producto.cantidad++;
  renderCarrito();
}


// ══════════════════════════════════════════════════════
//  RENDER CARRITO
// ══════════════════════════════════════════════════════
function renderCarrito() {
  const tbody     = document.getElementById("carrito");
  const totalSpan = document.getElementById("total");

  // Badge sidebar
  const badge = document.getElementById("sidebarCartCount");
  const totalItems = carrito.reduce((s, p) => s + p.cantidad, 0);
  if (badge) {
    badge.textContent = totalItems;
    badge.classList.toggle("hidden", totalItems === 0);
  }

  if (carrito.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-cart">
          <span>🛒</span>
          Agrega productos al carrito para comenzar la venta
        </div>
      </td></tr>`;
    if (totalSpan) totalSpan.textContent = "0";
    return;
  }

  let total = 0;
  tbody.innerHTML = "";

  carrito.forEach(p => {
    const subtotal = p.precio * p.cantidad;
    total += subtotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:600;color:var(--text)">${p.nombre}</td>
      <td>
        <div class="qty-control">
          <button class="qty-btn" onclick="eliminarDelCarrito(${p.id_producto})">−</button>
          <span class="qty-val">${p.cantidad}</span>
          <button class="qty-btn" onclick="sumarCantidad(${p.id_producto})">+</button>
        </div>
      </td>
      <td style="color:var(--muted)">$${Number(p.precio).toLocaleString("es-CO")}</td>
      <td style="font-weight:700;color:var(--green)">$${Number(subtotal).toLocaleString("es-CO")}</td>
      <td>
        <button class="btn-eliminar"
          onclick="carrito=carrito.filter(x=>x.id_producto!==${p.id_producto});renderCarrito()">
          Quitar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (totalSpan) totalSpan.textContent = Number(total).toLocaleString("es-CO");
}


// ══════════════════════════════════════════════════════
//  GUARDAR VENTA
// ══════════════════════════════════════════════════════
async function guardarVenta() {
  if (carrito.length === 0) {
    mostrarToast("El carrito está vacío", "warn");
    return;
  }

  const clienteSelect = document.getElementById("clienteSelect");
  if (!clienteSelect.value) {
    mostrarToast("Selecciona un cliente antes de continuar", "warn");
    clienteSelect.focus();
    return;
  }

  const btnFinalizar = document.querySelector(".btn-finalizar");
  if (btnFinalizar) {
    btnFinalizar.disabled = true;
    btnFinalizar.textContent = "Procesando...";
  }

  try {
    const clienteTexto =
      clienteSelect.options[clienteSelect.selectedIndex]?.text || "Cliente General";

    const res = await fetch(`${API}/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productos: carrito })
    });

    if (!res.ok) throw new Error("Error guardando venta");

    const data = await res.json();

    // Calcular IVA
    const subtotal   = data.total;
    const iva        = subtotal * 0.19;
    const totalFinal = subtotal + iva;

    // Guardar factura en localStorage
    localStorage.setItem("factura",          JSON.stringify(carrito));
    localStorage.setItem("cliente",          clienteTexto);
    localStorage.setItem("subtotalFactura",  subtotal);
    localStorage.setItem("ivaFactura",       iva);
    localStorage.setItem("totalFactura",     totalFinal);
    localStorage.setItem("ventaId",          data.ventaId);

    carrito = [];
    window.location.href = "factura.html";

  } catch (error) {
    console.error("Error en venta:", error);
    mostrarToast("Error procesando la venta. Intenta de nuevo.", "error");
    if (btnFinalizar) {
      btnFinalizar.disabled = false;
      btnFinalizar.textContent = "✓ Finalizar Venta";
    }
  }
}


// ══════════════════════════════════════════════════════
//  TOAST NOTIFICACIONES
// ══════════════════════════════════════════════════════
function mostrarToast(msg, tipo = "ok") {
  const colores = {
    ok:    { bg: "var(--green-lt)",  border: "var(--green-border)", text: "var(--green)",  icon: "✓" },
    warn:  { bg: "#fffbeb",          border: "#fde68a",              text: "#d97706",       icon: "⚠" },
    error: { bg: "#fff1f2",          border: "#fecdd3",              text: "#e11d48",       icon: "✕" },
  };
  const c = colores[tipo] || colores.ok;

  // Remover toast anterior
  document.getElementById("fc-toast")?.remove();

  const toast = document.createElement("div");
  toast.id = "fc-toast";
  toast.style.cssText = `
    position:fixed;bottom:1.8rem;right:1.8rem;z-index:9999;
    background:${c.bg};border:1.5px solid ${c.border};color:${c.text};
    padding:.75rem 1.2rem;border-radius:14px;
    font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;
    box-shadow:0 8px 24px rgba(0,0,0,.1);
    display:flex;align-items:center;gap:.6rem;
    animation:slideToast .25s ease;
    max-width:320px;
  `;
  toast.innerHTML = `<span style="font-size:1rem">${c.icon}</span>${msg}`;

  // Keyframe inline
  if (!document.getElementById("toast-style")) {
    const s = document.createElement("style");
    s.id = "toast-style";
    s.textContent = `
      @keyframes slideToast{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse-sk{0%,100%{opacity:1}50%{opacity:.4}}
    `;
    document.head.appendChild(s);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}