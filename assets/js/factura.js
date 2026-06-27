// ══════════════════════════════════════════════════════
//  FRÍO CARS — factura.js  (v3 — descuento por producto, sin IVA)
// ══════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {

  const productos = JSON.parse(localStorage.getItem("factura")) || [];
  const cliente = localStorage.getItem("cliente") || "Cliente General";
  const clienteId = localStorage.getItem("clienteId") || "—";
  const manoDeObra = parseFloat(localStorage.getItem("manoDeObra")) || 0;
  const subtotalRep = parseFloat(localStorage.getItem("subtotalFactura")) || 0;
  const totalDescuentos = parseFloat(localStorage.getItem("totalDescuentos")) || 0;
  const total = parseFloat(localStorage.getItem("totalFactura")) || manoDeObra + subtotalRep;
  const ventaId = localStorage.getItem("ventaId") || "0000";
  const desdeOrden = localStorage.getItem("desde_orden") || null;

  const fecha = new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const fmt = v => `$${Number(v).toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;

  setText("ventaId", ventaId);
  setText("ventaId2", ventaId);
  setText("fechaFactura", fecha);
  setText("fechaFactura2", fecha);
  setText("clienteNombre", cliente);
  setText("clienteId", clienteId);

  const totalItems = productos.reduce((s, p) => s + p.cantidad, 0);
  setText("cantProductos", `${totalItems} ítem${totalItems !== 1 ? "s" : ""}${desdeOrden ? ` · Orden #${desdeOrden}` : ""}`);

  const tbody = document.getElementById("tablaFactura");

  // Fila mano de obra
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
            <td style="color:#64748b">—</td>
            <td>${fmt(manoDeObra)}</td>`;
    tbody.appendChild(trMO);
  }

  // Filas productos
  if (productos.length === 0 && manoDeObra === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#64748b">No hay productos en esta factura</td></tr>`;
  } else {
    productos.forEach((p, i) => {
      const bruto = p.precio * p.cantidad;
      const descuento = parseFloat(p.descuento) || 0;
      const neto = bruto - descuento;
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td style="color:#64748b;font-weight:600">${i + 1}</td>
                <td style="font-weight:700">
                    ${p.nombre}
                    ${p.desde_orden ? `<div style="font-size:.68rem;color:#d97706;font-weight:600">📋 Orden #${p.desde_orden}</div>` : ""}
                </td>
                <td style="text-align:center">${p.cantidad}</td>
                <td>${fmt(p.precio)}</td>
                <td style="color:#dc2626;font-weight:700">${descuento > 0 ? "-" + fmt(descuento) : "—"}</td>
                <td>${fmt(neto)}</td>`;
      tbody.appendChild(tr);
    });
  }

  // Totales
  setText("subtotalVal", fmt(subtotalRep));
  setText("descuentosVal", totalDescuentos > 0 ? "-" + fmt(totalDescuentos) : "—");
  setText("manoObraVal", fmt(manoDeObra));
  setText("totalVal", fmt(total));

  // Mostrar/ocultar filas opcionales
  const filaMO = document.getElementById("fila-mano-obra");
  const filaDesc = document.getElementById("fila-descuentos");
  if (filaMO) filaMO.style.display = manoDeObra > 0 ? "flex" : "none";
  if (filaDesc) filaDesc.style.display = totalDescuentos > 0 ? "flex" : "none";
});

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }