// ══════════════════════════════════════════════════════
//  FRÍO CARS — ventas.js  (v2 — con buscador integrado)
// ══════════════════════════════════════════════════════

const API = "https://friocars-backend.onrender.com/api";

let clientes = [];
let clienteSeleccionado = null;
let _vsProductos = []; // catálogo completo para filtrar

// ── INIT ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    cargarClientes();
    iniciarBuscadorCliente();
    sincronizarBadgeCarrito();
});


// ══════════════════════════════════════════════════════
//  CARGAR PRODUCTOS
// ══════════════════════════════════════════════════════
async function cargarProductos() {
    const contenedor = document.getElementById("listaProductos");
    const counter = document.getElementById("productos-count");

    // Skeleton loader
    contenedor.innerHTML = Array(6).fill(`
        <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:16px;padding:1.2rem 1.3rem;display:flex;flex-direction:column;gap:.7rem;animation:pulse-sk 1.4s ease-in-out infinite">
            <div style="height:18px;background:var(--border);border-radius:8px;width:70%"></div>
            <div style="height:13px;background:var(--border);border-radius:8px;width:45%"></div>
            <div style="height:22px;background:var(--border);border-radius:8px;width:40%"></div>
            <div style="height:36px;background:var(--border);border-radius:10px"></div>
        </div>`).join("");

    try {
        const res = await fetch(`${API}/productos`);
        if (!res.ok) throw new Error();
        const productos = await res.json();

        // Guardar catálogo completo para el buscador
        _vsProductos = productos;

        // Poblar select de categorías
        vsInicializarFiltros(productos);

        // Render inicial (sin filtros)
        vsRenderGrid(productos, "");

        if (counter) counter.textContent = `${productos.length} producto${productos.length !== 1 ? "s" : ""} disponibles`;

    } catch {
        if (counter) counter.textContent = "Error al cargar";
        contenedor.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:2rem;color:#dc2626">
                <span style="font-size:2rem;display:block;margin-bottom:.5rem">⚠️</span>
                <p style="font-weight:600">No se pudieron cargar los productos</p>
                <button onclick="cargarProductos()" style="margin-top:1rem;background:var(--pri);color:#fff;border:none;border-radius:10px;padding:.5rem 1.2rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:.82rem">↺ Reintentar</button>
            </div>`;
    }
}


// ══════════════════════════════════════════════════════
//  BUSCADOR / FILTROS DE PRODUCTOS
// ══════════════════════════════════════════════════════

function vsInicializarFiltros(productos) {
    const sel = document.getElementById("vs-cat");
    if (!sel) return;

    // Extraer categorías únicas
    const cats = [...new Set(
        productos.map(p => p.categoria || "").filter(Boolean)
    )].sort();

    sel.innerHTML = `<option value="">Todas las categorías</option>` +
        cats.map(c => `<option value="${c.toLowerCase()}">${c}</option>`).join("");
}

function vsFiltrar() {
    const q = (document.getElementById("vs-q")?.value || "").toLowerCase().trim();
    const cat = (document.getElementById("vs-cat")?.value || "").toLowerCase();
    const stock = (document.getElementById("vs-stock")?.value || "").toLowerCase();
    const counter = document.getElementById("productos-count");

    const resultado = _vsProductos.filter(p => {
        // Texto libre: nombre + categoria + descripción
        const haystack = [
            p.nombre || "",
            p.categoria || "",
            p.descripcion || "",
            p.referencia || "",
            p.codigo || ""
        ].join(" ").toLowerCase();
        if (q && !haystack.includes(q)) return false;

        // Categoría
        const pCat = (p.categoria || "").toLowerCase();
        if (cat && pCat !== cat) return false;

        // Stock
        if (stock) {
            const nivel = vsNivelStock(p.stock ?? 0);
            if (nivel !== stock) return false;
        }

        return true;
    });

    vsRenderGrid(resultado, q);
    vsRenderChips(q, cat, stock);

    if (counter) {
        counter.textContent = resultado.length === _vsProductos.length
            ? `${_vsProductos.length} productos disponibles`
            : `${resultado.length} de ${_vsProductos.length} productos`;
    }
}

function vsNivelStock(cantidad) {
    if (cantidad <= 0) return "agotado";
    if (cantidad <= 5) return "bajo";
    if (cantidad <= 15) return "medio";
    return "alto";
}

function vsLimpiar() {
    const q = document.getElementById("vs-q");
    const c = document.getElementById("vs-cat");
    const s = document.getElementById("vs-stock");
    if (q) q.value = "";
    if (c) c.value = "";
    if (s) s.value = "";
    vsFiltrar();
}

// Chips de filtros activos
function vsRenderChips(q, cat, stock) {
    const box = document.getElementById("vs-chips");
    if (!box) return;

    const chips = [];
    if (q) chips.push({ label: `"${q}"`, fn: () => { document.getElementById("vs-q").value = ""; vsFiltrar(); } });
    if (cat) chips.push({ label: cat, fn: () => { document.getElementById("vs-cat").value = ""; vsFiltrar(); } });
    if (stock) chips.push({ label: stock, fn: () => { document.getElementById("vs-stock").value = ""; vsFiltrar(); } });

    window._vsChipFns = chips.map(c => c.fn);

    box.innerHTML = chips.map((c, i) => `
        <span style="display:inline-flex;align-items:center;gap:.35rem;background:var(--pri-lt);border:1px solid #bfdbfe;border-radius:20px;padding:3px 10px 3px 8px;font-size:.72rem;font-weight:700;color:var(--pri)">
            ${c.label}
            <button onclick="window._vsChipFns[${i}]()" style="background:none;border:none;cursor:pointer;color:var(--pri);font-size:.8rem;line-height:1;padding:0;display:flex;align-items:center">✕</button>
        </span>`).join("");
}


// ══════════════════════════════════════════════════════
//  RENDER GRID DE PRODUCTOS
// ══════════════════════════════════════════════════════
function vsRenderGrid(lista, q) {
    const contenedor = document.getElementById("listaProductos");
    const empty = document.getElementById("vs-empty");

    if (!lista.length) {
        contenedor.innerHTML = "";
        if (empty) empty.style.display = "block";
        return;
    }
    if (empty) empty.style.display = "none";

    contenedor.innerHTML = "";

    lista.forEach(p => {
        const nivel = vsNivelStock(p.stock ?? 0);
        const nivelCfg = {
            alto: { bg: "var(--green-lt)", color: "var(--green)", label: "Disponible" },
            medio: { bg: "#fef3c7", color: "#d97706", label: "Stock medio" },
            bajo: { bg: "#fee2e2", color: "#dc2626", label: "Bajo stock" },
            agotado: { bg: "var(--bg)", color: "var(--muted)", label: "Agotado" },
        }[nivel];

        // Highlight del texto buscado en el nombre
        const nombreRaw = p.nombre || "";
        const nombre = q
            ? nombreRaw.replace(
                new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
                '<mark style="background:#fef08a;color:#713f12;border-radius:3px;padding:0 2px">$1</mark>'
            )
            : nombreRaw;

        const agotado = nivel === "agotado";
        const card = document.createElement("div");
        card.className = "producto-card";
        card.innerHTML = `
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem">
                <div class="producto-nombre">${nombre}</div>
                <span style="background:${nivelCfg.bg};color:${nivelCfg.color};font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:20px;white-space:nowrap;flex-shrink:0">${nivelCfg.label}</span>
            </div>
            <p style="font-size:.75rem;font-weight:600;color:var(--muted)">${p.categoria || "Sin categoría"}</p>
            <p class="producto-precio">$${Number(p.precio).toLocaleString("es-CO")}</p>
            <p class="producto-stock">📦 Stock: <strong style="color:var(--text)">${p.stock ?? 0}</strong></p>
            <button class="btn-agregar"
                onclick='agregarAlCarrito(${JSON.stringify(p).replace(/'/g, "&#39;")})'
                ${agotado ? 'disabled style="opacity:.5;cursor:not-allowed"' : ""}>
                ${agotado ? "Sin stock" : "+ Agregar al carrito"}
            </button>`;

        contenedor.appendChild(card);
    });
}


// ══════════════════════════════════════════════════════
//  CARGAR CLIENTES
// ══════════════════════════════════════════════════════
async function cargarClientes() {
    try {
        const res = await fetch(`${API}/clientes`);
        clientes = res.ok ? await res.json() : [];
    } catch {
        clientes = [];
    }
}


// ══════════════════════════════════════════════════════
//  BUSCADOR DE CLIENTE EN TIEMPO REAL
// ══════════════════════════════════════════════════════
function iniciarBuscadorCliente() {
    const input = document.getElementById("cliente-buscar");
    const resultados = document.getElementById("cliente-resultados");
    if (!input) return;

    input.addEventListener("input", () => {
        const q = input.value.trim().toLowerCase();
        clienteSeleccionado = null;
        document.getElementById("cliente-id-hidden").value = "";
        ocultarInfoCliente();

        if (q.length < 1) { resultados.style.display = "none"; resultados.innerHTML = ""; return; }

        const filtrados = clientes.filter(c =>
            (c.nombre || "").toLowerCase().includes(q) ||
            (c.apellido || "").toLowerCase().includes(q) ||
            ((c.nombre || "") + " " + (c.apellido || "")).toLowerCase().includes(q) ||
            (c.numero_documento || "").toLowerCase().includes(q)
        );

        if (filtrados.length === 0) {
            resultados.innerHTML = `<div class="cliente-result-item" style="color:var(--muted);cursor:default">No se encontraron clientes</div>`;
        } else {
            resultados.innerHTML = filtrados.slice(0, 8).map(c => `
                <div class="cliente-result-item" onclick="seleccionarCliente(${c.id_cliente},'${(c.nombre + " " + c.apellido).replace(/'/g, "\\'")}','${c.numero_documento}','${c.telefono || ""}')">
                    <div style="font-weight:700;color:var(--text)">${c.nombre} ${c.apellido}</div>
                    <div style="font-size:.72rem;color:var(--muted)">Doc: ${c.numero_documento}${c.telefono ? " · " + c.telefono : ""}</div>
                </div>`).join("");
        }
        resultados.style.display = "block";
    });

    document.addEventListener("click", e => {
        if (!input.contains(e.target) && !resultados.contains(e.target))
            resultados.style.display = "none";
    });
}

function seleccionarCliente(id, nombre, documento, telefono) {
    clienteSeleccionado = id;
    document.getElementById("cliente-buscar").value = nombre;
    document.getElementById("cliente-id-hidden").value = id;
    document.getElementById("cliente-resultados").style.display = "none";

    const iniciales = nombre.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
    document.getElementById("cliente-avatar").textContent = iniciales;
    document.getElementById("cliente-nombre-info").textContent = nombre;
    document.getElementById("cliente-detalle-info").textContent = `${documento}${telefono ? " · " + telefono : ""}`;
    document.getElementById("clienteInfo").style.display = "flex";

    localStorage.setItem("clienteId", id);
    localStorage.setItem("cliente", nombre);
}

function ocultarInfoCliente() {
    const info = document.getElementById("clienteInfo");
    if (info) info.style.display = "none";
}


// ══════════════════════════════════════════════════════
//  AGREGAR AL CARRITO
// ══════════════════════════════════════════════════════
function agregarAlCarrito(producto) {
    let carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
    const existente = carrito.find(p => p.id_producto === producto.id_producto);

    if (existente) {
        if (existente.cantidad >= producto.stock) {
            mostrarToast(`Stock máximo alcanzado (${producto.stock} unidades)`, "warn");
            return;
        }
        existente.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    mostrarToast(`"${producto.nombre}" agregado al carrito ✓`, "ok");
    actualizarBadgeCarrito(carrito);

    // Actualizar CTA del HTML
    const total = carrito.reduce((s, p) => s + p.cantidad, 0);
    const cta = document.getElementById("cta-carrito");
    const count = document.getElementById("carrito-count-cta");
    if (cta) cta.style.display = "flex";
    if (count) count.textContent = total;
}


// ══════════════════════════════════════════════════════
//  BADGE DEL CARRITO
// ══════════════════════════════════════════════════════
function actualizarBadgeCarrito(carrito) {
    const total = carrito.reduce((s, p) => s + p.cantidad, 0);
    const badge = document.getElementById("sidebarCartCount");
    const topBadge = document.getElementById("topbar-cart-badge");
    if (badge) { badge.textContent = total; badge.style.display = total > 0 ? "inline-flex" : "none"; }
    if (topBadge) { topBadge.textContent = total; topBadge.style.display = total > 0 ? "inline-flex" : "none"; }
}

function sincronizarBadgeCarrito() {
    actualizarBadgeCarrito(JSON.parse(localStorage.getItem("carrito") || "[]"));
}


// ══════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════
function mostrarToast(msg, tipo) {
    tipo = tipo || "ok";
    const c = {
        ok: { bg: "var(--green-lt)", border: "var(--green-border)", text: "var(--green)", icon: "✓" },
        warn: { bg: "#fffbeb", border: "#fde68a", text: "#d97706", icon: "⚠" },
        error: { bg: "#fff1f2", border: "#fecdd3", text: "#e11d48", icon: "✕" }
    }[tipo] || {};

    document.getElementById("fc-toast")?.remove();
    const t = document.createElement("div");
    t.id = "fc-toast";
    t.style.cssText = `position:fixed;bottom:1.8rem;right:1.8rem;z-index:9999;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:.75rem 1.2rem;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.1);display:flex;align-items:center;gap:.6rem;max-width:320px`;
    t.innerHTML = `<span>${c.icon}</span>${msg}`;

    if (!document.getElementById("toast-style")) {
        const s = document.createElement("style"); s.id = "toast-style";
        s.textContent = `@keyframes slideToast{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse-sk{0%,100%{opacity:1}50%{opacity:.4}}`;
        document.head.appendChild(s);
    }

    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}