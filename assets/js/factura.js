// ══════════════════════════════════════════════════════
//  FRÍO CARS — factura.js  (v2 — mano_de_obra)
// ══════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {

  const productos = JSON.parse(localStorage.getItem("factura")) || [];
  const cliente = localStorage.getItem("cliente") || "Cliente General";
  const clienteId = localStorage.getItem("clienteId") || "—";
  const manoDeObra = parseFloat(localStorage.getItem("manoDeObra")) || 0;
  const subtotal = parseFloat(localStorage.getItem("subtotalFactura")) || 0;
  const iva = parseFloat(localStorage.getItem("ivaFactura")) || subtotal * 0.19;
  const total = parseFloat(localStorage.getItem("totalFactura")) || manoDeObra + subtotal + iva;
  const ventaId = localStorage.getItem("ventaId") || "0000";
  const desdeOrden = localStorage.getItem("desde_orden") || null;

  const fecha = new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  setText("ventaId", ventaId);
  setText("ventaId2", ventaId);
  setText("fechaFactura", fecha);
  setText("fechaFactura2", fecha);
  setText("clienteNombre", cliente);
  setText("clienteId", clienteId);

  const totalItems = productos.reduce((s, p) => s + p.cantidad, 0);
  setText("cantProductos", `${totalItems} ítem${totalItems !== 1 ? "s" : ""}${desdeOrden ? ` · Orden #${desdeOrden}` : ""}`);

  const fmt = v => `$${Number(v).toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
  const tbody = document.getElementById("tablaFactura");

  // Mostrar fila mano de obra si aplica
  if (manoDeObra > 0) {
    const trMO = document.createElement("tr");
    trMO.innerHTML = `
            <td style="color:#64748b;font-weight:600">—</td>
            <td style="font-weight:700">
                Mano de obra
                ${desdeOrden ? `<div style="font-size:.68rem;color:#d97706;font-weight:600">📋 Orden #${desdeOrden}</div>` : ""}
            </td>
            <td style="text-align:center">1</td>
            <td>${fmt(manoDeObra)}</td>
            <td>${fmt(manoDeObra)}</td>`;
    tbody.appendChild(trMO);
  }

  if (productos.length === 0 && manoDeObra === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#64748b">No hay productos en esta factura</td></tr>`;
  } else {
    productos.forEach((p, i) => {
      const sub = p.precio * p.cantidad;
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td style="color:#64748b;font-weight:600">${i + 1}</td>
                <td style="font-weight:700">${p.nombre}${p.desde_orden ? `<div style="font-size:.68rem;color:#d97706;font-weight:600">📋 Orden #${p.desde_orden}</div>` : ""}</td>
                <td style="text-align:center">${p.cantidad}</td>
                <td>${fmt(p.precio)}</td>
                <td>${fmt(sub)}</td>`;
      tbody.appendChild(tr);
    });
  }

  // Totales
  setText("subtotalVal", fmt(subtotal));
  setText("manoObraVal", fmt(manoDeObra));
  setText("ivaVal", fmt(iva));
  setText("totalVal", fmt(total));

  // Mostrar/ocultar fila mano de obra en totales
  const filaMO = document.getElementById("fila-mano-obra");
  if (filaMO) filaMO.style.display = manoDeObra > 0 ? "flex" : "none";
});

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }