// ══════════════════════════════════════════════════════
//  FRÍO CARS — reportes.js
//  Estadísticas de ventas, sugerencias IA, fidelidad
// ══════════════════════════════════════════════════════

const API = "https://friocars-backend.onrender.com/api";
let chartVentas   = null;
let chartProducts = null;

document.addEventListener("DOMContentLoaded", () => {
  cargarReportes();
});


// ══════════════════════════════════════════════════════
//  CARGAR TODO EN PARALELO
// ══════════════════════════════════════════════════════
async function cargarReportes() {
  try {
    const [resVentas, resProductos, resClientes, resDetalle] = await Promise.all([
      fetch(`${API}/ventas`),
      fetch(`${API}/productos`),
      fetch(`${API}/clientes`),
      fetch(`${API}/detalle_compra`).catch(() => ({ ok: false }))
    ]);

    const ventas    = resVentas.ok    ? await resVentas.json()    : [];
    const productos = resProductos.ok ? await resProductos.json() : [];
    const clientes  = resClientes.ok  ? await resClientes.json()  : [];
    const detalle   = resDetalle.ok   ? await resDetalle.json()   : [];

    calcularKPIs(ventas, clientes);
    renderChartVentas(ventas);
    renderChartProductos(detalle, productos);
    renderTablaProductos(detalle, productos);
    generarSugerencias(detalle, productos, ventas);
    renderFidelidad(ventas, clientes);

  } catch (err) {
    console.error("Error cargando reportes:", err);
  }
}


// ══════════════════════════════════════════════════════
//  KPIs
// ══════════════════════════════════════════════════════
function calcularKPIs(ventas, clientes) {
  const totalVentas  = ventas.length;
  const montoTotal   = ventas.reduce((s, v) => s + parseFloat(v.total || 0), 0);
  const promedio     = totalVentas > 0 ? montoTotal / totalVentas : 0;
  const fmt = v => `$${Number(v).toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;

  setText("kpiTotalVentas", totalVentas);
  setText("kpiTotalMonto",  fmt(montoTotal) + " en total");
  setText("kpiClientes",    clientes.length);
  setText("kpiPromedio",    fmt(promedio));
}


// ══════════════════════════════════════════════════════
//  CHART: Ventas por día
// ══════════════════════════════════════════════════════
function renderChartVentas(ventas) {
  // Agrupar por día
  const porDia = {};
  ventas.forEach(v => {
    const dia = v.fec ? new Date(v.fec).toLocaleDateString("es-CO", { day:"numeric", month:"short" }) : "—";
    porDia[dia] = (porDia[dia] || 0) + parseFloat(v.total || 0);
  });

  const labels = Object.keys(porDia).slice(-15);
  const data   = labels.map(d => porDia[d]);

  const ctx = document.getElementById("chartVentas").getContext("2d");
  if (chartVentas) chartVentas.destroy();
  chartVentas = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Ventas ($)",
        data,
        backgroundColor: "rgba(29,78,216,.7)",
        borderColor: "#1d4ed8",
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => `$${Number(v).toLocaleString("es-CO")}` } }
      }
    }
  });
}


// ══════════════════════════════════════════════════════
//  CHART: Productos más vendidos (dona)
// ══════════════════════════════════════════════════════
function renderChartProductos(detalle, productos) {
  // Agrupar por id_repuesto
  const conteo = {};
  detalle.forEach(d => {
    conteo[d.id_repuesto] = (conteo[d.id_repuesto] || 0) + (d.cantidad || 1);
  });

  const top5 = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const labels = top5.map(([id]) => {
    const p = productos.find(x => x.id_producto == id);
    return p ? p.nombre.slice(0, 20) : `Prod #${id}`;
  });
  const data = top5.map(([, cant]) => cant);
  const colors = ["#1d4ed8","#0284c7","#16a34a","#d97706","#7c3aed"];

  const ctx = document.getElementById("chartProductos").getContext("2d");
  if (chartProducts) chartProducts.destroy();

  if (data.length === 0) {
    ctx.font = "14px Plus Jakarta Sans";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.fillText("Sin datos de detalle aún", ctx.canvas.width/2, 100);
    return;
  }

  chartProducts = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 2 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } }
    }
  });
}


// ══════════════════════════════════════════════════════
//  TABLA: Productos top
// ══════════════════════════════════════════════════════
function renderTablaProductos(detalle, productos) {
  const tbody = document.getElementById("tablaProductosTop");

  // Agrupar
  const agrupado = {};
  detalle.forEach(d => {
    if (!agrupado[d.id_repuesto]) agrupado[d.id_repuesto] = { cantidad: 0, ingresos: 0 };
    agrupado[d.id_repuesto].cantidad += (d.cantidad || 1);
    agrupado[d.id_repuesto].ingresos += (d.cantidad || 1) * parseFloat(d.precio_unitario || 0);
  });

  const top = Object.entries(agrupado)
    .sort((a, b) => b[1].cantidad - a[1].cantidad)
    .slice(0, 10);

  if (top.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted)">Sin datos de ventas aún</td></tr>`;

    // Mostrar productos con su stock actual aunque no haya ventas
    const topStock = [...productos].sort((a,b) => b.stock - a.stock).slice(0,8);
    tbody.innerHTML = topStock.map((p, i) => `
      <tr>
        <td style="font-weight:700;color:var(--muted)">${i+1}</td>
        <td style="font-weight:700">${p.nombre}</td>
        <td style="color:var(--muted)">0 unidades</td>
        <td style="color:var(--muted)">$0</td>
        <td>
          <span style="font-weight:700;color:${p.stock < 5 ? '#dc2626' : p.stock < 20 ? '#d97706' : '#16a34a'}">${p.stock}</span>
        </td>
        <td><span style="font-size:.72rem;background:var(--pri-lt);color:var(--pri);padding:2px 8px;border-radius:20px;font-weight:700">Sin ventas aún</span></td>
      </tr>`).join("");
    return;
  }

  tbody.innerHTML = top.map(([id, dat], i) => {
    const p = productos.find(x => x.id_producto == id);
    const nombre = p ? p.nombre : `Producto #${id}`;
    const stock  = p ? p.stock : "—";
    const stockColor = stock < 5 ? "#dc2626" : stock < 20 ? "#d97706" : "#16a34a";

    let rec = "";
    if (stock < 5)       rec = `<span style="font-size:.72rem;background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:20px;font-weight:700">⚠ Reponer urgente</span>`;
    else if (stock < 15) rec = `<span style="font-size:.72rem;background:#fef3c7;color:#d97706;padding:2px 8px;border-radius:20px;font-weight:700">📦 Reabastecer pronto</span>`;
    else if (i < 3)      rec = `<span style="font-size:.72rem;background:var(--green-lt);color:var(--green);padding:2px 8px;border-radius:20px;font-weight:700">⭐ Producto estrella</span>`;
    else                 rec = `<span style="font-size:.72rem;background:var(--pri-lt);color:var(--pri);padding:2px 8px;border-radius:20px;font-weight:700">✓ Buen movimiento</span>`;

    return `
      <tr>
        <td style="font-weight:800;color:${i<3?"#d97706":"var(--muted)"}">${i+1}</td>
        <td style="font-weight:700">${nombre}</td>
        <td style="font-weight:700;color:var(--pri)">${dat.cantidad} uds</td>
        <td style="font-weight:700;color:var(--green)">$${Number(dat.ingresos).toLocaleString("es-CO")}</td>
        <td style="font-weight:700;color:${stockColor}">${stock}</td>
        <td>${rec}</td>
      </tr>`;
  }).join("");
}


// ══════════════════════════════════════════════════════
//  SUGERENCIAS IA
// ══════════════════════════════════════════════════════
function generarSugerencias(detalle, productos, ventas) {
  const wrap = document.getElementById("sugerenciasIA");

  const sugerencias = [];

  // 1. Productos sin stock
  const sinStock = productos.filter(p => p.stock === 0);
  if (sinStock.length > 0) {
    sugerencias.push({
      icon: "🚨",
      titulo: `${sinStock.length} producto(s) sin stock`,
      desc: `${sinStock.map(p => p.nombre).slice(0,3).join(", ")} están agotados. Reponlos pronto para no perder ventas.`,
      tag: "⚠ Urgente", tagColor: "#fee2e2", tagText: "#dc2626"
    });
  }

  // 2. Productos con stock bajo
  const stockBajo = productos.filter(p => p.stock > 0 && p.stock < 5);
  if (stockBajo.length > 0) {
    sugerencias.push({
      icon: "📦",
      titulo: `Stock bajo en ${stockBajo.length} producto(s)`,
      desc: `${stockBajo.map(p => `${p.nombre} (${p.stock} uds)`).slice(0,3).join(", ")}. Considera hacer un pedido antes de que se agoten.`,
      tag: "Reabastecimiento", tagColor: "#fef3c7", tagText: "#d97706"
    });
  }

  // 3. Productos más vendidos — mantener stock alto
  const conteo = {};
  detalle.forEach(d => { conteo[d.id_repuesto] = (conteo[d.id_repuesto] || 0) + (d.cantidad || 1); });
  const masVendido = Object.entries(conteo).sort((a,b) => b[1]-a[1])[0];
  if (masVendido) {
    const p = productos.find(x => x.id_producto == masVendido[0]);
    if (p) {
      sugerencias.push({
        icon: "⭐",
        titulo: `"${p.nombre}" es tu producto estrella`,
        desc: `Se han vendido ${masVendido[1]} unidades. Mantén siempre un stock alto de este producto para no perder ventas.`,
        tag: "Producto estrella", tagColor: "#dbeafe", tagText: "#1d4ed8"
      });
    }
  }

  // 4. Volumen de ventas
  const promDiario = ventas.length / 30;
  if (promDiario < 1) {
    sugerencias.push({
      icon: "📣",
      titulo: "Baja frecuencia de ventas",
      desc: "El promedio diario es menor a 1 venta. Considera promociones, descuentos por volumen o contactar clientes inactivos para reactivarlos.",
      tag: "Oportunidad de mejora", tagColor: "#f0fdf4", tagText: "#16a34a"
    });
  } else {
    sugerencias.push({
      icon: "🚀",
      titulo: `Buen ritmo: ${promDiario.toFixed(1)} ventas/día en promedio`,
      desc: "Tu negocio tiene un flujo constante. Aprovecha para implementar el programa de fidelidad y ofrecer beneficios a clientes frecuentes.",
      tag: "Tendencia positiva", tagColor: "#f0fdf4", tagText: "#16a34a"
    });
  }

  // 5. Diversificación
  const cats = new Set(productos.map(p => p.categoria).filter(Boolean));
  sugerencias.push({
    icon: "🏷️",
    titulo: `${cats.size} categorías en inventario`,
    desc: `Tienes productos en: ${[...cats].slice(0,4).join(", ")}. Asegúrate de que cada categoría tenga stock suficiente para cubrir la demanda.`,
    tag: "Análisis de portafolio", tagColor: "#ede9fe", tagText: "#7c3aed"
  });

  wrap.innerHTML = sugerencias.map(s => `
    <div class="sugerencia-card">
      <div class="sugerencia-icon">${s.icon}</div>
      <div>
        <div class="sugerencia-titulo">${s.titulo}</div>
        <div class="sugerencia-desc">${s.desc}</div>
        <span class="sugerencia-tag" style="background:${s.tagColor};color:${s.tagText}">${s.tag}</span>
      </div>
    </div>`).join("");
}


// ══════════════════════════════════════════════════════
//  FIDELIDAD DE CLIENTES
// ══════════════════════════════════════════════════════
function renderFidelidad(ventas, clientes) {
  const tbody = document.getElementById("tablaFidelidad");

  // Agrupar ventas por cliente (id_usuario como proxy por ahora)
  // Cuando tengas id_cliente en venta, cambia aquí
  const porCliente = {};
  ventas.forEach(v => {
    const key = v.id_usuario || "general";
    if (!porCliente[key]) porCliente[key] = { compras: 0, total: 0 };
    porCliente[key].compras++;
    porCliente[key].total += parseFloat(v.total || 0);
  });

  // Ordenar por compras
  const ranking = Object.entries(porCliente)
    .sort((a, b) => b[1].compras - a[1].compras)
    .slice(0, 10);

  if (ranking.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted)">Sin datos de compras aún</td></tr>`;
    return;
  }

  const maxCompras = ranking[0][1].compras;

  tbody.innerHTML = ranking.map(([id, dat], i) => {
    const cliente = clientes.find(c => c.id_cliente == id) || null;
    const nombre  = cliente ? `${cliente.nombre} ${cliente.apellido||""}` : `Usuario #${id}`;

    // Nivel
    let nivel = "", nivelClass = "";
    if (dat.compras >= 5)      { nivel = "🥇 Oro";    nivelClass = "rank-oro"; }
    else if (dat.compras >= 3) { nivel = "🥈 Plata";  nivelClass = "rank-plata"; }
    else if (dat.compras >= 2) { nivel = "🥉 Bronce"; nivelClass = "rank-bronce"; }
    else                       { nivel = "⭐ Nuevo";  nivelClass = "rank-nuevo"; }

    // Progreso al siguiente nivel
    const siguienteNivel = dat.compras < 2 ? 2 : dat.compras < 3 ? 3 : dat.compras < 5 ? 5 : null;
    const progreso = siguienteNivel ? Math.round((dat.compras / siguienteNivel) * 100) : 100;
    const progColor = dat.compras >= 5 ? "#d97706" : dat.compras >= 3 ? "#64748b" : "#16a34a";

    // Beneficio sugerido
    let beneficio = "";
    if (dat.compras >= 5)      beneficio = "🎁 Descuento 10%";
    else if (dat.compras >= 3) beneficio = "💳 Descuento 5%";
    else if (dat.compras >= 2) beneficio = "📱 Notificación VIP";
    else                       beneficio = "👋 Bienvenida especial";

    return `
      <tr>
        <td style="font-weight:800;color:${i<3?"#d97706":"var(--muted)"}">${i+1}</td>
        <td>
          <div style="font-weight:700;color:var(--text)">${nombre}</div>
          ${cliente?.telefono ? `<div style="font-size:.72rem;color:var(--muted)">${cliente.telefono}</div>` : ""}
        </td>
        <td style="font-weight:800;color:var(--pri)">${dat.compras}</td>
        <td style="font-weight:700;color:var(--green)">$${Number(dat.total).toLocaleString("es-CO")}</td>
        <td><span class="fidelidad-rank ${nivelClass}">${nivel}</span></td>
        <td style="min-width:120px">
          <div style="display:flex;align-items:center;gap:.5rem">
            <div class="prog-bar" style="flex:1">
              <div class="prog-fill" style="width:${progreso}%;background:${progColor}"></div>
            </div>
            <span style="font-size:.7rem;color:var(--muted);font-weight:600;white-space:nowrap">${dat.compras}${siguienteNivel ? "/"+siguienteNivel : " ★"}</span>
          </div>
        </td>
        <td><span style="font-size:.78rem;font-weight:700;color:var(--pri)">${beneficio}</span></td>
      </tr>`;
  }).join("");
}


// ══════════════════════════════════════════════════════
//  HELPER
// ══════════════════════════════════════════════════════
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }